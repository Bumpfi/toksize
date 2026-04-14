# toksize

> Know what's eating your context window.

[![npm version](https://img.shields.io/npm/v/toksize.svg)](https://www.npmjs.com/package/toksize)
[![License: MIT](https://img.shields.io/badge/license-MIT-blue.svg)](./LICENSE)

A CLI that scans a project directory and reports LLM tokens per file, per folder, and for the whole tree. Think `ncdu` but for tokens instead of disk.

```
toksize — 47,832 tokens (cl100k_base)

src/                          32,410 tokens (67.8%)
  components/                 18,200 tokens (38.0%)
    Dashboard.tsx              4,120 tokens ████████░░
    UserProfile.tsx            3,890 tokens ████████░░
  utils/                       8,100 tokens (16.9%)
    api.ts                     3,200 tokens ██████░░░░
  index.ts                       340 tokens █░░░░░░░░░
tests/                        12,100 tokens (25.3%)
package.json                     422 tokens █░░░░░░░░░
README.md                      2,900 tokens ██████░░░░

Top 5 largest files:
  1. src/components/Dashboard.tsx    4,120 tokens
  2. src/components/UserProfile.tsx  3,890 tokens
  3. src/utils/api.ts                3,200 tokens
  4. tests/integration/app.test.ts   3,100 tokens
  5. README.md                       2,900 tokens
```

## Install

```bash
# one-off
npx toksize

# global
npm i -g toksize
```

## Usage

```bash
# Scan current directory
toksize

# Scan a specific path
toksize ./src

# Only TypeScript files, show top 10
toksize --ext ts,tsx --top 10

# Export JSON for post-processing
toksize --format json --output report.json

# GPT-4o tokenizer
toksize --encoding o200k_base
```

## Options

| Flag | Description | Default |
|------|-------------|---------|
| `--format <fmt>` | `tree`, `json`, `csv`, or `table` | `tree` |
| `--encoding <enc>` | `cl100k_base` or `o200k_base` | `cl100k_base` |
| `--ext <list>` | Comma-separated extensions to include | *(all)* |
| `--depth <n>` | Max recursion depth | unlimited |
| `--top <n>` | Number of top files to list | `5` |
| `--exclude <pat>` | Extra ignore pattern (repeatable) | — |
| `--output <file>` | Write output to a file | stdout |
| `--follow-symlinks` | Follow symbolic links | `false` |
| `--show-skipped` | Print skipped paths to stderr | `false` |
| `--no-color` | Disable ANSI colors | auto |
| `--version` | Print version and exit | — |
| `--help` | Show help | — |

## Output formats

- **tree** — Indented directory tree with token counts, percentages, and bars. Default.
- **json** — Structured report with `encoding`, `totalTokens`, and a recursive `root` node. Pipe to `jq`.
- **csv** — One row per file: `path,tokens,percentage`.
- **table** — Flat ranked table of the largest files.

## Ignore rules

Layered, applied in order:

1. Hard-ignored: `.git/`, `node_modules/`, and any file detected as binary (first 512 bytes contain a null byte).
2. `.gitignore` at the scan root, if present.
3. `.toksizeignore` at the scan root, if present. Same syntax as `.gitignore`.
4. Any `--exclude` patterns passed on the CLI.

Use `--show-skipped` to see what was dropped.

## Encodings

| Encoding | Models |
|----------|--------|
| `cl100k_base` | GPT-4, GPT-3.5-turbo. Reasonable approximation for Claude too. |
| `o200k_base` | GPT-4o family. |

toksize does not call any API. Counts are computed locally with [`js-tiktoken`](https://github.com/dqbd/tiktoken), which ships a Wasm tokenizer — no native build step, no network.

## Programmatic API

toksize's core modules (`scanner`, `tokenizer`, `aggregator`, output formatters) are plain named exports. Proper programmatic docs are on the roadmap.

## Contributing

See [CONTRIBUTING.md](./CONTRIBUTING.md).

## License

[MIT](./LICENSE)
