/**
 * Settings section: per-model reasoningEfforts + openai-completions compat
 * for hand-declared llm-pi-ai routes.
 */
import { type ReactNode } from 'react';
import type { IApiClient } from '@deepseek-ai/dsh-api-remotes/client';
import type { SettingsDescribeFace } from '@deepseek-ai/dsh-client-ui-settings/client';
import { type SchemaOps } from './schema-ops.ts';
import type { EffortDeclareKey } from './locales.ts';
export type InvalidationSource = 'settings' | 'directory' | 'reset' | 'writable';
export type Invalidation = {
    source: 'writable';
} | {
    source: 'directory';
} | {
    source: 'reset';
} | {
    source: 'settings';
    revision: number;
};
export interface EffortDeclareSectionInjected {
    api: Pick<IApiClient, 'settings' | 'llm'>;
    describe: SettingsDescribeFace;
    schema: SchemaOps;
    subscribeInvalidate: (listener: (event: Invalidation) => void) => () => void;
}
export interface EffortDeclareSectionProps extends Partial<EffortDeclareSectionInjected> {
    t: (key: EffortDeclareKey) => string;
    close: () => void;
}
export { loadDrafts } from './load-drafts.ts';
export declare function EffortDeclareSection(props: EffortDeclareSectionProps): ReactNode;
//# sourceMappingURL=EffortDeclareSection.d.ts.map