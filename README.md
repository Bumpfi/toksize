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

# Target a specific model (aliases like `claude`, `gpt`, `gemini` work too)
toksize --model claude-opus-4.6
toksize --model gpt-4o

# See which models are supported
toksize models

# Only TypeScript files, show top 10
toksize --ext ts,tsx --top 10

# Export JSON for post-processing
toksize --format json --output report.json
```

## Options

| Flag | Description | Default |
|------|-------------|---------|
| `--format <fmt>` | `tree`, `json`, `csv`, or `table` | `tree` |
| `--model <id>` | Target model (overrides `--encoding`). See below. | — |
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

## Models

Pick your target with `--model`. Run `toksize models` for the full list. Aliases such as `claude`, `opus`, `sonnet`, `haiku`, `gpt`, `gemini`, `llama`, `mistral`, `deepseek`, and `grok` resolve to the latest flagship per provider.

| Provider | Models | Accuracy |
|----------|--------|----------|
| OpenAI | `gpt-4o`, `gpt-4o-mini`, `o1`, `o1-mini`, `o3`, `o3-mini`, `gpt-4`, `gpt-4-turbo`, `gpt-3.5-turbo` | Exact |
| Anthropic | `claude-opus-4.6`, `claude-sonnet-4.5`, `claude-haiku-4`, `claude-3.5-sonnet`, `claude-3-opus` | Approx (±10-15%) |
| Google | `gemini-2.5-pro`, `gemini-2.0-flash`, `gemini-1.5-pro` | Approx (±10-15%) |
| Meta | `llama-4`, `llama-3.3`, `llama-3.1` | Approx (±10-15%) |
| Mistral | `mistral-large`, `mistral-small` | Approx (±10-15%) |
| DeepSeek | `deepseek-v3`, `deepseek-r1` | Approx (±10%) |
| xAI | `grok-3`, `grok-2` | Approx (±10-15%) |

### Encodings

toksize counts locally using [`js-tiktoken`](https://github.com/dqbd/tiktoken) (Wasm, no native build, no network). Two encodings ship:

- `cl100k_base` — GPT-4 family + closest proxy for most non-OpenAI models.
- `o200k_base` — GPT-4o, o1, o3. Closer proxy for Gemini.

Non-OpenAI counts are approximations: the tokenizer is not native, so expect ±10-15% drift depending on content (code compresses better on every tokenizer than prose). Use `--model` to make that explicit in the output.

## Programmatic API

toksize's core modules (`scanner`, `tokenizer`, `aggregator`, output formatters) are plain named exports. Proper programmatic docs are on the roadmap.

## Contributing

See [CONTRIBUTING.md](./CONTRIBUTING.md).

## License

[MIT](./LICENSE)
