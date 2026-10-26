# Crypto Trading Bots & Bot-like Trading Terminals: Competitive Landscape (as of 22 Oct 2026)

*Data conventions: "DefiLlama API, 22 Oct 2026" = figures I pulled directly from `api.llama.fi/overview/fees` and `api.llama.fi/summary/fees/<slug>` on 2026-10-22 (30d window ≈ 22 Sep–21 Oct 2026; quarterly sums are my aggregation of DefiLlama daily fee series). "Fees" = gross fees paid by users; "revenue" = fees kept after referral/cashback payouts. Anything dated 2023–2024 is labelled HISTORICAL. Company-reported numbers are labelled as such.*

---

## 1. Who are the leading Telegram bots and web/mobile trading terminals in 2025–2026, and which chains do they cover?

### Takeaway
By Oct 2026 the market is led by web terminals and mobile apps, not Telegram-native bots: **Axiom** (Solana/BSC/Robinhood Chain), **GMGN** (multi-chain, incl. Robinhood Chain/BSC), **Fomo** (mobile, self-custodial, cross-chain) and **Terminal by Pump.fun** (ex-Padre) are the top four by fees, while the 2023–2024 Telegram leaders (Maestro, Banana Gun, BONKbot, Trojan, Unibot, Sol Trading Bot) have shrunk to low single-digit share. BullX stopped trading on 1 Jun 2026; Photon is a fraction of its 2024 peak.

