/**
 * Load editable route drafts from llm.providers + the llm-pi-ai namespace.
 * Drafts come from the user layer; route protocol classification may use effective value.
 *
 * First paint uses `ensure()` (idle-only). Refresh never calls `ensure()`:
 * wait until the mirror subscribe shows a namespace revision at least as new
 * as the Host event, then `getSnapshot()`. Own mutate echoes are identified
 * by revision (including older delayed echoes), not ignored as a generic
 * document-updated.
 */
import type { IApiClient, SettingsNamespaceView } from '@deepseek-ai/dsh-api-remotes/client'
import type { SettingsDescribeFace } from '@deepseek-ai/dsh-client-ui-settings/client'
import {
  LLM_PI_AI_NS,
  SCHEMA_PROBE_ROUTE,
} from '../core/catalog.ts'
import { routeDraftFromUserProfile, type RouteDraft } from '../core/drafts.ts'
import { classifyRoute, profileAt, unionStringChoices } from '../core/filter.ts'
import { isPlainObject } from '../core/paths.ts'
import type { SchemaOps } from './schema-ops.ts'

function schemaDefaultString(node: unknown): string | undefined {
  if (!isPlainObject(node) || !isPlainObject(node.meta)) return undefined
  return typeof node.meta.default === 'string' ? node.meta.default : undefined
}

export interface LoadDraftsResult {
  writable: boolean
  formats: string[]
  drafts: RouteDraft[]
  error?: string
}

export type LoadDraftsMode = 'ensure' | 'snapshot'

type MirrorSnapshot = ReturnType<SettingsDescribeFace['getSnapshot']>
type MirrorDescribe = Pick<SettingsDescribeFace, 'getSnapshot' | 'subscribe'>

/** Namespace revision on a describe snapshot, if that row exists. */
export function namespaceRevision(snapshot: MirrorSnapshot, ns: string): number | undefined {
  return snapshot.view?.namespaces.find(view => view.ns === ns)?.revision
}

/**
 * True when `incoming` is the Host echo of a mutate this page already folded,
 * or an older revision the snapshot has already passed. `echoed` is undefined
 * until the first successful write.
 */
export function isOwnDocumentEcho(echoed: number | undefined, incoming: number): boolean {
  return echoed !== undefined && incoming <= echoed
}

/**
 * After a preserve-dirty reload: conflicted cards get a conflict notice;
 * live cards drop leftover conflict/error; saved notices stay; gone cards drop.
 */
export function foldReloadNotices<T extends { kind: string }>(
  current: Record<string, T>,
  args: {
    conflicted: readonly string[]
    conflictNotice: T
    liveProviders: readonly string[]
  },
): Record<string, T> {
  const live = new Set(args.liveProviders)
  const conflicted = new Set(args.conflicted)
  const next: Record<string, T> = {}
  for (const [provider, notice] of Object.entries(current)) {
    if (!live.has(provider)) continue
    if (conflicted.has(provider)) continue
    if (notice.kind === 'conflict' || notice.kind === 'error') continue
    next[provider] = notice
  }
  for (const provider of args.conflicted) {
    next[provider] = args.conflictNotice
  }
  return next
}

function waitUntil(
  describe: MirrorDescribe,
  predicate: () => boolean,
  signal?: AbortSignal,
): Promise<boolean> {
  if (signal?.aborted) return Promise.resolve(false)
  if (predicate()) return Promise.resolve(true)
  return new Promise((resolve) => {
    let settled = false
    const finish = (ok: boolean) => {
      if (settled) return
      settled = true
      stop()
      signal?.removeEventListener('abort', onAbort)
      resolve(ok)
    }
    const onAbort = () => { finish(false) }
    const stop = describe.subscribe(() => {
      if (predicate()) finish(true)
    })
    signal?.addEventListener('abort', onAbort)
    if (predicate()) finish(true)
    else if (signal?.aborted) finish(false)
  })
}

