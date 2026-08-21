/**
 * Bind the settings-owned schema service without importing executable
 * helpers from another client plugin (bundle purity).
 */
export interface SchemaOps {
  rehydrate: (serialized: unknown) => unknown
  nodeAtPath: (root: unknown, path: readonly string[]) => unknown
  getPath: (value: unknown, path: readonly string[]) => unknown
  hasPath: (value: unknown, path: readonly string[]) => boolean
  /**
   * Official `settingsSchema.validate`: failure text, or `undefined` when valid.
   * Missing nodes are skipped by the caller — do not invent a second validator.
   */
  validate: (node: unknown, draft: unknown) => string | undefined
}

/** Wrap a live settingsSchema service as plain callbacks. */
export function bindSchema(service: SchemaOps): SchemaOps {
  return {
    rehydrate: serialized => service.rehydrate(serialized),
    nodeAtPath: (root, path) => service.nodeAtPath(root, path),
    getPath: (value, path) => service.getPath(value, path),
    hasPath: (value, path) => service.hasPath(value, path),
    validate: (node, draft) => service.validate(node, draft),
  }
}

/**
 * Pre-mutate schema check used by the settings page.
 * A returned string means do not call `settings.mutate`.
 */
export function validateSaveDraft(
  schema: SchemaOps,
  root: unknown,
  settingsPath: readonly string[],
  afterModels: unknown,
  afterCompat: unknown,
  willWriteCompat: boolean,
): string | undefined {
  const modelsNode = schema.nodeAtPath(root, [...settingsPath, 'models'])
  if (modelsNode !== undefined) {
    const error = schema.validate(modelsNode, afterModels)
    if (error !== undefined) return error
  }
  if (willWriteCompat) {
    const compatNode = schema.nodeAtPath(root, [...settingsPath, 'compat'])
    if (compatNode !== undefined) {
      const error = schema.validate(compatNode, afterCompat)
      if (error !== undefined) return error
    }
  }
  return undefined
}
