/**
 * Settings section: per-model reasoningEfforts + openai-completions compat
 * for hand-declared llm-pi-ai routes.
 */
import { type ReactNode } from 'react';
import type { IApiClient } from '@deepseek-ai/dsh-api-remotes/client';
import type { SettingsDescribeFace } from '@deepseek-ai/dsh-client-ui-settings/client';
import type { SchemaOps } from './schema-ops.ts';
import type { EffortDeclareKey } from './locales.ts';
export interface EffortDeclareSectionInjected {
    api: Pick<IApiClient, 'settings' | 'llm'>;
    describe: SettingsDescribeFace;
    schema: SchemaOps;
    t: (key: EffortDeclareKey) => string;
    onInvalidate: (listener: () => void) => () => void;
}
export interface EffortDeclareSectionProps extends Partial<EffortDeclareSectionInjected> {
    t: (key: EffortDeclareKey) => string;
    close: () => void;
}
interface RouteDraft {
    provider: string;
    displayName: string;
    revision: number;
    models: Record<string, unknown>[];
    originalModels: Record<string, unknown>[];
    compat: Record<string, unknown>;
    originalCompat: Record<string, unknown>;
    compatPresent: boolean;
}
/**
 * Load editable route drafts from llm.providers + the llm-pi-ai namespace.
 */
export declare function loadDrafts(api: Pick<IApiClient, 'llm'>, describe: SettingsDescribeFace, schema: SchemaOps): Promise<{
    writable: boolean;
    formats: string[];
    drafts: RouteDraft[];
    error?: string;
}>;
export declare function EffortDeclareSection(props: EffortDeclareSectionProps): ReactNode;
export {};
//# sourceMappingURL=EffortDeclareSection.d.ts.map