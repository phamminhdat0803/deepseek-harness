/**
 * Accessible effort slider for the model menu. Pointer movement previews the
 * value continuously and commits the nearest advertised level on release.
 * Cancellation discards the preview. The penultimate level uses violet; maximum
 * effort enables a spectrum gradient and faster decorative flow.
 */
import {
  useId, useMemo, useRef, useState,
  type CSSProperties, type KeyboardEvent, type PointerEvent,
} from 'react'
import clsx from 'clsx'
import css from './EffortSlider.module.css'

/** One explicit effort level the strip can land on. */
export interface EffortLevel {
  id: string
  name: string
}

/** Props of the power strip: levels in catalog order, the index in use, and the commit verb. */
export interface EffortSliderProps {
  /** Explicit levels only — the provider default is the empty (unfilled) state. */
  levels: readonly EffortLevel[]
  /** Index of the level in use, or -1 when the provider default applies. */
  activeIndex: number
  /** Localized name of the value in use, shown beside the label. */
  valueLabel: string
  /** Accessible name of the strip. */
  label: string
  /** Keyboard hint announced as the strip's description. */
  hint: string
  /** Accessible name of the max-power bolt. */
  boostLabel: string
  /** Level the bolt falls back to when the strip already sits on the last one. */
  restoreIndex: number
  /** A selection is in flight: the strip takes no input. */
  busy: boolean
  /** Commit the level at `index`. */
  onSelect: (index: number) => void
}

/** Tick centres match the 12px radius of the stylesheet's track end caps. */
const INSET = 12
/** Particles per stream — dense enough to read as flow, sparse enough to stay cheap. */
const PARTICLE_COUNT = 14

/** Deterministic pseudo-random in [0, 1): a re-render must never reshuffle the stream. */
function jitter(seed: number): number {
  const value = Math.sin(seed * 127.1 + 311.7) * 43758.5453
  return value - Math.floor(value)
}

interface ParticleSeed {
  id: string
  top: string
  delay: string
  duration: string
  scale: string
  opacity: string
}

function buildParticles(count: number): ParticleSeed[] {
  return Array.from({ length: count }, (_, index) => ({
    id: `particle-${index}`,
    top: `${(22 + jitter(index + 1) * 56).toFixed(2)}%`,
    delay: `${(-index * 0.173).toFixed(4)}s`,
    duration: `${(1.8 + jitter(index + 57) * 0.8).toFixed(3)}s`,
    scale: (0.52 + jitter(index + 13) * 0.48).toFixed(3),
    opacity: (0.4 + jitter(index + 91) * 0.6).toFixed(3),
  }))
}

/**
 * Render the effort power strip.
 * @param props - levels, the active index, localized copy, and the commit verb.
 * @returns the labeled strip with its bolt, ticks, thumb, and flow overlay.
 */
