# dsh-plugin-effort-declare

<p align="center">
  <samp>
    <a href="./README.md">中文</a> ·
    <strong>English</strong>
  </samp>
</p>

<p align="center">
  <a href="https://www.npmjs.com/package/dsh-plugin-effort-declare"><img alt="npm" src="https://img.shields.io/npm/v/dsh-plugin-effort-declare"></a>
  <a href="https://github.com/zimodzh/dsh-plugin-effort-declare/commits/master"><img alt="last commit" src="https://img.shields.io/github/last-commit/zimodzh/dsh-plugin-effort-declare"></a>
  <a href="https://github.com/zimodzh/dsh-plugin-effort-declare"><img alt="repo size" src="https://img.shields.io/github/repo-size/zimodzh/dsh-plugin-effort-declare"></a>
  <a href="./LICENSE"><img alt="license" src="https://img.shields.io/github/license/zimodzh/dsh-plugin-effort-declare"></a>
  <a href="https://github.com/deepseek-ai/deepseek-harness"><img alt="Agent" src="https://img.shields.io/badge/Agent-Deepseek%20Harness-000000"></a>
</p>

Add reasoning-effort options to OpenAI-compatible models you added yourself, so the Effort row shows up in the composer.

> This is a community plugin. It is not an official DeepSeek project and is not endorsed by DeepSeek. Requires DeepSeek Harness **0.1.0-rc.8 or later**.

## Why

Hand-added third-party providers on the Models page need a reasoning-level declaration before Effort appears in the composer. They usually do not declare it. This plugin therefore adds a **Reasoning efforts** page in Settings: you pick which levels a model can offer. The per-turn choice and the HTTP request still go through DSH. This plugin only writes settings, not API keys.

- Does not change models you have not saved
- Does not change the current or default effort
- Does not replace the official Models page

## Features

| Feature | What it does |
| --- | --- |
| Reasoning efforts page | Choose levels per model; change the gateway spelling if it differs |
| Presets | DeepSeek compatible, OpenAI compatible, or on/off only. A preset **replaces** that dialect; it does not stack |
| vs Models | Models owns the endpoint, keys, and model list; this page only declares which reasoning levels are offered |

## Install

Do not use `npm install`. In a terminal:

```bash
dsh plugin --profile web add dsh-plugin-effort-declare
```

If you use third-party DSH, you must set `DSH_HOME` first, or the package lands in another directory. See the [install guide](./INSTALL.en.md). To update an npm install:

```bash
dsh plugin --profile web update dsh-plugin-effort-declare
```

Or `add dsh-plugin-effort-declare@latest`. Details: [install guide](./INSTALL.en.md) **Update**.

Restart DSH, then open **Settings → Reasoning efforts**. Add a custom provider on the Models page first. GitHub, local folder, and uninstall: [install guide](./INSTALL.en.md).

## Usage

1. Open the provider card, or apply a preset first.
2. Check the levels that should appear in the picker. Change the spelling if the gateway uses different names. Off (no thinking) can be: not offered; offered without sending a parameter; or send `none` (or another string).
3. You can usually leave **Advanced** collapsed.
4. Save. If you selected no thinking level, or only Off, the error is shown on that card.

Saving is disabled when settings are read-only.

## Limits

- Only custom providers you added on Models, using the OpenAI Completions protocol
- Official DeepSeek, catalog models, and Anthropic endpoints are not edited here
- **Clear this model’s declaration** hides the Effort row again for that model
- Will not silently turn thinking on for background work such as titles or compaction

## Development

Code, pull requests, and npm publishing: [CONTRIBUTING.en.md](./CONTRIBUTING.en.md).

## License

[MIT](./LICENSE) © 2026 Stardust
