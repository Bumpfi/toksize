import type { Encoding, TreeNode } from "../core/types.js";

export interface JsonReport {
	encoding: Encoding;
	totalTokens: number;
	root: TreeNode;
}

/**
 * Serialize the tree and metadata to a pretty-printed JSON string.
 * @param root Aggregated root.
 * @param encoding Encoding used for counting.
 * @returns Pretty JSON string.
 */
export function renderJson(root: TreeNode, encoding: Encoding): string {
	const report: JsonReport = {
		encoding,
		totalTokens: root.tokens,
		root,
	};
	return JSON.stringify(report, null, 2);
}
