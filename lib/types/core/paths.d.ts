/**
 * Nested get/has over plain JSON, matching ui-settings SettingsSchemaService
 * for the paths this plugin needs. Kept in-repo so tests do not import a
 * Cordis service.
 */
/** Read a nested value by string keys / array indexes. */
export declare function getPath(value: unknown, path: readonly string[]): unknown;
/** Whether the final path key exists, independently of its value. */
export declare function hasPath(value: unknown, path: readonly string[]): boolean;
/** Plain object (not array, not null). */
export declare function isPlainObject(value: unknown): value is Record<string, unknown>;
/** Structured clone of a JSON object, or `{}` when the source is not one. */
export declare function cloneObject(value: unknown): Record<string, unknown>;
/** Structured clone of a models array; non-arrays and non-object rows are skipped. */
export declare function cloneModels(value: unknown): Record<string, unknown>[];
//# sourceMappingURL=paths.d.ts.map