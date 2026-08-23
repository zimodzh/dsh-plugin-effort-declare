/**
 * Route-card draft merge: user-layer slices, namespace revision, dirty preserve.
 * No React — settings UI and tests share these helpers.
 */
import { profileAt } from './filter.ts'
import { buildSaveOps } from './path-ops.ts'
import { cloneModels, cloneObject, isPlainObject } from './paths.ts'

/** Editable llm-pi-ai route as the settings section holds it. */
export interface RouteDraft {
  provider: string
  displayName: string
  /** Path inside the llm-pi-ai section (`llm.providers[].settingsPath`). */
  settingsPath: readonly string[]
  /** Namespace revision (one value for the whole llm-pi-ai document). */
  revision: number
  models: Record<string, unknown>[]
  originalModels: Record<string, unknown>[]
  compat: Record<string, unknown>
  originalCompat: Record<string, unknown>
  /** Whether `compat` is present on the user profile (not the effective view). */
  compatPresent: boolean
}

/** JSON-stable equality matching pathOps (key order included). */
export function sliceEqual(left: unknown, right: unknown): boolean {
  return JSON.stringify(left) === JSON.stringify(right)
}

/** Whether two settings slices differ. */
export function sliceChanged(before: unknown, after: unknown): boolean {
  return !sliceEqual(before, after)
}

/** Build a draft from the stored user subtree (never from effective `value`). */
export function routeDraftFromUserProfile(args: {
  provider: string
  displayName: string
  settingsPath: readonly string[]
  revision: number
  userProfile: unknown
}): RouteDraft {
  const { provider, displayName, settingsPath, revision, userProfile } = args
  const models = cloneModels(isPlainObject(userProfile) ? userProfile.models : [])
  const compatPresent = isPlainObject(userProfile) && 'compat' in userProfile && isPlainObject(userProfile.compat)
  const compat = cloneObject(isPlainObject(userProfile) ? userProfile.compat : {})
  return {
    provider,
    displayName,
    settingsPath: [...settingsPath],
    revision,
    models,
    originalModels: cloneModels(models),
    compat,
    originalCompat: cloneObject(compat),
    compatPresent,
  }
}

/** Dirty iff pathOps would emit something (same comparison as save). */
export function draftDirty(draft: RouteDraft): boolean {
  return buildSaveOps({
    settingsPath: draft.settingsPath,
    beforeModels: draft.originalModels,
    afterModels: draft.models,
    beforeCompat: draft.compatPresent ? draft.originalCompat : undefined,
    afterCompat: draft.compat,
  }).length > 0
}

/** Treat the current models/compat as the committed originals (no-op save). */
export function alignDraft(draft: RouteDraft): RouteDraft {
  return {
    ...draft,
    originalModels: cloneModels(draft.models),
    originalCompat: cloneObject(draft.compat),
    compatPresent: Object.keys(draft.compat).length > 0 ? true : draft.compatPresent,
  }
}

/** Fold a successful mutate view: saved card realigns; every card gets the new revision. */
export function applySaveSuccess(
  drafts: readonly RouteDraft[],
  savedProvider: string,
  slice: { user: unknown; revision: number },
): RouteDraft[] {
  return drafts.map((draft) => {
    if (draft.provider !== savedProvider) {
      return { ...draft, revision: slice.revision }
    }
    const userProfile = profileAt(slice.user, draft.settingsPath, draft.provider)
    return routeDraftFromUserProfile({
      provider: draft.provider,
      displayName: draft.displayName,
      settingsPath: draft.settingsPath,
      revision: slice.revision,
      userProfile,
    })
  })
}

function modelRowId(row: Record<string, unknown>): string {
  return String(row.id)
}

function indexById(rows: readonly Record<string, unknown>[]): Map<string, Record<string, unknown>> {
  const map = new Map<string, Record<string, unknown>>()
  for (const row of rows) {
    const id = modelRowId(row)
    if (!map.has(id)) map.set(id, row)
  }
  return map
}

function effortsPresence(row: Record<string, unknown> | undefined): { present: boolean; value: unknown } {
  if (row === undefined || !Object.hasOwn(row, 'reasoningEfforts')) {
    return { present: false, value: undefined }
  }
  return { present: true, value: row.reasoningEfforts }
}

function effortsEqual(
  left: { present: boolean; value: unknown },
  right: { present: boolean; value: unknown },
): boolean {
  if (left.present !== right.present) return false
  if (!left.present) return true
  return sliceEqual(left.value, right.value)
}

function overlayLocalEfforts(
  incomingRow: Record<string, unknown>,
  prevRow: Record<string, unknown>,
): Record<string, unknown> {
  const next = structuredClone(incomingRow)
  if (Object.hasOwn(prevRow, 'reasoningEfforts')) {
    next.reasoningEfforts = structuredClone(prevRow.reasoningEfforts)
  } else {
    delete next.reasoningEfforts
  }
  return next
}

function objectKeyChanged(
  left: Record<string, unknown>,
  right: Record<string, unknown>,
  key: string,
): boolean {
  const leftHas = Object.hasOwn(left, key)
  const rightHas = Object.hasOwn(right, key)
  if (leftHas !== rightHas) return true
  if (!leftHas) return false
  return sliceChanged(left[key], right[key])
}

