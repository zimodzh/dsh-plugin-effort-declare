/**
 * Route-card draft merge: user-layer slices, namespace revision, dirty preserve.
 * No React — settings UI and tests share these helpers.
 */
import { profileAt } from "./filter.js";
import { buildSaveOps } from "./path-ops.js";
import { cloneModels, cloneObject, isPlainObject } from "./paths.js";
/** JSON-stable equality matching pathOps (key order included). */
export function sliceEqual(left, right) {
    return JSON.stringify(left) === JSON.stringify(right);
}
/** Whether two settings slices differ. */
export function sliceChanged(before, after) {
    return !sliceEqual(before, after);
}
/** Build a draft from the stored user subtree (never from effective `value`). */
export function routeDraftFromUserProfile(args) {
    const { provider, displayName, settingsPath, revision, userProfile } = args;
    const models = cloneModels(isPlainObject(userProfile) ? userProfile.models : []);
    const compatPresent = isPlainObject(userProfile) && 'compat' in userProfile && isPlainObject(userProfile.compat);
    const compat = cloneObject(isPlainObject(userProfile) ? userProfile.compat : {});
    return {
        provider,
        displayName,
        settingsPath: [...settingsPath],
        revision,
        models,
        originalModels: cloneModels(models),
        compat,
        originalCompat: cloneObject(compat),
        compatPresent,
    };
}
/** Dirty iff pathOps would emit something (same comparison as save). */
export function draftDirty(draft) {
    return buildSaveOps({
        settingsPath: draft.settingsPath,
        beforeModels: draft.originalModels,
        afterModels: draft.models,
        beforeCompat: draft.compatPresent ? draft.originalCompat : undefined,
        afterCompat: draft.compat,
    }).length > 0;
}
/** Treat the current models/compat as the committed originals (no-op save). */
export function alignDraft(draft) {
    return {
        ...draft,
        originalModels: cloneModels(draft.models),
        originalCompat: cloneObject(draft.compat),
        compatPresent: Object.keys(draft.compat).length > 0 ? true : draft.compatPresent,
    };
}
/** Fold a successful mutate view: saved card realigns; every card gets the new revision. */
export function applySaveSuccess(drafts, savedProvider, slice) {
    return drafts.map((draft) => {
        if (draft.provider !== savedProvider) {
            return { ...draft, revision: slice.revision };
        }
        const userProfile = profileAt(slice.user, draft.settingsPath, draft.provider);
        return routeDraftFromUserProfile({
            provider: draft.provider,
            displayName: draft.displayName,
            settingsPath: draft.settingsPath,
            revision: slice.revision,
            userProfile,
        });
    });
}
function modelRowId(row) {
    return String(row.id);
}
function indexById(rows) {
    const map = new Map();
    for (const row of rows) {
        const id = modelRowId(row);
        if (!map.has(id))
            map.set(id, row);
    }
    return map;
}
/** Model-row fields this page edits; other keys follow the Models page. */
export const MODEL_OVERLAY_KEYS = ['reasoningEfforts', 'input'];
function fieldPresence(row, key) {
    if (row === undefined || !Object.hasOwn(row, key)) {
        return { present: false, value: undefined };
    }
    return { present: true, value: row[key] };
}
function fieldEqual(left, right, key) {
    const a = fieldPresence(left, key);
    const b = fieldPresence(right, key);
    if (a.present !== b.present)
        return false;
    if (!a.present)
        return true;
    return sliceEqual(a.value, b.value);
}
function overlayLocalFields(incomingRow, prevRow, keys) {
    const next = structuredClone(incomingRow);
    for (const key of keys) {
        if (Object.hasOwn(prevRow, key))
            next[key] = structuredClone(prevRow[key]);
        else
            delete next[key];
    }
    return next;
}
function objectKeyChanged(left, right, key) {
    const leftHas = Object.hasOwn(left, key);
    const rightHas = Object.hasOwn(right, key);
    if (leftHas !== rightHas)
        return true;
    if (!leftHas)
        return false;
    return sliceChanged(left[key], right[key]);
}
/**
 * Membership follows the latest user-layer models list (Models page add/delete).
 * Local unsaved overlay keys (including a cleared key) overlay by id; other
 * fields on the row follow incoming.
 */
