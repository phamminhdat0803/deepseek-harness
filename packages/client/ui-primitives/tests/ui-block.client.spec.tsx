// @vitest-environment jsdom
import { cleanup, render, screen } from '@testing-library/react'
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
