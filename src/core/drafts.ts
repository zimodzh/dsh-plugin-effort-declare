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

/**
 * Apply a freshly loaded table. Dirty cards keep models/compat; originals and
 * revision follow the incoming snapshot so a later save is against the new user layer.
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
    conflicted.push(next.provider)
    return {
      ...prev,
      displayName: next.displayName,
      settingsPath: next.settingsPath,
      revision: next.revision,
      originalModels: cloneModels(next.originalModels),
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
