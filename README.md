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
</p>

给自己添加的 OpenAI 兼容模型补上「推理强度」选项，对话里的 Effort 行就会出现。

> 这是社区维护的第三方插件，不是 DeepSeek 官方项目，也未获官方背书。需要 **DeepSeek Harness 0.1.0-rc.8** 及以上， **DeepSeek Harness 0.1.0-rc.8** 之前的版本没测试过，不保证可用。

## 它解决什么

在「模型」页手工加的第三方供应商，需要先声明能选哪些推理档，对话里才会出现 Effort。但通常它们不会声明。所以本插件在设置里加一页 **推理档位**：勾选这个模型能提供哪些档位。对话里怎么选、请求怎么发给接口，仍由 DSH 处理。本插件只改设置，不改密钥。

- 不会自动改你没保存过的模型
- 不会改你当前选中的档位，也不会改默认档位
- 不会替换官方「模型」页

## 功能

| 功能 | 说明 |
| --- | --- |
| 推理档位页 | 按模型勾选可选档位；网关用的名字如果不同，可以改拼写 |
| 预设 | DeepSeek 兼容、OpenAI 兼容、只开/关思考。点预设会换成那一套，不是叠加上去 |
| 和「模型」页 | 「模型」管地址、密钥和模型名单；本页只管「能选哪些推理档」 |
| 版本页脚 | 页面底部显示当前插件版本与版权年（打包时写入；打开 DSH 不会跟着日历变） |

## 安装

不要用 `npm install`。在终端执行：

```bash
dsh plugin --profile web add dsh-plugin-effort-declare
```

若使用第三方DSH，必须先设置 `DSH_HOME`，否则会装到另一份目录。步骤见 [安装说明](./INSTALL.md)。更新已安装的 npm 包：

```bash
dsh plugin --profile web update dsh-plugin-effort-declare
```

或 `add dsh-plugin-effort-declare@latest`。详见 [安装说明](./INSTALL.md) 的「更新」。

装完后重启 DSH，打开 **设置 → 推理档位**。页脚可核对装上的版本。请先在「模型」页添加过第三方提供方。GitHub、本地文件夹和卸载也在 [安装说明](./INSTALL.md)。

## 使用

1. 打开对应提供方的卡片，或先点一个预设。
2. 勾选这个模型要出现在选择器里的档位。网关名字不同就改拼写。关闭思考（Off）可以：不提供、提供但不发参数、或发送 `none` 等字符串。
3. 一般不用打开「高级」。
4. 点保存。若一个思考档都没选、或只开了 Off，错误会显示在这张卡片上。

当前设置为只读时无法保存。

## 限制

- 只对你在「模型」页**手工添加**、协议为 OpenAI Completions 的提供方生效
- 官方 DeepSeek、目录自带的模型、Anthropic 接口不在本页编辑
- 「清除本模型声明」之后，这个模型会重新没有 Effort 行
- 不会在生成标题、压缩等后台请求里偷偷打开思考

## 开发

改代码、提 PR、发布到 npm：见 [CONTRIBUTING.md](./CONTRIBUTING.md)。

## License

[MIT](./LICENSE) © 2026 Stardust
