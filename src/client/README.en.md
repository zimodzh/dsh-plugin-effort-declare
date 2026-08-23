# src/client/

<p align="center">
  <samp>
    <a href="./README.md">中文</a> ·
    <strong>English</strong>
  </samp>
</p>

Browser half: registers **Reasoning efforts** in the Web UI settings panel and writes `llm-pi-ai` through the official settings RPC.

Wiring failures in `apply` throw, same as the official Models page. Do not swallow `apply` with a blanket `try/catch`. Locale, CSS, and event subscriptions are cleaned up through `ctx.effect` on unload.

Cross-plugin work uses Cordis services only (`connection`, `settingsScope`, `settingsSchema`, `slots`, `locale`, `remote`). Do not value-import `@deepseek-ai/dsh-client-ui-settings-models`: the client bundle purity rule forbids inlining other `@deepseek-ai/*` packages except platform modules in the shell’s frozen table.

## What's in this directory

| File | Role |
| --- | --- |
| [`index.ts`](./index.ts) | Registers zh/en copy, CSS (`ctx.effect` insert/remove), and `settings.section` (id `effort-declare`, order 12). `describe.subscribe` only syncs `writable` (it fires for every namespace, including this page’s own `acceptView`). `settings/document-updated` (`llm-pi-ai` only) carries the Host revision; the section skips its own mutate echo, waits until the mirror revision has **caught up**, then `getSnapshot()` — it does not use `ensure()` as refresh. Provider directory changes come from `llm/adapters-updated`; `connection/reset` uses `ensure()` so an in-flight official `load()` is awaited. `locale: NS` lets the framework inject `t`; `inject` only returns `api` / `describe` / `schema` / `subscribeInvalidate`. |
| [`EffortDeclareSection.tsx`](./EffortDeclareSection.tsx) | Route cards, presets, Off tri-state, advanced protocol switches, save and cancel. Save is exclusive for the whole `llm-pi-ai` namespace (ref-guarded against double-click); `busy` is “Saving…” on the in-flight card, `saveLocked` disables the others. A successful write syncs `draftsRef` immediately and folds `acceptView` + `applySaveSuccess`. External `document-updated` events that arrive during save are replayed afterwards. A reload with no conflict clears that card’s conflict/error notice. Footer shows the version and copyright years frozen at pack time. |
| [`build-info.ts`](./build-info.ts) | Reads `package.json` version and UTC pack year injected by tsdown `define`, and formats the footer line. |
| [`globals.d.ts`](./globals.d.ts) | Types for `__PLUGIN_VERSION__` and `__COPYRIGHT_TO__`. |
| [`load-drafts.ts`](./load-drafts.ts) | Builds drafts from `llm.providers` + the settings mirror; drafts come from `user`, protocol classification may use `value`. `thinkingFormat` choices come only from the live schema union. First paint uses `ensure()`; refresh reads `getSnapshot()` only, with helpers that wait for the namespace revision. |
| [`locales.ts`](./locales.ts) | Copy namespace `plugin-effort-declare`. |
| [`effort-declare.module.css`](./effort-declare.module.css) | `--dsw-alias-*` tokens only, so dark theme stays correct. |
| [`schema-ops.ts`](./schema-ops.ts) | Binds `settingsSchema` as plain callbacks (including `validate`) so the service identity is not passed into React. |

Visual language follows the official Models page, not `--ds-*` variables with light-mode fallbacks.
