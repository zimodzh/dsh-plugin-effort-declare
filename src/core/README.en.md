# src/core/

<p align="center">
  <samp>
    <a href="./README.md">中文</a> ·
    <strong>English</strong>
  </samp>
</p>

Domain logic for the plugin: no React, no Cordis service instances. The settings page and Vitest both depend on these pure functions, so effort semantics can regress without booting DSH.

Canonical level names and `thinkingFormat` values follow `@deepseek-ai/dsh-llm-pi-ai` (0.1.0-rc.8; 0.1.1-rc.2 uses the same level set). `thinkingFormat` is pinned to the live-schema snapshot in [`tests/fixtures/pi-ai-thinking-format-union.ts`](../../tests/fixtures/pi-ai-thinking-format-union.ts); effort keys stay a locally pinned whitelist. UI choices come only from the live schema union.

## What's in this directory

| File | Role |
| --- | --- |
| [`catalog.ts`](./catalog.ts) | Canonical level order, `thinkingFormat` fallback list, `llm-pi-ai` / DeepSeek constants. |
| [`efforts.ts`](./efforts.ts) | `reasoningEfforts` read/write, Off tri-state, validation (empty object / Off-only / unknown keys return an error code, never throw). |
| [`presets.ts`](./presets.ts) | DeepSeek, OpenAI, and on/off presets; each states all three dialect keys; spread onto existing model rows and route `compat`. |
| [`path-ops.ts`](./path-ops.ts) | Same one-level key diff as the official Models page; `buildSaveOps` uses `settingsPath` and only submits that route’s full `models` table and dirty `compat` keys. |
| [`drafts.ts`](./drafts.ts) | User-layer drafts, dirty aligned with pathOps, post-save revision. On refresh, latest user-layer model membership wins; unsaved `reasoningEfforts` (including a cleared key) overlay by id; `compat` is a per-key 3-way merge. Conflict only when a locally dirty field also moved in originals (revision-only bumps and sibling-card saves do not warn). |
| [`paths.ts`](./paths.ts) | Nested reads; clones of objects and model tables (non-object rows skipped). |
| [`filter.ts`](./filter.ts) | Which routes are editable: hand-declared `llm-pi-ai` + openai-completions; skip catalog and official DeepSeek. |
| [`validate.ts`](./validate.ts) | Per-row `reasoningEfforts` validation. |

An **absent** field means default-off. Do not encode “undeclared” as `reasoningEfforts: false` — in official semantics `false` strips reasoning from a catalog model.
