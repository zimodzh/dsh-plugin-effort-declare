import { THINKING_LEVELS, type ThinkingLevel } from './catalog.ts'

/** Per-model reasoningEfforts dict as stored in llm-pi-ai settings. */
export type ReasoningEfforts = Partial<Record<ThinkingLevel, string | null>>

/** Off tri-state. Must not be collapsed into a single checkbox. */
export type OffMode = 'absent' | 'empty' | 'value'

export type ReasoningEffortsField = ReasoningEfforts | false | undefined

/** Read Off's three states from a stored dict. */
export function readOff(efforts: ReasoningEfforts | undefined): { mode: OffMode; value: string } {
  if (efforts === undefined || !('off' in efforts) || efforts.off === undefined) {
    return { mode: 'absent', value: 'none' }
  }
  if (efforts.off === null) return { mode: 'empty', value: 'none' }
  return { mode: 'value', value: efforts.off }
}

/** Write Off's three states onto a dict (does not mutate the input). */
export function writeOff(
  efforts: ReasoningEfforts,
  mode: OffMode,
  value: string,
): ReasoningEfforts {
  const next: ReasoningEfforts = { ...efforts }
  delete next.off
  if (mode === 'empty') next.off = null
  else if (mode === 'value') next.off = value.trim().length > 0 ? value : 'none'
  return next
}

/** Whether a thinking level (other than Off) is currently declared. */
export function hasLevel(efforts: ReasoningEfforts | undefined, level: Exclude<ThinkingLevel, 'off'>): boolean {
  return efforts !== undefined && efforts[level] !== undefined && efforts[level] !== null
}

/** Toggle a non-off level. New levels default the wire spelling to the key. */
export function toggleLevel(
  efforts: ReasoningEfforts,
  level: Exclude<ThinkingLevel, 'off'>,
  enabled: boolean,
  wire?: string,
): ReasoningEfforts {
  const next: ReasoningEfforts = { ...efforts }
  if (enabled) next[level] = wire !== undefined && wire.length > 0 ? wire : level
  else delete next[level]
  return next
}

/** Set the wire spelling for a declared non-off level. */
export function setWireSpelling(
  efforts: ReasoningEfforts,
  level: Exclude<ThinkingLevel, 'off'>,
  wire: string,
): ReasoningEfforts {
  if (!hasLevel(efforts, level)) return efforts
  return { ...efforts, [level]: wire }
}

/**
 * Validate a reasoningEfforts field. Returns an error code; never throws.
 * Absence / `false` are valid (default-off / catalog strip). Empty dict and
 * off-only are rejected by the official resolver.
 */
export function validateReasoningEfforts(efforts: unknown): 'empty' | 'off-only' | 'bad-wire' | undefined {
  if (efforts === undefined || efforts === false) return undefined
  if (efforts === null || (typeof efforts === 'object' && !Array.isArray(efforts) && Object.keys(efforts).length === 0)) {
    return 'empty'
  }
  if (typeof efforts !== 'object' || Array.isArray(efforts)) return 'empty'
  const record = efforts as Record<string, unknown>
  const known = new Set<string>(THINKING_LEVELS)
  for (const key of Object.keys(record)) {
    if (!known.has(key)) return 'bad-wire'
  }
  const declared = THINKING_LEVELS.flatMap((level) => {
    if (!(level in record) || record[level] === undefined) return []
    return [[level, record[level]] as const]
  })
  for (const [level, wire] of declared) {
    if (wire === null) {
      if (level !== 'off') return 'bad-wire'
    } else if (typeof wire !== 'string' || wire.length === 0) {
      return 'bad-wire'
    }
  }
  if (!declared.some(([level]) => level !== 'off')) return 'off-only'
  return undefined
}

/** Drop reasoningEfforts from a model row; keep every other field. */
export function clearReasoningEfforts(row: Record<string, unknown>): Record<string, unknown> {
  const next = { ...row }
  delete next.reasoningEfforts
  return next
}

/** Read reasoningEfforts from a model row. `false` is treated as absent for the editor. */
export function readEfforts(row: Record<string, unknown>): ReasoningEfforts | undefined {
  const value = row.reasoningEfforts
  if (value === undefined || value === false || value === null) return undefined
  if (typeof value !== 'object' || Array.isArray(value)) return undefined
  return value as ReasoningEfforts
}

/** Put a dict (or omit the field) onto a spread row. */
export function writeEfforts(
  row: Record<string, unknown>,
  efforts: ReasoningEfforts | undefined,
): Record<string, unknown> {
  const next = { ...row }
  if (efforts === undefined || Object.keys(efforts).length === 0) {
    delete next.reasoningEfforts
    return next
  }
  next.reasoningEfforts = efforts
  return next
}
