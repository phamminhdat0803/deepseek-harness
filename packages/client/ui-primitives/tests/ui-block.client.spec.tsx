// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it } from 'vitest'
import { MarkdownText } from './markdown-test-components.tsx'

afterEach(cleanup)

describe('MarkdownText Rich UI blocks', () => {
  it('renders ui:progress block as visual progress bar', () => {
    const md = [
      '```ui:progress',
      JSON.stringify({
        label: 'Deploy VPS',
        percent: 75,
        status: 'ongoing',
        description: '3/4 task hoàn thành',
      }),
      '```',
    ].join('\n')

    const { container } = render(<MarkdownText text={md} />)
    expect(screen.getByText('Deploy VPS')).toBeTruthy()
    expect(screen.getByText('75%')).toBeTruthy()
    expect(screen.getByText('3/4 task hoàn thành')).toBeTruthy()

    const fill = container.querySelector('[data-status="ongoing"]')
    expect(fill).toBeTruthy()
    expect((fill as HTMLElement).style.width).toBe('75%')
  })

  it('renders ui-badge and ui:badge with variant tone and icon', () => {
    const md = [
      '```ui:badge',
      JSON.stringify({
        text: 'Thành công',
        variant: 'success',
        icon: 'check',
      }),
      '```',
    ].join('\n')

    const { container } = render(<MarkdownText text={md} />)
    expect(screen.getByText('Thành công')).toBeTruthy()
    const tag = container.querySelector('[data-tone="success"]')
    expect(tag).toBeTruthy()
  })

  it('renders ui:card and ui:alert with title, variant, and item list', () => {
    const md = [
      '```ui:card',
      JSON.stringify({
        title: 'Cảnh báo bảo mật',
        description: 'Phát hiện truy cập bất thường',
        variant: 'warning',
        items: ['IP lạ', 'Sai mật khẩu 5 lần'],
      }),
      '```',
    ].join('\n')

    const { container } = render(<MarkdownText text={md} />)
    expect(screen.getByText('Cảnh báo bảo mật')).toBeTruthy()
    expect(screen.getByText('Phát hiện truy cập bất thường')).toBeTruthy()
    expect(screen.getByText('IP lạ')).toBeTruthy()
    expect(screen.getByText('Sai mật khẩu 5 lần')).toBeTruthy()

    const card = container.querySelector('[data-variant="warning"]')
    expect(card).toBeTruthy()
  })

  it('renders bold and code formatting inside card items and title', () => {
    const md = [
      '```ui:card',
      JSON.stringify({
        title: 'Tiêu đề **quan trọng**',
        items: ['Mục 1 có **chữ in đậm** và `mã code`'],
      }),
      '```',
    ].join('\n')

    const { container } = render(<MarkdownText text={md} />)
    const strong = container.querySelector('strong')
    expect(strong).toBeTruthy()
    expect(strong?.textContent).toBe('quan trọng')

    const itemStrong = container.querySelectorAll('strong')[1]
    expect(itemStrong).toBeTruthy()
    expect(itemStrong?.textContent).toBe('chữ in đậm')

    const code = container.querySelector('code')
    expect(code).toBeTruthy()
    expect(code?.textContent).toBe('mã code')
  })

  it('renders check and close status SVG icons instead of raw symbols in markdown and tables', () => {
    const md = [
      '| Hành động | Kết quả |',
      '| --- | --- |',
      '| hằng duyệt bước của sơn | CHẶN 403 ✅ |',
      '| đạt CHẤM ĐIỂM | CHO PHÉP ❌ |',
    ].join('\n')

    const { container } = render(<MarkdownText text={md} />)
    const checkIcon = container.querySelector('[data-status="check"]')
    const closeIcon = container.querySelector('[data-status="close"]')

    expect(checkIcon).toBeTruthy()
    expect(closeIcon).toBeTruthy()
    // Verifies SVG icon elements are inside
    expect(checkIcon?.querySelector('svg')).toBeTruthy()
    expect(closeIcon?.querySelector('svg')).toBeTruthy()
  })

  it('renders ui:table as a styled dashboard table with formatted cells', () => {
    const md = [
      '```ui:table',
      JSON.stringify({
        title: 'Bảng kiểm thử',
        headers: ['Hành động', 'Kết quả'],
        rows: [
          ['hằng duyệt bước của **sơn**', 'CHẶN 403 ✅'],
          ['đạt CHẤM ĐIỂM', 'CHO PHÉP ❌'],
        ],
      }),
      '```',
    ].join('\n')

    const { container } = render(<MarkdownText text={md} />)
    expect(screen.getByText('Bảng kiểm thử')).toBeTruthy()
    expect(screen.getByText('Hành động')).toBeTruthy()
    expect(screen.getByText('Kết quả')).toBeTruthy()
    expect(container.querySelector('strong')?.textContent).toBe('sơn')
    expect(container.querySelector('[data-status="check"]')).toBeTruthy()
    expect(container.querySelector('[data-status="close"]')).toBeTruthy()
  })

  it('renders ui:metrics grid with statistics', () => {
    const md = [
      '```ui:metrics',
      JSON.stringify({
        items: [
          { label: 'CPU', value: '45%', status: 'done' },
          { label: 'RAM', value: '82%', delta: '+5%', status: 'warning' },
        ],
      }),
      '```',
    ].join('\n')

    render(<MarkdownText text={md} />)
    expect(screen.getByText('CPU')).toBeTruthy()
    expect(screen.getByText('45%')).toBeTruthy()
    expect(screen.getByText('RAM')).toBeTruthy()
    expect(screen.getByText('82%')).toBeTruthy()
    expect(screen.getByText('+5%')).toBeTruthy()
  })

  it('renders neutral card with badge and file links', () => {
    const md = [
      '```ui:card',
      JSON.stringify({
        title: 'Báo cáo Word đã tạo',
        variant: 'success',
        badge: 'Sẵn sàng',
        description: 'Xem mã nguồn tại [GitHub ↗](https://github.com/example/repo)',
      }),
      '```',
    ].join('\n')

    const { container } = render(<MarkdownText text={md} />)
    expect(screen.getByText('Báo cáo Word đã tạo')).toBeTruthy()
    expect(screen.getByText('Sẵn sàng')).toBeTruthy()

    const link = container.querySelector('a')
    expect(link).toBeTruthy()
    expect(link?.getAttribute('href')).toBe('https://github.com/example/repo')
    expect(link?.textContent).toBe('GitHub ↗')
  })

  it('renders collapsible card and toggles open/close on header click', () => {
    const md = [
      '```ui:card',
      JSON.stringify({
        title: 'Chi tiết kỹ thuật và đường dẫn',
        variant: 'neutral',
        collapsible: true,
        defaultOpen: false,
        icon: 'folder',
        items: ['D:\\Workspace\\path\\to\\project'],
      }),
      '```',
    ].join('\n')

    const { container } = render(<MarkdownText text={md} />)
    expect(screen.getByText('Chi tiết kỹ thuật và đường dẫn')).toBeTruthy()

    const toggleBtn = container.querySelector('button[aria-expanded]')
    expect(toggleBtn).toBeTruthy()
    expect(toggleBtn?.getAttribute('aria-expanded')).toBe('false')
    // Body is hidden initially
    expect(screen.queryByText('D:\\Workspace\\path\\to\\project')).toBeNull()

    // Click to expand
    if (toggleBtn) fireEvent.click(toggleBtn)
    expect(toggleBtn?.getAttribute('aria-expanded')).toBe('true')
    expect(screen.getByText('D:\\Workspace\\path\\to\\project')).toBeTruthy()

    // Click to collapse again
    if (toggleBtn) fireEvent.click(toggleBtn)
    expect(toggleBtn?.getAttribute('aria-expanded')).toBe('false')
    expect(screen.queryByText('D:\\Workspace\\path\\to\\project')).toBeNull()
  })

  it('renders ui:cards with adaptive layout', () => {
    const md = [
      '```ui:cards',
      JSON.stringify({
        layout: 'split',
        items: [
          { title: 'Card Trái', variant: 'info', description: 'Nội dung ngắn gọn' },
          { title: 'Card Phải', variant: 'success', description: 'Hoàn tất' },
        ],
      }),
      '```',
    ].join('\n')

    const { container } = render(<MarkdownText text={md} />)
    expect(screen.getByText('Card Trái')).toBeTruthy()
    expect(screen.getByText('Card Phải')).toBeTruthy()

    const layoutInner = container.querySelector('[data-layout="split"]')
    expect(layoutInner).toBeTruthy()
  })

  it('automatically keeps heavy cards in a stack layout even if 2 items', () => {
    const md = [
      '```ui:cards',
      JSON.stringify({
        items: [
          {
            title: 'Card Nặng',
            variant: 'warning',
            description: 'Nội dung rất dài '.repeat(20),
          },
          { title: 'Card Phụ', variant: 'neutral', description: 'Ngắn' },
        ],
      }),
      '```',
    ].join('\n')

    const { container } = render(<MarkdownText text={md} />)
    const layoutInner = container.querySelector('[data-layout="stack"]')
    expect(layoutInner).toBeTruthy()
  })

  it('gracefully falls back to standard code block on malformed JSON', () => {
    const md = [
      '```ui:progress',
      '{ label: "Broken JSON without quotes or braces',
      '```',
    ].join('\n')

    const { container } = render(<MarkdownText text={md} />)
    // Should not crash and should render as pre/code block
    expect(container.querySelector('pre')).toBeTruthy()
    expect(container.textContent).toContain('Broken JSON')
  })

  it('gracefully falls back to standard code block on unknown ui type', () => {
    const md = [
      '```ui:unknown_custom_thing',
      JSON.stringify({ hello: 'world' }),
      '```',
    ].join('\n')

    const { container } = render(<MarkdownText text={md} />)
    expect(container.querySelector('pre')).toBeTruthy()
    expect(container.textContent).toContain('hello')
  })
})
