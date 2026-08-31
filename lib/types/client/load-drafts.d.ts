/**
 * Load editable route drafts from llm.listConfigurableProviders + the llm-pi-ai namespace.
 * Drafts come from the user layer; route protocol classification may use effective value.
 *
 * First paint uses `ensure()` (idle-only). Refresh never calls `ensure()`:
 * wait until the mirror subscribe shows a namespace revision at least as new
 * as the Host event, then `getSnapshot()`. Own mutate echoes are identified
 * by revision (including older delayed echoes), not ignored as a generic
 * document-updated.
 */
import type { SettingsDescribeFace } from '@deepseek-ai/dsh-client-ui-settings/client';
import type { LlmDirectoryRemote } from './remotes.ts';
import { type RouteDraft } from '../core/drafts.ts';
import type { SchemaOps } from './schema-ops.ts';
export interface LoadDraftsResult {
    writable: boolean;
    formats: string[];
    drafts: RouteDraft[];
    error?: string;
}
export type LoadDraftsMode = 'ensure' | 'snapshot';
type MirrorSnapshot = ReturnType<SettingsDescribeFace['getSnapshot']>;
type MirrorDescribe = Pick<SettingsDescribeFace, 'getSnapshot' | 'subscribe'>;
/** Namespace revision on a describe snapshot, if that row exists. */
export declare function namespaceRevision(snapshot: MirrorSnapshot, ns: string): number | undefined;
/**
 * True when `incoming` is the Host echo of a mutate this page already folded,
 * or an older revision the snapshot has already passed. `echoed` is undefined
 * until the first successful write.
 */
export declare function isOwnDocumentEcho(echoed: number | undefined, incoming: number): boolean;
/**
 * After a preserve-dirty reload: conflicted cards get a conflict notice;
 * live cards drop leftover conflict/error; saved notices stay; gone cards drop.
 */
export declare function foldReloadNotices<T extends {
    kind: string;
}>(current: Record<string, T>, args: {
    conflicted: readonly string[];
    conflictNotice: T;
    liveProviders: readonly string[];
}): Record<string, T>;
/** Resolve when the mirror's namespace revision is at least `revision`, or abort. */
export declare function waitForNamespaceRevision(describe: MirrorDescribe, ns: string, revision: number, signal?: AbortSignal): Promise<'matched' | 'aborted'>;
/** Resolve when the namespace revision differs from `previous`, or abort. */
export declare function waitForNamespaceRevisionChange(describe: MirrorDescribe, ns: string, previous: number, signal?: AbortSignal): Promise<'changed' | 'aborted'>;
/**
 * `ensure`: first paint / idle recovery (official ensure only reads from idle).
 * `snapshot`: refresh after the mirror revision already moved — do not ensure.
 */
export declare function loadDrafts(llm: LlmDirectoryRemote, describe: Pick<SettingsDescribeFace, 'ensure' | 'getSnapshot'>, schema: SchemaOps, mode?: LoadDraftsMode): Promise<LoadDraftsResult>;
export {};
//# sourceMappingURL=load-drafts.d.ts.map