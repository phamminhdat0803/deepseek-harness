/**
 * Verify the bundled Vietnamese language pack against the Client UI copy it
 * translates: every locale namespace registered by a Client plugin must have a
 * `vi` dictionary under `packages/client/locale/src/locales/vi/` whose key set
 * matches the namespace's zh key-set source of truth, in the same order, with
 * the same `{placeholder}` set and the same significant leading/trailing
 * padding on every entry. Reports namespaces that are missing, incomplete, or
 * stale, and exits non-zero on any violation.
 *
 * The zh/en pairing invariant is a separate gate
 * (`scripts/locale-dictionary-parity.spec.ts`); this one covers the third
 * locale, whose dictionaries live in one pack rather than beside each owner.
 *
 * Usage: `pnpm run verify-vi-locale`
 */
import { globSync, readFileSync } from 'node:fs'
import { dirname, join, relative, resolve } from 'node:path'
import ts from 'typescript'

const root = resolve(import.meta.dirname, '..')
const viRoot = resolve(root, 'packages/client/locale/src/locales/vi')

/** Keys whose padding intentionally differs from English (see the entry below). */
const PADDING_EXCEPTIONS = new Set(['chat.message.stepProcess.sharedPrefix'])

/** Repo-relative path with `/` separators. */
function relativePath(file: string): string {
  return relative(root, file).replaceAll('\\', '/')
}

/** An import binding: the module it comes from and the name it binds. */
interface ImportRef {
  /** Module specifier as written. */
  module: string
  /** Imported (or exported) name. */
  imported: string
}

/** One namespace registration found in a Client source file. */
interface Registration {
  /** Resolved namespace id, or null when the expression is not a known constant. */
  ns: string | null
  /** Repo-relative registration site. */
  site: string
  /** Locale tag to local dictionary identifier. */
  dictionaryRefs: Record<string, string>
  /** Inline per-locale dictionaries written beside the call, when present. */
  inline: Record<string, Record<string, string | null>> | null
}

/** Everything the scan needs from one parsed module. */
interface ModuleInfo {
  /** Named imports by local binding. */
  imports: Map<string, ImportRef>
  /** String constants by local name. */
  consts: Map<string, string>
  /** Object-literal declarations by local name. */
  objects: Map<string, Record<string, string | null>>
  /** `export { x } from './y.ts'` re-exports by exported name. */
  reexports: Map<string, ImportRef>
  /** Inline `['zh', { ... }]` dictionaries by locale tag. */
  inlineDicts: Map<string, Record<string, string | null>>
  /** Locale namespace registrations. */
  registrations: Registration[]
}

/** A dictionary resolved to its declaring module and entries. */
interface Dictionary {
  /** Repo-relative declaring file. */
  file: string
  /** Exported object name inside that module. */
  exportName: string
  /** Key to source text. */
  entries: Record<string, string | null>
}

const modules = new Map<string, ModuleInfo>()

/** Strip the type-only wrappers that leave the initializer underneath. */
function unwrap(node: ts.Expression | undefined): ts.Expression | undefined {
  let current = node
  for (;;) {
    if (current === undefined) return undefined
    if (ts.isParenthesizedExpression(current) || ts.isAsExpression(current) || ts.isSatisfiesExpression(current)
      || ts.isNonNullExpression(current) || ts.isTypeAssertionExpression(current)) {
      current = current.expression
      continue
    }
    return current
  }
}

/** Literal text of a string-ish expression, or null when it is dynamic. */
function literalText(node: ts.Expression | undefined, source: ts.SourceFile): string | null {
  const target = unwrap(node)
  if (target === undefined) return null
  if (ts.isStringLiteral(target) || ts.isNoSubstitutionTemplateLiteral(target)) return target.text
  if (ts.isTemplateExpression(target)) return target.getText(source).slice(1, -1)
  if (ts.isBinaryExpression(target) && target.operatorToken.kind === ts.SyntaxKind.PlusToken) {
    const left = literalText(target.left, source)
    const right = literalText(target.right, source)
    return left === null || right === null ? null : left + right
  }
  return null
}

