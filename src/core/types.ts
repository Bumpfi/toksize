/**
 * Supported tokenizer encodings.
 * - `cl100k_base`: GPT-4, GPT-3.5-turbo, Claude (approx)
 * - `o200k_base`: GPT-4o family
 */
export type Encoding = "cl100k_base" | "o200k_base";

/** Output format types. */
export type OutputFormat = "tree" | "json" | "csv" | "table";

/** File entry produced by the scanner before tokenization. */
export interface ScannedFile {
	/** Path relative to the scan root, using forward slashes. */
	relativePath: string;
	/** Absolute filesystem path. */
	absolutePath: string;
	/** Raw byte size. */
	sizeBytes: number;
}

/** File entry with token count attached. */
export interface CountedFile extends ScannedFile {
	/** Token count for this file. */
	tokens: number;
}

/** Tree node used by the aggregator and output formatters. */
export interface TreeNode {
	/** Node basename (e.g. "src" or "index.ts"). */
	name: string;
	/** Path relative to scan root. Empty string for root. */
	path: string;
	/** Token count (rolled up for directories). */
	tokens: number;
	/** Percent of root total (0-100). */
	percentage: number;
	/** `true` if this node is a file leaf. */
	isFile: boolean;
	/** Child nodes, sorted by token count descending. */
	children: TreeNode[];
}

/** Options that drive a scan run. */
export interface ScanOptions {
	/** Root directory to scan. */
	root: string;
	/** Tokenizer encoding. */
	encoding: Encoding;
	/** Canonical model id (if the user selected one via `--model`). */
	modelId?: string;
	/** Human-friendly model label. */
	modelLabel?: string;
	/** `true` when counts are exact for the selected model. */
	modelExact?: boolean;
	/** Max recursion depth. `Infinity` for unlimited. */
	depth: number;
	/** Allowed file extensions (without dot). Empty = all. */
	extensions: string[];
	/** Extra exclude globs stacked on top of ignore files. */
	excludes: string[];
	/** Follow symlinks while walking. */
	followSymlinks: boolean;
	/** Report what was skipped. */
	showSkipped: boolean;
}

/** Errors raised by toksize. */
export class ToksizeError extends Error {
	constructor(
		message: string,
		public readonly code: string,
	) {
		super(message);
		this.name = "ToksizeError";
	}
}