/**
 * Membership follows the latest user-layer models list (Models page add/delete).
 * Local unsaved `reasoningEfforts` (including a cleared key) overlay by id.
 */
export function mergeModelsById(args: {
  prevModels: readonly Record<string, unknown>[]
  prevOriginal: readonly Record<string, unknown>[]
  incomingModels: readonly Record<string, unknown>[]
  incomingOriginal: readonly Record<string, unknown>[]
}): { models: Record<string, unknown>[]; conflicted: boolean } {
  const prevById = indexById(args.prevModels)
  const prevOrigById = indexById(args.prevOriginal)
  const incomingOrigById = indexById(args.incomingOriginal)
  const incomingIds = new Set(args.incomingModels.map(modelRowId))
  let conflicted = false

  const models = args.incomingModels.map((incomingRow) => {
    const id = modelRowId(incomingRow)
    const prevRow = prevById.get(id)
    if (prevRow === undefined) return structuredClone(incomingRow)
    const prevOrig = prevOrigById.get(id)
    const localDirty = !effortsEqual(effortsPresence(prevRow), effortsPresence(prevOrig))
    if (!localDirty) return structuredClone(incomingRow)
    const incomingOrig = incomingOrigById.get(id)
    if (!effortsEqual(effortsPresence(prevOrig), effortsPresence(incomingOrig))) {
      conflicted = true
    }
    return overlayLocalEfforts(incomingRow, prevRow)
  })

  for (const [id, prevRow] of prevById) {
    if (incomingIds.has(id)) continue
    const prevOrig = prevOrigById.get(id)
    if (effortsEqual(effortsPresence(prevRow), effortsPresence(prevOrig))) continue
    if (!effortsEqual(effortsPresence(prevOrig), effortsPresence(incomingOrigById.get(id)))) {
      conflicted = true
    }
  }

  return { models, conflicted }
}

/**
 * Three-way compat merge: locally changed keys stay local; everything else
 * follows incoming. Conflict only when a locally dirty key also moved in originals.
 */
export function mergeCompat(args: {
  prev: Record<string, unknown>
  prevOriginal: Record<string, unknown>
  incoming: Record<string, unknown>
  incomingOriginal: Record<string, unknown>
}): { compat: Record<string, unknown>; conflicted: boolean } {
  if (!sliceChanged(args.prev, args.prevOriginal)) {
    return { compat: cloneObject(args.incoming), conflicted: false }
  }
  const compat = cloneObject(args.incoming)
  let conflicted = false
  const keys = new Set([...Object.keys(args.prev), ...Object.keys(args.prevOriginal)])
  for (const key of keys) {
    if (!objectKeyChanged(args.prev, args.prevOriginal, key)) continue
    if (objectKeyChanged(args.prevOriginal, args.incomingOriginal, key)) conflicted = true
    if (Object.hasOwn(args.prev, key)) compat[key] = structuredClone(args.prev[key])
    else delete compat[key]
  }
  return { compat, conflicted }
}

/**
 * Apply a freshly loaded table. Membership and metadata follow incoming;
 * unsaved reasoningEfforts / dirty compat keys overlay by id. Conflict only
 * when a locally dirty field also changed in originals (revision-only bumps
 * and sibling-card saves do not warn).
 */
export function mergeLoadedDrafts(
  current: readonly RouteDraft[],
  incoming: readonly RouteDraft[],
  options: { preserveDirty: boolean },
): { drafts: RouteDraft[]; conflicted: string[] } {
  const currentByProvider = new Map(current.map(draft => [draft.provider, draft]))
  const conflicted: string[] = []
  const drafts = incoming.map((next) => {
    const prev = currentByProvider.get(next.provider)
    if (prev === undefined || !options.preserveDirty || !draftDirty(prev)) return next
    const modelsMerge = mergeModelsById({
      prevModels: prev.models,
      prevOriginal: prev.originalModels,
      incomingModels: next.models,
      incomingOriginal: next.originalModels,
    })
    const compatMerge = mergeCompat({
      prev: prev.compat,
      prevOriginal: prev.originalCompat,
      incoming: next.compat,
      incomingOriginal: next.originalCompat,
    })
    if (modelsMerge.conflicted || compatMerge.conflicted) conflicted.push(next.provider)
    return {
      provider: next.provider,
      displayName: next.displayName,
      settingsPath: next.settingsPath,
      revision: next.revision,
      models: modelsMerge.models,
      originalModels: cloneModels(next.originalModels),
      compat: compatMerge.compat,
      originalCompat: cloneObject(next.originalCompat),
      compatPresent: next.compatPresent,
    }
  })
  return { drafts, conflicted }
}

/** Increment a generation counter; callers discard stale async settlements. */
export function nextGeneration(holder: { current: number }): number {
  holder.current += 1
  return holder.current
}

/** Whether `generation` is still the latest issued token. */
export function generationIsCurrent(holder: { current: number }, generation: number): boolean {
  return holder.current === generation
}

/** Keep a stored thinkingFormat visible even if the schema union omitted it. */
export function thinkingFormatChoices(formats: readonly string[], current: unknown): string[] {
  if (typeof current === 'string' && current.length > 0 && !formats.includes(current)) {
    return [current, ...formats]
  }
  return [...formats]
}
