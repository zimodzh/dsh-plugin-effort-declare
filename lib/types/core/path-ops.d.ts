/**
 * Minimal path ops, same one-level-key algorithm as the official
 * ProviderEditor.pathOps: only keys that differ produce a set/unset.
 */
export type PathOp = {
    op: 'set';
    path: string[];
    value: unknown;
} | {
    op: 'unset';
    path: string[];
};
/**
 * The minimal path ops carrying `after` over `before`.
 * @param base - path of the edited subtree.
 * @param before - subtree as loaded, or undefined when new.
 * @param after - subtree as edited.
 */
export declare function pathOps(base: readonly string[], before: unknown, after: Record<string, unknown>): PathOp[];
export interface SaveSlices {
    /** Provider route id (settings path `providers.<route>`). */
    route: string;
    /** Models array before the edit (effective / stored). */
    beforeModels: unknown;
    /** Models array after the edit — every existing row, spread intact. */
    afterModels: unknown[];
    /** Route-level compat before the edit (`undefined` = field absent). */
    beforeCompat: unknown;
    /**
     * Route-level compat after the edit. `undefined` means leave the field
     * untouched (no compat ops at all).
     */
    afterCompat: Record<string, unknown> | undefined;
}
/**
 * Ops for one route: whole-array `models` replace when the table changed,
 * plus one-level compat path ops. Never replace the `llm-pi-ai` section.
 */
export declare function buildSaveOps(slices: SaveSlices): PathOp[];
//# sourceMappingURL=path-ops.d.ts.map