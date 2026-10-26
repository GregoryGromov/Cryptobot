# @reinforce/ui-styles

Tailwind v4 layer owns typography + glass/glow effects on top of `@reinforce/ui-tokens`. `tailwindcss` peer dep — apps install plugin variant matching bundler.

## Ten invariants

| Rule | Why |
|---|---|
| **Backdrop contract**: `<body class="app-backdrop">` — never `@apply app-backdrop` | `@apply` inlines utility properties but no class added to element, so `::before` / `::after` cloud + noise pseudos never match. Page renders flat tinted, not glass-ready. |
| `effects.css` reads tokens via `--*` references; `globals.css` (imports tokens) **must import first** | Standalone-import contract. `effects.css` references `--primary{,-foreground}`, `--surface-tint-*`, `--ambient-aurora-*`, `--shadow-color`, `--motion-*`. Import `effects.css` alone = all vars unresolved. |
| Self-host fonts; `"Reinforce Sans"` variable family + static script families; HTML `lang` selects Noto fallback | Latin, Cyrillic, Vietnamese, symbols = IBM Plex Sans Var (`wght 100–700 × wdth 85–100`). UI renders `font-stretch: 85%` (body) — IBM's `wdth 85` equals Plex Sans Condensed to the font unit, so Cyrillic and Latin share one width. Google/Fontsource's `wdth 85` is ~4% wider: take IBM upstream only. Long-form reading gets 100% via `prose-reinforce` (`.not-prose` widgets back to 85%) or `[data-longform]` / FAQ answers (`accordionContentInnerClass`). Arabic/Devanagari/Thai = own static `IBM Plex Sans X` families (400–700, no width axis) listed right after `"Reinforce Sans"` in `--font-sans`; strict `unicode-range` keeps them off Latin pages. Never alias them into the variable family: Chrome unions one family's faces by `unicode-range` only among identical weight/stretch/style descriptors and picks one descriptor group per request — mixed range + static faces rendered 100% prose in Arial and 85% Arabic UI in Arial. `--font-mono` walks the same script families before its Courier New fallback and IBM Plex Mono ships Cyrillic + Vietnamese subsets: numeric headlines carry translated words («обеспечено 108,66%»), which otherwise drew in Courier New. Noto covers scripts IBM Plex lacks. Native `:lang()` selects one script family; keep `lang` on foreign-language labels as well as the document. A global list of every family made English Linux pages download unrelated fonts when Arial was unavailable. Expanding every static Unicode range instead inflated mobile CSS past the PWA asset limit. Fontsource subset CSS stays local and pinned; script selection uses the cascade, with no browser loader. Dapp precaches Latin1 + Pi + Mono Latin only; other `/fonts/` faces cache at runtime (`sw.ts`), bundled language fonts load on demand. |
| `scripts/gen-fonts.mjs` (`pnpm fonts:generate`) owns the Plex Sans Var subsets in `src/fonts/` and `font-fallbacks.generated.css` | One pinned source, `@ibm/plex-sans-variable` (postinstall telemetry denied in `allowBuilds`): script copies its split woff2 and reads each (`wght`, `wdth`) instance's metrics from the package TTF — split woff2 lose named instances, fontkitten cannot instance woff2. Metric-overridden Arial/Courier-New fallbacks per weight × width neutralize CLS during swap (Chrome `font-fallbacks` doctrine). Hand-editing either output forbidden. Version bump, new weight or width ⇒ edit `SANS`/`MONO` in the script + rerun. |
| Vite and Astro 7 use `@tailwindcss/vite` | Astro 7's PostCSS resolver treats bare CSS imports as files and fails with ENOENT; the Vite plugin resolves them. Tailwind v4 only. |
| `font-figure` = Sans + `ss04` (dotted zero) + tabular figures + `unicode-bidi: isolate`, through `--font-figure` / `--figure-features` | One numeric voice: money, percents and the amount field. Plex Sans figures are already tabular and 7–8% narrower than Mono; the slashed/dotted zero keeps 0 apart from O. Mono stays for what a reader verifies character by character — addresses, hashes, formulas, time stamps. The isolate keeps a figure and its unit one run inside Arabic/Urdu text (D30). |
| `touch-target` = ≥ 44px hit area on `pointer: coarse` via a centred `::after`; host must be positioned | Kit controls are 32–40px to the eye; a finger needs 44 (K8). The pseudo grows the hit box, not the layout. A host that already paints `::after` (`.glass-hover`, `.chip-glass-ghost`) conflicts on touch — keep the two apart. |
| `tone-{neutral,primary,success,warning,destructive}` set `--tone-bg` / `--tone-ring` / `--tone-fg`; components paint `bg-tone-bg ring-tone-ring text-tone-fg` | One soft tint per status — 10% fill, 30% ring, full-colour glyph — instead of `/8 /10 /12 /15 /20 /25 /30` picked at each site. A variant names its tone; the class string that paints it stays one. Theme flip rides the base `--<tone>` token. Medallions stay on `--tile-*` (`TileIcon`): their light theme is a solid fill, not a tint. |
| `[data-fault]` freezes skeleton twins: no breath, text bars draw «—» | A failed source must not look like an endless load (K10). `FaultState` stamps the attribute; the twin keeps its geometry, so the screen does not jump when Retry lands. |
| `.btn-cta*` lives as CSS in `effects.css`, not Tailwind arbitrary-value class string | Tailwind v4 arbitrary-value parser unreliable on nested commas in `color-mix()` / `linear-gradient()` / multi-stop `box-shadow`. Hero-CTA needs all three. Extracting to CSS is workaround, not preference. |

