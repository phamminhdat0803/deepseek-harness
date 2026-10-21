// @vitest-environment jsdom
// The blank-session starter chips: one chip per dictionary entry, and
// activation hands back the prompt the chip names in the reader's language.

import { afterEach, describe, expect, it, vi } from 'vitest'
import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { makeTranslate } from '@deepseek-ai/dsh-client-test-runtime'
import { HeroSuggestions } from '../src/client/skeleton/HeroSuggestions.tsx'
import { en, zh } from '../src/client/locales.ts'

afterEach(cleanup)

/** Every starter pair, in the row's reading order. */
const STARTERS = [
  ['hero.suggestion.explore', 'hero.suggestion.explore.prompt'],
  ['hero.suggestion.build', 'hero.suggestion.build.prompt'],
  ['hero.suggestion.test', 'hero.suggestion.test.prompt'],
  ['hero.suggestion.review', 'hero.suggestion.review.prompt'],
] as const

describe('HeroSuggestions', () => {
  it('offers one chip per starter prompt and picks the prompt text, not the label', () => {
    const onPick = vi.fn()
    render(<HeroSuggestions t={makeTranslate(en)} onPick={onPick} inactive={false} />)

    expect(screen.getByRole('group', { name: en['hero.suggestions.label'] })).toBeDefined()
    for (const [label, prompt] of STARTERS) {
      fireEvent.click(screen.getByRole('button', { name: en[label] }))
      expect(onPick).toHaveBeenLastCalledWith(en[prompt])
    }
    expect(onPick).toHaveBeenCalledTimes(STARTERS.length)
  })

  it('labels the row and its prompts in the reader\'s language', () => {
    const onPick = vi.fn()
    render(<HeroSuggestions t={makeTranslate(zh)} onPick={onPick} inactive={false} />)

    expect(screen.getByRole('group', { name: zh['hero.suggestions.label'] })).toBeDefined()
    fireEvent.click(screen.getByRole('button', { name: zh['hero.suggestion.review'] }))
    expect(onPick).toHaveBeenCalledExactlyOnceWith(zh['hero.suggestion.review.prompt'])
  })

  it('leaves the row in place but inert while the composer carries content', () => {
    const onPick = vi.fn()
    const { container } = render(<HeroSuggestions t={makeTranslate(en)} onPick={onPick} inactive />)

    // Out of the accessibility tree and out of the tab order, yet still
    // occupying its slot so the hero stack does not re-center.
    expect(screen.queryByRole('group')).toBeNull()
    const buttons = [...container.querySelectorAll('button')]
    expect(buttons).toHaveLength(STARTERS.length)
    expect(buttons.every(button => button.disabled)).toBe(true)
    fireEvent.click(buttons[0]!)
    expect(onPick).not.toHaveBeenCalled()
  })
})
