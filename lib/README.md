# lib/

<p align="center">
  <samp>
    <strong>中文</strong> ·
    <a href="./README.en.md">English</a>
  </samp>
</p>

`pnpm build`（`tsc -b && tsdown`）生成的可加载产物。独立仓把本目录纳入版本库，是为了 `dsh plugin add` 不必强制授权 git 依赖的 `prepare` 脚本。

请勿手改这里的 JavaScript；修改 [`src/`](../src/) 后重新构建。`*.tsbuildinfo` 已被 gitignore。

## 这个目录里有什么

| 路径 | 说明 |
| --- | --- |
| [`index.js`](./index.js) | Host ESM，对应 `package.json` 的 `"main"` 与 `exports["."]`。 |
| [`client.js`](./client.js) | 浏览器 CJS factory（`exports["./client"]`），由 Web shell 的 `__ModuleLoader__` 加载。 |
| [`types/`](./types/) | `tsc -b` 发出的声明文件。 |

Host 构建把 `@deepseek-ai/*` 全部 external，运行时解析 profile 里的 DSH 安装，避免插件携带第二份 harness 副本。
