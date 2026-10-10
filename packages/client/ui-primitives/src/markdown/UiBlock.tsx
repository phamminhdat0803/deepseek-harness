import { useState } from 'react'
import type { ReactNode } from 'react'
import clsx from 'clsx'
import {
  IconCheckCircleFillRegular, IconChevronDownOutlineRegular, IconCloseCircleFillRegular,
  IconClockOutlineRegular, IconDatabaseOutlineRegular, IconFolderCloseRegular,
  IconInfoOutlineRegular, IconSparkleRegular, IconWarningTriangleOutlineRegular,
} from '../icons/index.tsx'
import { FileTypeIcon } from '../FileTypeIcon.tsx'
import { StateDot } from '../StateDot.tsx'
import type { StateDotState } from '../StateDot.tsx'
import type { TagTone } from '../Tag.tsx'
import css from './UiBlock.module.css'

interface MetricItem {
  label: string
  value: string | number
  delta?: string | undefined
  status?: string | undefined
}

function resolveStateDot(status: string | undefined, defaultState: StateDotState = 'idle'): StateDotState {
  if (!status) return defaultState
  if (status === 'done' || status === 'success' || status === 'completed') return 'done'
  if (status === 'warning' || status === 'warn') return 'warning'
  if (status === 'error' || status === 'danger' || status === 'failed') return 'error'
  if (status === 'ongoing' || status === 'running' || status === 'loading') return 'ongoing'
  return 'idle'
}

function resolveTagTone(variant: string | undefined): TagTone {
  if (!variant) return 'neutral'
  if (variant === 'success' || variant === 'done') return 'success'
  if (variant === 'warning' || variant === 'warn') return 'warning'
  if (variant === 'danger' || variant === 'error') return 'danger'
  if (variant === 'info') return 'info'
  if (variant === 'solid') return 'solid'
  if (variant === 'quiet') return 'quiet'
  if (variant === 'outline') return 'outline'
  return 'neutral'
}

function renderNamedIcon(name: string | undefined, size = 16): ReactNode {
  switch (name) {
    case 'check':
    case 'success':
    case 'done':
      return <IconCheckCircleFillRegular size={size} />
    case 'close':
    case 'cross':
    case 'x':
    case 'fail':
    case 'error':
    case 'danger':
    case 'cancel':
      return <IconCloseCircleFillRegular size={size} />
    case 'warning':
    case 'alert':
    case 'warn':
      return <IconWarningTriangleOutlineRegular size={size} />
    case 'info':
      return <IconInfoOutlineRegular size={size} />
    case 'clock':
    case 'time':
    case 'pending':
      return <IconClockOutlineRegular size={size} />
    case 'sparkle':
    case 'ai':
    case 'star':
      return <IconSparkleRegular size={size} />
    case 'folder':
      return <IconFolderCloseRegular size={size} />
    case 'database':
    case 'db':
      return <IconDatabaseOutlineRegular size={size} />
    case 'word':
    case 'doc':
    case 'document':
      return <FileTypeIcon kind="word" size={size} />
    case 'excel':
    case 'sheet':
      return <FileTypeIcon kind="excel" size={size} />
    case 'pdf':
      return <FileTypeIcon kind="pdf" size={size} />
    case 'code':
      return <FileTypeIcon kind="code" size={size} />
    case 'file':
      return <FileTypeIcon kind="other" size={size} />
    default:
      return null
  }
}

function defaultVariantIcon(variant: string | undefined): ReactNode {
  switch (variant) {
    case 'success':
      return <IconCheckCircleFillRegular size={16} />
    case 'warning':
      return <IconWarningTriangleOutlineRegular size={16} />
    case 'danger':
    case 'error':
      return <IconCloseCircleFillRegular size={16} />
    case 'info':
      return <IconInfoOutlineRegular size={16} />
    default:
      return null
  }
}

function parsePercent(val: unknown): number {
  if (typeof val === 'number') return Math.max(0, Math.min(100, Math.round(val)))
  if (typeof val === 'string') {
    const parsed = Number.parseFloat(val.replace('%', '').trim())
    if (!Number.isNaN(parsed)) return Math.max(0, Math.min(100, Math.round(parsed)))
  }
  return 0
}

/**
 * Parse simple inline markdown formatting (**bold**, `code`, *italic*, [link](url)) and status icons.
 */
