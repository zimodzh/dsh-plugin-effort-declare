# 贡献

<p align="center">
  <samp>
    <strong>中文</strong> ·
    <a href="./CONTRIBUTING.en.md">English</a>
  </samp>
</p>

回到 [README](./README.md)。欢迎 Issue 与 Pull Request。

## 边界

本插件只写入官方 `llm-pi-ai` 设置，不增加平行数据源，也不改 Harness 运行时路径。

- 不要拦截 `llm/stream`
- 不要 fork 官方「模型」页
- 不要平行再存一份档位表或模态表
- 不要在 bundle 层预置 per-model `reasoningEfforts` 或 `input`（settings 字典合并没有删除语义）
- 不要在 Host 启动时给未声明的模型自动写入档位或图片模态（字典合并无法删除，会改写用户尚未保存的模型）
- 不要挂 `agent/request` 为 subagent 填默认档
- 不要把路由级 `reasoning` 写成 `high`
- 不要写路由级 `defaultInput` 为整条路由打开图片（文生与图生混部时会误开）

新增任何模型可见输入，必须落在会话日志可重建的机制里。本插件不向模型注入提示词。

## 写入语义

| 操作 | 正确写法 | 禁止 |
| --- | --- | --- |
| 清除档位声明 | 删除 `reasoningEfforts`（缺席 = 默认关闭） | 写成 `false`（官方语义是从 catalog 模型剥掉推理） |
| 取消图片输入 | 删除 `input` 键 | 写成空数组或 `['text']`（空列表会被解析器当成缺席，坏戳记不应被重新保存） |
| 声明图片输入 | 写入 `input: ['text', 'image']` | 只写 `image`，或改路由级 `defaultInput` |

「清除本模型声明」只删除 `reasoningEfforts`，不修改 `input`。两套 overlay 在草稿合并中相互独立。

## 开发

```bash
pnpm install
pnpm test
pnpm typecheck
pnpm build
```

- Host 与 client 必须分 `tsconfig`（两边 Context merge 不能共一个 TypeScript Program）
- 客户端 bundle 禁止把 `@deepseek-ai/*` 打进包内（shell 冻结模块表里的平台模块除外）。跨插件协作走 Cordis 服务，不要 value-import 官方模型页
- 源码：[src/README.md](./src/README.md)；领域逻辑：[src/core/README.md](./src/core/README.md)；设置页：[src/client/README.md](./src/client/README.md)；测试：[tests/README.md](./tests/README.md)

提交前请说明改动是缺陷修复、功能增强，还是对齐新的 DSH / pi-ai schema。中英文档一并更新。根 README 与 [INSTALL.md](./INSTALL.md) 面向使用者；本文件与 `src/`、`tests/` 下的 README 面向改代码的人。

上游档位名、`thinkingFormat` 枚举与 `models[].input` 取值以 DSH 安装中 `llm-pi-ai` 的 schema / catalog 为准。`thinkingFormat` 的现场 schema 契约在 [`tests/fixtures/pi-ai-thinking-format-union.ts`](./tests/fixtures/pi-ai-thinking-format-union.ts)。升级 DSH 时用 `dsh --dump-config` 或设置 describe 的 schema 更新该 fixture，再改 `src/core/catalog.ts` 与 UI。不要把 `@deepseek-ai/dsh-llm-pi-ai` 打进 client bundle。档位键仍由测试钉本地白名单；schema 漂移时应先改 fixture / 测试再改 UI。不要把这份名单当作可写入下拉选项。

## 发布到 npm

包名 `dsh-plugin-effort-declare`（未加 scope）。先 `npm login`，工作区干净后再执行：

```bash
pnpm test && pnpm typecheck && pnpm build
pnpm pack      # 确认 tarball 含 lib/ 与 cordis.patch.yml
pnpm publish
```

页脚版本与版权结束年在 `pnpm build` 时写入 client bundle（`package.json` 的 version + 当时的 UTC 年）。先改 version 再 build / publish。不要在运行时读系统时钟。

`pnpm publish` 在 Git 有未提交改动时会失败。应先 commit（建议再 push），不要用 `--no-git-checks` 绕过。

发布后用户用 `dsh plugin --profile web update dsh-plugin-effort-declare` 或 `add dsh-plugin-effort-declare@latest` 更新。作者无需在插件里实现更新命令；官方 `dsh plugin` 会把参数转给 pnpm。

## 安全

不要在日志、截图、文档或 issue 中粘贴 API 密钥或 `.credentials.yaml` 的值。
