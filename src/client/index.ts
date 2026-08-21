/**
 * dsh-plugin-effort-declare — browser half: settings.section for per-model
 * reasoning effort declarations. Wiring failures are logged, never thrown —
 * a throwing apply takes down the whole web shell.
 */
import type { ClientContext } from '@deepseek-ai/dsh-client-runtime/client'
import type { ConnectionHandle } from '@deepseek-ai/dsh-api-remotes/client'
import type {} from '@deepseek-ai/dsh-client-ui-settings/client'
import type {} from '@deepseek-ai/dsh-client-locale/client'
import type {} from '@deepseek-ai/dsh-api-remotes/client'
import { EffortDeclareSection } from './EffortDeclareSection.tsx'
import type { EffortDeclareSectionInjected } from './EffortDeclareSection.tsx'
import { bindSchema } from './schema-ops.ts'
import { NS, en, zh, type EffortDeclareKey } from './locales.ts'

declare module '@deepseek-ai/dsh-client-ui-slots' {
  interface LocaleNamespaceMap {
    /** Effort-declare settings section copy. */
    'plugin-effort-declare': EffortDeclareKey
  }
}

export const inject = ['slots', 'locale', 'connection', 'remote', 'settingsScope', 'settingsSchema']

const LOG = '[dsh-plugin-effort-declare]'

export function apply(ctx: ClientContext): void {
  try {
    ctx.effect(() => ctx.locale.register(NS, { zh, en }), 'dsh-plugin-effort-declare: dictionaries')

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
    })
    const t = ctx.locale.bind(NS) as EffortDeclareSectionInjected['t']
    const injected = (): EffortDeclareSectionInjected => ({
      api: connection.api,
      describe: ctx.settingsScope.describe(),
      schema,
      t,
      onInvalidate: (listener) => {
        const disposers = [
          ctx.remote.$on('settings/document-updated', listener),
          ctx.remote.$on('llm/adapters-updated', listener),
          ctx.on('connection/reset', listener),
        ]
        return () => {
          for (const dispose of disposers) dispose()
        }
      },
    })

    ctx.slots.inject('settings.section', () => ctx.slots.register({
      name: 'settings.section',
      id: 'effort-declare',
      order: 15,
      label: () => t('nav'),
      locale: NS,
      inject: injected,
    }, EffortDeclareSection))
  } catch (error) {
    console.error(LOG, 'apply failed', error)
  }
}
