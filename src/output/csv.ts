import { flattenFiles } from "../core/aggregator.js";
import type { TreeNode } from "../core/types.js";

/**
 * Escape a CSV field per RFC 4180.
 */
function escapeField(field: string): string {
	if (field.includes(",") || field.includes('"') || field.includes("\n") || field.includes("\r")) {
		return `"${field.replace(/"/g, '""')}"`;
	}
	return field;
}

/**
 * Render a CSV report with one row per file.
 * Columns: path,tokens,percentage
 * @param root Aggregated tree root.
 * @returns CSV string terminated with a trailing newline.
 */
export function renderCsv(root: TreeNode): string {
	const rows: string[] = ["path,tokens,percentage"];
	const files = flattenFiles(root);
	for (const f of files) {
		rows.push(`${escapeField(f.path)},${f.tokens},${f.percentage.toFixed(2)}`);
	}
	return `${rows.join("\n")}\n`;
}
