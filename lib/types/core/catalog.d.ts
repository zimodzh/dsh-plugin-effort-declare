/**
 * Canonical thinking levels and openai-completions thinkingFormat names.
 *
 * Levels match `@deepseek-ai/dsh-llm-pi-ai` catalog.ts `THINKING_LEVELS`.
 * Formats match `SUPPORTED_THINKING_FORMATS` in the same file (rc.8).
 * Runtime UI prefers the live settings schema union; these lists are the
 * fallback plus a test pin so a silent drift is a failing test, not a
 * second hand-maintained copy nobody notices.
 */
/** Selectable reasoning levels, in pi-ai escalation order. */
export declare const THINKING_LEVELS: readonly ["off", "minimal", "low", "medium", "high", "xhigh", "max"];
export type ThinkingLevel = (typeof THINKING_LEVELS)[number];
/** Thinking levels other than Off; Off has its own tri-state control. */
export declare const THINKING_LEVELS_WITHOUT_OFF: ("minimal" | "low" | "medium" | "high" | "xhigh" | "max")[];
/**
 * openai-completions thinkingFormat values from llm-pi-ai catalog.ts rc.8.
 * Tests pin this list; the settings page prefers schema union choices.
 */
export declare const FALLBACK_THINKING_FORMATS: readonly ["openai", "deepseek", "openrouter", "together", "zai", "qwen", "chat-template", "qwen-chat-template", "string-thinking", "ant-ling"];
export type ThinkingFormat = (typeof FALLBACK_THINKING_FORMATS)[number];
/** Wire protocol this plugin's v1 editor supports. */
export declare const OPENAI_COMPLETIONS = "openai-completions";
/** Settings namespace this plugin writes. */
export declare const LLM_PI_AI_NS = "llm-pi-ai";
/** Official DeepSeek adapter namespace — skip. */
export declare const LLM_DEEPSEEK_NS = "llm-deepseek";
/** Official DeepSeek provider route — skip. */
export declare const DEEPSEEK_OFFICIAL = "deepseek-official";
/** Any route key walks a dict schema to the same profile node. */
export declare const SCHEMA_PROBE_ROUTE = "\0probe";
//# sourceMappingURL=catalog.d.ts.map