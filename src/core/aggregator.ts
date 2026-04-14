import type { CountedFile, TreeNode } from "./types.js";

/**
 * Sort a tree node's children by token count descending, recursively.
 */
function sortTree(node: TreeNode): void {
	node.children.sort((a, b) => b.tokens - a.tokens);
	for (const child of node.children) sortTree(child);
}

/**
 * Roll token counts from leaves up to the root. Returns the total tokens in
 * the node's subtree (including the node itself if it is a file).
 */
function rollup(node: TreeNode): number {
	if (node.isFile) return node.tokens;
	let sum = 0;
	for (const child of node.children) sum += rollup(child);
	node.tokens = sum;
	return sum;
}

/**
 * Assign percentage values to each node relative to the root total.
 */
function assignPercentages(node: TreeNode, rootTotal: number): void {
	node.percentage = rootTotal === 0 ? 0 : (node.tokens / rootTotal) * 100;
	for (const child of node.children) assignPercentages(child, rootTotal);
}

/**
 * Find or create a directory child by name.
 */
function getOrCreateDir(parent: TreeNode, name: string, path: string): TreeNode {
	for (const child of parent.children) {
		if (child.name === name && !child.isFile) return child;
	}
	const node: TreeNode = {
		name,
		path,
		tokens: 0,
		percentage: 0,
		isFile: false,
		children: [],
	};
	parent.children.push(node);
	return node;
}

/**
 * Build a sorted, percentage-annotated tree from a flat list of counted files.
 *
 * @param files Files with token counts attached.
 * @param rootName Display name for the synthetic root node.
 * @returns Root node of the aggregation tree.
 */
export function buildTree(files: CountedFile[], rootName = "."): TreeNode {
	const root: TreeNode = {
		name: rootName,
		path: "",
		tokens: 0,
		percentage: 100,
		isFile: false,
		children: [],
	};

	for (const file of files) {
		const parts = file.relativePath.split("/").filter((p) => p.length > 0);
		if (parts.length === 0) continue;

		let cursor = root;
		for (let i = 0; i < parts.length - 1; i++) {
			const name = parts[i];
			if (name === undefined) continue;
			const path = parts.slice(0, i + 1).join("/");
			cursor = getOrCreateDir(cursor, name, path);
		}

		const leafName = parts[parts.length - 1];
		if (leafName === undefined) continue;
		cursor.children.push({
			name: leafName,
			path: file.relativePath,
			tokens: file.tokens,
			percentage: 0,
			isFile: true,
			children: [],
		});
	}

	rollup(root);
	assignPercentages(root, root.tokens);
	sortTree(root);
	return root;
}

/**
 * Flatten the tree into a list of file leaves only (for top-N rankings, etc.).
 */
export function flattenFiles(node: TreeNode): TreeNode[] {
	const out: TreeNode[] = [];
	const stack: TreeNode[] = [node];
	while (stack.length > 0) {
		const current = stack.pop();
		if (!current) continue;
		if (current.isFile) {
			out.push(current);
		} else {
			for (const child of current.children) stack.push(child);
		}
	}
	out.sort((a, b) => b.tokens - a.tokens);
	return out;
}
