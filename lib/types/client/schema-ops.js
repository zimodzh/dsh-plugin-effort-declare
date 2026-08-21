/** Wrap a live settingsSchema service as plain callbacks. */
export function bindSchema(service) {
    return {
        rehydrate: serialized => service.rehydrate(serialized),
        nodeAtPath: (root, path) => service.nodeAtPath(root, path),
        getPath: (value, path) => service.getPath(value, path),
        hasPath: (value, path) => service.hasPath(value, path),
    };
}
