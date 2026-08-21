# src/

<p align="center">
  <samp>
    <a href="./README.md">中文</a> ·
    <strong>English</strong>
  </samp>
</p>

TypeScript sources for the plugin. The host (Node) and the browser must be separate TypeScript programs: their `Context` merges cannot share one `ts.Program`.

Install, usage, and contributing: root [README.en.md](../README.en.md).

## What's in this directory

| Path | Role |
| --- | --- |
| [`index.ts`](./index.ts) | Host entry. Exports `apply`. v1 registers no host services or adapters; the bundle still needs this entry so `dsh plugin add` can load the package. |
| [`core/`](./core/) | UI-free pure functions: efforts, presets, save ops, route filtering. Shared by host, client, and tests. |
| [`client/`](./client/) | Browser half: locale, settings page, `settings.mutate` against `llm-pi-ai`. |
| [`css-modules.d.ts`](./css-modules.d.ts) | Types for `*.module.css`. |

`tsconfig.host.json` compiles host + `core`; `tsconfig.client.json` compiles `client` + `core`. Build output lives in [`lib/`](../lib/).
