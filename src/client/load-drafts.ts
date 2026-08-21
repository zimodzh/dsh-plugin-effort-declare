/**
 * Load editable route drafts from llm.providers + the llm-pi-ai namespace.
 * Drafts come from the user layer; route protocol classification may use effective value.
 */
import type { IApiClient, SettingsNamespaceView } from '@deepseek-ai/dsh-api-remotes/client'
import type { SettingsDescribeFace } from '@deepseek-ai/dsh-client-ui-settings/client'
import {
  FALLBACK_THINKING_FORMATS,
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

/**
 * First paint: `ensure()` (reads only from idle). Never treat ensure as refresh.
 * Callers that must not apply a stale settlement compare generation themselves.
 */
export async function loadDrafts(
  api: Pick<IApiClient, 'llm'>,
  describe: Pick<SettingsDescribeFace, 'ensure' | 'getSnapshot'>,
  schema: SchemaOps,
): Promise<LoadDraftsResult> {
  await describe.ensure()
  const mirrored = describe.getSnapshot()
  if (mirrored.view === undefined) {
    return { writable: false, formats: [...FALLBACK_THINKING_FORMATS], drafts: [], error: mirrored.error ?? undefined }
  }
  const providersResponse = await api.llm.providers({})
  if (!providersResponse.result.ok) {
    return {
      writable: mirrored.view.writable,
      formats: [...FALLBACK_THINKING_FORMATS],
      drafts: [],
      error: providersResponse.result.error.message,
    }
  }
  const namespaces = new Map(mirrored.view.namespaces.map((view: SettingsNamespaceView) => [view.ns, view]))
  const pi = namespaces.get(LLM_PI_AI_NS)
  let formats: string[] = [...FALLBACK_THINKING_FORMATS]
  let schemaDefaultApi: string | undefined
  if (pi !== undefined) {
    try {
      const root = schema.rehydrate(pi.schema)
      const formatNode = schema.nodeAtPath(root, ['providers', SCHEMA_PROBE_ROUTE, 'compat', 'thinkingFormat'])
      const fromSchema = unionStringChoices(formatNode)
      if (fromSchema.length > 0) formats = fromSchema
      schemaDefaultApi = schemaDefaultString(schema.nodeAtPath(root, ['providers', SCHEMA_PROBE_ROUTE, 'api']))
    } catch {
      // Live schema walk is best-effort; fallback list is test-pinned.
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
