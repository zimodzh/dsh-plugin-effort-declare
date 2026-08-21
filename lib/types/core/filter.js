import { DEEPSEEK_OFFICIAL, LLM_DEEPSEEK_NS, LLM_PI_AI_NS, OPENAI_COMPLETIONS, } from "./catalog.js";
import { getPath, isPlainObject } from "./paths.js";
/**
 * Resolve the wire protocol for a route.
 * User/effective `api` wins; then schema default; then openai-completions.
 */
export function resolveRouteApi(profile, schemaDefault) {
    if (isPlainObject(profile) && typeof profile.api === 'string' && profile.api.length > 0) {
        return profile.api;
    }
    if (schemaDefault !== undefined && schemaDefault.length > 0)
        return schemaDefault;
    return OPENAI_COMPLETIONS;
}
/**
 * v1 editable routes: hand-declared llm-pi-ai openai-completions.
 * Catalog routes are excluded (writing `models` replaces the whole catalog).
 */
export function classifyRoute(entry, profile, schemaDefaultApi) {
    if (entry.provider === DEEPSEEK_OFFICIAL || entry.settingsNs === LLM_DEEPSEEK_NS) {
        return { editable: false, reason: 'official-deepseek' };
    }
    if (entry.settingsNs !== LLM_PI_AI_NS) {
        return { editable: false, reason: 'not-pi-ai' };
    }
    if (entry.declared !== true) {
        return { editable: false, reason: 'catalog' };
    }
    const api = resolveRouteApi(profile, schemaDefaultApi);
    if (api !== OPENAI_COMPLETIONS) {
        return { editable: false, reason: 'not-completions' };
    }
    return { editable: true };
}
/** Profile object at `providers.<route>` from an llm-pi-ai section value. */
export function profileAt(section, settingsPath, provider) {
    const path = settingsPath !== undefined && settingsPath.length > 0
        ? settingsPath
        : ['providers', provider];
    return getPath(section, path);
}
/** String choices from a schemastery union node (`type: 'union'`). */
export function unionStringChoices(node) {
    if (!isPlainObject(node) || node.type !== 'union' || !Array.isArray(node.list))
        return [];
    return node.list
        .map((entry) => (isPlainObject(entry) ? entry.value : undefined))
        .filter((value) => typeof value === 'string');
}
