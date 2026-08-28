# tests/

<p align="center">
  <samp>
    <a href="./README.md">中文</a> ·
    <strong>English</strong>
  </samp>
</p>

In-repo unit tests for the public contracts in [`src/core/`](../src/core/) and [`src/client/load-drafts.ts`](../src/client/load-drafts.ts). They do not boot DSH and do not call a live gateway.

```bash
pnpm test
```

## What's in this directory

[`effort-declare.spec.ts`](./effort-declare.spec.ts) currently covers:

1. `reasoningEfforts` / `compat` from the three presets (the dialect trio is taken over; unknown extra `compat` keys stay), including Off tri-state. Preset spread leaves existing `input` intact.
2. Save ops: changing one model `set`s that route’s full `models` array; hidden fields on unedited rows survive; unchanged `compat` emits no compat op. Changing only `input` still writes `models`.
3. Clear effort declaration: unsetting `reasoningEfforts` keeps `id` / `name` and does not modify `input`.
4. Image input: checking writes `['text', 'image']`; unchecking deletes the key (never `[]`); absence and text-only are not image-capable.
5. Validation: empty object, Off-only, unknown effort keys, and empty / image-only / duplicate / unknown `input` return an error code without throwing.
6. List filter: catalog, `deepseek-official`, and non-completions protocols are not editable.
7. `thinkingFormat` is pinned to the live-schema fixture in [`fixtures/pi-ai-thinking-format-union.ts`](./fixtures/pi-ai-thinking-format-union.ts) (same member set as llm-pi-ai 0.1.0-rc.8 / 0.1.1-rc.2); UI choices are empty when the live schema has no union.
8. `loadDrafts` reads `user` not `value`; `cloneModels` skips non-objects; post-save revision bump; id-keyed 3-way merge (membership add/delete, cleared declarations, revision-only bumps are not false conflicts; `input` and `reasoningEfforts` overlay independently); generation; dirty matches pathOps. Refresh does not call `ensure()`; it waits until the mirror revision has caught up (a newer snapshot does not hang); a no-conflict reload clears conflict/error notices; the page’s own document-updated revision (including older echoes) is not treated as someone else’s conflict. Off value mode stores the trimmed string.
9. `validateSaveDraft`: a schema failure blocks mutate; missing nodes are skipped.
10. Footer `formatAttribution`: a single year when from === to, en dash for a later pack year; empty version or an end year before 2026 throws.

When you add a level, image-input rule, preset, or filter rule, add matching assertions here and keep the [CONTRIBUTING.en.md](../CONTRIBUTING.en.md) boundary and write semantics in sync.