/** Declared properties of an object literal, with literal text where available. */
function objectEntries(node: ts.Expression | undefined, source: ts.SourceFile): Record<string, string | null> {
  const entries: Record<string, string | null> = {}
  const target = unwrap(node)
  if (target === undefined || !ts.isObjectLiteralExpression(target)) return entries
  for (const property of target.properties) {
    if (ts.isPropertyAssignment(property)) {
      const key = ts.isIdentifier(property.name) || ts.isStringLiteral(property.name)
        ? property.name.text
        : property.name.getText(source)
      entries[key] = literalText(property.initializer, source)
    } else if (ts.isShorthandPropertyAssignment(property)) {
      entries[property.name.text] = null
    }
  }
  return entries
}

/** Resolve a module specifier to a file, when it is relative. */
function resolveModule(fromAbs: string, specifier: string): string | null {
  if (!specifier.startsWith('.')) return null
  const base = resolve(dirname(fromAbs), specifier)
  for (const candidate of [base, `${base}.ts`, `${base}.tsx`, join(base, 'index.ts'), join(base, 'index.tsx')]) {
    try {
      readFileSync(candidate)
      return candidate
    } catch {
      // Keep trying the next extension.
    }
  }
  return null
}

/** Parse one module into the facts the scan needs (cached per file). */
function parseModule(abs: string): ModuleInfo {
  const cached = modules.get(abs)
  if (cached !== undefined) return cached
  const text = readFileSync(abs, 'utf8')
  const source = ts.createSourceFile(abs, text, ts.ScriptTarget.Latest, true)
  const info: ModuleInfo = {
    imports: new Map(), consts: new Map(), objects: new Map(), reexports: new Map(),
    inlineDicts: new Map(), registrations: [],
  }
  modules.set(abs, info)

  const collect = (statements: readonly ts.Statement[]): void => {
    for (const statement of statements) {
      if (!ts.isVariableStatement(statement)) continue
      for (const declaration of statement.declarationList.declarations) {
        if (!ts.isIdentifier(declaration.name)) continue
        const literal = literalText(declaration.initializer, source)
        if (literal !== null) info.consts.set(declaration.name.text, literal)
        const initializer = unwrap(declaration.initializer)
        if (initializer !== undefined && ts.isObjectLiteralExpression(initializer)) {
          info.objects.set(declaration.name.text, objectEntries(initializer, source))
        }
        if (initializer === undefined || !ts.isArrayLiteralExpression(initializer)) continue
        for (const element of initializer.elements) {
          const pair = unwrap(element)
          if (pair === undefined || !ts.isArrayLiteralExpression(pair) || pair.elements.length !== 2) continue
          const locale = literalText(pair.elements[0], source)
          const dict = unwrap(pair.elements[1])
          if (locale === null || dict === undefined || !ts.isObjectLiteralExpression(dict)) continue
          info.inlineDicts.set(locale, objectEntries(dict, source))
        }
      }
    }
  }

  collect(source.statements)
  const collectNested = (node: ts.Node): void => {
    if (ts.isVariableStatement(node)) collect([node])
    ts.forEachChild(node, collectNested)
  }
  ts.forEachChild(source, collectNested)

  for (const statement of source.statements) {
    if (!ts.isImportDeclaration(statement) || !ts.isStringLiteral(statement.moduleSpecifier)) continue
    const bindings = statement.importClause?.namedBindings
    if (bindings === undefined || !ts.isNamedImports(bindings)) continue
    for (const element of bindings.elements) {
      info.imports.set(element.name.text, {
        module: statement.moduleSpecifier.text,
        imported: (element.propertyName ?? element.name).text,
      })
    }
  }
  for (const statement of source.statements) {
    if (!ts.isExportDeclaration(statement) || statement.moduleSpecifier === undefined) continue
    if (!ts.isStringLiteral(statement.moduleSpecifier)) continue
    const clause = statement.exportClause
    if (clause === undefined || !ts.isNamedExports(clause)) continue
    for (const element of clause.elements) {
      info.reexports.set(element.name.text, {
        module: statement.moduleSpecifier.text,
        imported: (element.propertyName ?? element.name).text,
      })
    }
  }

  const visit = (node: ts.Node): void => {
    if (ts.isCallExpression(node) && node.arguments.length >= 2
      && /(^|\.)register$/.test(node.expression.getText(source))) {
      const first = node.arguments[0]
      let ns = literalText(first, source)
      if (ns === null && first !== undefined && ts.isIdentifier(first)) ns = resolveConst(abs, first.text)
      const second = unwrap(node.arguments[1])
      const literal = second !== undefined && ts.isObjectLiteralExpression(second) ? second : null
      const inline = second !== undefined && ts.isIdentifier(second) && info.inlineDicts.size > 0
      if (ns === null || (literal === null && !inline)) {
        ts.forEachChild(node, visit)
        return
      }
      const dictionaryRefs: Record<string, string> = {}
      if (literal !== null) {
        for (const property of literal.properties) {
          if (ts.isPropertyAssignment(property)) {
            const key = ts.isIdentifier(property.name) || ts.isStringLiteral(property.name)
              ? property.name.text
              : property.name.getText(source)
            const value = unwrap(property.initializer)
            if (value !== undefined && ts.isIdentifier(value)) dictionaryRefs[key] = value.text
          } else if (ts.isShorthandPropertyAssignment(property)) {
            dictionaryRefs[property.name.text] = property.name.text
          }
        }
      }
      info.registrations.push({
        ns,
        site: relativePath(abs),
        dictionaryRefs,
        inline: inline ? Object.fromEntries(info.inlineDicts) : null,
      })
    }
    ts.forEachChild(node, visit)
  }
  visit(source)
  return info
}

