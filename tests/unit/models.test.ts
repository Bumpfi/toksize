import { describe, expect, it } from "vitest";
import { MODELS, MODEL_ALIASES, listModels, resolveModel } from "../../src/core/models.js";

describe("models registry", () => {
	it("resolves a canonical id", () => {
		const info = resolveModel("gpt-4o");
		expect(info?.id).toBe("gpt-4o");
		expect(info?.encoding).toBe("o200k_base");
		expect(info?.exact).toBe(true);
	});

	it("resolves an alias to its canonical target", () => {
		const info = resolveModel("claude");
		expect(info?.id).toBe(MODEL_ALIASES.claude);
		expect(info?.provider).toBe("anthropic");
	});

	it("is case-insensitive", () => {
		expect(resolveModel("GPT-4o")?.id).toBe("gpt-4o");
		expect(resolveModel(" Claude ")?.id).toBe(MODEL_ALIASES.claude);
	});

	it("returns undefined for unknown models", () => {
		expect(resolveModel("not-a-model")).toBeUndefined();
	});

	it("marks OpenAI models exact and others approx", () => {
		for (const m of Object.values(MODELS)) {
			if (m.provider === "openai") {
				expect(m.exact).toBe(true);
			} else {
				expect(m.exact).toBe(false);
			}
		}
	});

	it("lists models sorted by provider then id", () => {
		const list = listModels();
		for (let i = 1; i < list.length; i++) {
			const prev = list[i - 1];
			const cur = list[i];
			if (!prev || !cur) continue;
			const providerCmp = prev.provider.localeCompare(cur.provider);
			expect(providerCmp).toBeLessThanOrEqual(0);
			if (providerCmp === 0) {
				expect(prev.id.localeCompare(cur.id)).toBeLessThanOrEqual(0);
			}
		}
	});
});
