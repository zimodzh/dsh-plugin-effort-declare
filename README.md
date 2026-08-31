# dsh-plugin-effort-declare

<p align="center">
  <samp>
    <strong>中文</strong> ·
    <a href="./README.en.md">English</a>
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

这是 [DeepSeek Harness](https://github.com/deepseek-ai/deepseek-harness)（DSH）的设置插件：为手工添加的 OpenAI 兼容模型声明推理档位与图片输入。声明之后，对话输入框才会出现 Effort 行，并允许附加图片；未声明则按纯文本模型处理。

> 社区维护的第三方 DSH 插件，并非 DeepSeek 官方项目，亦未经官方背书。要求 **DeepSeek Harness 0.1.2-alpha.2**；更早的客户端 API（含此前对接的 0.1.0-rc.8）不再支持。

## 作用

在「模型」页手工添加的第三方提供方，默认不会声明 `reasoningEfforts` 与 `input`。DeepSeek Harness 据此决定是否展示 Effort 选择器、是否接受图片附件。本插件在设置中增加 **推理档位** 页，向官方 `llm-pi-ai` 命名空间写入这两项能力。每轮选用哪一档、请求如何发往网关，仍由 Harness 处理。本插件不修改 API 密钥、端点或模型名单。

- 不改写用户尚未保存的模型
- 不改写当前或默认推理档
- 不替换官方「模型」页
- 不拦截模型流，也不替换适配器

## 功能

| 功能 | 说明 |
| --- | --- |
| 推理档位 | 按模型勾选可选档位；网关拼写不同时可改写线上名称 |
| 图片输入 | 按模型声明是否接受图片。勾选写入 `input: ['text', 'image']`；取消则删除该键，不写空列表 |
| 预设 | DeepSeek 兼容、OpenAI 兼容、仅开/关。预设替换当前协议方言，而非叠加 |
| 与「模型」页 | 「模型」页管理端点、密钥与模型名单；本页只声明推理档位与图片输入 |
| 版本页脚 | 页面底部显示打包时写入的插件版本与版权年；启动 Harness 不会更新日期 |

## 安装

不要使用 `npm install`。在终端执行：

```bash
dsh plugin --profile web add dsh-plugin-effort-declare
```

若使用第三方发行的 DeepSeek Harness，必须先设置 `DSH_HOME`，否则会装到另一目录。步骤见 [安装说明](./INSTALL.md)。更新已安装的 npm 包：

```bash
dsh plugin --profile web update dsh-plugin-effort-declare
```

或 `add dsh-plugin-effort-declare@latest`。详见 [安装说明](./INSTALL.md) 的「更新」。

安装后重启 DSH，打开 **设置 → 推理档位**。页脚可核对已安装版本。请先在「模型」页添加第三方提供方。从 GitHub、本地文件夹安装以及卸载，见 [安装说明](./INSTALL.md)。

## 使用

1. 打开对应提供方卡片，或先应用一套预设。
2. 勾选应出现在选择器中的推理档。网关名称不同时修改线上拼写。关闭思考（Off）可以：不提供、提供但不发送参数，或发送 `none` 等字符串。
3. 若该模型支持视觉，勾选 **支持图片输入**。仅在模型确实接受图片时勾选：误声明会使图片进入会话历史，随后被网关拒绝。
4. 「高级」协议选项通常可保持折叠。
5. 保存。未选择任何思考档、或只开启 Off 时，错误显示在该卡片上。只修改图片输入、不改档位，也可以保存。清除档位声明不会清除图片输入。

设置为只读时无法保存。

## 限制

- 仅适用于在「模型」页**手工添加**、协议为 OpenAI Completions 的提供方
- 官方 DeepSeek、目录自带模型、Anthropic 接口不在本页编辑
- 「清除本模型声明」只移除 `reasoningEfforts`，Effort 行随之隐藏；图片声明需单独取消勾选
- 不会为标题生成、压缩等后台请求默认打开思考
- 不会为整条路由或全部模型自动打开图片输入

## 开发

修改代码、提交 Pull Request、发布到 npm：见 [CONTRIBUTING.md](./CONTRIBUTING.md)。

## License

[MIT](./LICENSE) © 2026 Stardust
