/**
 * Nested get/has over plain JSON, matching ui-settings SettingsSchemaService
 * for the paths this plugin needs. Kept in-repo so tests do not import a
 * Cordis service.
 */

/** Read a nested value by string keys / array indexes. */
export function getPath(value: unknown, path: readonly string[]): unknown {
  let current: unknown = value
  for (const key of path) {
    if (Array.isArray(current)) {
      current = current[Number(key)]
      continue
    }
    if (typeof current !== 'object' || current === null) return undefined
    current = (current as Record<string, unknown>)[key]
  }
  return current
}

/** Whether the final path key exists, independently of its value. */
export function hasPath(value: unknown, path: readonly string[]): boolean {
  if (path.length === 0) return value !== undefined
  const parent = getPath(value, path.slice(0, -1))
  const key = path[path.length - 1] as string
  if (Array.isArray(parent)) return Number(key) < parent.length
  if (typeof parent !== 'object' || parent === null) return false
  return key in parent
}

/** Plain object (not array, not null). */
export function isPlainObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

/** Structured clone of a JSON object, or `{}` when the source is not one. */
export function cloneObject(value: unknown): Record<string, unknown> {
  return isPlainObject(value) ? structuredClone(value) : {}
}

/** Structured clone of a models array; non-arrays become `[]`. */
export function cloneModels(value: unknown): Record<string, unknown>[] {
  if (!Array.isArray(value)) return []
  return value.map((row) => (isPlainObject(row) ? structuredClone(row) : { id: '' }))
}
