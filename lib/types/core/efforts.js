import { THINKING_LEVELS } from "./catalog.js";
/** Read Off's three states from a stored dict. */
export function readOff(efforts) {
    if (efforts === undefined || !('off' in efforts) || efforts.off === undefined) {
        return { mode: 'absent', value: 'none' };
    }
    if (efforts.off === null)
        return { mode: 'empty', value: 'none' };
    return { mode: 'value', value: efforts.off };
}
/** Write Off's three states onto a dict (does not mutate the input). */
export function writeOff(efforts, mode, value) {
    const next = { ...efforts };
    delete next.off;
    if (mode === 'empty')
        next.off = null;
    else if (mode === 'value') {
        const trimmed = value.trim();
        next.off = trimmed.length > 0 ? trimmed : 'none';
    }
    return next;
}
/** Whether a thinking level (other than Off) is currently declared. */
export function hasLevel(efforts, level) {
    return efforts !== undefined && efforts[level] !== undefined && efforts[level] !== null;
}
/** Toggle a non-off level. New levels default the wire spelling to the key. */
export function toggleLevel(efforts, level, enabled, wire) {
    const next = { ...efforts };
    if (enabled)
        next[level] = wire !== undefined && wire.length > 0 ? wire : level;
    else
        delete next[level];
    return next;
}
/** Set the wire spelling for a declared non-off level. */
export function setWireSpelling(efforts, level, wire) {
    if (!hasLevel(efforts, level))
        return efforts;
    return { ...efforts, [level]: wire };
}
/**
 * Validate a reasoningEfforts field. Returns an error code; never throws.
 * Absence / `false` are valid (default-off / catalog strip). Empty dict and
 * off-only are rejected by the official resolver.
 */
export function validateReasoningEfforts(efforts) {
    if (efforts === undefined || efforts === false)
        return undefined;
    if (efforts === null || (typeof efforts === 'object' && !Array.isArray(efforts) && Object.keys(efforts).length === 0)) {
        return 'empty';
    }
    if (typeof efforts !== 'object' || Array.isArray(efforts))
        return 'empty';
    const record = efforts;
    const known = new Set(THINKING_LEVELS);
    for (const key of Object.keys(record)) {
        if (!known.has(key))
            return 'bad-wire';
    }
    const declared = THINKING_LEVELS.flatMap((level) => {
        if (!(level in record) || record[level] === undefined)
            return [];
        return [[level, record[level]]];
    });
    for (const [level, wire] of declared) {
        if (wire === null) {
            if (level !== 'off')
                return 'bad-wire';
        }
        else if (typeof wire !== 'string' || wire.length === 0) {
            return 'bad-wire';
        }
    }
    if (!declared.some(([level]) => level !== 'off'))
        return 'off-only';
    return undefined;
}
/** Drop reasoningEfforts from a model row; keep every other field. */
export function clearReasoningEfforts(row) {
    const next = { ...row };
    delete next.reasoningEfforts;
    return next;
}
/** Read reasoningEfforts from a model row. `false` is treated as absent for the editor. */
export function readEfforts(row) {
    const value = row.reasoningEfforts;
    if (value === undefined || value === false || value === null)
        return undefined;
    if (typeof value !== 'object' || Array.isArray(value))
        return undefined;
    return value;
}
/** Put a dict (or omit the field) onto a spread row. */
export function writeEfforts(row, efforts) {
    const next = { ...row };
    if (efforts === undefined || Object.keys(efforts).length === 0) {
        delete next.reasoningEfforts;
        return next;
    }
    next.reasoningEfforts = efforts;
    return next;
}
