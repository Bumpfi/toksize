import { resolve } from "node:path";
import { describe, expect, it } from "vitest";
import { scanDirectory } from "../../src/core/scanner.js";
import type { ScanOptions } from "../../src/core/types.js";

const fixtures = resolve(__dirname, "..", "fixtures");

function makeOptions(root: string, overrides: Partial<ScanOptions> = {}): ScanOptions {
	return {
		root,
		encoding: "cl100k_base",
		depth: Number.POSITIVE_INFINITY,
		extensions: [],
		excludes: [],
		followSymlinks: false,
		showSkipped: false,
		...overrides,
	};
}

describe("scanner", () => {
	it("scans simple-project and finds all non-ignored files", async () => {
		const { files } = await scanDirectory(makeOptions(resolve(fixtures, "simple-project")));
		const paths = files.map((f) => f.relativePath).sort();
		expect(paths).toEqual(["README.md", "index.ts", "package.json", "utils.ts"]);
	});

	it("respects .gitignore (skips dist/)", async () => {
		const { files } = await scanDirectory(makeOptions(resolve(fixtures, "mixed-project")));
		const paths = files.map((f) => f.relativePath);
		expect(paths.some((p) => p.startsWith("dist/"))).toBe(false);
	});

	it("hard-ignores node_modules", async () => {
		const { files } = await scanDirectory(makeOptions(resolve(fixtures, "mixed-project")));
		const paths = files.map((f) => f.relativePath);
		expect(paths.some((p) => p.startsWith("node_modules/"))).toBe(false);
	});

	it("skips binary files silently", async () => {
		const { files, skipped } = await scanDirectory(makeOptions(resolve(fixtures, "mixed-project")));
		const paths = files.map((f) => f.relativePath);
		expect(paths.includes("image.png")).toBe(false);
		expect(skipped.some((s) => s.includes("image.png"))).toBe(true);
	});

	it("applies extension filter", async () => {
		const { files } = await scanDirectory(
			makeOptions(resolve(fixtures, "simple-project"), { extensions: ["ts"] }),
		);
		const paths = files.map((f) => f.relativePath).sort();
		expect(paths).toEqual(["index.ts", "utils.ts"]);
	});

	it("respects depth limit", async () => {
		const { files } = await scanDirectory(
			makeOptions(resolve(fixtures, "mixed-project"), { depth: 1 }),
		);
		for (const f of files) {
			expect(f.relativePath.split("/").length).toBe(1);
		}
	});

	it("respects CLI exclude patterns", async () => {
		const { files } = await scanDirectory(
			makeOptions(resolve(fixtures, "simple-project"), { excludes: ["*.md"] }),
		);
		const paths = files.map((f) => f.relativePath);
		expect(paths.includes("README.md")).toBe(false);
	});

	it("handles an empty project", async () => {
		const { files } = await scanDirectory(makeOptions(resolve(fixtures, "empty-project")));
		// .gitkeep is an empty dotfile — allowed
		expect(files.length).toBeLessThanOrEqual(1);
	});
});
