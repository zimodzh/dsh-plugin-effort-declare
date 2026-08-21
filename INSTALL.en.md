# Install

<p align="center">
  <samp>
    <a href="./INSTALL.md">中文</a> ·
    <strong>English</strong>
  </samp>
</p>

Back to the [README](./README.en.md). Requires DeepSeek Harness **0.1.0-rc.8 or newer**. Do not use `npm install`; use `dsh plugin` below.

## Third-party DSH: set DSH_HOME first

`dsh plugin` installs into the **current** `DSH_HOME`. If unset, that is `.dsh` in your user folder. Third-party distributions often use a different home; point it at the home your DSH actually uses.

```bash
# Linux / macOS
export DSH_HOME=/path/to/your/dsh-home
```

```powershell
# Windows PowerShell
$env:DSH_HOME = "X:\path\to\your\dsh-home"
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

## Update

The plugin is published to npm. Updates also go through `dsh plugin` (the official CLI forwards the rest of the line to pnpm). Do not use `npm update`.

Third-party DSH still needs `DSH_HOME` set first, same as install.

Already installed from npm, upgrade to the newest version in the existing semver range:

```bash
dsh plugin --profile web update dsh-plugin-effort-declare
```

Latest release, including rewriting the dependency range:

```bash
dsh plugin --profile web add dsh-plugin-effort-declare@latest
```

Then restart DSH. Use `dsh --profile web --dump-config` to confirm the layer is still present.

Installed from GitHub: run `add` again, or pin a commit:

```bash
dsh plugin --profile web add github:zimodzh/dsh-plugin-effort-declare
```

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

Restart DSH. Open **Settings → Reasoning efforts**. Add a custom provider on the Models page first; otherwise this page has nothing to edit.

## Uninstall

```bash
dsh plugin --profile web remove dsh-plugin-effort-declare
```
