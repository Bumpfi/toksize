import { readFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import chalk from "chalk";
import { cli } from "cleye";
import { runScan } from "./commands/scan.js";
import { listModels, resolveModel } from "./core/models.js";
import { isSupportedEncoding } from "./core/tokenizer.js";
import { type Encoding, type OutputFormat, type ScanOptions, ToksizeError } from "./core/types.js";

/** Read the package version from package.json. */
async function readVersion(): Promise<string> {
	try {
		const here = dirname(fileURLToPath(import.meta.url));
		// dist/cli.js lives next to ../package.json
		const pkgPath = resolve(here, "..", "package.json");
		const raw = await readFile(pkgPath, "utf8");
		const pkg = JSON.parse(raw) as { version?: string };
		return pkg.version ?? "0.0.0";
	} catch {
		return "0.0.0";
	}
}

/** Split a comma-separated list, trimming whitespace and dropping empty entries. */
function splitList(value: string | undefined): string[] {
	if (!value) return [];
	return value
		.split(",")
		.map((s) => s.trim().replace(/^\./, "").toLowerCase())
		.filter((s) => s.length > 0);
}

/** Print the supported-model table and exit. */
function printModels(useColor: boolean): void {
	const rows = listModels();
	const widths = {
		id: Math.max(8, ...rows.map((r) => r.id.length)),
		provider: Math.max(8, ...rows.map((r) => r.provider.length)),
		encoding: Math.max(8, ...rows.map((r) => r.encoding.length)),
	};
	const header = `${"MODEL".padEnd(widths.id)}  ${"PROVIDER".padEnd(widths.provider)}  ${"ENCODING".padEnd(widths.encoding)}  ACCURACY`;
	const out: string[] = [];
	out.push(useColor ? chalk.bold(header) : header);
	out.push("-".repeat(header.length));
	for (const m of rows) {
		const accuracy = m.exact ? "exact" : "approx";
		const row = `${m.id.padEnd(widths.id)}  ${m.provider.padEnd(widths.provider)}  ${m.encoding.padEnd(widths.encoding)}  ${accuracy}`;
		out.push(useColor && !m.exact ? chalk.gray(row) : row);
	}
	out.push("");
	out.push(
		useColor
			? chalk.dim(
					"Aliases: claude, opus, sonnet, haiku, gpt, gemini, llama, mistral, deepseek, grok",
				)
			: "Aliases: claude, opus, sonnet, haiku, gpt, gemini, llama, mistral, deepseek, grok",
	);
	process.stdout.write(`${out.join("\n")}\n`);
}

/**
 * CLI entry. Parses args and runs a scan. Always exits the process.
 */
export async function main(argv: string[] = process.argv.slice(2)): Promise<void> {
	const version = await readVersion();

	// Tiny subcommand handling: `toksize models` lists supported models.
	if (argv[0] === "models") {
		printModels(process.stdout.isTTY === true);
		return;
	}

	const argv0 = cli(
		{
			name: "toksize",
			version,
			parameters: ["[path]"],
			flags: {
				format: {
					type: String,
					description: "Output format: tree | json | csv | table",
					default: "tree",
				},
				model: {
					type: String,
					description: "Target model (overrides --encoding). Run `toksize models` for the list.",
					default: "",
				},
				encoding: {
					type: String,
					description: "Tokenizer encoding: cl100k_base | o200k_base",
					default: "cl100k_base",
				},
				ext: {
					type: String,
					description: "Only include these extensions (comma-separated, e.g. ts,tsx,js)",
					default: "",
				},
				depth: {
					type: Number,
					description: "Max recursion depth",
					default: Number.POSITIVE_INFINITY,
				},
				top: {
					type: Number,
					description: "Number of top-ranked files to list",
					default: 5,
				},
				exclude: {
					type: [String],
					description: "Extra ignore patterns (repeatable)",
					default: [],
				},
				output: {
					type: String,
					description: "Write output to file instead of stdout",
					default: "",
				},
				followSymlinks: {
					type: Boolean,
					description: "Follow symbolic links",
					default: false,
				},
				showSkipped: {
					type: Boolean,
					description: "Print skipped paths to stderr",
					default: false,
				},
				noColor: {
					type: Boolean,
					description: "Disable ANSI colors",
					default: false,
				},
			},
			help: {
				description: "Know what's eating your context window. Token counter for your codebase.",
				examples: [
					"toksize",
					"toksize ./src",
					"toksize --model claude-opus-4.6",
					"toksize --model gpt-4o --top 10",
					"toksize --format json --output report.json",
					"toksize models",
				],
			},
		},
		undefined,
		argv,
	);

	const format = argv0.flags.format as OutputFormat;
	if (format !== "tree" && format !== "json" && format !== "csv" && format !== "table") {
		throw new ToksizeError(
			`Invalid --format "${format}". Use tree, json, csv, or table.`,
			"BAD_FORMAT",
		);
	}

	let encoding: Encoding;
	let modelId: string | undefined;
	let modelLabel: string | undefined;
	let modelExact: boolean | undefined;

	if (argv0.flags.model) {
		const info = resolveModel(argv0.flags.model);
		if (!info) {
			throw new ToksizeError(
				`Unknown --model "${argv0.flags.model}". Run \`toksize models\` to see the list.`,
				"BAD_MODEL",
			);
		}
		encoding = info.encoding;
		modelId = info.id;
		modelLabel = info.label;
		modelExact = info.exact;
	} else {
		const encodingName = argv0.flags.encoding;
		if (!isSupportedEncoding(encodingName)) {
			throw new ToksizeError(
				`Invalid --encoding "${encodingName}". Use cl100k_base or o200k_base.`,
				"BAD_ENCODING",
			);
		}
		encoding = encodingName;
	}

	const rawPath = argv0._.path ?? ".";
	const useColor =
		!argv0.flags.noColor && process.stdout.isTTY === true && format !== "json" && format !== "csv";

	const options: ScanOptions = {
		root: rawPath,
		encoding,
		modelId,
		modelLabel,
		modelExact,
		depth: Number.isFinite(argv0.flags.depth) ? argv0.flags.depth : Number.POSITIVE_INFINITY,
		extensions: splitList(argv0.flags.ext),
		excludes: argv0.flags.exclude,
		followSymlinks: argv0.flags.followSymlinks,
		showSkipped: argv0.flags.showSkipped,
	};

	const result = await runScan({
		options,
		format,
		top: argv0.flags.top,
		outputFile: argv0.flags.output || undefined,
		useColor,
	});

	if (!argv0.flags.output) {
		process.stdout.write(`${result.stdout}\n`);
	}

	if (options.showSkipped && result.skipped.length > 0) {
		process.stderr.write(chalk.dim(`\nSkipped ${result.skipped.length} path(s):\n`));
		for (const s of result.skipped) {
			process.stderr.write(chalk.dim(`  - ${s}\n`));
		}
	}
}

main().catch((err: unknown) => {
	if (err instanceof ToksizeError) {
		process.stderr.write(`toksize: ${err.message}\n`);
	} else if (err instanceof Error) {
		process.stderr.write(`toksize: ${err.message}\n`);
	} else {
		process.stderr.write("toksize: unknown error\n");
	}
	process.exit(1);
});
