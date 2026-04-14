import { greet } from "./utils.js";

export function main(): void {
	const message = greet("world");
	console.log(message);
}

export function add(a: number, b: number): number {
	return a + b;
}

export function multiply(a: number, b: number): number {
	return a * b;
}

export function subtract(a: number, b: number): number {
	return a - b;
}

export function divide(a: number, b: number): number {
	if (b === 0) throw new Error("division by zero");
	return a / b;
}

// Some filler to reach roughly 50 lines.
export const CONSTANT = 42;
export const ANOTHER = "hello";

export interface Config {
	name: string;
	count: number;
	enabled: boolean;
}

export function makeConfig(name: string, count: number): Config {
	return { name, count, enabled: true };
}

export function summarize(items: number[]): number {
	return items.reduce((acc, x) => acc + x, 0);
}

export function average(items: number[]): number {
	if (items.length === 0) return 0;
	return summarize(items) / items.length;
}

main();