## Ambient-aurora design

`.ambient-aurora` = chaotic IRIDESCENT fog (not orbs, not a directional gradient) for hero glass-cards. Hue duo stays in the brand's blue family: light = primary + blue-300, dark = primary + violet (hue 295, brand-blue-adjacent; below ~285 melts into backdrop). Amber or success green over near-white glass mixed to khaki, and green on a surface competes with "money arrived". Hosts: landing hero, onboarding hero, blog cover. The dapp stage (`stageClass`) uses the static `.stage-glow` instead — a stage does not move on its own. Each pseudo carries **one aurora-1 + one aurora-2** soft blob (4 total, hues interleaved — not "one hue per corner"); blobs wander **closed loops** (keyframe `0/25/50/75/100`, divergent per-layer waypoints) in different directions, so there's no up/down axis and the aurora-1↔aurora-2 overlap zones migrate = iridescence. The two pseudos' `opacity` runs out of phase → hue dominance slowly breathes. Soft falloff (`transparent ~74%`), centers partly off-canvas (`background-size >150%`) — no disc edge. `::before` + `::after` both `z-index: -1` (paint between bg and content — text never veils); `::before` carries a 1px top-gloss, and pseudos stay `inset: 0` so fog never leaks past the pane (safe without `overflow-hidden`). Alpha is low — the shimmer sits in the frost, felt not watched. Periods 31s + 43s — both prime, LCM ≈ 22min — never sync; their mismatch also rocks the dominance crossfade = extra organic. Under `prefers-reduced-motion`, freezes in off-center static (web.dev consensus: reduce, not none).

**Desync co-located surfaces** with `--aurora-seed` (unitless number, default `0`): it phase-shifts each layer via a negative `animation-delay`, so e.g. the header balance pill (`--aurora-seed: 5`) and a hero tile (default `0`) on the same screen don't drift in lockstep. No JS RNG — set a distinct integer per surface that co-appears. Single isolated surface needs no seed.

Apply **one surface per screen**, unless intentionally desynced via `--aurora-seed`. Stacking unrelated ambient effects reads "casino".

## Backdrop layer details

`app-backdrop` built only from `--backdrop-*` tokens: utility sets `position: relative; isolation: isolate; background-color: var(--background)` on host. Decorative layers live in two viewport-fixed pseudos so they don't stretch with page length:

- `::before` (`position: fixed; inset: 0; z-index: -2`) — 5 radial-gradient clouds over `linear-gradient(--backdrop-base-top → --backdrop-base-bottom)`.
- `::after` (`fixed; z-index: -1`) — SVG-fractal noise via `mix-blend-mode: multiply` (`screen` under `.dark`) and `--backdrop-noise-opacity`.

**Previewing `app-backdrop` on child** (e.g., design-system swatches) — wrap preview in `contain: paint` or `transform: translateZ(0)` so fixed pseudos attach to preview's containing block instead of viewport.

Apps may override individual `--backdrop-*` after `globals.css` (cascade wins) — change *values*, not *utility*.

## App integration (5 steps)

1. Install plugin: Vite `tailwindcss @tailwindcss/vite`; Astro `tailwindcss @tailwindcss/postcss`.
2. Wire plugin into bundler config.
3. App `src/styles.css`: `@import "@reinforce/ui-styles/globals.css";` + cross-workspace `@source` directives — **apps consuming React kit scan both `packages/ui-primitives/src` AND `packages/ui-react/src`**; Astro apps consuming only cva recipes scan only `ui-primitives/src`. **Don't put `@source` in shared `globals.css`** — relative paths break across consumers.
4. Symlink `apps/<name>/public/fonts → ../../../packages/ui-styles/src/fonts`.
5. Import CSS once at app entry; toggle dark via `class="dark"` on `<html>`.

Customizing: override semantic token in app CSS by re-declaring after `globals.css`. Don't fork `theme.css` — extend it.

`.glass-overlay` = the floating surface of a dialog or sheet: `--overlay-surface` fill, glass blur, rim and halo of `.glass-strong`. `sheetContentVariants` and `dialogContentClass` carry it; menus, popovers and tooltips stay `glass-strong`.
