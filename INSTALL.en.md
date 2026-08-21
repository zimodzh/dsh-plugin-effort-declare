# Install

<p align="center">
  <samp>
    <a href="./INSTALL.md">中文</a> ·
    <strong>English</strong>
  </samp>
</p>

Back to the [README](./README.en.md). Requires DeepSeek Harness **0.1.0-rc.8 or newer**. Do not use `npm install`; use `dsh plugin` below.

## Desktop users: do this first

`dsh plugin` installs into the **current** `DSH_HOME`. If unset, that is `.dsh` in your user folder — **not** Desktop’s data directory.

PowerShell:

```powershell
$env:DSH_HOME = "$env:APPDATA\io.github.hairyf.deepseek-harness-desktop\data\dsh"
```

Set this before the install command. The profile name is usually `web`.

## From npm (recommended)

```bash
dsh plugin --profile web add dsh-plugin-effort-declare
```

Optional: confirm it is loaded:

```bash
dsh --profile web --dump-config
```

The output should mention `dsh-plugin-effort-declare`.

## Other methods

GitHub:

```bash
dsh plugin --profile web add github:zimodzh/dsh-plugin-effort-declare
```

If pnpm refuses to build, add the package name to `allowBuilds` in that profile’s `pnpm-workspace.yaml`, then `add` again.

Local folder (`lib/` must already exist; on Windows prefer forward slashes):

```bash
dsh plugin --profile web add file:/absolute/path/to/dsh-plugin-effort-declare
```

## After install

Restart DSH (on Desktop, restart its backend). Open **Settings → Reasoning efforts**. Add a custom provider on the Models page first; otherwise this page has nothing to edit.

## Uninstall

```bash
dsh plugin --profile web remove dsh-plugin-effort-declare
```
