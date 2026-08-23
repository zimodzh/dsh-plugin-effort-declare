/**
 * Plugin footer attribution. Version and end-year are frozen into the client
 * bundle at pack time; this module only formats the line.
 */
/** First publication year (LICENSE). Not the user's wall clock. */
export declare const COPYRIGHT_FROM = 2026;
export declare const COPYRIGHT_HOLDER = "Stardust";
/**
 * `0.1.2 © 2026 Stardust` or `0.1.2 © 2026–2027 Stardust`.
 * Throws if version is empty or `to < from` — a bad stamp must not render.
 */
export declare function formatAttribution(version: string, from: number, to: number): string;
//# sourceMappingURL=attribution.d.ts.map