export function mergeModelsById(args) {
    const prevById = indexById(args.prevModels);
    const prevOrigById = indexById(args.prevOriginal);
    const incomingOrigById = indexById(args.incomingOriginal);
    const incomingIds = new Set(args.incomingModels.map(modelRowId));
    let conflicted = false;
    const models = args.incomingModels.map((incomingRow) => {
        const id = modelRowId(incomingRow);
        const prevRow = prevById.get(id);
        if (prevRow === undefined)
            return structuredClone(incomingRow);
        const prevOrig = prevOrigById.get(id);
        const dirtyKeys = MODEL_OVERLAY_KEYS.filter(key => !fieldEqual(prevRow, prevOrig, key));
        if (dirtyKeys.length === 0)
            return structuredClone(incomingRow);
        const incomingOrig = incomingOrigById.get(id);
        for (const key of dirtyKeys) {
            if (!fieldEqual(prevOrig, incomingOrig, key))
                conflicted = true;
        }
        return overlayLocalFields(incomingRow, prevRow, dirtyKeys);
    });
    for (const [id, prevRow] of prevById) {
        if (incomingIds.has(id))
            continue;
        const prevOrig = prevOrigById.get(id);
        const dirtyKeys = MODEL_OVERLAY_KEYS.filter(key => !fieldEqual(prevRow, prevOrig, key));
        if (dirtyKeys.length === 0)
            continue;
        const incomingOrig = incomingOrigById.get(id);
        for (const key of dirtyKeys) {
            if (!fieldEqual(prevOrig, incomingOrig, key))
                conflicted = true;
        }
    }
    return { models, conflicted };
}
/**
 * Three-way compat merge: locally changed keys stay local; everything else
 * follows incoming. Conflict only when a locally dirty key also moved in originals.
 */
export function mergeCompat(args) {
    if (!sliceChanged(args.prev, args.prevOriginal)) {
        return { compat: cloneObject(args.incoming), conflicted: false };
    }
    const compat = cloneObject(args.incoming);
    let conflicted = false;
    const keys = new Set([...Object.keys(args.prev), ...Object.keys(args.prevOriginal)]);
    for (const key of keys) {
        if (!objectKeyChanged(args.prev, args.prevOriginal, key))
            continue;
        if (objectKeyChanged(args.prevOriginal, args.incomingOriginal, key))
            conflicted = true;
        if (Object.hasOwn(args.prev, key))
            compat[key] = structuredClone(args.prev[key]);
        else
            delete compat[key];
    }
    return { compat, conflicted };
}
/**
 * Apply a freshly loaded table. Membership and metadata follow incoming;
 * unsaved overlay keys (`reasoningEfforts`, `input`) / dirty compat keys
 * overlay by id. Conflict only when a locally dirty field also changed in
 * originals (revision-only bumps and sibling-card saves do not warn).
 */
export function mergeLoadedDrafts(current, incoming, options) {
    const currentByProvider = new Map(current.map(draft => [draft.provider, draft]));
    const conflicted = [];
    const drafts = incoming.map((next) => {
        const prev = currentByProvider.get(next.provider);
        if (prev === undefined || !options.preserveDirty || !draftDirty(prev))
            return next;
        const modelsMerge = mergeModelsById({
            prevModels: prev.models,
            prevOriginal: prev.originalModels,
            incomingModels: next.models,
            incomingOriginal: next.originalModels,
        });
        const compatMerge = mergeCompat({
            prev: prev.compat,
            prevOriginal: prev.originalCompat,
            incoming: next.compat,
            incomingOriginal: next.originalCompat,
        });
        if (modelsMerge.conflicted || compatMerge.conflicted)
            conflicted.push(next.provider);
        return {
            provider: next.provider,
            displayName: next.displayName,
            settingsPath: next.settingsPath,
            revision: next.revision,
            models: modelsMerge.models,
            originalModels: cloneModels(next.originalModels),
            compat: compatMerge.compat,
            originalCompat: cloneObject(next.originalCompat),
            compatPresent: next.compatPresent,
        };
    });
    return { drafts, conflicted };
}
/** Increment a generation counter; callers discard stale async settlements. */
export function nextGeneration(holder) {
    holder.current += 1;
    return holder.current;
}
/** Whether `generation` is still the latest issued token. */
export function generationIsCurrent(holder, generation) {
    return holder.current === generation;
}
/** Keep a stored thinkingFormat visible even if the schema union omitted it. */
export function thinkingFormatChoices(formats, current) {
    if (typeof current === 'string' && current.length > 0 && !formats.includes(current)) {
        return [current, ...formats];
    }
    return [...formats];
}
