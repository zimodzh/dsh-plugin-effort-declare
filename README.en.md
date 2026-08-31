# dsh-plugin-effort-declare

<p align="center">
  <samp>
    <a href="./README.md">中文</a> ·
    <strong>English</strong>
  </samp>
</p>

<p align="center">
  <a href="https://www.npmjs.com/package/dsh-plugin-effort-declare" target="_blank" rel="noopener noreferrer"><img alt="npm" src="https://img.shields.io/npm/v/dsh-plugin-effort-declare"></a>
  <a href="https://github.com/zimodzh/dsh-plugin-effort-declare/commits/master" target="_blank" rel="noopener noreferrer"><img alt="last commit" src="https://img.shields.io/github/last-commit/zimodzh/dsh-plugin-effort-declare"></a>
  <a href="https://github.com/zimodzh/dsh-plugin-effort-declare" target="_blank" rel="noopener noreferrer"><img alt="repo size" src="https://img.shields.io/github/repo-size/zimodzh/dsh-plugin-effort-declare"></a>
  <a href="./LICENSE" target="_blank" rel="noopener noreferrer"><img alt="license" src="https://img.shields.io/github/license/zimodzh/dsh-plugin-effort-declare"></a>
  <a href="https://github.com/deepseek-ai/deepseek-harness" target="_blank" rel="noopener noreferrer"><img alt="Agent" src="https://img.shields.io/badge/Agent-Deepseek%20Harness-000000"></a>
  <a href="https://www.dsh.so/artifact/dsh-plugin-effort-declare/" target="_blank" rel="noopener noreferrer"><img alt="dsh.so risk" src="https://www.dsh.so/badge/dsh-plugin-effort-declare.svg"></a>
  <a href="https://www.dsh.so/artifact/dsh-plugin-effort-declare/" target="_blank" rel="noopener noreferrer"><img alt="dsh.so install" src="https://www.dsh.so/badge/install/dsh-plugin-effort-declare.svg"></a>
</p>

A settings plugin for [DeepSeek Harness](https://github.com/deepseek-ai/deepseek-harness) (DSH). It declares reasoning levels and image input for hand-added OpenAI-compatible models. After a declaration, the conversation input shows the Effort row and accepts image attachments; undeclared models are treated as text-only.

> A community-maintained third-party DSH plugin. It is not an official DeepSeek project and is not endorsed by DeepSeek. Requires **DeepSeek Harness 0.1.2-alpha.2**. Earlier client APIs are no longer supported, including 0.1.0-rc.8 which this plugin previously targeted.

## Purpose

Hand-added third-party providers on the Models page typically omit `reasoningEfforts` and `input`. DeepSeek Harness uses those fields to decide whether the Effort picker appears and whether image attachments are admitted. This plugin adds a **Reasoning efforts** page in Settings and writes both capabilities into the official `llm-pi-ai` namespace. The per-turn level and the HTTP request still go through Harness. This plugin does not change API keys, endpoints, or the model list.

- Does not rewrite models the user has not saved
- Does not change the current or default effort
- Does not replace the official Models page
- Does not intercept model streams or replace adapters

## Features

| Feature | Description |
| --- | --- |
| Reasoning levels | Choose offered levels per model; override the on-the-wire spelling when the gateway differs |
| Image input | Declare whether a model accepts images. Checking writes `input: ['text', 'image']`; unchecking deletes the key and does not write an empty list |
| Presets | DeepSeek-compatible, OpenAI-compatible, or on/off only. A preset replaces the current dialect; it does not stack |
| Versus Models | Models owns the endpoint, keys, and model list; this page only declares reasoning levels and image input |
| Version footer | The page footer shows the plugin version and copyright years frozen at pack time; starting Harness does not advance the date |

## Install

Do not use `npm install`. In a terminal:

```bash
dsh plugin --profile web add dsh-plugin-effort-declare
```

If you run a third-party DeepSeek Harness distribution, set `DSH_HOME` first, or the package lands in another directory. See the [install guide](./INSTALL.en.md). To update an npm install:

```bash
dsh plugin --profile web update dsh-plugin-effort-declare
```

Or `add dsh-plugin-effort-declare@latest`. Details: [install guide](./INSTALL.en.md), **Update**.

Restart DSH, then open **Settings → Reasoning efforts**. The footer shows the installed version. Add a custom provider on the Models page first. GitHub, local folder, and uninstall: [install guide](./INSTALL.en.md).

## Usage

1. Open the provider card, or apply a preset first.
2. Check the reasoning levels that should appear in the picker. Change the on-the-wire spelling if the gateway uses different names. Off (no thinking) can be omitted, offered without sending a parameter, or sent as `none` (or another string).
3. If the model supports vision, check **Accepts image input**. Check this only when the model actually accepts images: an incorrect declaration admits the picture into session history, after which the gateway rejects the turn.
4. **Advanced** protocol options can usually stay collapsed.
5. Save. Selecting no thinking level, or Off alone, shows an error on that card. Saving image input without changing efforts is allowed. Clearing the effort declaration does not clear image input.

Saving is disabled when settings are read-only.

## Limitations

- Only custom providers added on the Models page that use the OpenAI Completions protocol
- Official DeepSeek, catalog models, and Anthropic endpoints are not edited here
- **Clear this model’s declaration** removes `reasoningEfforts` only, which hides the Effort row; uncheck image input separately to drop the vision declaration
- Does not turn thinking on by default for background work such as title generation or compaction
- Does not enable image input for an entire route or for every model automatically

## Development

Code changes, pull requests, and npm publishing: [CONTRIBUTING.en.md](./CONTRIBUTING.en.md).

## License

[MIT](./LICENSE) © 2026 Stardust
