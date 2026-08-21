/**
 * Bind the settings-owned schema service without importing executable
 * helpers from another client plugin (bundle purity).
 */
export interface SchemaOps {
  rehydrate: (serialized: unknown) => unknown
  nodeAtPath: (root: unknown, path: readonly string[]) => unknown
  getPath: (value: unknown, path: readonly string[]) => unknown
  hasPath: (value: unknown, path: readonly string[]) => boolean
}

/** Wrap a live settingsSchema service as plain callbacks. */
export function bindSchema(service: SchemaOps): SchemaOps {
  return {
    rehydrate: serialized => service.rehydrate(serialized),
    nodeAtPath: (root, path) => service.nodeAtPath(root, path),
    getPath: (value, path) => service.getPath(value, path),
    hasPath: (value, path) => service.hasPath(value, path),
  }
}
