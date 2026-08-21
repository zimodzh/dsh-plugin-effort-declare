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
| [`index.ts`](./index.ts) | Registers zh/en copy, CSS (`ctx.effect` insert/remove), and `settings.section` (id `effort-declare`, order 12). Subscribes in `apply` to the mirror `describe.subscribe`, `settings/document-updated` (`llm-pi-ai` only), `llm/adapters-updated`, and `connection/reset`. `locale: NS` lets the framework inject `t`; `inject` only returns `api` / `describe` / `schema` / `subscribeInvalidate`. |
| [`EffortDeclareSection.tsx`](./EffortDeclareSection.tsx) | Route cards, presets, Off tri-state, advanced protocol switches, save and cancel. |
| [`load-drafts.ts`](./load-drafts.ts) | Builds drafts from `llm.providers` + the settings mirror; drafts come from `user`, protocol classification may use `value`. `thinkingFormat` choices come only from the live schema union. |
| [`locales.ts`](./locales.ts) | Copy namespace `plugin-effort-declare`. |
| [`effort-declare.module.css`](./effort-declare.module.css) | `--dsw-alias-*` tokens only, so dark theme stays correct. |
| [`schema-ops.ts`](./schema-ops.ts) | Binds `settingsSchema` as plain callbacks (including `validate`) so the service identity is not passed into React. |

Visual language follows the official Models page, not `--ds-*` variables with light-mode fallbacks.
