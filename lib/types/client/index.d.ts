/**
 * dsh-plugin-effort-declare — browser half: settings.section for per-model
 * reasoning effort declarations. Wiring failures are logged, never thrown —
 * a throwing apply takes down the whole web shell.
 */
import type { ClientContext } from '@deepseek-ai/dsh-client-runtime/client';
import { type EffortDeclareKey } from './locales.ts';
declare module '@deepseek-ai/dsh-client-ui-slots' {
    interface LocaleNamespaceMap {
        /** Effort-declare settings section copy. */
        'plugin-effort-declare': EffortDeclareKey;
    }
}
export declare const inject: string[];
export declare function apply(ctx: ClientContext): void;
//# sourceMappingURL=index.d.ts.map