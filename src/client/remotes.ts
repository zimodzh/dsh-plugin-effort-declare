/**
 * Client Remote faces this page actually calls (DSH 0.1.2).
 * Shapes match the generated Host descriptors, not the removed IApiClient.
 */
import type { SettingsDescribeFace } from '@deepseek-ai/dsh-client-ui-settings/client'
import type { ProviderDirectoryEntry } from '../core/filter.ts'
import type { PathOp } from '../core/path-ops.ts'

/** Gateway envelope for a successful Remote call. */
export type RemoteOk<T> = { ok: true; value: T }

/** Gateway envelope for a failed Remote call. */
export type RemoteErr = { ok: false; error: { code: string; message: string } }

export type RemoteResult<T> = RemoteOk<T> | RemoteErr

/**
 * `llm.listConfigurableProviders` — generated
 * `@deepseek-ai/dsh-llm#llm/listConfigurableProviders`.
 * `value` is the directory array (no `{ providers }` wrapper).
 */
export interface LlmDirectoryRemote {
  listConfigurableProviders(): Promise<RemoteResult<readonly ProviderDirectoryEntry[]>>
}

type NamespaceView = Parameters<SettingsDescribeFace['acceptView']>[0]

/**
 * `settings.mutate` — generated
 * `@deepseek-ai/dsh-api-settings-controller#settings/mutate`.
 * Conflict code is `settings/conflict`.
 */
export interface SettingsWriteRemote {
  mutate(
    ns: string,
    ops: readonly PathOp[],
    expectedRevision: number | undefined,
  ): Promise<RemoteResult<NamespaceView>>
}
