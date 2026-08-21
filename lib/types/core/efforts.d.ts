import { type ThinkingLevel } from './catalog.ts';
/** Per-model reasoningEfforts dict as stored in llm-pi-ai settings. */
export type ReasoningEfforts = Partial<Record<ThinkingLevel, string | null>>;
/** Off tri-state. Must not be collapsed into a single checkbox. */
export type OffMode = 'absent' | 'empty' | 'value';
export type ReasoningEffortsField = ReasoningEfforts | false | undefined;
/** Read Off's three states from a stored dict. */
export declare function readOff(efforts: ReasoningEfforts | undefined): {
    mode: OffMode;
    value: string;
};
/** Write Off's three states onto a dict (does not mutate the input). */
export declare function writeOff(efforts: ReasoningEfforts, mode: OffMode, value: string): ReasoningEfforts;
/** Whether a thinking level (other than Off) is currently declared. */
export declare function hasLevel(efforts: ReasoningEfforts | undefined, level: Exclude<ThinkingLevel, 'off'>): boolean;
/** Toggle a non-off level. New levels default the wire spelling to the key. */
export declare function toggleLevel(efforts: ReasoningEfforts, level: Exclude<ThinkingLevel, 'off'>, enabled: boolean, wire?: string): ReasoningEfforts;
/** Set the wire spelling for a declared non-off level. */
export declare function setWireSpelling(efforts: ReasoningEfforts, level: Exclude<ThinkingLevel, 'off'>, wire: string): ReasoningEfforts;
/**
 * Validate a reasoningEfforts field. Returns an error code; never throws.
 * Absence / `false` are valid (default-off / catalog strip). Empty dict and
 * off-only are rejected by the official resolver.
 */
export declare function validateReasoningEfforts(efforts: unknown): 'empty' | 'off-only' | 'bad-wire' | undefined;
/** Drop reasoningEfforts from a model row; keep every other field. */
export declare function clearReasoningEfforts(row: Record<string, unknown>): Record<string, unknown>;
/** Read reasoningEfforts from a model row. `false` is treated as absent for the editor. */
export declare function readEfforts(row: Record<string, unknown>): ReasoningEfforts | undefined;
/** Put a dict (or omit the field) onto a spread row. */
export declare function writeEfforts(row: Record<string, unknown>, efforts: ReasoningEfforts | undefined): Record<string, unknown>;
//# sourceMappingURL=efforts.d.ts.map