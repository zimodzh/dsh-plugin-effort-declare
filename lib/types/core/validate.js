import { validateReasoningEfforts } from "./efforts.js";
import { modelInputError } from "./input.js";
/** Per-model client-side check used to show errors without throwing. */
export function modelEffortError(row) {
    if (!('reasoningEfforts' in row) || row.reasoningEfforts === undefined)
        return undefined;
    return validateReasoningEfforts(row.reasoningEfforts);
}
/** First blocking error on a model row (efforts, then input). */
export function modelRowError(row) {
    return modelEffortError(row) ?? modelInputError(row);
}
