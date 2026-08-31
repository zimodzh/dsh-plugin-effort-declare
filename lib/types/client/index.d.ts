/**
 * dsh-plugin-effort-declare — browser half: settings.section for per-model
 * reasoning effort declarations.
 */
import type { Context } from '@deepseek-ai/cordis';
import type { SlotCore } from '@deepseek-ai/dsh-client-ui-slots';
import { type EffortDeclareKey } from './locales.ts';
declare module '@deepseek-ai/dsh-client-ui-slots' {
    interface LocaleNamespaceMap {
        /** Effort-declare settings section copy. */
        'plugin-effort-declare': EffortDeclareKey;
    }
}
/**
 * `slots` and `connection/reset` are provided by the unpublished
 * dsh-client-runtime wrapper. 0.1.2-alpha.2 did not publish that package;
 * the shapes match the official models page and SlotCore.
 */
declare module '@deepseek-ai/cordis' {
    interface Events {
        /**
         * A connection generation was (re-)established. Wire-derived caches must
         * treat their state as stale and repull.
         * @mode emit
         */
        'connection/reset'(): void;
    }
    interface Context {
        slots: SlotCore & {
            inject(name: string, factory: () => unknown): unknown;
        };
    }
}
export declare const inject: string[];
export declare function apply(ctx: Context): void;
//# sourceMappingURL=index.d.ts.map