import chalk from "chalk";
import { flattenFiles } from "../core/aggregator.js";
import type { Encoding, TreeNode } from "../core/types.js";

const BAR_WIDTH = 10;

/**
 * Format a number with thousands separators.
 */
function fmtNum(n: number): string {
	return n.toLocaleString("en-US");
}

/**
 * Format a percentage to one decimal place.
 */
function fmtPct(pct: number): string {
	return `${pct.toFixed(1)}%`;
}

/**
 * Produce a simple ASCII bar scaled to the largest sibling's token count.
 */
function bar(tokens: number, maxSibling: number): string {
	if (maxSibling <= 0) return "░".repeat(BAR_WIDTH);
	const filled = Math.max(0, Math.min(BAR_WIDTH, Math.round((tokens / maxSibling) * BAR_WIDTH)));
	return "█".repeat(filled) + "░".repeat(BAR_WIDTH - filled);
}

interface RenderOptions {
	useColor: boolean;
	topN: number;
	modelLabel?: string;
	modelExact?: boolean;
}

function renderNode(
	node: TreeNode,
	prefix: string,
	maxSibling: number,
	lines: string[],
	opts: RenderOptions,
): void {
	const label = node.isFile ? node.name : `${node.name}/`;
	const name = opts.useColor ? (node.isFile ? chalk.white(label) : chalk.cyan(label)) : label;
	const tokenStr = `${fmtNum(node.tokens)} tokens`.padStart(16);
	const tokens = opts.useColor ? chalk.yellow(tokenStr) : tokenStr;
	const pct = `(${fmtPct(node.percentage)})`.padStart(8);
	const barStr = node.isFile ? ` ${bar(node.tokens, maxSibling)}` : "";
	const barColored = opts.useColor ? chalk.gray(barStr) : barStr;
	lines.push(`${prefix}${name}  ${tokens} ${pct}${barColored}`);

	const childMax = node.children.reduce((m, c) => Math.max(m, c.tokens), 0);
	for (const child of node.children) {
		renderNode(child, `${prefix}  `, childMax, lines, opts);
	}
}

/**
 * Render the tree view for a root node.
 *
 * @param root Aggregated tree root.
 * @param encoding Encoding name (shown in the header).
 * @param opts Render options.
 * @returns Formatted multi-line string.
 */
export function renderTree(
	root: TreeNode,
	encoding: Encoding,
	opts: RenderOptions = { useColor: true, topN: 5 },
): string {
	const lines: string[] = [];
	const suffix = opts.modelLabel
		? `${opts.modelLabel}, ${encoding}${opts.modelExact ? "" : " ~approx"}`
		: encoding;
	const title = `toksize — ${fmtNum(root.tokens)} tokens (${suffix})`;
	lines.push(opts.useColor ? chalk.bold(title) : title);
	if (opts.modelLabel && opts.modelExact === false) {
		const note = "Approximate count. Non-native tokenizer; expect ±10-15% drift.";
		lines.push(opts.useColor ? chalk.dim(note) : note);
	}
	lines.push("");

	const maxSibling = root.children.reduce((m, c) => Math.max(m, c.tokens), 0);
	for (const child of root.children) {
		renderNode(child, "", maxSibling, lines, opts);
	}

	if (opts.topN > 0) {
		const top = flattenFiles(root).slice(0, opts.topN);
		if (top.length > 0) {
			lines.push("");
			lines.push(
				opts.useColor
					? chalk.bold(`Top ${top.length} largest files:`)
					: `Top ${top.length} largest files:`,
			);
			top.forEach((f, i) => {
				const idx = `${i + 1}.`.padStart(3);
				const path = opts.useColor ? chalk.white(f.path) : f.path;
				const toks = fmtNum(f.tokens).padStart(8);
				lines.push(`  ${idx} ${path}  ${toks} tokens`);
			});
		}
	}

	return lines.join("\n");
}
