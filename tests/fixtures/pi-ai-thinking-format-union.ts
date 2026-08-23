/**
 * Serialized schemastery union for llm-pi-ai `compat.thinkingFormat`.
 *
 * Snapshot of DSH 0.1.0-rc.8 / 0.1.1-rc.2 (same member set). When upgrading
 * DSH, refresh this fixture from `dsh --dump-config` or the settings describe
 * schema, then update `src/core/catalog.ts`. Do not treat catalog.ts as
 * upstream, and do not value-import `@deepseek-ai/dsh-llm-pi-ai` into the
 * client bundle (purity gate).
 */
export const PI_AI_THINKING_FORMAT_UNION = {
  type: 'union',
  list: [
    { value: 'openai' },
    { value: 'deepseek' },
    { value: 'openrouter' },
    { value: 'together' },
    { value: 'zai' },
    { value: 'qwen' },
    { value: 'chat-template' },
    { value: 'qwen-chat-template' },
    { value: 'string-thinking' },
    { value: 'ant-ling' },
  ],
} as const
