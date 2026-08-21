# dsh-plugin-effort-declare

<p align="center">
  <samp>
    <a href="./README.md">中文</a> ·
    <strong>English</strong>
  </samp>
</p>

**dsh-plugin-effort-declare** is a third-party [DeepSeek Harness](https://github.com/deepseek-ai/deepseek-harness) (DSH) settings plugin: it lets you declare which reasoning levels a hand-added OpenAI-compatible model offers, so the composer Effort row shows up again.

DSH only renders that row when a model advertises reasoning capability. Official catalog models already do. Hand-declared `llm-pi-ai` routes from self-configured third-party providers usually have only an `id`, a display name, and capacity, so the Effort row disappears. This plugin adds a **Reasoning efforts** page in Settings and writes the official `reasoningEfforts` field per model, plus openai-completions `compat` (for example `thinkingFormat`) when the gateway needs a dialect. The picker and request encoding stay on DSH’s existing paths: no `llm/stream` intercept, and no replacement of the official Models page.

> **Note:** This plugin is a community-maintained project. It is not affiliated with DeepSeek, and is not officially endorsed.

## What it does

- Registers **Reasoning efforts** in settings navigation (immediately after Models).
- Edits only hand-declared `llm-pi-ai` routes whose protocol is `openai-completions` (if `api` is omitted, the schema default is used, then completions).
- Per model: multi-select canonical levels (`minimal` … `max`) and optional wire spellings (defaulting to the key).
- Off is three distinct states: not offered; offered with no parameter; offered sending `none` or a custom string.
- Three draft presets (clicking a preset **replaces** this dialect trio; it does not stack on the previous one; unknown extra `compat` keys are kept):
  - **DeepSeek compatible** — empty `off` plus identity `low` / `high` / `max`; `thinkingFormat: deepseek`, `supportsDeveloperRole: false`, and **unset** `supportsReasoningEffort`.
  - **OpenAI compatible** — `minimal` / `low` / `medium` / `high`; **unset** `thinkingFormat`, `supportsDeveloperRole`, and `supportsReasoningEffort` (default openai dialect).
  - **On/off only** — `off` + `high`; **unset** `thinkingFormat` and `supportsDeveloperRole`; set `supportsReasoningEffort: false`. The UI warns that extra selector levels are identical on the wire.
- Save uses official nested `settings.mutate` path ops: whole-array replace of that route’s `models` (unedited fields are spread) and one-level ops on `compat`.
- **Clear this model’s declaration** unsets `reasoningEfforts` (absence = default off). It does not write `false`.

## What it does not do

- Change the per-turn Effort choice, or write `agent-default-model.reasoningEffort`.
- Intercept LLM requests or invent HTTP bodies.
- Edit the official DeepSeek adapter (`llm-deepseek` / `deepseek-official`).
- Edit catalog routes: writing `models` would replace the whole catalog.
- Cover Anthropic `thinkingBudgets` or `openai-responses`.
- Prefill per-model `reasoningEfforts` in `cordis.yml` / the bundle layer (settings dict merge has no delete semantics).
- Set route-level `reasoning` to `high` (title/compaction calls that omit effort would then think).

## What's included

| Piece | Role |
| --- | --- |
| Settings page | Standalone `settings.section` (id `effort-declare`), zh/en copy, `--dsw-alias-*` tokens safe for dark theme |
| Core logic | Effort encoding, Off tri-state, three presets, route filtering, path ops matching the official Models editor |
| Bundle | `dsh.bundle` + `cordis.patch.yml` for `dsh plugin add` |
| Client bundle | `dsh.client` → `lib/client.js` for the Web UI |
| Tests | In-repo Vitest: preset dialect trio, user-layer drafts, save revision, dirty-card merge, validation, list filtering |
| Build output | `lib/` from `pnpm build` (host ESM, client CJS, `.d.ts`) |

Protocol encoding lives in `@earendil-works/pi-ai` and `@deepseek-ai/dsh-llm-pi-ai`. This plugin only writes configuration.

## Relationship to the Models page

| Page | Owns |
| --- | --- |
| Models | API keys, endpoint, protocol, model id / name / capacity |
| Reasoning efforts (this plugin) | Per-model `reasoningEfforts` and openai-completions `compat` |

The official Models editor spreads unedited row fields, so a later rename or capacity change should keep declarations this page wrote. This plugin does the same and never rebuilds a row from `id` / `name` alone.

## Repository layout

```
dsh-plugin-effort-declare/
├── README.md / README.en.md     # this document
├── LICENSE                      # MIT
├── package.json                 # package name, dsh.bundle / dsh.client, exports
├── cordis.patch.yml             # plugin row inserted on install
├── tsconfig*.json               # separate host / client programs
├── tsdown.config.ts             # host ESM + client CJS; keep @deepseek-ai/* external
├── vitest.config.ts
├── src/                         # source
│   ├── index.ts                 # host entry (v1 registers no host services)
│   ├── core/                    # pure functions covered by unit tests
│   └── client/                  # settings UI
├── tests/                       # Vitest
└── lib/                         # build artifacts (committed to ease install)
```

Each subdirectory has zh/en READMEs describing that folder.

## Install

This plugin was built against DeepSeek Harness **0.1.0-rc.8** and smoke-tested on **0.1.1-rc.1**. Use DSH **≥ 0.1.0-rc.8** and a bootable profile (usually `web`). Older versions are untested.

`dsh plugin` writes into the profile under **the current `$DSH_HOME`**. Unset, that defaults to `~/.dsh`. Deployments such as DeepSeek Harness Desktop often use a different home: export `DSH_HOME` first (PowerShell: `$env:DSH_HOME`) or the package lands in the wrong tree.

**From a local checkout (recommended):** `lib/` must already exist (this repo commits the build). On Windows, a `file:` URL with forward slashes is more reliable:

```bash
dsh plugin --profile web add file:/absolute/path/to/dsh-plugin-effort-declare
dsh --profile web --dump-config   # expect # == dsh-plugin-effort-declare
```

Then restart the DSH process that boots this profile (on Desktop, restart its backend). Open **Settings → Reasoning efforts**. Add a hand-declared `llm-pi-ai` provider on the Models page first; this page only lists editable routes.

**From GitHub:** this plugin is not published to a fixed upstream yet. Once it is:

```bash
dsh plugin --profile web add github:OWNER/dsh-plugin-effort-declare
```

A git install runs `prepare` (`tsdown`). If pnpm refuses it, add the package to that profile’s `pnpm-workspace.yaml` `allowBuilds` and `add` again. A built checkout or a `pnpm pack` tarball skips build authorization.

## Usage

1. Open a route card, or apply a preset into the visible draft.
2. Select levels per model; set wire spellings if the gateway uses different names; configure Off as its own tri-state.
3. The advanced panel (collapsed by default) exposes `thinkingFormat`, `supportsDeveloperRole`, and `supportsReasoningEffort`. v1’s checkbox can only force `supportsDeveloperRole` to `false` or omit the key; if the document already has `true`, the page warns and an unchecked box does not write `false` just to match the display.
4. Save. Client-side validation failures (Off only, empty `reasoningEfforts`) are shown on that route card and never crash apply; official schema rejections surface the Host error the same way. Wiring failures in `apply` throw — the settings nav should not silently omit this page.

Submit is disabled when settings are read-only.

## Development

```bash
pnpm install
pnpm test
pnpm typecheck
pnpm build
```

- Host and client must use separate `tsconfig` files (their Context merges cannot share one TypeScript program).
- The client bundle must not inline `@deepseek-ai/*` except platform modules in the shell’s frozen table. Collaborate through Cordis services; do not value-import the official Models page.
- Never print credentials or paste them into docs or issues.

## Maintenance and contributing

Issues and pull requests are welcome. Before sending a change:

1. Say whether it is a bugfix, UI improvement, or an alignment with a newer DSH / pi-ai schema.
2. Keep the boundary: write `llm-pi-ai` settings only — no `llm/stream` intercept, no Models-page fork, no parallel effort table.
3. Run `pnpm test`, `pnpm typecheck`, and `pnpm build`.
4. Any new model-visible input must land in a session-log-rebuildable mechanism (v1 does not inject prompt text).
5. Update zh and en READMEs together. Subdirectory READMEs describe that folder only; install and contributing stay in the root docs.

Canonical level names and `thinkingFormat` enums come from the installed `llm-pi-ai` schema / catalog. The repo keeps a fallback whitelist pinned by tests; if the schema drifts, update the tests first, then the UI.

Security: do not paste API keys or `.credentials.yaml` values into logs, screenshots, or issues.

## License

[MIT](./LICENSE) © 2026 Stardust
