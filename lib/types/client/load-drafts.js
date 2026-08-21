import { FALLBACK_THINKING_FORMATS, LLM_PI_AI_NS, SCHEMA_PROBE_ROUTE, } from "../core/catalog.js";
import { routeDraftFromUserProfile } from "../core/drafts.js";
import { classifyRoute, profileAt, unionStringChoices } from "../core/filter.js";
import { isPlainObject } from "../core/paths.js";
function schemaDefaultString(node) {
    if (!isPlainObject(node) || !isPlainObject(node.meta))
        return undefined;
    return typeof node.meta.default === 'string' ? node.meta.default : undefined;
}
/**
 * First paint: `ensure()` (reads only from idle). Never treat ensure as refresh.
 * Callers that must not apply a stale settlement compare generation themselves.
 */
export async function loadDrafts(api, describe, schema) {
    await describe.ensure();
    const mirrored = describe.getSnapshot();
    if (mirrored.view === undefined) {
        return { writable: false, formats: [...FALLBACK_THINKING_FORMATS], drafts: [], error: mirrored.error ?? undefined };
    }
    const providersResponse = await api.llm.providers({});
    if (!providersResponse.result.ok) {
        return {
            writable: mirrored.view.writable,
            formats: [...FALLBACK_THINKING_FORMATS],
            drafts: [],
            error: providersResponse.result.error.message,
        };
    }
    const namespaces = new Map(mirrored.view.namespaces.map((view) => [view.ns, view]));
    const pi = namespaces.get(LLM_PI_AI_NS);
    let formats = [...FALLBACK_THINKING_FORMATS];
    let schemaDefaultApi;
    if (pi !== undefined) {
        try {
            const root = schema.rehydrate(pi.schema);
            const formatNode = schema.nodeAtPath(root, ['providers', SCHEMA_PROBE_ROUTE, 'compat', 'thinkingFormat']);
            const fromSchema = unionStringChoices(formatNode);
            if (fromSchema.length > 0)
                formats = fromSchema;
            schemaDefaultApi = schemaDefaultString(schema.nodeAtPath(root, ['providers', SCHEMA_PROBE_ROUTE, 'api']));
        }
        catch {
            // Live schema walk is best-effort; fallback list is test-pinned.
        }
    }
    const drafts = [];
    for (const entry of providersResponse.result.value.providers) {
        const settingsPath = entry.settingsPath !== undefined && entry.settingsPath.length > 0
            ? [...entry.settingsPath]
            : ['providers', entry.provider];
        const effective = profileAt(pi?.value, settingsPath, entry.provider);
        if (!classifyRoute(entry, effective, schemaDefaultApi).editable)
            continue;
        drafts.push(routeDraftFromUserProfile({
            provider: entry.provider,
            displayName: entry.displayName ?? entry.provider,
            settingsPath,
            revision: pi?.revision ?? 0,
            userProfile: profileAt(pi?.user, settingsPath, entry.provider),
        }));
    }
    return { writable: mirrored.view.writable, formats, drafts };
}
