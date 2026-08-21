# tests/

<p align="center">
  <samp>
    <a href="./README.md">中文</a> ·
    <strong>English</strong>
  </samp>
</p>

In-repo unit tests for the public contracts in [`src/core/`](../src/core/). They do not boot DSH and do not call a live gateway.

```bash
pnpm test
```

## What's in this directory

[`effort-declare.spec.ts`](./effort-declare.spec.ts) currently covers:

1. `reasoningEfforts` / `compat` from the three presets, including Off tri-state.
2. Save ops: changing one model `set`s that route’s full `models` array; hidden fields on unedited rows survive; unchanged `compat` emits no compat op.
3. Clear: unsetting `reasoningEfforts` keeps `id` / `name`.
4. Validation: empty object and Off-only return an error code without throwing.
5. List filter: catalog, `deepseek-official`, and non-completions protocols are not editable.
6. `thinkingFormat` fallback list matches llm-pi-ai 0.1.0-rc.8.

When you add a level, preset, or filter rule, add matching assertions here and keep the root README “what it does not do” boundary in sync.
