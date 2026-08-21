# src/

<p align="center">
  <samp>
    <strong>中文</strong> ·
    <a href="./README.en.md">English</a>
  </samp>
</p>

插件 TypeScript 源码。Host（Node）与浏览器必须分成两个 TypeScript Program：两边对 `Context` 的 merge 不能共处同一份 `ts.Program`。

安装见 [INSTALL.md](../INSTALL.md)，使用见仓库根 [README.md](../README.md)，贡献见 [CONTRIBUTING.md](../CONTRIBUTING.md)。

## 这个目录里有什么

| 路径 | 说明 |
| --- | --- |
| [`index.ts`](./index.ts) | Host 入口。导出 `name` 与 `apply`。v1 不注册 host 服务、不挂适配器；组合包仍需要这一入口才能被 `dsh plugin add` 加载。 |
| [`core/`](./core/) | 与 UI 无关的纯函数：档位、预设、保存 ops、草稿合并、路由过滤。client 与单测共用；Host 入口 v1 不引用这些函数（`tsconfig.host` 仍编译 `core` 以产出类型）。 |
| [`client/`](./client/) | 浏览器半区：locale、设置页、对 `llm-pi-ai` 的 `settings.mutate`。 |
| [`css-modules.d.ts`](./css-modules.d.ts) | `*.module.css` 模块类型（class map + `cssText` / `cssTagId`）。 |

`tsconfig.host.json` 编译 host + `core`；`tsconfig.client.json` 编译 `client` + `core`。构建产物在 [`lib/`](../lib/)。
