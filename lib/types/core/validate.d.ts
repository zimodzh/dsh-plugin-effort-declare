export type ModelRowError = 'empty' | 'off-only' | 'bad-wire' | 'bad-input';
/** Per-model client-side check used to show errors without throwing. */
export declare function modelEffortError(row: Record<string, unknown>): 'empty' | 'off-only' | 'bad-wire' | undefined;
/** First blocking error on a model row (efforts, then input). */
export declare function modelRowError(row: Record<string, unknown>): ModelRowError | undefined;
//# sourceMappingURL=validate.d.ts.map