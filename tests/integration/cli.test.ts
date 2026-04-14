import { spawn } from "node:child_process";
import { existsSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const repoRoot = resolve(__dirname, "..", "..");
const cliPath = resolve(repoRoot, "dist", "cli.js");
const fixtures = resolve(repoRoot, "tests", "fixtures");

interface RunResult {
	stdout: string;
	stderr: string;
	code: number | null;
}

function runCli(args: string[]): Promise<RunResult> {
	return new Promise((resolvePromise) => {
		const child = spawn("node", [cliPath, ...args], { cwd: repoRoot });
		let stdout = "";
		let stderr = "";
		child.stdout.on("data", (d: Buffer) => {
			stdout += d.toString();
		});
		child.stderr.on("data", (d: Buffer) => {
			stderr += d.toString();
		});
		child.on("close", (code) => {
			resolvePromise({ stdout, stderr, code });
		});
	});
}

const hasBuild = existsSync(cliPath);
const maybeDescribe = hasBuild ? describe : describe.skip;

maybeDescribe("CLI integration", () => {
	it("prints --version", async () => {
		const { stdout, code } = await runCli(["--version"]);
		expect(code).toBe(0);
		expect(stdout).toMatch(/\d+\.\d+\.\d+/);
	});

	it("prints --help", async () => {
		const { stdout, code } = await runCli(["--help"]);
		expect(code).toBe(0);
		expect(stdout).toContain("toksize");
		expect(stdout).toContain("--format");
	});

	it("scans a fixture and prints a tree", async () => {
		const { stdout, code } = await runCli([resolve(fixtures, "simple-project")]);
		expect(code).toBe(0);
		expect(stdout).toContain("toksize");
		expect(stdout).toContain("index.ts");
	});

	it("outputs valid JSON with --format json", async () => {
		const { stdout, code } = await runCli([
			resolve(fixtures, "simple-project"),
			"--format",
			"json",
		]);
		expect(code).toBe(0);
		const parsed = JSON.parse(stdout) as { totalTokens: number };
		expect(parsed.totalTokens).toBeGreaterThan(0);
	});

	it("outputs CSV with --format csv", async () => {
		const { stdout, code } = await runCli([resolve(fixtures, "simple-project"), "--format", "csv"]);
		expect(code).toBe(0);
		expect(stdout.split("\n")[0]).toBe("path,tokens,percentage");
	});

	it("exits 1 on nonexistent path", async () => {
		const { code, stderr } = await runCli([resolve(fixtures, "does-not-exist-xyz")]);
		expect(code).toBe(1);
		expect(stderr).toContain("toksize:");
	});

	it("supports --model alias", async () => {
		const { stdout, code } = await runCli([
			resolve(fixtures, "simple-project"),
			"--model",
			"claude",
		]);
		expect(code).toBe(0);
		expect(stdout).toContain("Claude");
		expect(stdout).toContain("approx");
	});

	it("shows exact label for OpenAI models", async () => {
		const { stdout, code } = await runCli([
			resolve(fixtures, "simple-project"),
			"--model",
			"gpt-4o",
		]);
		expect(code).toBe(0);
		expect(stdout).toContain("GPT-4o");
		expect(stdout).not.toContain("~approx");
	});

	it("embeds model metadata in JSON output", async () => {
		const { stdout, code } = await runCli([
			resolve(fixtures, "simple-project"),
			"--model",
			"gpt-4o",
			"--format",
			"json",
		]);
		expect(code).toBe(0);
		const parsed = JSON.parse(stdout) as { model?: { id: string; exact: boolean } };
		expect(parsed.model?.id).toBe("gpt-4o");
		expect(parsed.model?.exact).toBe(true);
	});

	it("lists models with `toksize models`", async () => {
		const { stdout, code } = await runCli(["models"]);
		expect(code).toBe(0);
		expect(stdout).toContain("gpt-4o");
		expect(stdout).toContain("claude-opus-4.6");
		expect(stdout).toContain("PROVIDER");
	});

	it("rejects an unknown model", async () => {
		const { code, stderr } = await runCli([
			resolve(fixtures, "simple-project"),
			"--model",
			"not-a-real-model",
		]);
		expect(code).toBe(1);
		expect(stderr).toContain("Unknown --model");
	});

	it("rejects an invalid format", async () => {
		const { code, stderr } = await runCli([
			resolve(fixtures, "simple-project"),
			"--format",
			"bogus",
		]);
		expect(code).toBe(1);
		expect(stderr).toContain("Invalid --format");
	});
});
