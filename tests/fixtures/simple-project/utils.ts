export function greet(name: string): string {
	return `Hello, ${name}!`;
}

export function capitalize(s: string): string {
	if (s.length === 0) return s;
	return s[0].toUpperCase() + s.slice(1);
}

export function repeat(s: string, n: number): string {
	return s.repeat(Math.max(0, n));
}

export function reverse(s: string): string {
	return s.split("").reverse().join("");
}

export function countWords(s: string): number {
	return s.trim().split(/\s+/).filter(Boolean).length;
}

export function isBlank(s: string): boolean {
	return s.trim().length === 0;
}

export function truncate(s: string, max: number): string {
	if (s.length <= max) return s;
	return `${s.slice(0, Math.max(0, max - 1))}…`;
}

export function padLeft(s: string, width: number, fill = " "): string {
	return s.length >= width ? s : fill.repeat(width - s.length) + s;
}
