/**
 * Route-card draft merge: user-layer slices, namespace revision, dirty preserve.
 * No React — settings UI and tests share these helpers.
 */
import { profileAt } from "./filter.js";
import { buildSaveOps } from "./path-ops.js";
import { cloneModels, cloneObject, isPlainObject } from "./paths.js";
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
/**
 * Apply a freshly loaded table. Dirty cards keep models/compat; originals and
 * revision follow the incoming snapshot so a later save is against the new user layer.
 */
export function mergeLoadedDrafts(current, incoming, options) {
    const currentByProvider = new Map(current.map(draft => [draft.provider, draft]));
    const conflicted = [];
    const drafts = incoming.map((next) => {
        const prev = currentByProvider.get(next.provider);
        if (prev === undefined || !options.preserveDirty || !draftDirty(prev))
            return next;
        conflicted.push(next.provider);
        return {
            ...prev,
            displayName: next.displayName,
            settingsPath: next.settingsPath,
            revision: next.revision,
            originalModels: cloneModels(next.originalModels),
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
