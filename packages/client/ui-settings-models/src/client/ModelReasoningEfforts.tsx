/** Selectable reasoning-effort levels for one model row. */

import type { ReactNode } from 'react'
import { Checkbox } from '@deepseek-ai/dsh-client-ui-primitives'
import type { DeepSeekModelDraft } from './DeepSeekModelsEditor.tsx'
import type { ReasoningEffortLevelChoice } from './store.ts'
import type { ModelsKey } from './locales.ts'
import styles from './ModelsSection.module.css'

/** Props of {@link ModelReasoningEfforts}. */
interface ModelReasoningEffortsProps {
  /** Effective model row, including fields outside the curated editor. */
  model: DeepSeekModelDraft
  /** One-based row position for the accessible group label. */
  position: number
  /** Levels this namespace's schema accepts, in escalation order. */
  levels: readonly ReasoningEffortLevelChoice[]
  /** Prevent changes while read-only or saving. */
  disabled: boolean
  /** Section copy. */
  t: (key: ModelsKey) => string
  /** Replace this row, preserving unrelated configuration. */
  onChange: (model: DeepSeekModelDraft) => void
}

/**
 * The levels one row currently declares. A row that declares none has none to
 * offer: nothing interrogates an endpoint for a model's reasoning protocol, so
 * a hand-entered model is offered the schema's levels unchecked and inherits
 * none until the user picks.
 * @param model - the effective model row.
 * @returns the declared levels, in the order the schema offers them.
 */
function declaredOf(
  model: DeepSeekModelDraft,
  levels: readonly ReasoningEffortLevelChoice[],
): readonly ReasoningEffortLevelChoice[] {
  const declared = model['reasoningEfforts']
  if (declared === false) return []
  if (typeof declared !== 'object' || declared === null || Array.isArray(declared)) return []
  const keys = declared as Record<string, unknown>
  return levels.filter(choice => keys[choice.level] !== undefined)
}

/**
 * Edit the reasoning levels one model offers.
 *
 * The levels are the schema's, not a client-owned list, so a page update that
 * adds a level makes it appear here without a release. A level's declared
 * value is the spelling dispatch sends; `off` carries none, because "do not
 * think" travels as the reasoning parameter's absence, which is what keeps an
 * endpoint that thinks by default honest.
 * @param props - model declaration, schema levels, and row replacement.
 * @returns the labeled level checkboxes and the non-reasoning toggle.
 */
export function ModelReasoningEfforts(
  { model, position, levels, disabled, t, onChange }: ModelReasoningEffortsProps,
): ReactNode {
  const declared = model['reasoningEfforts']
  const disabledReasons = declared === false
  const selected = declaredOf(model, levels)
  const toggle = (level: ReasoningEffortLevelChoice, checked: boolean): void => {
    const next = { ...(typeof declared === 'object' && declared !== null && !Array.isArray(declared)
      ? declared as Record<string, unknown>
      : {}) }
    if (checked) next[level.level] = level.wire
    else Reflect.deleteProperty(next, level.level)
    // A dict the user emptied declares nothing, which the adapter refuses as
    // neither inheritance nor a non-reasoning model — so clearing the last
    // level states the non-reasoning model instead of leaving a no-op value.
    onChange({ ...model, reasoningEfforts: Object.keys(next).length === 0 ? false : next })
  }
  return (
    <fieldset className={styles['modelInputTypes']} aria-label={`${t('modelReasoningEfforts')} ${String(position)}`}>
      <legend className={styles['modelFieldLabel']}>{t('modelReasoningEfforts')}</legend>
      <Checkbox
        label={t('modelNoReasoning')}
        checked={disabledReasons}
        disabled={disabled}
        onChange={(checked) => {
          // Disabling keeps every level the row declared, so re-enabling
          // restores them instead of making the user reselect a set. A row
          // that declared none is restored to inheritance, which is the state
          // it was in before the toggle.
          if (checked) {
            onChange({ ...model, reasoningEfforts: false })
            return
          }
          const restored = Object.fromEntries(selected.map(choice => [choice.level, choice.wire]))
          const next = { ...model }
          if (Object.keys(restored).length === 0) Reflect.deleteProperty(next, 'reasoningEfforts')
          else next['reasoningEfforts'] = restored
          onChange(next)
        }}
      />
      {levels.map(level => (
        <Checkbox
          key={level.level}
          label={level.level.charAt(0).toUpperCase() + level.level.slice(1)}
          checked={selected.some(choice => choice.level === level.level)}
          // The non-reasoning declaration and the levels exclude one another.
          disabled={disabled || disabledReasons}
          onChange={(checked) => { toggle(level, checked) }}
        />
      ))}
    </fieldset>
  )
}
