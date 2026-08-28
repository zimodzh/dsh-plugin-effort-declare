/** Whether the stored `input` list includes image. Absence is false. */
export declare function readImageCapable(row: Record<string, unknown>): boolean;
/**
 * Declare or drop image input on a spread row.
 * Enabled writes `[text, image]`; disabled unsets the key (not `[]`, not `[text]`).
 */
export declare function writeImageCapable(row: Record<string, unknown>, enabled: boolean): Record<string, unknown>;
/**
 * Validate a stored `input` field. Returns an error code; never throws.
 * Absence is valid. Empty list is rejected so a bad stamp cannot be re-saved.
 */
export declare function validateInput(input: unknown): 'bad-input' | undefined;
/** Per-model client-side check used to show errors without throwing. */
export declare function modelInputError(row: Record<string, unknown>): 'bad-input' | undefined;
//# sourceMappingURL=input.d.ts.map