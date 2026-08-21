/**
 * Minimal path ops, same one-level-key algorithm as the official
 * ProviderEditor.pathOps: only keys that differ produce a set/unset.
 */
/**
 * The minimal path ops carrying `after` over `before`.
 * @param base - path of the edited subtree.
 * @param before - subtree as loaded, or undefined when new.
 * @param after - subtree as edited.
 */
export function pathOps(base, before, after) {
    const previous = typeof before === 'object' && before !== null && !Array.isArray(before)
        ? before
        : {};
    const ops = [];
    for (const [key, value] of Object.entries(after)) {
        if (JSON.stringify(previous[key]) === JSON.stringify(value))
            continue;
        ops.push({ op: 'set', path: [...base, key], value });
    }
    for (const key of Object.keys(previous)) {
        if (!(key in after))
            ops.push({ op: 'unset', path: [...base, key] });
    }
    return ops;
}
/**
 * Ops for one route: whole-array `models` replace when the table changed,
 * plus one-level compat path ops. Never replace the `llm-pi-ai` section.
 */
export function buildSaveOps(slices) {
    const base = [...slices.settingsPath];
    const ops = [];
    if (JSON.stringify(slices.beforeModels) !== JSON.stringify(slices.afterModels)) {
        ops.push({ op: 'set', path: [...base, 'models'], value: slices.afterModels });
    }
    if (slices.afterCompat !== undefined) {
        ops.push(...pathOps([...base, 'compat'], slices.beforeCompat, slices.afterCompat));
    }
    return ops;
}
