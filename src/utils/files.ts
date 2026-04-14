import { readFile } from "node:fs/promises";
import { open } from "node:fs/promises";

/**
 * Detect whether a file appears to be binary by reading the first N bytes
 * and checking for null bytes.
 * @param absolutePath Absolute path to the file.
 * @param sampleSize Number of bytes to sample (default 512).
 * @returns `true` if the file looks binary.
 */
export async function isBinaryFile(absolutePath: string, sampleSize = 512): Promise<boolean> {
	let handle: Awaited<ReturnType<typeof open>> | undefined;
	try {
		handle = await open(absolutePath, "r");
		const buf = Buffer.alloc(sampleSize);
		const { bytesRead } = await handle.read(buf, 0, sampleSize, 0);
		for (let i = 0; i < bytesRead; i++) {
			if (buf[i] === 0) return true;
		}
		return false;
	} catch {
		return true;
	} finally {
		await handle?.close();
	}
}

/**
 * Read a text file as UTF-8.
 * @param absolutePath Absolute path to the file.
 * @returns File contents as a string.
 */
export async function readTextFile(absolutePath: string): Promise<string> {
	return readFile(absolutePath, "utf8");
}
