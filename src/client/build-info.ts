/**
 * Footer line frozen into the client bundle. Do not read the clock or
 * package.json at DSH startup — host apply is empty and the settings page
 * runs in the browser.
 */
import { COPYRIGHT_FROM, formatAttribution } from '../core/attribution.ts'

export const PLUGIN_FOOTER_TEXT = formatAttribution(
  __PLUGIN_VERSION__,
  COPYRIGHT_FROM,
  __COPYRIGHT_TO__,
)
