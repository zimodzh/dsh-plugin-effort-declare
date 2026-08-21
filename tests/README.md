# tests/

<p align="center">
  <samp>
    <strong>中文</strong> ·
    <a href="./README.en.md">English</a>
  </samp>
</p>

仓库内单元测试，覆盖 [`src/core/`](../src/core/) 的公开契约。不启动 DSH，不访问真实网关。

```bash
pnpm test
```

## 这个目录里有什么

[`effort-declare.spec.ts`](./effort-declare.spec.ts) 当前覆盖：

1. 三套预设产出的 `reasoningEfforts` / `compat`，以及 Off 三态。
2. 保存 ops：修改一个模型时 `set` 该路由完整 `models` 数组，未改行保留隐藏字段；`compat` 未变则不产生 compat op。
3. 清除声明：unset `reasoningEfforts` 后仍保留 `id` / `name`。
4. 校验：空对象、只开 Off 返回错误码且不抛。
5. 列表过滤：catalog、`deepseek-official`、非 completions 协议不可编辑。
6. `thinkingFormat` 回退列表与 llm-pi-ai 0.1.0-rc.8 一致。

新增档位键、预设或过滤规则时，请在本文件补对等断言，并同步根 README 的「不做什么」边界。
