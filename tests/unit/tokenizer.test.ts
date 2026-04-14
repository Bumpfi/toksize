import { describe, expect, it } from "vitest";
import { countTokens, isSupportedEncoding } from "../../src/core/tokenizer.js";

describe("tokenizer", () => {
	it("returns 0 tokens for an empty string", () => {
		expect(countTokens("")).toBe(0);
	});

	it("counts tokens for a known string with cl100k_base", () => {
		// "hello world" is 2 tokens in cl100k_base.
		expect(countTokens("hello world", "cl100k_base")).toBe(2);
	});

	it("counts tokens for a known string with o200k_base", () => {
		expect(countTokens("hello world", "o200k_base")).toBe(2);
	});

	it("counts unicode content", () => {
		const n = countTokens("héllo 🦖 世界", "cl100k_base");
		expect(n).toBeGreaterThan(0);
	});

	it("handles long strings proportionally", () => {
		const small = countTokens("abc def ghi jkl mno", "cl100k_base");
		const big = countTokens("abc def ghi jkl mno".repeat(100), "cl100k_base");
		expect(big).toBeGreaterThan(small * 50);
	});

	it("validates supported encodings", () => {
		expect(isSupportedEncoding("cl100k_base")).toBe(true);
		expect(isSupportedEncoding("o200k_base")).toBe(true);
		expect(isSupportedEncoding("bogus")).toBe(false);
	});

	it("reuses cached encoder instance across calls (no throw on repeat)", () => {
		for (let i = 0; i < 5; i++) {
			expect(countTokens("sample", "cl100k_base")).toBeGreaterThan(0);
		}
	});
});
