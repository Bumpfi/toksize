import { readFile } from "node:fs/promises";
import { join } from "node:path";

/** Hardcoded directories always skipped. */
export const HARD_IGNORES = [".git", "node_modules"] as const;

/**
 * Load patterns from an ignore-style file. Missing file returns an empty list.
 * Blank lines and `#` comments are dropped.
 * @param root Directory containing the ignore file.
 * @param filename Filename (e.g. `.gitignore`).
 */
export async function loadIgnoreFile(root: string, filename: string): Promise<string[]> {
	try {
		const raw = await readFile(join(root, filename), "utf8");
		return raw
			.split(/\r?\n/)
			.map((line) => line.trim())
			.filter((line) => line.length > 0 && !line.startsWith("#"));
	} catch {
		return [];
	}
}
