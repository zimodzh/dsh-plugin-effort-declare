/**
 * Plugin footer attribution. Version and end-year are frozen into the client
 * bundle at pack time; this module only formats the line.
 */

/** First publication year (LICENSE). Not the user's wall clock. */
export const COPYRIGHT_FROM = 2026

export const COPYRIGHT_HOLDER = 'Stardust'

/**
 * `0.1.2 © 2026 Stardust` or `0.1.2 © 2026–2027 Stardust`.
 * Throws if version is empty or `to < from` — a bad stamp must not render.
 */
export function formatAttribution(version: string, from: number, to: number): string {
  if (version.trim() === '') {
    throw new Error('plugin version must be a non-empty string')
  }
  if (!Number.isInteger(from) || !Number.isInteger(to) || to < from) {
    throw new Error(`invalid copyright range: ${String(from)}\u2013${String(to)}`)
  }
  const years = to === from ? String(from) : `${String(from)}\u2013${String(to)}`
  return `${version} \u00a9 ${years} ${COPYRIGHT_HOLDER}`
}