### Cited Findings
**Current ranking (30-day, to ~21–22 Oct 2026)**
- Openchainbench (Allium-backed tehcscreener `/bots` data, measured 2026-10-22): 30d volume — **Fomo $3.83B**, **Axiom $3.20B**, **GMGN $1.83B**, pump.fun app $1.12B, **Terminal (Padre) $499.5M**, **Trojan $87.7M**, **Photon $29.8M**; 24h volume Axiom $90.2M, Fomo $75.9M, pump.fun $39.8M, GMGN $38.1M, Terminal $14.9M, Trojan $2.19M, Photon $0.87M — [Openchainbench](https://openchainbench.com/benchmarks/trading-platform-wars)
- DefiLlama 30d fees (22 Oct 2026): **Axiom $33.06M** (revenue $15.75M), **GMGN $18.28M** (rev $14.74M), **fomo $18.08M** (rev $17.10M), **Terminal $5.08M** (rev $2.66M), Propr $1.49M, **Trojan $0.91M**, Hypernova $0.90M, **Maestro $0.83M**, **Photon $0.36M**, Matcha $0.19M, copyfomo $0.15M, moonshot $0.14M, **BONKbot $0.10M**, SolTradingBot $0.03M, Banana Gun ~$0.00M (see tracking caveat in Q3), BullX $0 — [DefiLlama API overview/fees](https://api.llama.fi/overview/fees?dataType=dailyFees); [DefiLlama Axiom](https://defillama.com/protocol/axiom); [DefiLlama GMGN](https://defillama.com/protocol/gmgn)
- DefiLlama categorises Telegram-native bots ("Telegram Bot": Terminal, Trojan, Maestro, BONKbot, Banana Gun, BullX, SolTradingBot, Unibot, PAAL AI, Nova, Padre, MEVX, Pepeboost, RayBot, DTrade(TON), Priority(MegaETH), etc.) separately from "Trading App" (Axiom, GMGN, fomo, Photon, moonshot, LAB Terminal, Ave.ai, o1.exchange, Looter, Matcha, Propr, Hypernova, UniversalX…) — [DefiLlama API overview/fees](https://api.llama.fi/overview/fees?dataType=dailyFees)

**Mid-2026 Solana snapshot (Blockworks data, 4 Jun 2026; daily Solana spot volume via trading platforms ≈ $115.4M)**
- Axiom $51.5M/day (44.6%, down from 50.3% a week earlier); Phantom $21.6M (18.8%, +40% in 6 days); Fomo $19.8M (17.2%, +57%); Terminal $8.9M (7.7%); Trojan $4.7M (4.1%); Photon $2.0M (1.7%); Bloom $1.03M (0.9%); BONKbot $0.98M (0.9%); Maestro $0.81M (0.7%); Moby $0.44M; BullX $0.13M (0.1%, discontinued); GMGN $0.05M on Solana (0.04%); mobile share of volume rose 28%→36% in one week — [Moby ranking citing Blockworks](https://moby.win/best/solana-trading-apps-2026/) (note: Moby is itself a ranked competitor; underlying data [Blockworks Analytics](https://blockworks.com/analytics/solana/trading-platforms-financials-12748))
- Five platforms took >92% of Solana spot trading-platform volume by mid-2026 — [Datawallet citing Blockworks](https://www.datawallet.com/crypto/best-telegram-crypto-trading-bots)

**Chain coverage (per product)**
| Product | Form factor | Chains (2026) | Source |
|---|---|---|---|
| Axiom | Web terminal (YC-backed, launched late Jan 2025) | Solana spot; BSC; Robinhood Chain (added Jul 2026); perps via Hyperliquid | [DefiLlama](https://api.llama.fi/overview/fees?dataType=dailyFees); [X post Jul 2026](https://x.com/watchingmarkets/status/2075738742900318501); [Coin Bureau](https://coinbureau.com/review/axiom-trade-review) |
| GMGN | Web + mobile app + Telegram bot + gmgn-cli + AI-agent access | Solana, Ethereum, BSC, Base, Monad, Robinhood Chain | [DefiLlama](https://api.llama.fi/overview/fees?dataType=dailyFees); [GMGN.ai](https://gmgn.ai/); [Paragraph](https://paragraph.com/@coinpower/gmgn-generates-dollar26-million-in-daily-fees-and-the-on-chain-bull-market-has-already-changed-chains-three-times) |
| Fomo | Mobile social trading app, self-custodial, gasless | Solana native + cross-chain via Relay (Robinhood Chain, Base, BSC, Ethereum, Arc, Monad) | [DefiLlama methodology](https://api.llama.fi/summary/fees/fomo-wallet?dataType=dailyFees) |
| Terminal (Pump.fun; ex-Padre) | Web terminal + TG | Solana, Ethereum, BSC, Base | [DefiLlama](https://api.llama.fi/overview/fees?dataType=dailyFees); [Moby](https://moby.win/best/solana-trading-apps-2026/) |
| Phantom | Wallet with swap + perps (Hyperliquid builder) | Multi-chain; 20M+ users | [Moby](https://moby.win/best/solana-trading-apps-2026/) |
| Trojan | Telegram bot + browser terminal | Solana | [AMBCrypto Aug 2026](https://ambcrypto.com/top-12-telegram-trading-bots-that-crypto-traders-should-know-in-august-2026/); [openliquid](https://openliquid.io/telegram-trading-bot/) |
| Banana Gun | Telegram bot + Banana Pro web terminal | Ethereum, Solana, BSC, Base, MegaETH (from 9 Feb 2026) | [Banana Gun PR, Mar 2026](https://markets.financialcontent.com/wral/article/globeprwire-2026-3-17-banana-gun-clears-8b-annualized-volume-as-trading-patterns-mirror-retail-brokerages) |
| Maestro | Telegram bot | BSC, Ethereum, Arbitrum, Solana, Base | [DefiLlama](https://api.llama.fi/overview/fees?dataType=dailyFees) |
| BONKbot | Telegram bot | Solana | [DefiLlama](https://api.llama.fi/overview/fees?dataType=dailyFees) |
| Bloom | Telegram bot + Chrome extension | Solana, Ethereum, BSC, Base, HyperEVM | [Moby](https://moby.win/best/solana-trading-apps-2026/); [MadeOnSol](https://madeonsol.com/compare/bloom-vs-nova-bot) |
| Sigma | Telegram bot | ETH, BSC, Base, AVAX, ARB, SOL, Blast (other listing adds Robinhood, Stable, Arc) | [Quicknode](https://www.quicknode.com/builders-guide/tools/sigma-bot) |
| Nova | Telegram bot | Solana | [MadeOnSol](https://madeonsol.com/compare/bloom-vs-nova-bot) |
| Photon | PWA web terminal | Solana | [Moby](https://moby.win/best/solana-trading-apps-2026/) |
| BullX / BullX Neo | TG + web | Solana, ETH, BSC, Base, Arbitrum, Blast — **trading disabled 1 Jun 2026** | [AMBCrypto](https://ambcrypto.com/top-12-telegram-trading-bots-that-crypto-traders-should-know-in-august-2026/); [SolanaTracker](https://www.solanatracker.io/blog/bullx-shutdown) |
| Moonshot | Mobile app | Solana; 2M+ users | [Moby](https://moby.win/best/solana-trading-apps-2026/) |
| Moby | Native mobile | Solana, Base | [Moby](https://moby.win/best/solana-trading-apps-2026/) |
| PVP.trade | Telegram bot for Hyperliquid perps | Hyperliquid | [Dwellir](https://www.dwellir.com/blog/hyperliquid-builder-codes) |
| Kreo, PolyCop, PolyGun, Polycule, TradePolyBot | Telegram bots for Polymarket (Kreo also Kalshi) | Polygon (Polymarket) | [Polymarket Academy](https://polymarketacademy.com/guides/best-polymarket-copy-trading-telegram-bots) |

**Corporate events**
- Pump.fun acquired Padre (≈4% Solana terminal share; also on BSC, Base, Ethereum) on 24 Oct 2025, undisclosed price; rebranded "Terminal" — [Blockworks](https://blockworks.co/news/pump-acquires-padre); [The Defiant](https://thedefiant.io/news/defi/pumpfun-acquires-memecoin-trading-terminal-padre)
- BullX disabled trading at 00:00 UTC 1 Jun 2026 (announced on Discord 31 May as a pause "for future upgrades"); withdrawals/wallets kept open; no relaunch timeline as of late Sep 2026 — [SolanaTracker](https://www.solanatracker.io/blog/bullx-shutdown); [Phemex](https://phemex.com/news/article/bullx-suspends-trading-functionality-to-focus-on-future-development-87410); [MadeOnSol](https://madeonsol.com/blog/best-bullx-alternatives)
- Fomo raised $17M Series A led by Benchmark (Nov 2025) and $75M Series B led by Index Ventures with USV and Benchmark at a $550M valuation (22 Jun 2026) — [Yahoo/TechCrunch](https://finance.yahoo.com/news/why-benchmark-made-rare-crypto-140000489.html); [Fortune](https://fortune.com/2026/06/22/fomo-series-b-fundraise-index-ventures-union-square-ventures/)

**HISTORICAL leaders (2023–2024)**
- Dune-based snapshot (8 Oct 2023): total TG-bot volume $2.94B, Maestro 74.9%, Unibot 12.3%, Banana Gun 10.3% — [Mask Network "Decoding Telegram Bots"](https://masknetwork.medium.com/decoding-telegram-bots-652bc1a3d244) (attribution via search snippet)
- Later 2023: Banana Gun overtook Unibot for #2 with ~35% of the user base; Unibot user share fell below 10% — [DODO analysis](https://dodotopia.notion.site/Evaluating-the-Current-Landscape-of-the-TG-Trading-Bot-Space-10c0b4c9100c4d42ae2d5185b25b0fd8)

### Inferences
- From Openchainbench 30d volumes (22 Oct 2026), share among the seven tracked terminals ≈ Fomo 36%, Axiom 30%, GMGN 17%, pump.fun app 11%, Terminal 5%, Trojan 0.8%, Photon 0.3% (my arithmetic). Fomo appears to have overtaken Axiom by volume in the latest 30 days, while Axiom still leads by fees (higher take rate).
- The "Telegram bot" category is now mostly a distribution/notification surface bolted onto web/mobile terminals (GMGN, Banana Pro, Trojan terminal, Bloom extension) rather than a standalone winning form factor.

### Gaps
- No independent Oct 2026 Blockworks/The Block share table across all chains (Blockworks dashboard is JS-only; DefiLlama web pages returned 403, data came from DefiLlama API instead).
- Bloom, Nova, Sigma, Padre-pre-acquisition and Phantom are not (or only partially) in DefiLlama's bot categories; no reliable fee data for them.
- One review site claims "Axiom (ex-Photon)" / "Photon is now part of Axiom's branding" — [memegateway](https://memegateway.com/academy/axiom-trading-bot-guide/); I found no primary confirmation and treat it as unreliable.

---

## 2. Exact feature sets (sniping, limit/DCA, copy trading, MEV protection, anti-rug, TP/SL, multi-wallet, perps, prediction markets, cross-chain, mobile)

### Takeaway
Feature parity is near-total on the spot side (snipe, limit, DCA, TP/SL, copy-trade, wallet tracking, MEV protection, multi-wallet are table stakes). Differentiation in 2025–2026 moved to: (1) speed/UX of a "trenches" discovery feed (Axiom Pulse), (2) mobile + social + self-custody + gasless (Fomo, Phantom), (3) breadth of new chains on day one (GMGN/Banana Gun/Axiom on Robinhood Chain, MegaETH), (4) bundling perps (Hyperliquid builder codes) and prediction markets into one account.

### Cited Findings
**Axiom**
- Net swap fee tiers 0.95% (Wood) → 0.75% (Champion) with SOL cashback 0.05% → 0.25%; Hyperliquid perps up to 50x (USDC collateral); yield via SOL staking / axiSOL LST (5% of earnings, 0.1% withdrawal fee); wallet and X/Twitter tracking; limit orders; MEV modes Off / Reduced (Jito) / Secure (waits for whitelisted validator); "Pulse" with "Final Stretch"/"Migrated" views and Quick Buy; non-custodial (create in-app wallet or connect Phantom) — [Coin Bureau, updated 9 Jun 2026](https://coinbureau.com/review/axiom-trade-review)
- Migration snipers, wallet + Twitter tracking, one-click trading, spot+perps — [AMBCrypto Aug 2026](https://ambcrypto.com/top-12-telegram-trading-bots-that-crypto-traders-should-know-in-august-2026/)
- Robinhood Chain router live; 833,565 swaps in a 3-day window (2026) — [Coinmonks](https://medium.com/coinmonks/best-robinhood-chain-meme-coin-trading-platforms-in-2026-gmgn-vs-axiom-vs-fomo-vs-terminal-43e130d87181)
- Native mobile app status conflicting (one site says no official iOS/Android app as of Oct 2026; another says yes) — [axiomtradeapp.com](https://axiomtradeapp.com/); [techiexpert](https://techiexpert.com/axiom-trade-review/)

**GMGN**
- Flat 1% per trade; multi-chain (Solana, ETH, BSC, Base); wallet tracking; "AI agent features" — [Moby](https://moby.win/best/solana-trading-apps-2026/)
- New-token monitoring, security auditing, holder analysis; available on web, mobile app, Telegram bot, gmgn-cli and "AI agents" — [GMGN.ai (site description via search)](https://gmgn.ai/)
- Copy trading (up to 10 wallets), sniper, limit orders, wallet tracking, SL settings — [AMBCrypto](https://ambcrypto.com/top-12-telegram-trading-bots-that-crypto-traders-should-know-in-august-2026/)

**Fomo**
- 0.50% per trade, $0.95 minimum; social copy-trading; Apple Pay on-ramp; self-custodial, gasless swaps on mobile — [Moby](https://moby.win/best/solana-trading-apps-2026/); [DefiLlama](https://api.llama.fi/summary/fees/fomo-wallet?dataType=dailyFees)
- Series B proceeds earmarked for equities, perpetuals and prediction markets — [Fortune](https://fortune.com/2026/06/22/fomo-series-b-fundraise-index-ventures-union-square-ventures/)

**Terminal (Pump.fun, ex-Padre)**
- Multi-chain (Solana, Ethereum, BNB Chain, Base); DCA, grids, limits, SL/TP; up to 35% fee cashback via referrals paid in SOL — [Moby](https://moby.win/best/solana-trading-apps-2026/)

**Banana Gun (company-reported, Mar 2026)**
- Telegram bot + Banana Pro web terminal (customisable charts, multi-wallet portfolio, copy trading with spend caps and performance history, limit orders, DCA, notifications); MEV-protected routing, pre-trade honeypot simulation, anti-rug monitoring, reorg protection on all chains; claims 88% first-block snipe success on Ethereum; planned "Banana Swap" wallet-only UI; no perps, no AI mentioned — [Banana Gun PR](https://markets.financialcontent.com/wral/article/globeprwire-2026-3-17-banana-gun-clears-8b-annualized-volume-as-trading-patterns-mirror-retail-brokerages)
- Fees ~0.5% manual, ~1% auto-snipe; auto-sniping, limit, DCA, copy trading — [AMBCrypto](https://ambcrypto.com/top-12-telegram-trading-bots-that-crypto-traders-should-know-in-august-2026/)

**Trojan**
- Swaps, limit, DCA, sniper, multi-wallet, copy trading, portfolio tracking, simple/advanced modes, MEV protection, rug safeguards; 1% (0.9% with referral) — [AMBCrypto](https://ambcrypto.com/top-12-telegram-trading-bots-that-crypto-traders-should-know-in-august-2026/)
- Launched a browser terminal mirroring the bot — [openliquid](https://openliquid.io/telegram-trading-bot/); described as non-custodial terminal with Solana-wallet/Passkey login, mobile app, Auto-Sell, 0.9% fee — third-party review surfaced in search (one of [Crawlux](https://www.crawlux.com/blog/best-telegram-trading-bot/) / [RPC Fast](https://rpcfast.com/blog/top-solana-sniper-bot); exact page not verified, treat as unconfirmed)

**Maestro**
- Free tier 1% per tx; premium ~$200/month; auto-sniping, limit, auto-buy, copy trading, whale/wallet tracking, call-channel automation; AES-encrypted keys, anti-rug, anti-MEV — [AMBCrypto](https://ambcrypto.com/top-12-telegram-trading-bots-that-crypto-traders-should-know-in-august-2026/)

**BONKbot**
- 1% flat; Auto-Strat (TP/SL/DCA); paste-to-trade; part of fees to BONK buy-and-burn — [Moby](https://moby.win/best/solana-trading-apps-2026/); [AMBCrypto](https://ambcrypto.com/top-12-telegram-trading-bots-that-crypto-traders-should-know-in-august-2026/)

**Others**
- Bloom: 1% flat; Telegram + Chrome-extension overlay; Solana/ETH/BSC/Base/HyperEVM — [Moby](https://moby.win/best/solana-trading-apps-2026/); [MadeOnSol](https://madeonsol.com/compare/bloom-vs-nova-bot)
- Sigma: sniping, automated buy/sell with risk controls, copy trading, multi-chain — [Quicknode](https://www.quicknode.com/builders-guide/tools/sigma-bot)
- Moby: 0.75% flat (0% on SL/TP during promo), ~18,000 labelled smart-money wallets — [Moby](https://moby.win/best/solana-trading-apps-2026/) (self-reported)
- BullX (pre-shutdown): TG + web, limit, DCA, TP/SL, multi-wallet; ~1% (0.9% with referral) — [AMBCrypto](https://ambcrypto.com/top-12-telegram-trading-bots-that-crypto-traders-should-know-in-august-2026/)

**Perps (Hyperliquid builder codes)**
- Builder codes let front-ends charge up to 0.1% on perps and 1% on spot; users must approve each builder and a max fee, revocable — [Hyperliquid India Substack](https://hyperliquidindia.substack.com/p/why-builder-codes-are-hyperliquids-core-economic-primitive); [Dwellir](https://www.dwellir.com/blog/hyperliquid-builder-codes)
- ~40% of Hyperliquid daily active traders use a third-party terminal (2026) — [Quicknode](https://www.quicknode.com/builders-guide/best/top-10-trading-terminals-on-hyperliquid-2026)
- PVP.trade (Telegram) is the largest bot-type builder: >$7.3M builder earnings across 27.8K users (date unclear); Phantom cumulative builder revenue reported >$25M (sources vary widely) — [Dwellir](https://www.dwellir.com/blog/hyperliquid-builder-codes); [Hyperliquid India](https://hyperliquidindia.substack.com/p/why-builder-codes-are-hyperliquids-core-economic-primitive)
- Hyperliquid cumulative revenue >$1.4B, >$1.26B spent on HYPE buybacks — [TokenPost](https://www.tokenpost.com/news/investing/29363)

**Prediction markets (Polymarket bots)**
- Kreo: Telegram copy-trading for Polymarket and Kalshi; non-custodial via Privy + Gnosis Safe (rated 9.3/10 by a review site); PolyCop: fast wallet-mirroring but "no third-party wallet security" — [Coinmonks](https://medium.com/coinmonks/best-3-polymarket-trading-bots-in-2026-copy-trading-afk-trading-telegram-automation-0b8e20d5cac9); [Polymarket Academy](https://polymarketacademy.com/guides/best-polymarket-copy-trading-telegram-bots)
- PolyGun acquired Polymarket Analytics (Mar 2026; DB of 2.3M traders) — [TelegramTrading.net](https://telegramtrading.net/polygun-review-telegram-copy-trading-bot/)
- One guide says Axiom gives access to Hyperliquid perps and Polymarket from one account — [via search summary of Axiom guides](https://axiompro.app/terminal/) (unverified)

### Inferences
- Core spot feature set is commoditised; every top product ships snipe/limit/DCA/TP-SL/copy-trade/MEV-protection. A new entrant cannot win on feature checklist alone.
- The 2026 frontier is "one account for spot memes + perps + prediction markets + (tokenised) stocks" (Axiom, Fomo roadmap, Phantom), and self-custody with passkeys/embedded wallets rather than bot-held private keys.

### Gaps
- No official 2026 changelog accessed for Trojan, Maestro, Photon, Nova, Bloom (vendor sites/blogs blocked or not found); feature lists come mostly from third-party review sites.
- No confirmed list of Hyperliquid-perps support in Telegram-native bots beyond PVP.trade.

---

## 3. Traction: users, volume, fees/revenue, market-share trends — who is rising, who is declining, and why?

### Takeaway
Cumulative fee leaders (DefiLlama, 22 Oct 2026): Axiom $779M, Photon $442M, GMGN $344M, Trojan $228M, BullX $203M, Maestro $145M. Telegram-native bots' share of tracked fees collapsed from ~68% (Q1 2024) to ~3% (Q3 2026). Axiom dominated 2025 (67–77% of tracked fees in Q2–Q3 2025); in Q3 2026 a Robinhood-Chain memecoin wave pushed GMGN ($104.7M) above Axiom ($85.3M) and lifted Fomo to $58.7M in a quarter. Momentum cooled in Oct 2026 (GMGN and Fomo 30d fees roughly halved vs prior 30d).

### Cited Findings
**All-time / trailing-year fees (DefiLlama API, 22 Oct 2026; USD)**
| Protocol | Fees all-time | Revenue all-time | Fees last 1y | Fees 30d | Fees prior 30d |
|---|---|---|---|---|---|
| Axiom | 778.7M | 469.2M | 297.5M | 33.1M | 36.7M |
| Photon | 442.1M | 442.1M | 12.3M | 0.36M | 0.51M |
| GMGN | 343.7M | 290.1M | 200.5M | 18.3M | 53.1M |
| Trojan | 228.2M | 170.0M | 17.8M | 0.91M | 1.13M |
| BullX | 203.0M | 203.0M | 1.2M | 0 | 0 |
| Maestro | 145.0M | 141.2M | 13.9M | 0.83M | 1.99M |
| BONKbot | 95.0M | 62.2M | 4.8M | 0.10M | 0.12M |
| fomo | 90.0M | 83.6M | 88.0M | 18.1M | 34.5M |
| Banana Gun* | 87.1M | 86.9M | 1.2M | ~0 | ~0 |
| moonshot | 64.8M | 64.8M | 4.5M | 0.14M | 0.28M |
| SolTradingBot | 53.9M | 53.4M | 1.3M | 0.03M | 0.04M |
| Terminal (Pump.fun) | 47.6M | 26.8M | 47.6M | 5.1M | 5.4M |
| Unibot | 29.3M | 29.3M | ~0 | 0 | 0 |
| Looter | 18.8M | 18.8M | 0.3M | ~0 | ~0 |
| PAAL AI | 14.3M | 0.16M | 0.15M | 0 | 0 |
| Padre (pre-acquisition) | 10.4M | 10.4M | 0.18M | — | — |
| MEVX / Pepeboost / RayBot | 8.8M / 9.2M / 5.6M | — | ≤1.1M | ~0 | ~0 |
— [DefiLlama API overview/fees](https://api.llama.fi/overview/fees?dataType=dailyFees); [DefiLlama revenue overview](https://api.llama.fi/overview/fees?dataType=dailyRevenue)

*Banana Gun caveat: DefiLlama shows ~$0.3M fees for Q1 2026, while Banana Gun's own March 2026 release reports ~$91.8K weekly fees (~$1.2M/quarter), so DefiLlama's adapter likely undercounts Banana Gun in 2025–2026 — [Banana Gun PR](https://markets.financialcontent.com/wral/article/globeprwire-2026-3-17-banana-gun-clears-8b-annualized-volume-as-trading-patterns-mirror-retail-brokerages) vs [DefiLlama](https://defillama.com/protocol/banana-gun)

**Quarterly fees, $M (my aggregation of DefiLlama daily series; Q4 2026 partial to 21 Oct)**
| Quarter | Axiom | GMGN | Fomo | Terminal | Trojan | Photon | BullX | Maestro | BONKbot | Banana Gun |
|---|---|---|---|---|---|---|---|---|---|---|
| 2024Q1 (HIST.) | – | – | – | – | 12.9 | 27.2 | – | 10.4 | 21.8 | 13.0 |
| 2024Q4 (HIST.) | – | 23.0 | – | – | 62.7 | 137.7 | 72.3 | 22.2 | 17.6 | 17.9 |
| 2025Q1 | 31.1 | 45.0 | – | – | 50.5 | 122.8 | 87.4 | 21.2 | 12.6 | 12.4 |
| 2025Q2 | 197.8 | 16.8 | 0.1 | – | 17.6 | 32.3 | 14.3 | 8.1 | 3.4 | 5.0 |
| 2025Q3 | 225.9 | 16.6 | 1.6 | – | 14.2 | 19.0 | 3.9 | 7.3 | 2.9 | 3.1 |
| 2025Q4 | 91.9 | 58.6 | 2.6 | 6.9 | 5.0 | 5.3 | 0.9 | 8.6 | 1.9 | 2.0 |
| 2026Q1 | 76.7 | 41.8 | 9.3 | 14.7 | 6.6 | 4.9 | 0.5 | 3.2 | 2.1 | 0.3* |
| 2026Q2 | 48.6 | 24.2 | 7.1 | 9.0 | 3.6 | 1.8 | 0.1 | 2.7 | 0.8 | 0.3* |
| 2026Q3 | 85.3 | 104.7 | 58.7 | 13.7 | 3.4 | 1.7 | 0.0 | 4.7 | 0.3 | 0.0* |
| 2026Q4 (partial) | 21.4 | 10.6 | 10.6 | 3.3 | 0.6 | 0.2 | 0.0 | 0.5 | 0.1 | 0.0* |
— [DefiLlama per-protocol fee series](https://api.llama.fi/summary/fees/axiom?dataType=dailyFees) (same endpoint for gmgn, fomo-wallet, terminal, trojan, photon, bullx, maestro, bonkbot, banana-gun)

**Peak months (DefiLlama daily series)**
- Axiom peak May 2025 $92.7M fees (Sep 2026: $37.5M); Photon peak Jan 2025 $84.6M (Sep 2026: $0.35M); BullX peak Jan 2025 $54.6M; Trojan peak Jan 2025 $34.5M (Sep 2026: $1.05M); Maestro peak Jan 2025 $10.0M (Sep 2026: $1.82M); BONKbot peak Mar 2024 $14.2M (Sep 2026: $0.11M); GMGN peak Sep 2026 $48.7M; Fomo peak Sep 2026 $35.0M — [DefiLlama API](https://api.llama.fi/summary/fees/gmgn?dataType=dailyFees)

**Axiom**
- Fastest company in Y Combinator history to $100M revenue (2025) — [DL News](https://www.dlnews.com/articles/defi/solana-bot-axiom-takes-over-cursor-with-150m-revenue/)
- >$240M "pure revenue" by Aug 2025 (on pace for ~$665M/yr — 2025 projection, not realised at that run-rate) — [Simon on X](https://x.com/simononchain/status/1957523894895800539)
- >$390M cumulative revenue (reported ~Feb 2026) — [CCN](https://www.ccn.com/analysis/crypto/axiom-employees-exposed-insider-trading-scandal-zachxbt/)
- Lifetime volume cited ~$20.5B; "Solana bot share ~60–72%" claim (unverified, older) — [search summary of guides incl. Datawallet](https://www.datawallet.com/crypto/best-telegram-crypto-trading-bots)
- Share fell from >50% toward ~44% (mid-2026); Photon fell from >30% (early 2025) to <10% — [Datawallet](https://www.datawallet.com/crypto/best-telegram-crypto-trading-bots)

**GMGN**
- Monthly fees: Jan 2025 ~$28.3M (>99% Solana); Oct 2025 ~$44.6M (BSC ~93.6%); Aug 2026 ~$33.3M (BSC $13.3M, Robinhood Chain $12.9M, Solana $4.9M); 1–3 Sep 2026 ~$8.15M fees (~84% Robinhood Chain), $947.5M routed and 4.86M swaps — [Paragraph/coinpower](https://paragraph.com/@coinpower/gmgn-generates-dollar26-million-in-daily-fees-and-the-on-chain-bull-market-has-already-changed-chains-three-times); [Datawallet GMGN](https://www.datawallet.com/crypto/gmgn-explained)
- Robinhood Chain became GMGN's largest market within weeks of its July 2026 mainnet — [Datawallet GMGN](https://www.datawallet.com/crypto/gmgn-explained)
- 30 days to 28 Sep 2026: GMGN ~$51M fees vs Axiom ~$37M (DefiLlama via developer blog) — [openliquid](https://openliquid.io/telegram-trading-bot/)

**Fomo**
- 600K–625K users and ~$4B cumulative volume at the Series B (Jun 2026); ~3,500 new users/day; ~17 employees — [Fortune](https://fortune.com/2026/06/22/fomo-series-b-fundraise-index-ventures-union-square-ventures/); [ValueTheMarkets](https://www.valuethemarkets.com/cryptocurrency/news/fomo-trading-app-secures-75-million-funding-at-550-million-valuation); [Fintech Global](https://fintech.global/2026/06/23/fomo-raises-75m-series-b-to-scale-on-chain-trading-app/)
- HISTORICAL (late 2025): ~120K users, $20–40M/day volume — [Yahoo/TechCrunch](https://finance.yahoo.com/news/why-benchmark-made-rare-crypto-140000489.html)

**Banana Gun (company-reported, Mar 2026)**
- 1.3M registered users; $16.09B cumulative volume since 2023; 25.3M trades (avg 16,619/day); avg trade $635; $8B+ annualised volume; weekly fees ~$91.8K (Ethereum 63%, BSC $14.7K, Solana $14.3K, Base $3.7K) — [Banana Gun PR](https://markets.financialcontent.com/wral/article/globeprwire-2026-3-17-banana-gun-clears-8b-annualized-volume-as-trading-patterns-mirror-retail-brokerages)
- HISTORICAL: >$16M daily volume in Nov 2023, $589M total across 1.5M trades at that time — [ForkLog](https://forklog.com/en/banana-gun-telegram-bot-daily-turnover-exceeds-16-million/amp); peak ~$18M/day (2023) — [Parsec](https://parsec.substack.com/p/parsec-weekly-48)

**Others**
- BONKbot >$5B cumulative volume (undated) — [AMBCrypto](https://ambcrypto.com/top-12-telegram-trading-bots-that-crypto-traders-should-know-in-august-2026/)
- HISTORICAL: Maestro top day $48M volume (May 2023) — [Parsec](https://parsec.substack.com/p/parsec-weekly-48)
- Phantom 20M+ users; Moonshot 2M+ users — [Moby](https://moby.win/best/solana-trading-apps-2026/)

**Macro drivers**
- Solana H1 2026 network revenue ~$141M, −87.1% vs ~$1.09B in H1 2025; meme share of Solana spot txs ~40% (H1 2025) → ~16% (H1 2026) (21Shares) — [Paragraph/coinpower](https://paragraph.com/@coinpower/gmgn-generates-dollar26-million-in-daily-fees-and-the-on-chain-bull-market-has-already-changed-chains-three-times)
- Robinhood Chain (tokenised-stocks chain) early DEX volume $35–70M/day; single-day peak >$560M during "CASHCAT" boom (Galaxy Research, Jul 2026) — [Paragraph/coinpower](https://paragraph.com/@coinpower/gmgn-generates-dollar26-million-in-daily-fees-and-the-on-chain-bull-market-has-already-changed-chains-three-times)
- Pump.fun's Padre acquisition came "as memecoin market cools" (Oct 2025) — [Cointelegraph via TradingView](https://www.tradingview.com/news/cointelegraph:747d37f84094b:0-pump-fun-expands-with-padre-acquisition-as-memecoin-market-cools/)
- Unsourced counter-claim: "top-10 Telegram bots did $1.4B volume in Q1 2026 vs ~$600M Q1 2025; ~60% of Solana retail DEX volume" — [openliquid](https://openliquid.io/telegram-trading-bot/) (contradicted by Blockworks/DefiLlama data above; treat as unreliable)

### Inferences
- Share of tracked fees held by Telegram-native bots (Trojan+Maestro+BONKbot+Banana Gun, among 10 tracked products): 68% (Q1 2024) → 47% (Q3 2024) → 25% (Q1 2025) → 9% (Q3 2025) → 3% (Q3 2026) (my computation from DefiLlama; Banana Gun undercount slightly understates TG share).
- Axiom's share of tracked fees: 8% (Q1 2025) → 67% (Q2 2025) → 77% (Q3 2025) → ~48–50% (Q4 2025–Q2 2026) → 31% (Q3 2026). GMGN: 6% (Q3 2025) → 38% (Q3 2026). Fomo: <1% (Q3 2025) → 22% (Q3 2026).
- Implied take rates (24h fees/24h volume, Openchainbench 22 Oct 2026): Axiom ~0.86%, Fomo ~0.48%, GMGN ~1.03%, Terminal ~1.15%, Trojan ~1.1%, Photon ~1.0%.
- Revenue/fees ratio shows how much is recycled to users: Axiom ~48% kept (half paid out as cashback/referrals), Terminal ~52%, Trojan ~75%, GMGN ~81%, Fomo ~95%.
- Winners rode chain rotations (Solana → BSC → Robinhood Chain) by being multi-chain on day one; single-chain Solana products (Photon, BullX, BONKbot, Trojan) decayed with Solana meme activity.
- Market is highly cyclical: total tracked fees ~$383M (Q1 2025) → $98M (Q2 2026) → $273M (Q3 2026) → cooling in Oct 2026.

### Gaps
- No independent user counts (MAU/DAU) for Axiom, GMGN, Trojan, Photon in 2026; only Fomo (VC-press) and Banana Gun (self-reported).
- No verified Dune dashboard pull for 2026 (e.g., "dex-trading-bot-wars"); Blockworks dashboard not machine-readable.
- Phantom's swap fee revenue is not split out as a "terminal" in DefiLlama.

---

## 4. Pricing/fee models, referral programs, token launches, points/airdrops

### Takeaway
The standard is ~1% of notional per trade (Telegram bots, GMGN, Photon, Terminal), with Axiom's tiered 0.75–0.95% + SOL cashback and Fomo's 0.5% undercutting. Referral/cashback rebates of 10–35% are universal. Revenue-share tokens (UNIBOT, BANANA) were the 2023–2024 playbook; 2025–2026 saw token pain (PADRE crash after acquisition, BullX's never-delivered airdrop) and a shift to cashback, VC funding and points.

### Cited Findings
- Axiom: 0.95% → 0.75% net by tier (Wood, Bronze 0.90, Silver 0.875, Gold 0.85, Platinum 0.825, Diamond 0.80, Champion 0.75) + SOL cashback 0.05% → 0.25%; referral discount — [Coin Bureau](https://coinbureau.com/review/axiom-trade-review); up to 0.25% SOL rebate via referrals — [Moby](https://moby.win/best/solana-trading-apps-2026/)
- GMGN 1% flat (excl. gas, priority fees, tips, slippage, launchpad fees) — [Paragraph](https://paragraph.com/@coinpower/gmgn-generates-dollar26-million-in-daily-fees-and-the-on-chain-bull-market-has-already-changed-chains-three-times); no subscription — [GMGN review](https://uwuu.ai/blog/gmgn-review)
- Fomo 0.50%/trade, $0.95 minimum; Phantom ~0.85% swap fee; Moonshot 2.5% (<$250) / 1% (>$250); Pump.fun app ~1.25%; Photon ~1%; Trojan/BONKbot/Maestro/Bloom 1% flat; Moby 0.75% with up to 30% of fees back in $MOBY and a 30%/3%/2% three-tier referral tree; Terminal up to 35% cashback via referrals — [Moby](https://moby.win/best/solana-trading-apps-2026/)
- Banana Gun ~0.5% manual / ~1% auto-snipe; Trojan 1% / 0.9% with referral; Maestro free tier 1% or premium ~$200/month; BullX ~1% / 0.9% with referral — [AMBCrypto](https://ambcrypto.com/top-12-telegram-trading-bots-that-crypto-traders-should-know-in-august-2026/)
- Hyperliquid builder fee caps: 0.1% perps / 1% spot — [Dwellir](https://www.dwellir.com/blog/hyperliquid-builder-codes)
- Subscription-model CEX bots (contrast): 3Commas free / $37 / $59 per month (>100K traders); Cornix $25/mo; TradeSanta $18–90 — [AMBCrypto](https://ambcrypto.com/top-12-telegram-trading-bots-that-crypto-traders-should-know-in-august-2026/)

**Tokens**
- BANANA: 40% of bot fees (after referral) distributed to holders of ≥50 BANANA every 4 hours in ETH/SOL; est. ~$36K/week to holders (Mar 2026) — [Banana Gun PR](https://markets.financialcontent.com/wral/article/globeprwire-2026-3-17-banana-gun-clears-8b-annualized-volume-as-trading-patterns-mirror-retail-brokerages); buybacks when rewards claimed in BANANA — [ChainCatcher](https://www.chaincatcher.com/en/article/2139166); tokenomics — [Tokenomist](https://tokenomist.ai/banana-gun)
- HISTORICAL: UNIBOT launched token + revenue share in May 2023; paid >$8M to holders by late 2023 — [Parsec](https://parsec.substack.com/p/parsec-weekly-48); Unibot's user share fell <10% after its token ATH — [DODO analysis](https://dodotopia.notion.site/Evaluating-the-Current-Landscape-of-the-TG-Trading-Bot-Space-10c0b4c9100c4d42ae2d5185b25b0fd8)
- PADRE: lost all utility after Pump.fun acquisition (24 Oct 2025), fell ~67–80%; holders later promised PUMP compensation by snapshot — [BeInCrypto](https://beincrypto.com/pump-fun-padre-terminal-acquisition-token-crash/); [DL News](https://www.dlnews.com/articles/defi/pump-fun-placates-padre-tokenholders-with-airdrop-promise/)
- BullX airdrop repeatedly delayed; not launched as of the June 2026 trading suspension; user anger reported — [OurCryptoTalk](https://ourcryptotalk.com/news/bullx-shutdown-trading-airdrop); [SolanaTracker](https://www.solanatracker.io/blog/bullx-shutdown)
- BONKbot routes part of fees to BONK buy-and-burn — [Moby](https://moby.win/best/solana-trading-apps-2026/)
- Axiom ran an airdrop-hype-fuelled growth phase (per DL News headline "…$150m revenue fuelled by airdrop hype") — [DL News](https://www.dlnews.com/articles/defi/solana-bot-axiom-takes-over-cursor-with-150m-revenue/)

### Inferences
- Price competition is real but bounded: total user cost stays near ~1% at Axiom (fee + cashback = 1.00% at every tier per Coin Bureau table), so "cashback" is a loyalty mechanic, not a true price cut; Fomo's 0.5% plus mobile UX is the genuine price disruptor.
- Points/airdrop expectations drive volume but create reputational debt if undelivered (BullX) or if the token is orphaned (PADRE).

### Gaps
- No primary source found for Axiom's points/airdrop programme mechanics or any Axiom token status as of Oct 2026.
- GMGN, Trojan, Photon referral percentages not verified from official docs (docs pages not fetched/blocked).
- Current BANANA/UNIBOT market caps and buyback totals not verified.

---

## 5. Security incidents and trust problems

### Takeaway
Most bot losses come from (a) router/approval bugs (2023), (b) server-side custody of private keys (DEXX, Banana Gun, Solareum, Polycule, Sigma), and (c) insider/data misuse (Axiom 2026). Refunding users quickly (Maestro, Banana Gun) preserved franchises; failure to (Solareum) killed the product. The structural weakness is that most bots hold users' keys on their own servers.

### Cited Findings
- HISTORICAL — Maestro (24 Oct 2023): router contract lacked permission/parameter checks, ~$500K drained via user approvals; refunded users more than they lost — [CertiK](https://www.certik.com/blog/maestro-and-unibot)
- HISTORICAL — Unibot (31 Oct 2023): same router-approval bug class, ~$560–640K lost; UNIBOT fell ~40–43% within an hour; copycat contracts kept draining — [Cointelegraph](https://cointelegraph.com/news/unibot-contract-560-k-exploit-crashes-token-price-40); [rekt.news](https://www.rekt.news/unibot-rekt)
- HISTORICAL — Solareum (2024): exploit drained >2,800 SOL (~$520K) from >300 users; bot shut down days later; BONKbot initially blamed, denied — [Cointelegraph](https://cointelegraph.com/news/telegram-trading-bot-solareum-shutters-after-520k-exploit)
- HISTORICAL — Banana Gun (Sep 2024): ~$1.9M initially reported, total ~$3M (11 users) drained via a vulnerability; fully refunded from treasury — [Cointelegraph](https://cointelegraph.com/news/banana-gun-crypto-bot-refunds-3m); [Cointelegraph](https://cointelegraph.com/news/telegram-bot-banana-gun-users-drained-500-ether)
- HISTORICAL — DEXX (16 Nov 2024): commonly reported ~$21M; ForkLog reports damage grew to ~$30M, ≥900 users, >8,620 Solana addresses tracked by SlowMist (figures conflict) — [ForkLog](https://forklog.com/?p=246392)
- Polycule (Polymarket Telegram bot, 13 Jan 2026): ~$230K user funds stolen; bot taken offline, patched, compensation promised on Polygon — [KuCoin News](https://www.kucoin.com/news/flash/telegram-trading-bot-polycule-on-polymarket-hacked-230k-stolen); [Odaily](https://www.odaily.news/en/post/5208756)
- Axiom (26 Feb 2026): ZachXBT alleged a BD employee (Broox Bauer) used an internal support dashboard for ~10 months to track prominent traders' private wallets and front-run them (six-figure profits; ~$400K per headlines); Axiom removed internal-tool access and investigated; no user compensation reported — [The Block](https://www.theblock.co/post/391423/zachxbt-investigation-into-alleged-employee-insider-trading); [crypto.news](https://crypto.news/zachxbt-axiom-employees-insider-trading-report-2026/); [Yahoo](https://finance.yahoo.com/news/axiom-crypto-exposed-zachxbt-alleges-122625589.html); [Coin Bureau](https://coinbureau.com/review/axiom-trade-review)
- A Polymarket trader wagered ~$65.8K on "will Axiom be accused of insider trading" before the report (Lookonchain) — [Yahoo](https://finance.yahoo.com/news/axiom-insider-trading-scandal-spills-211452093.html)
- SIGMA (11 May 2026): trader lost >$200K across ETH/Base/BSC from two SIGMA-generated wallets; looks like private-key leak (phishing/infostealer suspected; cause not confirmed) — [Cryptopolitan](https://www.cryptopolitan.com/crypto-trader-loses-200k-telegram-bot/); [Cryptonews.net](https://cryptonews.net/news/security/32844596/)
- Commentators: almost all bots store user private keys on their own servers and sign server-side — custodial risk — [KuCoin News on Polycule](https://www.kucoin.com/news/flash/telegram-trading-bot-polycule-on-polymarket-hacked-230k-stolen); [Odaily](https://www.odaily.news/en/post/5208756)
- Hidden-cost trust issue: Axiom's "Priority" tip on Robinhood Chain totalled ~$9.4M over ten weeks for ~15 ms head start — [Bitquery](https://bitquery.io/investigations/axiom-priority-fee-robinhood-chain)
- Impersonation risk: Axiom warns users against unofficial Telegram bots claiming Axiom links — [AMBCrypto](https://ambcrypto.com/top-12-telegram-trading-bots-that-crypto-traders-should-know-in-august-2026/)
- Telegram platform threat context (2026): scam "assistant-style" bots harvesting data (≈20 found 7–27 May 2026); account-stealing "speed-up" bots — [anti-malware.ru](https://www.anti-malware.ru/news/2026-06-05-111332/50286)

### Inferences
- Even after hacks, refunded franchises (Maestro, Banana Gun) kept users; the bigger long-run loss driver was competitive/UX, not security. But for a new AI bot (which will hold delegated signing power), non-custodial/session-key designs (Privy/Turnkey/Safe, passkeys, scoped approvals) are a credible differentiator, as Kreo's review positioning shows.
- Insider-data misuse (Axiom) is a new trust vector: terminals see every user's wallet and order flow; an AI assistant that ingests user intents faces the same risk and should have audit/least-privilege controls.

### Gaps
- No post-mortem found for any 2026 Axiom user-loss incident (none confirmed); no final legal outcome of the ZachXBT allegations.
- Exact root cause of the Banana Gun 2024 exploit (reported as a Telegram message-oracle bug) not re-verified in this pass.

---

## 6. AI features added by these bots/terminals

### Takeaway
Through Oct 2026, "AI" in leading bots is mostly branding, token-safety scoring, smart-money discovery and agent/CLI access — not natural-language trading. No top-5 product has a confirmed conversational NL trade agent; GMGN exposes CLI/"AI agents" access and DefiLlama tracks a "FomoMCP" fee stream, signalling agent-driven order flow is starting. TradFi brokers (cTrader, Capital.com) shipped MCP servers for AI agents in 2026.

### Cited Findings
- GMGN (brand "GMGN.AI") lists access via web, mobile, Telegram bot, gmgn-cli and "AI agents"; features new-token monitoring, security auditing, holder analysis — [GMGN.ai](https://gmgn.ai/); described as having "AI agent features" — [Moby](https://moby.win/best/solana-trading-apps-2026/)
- DefiLlama lists "FomoMCP" (Trading App, Solana + Robinhood Chain) with ~$0.01M fees to date, alongside "fomo Wallet" and "copyfomo" — [DefiLlama API](https://api.llama.fi/overview/fees?dataType=dailyFees) (no public announcement found)
- PAAL AI (AI-branded Telegram bot, Ethereum): $14.27M all-time fees but ~$0.15M in last year — effectively dormant — [DefiLlama API](https://api.llama.fi/overview/fees?dataType=dailyFees)
- No AI features mentioned in Banana Gun's March 2026 product release — [Banana Gun PR](https://markets.financialcontent.com/wral/article/globeprwire-2026-3-17-banana-gun-clears-8b-annualized-volume-as-trading-patterns-mirror-retail-brokerages)
- No confirmed 2026 NL AI agent launch from GMGN, Banana Gun or Trojan found in search — [search across review sites, e.g. DEXTools guide](https://www.dextools.io/tutorials/telegram-trading-bots-2026-guide)
- Smaller AI-native entrants: MemeToro open-sourced an AI launch agent with guardrails (rejects manipulation/prompt-injection-risky proposals) — [HackerNoon (promotional)](https://hackernoon.com/meme-coin-trading-in-2026-memetoro-open-sources-its-ai-agent); Terminal App "X/Twitter Watcher AI" for tickers/narratives — [goterm.app](https://goterm.app/); Bloom is described by one site as "AI-powered" (ML) — [MadeOnSol](https://madeonsol.com/compare/bloom-vs-nova-bot) (unverified)
- Broker-side agent rails: cTrader AI Agent Connect (two MCP servers + skills library, May 2026) — [Spotware](https://www.spotware.com/news/ctrader-launches-official-mcp-servers/); Capital.com MCP server with two-step confirmation for agent trades (Aug 2026) — [Finance Magnates](https://www.financemagnates.com/forex/capitalcom-launches-mcp-server-for-mena-clients/); IG read-only, eToro/Robinhood sandboxed agent accounts — [Finance Magnates](https://www.financemagnates.com/forex/will-the-ai-agent-kill-the-trading-app/)

### Inferences
- White space: the incumbents optimise for millisecond execution and discovery feeds; none owns "explain/plan/execute in natural language across spot + perps + prediction markets with safety rails." AI-branded bots that lacked execution quality (PAAL AI) faded, so AI must sit on top of competitive execution and pricing.
- Agent-access rails (CLI, MCP) at GMGN/Fomo suggest incumbents may become execution back-ends for third-party AI agents — a potential partner or a threat.

### Gaps
- Could not access GMGN, Axiom, Trojan or Fomo official docs/changelogs (403/JS) to confirm specific AI features or dates.
- No usage data for any AI feature in trading bots.

---

## 7. Lessons: what made bots/terminals win or lose (synthesis for product strategy)

### Takeaway
Winners combined (1) fastest execution + best discovery UX, (2) presence on the hot chain on day one, (3) aggressive cashback/referral economics and airdrop expectations, and (4) increasingly, mobile/self-custodial UX and VC-funded distribution. Losers were single-chain, Telegram-only, token-dependent, or broke trust (hacks without refunds, undelivered airdrops, orphaned tokens).

### Cited Findings
- Axiom went from launch (late Jan 2025) to 67–77% of tracked bot fees in Q2–Q3 2025 and fastest-ever YC company to $100M revenue — [DL News](https://www.dlnews.com/articles/defi/solana-bot-axiom-takes-over-cursor-with-150m-revenue/); [DefiLlama API](https://api.llama.fi/summary/fees/axiom?dataType=dailyFees)
- Photon fell from >30% share (early 2025) to <10%, attributed to Axiom and mobile-native apps capturing flow — [Datawallet](https://www.datawallet.com/crypto/best-telegram-crypto-trading-bots)
- Mobile share of Solana trading-platform volume rose 28%→36% in a week (Jun 2026); Fomo +57%, Phantom +40% while Axiom flat — [Moby/Blockworks](https://moby.win/best/solana-trading-apps-2026/)
- GMGN followed speculative demand across Solana (Jan 2025) → BSC (Oct 2025) → Robinhood Chain (Q3 2026), reaching a record $48.7M fee month in Sep 2026 — [Paragraph](https://paragraph.com/@coinpower/gmgn-generates-dollar26-million-in-daily-fees-and-the-on-chain-bull-market-has-already-changed-chains-three-times); [DefiLlama API](https://api.llama.fi/summary/fees/gmgn?dataType=dailyFees)
- Banana Gun's 2026 strategy: shipping on new chains at mainnet day (MegaETH 9 Feb 2026), five chain integrations Dec 2025–Feb 2026 — [Banana Gun PR](https://markets.financialcontent.com/wral/article/globeprwire-2026-3-17-banana-gun-clears-8b-annualized-volume-as-trading-patterns-mirror-retail-brokerages)
- Benchmark backed Fomo as its first major consumer-crypto bet since 2018; Fomo's thesis: social + mobile + self-custody — [Yahoo/TechCrunch](https://finance.yahoo.com/news/why-benchmark-made-rare-crypto-140000489.html)
- Hybrid trend: Trojan and others add web terminals rather than stay Telegram-only — [openliquid](https://openliquid.io/telegram-trading-bot/)

### Inferences
- A Telegram-first product is now a distribution channel, not a moat; an AI DeFi assistant should be omnichannel (Telegram + web + mobile) with a shared account.
- Revenue is extremely cyclical and chain-rotational; a sustainable product needs multi-chain day-one support and non-meme verticals (perps via Hyperliquid builder codes, prediction markets, tokenised stocks) to smooth cycles.
- The ~1% take rate is under pressure (Fomo 0.5%, Axiom effective 0.75% + rebates); an AI assistant likely needs value-added pricing (e.g., premium analysis/automation tiers) or perps/prediction-market builder fees rather than relying on spot-meme take rates.
- Trust differentiators that are still under-served: non-custodial signing with scoped permissions, transparent fees (cf. hidden priority tips), insider-access controls, and prompt-injection/scam-token guardrails for AI.

### Gaps
- No rigorous cohort/retention data for any bot; "why" explanations rely on analyst/media narrative and share movements.
- Lessons are inferred from fee/volume trajectories; no direct user-survey evidence found.
