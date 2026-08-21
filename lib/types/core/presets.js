/** DeepSeek-compatible gateway: explicit thinking.disabled on Off. */
export const DEEPSEEK_PRESET = {
    id: 'deepseek',
    efforts: {
        off: null,
        low: 'low',
        high: 'high',
        max: 'max',
    },
    compat: {
        thinkingFormat: 'set',
        thinkingFormatValue: 'deepseek',
        supportsDeveloperRole: 'set-false',
    },
    warnSameWire: false,
};
/** OpenAI-compatible gateway: default thinkingFormat (omit the key). */
export const OPENAI_PRESET = {
    id: 'openai',
    efforts: {
        minimal: 'minimal',
        low: 'low',
        medium: 'medium',
        high: 'high',
    },
    compat: {
        thinkingFormat: 'unset',
    },
    warnSameWire: false,
};
/** On/off only: selector may list levels that are identical on the wire. */
export const TOGGLE_PRESET = {
    id: 'toggle',
    efforts: {
        off: null,
        high: 'high',
    },
    compat: {
        supportsReasoningEffort: 'set-false',
    },
    warnSameWire: true,
};
export const PRESETS = {
    deepseek: DEEPSEEK_PRESET,
    openai: OPENAI_PRESET,
    toggle: TOGGLE_PRESET,
};
/** Apply a preset's efforts onto every model row (spread, keep other fields). */
export function applyPresetEfforts(models, preset) {
    return models.map(row => ({ ...row, reasoningEfforts: { ...preset.efforts } }));
}
/** Merge a preset's compat patch onto the current route-level compat object. */
export function applyPresetCompat(compat, preset) {
    const next = { ...compat };
    const { compat: patch } = preset;
    if (patch.thinkingFormat === 'unset')
        delete next.thinkingFormat;
    else if (patch.thinkingFormat === 'set' && patch.thinkingFormatValue !== undefined) {
        next.thinkingFormat = patch.thinkingFormatValue;
    }
    if (patch.supportsDeveloperRole === 'unset')
        delete next.supportsDeveloperRole;
    else if (patch.supportsDeveloperRole === 'set-false')
        next.supportsDeveloperRole = false;
    if (patch.supportsReasoningEffort === 'unset')
        delete next.supportsReasoningEffort;
    else if (patch.supportsReasoningEffort === 'set-false')
        next.supportsReasoningEffort = false;
    return next;
}
