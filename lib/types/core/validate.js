import { validateReasoningEfforts } from "./efforts.js";
/** Per-model client-side check used to show errors without throwing. */
export function modelEffortError(row) {
    if (!('reasoningEfforts' in row) || row.reasoningEfforts === undefined)
        return undefined;
    return validateReasoningEfforts(row.reasoningEfforts);
}
