import { LLM_PI_AI_NS, SCHEMA_PROBE_ROUTE, } from "../core/catalog.js";
import { routeDraftFromUserProfile } from "../core/drafts.js";
import { classifyRoute, profileAt, unionStringChoices } from "../core/filter.js";
import { isPlainObject } from "../core/paths.js";
function schemaDefaultString(node) {
    if (!isPlainObject(node) || !isPlainObject(node.meta))
        return undefined;
    return typeof node.meta.default === 'string' ? node.meta.default : undefined;
}
/** Namespace revision on a describe snapshot, if that row exists. */
export function namespaceRevision(snapshot, ns) {
    return snapshot.view?.namespaces.find(view => view.ns === ns)?.revision;
}
/**
 * True when `incoming` is the Host echo of a mutate this page already folded,
 * or an older revision the snapshot has already passed. `echoed` is undefined
 * until the first successful write.
 */
export function isOwnDocumentEcho(echoed, incoming) {
    return echoed !== undefined && incoming <= echoed;
}
/**
 * After a preserve-dirty reload: conflicted cards get a conflict notice;
 * live cards drop leftover conflict/error; saved notices stay; gone cards drop.
 */
export function foldReloadNotices(current, args) {
    const live = new Set(args.liveProviders);
    const conflicted = new Set(args.conflicted);
    const next = {};
    for (const [provider, notice] of Object.entries(current)) {
        if (!live.has(provider))
            continue;
        if (conflicted.has(provider))
            continue;
        if (notice.kind === 'conflict' || notice.kind === 'error')
            continue;
        next[provider] = notice;
    }
    for (const provider of args.conflicted) {
        next[provider] = args.conflictNotice;
    }
    return next;
}
function waitUntil(describe, predicate, signal) {
    if (signal?.aborted)
        return Promise.resolve(false);
    if (predicate())
        return Promise.resolve(true);
    return new Promise((resolve) => {
        let settled = false;
        const finish = (ok) => {
            if (settled)
                return;
            settled = true;
            stop();
            signal?.removeEventListener('abort', onAbort);
            resolve(ok);
        };
        const onAbort = () => { finish(false); };
        const stop = describe.subscribe(() => {
            if (predicate())
                finish(true);
        });
        signal?.addEventListener('abort', onAbort);
        if (predicate())
            finish(true);
        else if (signal?.aborted)
            finish(false);
    });
}
/** Resolve when the mirror's namespace revision is at least `revision`, or abort. */
export async function waitForNamespaceRevision(describe, ns, revision, signal) {
    const matched = await waitUntil(describe, () => {
        const current = namespaceRevision(describe.getSnapshot(), ns);
        return current !== undefined && current >= revision;
    }, signal);
    return matched ? 'matched' : 'aborted';
}
/** Resolve when the namespace revision differs from `previous`, or abort. */
export async function waitForNamespaceRevisionChange(describe, ns, previous, signal) {
    const changed = await waitUntil(describe, () => {
        const current = namespaceRevision(describe.getSnapshot(), ns);
        return current !== undefined && current !== previous;
    }, signal);
    return changed ? 'changed' : 'aborted';
}
async function assembleDrafts(api, describe, schema) {
    const mirrored = describe.getSnapshot();
    if (mirrored.view === undefined) {
        return { writable: false, formats: [], drafts: [], error: mirrored.error ?? undefined };
    }
    const providersResponse = await api.llm.providers({});
    if (!providersResponse.result.ok) {
        return {
            writable: mirrored.view.writable,
            formats: [],
            drafts: [],
            error: providersResponse.result.error.message,
        };
    }
    const namespaces = new Map(mirrored.view.namespaces.map((view) => [view.ns, view]));
    const pi = namespaces.get(LLM_PI_AI_NS);
    let formats = [];
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
            // Live schema walk is best-effort; UI options stay empty rather than a handwritten list.
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
/**
 * `ensure`: first paint / idle recovery (official ensure only reads from idle).
 * `snapshot`: refresh after the mirror revision already moved — do not ensure.
 */
export async function loadDrafts(api, describe, schema, mode = 'ensure') {
    if (mode === 'ensure')
        await describe.ensure();
    return assembleDrafts(api, describe, schema);
}
