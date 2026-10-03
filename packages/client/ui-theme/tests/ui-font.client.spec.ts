/** The interface faces stay self-contained in the packaged Web application. */
import { readdirSync, readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'

const STYLES = new URL('../src/styles/', import.meta.url)

const css = readFileSync(new URL('ui-font.css', STYLES), 'utf8')

/** Every WOFF2 the sheet references, in source order. */
const referenced = [...css.matchAll(/url\(\.\/([^)]*\.woff2)\)/g)].map(([, name = '']) => name)

/** Every interface WOFF2 the package ships beside the sheet. */
const shipped = readdirSync(STYLES).filter(name => /^(inter-|geist-mono-).*\.woff2$/.test(name))

describe('offline interface fonts', () => {
  it('ships a local WOFF2 for every face it references', () => {
    expect(referenced).not.toHaveLength(0)
    expect(css).not.toMatch(/url\(https?:/)
    for (const name of referenced) {
      expect(readFileSync(new URL(name, STYLES)).readUInt32BE(0)).toBe(0x774f4632)
    }
  })

  it('references every WOFF2 it ships', () => {
    expect([...referenced].sort()).toEqual([...shipped].sort())
  })

  it('declares one variable face per file, italic where Inter needs it', () => {
    expect(css.match(/@font-face/g)).toHaveLength(referenced.length)
    expect(css.match(/font-weight: 100 900/g)).toHaveLength(referenced.length)
    const italic = referenced.filter(name => name.startsWith('inter-italic-'))
    expect(css.match(/font-style: italic/g)).toHaveLength(italic.length)
    expect(italic).not.toHaveLength(0)
  })

  it('selects Inter for text and Geist Mono for code', () => {
    expect(css).toContain("font-family: 'Inter';")
    expect(css).toContain("font-family: 'Geist Mono';")
    const tokens = readFileSync(new URL('base.css', STYLES), 'utf8')
    expect(tokens).toMatch(/--dsw-font-family: 'Universal Sans', 'Inter',/)
    expect(tokens).toMatch(/--ds-font-family-code: 'Geist Mono',/)
    expect(tokens).not.toContain('DM Sans')
  })

  it('bundles the redistribution license for each face', () => {
    for (const name of ['Inter-OFL.txt', 'Geist-Mono-OFL.txt']) {
      expect(readFileSync(new URL(name, STYLES), 'utf8')).toContain('SIL OPEN FONT LICENSE Version 1.1')
    }
    const manifest = JSON.parse(readFileSync(new URL('../package.json', import.meta.url), 'utf8')) as {
      files: string[]
      exports: Record<string, unknown>
    }
    expect(manifest.files).toContain('lib/styles')
    expect(manifest.exports['./ui-font.css']).toBe('./lib/styles/ui-font.css')
  })
})
