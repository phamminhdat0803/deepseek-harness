// @vitest-environment jsdom
// The root pane's power strip: the level ticks, the bolt shortcut, and the
// keyboard ladder that mirrors a native slider. The drilled list keeps its own
// coverage in model-select.client.spec.tsx — this file only pins the strip.
import { act, cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { createSnapshotStore } from '@deepseek-ai/dsh-client-store'
import type { ComponentProps } from 'react'
import type { ModelDirectoryState } from '../src/client/directory.ts'
import { ModelSelect } from '../src/client/ModelSelect.tsx'
import { EffortSlider } from '../src/client/EffortSlider.tsx'
import type { ModelSelection } from '@deepseek-ai/dsh-api-remotes/client'
import { zh } from '../src/client/locales.ts'
import { zh as commonZh } from '@deepseek-ai/dsh-client-locale/src/locales/zh.ts'

const t: ComponentProps<typeof ModelSelect>['t'] = (key, params) => {
  const template = (zh as Record<string, string>)[key]
    ?? (commonZh as Record<string, string>)[key]
    ?? key
  return params === undefined
    ? template
    : template.replace(/\{(\w+)\}/g, (match, name: string) => name in params ? String(params[name]) : match)
}

const renderLabel: ComponentProps<typeof ModelSelect>['renderSlot'] = (_name, _owner, options) => options?.fallback ?? null

const reasoning = {
  efforts: [
    { id: 'off', name: 'Off' },
    { id: 'high', name: 'High' },
    { id: 'max', name: 'Max' },
  ],
  defaultEffort: 'high',
}

function state(overrides: Partial<ModelDirectoryState> = {}): ModelDirectoryState {
  return {
    current: { provider: 'deepseek-official', model: 'deepseek-v4-flash' },
    routable: true,
    groups: [{
      id: 'deepseek-official',
      name: 'DeepSeek',
      models: [{ id: 'deepseek-v4-flash', name: 'DeepSeek-V4-Flash', reasoning }],
    }],
    failures: [],
    status: 'ready',
    pending: null,
    error: null,
    ...overrides,
  }
}

beforeEach(() => {
  // jsdom lacks PointerEvent and native pointer capture.
  vi.stubGlobal('PointerEvent', class extends MouseEvent {
    readonly pointerId: number
    constructor(type: string, options: PointerEventInit = {}) {
      super(type, options)
      this.pointerId = options.pointerId ?? 0
    }
  })
})

afterEach(() => {
  cleanup()
  vi.unstubAllGlobals()
  vi.restoreAllMocks()
})

function pointerTrack(strip: HTMLElement) {
  const capture = vi.fn()
  const release = vi.fn()
  Object.defineProperties(strip, {
    setPointerCapture: { value: capture, configurable: true },
    releasePointerCapture: { value: release, configurable: true },
  })
  vi.spyOn(strip, 'getBoundingClientRect').mockReturnValue(new DOMRect(0, 0, 224, 40))
  return { capture, release }
}

function mountOpen(initial: ModelDirectoryState = state()) {
  const directory = createSnapshotStore<ModelDirectoryState>(initial)
  const select = vi.fn(async (selection: ModelSelection) => {
    directory.set({ ...initial, current: selection })
    return { ok: true as const, value: undefined }
  })
  render(<ModelSelect renderSlot={renderLabel}
    locked={false}
    available
    directory={directory}
    load={vi.fn()}
    select={select}
    t={t}
  />)
  fireEvent.click(screen.getByRole('button', { name: /选择模型/ }))
  return select
}

describe('ModelSelect power strip', () => {
  it('places the strip on the level in use and leaves the drill list to the exact choice', () => {
    mountOpen()
    const strip = screen.getByRole('slider', { name: '推理强度' })
    expect(strip.getAttribute('aria-valuemax')).toBe('2')
    expect(strip.getAttribute('aria-valuenow')).toBe('1')
    expect(strip.getAttribute('aria-valuetext')).toBe('High')
    expect(strip.hasAttribute('data-max')).toBe(false)
    // The bolt is only lit on the last level.
    expect(screen.getByRole('button', { name: '拉满推理强度' }).getAttribute('aria-pressed')).toBe('false')
  })

  it('commits the last level from the bolt', async () => {
    const select = mountOpen()
    fireEvent.click(screen.getByRole('button', { name: '拉满推理强度' }))
    await waitFor(() => {
      expect(select).toHaveBeenCalledWith({
        provider: 'deepseek-official', model: 'deepseek-v4-flash', reasoningEffort: 'max',
      })
    })
    expect(screen.getByRole('slider').getAttribute('aria-valuenow')).toBe('2')
    expect(document.activeElement).toBe(screen.getByRole('slider'))
  })

  it('falls back from the last level to the model default when the bolt is lit', async () => {
    const select = mountOpen(state({
      current: { provider: 'deepseek-official', model: 'deepseek-v4-flash', reasoningEffort: 'max' },
    }))
    const bolt = screen.getByRole('button', { name: '拉满推理强度' })
    expect(bolt.getAttribute('aria-pressed')).toBe('true')
    fireEvent.click(bolt)
    await waitFor(() => {
      expect(select).toHaveBeenCalledWith({
        provider: 'deepseek-official', model: 'deepseek-v4-flash', reasoningEffort: 'high',
      })
    })
    expect(screen.getByRole('slider').getAttribute('aria-valuenow')).toBe('1')
  })

  it('walks the ladder with arrows, Home, and End, committing each step', async () => {
    const select = mountOpen()
    const strip = screen.getByRole('slider', { name: '推理强度' })
    fireEvent.keyDown(strip, { key: 'End' })
    await waitFor(() => {
      expect(select).toHaveBeenLastCalledWith({
        provider: 'deepseek-official', model: 'deepseek-v4-flash', reasoningEffort: 'max',
      })
    })
    expect(screen.getByRole('slider')).toBe(strip)
    fireEvent.keyDown(strip, { key: 'ArrowLeft' })
    await waitFor(() => { expect(strip.getAttribute('aria-valuenow')).toBe('1') })
    fireEvent.keyDown(strip, { key: 'Home' })
    await waitFor(() => { expect(strip.getAttribute('aria-valuenow')).toBe('0') })
    expect(strip.hasAttribute('data-min')).toBe(true)
    fireEvent.keyDown(strip, { key: 'ArrowUp' })
    await waitFor(() => { expect(strip.getAttribute('aria-valuenow')).toBe('1') })
    fireEvent.keyDown(strip, { key: 'ArrowDown' })
    await waitFor(() => { expect(strip.getAttribute('aria-valuenow')).toBe('0') })
    fireEvent.keyDown(strip, { key: 'ArrowRight' })
    await waitFor(() => { expect(strip.getAttribute('aria-valuenow')).toBe('1') })
    expect(strip.hasAttribute('data-min')).toBe(false)
  })

  it('renders an unfilled strip for the provider default and keeps the level in use when it returns', () => {
    const directory = createSnapshotStore<ModelDirectoryState>(state({
      groups: [{
        id: 'deepseek-official',
        name: 'DeepSeek',
        models: [{ id: 'deepseek-v4-flash', name: 'DeepSeek-V4-Flash', reasoning: { efforts: reasoning.efforts } }],
      }],
      current: { provider: 'deepseek-official', model: 'deepseek-v4-flash' },
    }))
    render(<ModelSelect renderSlot={renderLabel}
      locked={false}
      available
      directory={directory}
      load={vi.fn()}
      select={vi.fn().mockResolvedValue({ ok: true, value: undefined })}
      t={t}
    />)
    fireEvent.click(screen.getByRole('button', { name: /选择模型/ }))
    const strip = screen.getByRole('slider', { name: '推理强度' })
    expect(strip.getAttribute('aria-valuetext')).toBe('Default')
    expect(strip.style.getPropertyValue('--pct')).toBe('0')
    expect(strip.hasAttribute('data-empty')).toBe(true)
    expect(strip.querySelector('[data-selected]')).toBeNull()
  })

  it('does not offer the strip for a model without effort levels', () => {
    const directory = createSnapshotStore<ModelDirectoryState>(state({
      groups: [{ id: 'plain', name: 'Plain', models: [{ id: 'plain-model', name: 'Plain model' }] }],
      current: { provider: 'plain', model: 'plain-model' },
    }))
    render(<ModelSelect renderSlot={renderLabel}
      locked={false}
      available
      directory={directory}
      load={vi.fn()}
      select={vi.fn().mockResolvedValue({ ok: true, value: undefined })}
      t={t}
    />)
    fireEvent.click(screen.getByRole('button', { name: /选择模型/ }))
    expect(screen.queryByRole('slider', { name: '推理强度' })).toBeNull()
  })

  it('refuses input while a selection is in flight', () => {
    const select = mountOpen(state({
      pending: { provider: 'deepseek-official', model: 'deepseek-v4-flash', reasoningEffort: 'max' },
    }))
    const strip = screen.getByRole('slider', { name: '推理强度' })
    expect(strip.getAttribute('aria-disabled')).toBe('true')
    expect(strip.getAttribute('tabindex')).toBe('-1')
    pointerTrack(strip)
    fireEvent.pointerDown(strip, { pointerId: 1, button: 0, clientX: 213 })
    fireEvent.pointerUp(strip, { pointerId: 1, clientX: 213 })
    fireEvent.keyDown(strip, { key: 'End' })
    fireEvent.click(screen.getByRole('button', { name: '拉满推理强度' }))
    expect(select).not.toHaveBeenCalled()
  })

  it('previews a drag without saving, then saves once and keeps the menu open', async () => {
    const select = mountOpen()
    const strip = screen.getByRole('slider')
    const { capture, release } = pointerTrack(strip)
    fireEvent.pointerDown(strip, { pointerId: 7, button: 0, clientX: 112 })
    fireEvent.pointerMove(strip, { pointerId: 7, clientX: 172 })
    expect(strip.style.getPropertyValue('--pct')).toBe('0.8')
    expect(strip.getAttribute('aria-valuetext')).toBe('Max')
    expect(select).not.toHaveBeenCalled()
    fireEvent.pointerUp(strip, { pointerId: 7, clientX: 300 })
    await waitFor(() => { expect(select).toHaveBeenCalledTimes(1) })
    expect(select).toHaveBeenCalledWith({
      provider: 'deepseek-official', model: 'deepseek-v4-flash', reasoningEffort: 'max',
    })
    expect(capture).toHaveBeenCalledWith(7)
    expect(release).toHaveBeenCalledWith(7)
    expect(screen.getByRole('slider')).toBe(strip)
    expect(document.activeElement).toBe(strip)
    expect(strip.getAttribute('aria-valuenow')).toBe('2')
    fireEvent.keyDown(strip, { key: 'Escape' })
    expect(screen.queryByRole('slider')).toBeNull()
  })

  it('discards cancelled and interrupted drags and ignores other pointers and mouse buttons', () => {
    const select = mountOpen()
    const strip = screen.getByRole('slider')
    const { capture } = pointerTrack(strip)
    fireEvent.pointerDown(strip, { pointerId: 1, button: 2, clientX: 213 })
    expect(capture).not.toHaveBeenCalled()
    fireEvent.pointerDown(strip, { pointerId: 1, button: 0, clientX: 213 })
    fireEvent.pointerDown(strip, { pointerId: 2, button: 0, clientX: 13 })
    fireEvent.pointerMove(strip, { pointerId: 2, clientX: 13 })
    fireEvent.pointerUp(strip, { pointerId: 2, clientX: 13 })
    expect(strip.getAttribute('aria-valuenow')).toBe('2')
    fireEvent.pointerCancel(strip, { pointerId: 1 })
    expect(strip.getAttribute('aria-valuenow')).toBe('1')
    fireEvent.pointerUp(strip, { pointerId: 1, clientX: 213 })
    fireEvent.pointerDown(strip, { pointerId: 3, button: 0, clientX: 13 })
    fireEvent.lostPointerCapture(strip, { pointerId: 3 })
    expect(strip.getAttribute('aria-valuenow')).toBe('1')
    expect(select).not.toHaveBeenCalled()
  })

  it('retains slider focus while saving and remains dismissed if the user leaves before success', async () => {
    const directory = createSnapshotStore<ModelDirectoryState>(state())
    let settle!: () => void
    const select = vi.fn((selection: ModelSelection) => {
      directory.set(state({ pending: selection }))
      return new Promise<{ ok: true; value: undefined }>((resolve) => {
        settle = () => {
          directory.set(state({ current: selection }))
          resolve({ ok: true, value: undefined })
        }
      })
    })
    render(<ModelSelect renderSlot={renderLabel} locked={false} available directory={directory}
      load={vi.fn()} select={select} t={t} />)
    fireEvent.click(screen.getByRole('button', { name: /选择模型/ }))
    const strip = screen.getByRole('slider')
    strip.focus()
    fireEvent.keyDown(strip, { key: 'End' })
    expect(strip.getAttribute('aria-disabled')).toBe('true')
    expect(document.activeElement).toBe(strip)
    fireEvent.mouseDown(document.body)
    expect(screen.queryByRole('slider')).toBeNull()
    await act(async () => { settle() })
    expect(screen.queryByRole('slider')).toBeNull()
  })

  it('keeps the slider available after a rejected selection', async () => {
    const select = vi.fn().mockResolvedValue({ ok: false, error: { code: 'session/writer-held', message: 'busy' } })
    render(<div data-composer-card><ModelSelect renderSlot={renderLabel} locked={false} available
      directory={createSnapshotStore<ModelDirectoryState>(state())} load={vi.fn()} select={select} t={t} /></div>)
    fireEvent.click(screen.getByRole('button', { name: /选择模型/ }))
    const strip = screen.getByRole('slider')
    strip.focus()
    fireEvent.keyDown(strip, { key: 'End' })
    await waitFor(() => { expect(screen.getByRole('alert').textContent).toContain(t('error.sessionInUse')) })
    expect(screen.getByRole('slider')).toBe(strip)
    expect(document.activeElement).toBe(strip)
  })
})

describe('EffortSlider preview', () => {
  it('does not commit if saving becomes busy during a drag', () => {
    const onSelect = vi.fn()
    const props = {
      levels: reasoning.efforts, activeIndex: 1, valueLabel: 'High', label: 'Power',
      hint: 'Arrows', boostLabel: 'Boost', restoreIndex: 1, busy: false, onSelect,
    }
    const { rerender } = render(<EffortSlider {...props} />)
    const strip = screen.getByRole('slider')
    pointerTrack(strip)
    fireEvent.pointerDown(strip, { pointerId: 1, button: 0, clientX: 213 })
    rerender(<EffortSlider {...props} busy />)
    fireEvent.pointerUp(strip, { pointerId: 1, clientX: 213 })
    expect(onSelect).not.toHaveBeenCalled()
    expect(strip.getAttribute('aria-valuenow')).toBe('1')
    expect(strip.hasAttribute('data-dragging')).toBe(false)
  })
})
