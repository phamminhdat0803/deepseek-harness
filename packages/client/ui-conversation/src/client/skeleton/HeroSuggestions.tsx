/**
 * Starter prompts under the blank-session composer. Each chip is a shortcut
 * for one prompt: activating it writes the prompt into the draft, so the chip
 * shortens typing rather than sending a message the user never read.
 *
 * The row keeps its place in the hero stack in every composer state and only
 * hides while the draft or the attachment rail has content: unmounting it
 * would re-center the stack and move the composer under the user's caret.
 */

import type { ReactNode } from 'react'
import clsx from 'clsx'
import {
  IconChecklistOutlineRegular, IconCodeOutlineRegular, IconCompareSplitOutlineRegular,
  IconSearchOutlineRegular,
} from '@deepseek-ai/dsh-client-ui-primitives'
import type { IconProps } from '@deepseek-ai/dsh-client-ui-primitives'
import type { PropsLocale } from '@deepseek-ai/dsh-client-ui-slots'
import type { ConversationKey } from '../locales.ts'
import css from './HeroSuggestions.module.css'

/** The owner's locale seat. */
type StarterTranslate = PropsLocale<'conversation'>['t']

/** One starter chip: its visible label, the draft it writes, and its glyph. */
interface StarterPrompt {
  readonly label: ConversationKey
  readonly prompt: ConversationKey
  readonly Icon: (props: IconProps) => ReactNode
}

/**
 * Chip glyph size, in proportion to the 13px label beside it (the composer
 * row's own control size).
 */
const CHIP_ICON_SIZE = 14

/** The starter set, in reading order. */
const STARTER_PROMPTS: readonly StarterPrompt[] = [
  { label: 'hero.suggestion.explore', prompt: 'hero.suggestion.explore.prompt', Icon: IconSearchOutlineRegular },
  { label: 'hero.suggestion.build', prompt: 'hero.suggestion.build.prompt', Icon: IconCodeOutlineRegular },
  { label: 'hero.suggestion.test', prompt: 'hero.suggestion.test.prompt', Icon: IconChecklistOutlineRegular },
  { label: 'hero.suggestion.review', prompt: 'hero.suggestion.review.prompt', Icon: IconCompareSplitOutlineRegular },
]

/** Props of the starter row. */
export interface HeroSuggestionsProps {
  /** The owner's locale seat; labels and prompts both resolve through it. */
  t: StarterTranslate
  /** Adopt one starter prompt as the draft. */
  onPick: (prompt: string) => void
  /**
   * Hide the row while the draft or the attachment rail has content. The row
   * stays mounted and keeps its height, so the composer does not move.
   */
  inactive: boolean
}

/**
 * Render the blank-session starter chips.
 * @param props - see {@link HeroSuggestionsProps}.
 * @returns the chip row, hidden in place while the composer carries content.
 */
export function HeroSuggestions({ t, onPick, inactive }: HeroSuggestionsProps) {
  return (
    <div
      className={clsx(css.root, inactive && css.inactive)}
      role="group"
      aria-label={t('hero.suggestions.label')}
      aria-hidden={inactive}
    >
      {STARTER_PROMPTS.map(({ label, prompt, Icon }) => (
        <button
          key={label}
          type="button"
          className={css.chip}
          disabled={inactive}
          onClick={() => { onPick(t(prompt)) }}
        >
          <Icon className={css.icon} size={CHIP_ICON_SIZE} />
          {t(label)}
        </button>
      ))}
    </div>
  )
}
