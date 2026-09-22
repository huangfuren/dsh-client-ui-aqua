/**
 * Aqua enable toggle registered as its own `settings.general.item` row at
 * order 11.4 — right under the built-in 字号大小 row (order 11) and directly
 * above the appearance knobs (order 11.5). Always renders so the user can flip
 * the plugin on/off from the General section without navigating to Plugins.
 */
import type { PropsLocale, PropsRuntime, PropsStore } from '@deepseek-ai/dsh-client-ui-slots'
// Type-only: pulls the `settings.general.item` SlotMap merge.
import type {} from '@deepseek-ai/dsh-client-ui-settings/client'
import type { createAquaRowStore } from './settings-store.ts'
import css from './AquaAppearanceRow.module.css'

/** Injected business face: the master enable write. */
export interface AquaEnableRowInjected {
  /** Switch the glass layer on or off. */
  setEnabled: (enabled: boolean) => void
}

/** Full component props: runtime share + store share + locale seat + injected face. */
export type AquaEnableRowComponentProps =
  PropsRuntime<'settings.general.item'> & PropsStore<ReturnType<typeof createAquaRowStore>>
  & PropsLocale<'settings.aqua'> & AquaEnableRowInjected

/**
 * Render the Aqua enable toggle row.
 * @param props - composed slot props.
 * @returns the General section toggle row.
 */
export function AquaEnableRow(props: AquaEnableRowComponentProps) {
  const { t, setEnabled, useStore } = props
  const enabled = useStore(s => s.enabled)
  return (
    <div className={css.group}>
      <div className={css.controls}>
        <div className={css.row}>
          <span className={css.rowLabel}>{t('aqua.title')}</span>
          <button
            type="button"
            className={css.toggle}
            aria-pressed={enabled}
            onClick={() => { setEnabled(!enabled) }}
          >
            {enabled ? t('aqua.enable') : t('aqua.disable')}
          </button>
        </div>
        <div className={css.knobHint}>{t('aqua.description')}</div>
      </div>
    </div>
  )
}