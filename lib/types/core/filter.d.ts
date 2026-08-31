/** Directory row from `llm.listConfigurableProviders()` (the fields v1 filtering reads). */
export interface ProviderDirectoryEntry {
    provider: string;
    displayName?: string;
    settingsNs?: string;
    settingsPath?: readonly string[];
    declared?: boolean;
    active?: boolean;
}
/**
 * Resolve the wire protocol for a route.
 * User/effective `api` wins; then schema default; then openai-completions.
 */
export declare function resolveRouteApi(profile: unknown, schemaDefault: string | undefined): string;
export interface EditableDecision {
    editable: boolean;
    reason?: 'not-pi-ai' | 'official-deepseek' | 'catalog' | 'not-completions';
}
/**
 * v1 editable routes: hand-declared llm-pi-ai openai-completions.
 * Catalog routes are excluded (writing `models` replaces the whole catalog).
 */
export declare function classifyRoute(entry: ProviderDirectoryEntry, profile: unknown, schemaDefaultApi?: string): EditableDecision;
/** Profile object at `providers.<route>` from an llm-pi-ai section value. */
export declare function profileAt(section: unknown, settingsPath: readonly string[] | undefined, provider: string): unknown;
/** String choices from a schemastery union node (`type: 'union'`). */
export declare function unionStringChoices(node: unknown): string[];
//# sourceMappingURL=filter.d.ts.map