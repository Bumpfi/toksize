# Contributing

Thanks for considering a contribution.

## Dev setup

```bash
bun install
bun run lint
bun run typecheck
bun run test
bun run build
```

## Project layout

- `src/core/` — scanner, tokenizer, aggregator, shared types.
- `src/output/` — formatters (`tree`, `json`, `csv`, `table`).
- `src/commands/` — command orchestration.
- `src/cli.ts` — arg parsing and entrypoint.
- `tests/unit/` — unit tests against the modules.
- `tests/integration/cli.test.ts` — end-to-end against the built binary.
- `tests/fixtures/` — minimal sample projects.

## Conventions

- TypeScript strict mode, ESM only.
- No `any`, no default exports, no barrel files.
- Named exports. Plain functions over classes unless classes are actually needed.
- Keep functions small (~40 lines max).
- Public functions get JSDoc with `@param` / `@returns`.
- Errors surface as `ToksizeError`; only `cli.ts` and formatters write to stdout/stderr.
- Formatting and linting via Biome. Run `bun run lint:fix` before pushing.

## Before opening a PR

1. `bun run lint && bun run typecheck`
2. `bun run build` — integration tests depend on `dist/cli.js`.
3. `bun run test` — unit + integration must pass.
4. Update `README.md` if you changed user-facing behavior.

## Releasing

Releases are automated: push a `v*` tag and the GitHub Actions workflow publishes to npm.
