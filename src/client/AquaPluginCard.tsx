/**
 * Aqua card registered into the Plugins settings section's configurable tab
 * (`settings.plugins.tab`): the master on/off switch — name, description, and
 * one toggle, in the section's card language. Every other knob lives in the
 * General settings' Appearance row, so the card stays the same shape as the
 * other plugin cards.
 */
import * as uiPrimitives from '@deepseek-ai/dsh-client-ui-primitives'

/**
 * 宿主图标导出名跨版本有变：dsh <= 0.1.6 提供 `IconCheckOutline16`，
 * dsh 0.1.7+ 去掉了尺寸后缀，只提供 `IconCheckOutline`。
 * 这里按可用性选取，避免升级后取出 undefined 并被 React 当作组件渲染而崩溃。
 */
const primitiveIcons = uiPrimitives as unknown as Record<string, unknown>
const CheckIcon = (primitiveIcons.IconCheckOutline ?? primitiveIcons.IconCheckOutline16) as unknown as () => JSX.Element
import type { InjectFace, PropsLocale, PropsRuntime, PropsStore } from '@deepseek-ai/dsh-client-ui-slots'
// Type-only: pulls the `settings.plugins.tab` SlotMap merge.
import type {} from '@deepseek-ai/dsh-client-ui-settings-plugins/client'
import type { createAquaRowStore } from './settings-store.ts'
import css from './AquaPluginCard.module.css'

/** Injected business face: the master enable write. */
export interface AquaPluginCardInjected {
  /** Switch the glass layer on or off. */
  setEnabled: (enabled: boolean) => void
}

/** Full component props: runtime share + store share + locale seat + injected face. */
export type AquaPluginCardComponentProps =
  PropsRuntime<'settings.plugins.tab'> & PropsStore<ReturnType<typeof createAquaRowStore>>
  & PropsLocale<'settings.aqua'> & InjectFace<AquaPluginCardInjected>

/**
 * Render the Aqua plugin card.
 * @param props - composed slot props.
 * @returns the card list item.
 */
export function AquaPluginCard(props: AquaPluginCardComponentProps) {
  const { t, setEnabled, useStore } = props
  const enabled = useStore(s => s.enabled)
  return (
    <li className={css.card}>
      <div className={css.head}>
        <div className={css.text}>
          <div className={css.title}>{t('aqua.title')}</div>
          <div className={css.description}>{t('aqua.description')}</div>
        </div>
        <button
          type="button"
          className={css.toggle}
          aria-pressed={enabled}
          onClick={() => { setEnabled(!enabled) }}
        >
          <span className={css.check}>
            {enabled && CheckIcon && <CheckIcon />}
          </span>
          {enabled ? t('aqua.enable') : t('aqua.disable')}
        </button>
      </div>
    </li>
  )
}
