# tests/

<p align="center">
  <samp>
    <strong>中文</strong> ·
    <a href="./README.en.md">English</a>
  </samp>
</p>

仓库内单元测试，覆盖 [`src/core/`](../src/core/) 与 [`src/client/load-drafts.ts`](../src/client/load-drafts.ts) 的公开契约。不启动 DSH，不访问真实网关。

```bash
pnpm test
```

## 这个目录里有什么

[`effort-declare.spec.ts`](./effort-declare.spec.ts) 当前覆盖：

1. 三套预设产出的 `reasoningEfforts` / `compat`（三个方言键都被预设接管；其它未知 `compat` 键保留），以及 Off 三态。预设 spread 保留已有 `input`。
2. 保存 ops：修改一个模型时 `set` 该路由完整 `models` 数组，未改行保留隐藏字段；`compat` 未变则不产生 compat op。仅修改 `input` 也会写出 `models`。
3. 清除档位声明：unset `reasoningEfforts` 后仍保留 `id` / `name`，且不修改 `input`。
4. 图片输入：勾选写入 `['text', 'image']`，取消删除该键（不写 `[]`）；缺席与仅 `text` 视为不支持图片。
5. 校验：空对象、只开 Off、未知档位键、空 `input` / 仅 image / 重复 / 未知模态返回错误码且不抛。
6. 列表过滤：catalog、`deepseek-official`、非 completions 协议不可编辑。
7. `thinkingFormat` 由 [`fixtures/pi-ai-thinking-format-union.ts`](./fixtures/pi-ai-thinking-format-union.ts) 钉现场 schema（与 llm-pi-ai 0.1.0-rc.8 / 0.1.1-rc.2 列表相同）；schema 空时 UI 选项为空。
8. `loadDrafts` 草稿来自 `user` 不是 `value`；`cloneModels` 跳过非对象行；保存后全卡 revision；按 id 三路合并（增删模型、清除声明、只 bump revision 不误报冲突；`input` 与 `reasoningEfforts` 独立 overlay）；generation；dirty 与 pathOps 一致。刷新不走 `ensure()`；等镜像 revision 追上（快照已经更新也不挂起）；无冲突 reload 清 conflict/error notice；自己的 document-updated revision（含更旧回声）不当成别人的冲突。Off value 模式写入 trim 后的字符串。
9. `validateSaveDraft`：schema 失败则阻断 mutate；节点缺失则跳过。
10. 页脚 `formatAttribution`：同年只显示一个年份，跨年用 en dash；空版本或结束年早于 2026 会抛错。

新增档位键、图片模态规则、预设或过滤规则时，请在本文件补对等断言，并同步 [CONTRIBUTING.md](../CONTRIBUTING.md) 的边界与写入语义。
