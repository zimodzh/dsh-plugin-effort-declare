# 安装

<p align="center">
  <samp>
    <strong>中文</strong> ·
    <a href="./INSTALL.en.md">English</a>
  </samp>
</p>

回到 [README](./README.md)。需要 DeepSeek Harness **0.1.0-rc.8 或更新**。不要用 `npm install`，必须用下面的 `dsh plugin` 命令。

## Desktop 用户请先做这一步

`dsh plugin` 会装进**当前** `DSH_HOME`。没设置时默认是用户目录下的 `.dsh`，**不是** Desktop 自己的数据目录。

PowerShell：

```powershell
$env:DSH_HOME = "$env:APPDATA\io.github.hairyf.deepseek-harness-desktop\data\dsh"
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

重启 DSH（Desktop 请重启其后端）。打开 **设置 → 推理档位**。先在「模型」页添加第三方提供方，本页才会出现可编辑的条目。

## 卸载

```bash
dsh plugin --profile web remove dsh-plugin-effort-declare
```
