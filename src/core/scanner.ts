import type { Dirent } from "node:fs";
import { readdir, stat } from "node:fs/promises";
import { join, relative, sep } from "node:path";
import ignore, { type Ignore } from "ignore";
import { HARD_IGNORES, loadIgnoreFile } from "../utils/config.js";
import { isBinaryFile } from "../utils/files.js";
import type { ScanOptions, ScannedFile } from "./types.js";

/** Result returned by the scanner. */
export interface ScanResult {
	files: ScannedFile[];
	skipped: string[];
}

interface WalkContext {
	root: string;
	matcher: Ignore;
	options: ScanOptions;
	result: ScanResult;
}

/**
 * Normalize a filesystem path to forward-slash form (posix).
 */
function toPosix(p: string): string {
	return sep === "/" ? p : p.split(sep).join("/");
}

/**
 * Build the ignore matcher from HARD_IGNORES, .gitignore, .toksizeignore,
 * and CLI excludes.
 */
async function buildMatcher(options: ScanOptions): Promise<Ignore> {
	const ig = ignore();
	ig.add(HARD_IGNORES.map((d) => `${d}/`));
	const [gitignore, toksizeignore] = await Promise.all([
		loadIgnoreFile(options.root, ".gitignore"),
		loadIgnoreFile(options.root, ".toksizeignore"),
	]);
	if (gitignore.length > 0) ig.add(gitignore);
	if (toksizeignore.length > 0) ig.add(toksizeignore);
	if (options.excludes.length > 0) ig.add(options.excludes);
	return ig;
}

/**
 * Check if a file's extension is in the allow-list. Empty list = accept all.
 */
function extensionAllowed(relPath: string, extensions: string[]): boolean {
	if (extensions.length === 0) return true;
	const dot = relPath.lastIndexOf(".");
	if (dot === -1) return false;
	const ext = relPath.slice(dot + 1).toLowerCase();
	return extensions.includes(ext);
}

async function walkDir(dirAbs: string, currentDepth: number, ctx: WalkContext): Promise<void> {
	if (currentDepth > ctx.options.depth) return;
	let entries: Dirent[];
	try {
		entries = (await readdir(dirAbs, { withFileTypes: true })) as Dirent[];
	} catch (err) {
		const msg = err instanceof Error ? err.message : String(err);
		ctx.result.skipped.push(`${toPosix(relative(ctx.root, dirAbs))} (readdir failed: ${msg})`);
		return;
	}

	for (const entry of entries) {
		const abs = join(dirAbs, entry.name);
		const rel = toPosix(relative(ctx.root, abs));
		if (rel === "") continue;

		// Resolve symlinks if the user opted in
		let isDir = entry.isDirectory();
		let isFile = entry.isFile();
		if (entry.isSymbolicLink()) {
			if (!ctx.options.followSymlinks) {
				ctx.result.skipped.push(`${rel} (symlink)`);
				continue;
			}
			try {
				const st = await stat(abs);
				isDir = st.isDirectory();
				isFile = st.isFile();
			} catch {
				ctx.result.skipped.push(`${rel} (broken symlink)`);
				continue;
			}
		}

		const testPath = isDir ? `${rel}/` : rel;
		if (ctx.matcher.ignores(testPath)) {
			ctx.result.skipped.push(rel);
			continue;
		}

		if (isDir) {
			await walkDir(abs, currentDepth + 1, ctx);
			continue;
		}
		if (!isFile) continue;

		if (!extensionAllowed(rel, ctx.options.extensions)) {
			ctx.result.skipped.push(`${rel} (extension filtered)`);
			continue;
		}

		let sizeBytes = 0;
		try {
			const st = await stat(abs);
			sizeBytes = st.size;
		} catch {
			ctx.result.skipped.push(`${rel} (stat failed)`);
			continue;
		}

		if (await isBinaryFile(abs)) {
			ctx.result.skipped.push(`${rel} (binary)`);
			continue;
		}

		ctx.result.files.push({ relativePath: rel, absolutePath: abs, sizeBytes });
	}
}

/**
 * Walk the directory tree rooted at `options.root`, applying ignore rules and
 * filters, and return the set of files eligible for tokenization.
 *
 * @param options Scan configuration.
 * @returns Files and a list of skipped paths.
 */
export async function scanDirectory(options: ScanOptions): Promise<ScanResult> {
	const matcher = await buildMatcher(options);
	const result: ScanResult = { files: [], skipped: [] };
	const ctx: WalkContext = { root: options.root, matcher, options, result };
	await walkDir(options.root, 1, ctx);
	return result;
}
