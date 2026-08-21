/** Editable llm-pi-ai route as the settings section holds it. */
export interface RouteDraft {
    provider: string;
    displayName: string;
    /** Path inside the llm-pi-ai section (`llm.providers[].settingsPath`). */
    settingsPath: readonly string[];
    /** Namespace revision (one value for the whole llm-pi-ai document). */
    revision: number;
    models: Record<string, unknown>[];
    originalModels: Record<string, unknown>[];
    compat: Record<string, unknown>;
    originalCompat: Record<string, unknown>;
    /** Whether `compat` is present on the user profile (not the effective view). */
    compatPresent: boolean;
}
/** Build a draft from the stored user subtree (never from effective `value`). */
export declare function routeDraftFromUserProfile(args: {
    provider: string;
    displayName: string;
    settingsPath: readonly string[];
    revision: number;
    userProfile: unknown;
}): RouteDraft;
/** Dirty iff pathOps would emit something (same comparison as save). */
export declare function draftDirty(draft: RouteDraft): boolean;
/** Treat the current models/compat as the committed originals (no-op save). */
export declare function alignDraft(draft: RouteDraft): RouteDraft;
/** Fold a successful mutate view: saved card realigns; every card gets the new revision. */
export declare function applySaveSuccess(drafts: readonly RouteDraft[], savedProvider: string, slice: {
    user: unknown;
    revision: number;
}): RouteDraft[];
/**
 * Apply a freshly loaded table. Dirty cards keep models/compat; originals and
 * revision follow the incoming snapshot so a later save is against the new user layer.
 */
export declare function mergeLoadedDrafts(current: readonly RouteDraft[], incoming: readonly RouteDraft[], options: {
    preserveDirty: boolean;
}): {
    drafts: RouteDraft[];
    conflicted: string[];
};
/** Increment a generation counter; callers discard stale async settlements. */
export declare function nextGeneration(holder: {
    current: number;
}): number;
/** Whether `generation` is still the latest issued token. */
export declare function generationIsCurrent(holder: {
    current: number;
}, generation: number): boolean;
/** Keep a stored thinkingFormat visible even if the schema union omitted it. */
export declare function thinkingFormatChoices(formats: readonly string[], current: unknown): string[];
//# sourceMappingURL=drafts.d.ts.map