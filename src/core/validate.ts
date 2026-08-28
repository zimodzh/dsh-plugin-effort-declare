import { validateReasoningEfforts } from './efforts.ts'
import { modelInputError } from './input.ts'

export type ModelRowError = 'empty' | 'off-only' | 'bad-wire' | 'bad-input'

/** Per-model client-side check used to show errors without throwing. */
export function modelEffortError(row: Record<string, unknown>): 'empty' | 'off-only' | 'bad-wire' | undefined {
  if (!('reasoningEfforts' in row) || row.reasoningEfforts === undefined) return undefined
  return validateReasoningEfforts(row.reasoningEfforts)
}

/** First blocking error on a model row (efforts, then input). */
export function modelRowError(row: Record<string, unknown>): ModelRowError | undefined {
  return modelEffortError(row) ?? modelInputError(row)
}