/** Resolve a namespace constant through local declarations and imports. */
function resolveConst(siteAbs: string, name: string, depth = 0): string | null {
  if (depth > 4) return null
  const site = parseModule(siteAbs)
  const imported = site.imports.get(name)
  if (imported === undefined) return site.consts.get(name) ?? null
  const target = resolveModule(siteAbs, imported.module)
  if (target === null) return null
  const targetInfo = parseModule(target)
  const direct = targetInfo.consts.get(imported.imported)
  if (direct !== undefined) return direct
  return resolveConst(target, imported.imported, depth + 1)
}

/** Resolve one registered dictionary reference to its entries. */
function resolveDict(siteAbs: string, localName: string, depth = 0): Dictionary | null {
  const site = parseModule(siteAbs)
  const imported = site.imports.get(localName)
  if (imported === undefined) {
    const local = site.objects.get(localName)
    return local === undefined ? null : { file: relativePath(siteAbs), exportName: localName, entries: local }
  }
  const target = resolveModule(siteAbs, imported.module)
  if (target === null) return null
  const targetInfo = parseModule(target)
  const direct = targetInfo.objects.get(imported.imported)
  if (direct !== undefined) return { file: relativePath(target), exportName: imported.imported, entries: direct }
  const reexport = targetInfo.reexports.get(imported.imported)
  if (reexport === undefined || depth > 4) return null
  const next = resolveModule(target, reexport.module)
  if (next === null) return null
  const nextEntries = parseModule(next).objects.get(reexport.imported)
  return nextEntries === undefined
    ? null
    : { file: relativePath(next), exportName: reexport.imported, entries: nextEntries }
}

/** The vi pack's own dictionaries, keyed by namespace. */
function readPack(): Map<string, { file: string; keys: string[]; values: Record<string, string | null> }> {
  const pack = new Map<string, { file: string; keys: string[]; values: Record<string, string | null> }>()
  const index = readFileSync(join(viRoot, 'index.ts'), 'utf8')
  for (const match of index.matchAll(/\['([^']+)',\s*(\w+)\]/g)) {
    const ns = match[1]
    const identifier = match[2]
    if (ns === undefined || identifier === undefined) continue
    const importMatch = index.match(new RegExp(`import \\{ vi as ${identifier} \\} from '\\./([^']+)'`))
    if (importMatch === null) continue
    const file = importMatch[1]
    if (file === undefined) continue
    const source = ts.createSourceFile(file, readFileSync(join(viRoot, file), 'utf8'), ts.ScriptTarget.Latest, true)
    let values: Record<string, string | null> = {}
    for (const statement of source.statements) {
      if (!ts.isVariableStatement(statement)) continue
      for (const declaration of statement.declarationList.declarations) {
        if (!ts.isIdentifier(declaration.name) || declaration.name.text !== 'vi') continue
        values = objectEntries(declaration.initializer, source)
      }
    }
    pack.set(ns, { file, keys: Object.keys(values), values })
  }
  return pack
}

/** Sorted `{name}` placeholder set of a source string. */
function placeholders(text: string | null): string {
  return [...(text ?? '').matchAll(/\{(\w+)\}/g)].map(match => match[1]).sort().join(',')
}

/** Significant leading/trailing space of a fragment. */
function padding(text: string): string {
  return `${text.startsWith(' ') ? 'L' : ''}${text.endsWith(' ') ? 'T' : ''}`
}

