# lib/

<p align="center">
  <samp>
    <a href="./README.md">中文</a> ·
    <strong>English</strong>
  </samp>
</p>

Loadable artifacts from `pnpm build` (`tsc -b && tsdown`). This standalone repo commits the folder so `dsh plugin add` need not authorize a git dependency `prepare` script.

Do not edit the JavaScript by hand; change [`src/`](../src/) and rebuild. `*.tsbuildinfo` is gitignored.

## What's in this directory

| Path | Role |
| --- | --- |
| [`index.js`](./index.js) | Host ESM, `package.json` `"main"` and `exports["."]`. |
| [`client.js`](./client.js) | Browser CJS factory (`exports["./client"]`) loaded by the Web shell `__ModuleLoader__`. |
| [`types/`](./types/) | Declarations emitted by `tsc -b`. |

The host build keeps every `@deepseek-ai/*` import external so runtime resolves the DSH copy in the profile, and the plugin never ships a second harness instance.
