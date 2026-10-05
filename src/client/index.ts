/**
 * Aqua client plugin body: the toggleable glassmorphism skin. Owns the durable
 * enable flag (localStorage), applies/retracts the theme layer through
 * {@link AquaLayer}, and registers three settings surfaces:
 * - the master on/off card into the Plugins section (`settings.plugins.tab`,
 *   same shape as the other plugin cards);
 * - a compact enable toggle into the General section (`settings.general.item`,
 *   order 11.4, right under the built-in 字号大小 row which sits at 11);
 * - every glass knob into the General section's Appearance row area
 *   (`settings.general.item`, order 11.5, directly under the enable toggle).
 *
 * The fractional orders are deliberate: the host general section sorts by
 * `priority` then `order` (both numeric, stable), with 外观 = 10、字号大小 = 11
 * and other entries at 12+, so 11.4/11.5 lands the glass switch exactly under
 * 字号大小 without colliding with any built-in row.
 * One click on the master switch returns the stock UI (every layer is an
 * effect, disposed on flip).
 */
// dsh 0.1.5 移除 @deepseek-ai/dsh-client-runtime；客户端 Context 即 Cordis 的 Context。
import type { Context as ClientContext } from '@deepseek-ai/cordis'
import type { BoundActions } from '@deepseek-ai/dsh-client-ui-slots'
// Type-only: pulls the `settings.plugins.tab` SlotMap merge.
import type {} from '@deepseek-ai/dsh-client-ui-settings-plugins/client'
// Type-only: pulls the `settings.general.item` SlotMap merge.
import type {} from '@deepseek-ai/dsh-client-ui-settings/client'
import { AquaPluginCard, type AquaPluginCardInjected } from './AquaPluginCard.tsx'
import { AquaAppearanceRow, type AquaAppearanceRowInjected } from './AquaAppearanceRow.tsx'
import { AquaEnableRow, type AquaEnableRowInjected } from './AquaEnableRow.tsx'
import { createAquaRowStore, type AquaSettingsPayload } from './settings-store.ts'
import { en, NS, zh } from './locales.ts'
import { AquaLayer } from './theme-layer.ts'
// Side-effect imports: the theme-layer stylesheet (unloaded with the plugin)
// and the self-hosted Space Grotesk @font-face (no shell dependency).
import './aqua.module.css'
import './fonts.module.css'

/** Required services: theme override stack plus the settings-card surfaces. */
export const inject = ['theme', 'slots', 'locale']

/**
 * Client plugin body.
 * @param ctx - client cordis context.
 */
export function apply(ctx: ClientContext): void {
  ctx.effect(() => ctx.locale.register(NS, { zh, en }), 'ui-aqua: settings dictionaries')

  // The layer owns its lifecycle: enable flag, token stack, and CSS attribute
  // are all effects released on disable/dispose.
  const layer = new AquaLayer(ctx)

  // Two store mirrors of the same layer state: one for the Plugins card
  // (master switch) and one for the General section's Appearance row (knobs).
  const pluginStore = createAquaRowStore()
  const appearanceStore = createAquaRowStore()
  let pluginBound: BoundActions<typeof pluginStore> | undefined
  let appearanceBound: BoundActions<typeof appearanceStore> | undefined
  let revision = 0
  const payload = (): AquaSettingsPayload => {
    const s = layer.getSettings()
    return {
      enabled: layer.getEnabled(),
      mode: s.mode,
      blur: s.blur,
      frost: s.frost,
      fluidHue: s.fluidHue,
      bgBrightness: s.bgBrightness,
      dark: layer.getDark(),
      background: s.background,
      wallpaper: s.wallpaper,
      wallpaperBlur: s.wallpaperBlur,
      wallpaperFrost: s.wallpaperFrost,
    }
  }
  const sync = (): void => {
    const next = payload()
    pluginBound?.sync(next, revision)
    appearanceBound?.sync(next, revision)
    revision += 1
  }
  // The Appearance switch flips the brightness knob's half-range; re-sync
  // both stores so the row re-renders with the new range.
  ctx.effect(() => ctx.on('theme/change', () => { sync() }), 'ui-aqua: appearance scheme sync')

  const pluginInjected = (actions: BoundActions<typeof pluginStore>): AquaPluginCardInjected => {
    pluginBound = actions
    // Re-sync from the layer so no flip is lost between registration and
    // first render (the store's revision guard drops stale duplicates).
    sync()
    return {
      setEnabled: (enabled) => {
        layer.setEnabled(enabled)
        sync()
      },
    }
  }
  const appearanceInjected = (actions: BoundActions<typeof appearanceStore>): AquaAppearanceRowInjected => {
    appearanceBound = actions
    sync()
    return {
      setMode: (mode) => {
        layer.setMode(mode)
        sync()
      },
      setBlur: (blur) => {
        layer.setBlur(blur)
        sync()
      },
      setFrost: (frost) => {
        layer.setFrost(frost)
        sync()
      },
      setFluidHue: (fluidHue) => {
        layer.setFluidHue(fluidHue)
        sync()
      },
      setBgBrightness: (bgBrightness) => {
        layer.setBgBrightness(bgBrightness)
        sync()
      },
      setBackground: (background) => {
        layer.setBackground(background)
        sync()
      },
      setWallpaper: (wallpaper) => {
        layer.setWallpaper(wallpaper)
        sync()
      },
      setWallpaperBlur: (wallpaperBlur) => {
        layer.setWallpaperBlur(wallpaperBlur)
        sync()
      },
      setWallpaperFrost: (wallpaperFrost) => {
        layer.setWallpaperFrost(wallpaperFrost)
        sync()
      },
    }
  }
  const enableInjected = (actions: BoundActions<typeof appearanceStore>): AquaEnableRowInjected => {
    appearanceBound = actions
    sync()
    return {
      setEnabled: (enabled) => {
        layer.setEnabled(enabled)
        sync()
      },
    }
  }

  // Master switch card in the Plugins configurable tab.
  // dsh 0.2.0: the `settings.plugin.item` slot was removed; the plugins tab is
  // now `settings.plugins.tab` (see dsh-client-ui-settings-plugins).
  ctx.slots.inject('settings.plugins.tab', () => ctx.slots.register({
    name: 'settings.plugins.tab',
    id: 'aqua',
    key: NS,
    order: 5,
    store: pluginStore,
    locale: NS,
    inject: pluginInjected,
  }, AquaPluginCard))

  // Enable toggle row in the General section: right under 字号大小 (11).
  ctx.slots.inject('settings.general.item', () => ctx.slots.register({
    name: 'settings.general.item',
    id: 'aqua-enable',
    order: 11.4,
    store: appearanceStore,
    locale: NS,
    inject: enableInjected,
  }, AquaEnableRow))

  // Glass knobs row in the General section, directly under the enable toggle.
  ctx.slots.inject('settings.general.item', () => ctx.slots.register({
    name: 'settings.general.item',
    id: 'aqua',
    order: 11.5,
    store: appearanceStore,
    locale: NS,
    inject: appearanceInjected,
  }, AquaAppearanceRow))
}
