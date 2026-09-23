# Agent Note: MiniMax-derived visual language for the Web client

Status: implemented

English | [中文](2026-09-21-minimax-visual-language.zh.md)

## Problem

The token sheets encoded a visual baseline surveyed from the Chat front end: a DeepSeek-blue accent (`#3964fe`), 18px capsule buttons, layered soft elevation shadows, and the platform UI font stack. That baseline fixed every color, radius, and shadow a feature component could reach, so a product-level change of visual language had no single place to land — it would have to be argued component by component, and review had no machine-checkable statement of what the new language is.

## Decision

The Web client ships the MiniMax design language, described by the `DESIGN.md` reference generated into the repository root. [`design-platform.css`](../../../../packages/client/ui-theme/src/styles/design-platform.css) remains the single color authority and keeps its two-block light/dark structure and its alias-to-static indirection, so every consumer contract the stylesheet contracts assert still holds; only the values and a handful of alias bindings moved.

The static ramp is now absolute and MiniMax-derived: ink `#0a0a0a`, canvas `#ffffff`, surface `#f7f8fa`, hairline `#e5e7eb`, steel `#5f5f5f`, stone `#8e8e93`, muted `#a8aab2`. One blue family carries links, business state, and the info fill (`#1456f0`, `#1d4ed8`, `#60a5fa`); the coral family carries attention states, so warn approval and risk surfaces read as the brand's high-impact accent while error keeps its own red. The static scale is declared identically in both blocks, which is what lets the alias layer be the only thing a palette flip changes.

The dark palette is derived rather than surveyed: the reference publishes no dark tokens. Its canvas is `#111113` and the elevation ladder steps `#1c1c1e` → `#262628` → `#303032`, keeping `bg-layer-2` and `bg-layer-3` distinct from the base surfaces so the scrollbar contract's elevation detection still separates a rebound surface from a base one.

Typography keeps the existing size ladder and its paired line heights, because the ladder rides the user's 12–17px content-font setting. What changed is the family and the weight discipline: [`base.css`](../../../../packages/client/ui-theme/src/styles/base.css) puts `'DM Sans'` ahead of `'Inter'` and the platform stack, and the Markdown heading rungs drop from 700 to the brand's 600. DM Sans stays unbundled, so the family applies only where the machine already has it and every other glyph falls back through the stack.

Elevation turns flat. The four shadow rungs become the reference's own levels (`0 1px 2px rgba(0,0,0,.04)` through `0 12px 16px -4px rgba(36,36,36,.08)`), and the elevation composites keep their 0.5px hairline stroke plus one soft layer instead of two. Surfaces separate by hairline and fill, not by glow.

Shape becomes the brand signature: every action is a pill. [`Button.module.css`](../../../../packages/client/ui-primitives/src/Button.module.css) drops its per-size radii for `999px` plus `corner-shape: round`, [`Pill.module.css`](../../../../packages/client/ui-primitives/src/Pill.module.css) follows, and the sidebar's New Session action carries the `button-primary` pair in [`SidebarRoot.module.css`](../../../../packages/client/ui-sidebar/src/client/SidebarRoot.module.css) — the reference anchors every surface in that ink fill, and it is the client's most visible call to action. The send control in [`InputBar.module.css`](../../../../packages/client/ui-conversation/src/client/skeleton/InputBar.module.css) moves off the info fill onto the same `button-primary` pair, which inverts with the theme instead of staying blue on both.

Four component treatments take the reference's own component rather than a near equivalent. The view tabs in [`ConversationRoot.module.css`](../../../../packages/client/ui-conversation/src/client/skeleton/ConversationRoot.module.css) select with ink text over an ink underline — the reference's segmented tab, whose selected state is not a hue. The blank-session headline in [`HeroShell.module.css`](../../../../packages/client/ui-conversation/src/client/skeleton/HeroShell.module.css) sits at the reference's `heading-lg` rung (40/600, 1.20 leading, -1px tracking) with the whale mark sized to that line, and its Preview chip is a `badge-beta` pill. The sidebar's local-build version tag is a legible pale-blue chip, which leaves New Session as the sidebar's only ink element. Text-entry surfaces take the reference's field rungs rather than the pill: single-line inputs and the settings selectors are `rounded.md` (8px), while the composer card and the feedback textarea are `rounded.lg` (12px), because the reference gives its own `text-input` the md rung and reserves `rounded.full` for buttons and badges. A dialog field therefore reads as a field, not as a capsule.

## Alternatives considered

**Adopt Tailwind and express the reference as utilities.** Rejected: the styling framework rules out a utility framework and a second token authority, and the per-plugin browser bundles compile their own CSS with no PostCSS stage to host it. The survey that produced this decision is recorded in the same session as the framework's own constraints.

**Restyle the components without moving the palette.** Rejected: it leaves the values that actually carry the language in the alias layer while the components change, so the two drift and the next component re-derives the palette from screenshots.

**Bundle DM Sans into the shell.** Deferred, not adopted: shipping it needs a font asset emitted through the static-linked CSS path and an entry in the generated third-party notices, which no rule in the current generator covers for a raw asset. The face also covers neither CJK nor Vietnamese — Google Fonts publishes only `latin` and `latin-ext`, whose ranges stop short of the Vietnamese block at `U+1EA0`–`U+1EF1` — so a bundled face would still hand those glyphs back mid-string to the platform stack, which is the arrangement the family-first stack already produces without the bytes. The stack names the family so a machine that has it uses it, and the fallback is the platform UI font rather than a second display face.

**Map coral onto error instead of warn.** Rejected: the reference reserves coral for attention moments. Error keeps a distinct red so the two warm families stay separable in approval and risk surfaces, where both can appear together.

## Consequences

A feature component that reads only semantic aliases re-skins with no edit, and the stylesheet contracts — corner-shape pairing, elevation, scrollbar, and the neutral-hairline rules — still hold over the new values, which is what the shipped spec run verifies. The cost is that the static token names still carry their previous brand word while holding MiniMax values; renaming the ramp would touch every direct `--dsw-static-*` consumer and is left as follow-up rather than folded into the reskin. The dark palette is now ours to maintain: the reference publishes none, so a future brand update has to be re-derived for dark rather than copied.
