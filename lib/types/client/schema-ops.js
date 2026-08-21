/** Wrap a live settingsSchema service as plain callbacks. */
export function bindSchema(service) {
    return {
        rehydrate: serialized => service.rehydrate(serialized),
        nodeAtPath: (root, path) => service.nodeAtPath(root, path),
        getPath: (value, path) => service.getPath(value, path),
        hasPath: (value, path) => service.hasPath(value, path),
        validate: (node, draft) => service.validate(node, draft),
    };
}
/**
 * Pre-mutate schema check used by the settings page.
 * A returned string means do not call `settings.mutate`.
 */
export function validateSaveDraft(schema, root, settingsPath, afterModels, afterCompat, willWriteCompat) {
    const modelsNode = schema.nodeAtPath(root, [...settingsPath, 'models']);
    if (modelsNode !== undefined) {
        const error = schema.validate(modelsNode, afterModels);
        if (error !== undefined)
            return error;
    }
    if (willWriteCompat) {
        const compatNode = schema.nodeAtPath(root, [...settingsPath, 'compat']);
        if (compatNode !== undefined) {
            const error = schema.validate(compatNode, afterCompat);
            if (error !== undefined)
                return error;
        }
    }
    return undefined;
}
