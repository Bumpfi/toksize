import { describe, expect, it } from "vitest";
import { buildTree } from "../../src/core/aggregator.js";
import type { CountedFile } from "../../src/core/types.js";
import { renderCsv } from "../../src/output/csv.js";
import { renderJson } from "../../src/output/json.js";
import { renderTable } from "../../src/output/table.js";
import { renderTree } from "../../src/output/tree.js";

function files(): CountedFile[] {
	return [
		{ relativePath: "src/a.ts", absolutePath: "/abs/src/a.ts", sizeBytes: 10, tokens: 100 },
		{ relativePath: "src/b.ts", absolutePath: "/abs/src/b.ts", sizeBytes: 10, tokens: 200 },
		{ relativePath: "README.md", absolutePath: "/abs/README.md", sizeBytes: 10, tokens: 50 },
	];
}

describe("output formatters", () => {
	it("tree renderer contains header, totals, and file names", () => {
		const root = buildTree(files());
		const out = renderTree(root, "cl100k_base", { useColor: false, topN: 3 });
		expect(out).toContain("toksize");
		expect(out).toContain("350 tokens");
		expect(out).toContain("src/");
		expect(out).toContain("b.ts");
		expect(out).toContain("Top 3 largest files");
	});

	it("json output is valid JSON and matches structure", () => {
		const root = buildTree(files());
		const out = renderJson(root, "cl100k_base");
		const parsed = JSON.parse(out) as { encoding: string; totalTokens: number; root: unknown };
		expect(parsed.encoding).toBe("cl100k_base");
		expect(parsed.totalTokens).toBe(350);
		expect(parsed.root).toBeDefined();
	});

	it("csv output is valid and has expected columns", () => {
		const root = buildTree(files());
		const out = renderCsv(root);
		const lines = out.trim().split("\n");
		expect(lines[0]).toBe("path,tokens,percentage");
		expect(lines.length).toBe(4);
		expect(lines[1]).toContain("src/b.ts");
		expect(lines[1]).toContain("200");
	});

	it("csv escapes paths containing commas or quotes", () => {
		const weirdFiles: CountedFile[] = [
			{
				relativePath: 'weird,name".ts',
				absolutePath: "/abs/weird",
				sizeBytes: 1,
				tokens: 10,
			},
		];
		const root = buildTree(weirdFiles);
		const out = renderCsv(root);
		expect(out).toContain('"weird,name"".ts"');
	});

	it("tree renderer shows model label and approx note", () => {
		const root = buildTree(files());
		const out = renderTree(root, "cl100k_base", {
			useColor: false,
			topN: 3,
			modelLabel: "Claude Opus 4.6",
			modelExact: false,
		});
		expect(out).toContain("Claude Opus 4.6");
		expect(out).toContain("~approx");
		expect(out).toContain("Approximate count");
	});

	it("json renderer embeds model metadata when supplied", () => {
		const root = buildTree(files());
		const out = renderJson(root, "o200k_base", {
			modelId: "gpt-4o",
			modelLabel: "GPT-4o",
			modelExact: true,
		});
		const parsed = JSON.parse(out) as {
			model?: { id: string; label: string; exact: boolean };
		};
		expect(parsed.model).toEqual({ id: "gpt-4o", label: "GPT-4o", exact: true });
	});

	it("table output is sorted by tokens descending", () => {
		const root = buildTree(files());
		const out = renderTable(root, "cl100k_base", { useColor: false, topN: 10 });
		const bIndex = out.indexOf("src/b.ts");
		const aIndex = out.indexOf("src/a.ts");
		const rIndex = out.indexOf("README.md");
		expect(bIndex).toBeGreaterThan(-1);
		expect(bIndex).toBeLessThan(aIndex);
		expect(aIndex).toBeLessThan(rIndex);
	});
});
