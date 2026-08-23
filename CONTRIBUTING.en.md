# Contributing

<p align="center">
  <samp>
    <a href="./CONTRIBUTING.md">中文</a> ·
    <strong>English</strong>
  </samp>
</p>

Back to the [README](./README.en.md). Issues and pull requests are welcome.

## Boundary

Write `llm-pi-ai` settings only:

- No `llm/stream` intercept
- No fork of the official Models page
- No parallel effort table
- No per-model `reasoningEfforts` in the bundle layer (settings dict merge has no delete semantics)
- Do not auto-write efforts onto undeclared models at Host start (dict merge cannot delete; it would mutate models the user never saved)
- Do not hook `agent/request` to fill a default effort for subagents
- Do not set route-level `reasoning` to `high`

Any new model-visible input must land in a session-log-rebuildable mechanism. This plugin does not inject prompt text.

Clearing a declaration unsets `reasoningEfforts` (absence = default off). Do not write `false`.

## Development

```bash
pnpm install
pnpm test
pnpm typecheck
pnpm build
```

- Host and client must use separate `tsconfig` files (their Context merges cannot share one TypeScript program)
- The client bundle must not inline `@deepseek-ai/*` except platform modules in the shell’s frozen table. Collaborate through Cordis services; do not value-import the official Models page
- Source: [src/README.md](./src/README.md); domain logic: [src/core/README.md](./src/core/README.md); settings UI: [src/client/README.md](./src/client/README.md); tests: [tests/README.md](./tests/README.md)

Before sending a change, say whether it is a bugfix, UI improvement, or an alignment with a newer DSH / pi-ai schema. Update zh and en docs together. The root README and [INSTALL.en.md](./INSTALL.en.md) are for users; this file and the READMEs under `src/` and `tests/` are for people changing code.

Canonical level names and `thinkingFormat` enums come from the installed `llm-pi-ai` schema / catalog. The live `thinkingFormat` schema contract is [`tests/fixtures/pi-ai-thinking-format-union.ts`](./tests/fixtures/pi-ai-thinking-format-union.ts). When upgrading DSH, refresh that fixture from `dsh --dump-config` or the settings describe schema, then update `src/core/catalog.ts` and UI copy. Do not value-import `@deepseek-ai/dsh-llm-pi-ai` into the client bundle. Effort keys stay a locally pinned whitelist; if the schema drifts, change the fixture / tests first. Do not offer that list as writable dropdown choices.

## Publishing to npm

The package name is unscoped `dsh-plugin-effort-declare`. After `npm login`, with a clean working tree:

```bash
pnpm test && pnpm typecheck && pnpm build
pnpm pack      # confirm the tarball contains lib/ and cordis.patch.yml
pnpm publish
```

`pnpm publish` fails on an unclean Git tree. Commit first (and preferably push). Do not pass `--no-git-checks`.

After publish, users update with `dsh plugin --profile web update dsh-plugin-effort-declare` or `add dsh-plugin-effort-declare@latest`. Authors do not implement an update command; official `dsh plugin` forwards the rest of the line to pnpm.

## Security

Do not paste API keys or `.credentials.yaml` values into logs, screenshots, docs, or issues.
