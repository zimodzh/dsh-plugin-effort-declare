/**
 * Canonical thinking levels and openai-completions thinkingFormat names.
 *
 * Levels match `@deepseek-ai/dsh-llm-pi-ai` catalog.ts `THINKING_LEVELS`.
 * Formats match `SUPPORTED_THINKING_FORMATS` in the same file (rc.8).
 * Tests pin these lists against a checked-in schema fixture
 * (`tests/fixtures/pi-ai-thinking-format-union.ts`) and the local level
 * whitelist. The settings page never offers the handwritten thinkingFormat
 * list as writable choices — only the live schema union, plus a stored
 * value that the union omitted.
 */
/** Selectable reasoning levels, in pi-ai escalation order. */
export const THINKING_LEVELS = [
    'off',
    'minimal',
    'low',
    'medium',
    'high',
    'xhigh',
    'max',
];
/** Thinking levels other than Off; Off has its own tri-state control. */
export const THINKING_LEVELS_WITHOUT_OFF = THINKING_LEVELS.filter((level) => level !== 'off');
/**
 * openai-completions thinkingFormat values from llm-pi-ai catalog.ts rc.8.
 * Test pin only — not a writable UI fallback.
 */
export const FALLBACK_THINKING_FORMATS = [
    'openai',
    'deepseek',
    'openrouter',
    'together',
    'zai',
    'qwen',
    'chat-template',
    'qwen-chat-template',
    'string-thinking',
    'ant-ling',
];
/** Wire protocol this plugin's v1 editor supports. */
export const OPENAI_COMPLETIONS = 'openai-completions';
/** Settings namespace this plugin writes. */
export const LLM_PI_AI_NS = 'llm-pi-ai';
/** Official DeepSeek adapter namespace — skip. */
export const LLM_DEEPSEEK_NS = 'llm-deepseek';
/** Official DeepSeek provider route — skip. */
export const DEEPSEEK_OFFICIAL = 'deepseek-official';
/** Any route key walks a dict schema to the same profile node. */
export const SCHEMA_PROBE_ROUTE = '\u0000probe';