export function EffortSlider(
  { levels, activeIndex, valueLabel, label, hint, boostLabel, restoreIndex, busy, onSelect }: EffortSliderProps,
) {
  const trackRef = useRef<HTMLDivElement | null>(null)
  const pointerId = useRef<number | null>(null)
  const hintId = useId()
  const [draftPosition, setDraftPosition] = useState<number | null>(null)
  const last = levels.length - 1
  const dragging = draftPosition !== null
  const position = draftPosition ?? (last <= 0 ? 0 : Math.max(0, activeIndex) / last)
  const index = Math.round(position * last)
  const empty = activeIndex < 0 && !dragging
  const atMax = !empty && position === 1
  const particles = useMemo(() => buildParticles(PARTICLE_COUNT), [])

  const positionAt = (clientX: number): number => {
    const rect = trackRef.current?.getBoundingClientRect()
    if (rect === undefined || last <= 0) return 0
    const usable = Math.max(1, rect.width - INSET * 2)
    const x = Math.min(Math.max(clientX - rect.left - INSET, 0), usable)
    return x / usable
  }

  const commit = (next: number): void => {
    setDraftPosition(null)
    if (busy || next === activeIndex) return
    onSelect(next)
  }

  const onPointerDown = (event: PointerEvent<HTMLDivElement>): void => {
    if (busy || last <= 0 || event.button !== 0 || pointerId.current !== null) return
    // Keep focus inside the portaled menu before the browser's mouse defaults.
    event.preventDefault()
    event.currentTarget.focus({ preventScroll: true })
    event.currentTarget.setPointerCapture(event.pointerId)
    pointerId.current = event.pointerId
    setDraftPosition(positionAt(event.clientX))
  }

  const onPointerMove = (event: PointerEvent<HTMLDivElement>): void => {
    if (pointerId.current !== event.pointerId || busy) return
    setDraftPosition(positionAt(event.clientX))
  }

  const onPointerUp = (event: PointerEvent<HTMLDivElement>): void => {
    if (pointerId.current !== event.pointerId) return
    pointerId.current = null
    event.currentTarget.releasePointerCapture(event.pointerId)
    commit(Math.round(positionAt(event.clientX) * last))
  }

  const onPointerCancel = (event: PointerEvent<HTMLDivElement>): void => {
    if (pointerId.current !== event.pointerId) return
    pointerId.current = null
    setDraftPosition(null)
  }

  const onKeyDown = (event: KeyboardEvent<HTMLDivElement>): void => {
    if (busy || dragging) return
    const step = event.key === 'ArrowRight' || event.key === 'ArrowUp' ? 1
      : event.key === 'ArrowLeft' || event.key === 'ArrowDown' ? -1
        : 0
    let next: number | null = null
    if (step !== 0) next = Math.min(Math.max(index + step, 0), last)
    else if (event.key === 'Home') next = 0
    else if (event.key === 'End') next = last
    if (next === null) return
    // The menu's own ↑/↓ walk must not also move focus out of the strip.
    event.preventDefault()
    event.stopPropagation()
    commit(next)
  }

  const style = { '--pct': String(position) } as CSSProperties

  return (
    <div
      className={css.power}
      data-busy={busy ? '' : undefined}
      data-high={!empty && last > 1 && index >= last - 1 ? '' : undefined}
      data-max={atMax ? '' : undefined}
    >
      <button
        type="button"
        className={clsx(css.boost, atMax && css.boostOn)}
        aria-pressed={atMax}
        aria-label={boostLabel}
        title={boostLabel}
        disabled={busy}
        onClick={() => {
          trackRef.current?.focus({ preventScroll: true })
          commit(atMax ? Math.min(Math.max(restoreIndex, 0), last) : last)
        }}
      >
        <svg width="13" height="13" viewBox="0 0 16 16" aria-hidden="true" focusable="false">
          <path d="M9.1 1 3.4 8.8h3.3L6.9 15l5.7-7.8H9.3L9.1 1Z" fill="currentColor" />
        </svg>
      </button>
      <div
        className={css.strip}
        ref={trackRef}
        style={style}
        role="slider"
        tabIndex={busy ? -1 : 0}
        aria-label={label}
        aria-describedby={hintId}
        aria-valuemin={0}
        aria-valuemax={last}
        aria-valuenow={index}
        aria-valuetext={dragging ? levels[index]?.name : valueLabel}
        aria-disabled={busy}
        data-dragging={dragging ? '' : undefined}
        data-empty={empty ? '' : undefined}
        data-min={position === 0 ? '' : undefined}
        data-max={atMax ? '' : undefined}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerCancel}
        onLostPointerCapture={onPointerCancel}
        onKeyDown={onKeyDown}
      >
        <span className={css.track} aria-hidden="true" />
        <span className={clsx(css.fill, atMax && css.spectrum)} aria-hidden="true" />
        {atMax && (
          <span className={css.clip} aria-hidden="true">
            <span className={css.stream}>
              {particles.map(particle => (
                <span
                  key={particle.id}
                  className={css.path}
                  style={{
                    '--particle-top': particle.top,
                    '--particle-delay': particle.delay,
                    '--particle-duration': particle.duration,
                    '--particle-scale': particle.scale,
                    '--particle-opacity': particle.opacity,
                  } as CSSProperties}
                >
                  <span className={css.particle} />
                </span>
              ))}
            </span>
          </span>
        )}
        <span className={css.ticks} aria-hidden="true">
          {levels.map((level, position) => (
            <span
              key={level.id}
              className={css.tick}
              data-selected={!empty && position <= index ? '' : undefined}
              style={{ '--tick-pct': String(last <= 0 ? 0 : position / last) } as CSSProperties}
            />
          ))}
        </span>
        <span className={css.thumb} aria-hidden="true" />
      </div>
      <span className={css.hint} id={hintId}>{hint}</span>
    </div>
  )
}
