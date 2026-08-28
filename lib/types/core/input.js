/**
 * Per-model `input` modalities as stored in llm-pi-ai settings.
 * Absence falls through to route `defaultInput` (`[text]`). Empty list is
 * treated as absent by the official resolver — do not write `[]`.
 */
import { IMAGE_CAPABLE_INPUT, INPUT_MODALITIES } from "./catalog.js";
/** Whether the stored `input` list includes image. Absence is false. */
export function readImageCapable(row) {
    const value = row.input;
    return Array.isArray(value) && value.includes('image');
}
/**
 * Declare or drop image input on a spread row.
 * Enabled writes `[text, image]`; disabled unsets the key (not `[]`, not `[text]`).
 */
export function writeImageCapable(row, enabled) {
    const next = { ...row };
    if (enabled)
        next.input = [...IMAGE_CAPABLE_INPUT];
    else
        delete next.input;
    return next;
}
/**
 * Validate a stored `input` field. Returns an error code; never throws.
 * Absence is valid. Empty list is rejected so a bad stamp cannot be re-saved.
 */
export function validateInput(input) {
    if (input === undefined)
        return undefined;
    if (!Array.isArray(input) || input.length === 0)
        return 'bad-input';
    const known = new Set(INPUT_MODALITIES);
    const seen = new Set();
    for (const item of input) {
        if (typeof item !== 'string' || !known.has(item) || seen.has(item))
            return 'bad-input';
        seen.add(item);
    }
    if (!seen.has('text'))
        return 'bad-input';
    return undefined;
}
/** Per-model client-side check used to show errors without throwing. */
export function modelInputError(row) {
    if (!('input' in row) || row.input === undefined)
        return undefined;
    return validateInput(row.input);
}