function renderFormattedText(text: string): ReactNode {
  if (!text) return null
  if (
    !text.includes('**') &&
    !text.includes('`') &&
    !text.includes('*') &&
    !text.includes('[') &&
    !/[✅❌✓✗]|:check:|:cross:|:x:/u.test(text)
  ) {
    return text
  }

  const regex = /(`[^`]+`|\[[^\]]+\]\([^)]+\)|\*\*[^*]+\*\*|\*[^*]+\*|[✅✓]|:check:|[❌✗]|:cross:|:x:)/gu
  const parts: ReactNode[] = []
  let lastIndex = 0
  let match: RegExpExecArray | null = regex.exec(text)

  while (match !== null) {
    if (match.index > lastIndex) {
      parts.push(text.slice(lastIndex, match.index))
    }
    const token = match[0]
    const key = match.index
    if (token.startsWith('`') && token.endsWith('`')) {
      parts.push(<code key={key} className={css.inlineCode}>{token.slice(1, -1)}</code>)
    } else if (token.startsWith('[') && token.includes('](') && token.endsWith(')')) {
      const linkMatch = /^\[([^\]]+)\]\(([^)]+)\)$/.exec(token)
      if (linkMatch && linkMatch[1] && linkMatch[2]) {
        parts.push(
          <a
            key={key}
            href={linkMatch[2]}
            target="_blank"
            rel="noopener noreferrer"
            className={css.cardLink}
          >
            {linkMatch[1]}
          </a>,
        )
      } else {
        parts.push(token)
      }
    } else if (token.startsWith('**') && token.endsWith('**')) {
      parts.push(<strong key={key} className={css.strong}>{token.slice(2, -2)}</strong>)
    } else if (token.startsWith('*') && token.endsWith('*')) {
      parts.push(<em key={key}>{token.slice(1, -1)}</em>)
    } else if (token === '✅' || token === '✓' || token === ':check:') {
      parts.push(
        <span key={key} className={css.inlineStatusIcon} data-status="check" title="Thành công / Cho phép">
          <IconCheckCircleFillRegular size={14} />
        </span>,
      )
    } else if (token === '❌' || token === '✗' || token === ':cross:' || token === ':x:') {
      parts.push(
        <span key={key} className={css.inlineStatusIcon} data-status="close" title="Thất bại / Chặn">
          <IconCloseCircleFillRegular size={14} />
        </span>,
      )
    } else {
      parts.push(token)
    }
    lastIndex = regex.lastIndex
    match = regex.exec(text)
  }

  if (lastIndex < text.length) {
    parts.push(text.slice(lastIndex))
  }

  return parts
}

function renderProgress(data: Record<string, unknown>): ReactNode {
  const percent = parsePercent(data.percent)
  const defaultStatus: StateDotState = percent >= 100 ? 'done' : percent > 0 ? 'ongoing' : 'idle'
  const statusStr = typeof data.status === 'string' ? data.status : undefined
  const state = resolveStateDot(statusStr, defaultStatus)
  const unit = typeof data.unit === 'string' ? data.unit : '%'
  const label = typeof data.label === 'string' ? data.label : undefined
  const description = typeof data.description === 'string' ? data.description : undefined

  return (
    <div className={clsx(css.container, css.progressRoot)}>
      <div className={css.progressHeader}>
        <div className={css.progressLabelWrap}>
          <StateDot state={state} size={10} />
          {label && <span className={css.progressLabel}>{renderFormattedText(label)}</span>}
        </div>
        <span className={css.progressPercent}>{percent}{unit}</span>
      </div>
      <div className={css.progressTrack}>
        <div
          className={css.progressFill}
          data-status={state}
          style={{ width: `${percent}%` }}
        />
      </div>
      {description && <div className={css.progressDesc}>{renderFormattedText(description)}</div>}
    </div>
  )
}

function renderBadge(data: Record<string, unknown>): ReactNode {
  const variantStr = typeof data.variant === 'string'
    ? data.variant
    : typeof data.tone === 'string'
      ? data.tone
      : undefined
  const tone = resolveTagTone(variantStr)
  const iconStr = typeof data.icon === 'string' ? data.icon : undefined
  const icon = renderNamedIcon(iconStr, 13)
  const text = typeof data.text === 'string' ? data.text : ''

  return (
    <div className={css.badgeWrap}>
      <span className={clsx(css.badge)} data-tone={tone} data-variant={variantStr ?? tone}>
        {icon && <span className={css.badgeIcon}>{icon}</span>}
        {text && <span className={css.badgeText}>{renderFormattedText(text)}</span>}
      </span>
    </div>
  )
}

interface CardProps {
  data: Record<string, unknown>
  insideLayout?: boolean | undefined
}

function CardComponent({ data, insideLayout = false }: CardProps): ReactNode {
  const variant = typeof data.variant === 'string' ? data.variant : 'neutral'
  const isCollapsible = data.collapsible === true || data.accordion === true || data.expandable === true
  const defaultOpen = data.defaultOpen === true || data.open === true
  const [open, setOpen] = useState(isCollapsible ? defaultOpen : true)

  const iconStr = typeof data.icon === 'string' ? data.icon : undefined
  const icon = renderNamedIcon(iconStr, 16) ?? defaultVariantIcon(variant)
  const title = typeof data.title === 'string' ? data.title : undefined
  const description = typeof data.description === 'string' ? data.description : undefined
  const items = Array.isArray(data.items)
    ? data.items.filter((item): item is string => typeof item === 'string')
    : undefined
  const fullWidth = data.fullWidth === true

  // Render card header badge if present
  let badgeNode: ReactNode = null
  if (typeof data.badge === 'string' && data.badge.trim() !== '') {
    badgeNode = (
      <span className={css.cardBadge} data-variant={variant}>
        {renderFormattedText(data.badge)}
      </span>
    )
  } else if (typeof data.badge === 'object' && data.badge !== null) {
    const badgeObj = data.badge as Record<string, unknown>
    const badgeText = typeof badgeObj.text === 'string' ? badgeObj.text : ''
    const badgeVariant = typeof badgeObj.variant === 'string' ? badgeObj.variant : variant
    if (badgeText) {
      badgeNode = (
        <span className={css.cardBadge} data-variant={badgeVariant}>
          {renderFormattedText(badgeText)}
        </span>
      )
    }
  }

  const hasBodyContent = Boolean(description || (items && items.length > 0))

  return (
    <div
      className={clsx(insideLayout ? css.cardRoot : clsx(css.container, css.cardRoot))}
      data-variant={variant}
      data-full-width={fullWidth ? 'true' : undefined}
    >
      {isCollapsible ? (
        <button
          type="button"
          className={css.cardToggleHeader}
          aria-expanded={open}
          onClick={() => { setOpen(prev => !prev) }}
        >
          {icon && <span className={css.cardIcon}>{icon}</span>}
          {title && <span className={css.cardTitle}>{renderFormattedText(title)}</span>}
          {badgeNode}
          <IconChevronDownOutlineRegular
            size={14}
            className={clsx(css.cardChevron, open && css.cardChevronOpen)}
          />
        </button>
      ) : (
        <div className={css.cardHeader}>
          {icon && <span className={css.cardIcon}>{icon}</span>}
          {title && <span className={css.cardTitle}>{renderFormattedText(title)}</span>}
          {badgeNode}
        </div>
      )}

      {open && hasBodyContent && (
        <div className={css.cardBody}>
          {description && <div className={css.cardDesc}>{renderFormattedText(description)}</div>}
          {items && items.length > 0 && (
            <ul className={css.cardList}>
              {items.map((item, idx) => (
                <li key={idx}>{renderFormattedText(item)}</li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  )
}

function renderCard(data: Record<string, unknown>): ReactNode {
  return <CardComponent data={data} />
}

/**
 * Intelligent content-aware layout decider.
 * Ensures reading flow and avoids awkward 2-column squishing for heavy text or wide tables.
 */
function determineLayout(
  layoutProp: unknown,
  cards: Record<string, unknown>[],
): 'stack' | 'split' | 'grid' {
  if (typeof layoutProp === 'string') {
    const norm = layoutProp.toLowerCase().trim()
    if (norm === 'stack' || norm === 'full-width' || norm === 'full') return 'stack'
    if (norm === 'grid') return 'grid'
    if (norm === 'split' || norm === '2-column' || norm === 'columns') return 'split'
  }

  // Automatic content-aware evaluation
  if (cards.length === 2) {
    const isHeavy = (c: Record<string, unknown>) => {
      const desc = typeof c.description === 'string' ? c.description : ''
      const items = Array.isArray(c.items) ? c.items : []
      const hasLongItem = items.some(it => typeof it === 'string' && it.length > 110)
      return desc.length > 180 || items.length > 4 || hasLongItem
    }
    // If either card has long content or many items, keep them in a clean stack
    if (cards.some(isHeavy)) {
      return 'stack'
    }
    // Both cards are concise -> ideal for split 2-column view on capable displays
    return 'split'
  }

  if (cards.length >= 3 && cards.length <= 6) {
    const isCompact = cards.every((c) => {
      const desc = typeof c.description === 'string' ? c.description : ''
      const items = Array.isArray(c.items) ? c.items : []
      return desc.length < 100 && items.length <= 3
    })
    if (isCompact) return 'grid'
  }

  return 'stack'
}

function renderLayoutComponent(data: Record<string, unknown>): ReactNode {
  const rawItems = Array.isArray(data.items)
    ? data.items
    : Array.isArray(data.cards)
      ? data.cards
      : []

  const cards = rawItems.filter((it): it is Record<string, unknown> => typeof it === 'object' && it !== null)
  if (cards.length === 0) return null

  const layout = determineLayout(data.layout ?? data.type, cards)
  const ratio = typeof data.ratio === 'string' ? data.ratio : undefined

  return (
    <div className={css.layoutContainer}>
      <div className={css.layoutInner} data-layout={layout} data-ratio={ratio}>
        {cards.map((cardData, idx) => (
          <CardComponent key={idx} data={cardData} insideLayout={true} />
        ))}
      </div>
    </div>
  )
}

function renderMetrics(data: Record<string, unknown>): ReactNode {
  let items: MetricItem[] = []

  if (Array.isArray(data.items)) {
    items = data.items
      .filter((item): item is Record<string, unknown> => typeof item === 'object' && item !== null)
      .map(item => ({
        label: typeof item.label === 'string' ? item.label : typeof item.label === 'number' ? `${item.label}` : '',
        value: typeof item.value === 'string' || typeof item.value === 'number' ? item.value : '',
        delta: typeof item.delta === 'string' ? item.delta : undefined,
        status: typeof item.status === 'string' ? item.status : undefined,
      }))
  } else if (data.label !== undefined && data.value !== undefined) {
    items = [{
      label: typeof data.label === 'string' ? data.label : typeof data.label === 'number' ? `${data.label}` : '',
      value: typeof data.value === 'string' || typeof data.value === 'number' ? data.value : '',
      delta: typeof data.delta === 'string' ? data.delta : undefined,
      status: typeof data.status === 'string' ? data.status : undefined,
    }]
  }

  if (items.length === 0) return null

  return (
    <div className={css.metricsGrid}>
      {items.map((item, idx) => {
        const state = resolveStateDot(item.status, 'idle')
        return (
          <div key={idx} className={css.metricCard}>
            <div className={css.metricTop}>
              <span className={css.metricLabel}>{item.label}</span>
              {item.status && <StateDot state={state} size={8} />}
            </div>
            <div className={css.metricValue}>{item.value}</div>
            {item.delta && <span className={css.metricDelta}>{item.delta}</span>}
          </div>
        )
      })}
    </div>
  )
}

function renderTableComponent(data: Record<string, unknown>): ReactNode {
  const headers = Array.isArray(data.headers) ? data.headers.map(String) : []
  const rows = Array.isArray(data.rows) ? data.rows : []
  const title = typeof data.title === 'string' ? data.title : undefined

  return (
    <div className={clsx(css.container, css.tableBlockWrap)}>
      {title && <div className={css.tableTitle}>{renderFormattedText(title)}</div>}
      <div className={css.tableScrollWrap}>
        <table className={css.uiTable}>
          {headers.length > 0 && (
            <thead>
              <tr>
                {headers.map((h, i) => (
                  <th key={i}>{renderFormattedText(h)}</th>
                ))}
              </tr>
            </thead>
          )}
          <tbody>
            {rows.map((row, rIdx) => {
              const cells = Array.isArray(row) ? row : [row]
              return (
                <tr key={rIdx}>
                  {cells.map((c, cIdx) => (
                    <td key={cIdx}>{renderFormattedText(String(c ?? ''))}</td>
                  ))}
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}

/**
 * Render a UI component from a structured JSON code block (e.g. ```ui:progress).
 * Returns null if the JSON is malformed or the component type is unrecognized,
 * allowing graceful fallback to standard code block rendering.
 */
export function renderUiComponent(type: string, rawJson: string): ReactNode | null {
  let parsed: unknown
  try {
    parsed = JSON.parse(rawJson.trim())
  } catch {
    return null
  }

  if (typeof parsed !== 'object' || parsed === null || Array.isArray(parsed)) return null

  const record = parsed as Record<string, unknown>
  const normalizedType = type.toLowerCase().replace(/^ui[:-]/, '')

  switch (normalizedType) {
    case 'progress':
      return renderProgress(record)
    case 'badge':
    case 'tag':
      return renderBadge(record)
    case 'card':
    case 'alert':
    case 'notice':
      return renderCard(record)
    case 'cards':
    case 'layout':
    case 'group':
      return renderLayoutComponent(record)
    case 'metric':
    case 'metrics':
    case 'stat':
    case 'stats':
      return renderMetrics(record)
    case 'table':
      return renderTableComponent(record)
    case 'grid':
      return Array.isArray(record.headers)
        ? renderTableComponent(record)
        : renderLayoutComponent(record)
    default:
      return null
  }
}
