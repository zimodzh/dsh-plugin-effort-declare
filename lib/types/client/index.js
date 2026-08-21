import { EffortDeclareSection } from "./EffortDeclareSection.js";
import { bindSchema } from "./schema-ops.js";
import { NS, en, zh } from "./locales.js";
export const inject = ['slots', 'locale', 'connection', 'remote', 'settingsScope', 'settingsSchema'];
const LOG = '[dsh-plugin-effort-declare]';
export function apply(ctx) {
    try {
        ctx.effect(() => ctx.locale.register(NS, { zh, en }), 'dsh-plugin-effort-declare: dictionaries');
        const connection = ctx.get('connection');
        const settingsSchema = ctx.settingsSchema;
        const schema = bindSchema({
            rehydrate: serialized => settingsSchema.rehydrate(serialized),
            nodeAtPath: (root, path) => settingsSchema.nodeAtPath(root, path),
            getPath: (value, path) => settingsSchema.getPath(value, path),
            hasPath: (value, path) => settingsSchema.hasPath(value, path),
        });
        const t = ctx.locale.bind(NS);
        const injected = () => ({
            api: connection.api,
            describe: ctx.settingsScope.describe(),
            schema,
            t,
            onInvalidate: (listener) => {
                const disposers = [
                    ctx.remote.$on('settings/document-updated', listener),
                    ctx.remote.$on('llm/adapters-updated', listener),
                    ctx.on('connection/reset', listener),
                ];
                return () => {
                    for (const dispose of disposers)
                        dispose();
                };
            },
        });
        ctx.slots.inject('settings.section', () => ctx.slots.register({
            name: 'settings.section',
            id: 'effort-declare',
            order: 15,
            label: () => t('nav'),
            locale: NS,
            inject: injected,
        }, EffortDeclareSection));
    }
    catch (error) {
        console.error(LOG, 'apply failed', error);
    }
}
