# src/

<p align="center">
  <samp>
    <a href="./README.md">中文</a> ·
    <strong>English</strong>
  </samp>
</p>

TypeScript sources for the plugin. The host (Node) and the browser must be separate TypeScript programs: their `Context` merges cannot share one `ts.Program`.

Install: [INSTALL.en.md](../INSTALL.en.md). Usage: root [README.en.md](../README.en.md). Contributing: [CONTRIBUTING.en.md](../CONTRIBUTING.en.md).

## What's in this directory

| Path | Role |
| --- | --- |
| [`index.ts`](./index.ts) | Host entry. Exports `name` and `apply`. v1 registers no host services or adapters; the bundle still needs this entry so `dsh plugin add` can load the package. |
| [`core/`](./core/) | UI-free pure functions: reasoning efforts, image input, presets, save ops, draft merge, route filtering, footer attribution. Shared by the client and tests; the v1 host entry does not import them (`tsconfig.host` still compiles `core` for types). |
| [`client/`](./client/) | Browser half: locale, settings page, and official `settings.mutate` against `llm-pi-ai` for `reasoningEfforts` and `input`. |
| [`css-modules.d.ts`](./css-modules.d.ts) | Types for `*.module.css` (class map plus `cssText` / `cssTagId`). |

`tsconfig.host.json` compiles host + `core`; `tsconfig.client.json` compiles `client` + `core`. Build output lives in [`lib/`](../lib/).
