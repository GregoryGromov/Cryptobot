# @reinforce/ui-tokens

Framework-agnostic CSS tokens. shadcn-compatible semantic surface + glass/glow/backdrop extensions.

## Five invariants

| Rule | Why |
|---|---|
| **Token surface mirrors `npx shadcn@latest init` for Tailwind v4 exactly** — customize *values*, not *set* | Trim shadcn defaults break shadcn CLI compat (`add component` write refs to vars not exist). Add non-shadcn vars force every consumer know our private set. Status (`--success*`/`--warning*`) **only** explicit exception — tone API need surface shadcn no ship. |
| **Brand-role split**: `--primary = blue` (CTA, focus ring, switch-on, caret, selection); `--accent = amber` (brand medallion `--tile-accent-*`, `--chart-2`, dark backdrop cloud) — never hover, focus, current row or info | One token per semantic role — components write `bg-primary text-primary-foreground`, not `bg-blue-500`. Swap brand color = one token change. Mix roles ("accent for CTAs sometimes") destroy discipline. Blue = presses; amber/red = attention/failure; a "you are here" row or an info note rides neutral `foreground` tint. |
| **`--link` = text-link blue, one step lighter than `--primary`** (dark `oklch(0.72 0.15 257)`, light `oklch(0.52 0.2 258)`); `Button variant="link"` writes `text-link` | `--primary` is tuned as a fill under white text; as 13–14px text on glass it reads heavy. Links take their own tone so the fill never shifts to suit the text. |
| **`--foreground-soft` = second ink** (dark `oklch(0.8 0.014 252)`, light `oklch(0.42 0.015 256)`): nav labels, sentence lines, action sub-lines, header glyphs | Between `--foreground` and `--muted-foreground`. An alpha of foreground lands at different lightness per theme (≈0.79 dark, ≈0.67 needed light), so the step is its own token. |
| **`--overlay` = the one scrim, `--overlay-surface` = the one floating sheet** (dark scrim `oklch(0.1 0.01 266 / 0.62)` + 3px blur on every overlay recipe; dark surface `oklch(0.2 0.022 262 / 0.95)`, light = glass ground at 0.95) | Every board with a dialog, sheet or palette draws the same dimmed, slightly blurred page behind a near-opaque surface. One value per role: a per-dialog alpha (0.92–0.97 on the boards) is noise behind a 62% scrim. |
| Amber foreground = **warm near-black** `oklch(0.20 0.04 70)` (light) / `oklch(0.18 0.04 70)` (dark), NOT white | White-on-amber fail WCAG AA 4.5:1. Warm-black on amber sit above bar + match temperature of amber surface — cool-black read as color clash. |
| **Dark standalone, not inverted light** — own `--primary = blue-500` w/ white foreground, `--accent = amber-400` (brighter ring) | Invert OKLCH palette no produce usable dark theme — luminances need re-tune, contrast ratios re-check. Dark get own `.dark` block; shared structure = var *names*, not values. |
| **Surfaces quiet, one tone of glow** — `--glass-halo` neutral shadow both themes, glass rim 8% (`--glass-border-a` 0.08 dark, foreground 92% light), aurora = primary + blue-300 (light) / primary + violet (dark), light backdrop two clouds (`--backdrop-3..5` transparent) | A primary-tinted halo under 125 equal cards read as noise; amber or success green in the light aurora mixed to khaki on near-white glass. Glow left for the primary button. `prefers-reduced-transparency` / `prefers-contrast: more` → tint 0.97, blur 0. |
| **`--border-control` = 3:1 against the card** (light `oklch(0.64 …)`, dark `oklch(1 0 0 / 0.38)`), also the unchecked switch track | WCAG 1.4.11: a control's boundary needs 3:1. `--border` (≈1.3:1) stays for dividers; checkbox, radio, switch, amount field and the selected segment ride `border-control`. |
| **Semantic dark tokens** (`--input-bg`, `--switch-track-checked`, etc.) live in tokens, not components | Components write `bg-input-bg`; never hardcode `dark:bg-input/30`. Dark-mode variants in component class strings scatter theme; centralize as tokens = re-skin is tokens-only PR. |

## Slices

- `./palette.css` — primitive OKLCH scales 50–950 for `neutral`, `blue`, `danger`, `amber`, `emerald`, `violet`. **Components must never reference `--palette-*` directly** — always go through semantic token. Palette = brand-color source of truth; semantic tokens map onto it.
- `./theme.css` — canonical shadcn semantic set on `:root` / `.dark`. Standard shadcn vars (`--background`, `--card*`, `--primary*`, etc.) + status extension (`--success*`/`--warning*` + ring colors) + glass/glow/backdrop tokens + surface/shadow tokens + semantic dark tokens.

The light-theme success tone uses emerald 700 so small status text remains legible
on tinted glass; emerald 600 fell below 4.5:1 in the yield explainer. The dark tone
retains its separate lightness.

Every status tone carries 14px text on the card and a label on its own fill, so each light value
sits at L ≈ 0.56–0.58: `--destructive` = danger 600 (4.63:1 on the card, 4.77:1 under white),
`--warning` = `oklch(0.56 0.17 50)` (4.8:1 both ways, `--warning-foreground` white). Danger 500 and
L 0.715 orange read 3.7:1 and 2.6:1 as text. Dark text tones keep their lightness; a filled button
or badge darkens its fill in `ui-styles` instead (`--btn-fill`), never the token.

## Why warning hue ≈ 50 distinct from accent hue ≈ 70

Both amber-family. 20° hue separation make warning surface (orange-lean) read distinct from brand CTA (true amber). Without separation, `[data-tone="warning"]` panel look like misclicked primary action — wrong affordance.

## `--tile-*` — theme-flipped status medallion

`--tile-{success,warning,destructive,accent}-{bg,fg,ring}`. Light = solid status fill + on-tone glyph (`--success-foreground`, warm-black on amber per rule above, white on warning and destructive); dark = 10 % tint + tone-coloured glyph. Reason legibility, not taste: 10 % of a status colour disappear against light backdrop; solid fill on near-black backdrop shout. Consumer = `tileIconVariants` (`ui-primitives/tile-icon`) — flip live here so no component ship a tone that skip it, and no `dark:` in class string. New status tone = 6 lines (`:root` + `.dark`), never a `bg-<tone>/10` at call site. Chrome tones (`primary`/`neutral`) carry no status colour — they ride `--card`/`--border`, which flip themselves. Soft tint (notes, chips, step marks) is not a medallion: `tone-*` utilities in `ui-styles` mix the same base `--<tone>` at 10 % / 30 %.

## What NOT to add

- `--tertiary` — three brand colors one too many for coherent system.
- `--surface-*` clamps — surface tinting via `color-mix` against existing tokens more flexible.
- `--text-*` clamps — Tailwind v4 ship `text-xs..text-9xl`; reimplement as tokens duplicate without gain.

Non-shadcn extensions: `--success`/`--warning` (tone API, shadcn no ship), plus design-system families — `--radius-{control,island,card,pill}`, `--motion-duration-*`/`--motion-ease-*`, `--surface-tint-*`, `--tile-*`. Customize *values*, not the *set*.