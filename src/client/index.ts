/**
 * dsh-plugin-effort-declare — browser half: settings.section for per-model
 * reasoning effort declarations.
 */
import type { ClientContext } from '@deepseek-ai/dsh-client-runtime/client'
import type { ConnectionHandle } from '@deepseek-ai/dsh-api-remotes/client'
import type {} from '@deepseek-ai/dsh-client-ui-settings/client'
import type {} from '@deepseek-ai/dsh-client-locale/client'
import type {} from '@deepseek-ai/dsh-api-remotes/client'
import { EffortDeclareSection } from './EffortDeclareSection.tsx'
import type { EffortDeclareSectionInjected, InvalidationSource } from './EffortDeclareSection.tsx'
import { bindSchema } from './schema-ops.ts'
import { LLM_PI_AI_NS } from '../core/catalog.ts'
import { NS, en, zh, type EffortDeclareKey } from './locales.ts'
import { cssTagId, cssText } from './effort-declare.module.css'

declare module '@deepseek-ai/dsh-client-ui-slots' {
  interface LocaleNamespaceMap {
    /** Effort-declare settings section copy. */
    'plugin-effort-declare': EffortDeclareKey
  }
}

export const inject = ['slots', 'locale', 'connection', 'remote', 'settingsScope', 'settingsSchema']

const PLUGIN_ID = 'dsh-plugin-effort-declare'

function mountPluginCss(): () => void {
  if (typeof document === 'undefined') return () => {}
  const selector = `style[data-plugin-css=${JSON.stringify(cssTagId)}]`
  let tag = document.querySelector(selector) as HTMLStyleElement | null
  if (tag === null) {
    tag = document.createElement('style')
    tag.dataset.plugin = PLUGIN_ID
    tag.dataset.pluginCss = cssTagId
    document.head.appendChild(tag)
  }
  tag.textContent = cssText
  return () => { tag?.remove() }
}

export function apply(ctx: ClientContext): void {
  ctx.effect(() => ctx.locale.register(NS, { zh, en }), `${PLUGIN_ID}: dictionaries`)
  ctx.effect(() => mountPluginCss(), `${PLUGIN_ID}: css`)

  const connection = ctx.get('connection') as ConnectionHandle
  const settingsSchema = ctx.settingsSchema
  const schema = bindSchema({
    rehydrate: serialized => settingsSchema.rehydrate(serialized),
    nodeAtPath: (root, path) => settingsSchema.nodeAtPath(
      root as Parameters<typeof settingsSchema.nodeAtPath>[0],
      path,
    ),
    getPath: (value, path) => settingsSchema.getPath(value, path),
    hasPath: (value, path) => settingsSchema.hasPath(value, path),
    validate: (node, draft) => settingsSchema.validate(
      node as Parameters<typeof settingsSchema.validate>[0],
      draft,
    ),
  })
  const t = ctx.locale.bind(NS)
  const describe = ctx.settingsScope.describe()
  const invalidation = new Set<(source: InvalidationSource) => void>()

  ctx.effect(() => {
    const emit = (source: InvalidationSource) => {
      for (const listener of invalidation) listener(source)
    }
    const disposers = [
      describe.subscribe(() => { emit('settings') }),
      ctx.remote.$on('settings/document-updated', (ns: string) => {
        if (ns !== LLM_PI_AI_NS) return
        emit('settings')
      }),
      ctx.remote.$on('llm/adapters-updated', () => { emit('directory') }),
      ctx.on('connection/reset', () => { emit('directory') }),
    ]
    return () => {
      for (const dispose of disposers) dispose()
    }
  }, `${PLUGIN_ID}: invalidations`)

  const subscribeInvalidate: EffortDeclareSectionInjected['subscribeInvalidate'] = (listener) => {
    invalidation.add(listener)
    return () => { invalidation.delete(listener) }
  }

  ctx.slots.inject('settings.section', () => ctx.slots.register({
    name: 'settings.section',
    id: 'effort-declare',
    order: 12,
    label: () => t('nav'),
    locale: NS,
    inject: (): EffortDeclareSectionInjected => ({
      api: connection.api,
      describe,
      schema,
      subscribeInvalidate,
    }),
  }, EffortDeclareSection))
}
