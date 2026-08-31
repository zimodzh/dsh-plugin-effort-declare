# 安装

<p align="center">
  <samp>
    <strong>中文</strong> ·
    <a href="./INSTALL.en.md">English</a>
  </samp>
</p>

回到 [README](./README.md)。需要 DeepSeek Harness **0.1.2-alpha.2**；更早的客户端 API（含 0.1.0-rc.8）不再支持。不要使用 `npm install`，必须使用下面的 `dsh plugin` 命令。

## 第三方发行版：先设置 DSH_HOME

`dsh plugin` 会装进**当前** `DSH_HOME`。未设置时默认为用户目录下的 `.dsh`。第三方发行版的数据目录往往不是这条路径，请改为这份 DSH 实际使用的 home。

```bash
# Linux / macOS
export DSH_HOME=/path/to/your/dsh-home
```

```powershell
# Windows PowerShell
$env:DSH_HOME = "X:\path\to\your\dsh-home"
```

设置完成后再执行安装命令。配置档名称一般为 `web`。

## 从 npm 安装（推荐）

```bash
dsh plugin --profile web add dsh-plugin-effort-declare
```

可选：确认层已加载：

```bash
dsh --profile web --dump-config
```

输出中应出现 `dsh-plugin-effort-declare`。

## 更新

插件已发布到 npm。更新同样通过 `dsh plugin`（官方 CLI 将参数转给 pnpm），不要使用 `npm update`。

第三方发行版仍须先设置 `DSH_HOME`，与安装相同。

已从 npm 安装、且只需升级到现有 semver 范围内的新版本：

```bash
dsh plugin --profile web update dsh-plugin-effort-declare
```

需要最新正式版（含改写依赖范围）时：

```bash
dsh plugin --profile web add dsh-plugin-effort-declare@latest
```

然后重启 DSH。可用 `dsh --profile web --dump-config` 确认层仍在。

从 GitHub 安装的副本：再执行一次下面的命令，或使用带 commit 的规格：

```bash
dsh plugin --profile web add github:zimodzh/dsh-plugin-effort-declare
```

## 其他方式

GitHub：

```bash
dsh plugin --profile web add github:zimodzh/dsh-plugin-effort-declare
```

如果 pnpm 拒绝构建，将该包名加入此配置档 `pnpm-workspace.yaml` 的 `allowBuilds`，再执行一次 `add`。

本地文件夹（仓库中须已有 `lib/`；Windows 建议使用正斜杠）：

```bash
dsh plugin --profile web add file:/绝对路径/dsh-plugin-effort-declare
```

## 安装之后

重启 DSH。打开 **设置 → 推理档位**，按模型声明推理档位；视觉模型再勾选 **支持图片输入**。页脚为当前安装版本（例如 `0.1.5 © 2026 Stardust`）。修改 `package.json` 的 version 后须重新打包并安装才会更新页脚。请先在「模型」页添加第三方提供方，本页才会出现可编辑条目。

## 卸载

```bash
dsh plugin --profile web remove dsh-plugin-effort-declare
```
