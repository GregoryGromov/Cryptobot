# apps/web

React 19 + Vite 8 SPA: the broker conversation and its sections. Kit = `packages/ui-*` (Reinforce interface kit v2, shadcn `new-york-v4` on Tailwind v4 + `radix-ui`). Logic canon mirrors reinforce-web `docs/frontend-canon.md`.

## Stack

TanStack Router (file routes, `autoCodeSplitting`) · TanStack Query + `@trpc/tanstack-react-query` (`trpc` options proxy) · zustand (app state) · react-i18next over `@reinforce/i18n` · ts-pattern · zod (`zod/mini` in eager code) · React Compiler (no manual memo) · Tailwind v4 via the kit · lucide-react icons · Vitest + happy-dom + Testing Library.

## Layout

```
src/
  main.tsx                 entry: live invalidation, visit tracking, render
  app/                     providers, router, shell, theme, global hosts (market picker)
  routes/                  file routes — Route + validateSearch + thin composer, nothing else
  contexts/<bc>/
    api/                   query/mutation hooks over `trpc`
    domain/                pure view-models, folds, rules (unit-tested, no React, no i18n instance)
    ui/                    components
  shared/
    api/                   trpc client, query client, error map, live pulse, session
    format/                the ONE formatting layer (`useFormatters()`)
    i18n/                  i18n instance, `useT`, locale helpers
    routing/               topic keys ↔ links
    store/                 zustand persist helper
    hooks/  ui/  connectivity/
```

