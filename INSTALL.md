# 安装

<p align="center">
  <samp>
    <strong>中文</strong> ·
    <a href="./INSTALL.en.md">English</a>
  </samp>
</p>

回到 [README](./README.md)。需要 DeepSeek Harness **0.1.0-rc.8 或更新**。不要用 `npm install`，必须用下面的 `dsh plugin` 命令。

## 第三方 DSH：先设置 DSH_HOME

`dsh plugin` 会装进**当前** `DSH_HOME`。没设置时默认是用户目录下的 `.dsh`。第三方发行版的数据目录往往不是这条路径，需要改成你这份 DSH 实际使用的 home。

```bash
# Linux / macOS
export DSH_HOME=/path/to/your/dsh-home
```

```powershell
# Windows PowerShell
$env:DSH_HOME = "X:\path\to\your\dsh-home"
```

设好后再跑安装命令。配置档名称一般是 `web`。

## 从 npm 安装（推荐）

```bash
dsh plugin --profile web add dsh-plugin-effort-declare
```

可选：确认已经装上：

```bash
dsh --profile web --dump-config
```

输出里应出现 `dsh-plugin-effort-declare`。

## 更新

插件已发布到 npm。更新也走 `dsh plugin`（官方会把参数转给 pnpm），不要用 `npm update`。

第三方 DSH 仍须先设置 `DSH_HOME`，与安装相同。

已从 npm 安装过，升级到 semver 范围内的新版本：

```bash
dsh plugin --profile web update dsh-plugin-effort-declare
```

要最新正式版（含改依赖范围）：

```bash
dsh plugin --profile web add dsh-plugin-effort-declare@latest
```

然后重启 DSH。可用 `dsh --profile web --dump-config` 确认层还在。

从 GitHub 装的：再执行一次下面的命令，或使用带 commit 的规格：

```bash
dsh plugin --profile web add github:zimodzh/dsh-plugin-effort-declare
```

## 其他方式

GitHub：

```bash
dsh plugin --profile web add github:zimodzh/dsh-plugin-effort-declare
```

如果 pnpm 拒绝构建，把包名加进该配置档里 `pnpm-workspace.yaml` 的 `allowBuilds`，再 `add` 一次。

本地文件夹（仓库里需要已有 `lib/`；Windows 建议用正斜杠）：

```bash
dsh plugin --profile web add file:/绝对路径/dsh-plugin-effort-declare
```

## 装完之后

重启 DSH。打开 **设置 → 推理档位**。页脚是当前装上的版本（例如 `0.1.3 © 2026 Stardust`），改 `package.json` 后必须重新打包再安装才会变。先在「模型」页添加第三方提供方，本页才会出现可编辑的条目。

## 卸载

```bash
dsh plugin --profile web remove dsh-plugin-effort-declare
```
