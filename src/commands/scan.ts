import { stat, writeFile } from "node:fs/promises";
import { basename, resolve } from "node:path";
import { buildTree } from "../core/aggregator.js";
import { scanDirectory } from "../core/scanner.js";
import { countTokens } from "../core/tokenizer.js";
import {
	type CountedFile,
	type OutputFormat,
	type ScanOptions,
	ToksizeError,
	type TreeNode,
} from "../core/types.js";
import { renderCsv } from "../output/csv.js";
import { renderJson } from "../output/json.js";
import { renderTable } from "../output/table.js";
import { renderTree } from "../output/tree.js";
import { readTextFile } from "../utils/files.js";

export interface RunScanInput {
	options: ScanOptions;
	format: OutputFormat;
	top: number;
	outputFile?: string;
	useColor: boolean;
}

export interface RunScanOutput {
	stdout: string;
	skipped: string[];
	root: TreeNode;
}

/**
 * Tokenize every scanned file. Files that fail to read are dropped and noted.
 */
async function countAll(
	files: Awaited<ReturnType<typeof scanDirectory>>["files"],
	encoding: ScanOptions["encoding"],
	skipped: string[],
): Promise<CountedFile[]> {
	const results: CountedFile[] = [];
	// Serial to keep memory predictable and avoid hammering js-tiktoken
	for (const file of files) {
		try {
			const content = await readTextFile(file.absolutePath);
			const tokens = countTokens(content, encoding);
			results.push({ ...file, tokens });
		} catch (err) {
			const msg = err instanceof Error ? err.message : String(err);
			skipped.push(`${file.relativePath} (read failed: ${msg})`);
		}
	}
	return results;
}

/**
 * Render the final report string for the chosen format.
 */
function render(root: TreeNode, input: RunScanInput): string {
	const { modelId, modelLabel, modelExact } = input.options;
	switch (input.format) {
		case "json":
			return renderJson(root, input.options.encoding, { modelId, modelLabel, modelExact });
		case "csv":
			return renderCsv(root);
		case "table":
			return renderTable(root, input.options.encoding, {
				useColor: input.useColor,
				topN: input.top,
				modelLabel,
				modelExact,
			});
		case "tree":
			return renderTree(root, input.options.encoding, {
				useColor: input.useColor,
				topN: input.top,
				modelLabel,
				modelExact,
			});
		default: {
			const exhaustive: never = input.format;
			throw new Error(`Unknown format: ${String(exhaustive)}`);
		}
	}
}

/**
 * Orchestrate a full scan: walk, tokenize, aggregate, render.
 */
export async function runScan(input: RunScanInput): Promise<RunScanOutput> {
	const absRoot = resolve(input.options.root);

	try {
		const st = await stat(absRoot);
		if (!st.isDirectory()) {
			throw new ToksizeError(`"${absRoot}" is not a directory`, "NOT_A_DIRECTORY");
		}
	} catch (err) {
		if (err instanceof ToksizeError) throw err;
		const msg = err instanceof Error ? err.message : String(err);
		throw new ToksizeError(`Cannot access "${absRoot}": ${msg}`, "PATH_NOT_FOUND");
	}

	const normalizedOptions: ScanOptions = { ...input.options, root: absRoot };

	const { files, skipped } = await scanDirectory(normalizedOptions);
	const counted = await countAll(files, normalizedOptions.encoding, skipped);
	const root = buildTree(counted, basename(absRoot) || ".");

	const stdout = render(root, { ...input, options: normalizedOptions });

	if (input.outputFile) {
		await writeFile(input.outputFile, `${stdout}\n`, "utf8");
	}

	return { stdout, skipped, root };
}
