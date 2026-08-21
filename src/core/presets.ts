import type { ReasoningEfforts } from './efforts.ts'

export type PresetId = 'deepseek' | 'openai' | 'toggle'

export interface PresetCompatPatch {
  /**
   * `set` writes the key; `unset` removes it (OpenAI default thinkingFormat);
   * omitted keys are left untouched on the existing compat object.
   */
  thinkingFormat?: 'set' | 'unset'
  thinkingFormatValue?: string
  supportsDeveloperRole?: 'set-false' | 'unset'
  supportsReasoningEffort?: 'set-false' | 'unset'
}

export interface EffortPreset {
  id: PresetId
  efforts: ReasoningEfforts
  compat: PresetCompatPatch
  /** True when selector levels do not change the on-wire request (except Off). */
  warnSameWire: boolean
}

/** DeepSeek-compatible gateway: explicit thinking.disabled on Off. */
export const DEEPSEEK_PRESET: EffortPreset = {
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
}

/** OpenAI-compatible gateway: default thinkingFormat (omit the key). */
export const OPENAI_PRESET: EffortPreset = {
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
}

/** On/off only: selector may list levels that are identical on the wire. */
export const TOGGLE_PRESET: EffortPreset = {
  id: 'toggle',
  efforts: {
    off: null,
    high: 'high',
  },
  compat: {
    supportsReasoningEffort: 'set-false',
  },
  warnSameWire: true,
}

export const PRESETS: Record<PresetId, EffortPreset> = {
  deepseek: DEEPSEEK_PRESET,
  openai: OPENAI_PRESET,
  toggle: TOGGLE_PRESET,
}

/** Apply a preset's efforts onto every model row (spread, keep other fields). */
export function applyPresetEfforts(
  models: readonly Record<string, unknown>[],
  preset: EffortPreset,
): Record<string, unknown>[] {
  return models.map(row => ({ ...row, reasoningEfforts: { ...preset.efforts } }))
}

/** Merge a preset's compat patch onto the current route-level compat object. */
export function applyPresetCompat(
  compat: Record<string, unknown>,
  preset: EffortPreset,
): Record<string, unknown> {
  const next = { ...compat }
  const { compat: patch } = preset
  if (patch.thinkingFormat === 'unset') delete next.thinkingFormat
  else if (patch.thinkingFormat === 'set' && patch.thinkingFormatValue !== undefined) {
    next.thinkingFormat = patch.thinkingFormatValue
  }
  if (patch.supportsDeveloperRole === 'unset') delete next.supportsDeveloperRole
  else if (patch.supportsDeveloperRole === 'set-false') next.supportsDeveloperRole = false
  if (patch.supportsReasoningEffort === 'unset') delete next.supportsReasoningEffort
  else if (patch.supportsReasoningEffort === 'set-false') next.supportsReasoningEffort = false
  return next
}
