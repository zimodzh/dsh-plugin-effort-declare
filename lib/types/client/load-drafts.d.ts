/**
 * Load editable route drafts from llm.providers + the llm-pi-ai namespace.
 * Drafts come from the user layer; route protocol classification may use effective value.
 */
import type { IApiClient } from '@deepseek-ai/dsh-api-remotes/client';
import type { SettingsDescribeFace } from '@deepseek-ai/dsh-client-ui-settings/client';
import { type RouteDraft } from '../core/drafts.ts';
import type { SchemaOps } from './schema-ops.ts';
export interface LoadDraftsResult {
    writable: boolean;
    formats: string[];
    drafts: RouteDraft[];
    error?: string;
}
/**
 * First paint: `ensure()` (reads only from idle). Never treat ensure as refresh.
 * Callers that must not apply a stale settlement compare generation themselves.
 */
export declare function loadDrafts(api: Pick<IApiClient, 'llm'>, describe: Pick<SettingsDescribeFace, 'ensure' | 'getSnapshot'>, schema: SchemaOps): Promise<LoadDraftsResult>;
//# sourceMappingURL=load-drafts.d.ts.map