function main(): void {
  const files = globSync('packages/client/*/src/**/*.ts', { cwd: root })
    .filter(file => !file.endsWith('.d.ts') && !file.includes('/tests/') && !file.endsWith('.spec.ts'))

  const expected = new Map<string, { source: Record<string, string | null>; english: Record<string, string | null>; sites: Set<string> }>()
  const unresolved: string[] = []
  for (const file of files) {
    const abs = join(root, file)
    for (const registration of parseModule(abs).registrations) {
      const ns = registration.ns
      if (ns === null) continue
      let source: Record<string, string | null> | null = null
      let english: Record<string, string | null> | null = null
      if (registration.inline !== null) {
        source = registration.inline.zh ?? null
        english = registration.inline.en ?? null
      } else {
        const zhRef = registration.dictionaryRefs.zh
        if (zhRef !== undefined) {
          const resolved = resolveDict(abs, zhRef)
          if (resolved === null) unresolved.push(`${ns} @ ${relativePath(abs)} :: ${zhRef}`)
          else source = resolved.entries
        }
        const enRef = registration.dictionaryRefs.en
        if (enRef !== undefined) english = resolveDict(abs, enRef)?.entries ?? null
      }
      if (source === null) continue
      const bucket = expected.get(ns) ?? { source: {}, english: {}, sites: new Set<string>() }
      bucket.source = source
      if (english !== null) bucket.english = english
      bucket.sites.add(relativePath(abs))
      expected.set(ns, bucket)
    }
  }

  const pack = readPack()
  const problems: string[] = unresolved.map(entry => `unresolved zh dictionary: ${entry}`)
  if (pack.size === 0) problems.push('the vi pack index registers no namespace')

  for (const [ns, { source, english, sites }] of [...expected].sort(([left], [right]) => left.localeCompare(right))) {
    const dictionary = pack.get(ns)
    if (dictionary === undefined) {
      problems.push(`missing namespace "${ns}" (${[...sites].join(', ')})`)
      continue
    }
    const sourceKeys = Object.keys(source)
    const viKeys = dictionary.keys
    const missing = sourceKeys.filter(key => !viKeys.includes(key))
    const extra = viKeys.filter(key => !sourceKeys.includes(key))
    if (missing.length > 0) problems.push(`${ns}: ${missing.length} key(s) missing (${missing.slice(0, 6).join(', ')})`)
    if (extra.length > 0) problems.push(`${ns}: ${extra.length} unknown key(s) (${extra.slice(0, 6).join(', ')})`)
    if (missing.length === 0 && extra.length === 0 && viKeys.join('\n') !== sourceKeys.join('\n')) {
      problems.push(`${ns}: key order differs from the zh source order`)
    }
    for (const key of sourceKeys) {
      const value = dictionary.values[key]
      if (value === undefined || value === null) continue
      const sourceText = source[key] ?? ''
      // Fragments (separators, prefixes, multi-line bodies) carry opaque
      // whitespace, so an entry is only empty when the source is not.
      if (value.trim() === '' && sourceText.trim() !== '') {
        problems.push(`${ns}.${key}: empty value for a non-empty source`)
        continue
      }
      const wanted = placeholders(sourceText)
      if (wanted !== placeholders(value)) {
        problems.push(`${ns}.${key}: placeholder set {${wanted}} expected, saw {${placeholders(value)}}`)
      }
      // Padding is significant on the fragments the renderer concatenates;
      // compare against the English text this pack translates from, falling
      // back to the zh source. `PADDING_EXCEPTIONS` names the one key whose
      // empty English prefix cannot survive translation.
      const reference = english[key] ?? sourceText
      if (padding(value) !== padding(reference) && !PADDING_EXCEPTIONS.has(`${ns}.${key}`)) {
        problems.push(`${ns}.${key}: padding ${JSON.stringify(padding(value))} does not match the source ${JSON.stringify(padding(reference))}`)
      }
    }
  }

  for (const ns of pack.keys()) {
    if (!expected.has(ns)) problems.push(`stale namespace "${ns}" in the vi pack (no Client plugin registers it)`)
  }

  if (problems.length > 0) {
    console.error(`verify-vi-locale: ${problems.length} problem(s):`)
    for (const problem of problems) console.error(`  ${problem}`)
    process.exitCode = 1
    return
  }
  console.log(`verify-vi-locale: ${pack.size} Vietnamese namespace dictionaries match their zh key sets.`)
}

main()
