# lib/types/

<p align="center">
  <samp>
    <strong>中文</strong> ·
    <a href="./README.en.md">English</a>
  </samp>
</p>

由 `tsc -b` 根据 [`src/`](../../src/) 生成的 TypeScript 声明。`package.json` 的 `"types"` 与 `exports.*.types` 指向本目录。

这些文件随构建更新，不是手写 API 文档。行为说明以源码与仓库根 README 为准。

## 这个目录里有什么

| 路径 | 对应源码 |
| --- | --- |
| [`index.d.ts`](./index.d.ts) | Host 入口 |
| [`client/`](./client/) | 浏览器半区 |
| [`core/`](./core/) | 共享纯函数 |
