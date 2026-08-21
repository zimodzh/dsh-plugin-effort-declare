import { validateReasoningEfforts } from './efforts.ts'

/** Per-model client-side check used to show errors without throwing. */
export function modelEffortError(row: Record<string, unknown>): 'empty' | 'off-only' | 'bad-wire' | undefined {
  if (!('reasoningEfforts' in row) || row.reasoningEfforts === undefined) return undefined
  return validateReasoningEfforts(row.reasoningEfforts)
}
