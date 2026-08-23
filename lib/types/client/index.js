import { EffortDeclareSection } from "./EffortDeclareSection.js";
import { bindSchema } from "./schema-ops.js";
import { LLM_PI_AI_NS } from "../core/catalog.js";
import { NS, en, zh } from "./locales.js";
import { cssTagId, cssText } from './effort-declare.module.css';
export const inject = ['slots', 'locale', 'connection', 'remote', 'settingsScope', 'settingsSchema'];
const PLUGIN_ID = 'dsh-plugin-effort-declare';
function mountPluginCss() {
    if (typeof document === 'undefined')
        return () => { };
    const selector = `style[data-plugin-css=${JSON.stringify(cssTagId)}]`;
    let tag = document.querySelector(selector);
    if (tag === null) {
        tag = document.createElement('style');
        tag.dataset.plugin = PLUGIN_ID;
        tag.dataset.pluginCss = cssTagId;
        document.head.appendChild(tag);
    }
    tag.textContent = cssText;
    return () => { tag?.remove(); };
}
export function apply(ctx) {
    ctx.effect(() => ctx.locale.register(NS, { zh, en }), `${PLUGIN_ID}: dictionaries`);
    ctx.effect(() => mountPluginCss(), `${PLUGIN_ID}: css`);
    const connection = ctx.get('connection');
    const settingsSchema = ctx.settingsSchema;
    const schema = bindSchema({
        rehydrate: serialized => settingsSchema.rehydrate(serialized),
        nodeAtPath: (root, path) => settingsSchema.nodeAtPath(root, path),
        getPath: (value, path) => settingsSchema.getPath(value, path),
        hasPath: (value, path) => settingsSchema.hasPath(value, path),
        validate: (node, draft) => settingsSchema.validate(node, draft),
    });
    const t = ctx.locale.bind(NS);
    const describe = ctx.settingsScope.describe();
    const invalidation = new Set();
    ctx.effect(() => {
        const emit = (event) => {
            for (const listener of invalidation)
                listener(event);
        };
        // Mirror subscribe fires on every namespace (theme, locale, own acceptView).
        // Only fold writable from that. llm-pi-ai document changes come from
        // settings/document-updated; the section waits until the mirror revision
        // has caught up instead of calling ensure(), and skips the echo of its
        // own mutate. connection/reset uses ensure() so an in-flight load is awaited.
        const disposers = [
            describe.subscribe(() => { emit({ source: 'writable' }); }),
            ctx.remote.$on('settings/document-updated', (ns, revision) => {
                if (ns !== LLM_PI_AI_NS)
                    return;
                emit({ source: 'settings', revision });
            }),
            ctx.remote.$on('llm/adapters-updated', () => { emit({ source: 'directory' }); }),
            ctx.on('connection/reset', () => { emit({ source: 'reset' }); }),
        ];
        return () => {
            for (const dispose of disposers)
                dispose();
        };
    }, `${PLUGIN_ID}: invalidations`);
    const subscribeInvalidate = (listener) => {
        invalidation.add(listener);
        return () => { invalidation.delete(listener); };
    };
    ctx.slots.inject('settings.section', () => ctx.slots.register({
        name: 'settings.section',
        id: 'effort-declare',
        order: 12,
        label: () => t('nav'),
        locale: NS,
        inject: () => ({
            api: connection.api,
            describe,
            schema,
            subscribeInvalidate,
        }),
    }, EffortDeclareSection));
}
