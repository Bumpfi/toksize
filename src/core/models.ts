import type { Encoding } from "./types.js";

/** Metadata describing a model's tokenization behavior. */
export interface ModelInfo {
	/** Canonical model id. */
	id: string;
	/** Human-friendly label. */
	label: string;
	/** Provider name. */
	provider: "openai" | "anthropic" | "google" | "meta" | "mistral" | "deepseek" | "xai";
	/** Tokenizer encoding used to count (exact for OpenAI, approximation for others). */
	encoding: Encoding;
	/**
	 * `true` when counts are exact (provider uses this tokenizer natively).
	 * `false` when counts are approximated with a nearby tokenizer.
	 */
	exact: boolean;
}

/**
 * Registry of supported models. Keys are canonical ids; aliases live in {@link MODEL_ALIASES}.
 *
 * Non-OpenAI models use `cl100k_base` or `o200k_base` as a reasonable proxy.
 * Typical drift is ±10-15% depending on content.
 */
export const MODELS: Record<string, ModelInfo> = {
	// OpenAI — exact
	"gpt-4o": {
		id: "gpt-4o",
		label: "GPT-4o",
		provider: "openai",
		encoding: "o200k_base",
		exact: true,
	},
	"gpt-4o-mini": {
		id: "gpt-4o-mini",
		label: "GPT-4o mini",
		provider: "openai",
		encoding: "o200k_base",
		exact: true,
	},
	o1: { id: "o1", label: "o1", provider: "openai", encoding: "o200k_base", exact: true },
	"o1-mini": {
		id: "o1-mini",
		label: "o1 mini",
		provider: "openai",
		encoding: "o200k_base",
		exact: true,
	},
	o3: { id: "o3", label: "o3", provider: "openai", encoding: "o200k_base", exact: true },
	"o3-mini": {
		id: "o3-mini",
		label: "o3 mini",
		provider: "openai",
		encoding: "o200k_base",
		exact: true,
	},
	"gpt-4": {
		id: "gpt-4",
		label: "GPT-4",
		provider: "openai",
		encoding: "cl100k_base",
		exact: true,
	},
	"gpt-4-turbo": {
		id: "gpt-4-turbo",
		label: "GPT-4 Turbo",
		provider: "openai",
		encoding: "cl100k_base",
		exact: true,
	},
	"gpt-3.5-turbo": {
		id: "gpt-3.5-turbo",
		label: "GPT-3.5 Turbo",
		provider: "openai",
		encoding: "cl100k_base",
		exact: true,
	},
	// Anthropic — approx
	"claude-opus-4.6": {
		id: "claude-opus-4.6",
		label: "Claude Opus 4.6",
		provider: "anthropic",
		encoding: "cl100k_base",
		exact: false,
	},
	"claude-sonnet-4.5": {
		id: "claude-sonnet-4.5",
		label: "Claude Sonnet 4.5",
		provider: "anthropic",
		encoding: "cl100k_base",
		exact: false,
	},
	"claude-haiku-4": {
		id: "claude-haiku-4",
		label: "Claude Haiku 4",
		provider: "anthropic",
		encoding: "cl100k_base",
		exact: false,
	},
	"claude-3.5-sonnet": {
		id: "claude-3.5-sonnet",
		label: "Claude 3.5 Sonnet",
		provider: "anthropic",
		encoding: "cl100k_base",
		exact: false,
	},
	"claude-3-opus": {
		id: "claude-3-opus",
		label: "Claude 3 Opus",
		provider: "anthropic",
		encoding: "cl100k_base",
		exact: false,
	},
	// Google — approx
	"gemini-2.5-pro": {
		id: "gemini-2.5-pro",
		label: "Gemini 2.5 Pro",
		provider: "google",
		encoding: "o200k_base",
		exact: false,
	},
	"gemini-2.0-flash": {
		id: "gemini-2.0-flash",
		label: "Gemini 2.0 Flash",
		provider: "google",
		encoding: "o200k_base",
		exact: false,
	},
	"gemini-1.5-pro": {
		id: "gemini-1.5-pro",
		label: "Gemini 1.5 Pro",
		provider: "google",
		encoding: "o200k_base",
		exact: false,
	},
	// Meta — approx
	"llama-4": {
		id: "llama-4",
		label: "Llama 4",
		provider: "meta",
		encoding: "cl100k_base",
		exact: false,
	},
	"llama-3.3": {
		id: "llama-3.3",
		label: "Llama 3.3",
		provider: "meta",
		encoding: "cl100k_base",
		exact: false,
	},
	"llama-3.1": {
		id: "llama-3.1",
		label: "Llama 3.1",
		provider: "meta",
		encoding: "cl100k_base",
		exact: false,
	},
	// Mistral — approx
	"mistral-large": {
		id: "mistral-large",
		label: "Mistral Large",
		provider: "mistral",
		encoding: "cl100k_base",
		exact: false,
	},
	"mistral-small": {
		id: "mistral-small",
		label: "Mistral Small",
		provider: "mistral",
		encoding: "cl100k_base",
		exact: false,
	},
	// DeepSeek — approx
	"deepseek-v3": {
		id: "deepseek-v3",
		label: "DeepSeek V3",
		provider: "deepseek",
		encoding: "cl100k_base",
		exact: false,
	},
	"deepseek-r1": {
		id: "deepseek-r1",
		label: "DeepSeek R1",
		provider: "deepseek",
		encoding: "cl100k_base",
		exact: false,
	},
	// xAI — approx
	"grok-3": {
		id: "grok-3",
		label: "Grok 3",
		provider: "xai",
		encoding: "cl100k_base",
		exact: false,
	},
	"grok-2": {
		id: "grok-2",
		label: "Grok 2",
		provider: "xai",
		encoding: "cl100k_base",
		exact: false,
	},
};

/** Aliases resolve to a canonical model id in {@link MODELS}. */
export const MODEL_ALIASES: Record<string, string> = {
	// Generic aliases pointing at the latest flagship per provider
	claude: "claude-opus-4.6",
	opus: "claude-opus-4.6",
	sonnet: "claude-sonnet-4.5",
	haiku: "claude-haiku-4",
	gpt: "gpt-4o",
	"gpt-4o-latest": "gpt-4o",
	gemini: "gemini-2.5-pro",
	llama: "llama-4",
	mistral: "mistral-large",
	deepseek: "deepseek-v3",
	grok: "grok-3",
};

/**
 * Resolve a user-supplied model name to a {@link ModelInfo}.
 * Accepts canonical ids and aliases. Case-insensitive.
 *
 * @param name Model id or alias.
 * @returns ModelInfo, or `undefined` if unknown.
 */
export function resolveModel(name: string): ModelInfo | undefined {
	const key = name.trim().toLowerCase();
	const aliasTarget = MODEL_ALIASES[key];
	if (aliasTarget) return MODELS[aliasTarget];
	return MODELS[key];
}

/** Get all canonical models, sorted by provider then id. */
export function listModels(): ModelInfo[] {
	return Object.values(MODELS).sort((a, b) => {
		if (a.provider !== b.provider) return a.provider.localeCompare(b.provider);
		return a.id.localeCompare(b.id);
	});
}
