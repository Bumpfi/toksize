import type { Encoding, TreeNode } from "../core/types.js";

export interface JsonReport {
	encoding: Encoding;
	totalTokens: number;
	/** Populated only when the scan was run with `--model`. */
	model?: {
		id: string;
		label: string;
		exact: boolean;
	};
	root: TreeNode;
}

export interface RenderJsonOptions {
	modelId?: string;
	modelLabel?: string;
	modelExact?: boolean;
}

/**
 * Serialize the tree and metadata to a pretty-printed JSON string.
 * @param root Aggregated root.
 * @param encoding Encoding used for counting.
 * @param opts Optional model metadata.
 * @returns Pretty JSON string.
 */
export function renderJson(
	root: TreeNode,
	encoding: Encoding,
	opts: RenderJsonOptions = {},
): string {
	const report: JsonReport = {
		encoding,
		totalTokens: root.tokens,
		root,
	};
	if (opts.modelId && opts.modelLabel !== undefined && opts.modelExact !== undefined) {
		report.model = { id: opts.modelId, label: opts.modelLabel, exact: opts.modelExact };
	}
	return JSON.stringify(report, null, 2);
}
