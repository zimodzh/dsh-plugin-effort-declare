/**
 * Bind the settings-owned schema service without importing executable
 * helpers from another client plugin (bundle purity).
 */
export interface SchemaOps {
    rehydrate: (serialized: unknown) => unknown;
    nodeAtPath: (root: unknown, path: readonly string[]) => unknown;
    getPath: (value: unknown, path: readonly string[]) => unknown;
    hasPath: (value: unknown, path: readonly string[]) => boolean;
    /**
     * Official `settingsSchema.validate`: failure text, or `undefined` when valid.
     * Missing nodes are skipped by the caller — do not invent a second validator.
     */
    validate: (node: unknown, draft: unknown) => string | undefined;
}
/** Wrap a live settingsSchema service as plain callbacks. */
export declare function bindSchema(service: SchemaOps): SchemaOps;
/**
 * Pre-mutate schema check used by the settings page.
 * A returned string means do not call `settings.mutate`.
 */
export declare function validateSaveDraft(schema: SchemaOps, root: unknown, settingsPath: readonly string[], afterModels: unknown, afterCompat: unknown, willWriteCompat: boolean): string | undefined;
//# sourceMappingURL=schema-ops.d.ts.map