import { type Tiktoken, getEncoding } from "js-tiktoken";
import { type Encoding, ToksizeError } from "./types.js";

const encoderCache = new Map<Encoding, Tiktoken>();

/**
 * Get (and cache) a tiktoken encoder for the given encoding.
 * @param encoding Encoding name.
 * @returns Cached Tiktoken instance.
 */
function getEncoder(encoding: Encoding): Tiktoken {
	const cached = encoderCache.get(encoding);
	if (cached) return cached;
	try {
		const enc = getEncoding(encoding);
		encoderCache.set(encoding, enc);
		return enc;
	} catch (err) {
		const msg = err instanceof Error ? err.message : String(err);
		throw new ToksizeError(`Failed to load encoding "${encoding}": ${msg}`, "ENCODING_LOAD_FAILED");
	}
}

/**
 * Count tokens in the given content using the specified encoding.
 * @param content Text to tokenize.
 * @param encoding Tokenizer encoding (defaults to `cl100k_base`).
 * @returns Number of tokens.
 */
export function countTokens(content: string, encoding: Encoding = "cl100k_base"): number {
	if (content.length === 0) return 0;
	const encoder = getEncoder(encoding);
	return encoder.encode(content).length;
}

/**
 * Check whether an encoding name is supported.
 * @param name Candidate encoding name.
 */
export function isSupportedEncoding(name: string): name is Encoding {
	return name === "cl100k_base" || name === "o200k_base";
}
