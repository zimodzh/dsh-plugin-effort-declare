# 贡献

<p align="center">
  <samp>
    <strong>中文</strong> ·
    <a href="./CONTRIBUTING.en.md">English</a>
  </samp>
</p>

回到 [README](./README.md)。欢迎 Issue 与 Pull Request。

## 边界

只写 `llm-pi-ai` 配置：

- 不要加 `llm/stream` 拦截
- 不要 fork 官方模型页
- 不要平行再存一份档位表
- 不要在 bundle 层预置 per-model `reasoningEfforts`（settings 字典合并没有删除语义）
- 不要在 Host 启动时给未声明的模型自动写入档位（字典合并删不掉，会改用户没保存过的模型）
- 不要挂 `agent/request` 给 subagent 填默认档
- 不要把路由级 `reasoning` 写成 `high`

新增任何模型可见输入，必须走会话日志可重建的机制。本插件不向模型注入提示词。

「清除声明」是删掉 `reasoningEfforts`（缺席 = 默认关闭），不要写成 `false`。

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

提交前请说明改动是修 bug、增强 UI，还是对齐新的 DSH / pi-ai schema。中英文档一起改。根 README 和 [INSTALL.md](./INSTALL.md) 面向使用者；本文件与 `src/`、`tests/` 的 README 面向改代码的人。

上游档位名与 `thinkingFormat` 枚举以 DSH 安装里 `llm-pi-ai` 的 schema / catalog 为准。`thinkingFormat` 的现场 schema 契约在 [`tests/fixtures/pi-ai-thinking-format-union.ts`](./tests/fixtures/pi-ai-thinking-format-union.ts)。升 DSH 时用 `dsh --dump-config` 或设置 describe 的 schema 更新该 fixture，再改 `src/core/catalog.ts` 与 UI。不要把 `@deepseek-ai/dsh-llm-pi-ai` 打进 client bundle。档位键仍由测试钉本地白名单；schema 漂移时应先改 fixture / 测试再改 UI。不要把这份名单当作可写入下拉选项。

## 发布到 npm

包名 `dsh-plugin-effort-declare`（未加 scope）。先 `npm login`，工作区干净后再：

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