/** Resolve when the mirror's namespace revision is at least `revision`, or abort. */
export async function waitForNamespaceRevision(
  describe: MirrorDescribe,
  ns: string,
  revision: number,
  signal?: AbortSignal,
): Promise<'matched' | 'aborted'> {
  const matched = await waitUntil(
    describe,
    () => {
      const current = namespaceRevision(describe.getSnapshot(), ns)
      return current !== undefined && current >= revision
    },
    signal,
  )
  return matched ? 'matched' : 'aborted'
}

/** Resolve when the namespace revision differs from `previous`, or abort. */
export async function waitForNamespaceRevisionChange(
  describe: MirrorDescribe,
  ns: string,
  previous: number,
  signal?: AbortSignal,
): Promise<'changed' | 'aborted'> {
  const changed = await waitUntil(describe, () => {
    const current = namespaceRevision(describe.getSnapshot(), ns)
    return current !== undefined && current !== previous
  }, signal)
  return changed ? 'changed' : 'aborted'
}

async function assembleDrafts(
  api: Pick<IApiClient, 'llm'>,
  describe: Pick<SettingsDescribeFace, 'getSnapshot'>,
  schema: SchemaOps,
): Promise<LoadDraftsResult> {
  const mirrored = describe.getSnapshot()
  if (mirrored.view === undefined) {
    return { writable: false, formats: [], drafts: [], error: mirrored.error ?? undefined }
  }
  const providersResponse = await api.llm.providers({})
  if (!providersResponse.result.ok) {
    return {
      writable: mirrored.view.writable,
      formats: [],
      drafts: [],
      error: providersResponse.result.error.message,
    }
  }
  const namespaces = new Map(mirrored.view.namespaces.map((view: SettingsNamespaceView) => [view.ns, view]))
  const pi = namespaces.get(LLM_PI_AI_NS)
  let formats: string[] = []
  let schemaDefaultApi: string | undefined
  if (pi !== undefined) {
    try {
      const root = schema.rehydrate(pi.schema)
      const formatNode = schema.nodeAtPath(root, ['providers', SCHEMA_PROBE_ROUTE, 'compat', 'thinkingFormat'])
      const fromSchema = unionStringChoices(formatNode)
      if (fromSchema.length > 0) formats = fromSchema
      schemaDefaultApi = schemaDefaultString(schema.nodeAtPath(root, ['providers', SCHEMA_PROBE_ROUTE, 'api']))
    } catch {
      // Live schema walk is best-effort; UI options stay empty rather than a handwritten list.
    }
  }
  const drafts: RouteDraft[] = []
  for (const entry of providersResponse.result.value.providers) {
    const settingsPath = entry.settingsPath !== undefined && entry.settingsPath.length > 0
      ? [...entry.settingsPath]
      : ['providers', entry.provider]
    const effective = profileAt(pi?.value, settingsPath, entry.provider)
    if (!classifyRoute(entry, effective, schemaDefaultApi).editable) continue
    drafts.push(routeDraftFromUserProfile({
      provider: entry.provider,
      displayName: entry.displayName ?? entry.provider,
      settingsPath,
      revision: pi?.revision ?? 0,
      userProfile: profileAt(pi?.user, settingsPath, entry.provider),
    }))
  }
  return { writable: mirrored.view.writable, formats, drafts }
}

/**
 * `ensure`: first paint / idle recovery (official ensure only reads from idle).
 * `snapshot`: refresh after the mirror revision already moved — do not ensure.
 */
export async function loadDrafts(
  api: Pick<IApiClient, 'llm'>,
  describe: Pick<SettingsDescribeFace, 'ensure' | 'getSnapshot'>,
  schema: SchemaOps,
  mode: LoadDraftsMode = 'ensure',
): Promise<LoadDraftsResult> {
  if (mode === 'ensure') await describe.ensure()
  return assembleDrafts(api, describe, schema)
}
