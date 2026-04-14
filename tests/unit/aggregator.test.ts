import { describe, expect, it } from "vitest";
import { buildTree, flattenFiles } from "../../src/core/aggregator.js";
import type { CountedFile } from "../../src/core/types.js";

function file(path: string, tokens: number): CountedFile {
	return { relativePath: path, absolutePath: `/abs/${path}`, sizeBytes: 100, tokens };
}

describe("aggregator", () => {
	it("builds a tree with rolled-up token counts", () => {
		const root = buildTree([file("src/a.ts", 100), file("src/b.ts", 200), file("README.md", 50)]);
		expect(root.tokens).toBe(350);
		const src = root.children.find((c) => c.name === "src");
		expect(src?.tokens).toBe(300);
	});

	it("computes percentages relative to root", () => {
		const root = buildTree([file("a.ts", 75), file("b.ts", 25)]);
		const a = root.children.find((c) => c.name === "a.ts");
		const b = root.children.find((c) => c.name === "b.ts");
		expect(a?.percentage).toBeCloseTo(75, 1);
		expect(b?.percentage).toBeCloseTo(25, 1);
	});

	it("sorts children by tokens descending", () => {
		const root = buildTree([file("small.ts", 10), file("big.ts", 900), file("medium.ts", 100)]);
		const names = root.children.map((c) => c.name);
		expect(names).toEqual(["big.ts", "medium.ts", "small.ts"]);
	});

	it("handles a single file", () => {
		const root = buildTree([file("only.ts", 42)]);
		expect(root.tokens).toBe(42);
		expect(root.children[0]?.name).toBe("only.ts");
		expect(root.children[0]?.percentage).toBe(100);
	});

	it("handles deeply nested structure", () => {
		const root = buildTree([file("a/b/c/d/e/deep.ts", 10), file("a/b/shallow.ts", 30)]);
		expect(root.tokens).toBe(40);
		const a = root.children.find((c) => c.name === "a");
		const b = a?.children.find((c) => c.name === "b");
		expect(b?.tokens).toBe(40);
	});

	it("flattens files for top-N ranking", () => {
		const root = buildTree([
			file("a.ts", 100),
			file("nested/b.ts", 300),
			file("nested/deep/c.ts", 50),
		]);
		const flat = flattenFiles(root);
		expect(flat.map((f) => f.path)).toEqual(["nested/b.ts", "a.ts", "nested/deep/c.ts"]);
	});

	it("handles zero-token files without division errors", () => {
		const root = buildTree([file("empty.ts", 0)]);
		expect(root.tokens).toBe(0);
		expect(root.children[0]?.percentage).toBe(0);
	});
});
