import chalk from "chalk";
import { flattenFiles } from "../core/aggregator.js";
import type { Encoding, TreeNode } from "../core/types.js";

function fmtNum(n: number): string {
	return n.toLocaleString("en-US");
}

interface TableOptions {
	useColor: boolean;
	topN: number;
}

/**
 * Render a ranked table of the largest files (default 20).
 *
 * @param root Aggregated tree root.
 * @param encoding Encoding name (header).
 * @param opts Options controlling color and top-N.
 */
export function renderTable(
	root: TreeNode,
	encoding: Encoding,
	opts: TableOptions = { useColor: true, topN: 20 },
): string {
	const files = flattenFiles(root);
	const limit = opts.topN > 0 ? opts.topN : files.length;
	const top = files.slice(0, limit);

	const pathWidth = Math.max(4, ...top.map((f) => f.path.length));
	const tokenWidth = Math.max(6, ...top.map((f) => fmtNum(f.tokens).length));
	const pctWidth = 6;

	const lines: string[] = [];
	const header = `toksize — ${fmtNum(root.tokens)} tokens (${encoding})`;
	lines.push(opts.useColor ? chalk.bold(header) : header);
	lines.push("");

	const titleRow = `${"PATH".padEnd(pathWidth)}  ${"TOKENS".padStart(tokenWidth)}  ${"PCT".padStart(pctWidth)}`;
	lines.push(opts.useColor ? chalk.bold(titleRow) : titleRow);
	lines.push("-".repeat(titleRow.length));

	for (const f of top) {
		const row = `${f.path.padEnd(pathWidth)}  ${fmtNum(f.tokens).padStart(tokenWidth)}  ${`${f.percentage.toFixed(1)}%`.padStart(pctWidth)}`;
		lines.push(row);
	}

	return lines.join("\n");
}
