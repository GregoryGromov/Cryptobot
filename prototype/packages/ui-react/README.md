# @reinforce/ui-react

React half of the split kit: radix behavior + `data-*` attributes + `cn(primitiveClass, className)`. Every visual class string lives in `@reinforce/ui-primitives` — П1–П10 contract + consumer rule there, NOT re-stated here. Golden reference: `apps/dapp/src/routes/design-system.tsx`.

## Anatomy

Folder-per-slice `src/<name>/index.tsx`, subpath export `@reinforce/ui-react/<name>`, no root barrel, no default exports, no cross-slice relative imports (`../button/…` → `@reinforce/ui-react/button`). Component = radix primitive (umbrella `radix-ui` import) + `data-slot` (tree node id) + `data-variant`/`data-size` (CSS variant targeting) + classes imported from `ui-primitives/<name>`.

Adding/porting: shadcn CLI against `components.json` (`rsc: false`) → fold output into slice form → extract every class string into `ui-primitives/src/<name>/index.ts` → replace inline strings with imports. Don't pre-emptively port shadcn components nobody consumes.

## Lint

`pnpm lint` applies React Hooks recommended-latest plus the same `jsx-a11y` flat recommended
contract as dapp. `jsx-a11y/no-autofocus` stays warning-only; Biome still owns formatting and its
overlapping syntax checks. Wrapper components must expose semantic children explicitly when static
analysis cannot see them through a props spread.

## Local quirks

- `'use client'` on stateful slices (select, sheet, dropdown-menu, accordion, switch, avatar, count-up) — portals/focus traps; Vite app, no RSC, directive is for tooling parity only.
- Wrapper deviations from stock shadcn: `DialogContent(size, closeButton)`, `SheetContent(side, closeButton, withOverlay, overlayClassName)`, `SelectTrigger(appearance)`, `Button(loading, asChild)`. `closeButton` is required: `false | { label }`; no default or boolean visibility alias.
- `Heading(as, size)` requires both axes: `as` is the semantic `h1..h6` element, `size` is the independent visual scale. No default, `level`, or `asChild`.
- `StatusDot.label` and `StepTimeline.completedLabel` are required final strings from the app dictionary.
- `CommandPalette` is custom (tree-walk filtering + keyboard nav + grouping), NOT cmdk — don't "upgrade" it to cmdk.
- `useCountUp(value, {duration, easing})` motion-safe via `useSyncExternalStore(matchMedia)` — respects `prefers-reduced-motion`. `CountUp` span is `aria-hidden` mid-animation (shown ≠ final formatted text) so a screen reader never reads intermediate ticks; exposed once settled.
- No form/field layer — consumers wire React Hook Form themselves over the primitives.
- Icons: `lucide-react` only.

## Must-not

Per-primitive `@radix-ui/react-*` deps (umbrella `radix-ui` only); inline visual classes (`rounded-2xl bg-card/80 …` = drift, belongs in primitives); root barrel.
