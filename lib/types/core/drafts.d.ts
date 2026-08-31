/** Editable llm-pi-ai route as the settings section holds it. */
export interface RouteDraft {
    provider: string;
    displayName: string;
    /** Path inside the llm-pi-ai section (`listConfigurableProviders[].settingsPath`). */
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
/** JSON-stable equality matching pathOps (key order included). */
export declare function sliceEqual(left: unknown, right: unknown): boolean;
/** Whether two settings slices differ. */
export declare function sliceChanged(before: unknown, after: unknown): boolean;
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
/** Model-row fields this page edits; other keys follow the Models page. */
export declare const MODEL_OVERLAY_KEYS: readonly ["reasoningEfforts", "input"];
export type ModelOverlayKey = (typeof MODEL_OVERLAY_KEYS)[number];
/**
 * Membership follows the latest user-layer models list (Models page add/delete).
 * Local unsaved overlay keys (including a cleared key) overlay by id; other
 * fields on the row follow incoming.
 */
export declare function mergeModelsById(args: {
    prevModels: readonly Record<string, unknown>[];
    prevOriginal: readonly Record<string, unknown>[];
    incomingModels: readonly Record<string, unknown>[];
    incomingOriginal: readonly Record<string, unknown>[];
}): {
    models: Record<string, unknown>[];
    conflicted: boolean;
};
/**
 * Three-way compat merge: locally changed keys stay local; everything else
 * follows incoming. Conflict only when a locally dirty key also moved in originals.
 */
export declare function mergeCompat(args: {
    prev: Record<string, unknown>;
    prevOriginal: Record<string, unknown>;
    incoming: Record<string, unknown>;
    incomingOriginal: Record<string, unknown>;
}): {
    compat: Record<string, unknown>;
    conflicted: boolean;
};
/**
 * Apply a freshly loaded table. Membership and metadata follow incoming;
 * unsaved overlay keys (`reasoningEfforts`, `input`) / dirty compat keys
 * overlay by id. Conflict only when a locally dirty field also changed in
 * originals (revision-only bumps and sibling-card saves do not warn).
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