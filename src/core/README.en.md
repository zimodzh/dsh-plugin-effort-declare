# src/core/

<p align="center">
  <samp>
    <a href="./README.md">中文</a> ·
    <strong>English</strong>
  </samp>
</p>

Domain logic for the plugin: no React, no Cordis service instances. The settings page and Vitest both depend on these pure functions, so reasoning-effort and image-input semantics can regress without booting DSH.

Canonical level names and `thinkingFormat` values follow `@deepseek-ai/dsh-llm-pi-ai` (0.1.2-alpha.2; the level set matches rc.8, and `thinkingFormat` adds `baseten`). `thinkingFormat` is pinned to the live-schema snapshot in [`tests/fixtures/pi-ai-thinking-format-union.ts`](../../tests/fixtures/pi-ai-thinking-format-union.ts); effort keys stay a locally pinned whitelist. UI choices come only from the live schema union. Writable `models[].input` modalities are `text` and `image`, matching the official schema.

## What's in this directory

| File | Role |
| --- | --- |
| [`catalog.ts`](./catalog.ts) | Canonical level order, `thinkingFormat` fallback list, request modalities (`INPUT_MODALITIES` / `IMAGE_CAPABLE_INPUT`), `llm-pi-ai` / DeepSeek constants. |
| [`efforts.ts`](./efforts.ts) | `reasoningEfforts` read/write, Off tri-state (value mode stores `trim()`), validation (empty object / Off-only / unknown keys return an error code, never throw). |
| [`input.ts`](./input.ts) | Per-model `input`: checking writes `['text', 'image']`, unchecking deletes the key; empty list / image-only / duplicates / unknown modalities return an error code. |
| [`presets.ts`](./presets.ts) | DeepSeek, OpenAI, and on/off presets; each states all three dialect keys; spread onto existing model rows and route `compat`, leaving existing `input` intact. |
| [`path-ops.ts`](./path-ops.ts) | Same one-level key diff as the official Models page; `buildSaveOps` uses `settingsPath` and only submits that route’s full `models` table and dirty `compat` keys. |
| [`drafts.ts`](./drafts.ts) | User-layer drafts, dirty aligned with pathOps, post-save revision. On refresh, latest user-layer model membership wins; unsaved overlay keys (`reasoningEfforts` and `input` independently, including a cleared key) overlay by id; `compat` is a per-key 3-way merge. Conflict only when a locally dirty field also moved in originals (revision-only bumps and sibling-card saves do not warn). |
| [`paths.ts`](./paths.ts) | Nested reads; clones of objects and model tables (non-object rows skipped). |
| [`filter.ts`](./filter.ts) | Which routes are editable: hand-declared `llm-pi-ai` + openai-completions; skip catalog and official DeepSeek. |
| [`validate.ts`](./validate.ts) | Per-row validation: `reasoningEfforts` first, then `input`. |
| [`attribution.ts`](./attribution.ts) | Settings footer line: `version © year Stardust`. Start year is 2026; end year is the UTC year at pack time, not the user’s clock when DSH starts. |

An **absent** field means default-off. Do not encode an undeclared effort as `reasoningEfforts: false` — in official semantics `false` strips reasoning from a catalog model. Do not encode “no vision” as `input: []` — the official resolver treats an empty list as absent, but a bad stamp must not be re-saved. Disabling image input must delete the key; do not write `['text']`.