Contexts: `conversation` (home, conversation, chats list, thread link), `forecast` (episode card, fan, why, all data, evaluations, verdict words), `signals` (signal lines, signals page), `trading` (deal card, ticket, trade status), `portfolio` (the account, how the forecasts come true, the forecast list), `markets` (markets page), `broker` (instructions page under the settings, forecast journal, score), `settings` (the side menu's own section: mode, instructions, markets, trade cap), `account` (sign-in, account menu). Shell + market picker live in `app/`.

## Laws

- **State has one home.** Server truth → TanStack Query; the query IS the source. Never copy query fields into `useState`. Fixed lifecycle → `useReducer` + pure `match([state, event]).exhaustive()` reducer in `domain/`. Shared app/UI state → zustand (`create<T>()(...)`, atomic selectors, `actions: {}`), never a new `createContext` for app state. Local/ephemeral → `useState`.
- **Effects sync the outside world only.** No fetch in effects (queries), no derive-in-effect (compute in render), no setState mirroring props. Subscriptions, DOM measurement, timers, imperative APIs only.
- **Data access = `trpc` proxy.** `useQuery(trpc.views.chat.queryOptions({ topic }))`; mutations `useMutation(trpc.x.y.mutationOptions({ onSuccess }))`. Never a string path, never a hand-written response type: types come from `AppRouter`; DTO names from `@reinforce/server/dto` (the ONLY server import besides `import type { AppRouter } from '@reinforce/server/router'`).
- **Business rejections** come back as `{ kind: 'rejected', reason }` results: wrap with `accepted()` from `shared/api/rejection` inside `mutationFn`/`onSuccess`, or `match` on `kind`. The mutation cache toasts errors; pass `meta: { silent: true }` when the surface shows the error inline.
- **Freshness.** `shared/api/live.ts` polls `views.pulse` and invalidates exactly the changed views (market bar → market views; conversation seq → that chat + derived views; another account → reset; a visitor turned guest → invalidate). Mutations still invalidate what they changed in `onSuccess` (`queryClient.invalidateQueries(trpc.views.x.pathFilter())`). Server time: `useServerNow(tickMs)` (skew sampled from pulse arrival). Never `Date.now()` for market time.
- **Guest accounts are automatic.** The tRPC link creates the guest account before the first protected mutation. Never call `account.guest` yourself.
- **Four states, always.** loading / error / empty / ready via `AsyncView` (`shared/ui/async-view`) + `FaultState`; loading = a skeleton twin of the real layout (`Skeleton`, `SkeletonLines`, `SkeletonShape` from `@reinforce/ui-react/skeleton`) carrying the real static copy. Independent sources degrade independently.
- **One boundary primitive.** `AppBoundary` (`tier: 'root' | 'section' | 'panel'`, `scope`). Wrap each independent page region and every card that does its own reads.
- **Thin routes, size ceiling.** `routes/*` = `createFileRoute` + `validateSearch` (zod/mini, Standard Schema) + composer. Components past ~250 LOC or heavy derivation → fold derivation into `domain/*-vm.ts` (pure, `match`-based, unit-tested). Trust-critical math (money, P&L, levels) lives in `domain/` with tests, or comes from the server.
- **Dispatch idiom.** ≥2-arm dispatch on a discriminant (`kind`/`status`/`type`) → `match(x).with(...).exhaustive()`. No ternary pyramids (a ternary inside the `?` branch) — gated by `plugins/ternary-nesting.grit`. Flat `:` chains are fine.
- **A read's state is a union** at view-model seams (`{ kind: 'loading' } | { kind: 'failed' } | { kind: 'ready', … }`), never correlated nullables.
- **Format via the facade.** `useFormatters()` (`usd`, `usdSigned`, `usdWhole`, `usdCompact`, `price`, `percent`, `change`, `move`, `int`, `decimal`, `clock`, `day`, `dateTime`, `duration`). Never inline `Intl.*` / `toLocaleString`. Money truncates, never rounds. Direction colour = `directionOf(value, digits)` → `text-up` / `text-down` / `text-muted-foreground` (or `<Numeral tone="direction">`).
- **Words via i18n.** No user-visible literal in TSX (brand names excepted: Grok, Telegram, Reinforce). Each context owns its namespace in `packages/i18n/src/locales/{ru,en}/<ns>.ts` (Russian is the source; English must have the same keys, params and plural forms — `packages/i18n/test/catalogs.test.ts`). Shared words: `common`, `errors`, `format` (owned by the foundation). Forecast/market words: `contexts/forecast/domain/verdict.ts` (`leanWords`, `horizonWords`, `forecastCheckWords`, `recordWords`, `checkWords`, `agoWords`, `untilWords`). Market names inside a sentence: `inSentence(name, locale)`.
- **Kit consumer rule.** Kit slot exists → use it (`@reinforce/ui-react/<slot>`, recipes from `@reinforce/ui-primitives/<slot>`). Read `packages/ui-primitives/README.md` (П1–П10, K-rules) before styling anything. Semantic tokens only (`bg-card`, `text-muted-foreground`, `border-border`, `bg-input-bg`, `ring-ring`) — no raw colours, no `dark:` hardcodes. Glass tiers per П7: `stageClass` once per screen, `sectionCardClass` for list cards, `glass` surfaces, `surface-inset` inside a surface, never glass on glass. Blue (`primary`) = something to press, never a selected state or a headline. Market direction: `text-up` / `text-down` (app tokens over `--success` / `--destructive`). Product-specific visuals (chat bubbles, fan chart, tape) = Tailwind utilities over kit tokens inside `contexts/*/ui`. A generic slot missing → add a NEW slice to the kit (`ui-primitives/src/<slice>` recipes + `ui-react/src/<slice>` component + package.json `exports`), never edit an existing kit slice without coordinating.
- **Accessibility through the kit.** Menus = `DropdownMenu`, dialogs = `Dialog`/`Sheet`, tabs = `Tabs`, choices = `ToggleGroup`/`RadioGroup`/`Select`, command search = `Command`. Never a `div` with `onClick`; every icon-only button has an `aria-label`; charts expose a text summary (`role="img"` + `aria-label`) and keyboard access when interactive. `eslint-plugin-jsx-a11y` gates JSX.
- **Motion.** Pages change in place, no View Transitions: the head bar (`app/shell/header/head-bar`) is one bar on every page, the composer flies to its new place (`useFlight` in `shared/hooks/use-arrival`, boarded on `onBeforeNavigate`), what the new page brings fades up once (`useArrival`). On a phone the composer stands at the bottom on every page, home included, so sending moves nothing. Component motion = kit/`tw-animate-css` utilities with `motion-reduce:` fallbacks (`transition-[x] duration-* motion-reduce:transition-none`).
- **No comments.** Default zero. A comment survives only as one line stating a constraint / invariant / workaround that names, types and tests cannot carry. No narration, no section banners, no doc-prose. Same for locale files.
- **Names** follow the domain: topic (a conversation key: `broker`, `talk-<id>`, a market's coin — `BTC`, `xyz:GOLD`; never the bare ticker), forecast, signal, proposal, trade, book (user/agent account), cycle.

## Data map (tRPC)

Queries: `views.session`, `views.chats`, `views.chat({ topic })`, `views.signals`, `views.catalog`, `views.portfolio`, `views.broker`, `views.journal`, `views.pulse`, `views.thread(id)`, `views.threadChart(threadId)`, `views.tradeChart(tradeId)`, `views.candles({ coin, frame, bars? })` (`bars` — how far back the chart reaches: `CHART_BARS` up to `MOST_CHART_BARS`), `views.forecastWhy(forecastId)`, `views.forecastInputs(forecastId)`, `evaluations(forecastId)`.
Mutations: `conversation.start({ requestId, text })` → `{ chat }`, `conversation.send({ topic, text, requestId, reviseProposalVersionId, span?, timeZone? })` (`span` — the stretch of the chart the question is about; `timeZone` — the screen's clock the broker names times by), `conversation.read({ id, seq })`, `market.analyze({ requestId, instrument, text })`, `runtime.retry({ runId, requestId })`, `trading.manual({ requestId, terms })`, `trading.confirm({ versionId, decision })`, `broker.saveVersion(...)`, `broker.activate(...)`, `broker.preferences({ kind: 'patch', patch } | { kind: 'watch', markets, on })` (the server resolves the personal broker), `telegram.link/unlink`, `account.locale(locale)`, `account.logout`, `account.grok.{pending (query), start, status, cancel}`, `account.visit`.
Subscription: `conversation.events({ id, after })` → `{ kind: 'entries', latest } | { kind: 'draft', draft } | { kind: 'analysis', progress }` (an analysis's steps as the model writes it: odds, trade, headline) (`useSubscription(trpc.conversation.events.subscriptionOptions(...))`).
`requestId` = one `crypto.randomUUID()` per user intent (kept across a retry of the same intent), never per call.
Trade preview math for the ticket: `tradePreview`, `nextMinute` from `@reinforce/server/dto`.
When a market's exchange trades: `marketHours(coin, at)` from `@reinforce/server/dto` (null for crypto and markets of no known exchange).

## Cross-context contracts

Fixed component APIs other contexts import (keep the signatures; extend only with optional props):

- `contexts/forecast/ui/episode-card`: `EpisodeCard({ forecast: ForecastNote; signal: SignalView | null; market: MarketName; open: boolean; onToggle(): void; record: Chat['record'] })`, `forecastAnchorId(forecastId): string` (DOM id the conversation puts on its own wrapper around the card and scrolls to; the card never sets it).
- `contexts/forecast/ui/check-line`: `CheckLine({ check: Extract<ChatItem, { kind: 'check' }> })`.
- `contexts/signals/ui/chat-signal`: `ChatSignal({ signal: SignalView })` — a signal inside a market topic.
- `contexts/signals/ui/live-signal`: `LiveSignalMessage({ live: LiveSignal; earlier: readonly SignalRow[] })` — the general conversation's opening signal block (fresh signal, quiet market, or «no fresh signal»).
- `contexts/signals/ui/signal-rows`: `SignalRows({ items: readonly SignalRow[]; onOpen(signal: SignalRow): void; quiet?: ReactNode })` — tappable signal lines (the general conversation's earlier signals).
- `contexts/signals/ui/live-rows`: `LiveRows({ items: readonly SignalRow[]; onOpen(signal: SignalRow): void; quiet?: ReactNode })` — the home screen's signals: the three latest waves as sentences.
- `contexts/trading/ui/deal-card`: `DealCard({ proposal: ChatProposal; marketName: string; topic: string })`.
- `contexts/trading/ui/trade-ticket`: `TradeTicket({ chat: Chat; open: boolean; onOpenChange(open: boolean): void; docked?: boolean })` — a manual trade on the topic's market: docked, a panel beside the conversation; otherwise a bottom `Sheet`. `contexts/trading/ui/use-trade-ticket`: `useTradeTicket(): { open, docked, toggle(), setOpen(open) }` — docked on a wide screen, where the open panel is remembered from topic to topic.
- `app/market-picker/market-picker`: `useMarketPicker(): (request: { title: string; onPick(market: PickedMarket): void }) => void`, `PickedMarket = MarketName & { key: string }`; `<MarketPickerHost />` is mounted by the shell.
- `contexts/account/ui/sign-in`: `useSignIn(): { start(): void }` opens the Grok sign-in dialog; `<SignInHost />` is mounted by the shell.
- `contexts/conversation/domain/topics`: `topicsOf(chats, visiting)`, `visitingMarket`, `searchTopics`, `groupTopics`, `Topic`; `domain/topic-preview`: `previewText(row, words)`; `ui/use-topic-title`, `ui/use-topic-preview` — the one topic list and preview (sidebar, chats page).
- `contexts/signals/api/use-open-signal`: `useOpenSignal(): (signal) => void` — opens the signal's topic at once; a signal not read yet is analysed there by its `eventId` (via `useLaunch`).
- `contexts/conversation/api/launch`: `useLaunch(): (launch) => Promise<void>` — whatever asks the broker from outside its conversation (home, signals, options, another market's asset) opens the conversation first with the request already waiting in its outbox (`api/outbox-store`), then calls the server.
- `contexts/broker/ui/broker-journal`: `ForecastJournal()` — the forecast list on the term the person trades, bare (the portfolio's «Прогнозы» tab holds it); `contexts/broker/domain/journal-vm`: `journalRows(journal, horizon)`; `contexts/broker/domain/overview-vm`: `scoreOf(terms, horizon)`, `SCORE_FROM`; `contexts/broker/ui/use-version-words`: `useVersionWords(): string | null` — «Версия N · модель».
- `contexts/settings/ui/mode-picker`: `ModePicker()` — the composer's choice of how the person trades (scalper, 5 minutes; day trader, 30): a quiet button beside «Актив», the same preference the settings row saves.
- `shared/ui/unread-badge`: `UnreadBadge` — the one unread count.
- `shared/routing/topics`: `topicLink(topic)` → `<Link {...topicLink(topic)}>`, `topicKind`, `GENERAL_TOPIC`, `talkTopic`, `assetCode`, `tickerOf`.
- `shared/api/session`: `useSession()`; `shared/api/live`: `usePulse()`, `useServerNow(tickMs)`; `shared/api/trading-mode`: `useTradingMode(): { mode, horizon }` — how the person trades (scalper, 5 minutes; day trader, 30) and the one horizon every screen shows a forecast on (`onTerm(forecast, horizon)` in `contexts/forecast/domain/episode-vm`).
- Charts: geometry from `@reinforce/ui-primitives/charts` (`linearScale`, `linePath`, `areaPath`, `sparkPath`, `chartTicks`, `fittedTicks`, `nearestIndex`, `placeTooltip`, `chartSeriesVars`, tooltip classes); React wiring in `shared/ui/chart/` (`useChartWidth` callback ref, `useChartCrosshair` pointer + keyboard, `mergePointerHandlers`, `ChartTooltip`). Marks are SVG drawn by the screen; formatting stays at the screen.

## Tests

`pnpm --filter @reinforce/web test` (happy-dom). Domain folds/view-models get unit tests next to the source (`*.test.ts`); behaviour that users rely on (sending, confirming, optimistic echo, unread line, form validation) gets Testing Library tests (`*.test.tsx`) that render real components with a seeded `QueryClient` (`queryClient.setQueryData(trpc.views.chat.queryKey({ topic }), fixture)`). One behaviour per `it`, named as a present-tense claim; expected values are literals, never computed by the code under test. No `toHaveBeenCalled` on our own modules; reset zustand stores and `localStorage` in `beforeEach`.

## Commands

`pnpm --filter @reinforce/web dev` (proxies `/trpc` to the server on `PORT`, default 8787) · `typecheck` · `lint` (ESLint: hooks + jsx-a11y) · `test` · `build`. Biome (root) gates format, sorted classes, ternary pyramids, zustand selectors.
