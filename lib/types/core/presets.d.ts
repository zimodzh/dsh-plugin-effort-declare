import type { ReasoningEfforts } from './efforts.ts';
export type PresetId = 'deepseek' | 'openai' | 'toggle';
export interface PresetCompatPatch {
    /**
     * Every preset states all three UI dialect keys. `set` writes the key;
     * `unset` removes it. Unknown extra compat keys are left in place.
     */
    thinkingFormat: 'set' | 'unset';
    thinkingFormatValue?: string;
    supportsDeveloperRole: 'set-false' | 'unset';
    supportsReasoningEffort: 'set-false' | 'unset';
}
export interface EffortPreset {
    id: PresetId;
    efforts: ReasoningEfforts;
    compat: PresetCompatPatch;
    /** True when selector levels do not change the on-wire request (except Off). */
    warnSameWire: boolean;
}
/** DeepSeek-compatible gateway: explicit thinking.disabled on Off. */
export declare const DEEPSEEK_PRESET: EffortPreset;
/** OpenAI-compatible gateway: default thinkingFormat (omit the key). */
export declare const OPENAI_PRESET: EffortPreset;
/** On/off only: selector may list levels that are identical on the wire. */
export declare const TOGGLE_PRESET: EffortPreset;
export declare const PRESETS: Record<PresetId, EffortPreset>;
/** Apply a preset's efforts onto every model row (spread, keep other fields). */
export declare function applyPresetEfforts(models: readonly Record<string, unknown>[], preset: EffortPreset): Record<string, unknown>[];
/** Merge a preset's compat patch onto the current route-level compat object. */
export declare function applyPresetCompat(compat: Record<string, unknown>, preset: EffortPreset): Record<string, unknown>;
//# sourceMappingURL=presets.d.ts.map