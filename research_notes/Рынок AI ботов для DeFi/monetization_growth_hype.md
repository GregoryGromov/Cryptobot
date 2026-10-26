# Monetization, Growth Mechanics and Hype Drivers of Crypto Consumer Products (Bots, AI Agents, Trading Apps), 2024 to Oct 2026

Research date: 2026-10-22. Labels: [CURRENT] means data from roughly Q2 to Q4 2026. [HISTORICAL] means 2024 to 2025 data, kept for context. Most numbers come from DefiLlama snapshots that crypto media and analyst notes relayed. DefiLlama pages returned HTTP 403 to direct fetch, so dashboard figures were taken from search-result snapshots and secondary coverage. Re-check them live before relying on them.

---

## Q1. Monetization: which models generate the most revenue (per-trade fees, subscriptions, tokens, B2B/API, x402)?

### Takeaway
Per-trade fees on retail speculative order flow are by far the largest revenue source for crypto consumer products. Typical rates are 0.75% to 1% on bots and terminals and 0.85% on wallet swaps. Builder fees on Hyperliquid are capped at 0.1% on perps. Axiom alone ran at about $237M annualized in Aug 2026, and Phantom reportedly booked about $320M of revenue in 2025. Subscriptions, token-gated access and agent-to-agent payments (x402) are tiny by comparison: x402's cumulative dollar volume is only about $15M to $53M across all agents. Token models mainly work as a distribution and loyalty layer funded by fee revenue (buybacks, rev-share). They are not an independent revenue source.

### Cited Findings

**Per-trade fee benchmarks**
- [HISTORICAL/structural] Most Telegram/trading bots charge a flat 1% per trade and return 20% to 35% of that fee to referrers — [DefiLlama TG Bots/Trading Apps dashboard](https://defillama.com/pro/tg-bots-trading-apps-7y0m8c). A wider range of 0.5% to 1% per trade, on top of DEX and gas fees, is also cited — [crypto.news](https://crypto.news/what-are-telegram-trading-bots-unibot-banana-gun-how-they-work/)
- [HISTORICAL] Category scale: Telegram bot and trading-app fees hit about $100M in the week ending 2 Feb 2025, roughly 20% of all crypto protocol revenue that week. They later settled near a $42M four-week average, or 6% to 8% of total crypto fees — [DefiLlama dashboard](https://defillama.com/pro/tg-bots-trading-apps-7y0m8c)
- Banana Gun: 0.5% fee on manual buys and 1% on snipes. BANANA holders reportedly receive 40% of platform trading fees, distributed every 4 hours with no staking needed — [MEXC News](https://www.mexc.com/news/1020872). The fee-rate attribution came from a set of search results, and the exact page could not be confirmed.
- Phantom wallet: the swap fee is 0.85% on most swaps — [yespress.io / Phantom docs summary](https://yespress.io/phantom). The Farcaster wallet also charges 0.85% per executed limit order as of 6 Jul 2026, per a promotional post — [Binance Square](https://www.binance.com/square/hashtag/Farcaster)
- Bankr: about 0.8% per swap per a 2026 review — [CoinCodeCap](https://coincodecap.com/bankr-bot-review). DefiLlama separately cites a 1.2% swap fee on the Uniswap v4 pools of tokens launched through Bankr — [DefiLlama BNKR](https://defillama.com/token/BNKR)
- Hyperliquid builder codes: front-ends set their own fee on top of base execution and keep it, capped at 0.1% on perps and 1% on spot — [4pillars "Hyperprinter go brrrrrr"](https://research.4pillars.io/en/research/hyperprinter-go-brrrrrr); [Dwellir](https://www.dwellir.com/blog/build-hyperliquid-trading-app-builder-codes)

**Revenue leaders (numbers)**
- Axiom (Solana trading terminal, YC-backed), as of 8 Aug 2026 [CURRENT]: about $237M annualized revenue and over $453M cumulative since its early-2025 launch. It reached $100M in about 4 months and peaked at up to $2M/day in April 2025 — [Crypto Briefing](https://cryptobriefing.com/gmgn-overtakes-axiom-24-hour-revenue/). Earlier marks: $240M YTD by Aug 2025 — [Delphi Digital note](https://members.delphidigital.io/feed/note-865fytqaeq); $300M cumulative within 263 days of launch — [Phemex](https://phemex.com/news/article/axiom-exchange-sets-record-with-300m-revenue-in-263-days-25598); "fastest application to reach $200M in revenue" — [Stepdata](https://stepdata.substack.com/p/solana-trading-bot-axiom-becomes)
- GMGN (multi-chain web terminal plus Telegram bot on SOL, BSC, Base and ETH) [CURRENT, Aug 2026]: about $115M annualized. On 8 Aug 2026 it briefly beat Axiom in 24h revenue ($336K vs. $559K is the snapshot quoted, so the "flip" depended on timing). BSC activity drove part of GMGN's strength. Combined Axiom plus GMGN: over $350M annualized — [Crypto Briefing](https://cryptobriefing.com/gmgn-overtakes-axiom-24-hour-revenue/)
- Fomo (mobile, self-custodial, social trading app) [CURRENT]: daily protocol revenue was $437K to $474K over the 3 days ending 5 Aug 2026, up from about $224K/day in late July. It has more than 625K users and over $2.5B cumulative Solana volume, and raised a $75M Series B at a $550M valuation in Jun 2026 (Index, USV, Benchmark) — [Solana Compass](https://solanacompass.com/news/fomo-overtakes-axiom-as-solanas-top-daily-trading-terminal-by-volume)
- Phantom: in-app swap fees exceeded $29M in January 2025, a monthly record — [Cointelegraph](https://cointelegraph.com/news/what-is-a-phantom-wallet-how-to-set-up-and-use-it). Forbes reportedly put 2025 revenue at $320M (up from $200M in 2024) with 22M active users — [yespress.io citing Forbes, Feb 2026](https://yespress.io/phantom). The DefiLlama trailing-year annualized figure is only about $116.6M — [DefiLlama Phantom](https://defillama.com/protocol/phantom-wallet). The two sources conflict and likely measure different scopes. Phantom is also the #1 Hyperliquid builder with $20.63M cumulative builder fees — [Solana Compass](https://solanacompass.com/news/phantom-tops-hyperliquids-builder-program-with-206m-in-fees)
- Pump.fun: revenue fell from about $4.8M/day (around Dec 2025) to about $800K/day in Jun 2026. Its 7-day graduation rate fell to 0.26%, down 80% in three months, and PUMP fell 40% over 6 months — [The Block, 16 Jun 2026](https://theblock.co/news/ecosystems/2026-06-16-pump-fun-activity-craters-80-three-months-solana-fees-lower-traders-rotate-perps-404806). Cumulative buybacks were $328.46M as of 15 Mar 2026 — [4pillars](https://research.4pillars.io/en/research/debunking-pumpfun-revenue-manipulation-fud)
- Hyperliquid (perps L1) [CURRENT]: the Assistance Fund (97% to 99% of fees) bought back $192.25M of HYPE in Q1 2026, after a record $316.76M in Q3 2025. Cumulative revenue was reported at over $1.16B by May 2026 — [KuCoin blog](https://kucoin.com/blog/why-hyperliquid-hype-is-dominating-defi-a-deep-dive-into-the-top-10-crypto-asset); [VanEck](https://www.vaneck.com/fr/en/blog/digital-assets/exploring-hyperliquid-redefining-derivatives-trading/). Both are promotional sources, and the "~$1B annualized" claim conflicts with a forecast of about $193M for 2026.
- Hyperliquid builder codes (third-party front-ends): over $40M paid to app developers as of Mar 2026 — [Dwellir](https://www.dwellir.com/blog/build-hyperliquid-trading-app-builder-codes). The figure was about $23M across roughly 200 builders in an earlier 4pillars count — [4pillars](https://4pillars.io/en/issues/hyperprinter-go-brrrrrr). About 40% of Hyperliquid DAU reportedly trade through third-party front-ends (single secondary citation, unverified) — [Solana Compass](https://solanacompass.com/news/phantom-tops-hyperliquids-builder-program-with-206m-in-fees). On Solana, trading terminals captured 77% of Solana DEX revenue over the past year — [Blockworks "Hyperliquid: The frontend wars"](https://blockworks.co/news/hyperliquid-the-frontend-wars) (figure from the search snippet; the page returned 403).
- Maestro [HISTORICAL, undated]: about $49.9M annualized revenue, entirely from bot fees, with no token. Blockcrunch called it "the most sustainable" — [Blockcrunch](https://blockcrunch.substack.com/p/the-rise-of-crypto-telegram-bots)
- Banana Gun: cumulative fees of $86.97M as of 7 May 2026 per DefiLlama. Quarterly gross revenue in 2025 ran $12.38M (Q1), $5.02M (Q2), $3.09M (Q3) and $1.99M (Q4), about $22.5M total by summation — [DefiLlama BANANA](https://defillama.com/token/BANANA). Revenue for the last 90 days was down 17.1% QoQ ($308K to $255K) — [Tokenomics.com](https://app.tokenomics.com/tokenomics/banana-gun/revenue). This is an example of a 2023-24 bot leader in steep decline.

**AI-agent products: subscriptions, token-gating and launchpad fees**
- Bankr (X/Farcaster-native AI trading agent on Base) [CURRENT]: $2.05M fees and $882K revenue over the past 30 days, about $33.5M fees and $13.5M revenue annualized. Q1 2026 gross protocol revenue was $18.17M, of which $15.60M came from Clanker integration LP fees. Q2 2026 (partial) was $11.20M, mostly Doppler launchpad fees ($10.44M). Token-holder net income is listed as $0 — [DefiLlama Bankr](https://defillama.com/protocol/bankr). Most Bankr revenue therefore comes from token-launch LP fees, not from chat or trading subscriptions.
- Bankr Club subscription: about $20/month, paid only in BNKR. It offers unlimited messages (the free tier is 10 messages/day), reduced swap fees, priority replies on social platforms and early features — [Bankless](https://www.bankless.com/es/trying-bankr-terminal); [CoinCodeCap](https://coincodecap.com/bankr-bot-review). BNKR market cap was about $33M, with an ATH of $0.0012 on 10 Feb 2026 — [DefiLlama BNKR](https://defillama.com/token/BNKR)
- Clanker (Farcaster/Base token launcher): its model takes 20% of the creator LP fee charged on each swap. Cumulative revenue was $15.12M, with 30-day fees of only about $137K to $271K depending on the snapshot — [DefiLlama Clanker](https://defillama.com/protocol/clanker)
- AIXBT: the terminal was gated by token holdings, not a subscription — [Decrypt](https://decrypt.co/310510)
- Virtuals Protocol: Fundstrat (Jun 2026) says the Launchpad is still the largest revenue segment. Cumulative gross ACP (agent-to-agent commerce) fees were only about $4.5M, or about $452K protocol revenue. BlockEden claims cumulative protocol revenue above $39.5M by Feb 2026 — [Fundstrat PDF](https://fundstrat.com/wp-content/uploads/2026/06/20260624-Digital-Asset-Strategy-Virtuals-Protocol-–-Growing-Agentic-GDP-Q2-Update.pdf); [BlockEden](https://blockeden.xyz/blog/2026/05/09/virtuals-protocol-ai-economic-os-agdp-agent-platform/). The two figures conflict and likely measure different scopes.

**Token models (fee share, buybacks, staking-for-access)**
- Pump.fun, 28 Apr 2026: burned $370M of PUMP (36% of circulating supply) and moved from a 100%-of-revenue buyback to a locked contract that spends 50% of net revenue (bonding curve, PumpSwap, Terminal) on buy-and-burn for 12 months. The other 50% funds growth, hiring and marketing — [The Block](https://www.theblock.co/post/399288/pump-fun-burns-370-million-pump); [CoinDesk](https://www.coindesk.com/markets/2026/04/29/pump-fun-burns-36-of-pump-supply-in-usd370-million-wipe-locks-50-revenue-into-ongoing-buybacks). The change drew backlash from traders — [Coin360](https://coin360.com/news/pump-fun-burn-pump-token-buyback-backlash). Pump said a lack of trust in the business's longevity and the certainty of buybacks was the reason — [CoinDesk](https://www.coindesk.com/markets/2026/04/29/pump-fun-burns-36-of-pump-supply-in-usd370-million-wipe-locks-50-revenue-into-ongoing-buybacks)
- Hyperliquid: 97% to 99% of perps and spot fees go to an Assistance Fund that buys back HYPE — [KuCoin](https://kucoin.com/blog/why-hyperliquid-hype-is-dominating-defi-a-deep-dive-into-the-top-10-crypto-asset); [VanEck](https://www.vaneck.com/fr/en/blog/digital-assets/exploring-hyperliquid-redefining-derivatives-trading/)
- Banana Gun: 40% of revenue goes to BANANA holders in ETH, SOL or USDC — [MEXC](https://www.mexc.com/news/1020872). Tokenomics.com says there is no buyback-and-burn, which contradicts a sponsored article that claims a 15.5% supply burn — [Tokenomics.com](https://app.tokenomics.com/tokenomics/banana-gun/revenue)
- Virtuals Revenue Network (launched 12 Feb 2026): pays up to $1M/month in incentives to agents that sell services through the Agent Commerce Protocol. ACP v2.0 (Apr 2026) onboarded 2,000+ agents — [Dextools](https://www.dextools.io/news/virtuals-protocol-bnb-chain-xlayer-expansion-ai-agents-de); [Fundstrat](https://fundstrat.com/wp-content/uploads/2026/06/20260624-Digital-Asset-Strategy-Virtuals-Protocol-–-Growing-Agentic-GDP-Q2-Update.pdf)

**Agent-to-agent payments (x402) [CURRENT]**
- Chainalysis (reported Oct 2026): more than 138M x402 transactions on Base, and over 87% of payments were between $0.0001 and $0.10. Much of the early-2026 surge came from speculation, notably the PING memecoin — [Crowdfund Insider](https://www.crowdfundinsider.com/?p=283501); [AI Weekly](https://aiweekly.co/alerts/chainalysis-base-x402-agentic-payments-hit-138m-in-q3-with-87-under-10-cents)
- TRM Labs: about $52.7M across 198.9M settlements through known facilitators since May 2025, on Base, Solana and Polygon — [TRM Labs](https://www.trmlabs.com/trm-tech-blog/whos-actually-paying-measuring-ai-agent-payments-onchain)
- Visa and Artemis (Jul 2026): about $15M adjusted volume across about 109.6M cumulative transactions — [KuCoin News](https://www.kucoin.com/news/flash/visa-and-artemis-report-on-ai-agent-payments-x402-processes-15m-in-on-chain-volume)
- Forkast (late Jul 2026): 75.41M transactions and $24.24M volume over 30 days. Forkast argues most of it is machine plumbing, not real commerce — [Forkast](https://forkast.news/?p=127763). The average payment is about $0.32 — [LCX](https://lcx.com/nl/cryptonews/visa-mastercard-and-ripple-back-x402-as-agent-payments-average-32-cents)
- a16z: about $1.6M in monthly "real" agent payment volume. "Not a big number, but the infrastructure being built around it is" — [Cointelegraph](https://regional-front.cointelegraph.com/news/ai-agent-payment-volume-closer-to-1-6m-says-a16z)
- The Linux Foundation launched the x402 Foundation on 14 Jul 2026, with Visa, Mastercard, Stripe and 14 other premier members — [LCX](https://lcx.com/nl/cryptonews/visa-mastercard-and-ripple-back-x402-as-agent-payments-average-32-cents). The competing Stripe/Tempo Machine Payments Protocol settled only about $25K across about 115K transactions after its Mar 2026 launch, per the same search cluster (exact page attribution unverified).

### Inferences
- The revenue hierarchy is clear. Trade-execution fees on speculative flow (memecoins, perps) produce hundreds of millions per year for the top 3 to 5 front-ends: Axiom, Phantom, GMGN, Photon, Fomo. AI-agent-native revenue, whether subscriptions, ACP jobs or x402, is in the low millions. A new AI DeFi assistant should treat execution (swap, perps and prediction-market routing) as the monetization engine and AI as the acquisition and retention wedge, not the reverse.
- Rate guidance: about 0.75% to 1% on spot swaps is market-standard and tolerated by memecoin traders. 0.85% is the wallet norm (Phantom, Farcaster). Perps through Hyperliquid builder codes are capped at 0.1%, which is lower per trade, but perps volume is far larger, and Phantom made $20.6M this way. A hybrid of swap fees plus Hyperliquid builder fees plus prediction-market routing fits where 2026 volume is moving.
- Bankr shows that for AI agents the real money came from token launchpad LP fees (Clanker, Doppler), not chat subscriptions. A launchpad tied to an agent can monetize hype directly, but it is cyclical: Clanker's 30-day fees fell to about $137K to $271K.
- Token buybacks do not prevent price decline. PUMP fell 40% over 6 months despite more than $328M in buybacks, and pump.fun itself cut its buyback to 50% of revenue. Revenue-share tokens are worth only as much as the fee base, as Banana Gun's revenue drop from $12.4M (Q1 2025) to $2.0M (Q4 2025) shows.
- x402 is a narrative and infrastructure play, not a 2026 revenue source. Supporting it is cheap signaling: it is "agentic payments" ready and enterprise-backed through Visa, Mastercard and Stripe.

### Gaps
- Photon's and Trojan's current (2026) revenue and fee schedules: no reliable source found.
- Axiom's exact fee rate: no primary source was found (commonly cited as about 0.75% to 1%, unverified).
- Live DefiLlama numbers could not be fetched (403). All DefiLlama figures are search snapshots with uncertain dates.
- Pump.fun full-year 2025 revenue total: not found.
- B2B/API revenue (bots selling APIs or white-label) and Hyperliquid revenue (the "$1B annualized" claim) are not reliably sourced.

---

## Q2. Viral growth mechanics that worked (referrals, points/airdrops, leaderboards, copy trading, agent personas, launchpads, PnL cards, Telegram Mini Apps)

### Takeaway
The proven growth stack is a multi-level referral rev-share (about 30% first tier), a points program that implies a future airdrop, a social or wallet-following feed, and frictionless onboarding (mobile, Apple Pay, in-chat). Public AI personas on X (Truth Terminal, AIXBT, Bankr) produced enormous awareness, but the attention was token-driven and decayed fast. X banned paid-posting "InfoFi" apps in Jan 2026, which closed a key incentivized-virality channel. Telegram tap-to-earn reached hundreds of millions of users but kept almost none after the airdrop.

### Cited Findings

**Referral programs**
- Axiom referral tiers: 30% of trading fees from direct referrals, 3% from indirect and 2% from extended — [CoinGecko Learn](https://www.coingecko.com/learn/what-is-axiom-exchange); [TechBullion, Aug 2026](https://techbullion.com/?p=798640). The referee discount is 10% per the official docs. Sources quoting 15% confuse the discount with the commission — [TechBullion](https://techbullion.com/?p=798640); contradicted by [Intercom guide (15%)](https://intercom.help/theguides/en/articles/16500768-axiom-trade-referral-code-axbonus-what-it-is-and-how-to-use-it)
- The category norm is that bots return 20% to 35% of the 1% fee to referrers — [DefiLlama](https://defillama.com/pro/tg-bots-trading-apps-7y0m8c). Axiom's and GMGN's reported revenue is net of referral payouts and cashbacks — [Crypto Briefing](https://cryptobriefing.com/gmgn-overtakes-axiom-24-hour-revenue/)

**Points programs and airdrops**
- Axiom points reward volume, quests and referrals, but no token or airdrop is confirmed — [CoinGecko](https://www.coingecko.com/learn/what-is-axiom-exchange). Promotional "airdrop farming" content is used as unofficial marketing — [MEXC Blog](https://blog.mexc.com/token-reviews/axiom-trade-airdrop-2026-how-to-farm-points-on-solanas-highest-revenue-trading-terminal/)
- Lighter (perp DEX): its LIT TGE on 30 Dec 2025 airdropped 25% of supply from points seasons 1 and 2 (2025). Points traded OTC at about $77 per point before TGE. "Lighter proves points still king" — [The Defiant](https://thedefiant.io/lighter-proves-points-still-king). Team and investors are on a 1-year cliff plus 3-year vest (lower-quality source) — [Telegram top7ico](https://t.me/s/top7ico). After launch, debate turned to volume authenticity and incentive sustainability — [KuCoin Ventures](https://www.kucoin.com/blog/en-kucoin-ventures-weekly-report-asset-recovery-strategic-gaming-amid-geopolitical-shocks-from-lighter-s-sector-disruption-to-broccoli-s-liquidity-hunt)
- Kaito InfoFi ("yap-to-earn" on X): KAITO's FDV peaked near $2B shortly after the Feb 2025 airdrop. On 15 Jan 2026 X revoked API access for apps that pay users to post, which product lead Nikita Bier blamed for "AI slop & reply spam". Kaito shut Yaps and its incentivized leaderboards and pivoted to Kaito Studio. KAITO fell 14.5% to $0.59 (market cap about $140M, FDV $586M) — [The Block](https://www.theblock.co/post/385805/kaito-token-plummets-x-revises-api-policies-ban-infofi-crypto-projects); [Decrypt](https://decrypt.co/354736/elon-musks-x-bans-access-infofi-crypto-projects-ai-slop-backlash). ZachXBT had accused Kaito of inflated metrics in Aug 2025 — [Decrypt](https://decrypt.co/354736/elon-musks-x-bans-access-infofi-crypto-projects-ai-slop-backlash)

**Social and copy trading, leaderboards**
- Fomo's growth formula: a feed where users follow trusted wallets and see their trades in real time, a "content-app-like" UI, mobile-first self-custody, gasless swaps, unified balances across Solana, Base, BNB and Monad, and Hyperliquid perps (added Jun 2026, non-US). Apple Pay onboarding brought in more than 68K first-time crypto buyers and about $25M volume from that cohort. In June 2026 Fomo's share of terminal volume was 17.2% vs. Axiom's 44.6% — [Solana Compass](https://solanacompass.com/news/fomo-overtakes-axiom-as-solanas-top-daily-trading-terminal-by-volume)
- Kolscan-style KOL leaderboards (live KOL buys and sells, ranking by PnL, ROI and win rate) are a standard discovery and copy-trading surface — [Solana Tracker docs](https://docs.solanatracker.io/guides/kol-tracking). Critics argue they encourage retail copy trading of KOLs who inflate their PnL and exit on followers (advocacy source, allegations only) — [Change.org petition](https://www.change.org/p/ban-kolscan-io)

**Public AI agent personas on X**
- Truth Terminal [HISTORICAL]: Marc Andreessen gave a $50K BTC grant in Jul 2024. The GOAT memecoin was launched on pump.fun by an unrelated developer in Oct 2024 and adopted and promoted by the agent. It reached an ATH of about $346M market cap in mid-Oct 2024 (some reports said over $600M), and the agent's wallet received 1.9M GOAT (about $526K) on 12 Oct — [Unchained](https://unchainedcrypto.com/goat-how-ai-agents-talking-turned-into-a-268-million-memecoin-religion/); [The Defiant](https://thedefiant.io/goat-memecoin-soars-above-usd300-million-valuation); [DL News](https://dlnews.com/articles/people-culture/marc-andreessen-distances-himself-from-obscene-memecoin-goat/)
- AIXBT [HISTORICAL then CURRENT]: an X-native market-intel agent with a token-gated terminal. The token's ATH was $0.94 on 16 Jan 2025 — [Decrypt](https://decrypt.co/310510). It traded at about $0.0217 on 6 Sep 2026 (about 98% down), with a 2026 all-time low of $0.01791 on 8 Jul 2026 — [CoinMarketCap analysis](https://coinmarketcap.com/cmc-ai/aixbt/price-analysis/); [CoinGecko](https://www.coingecko.com/en/coins/aixbt)
- Bankr: works by tagging @bankrbot on X, Farcaster or Telegram with a plain-text command (e.g., "buy $10 of X"), so every trade becomes a public post that advertises the product — [CoinCodeCap](https://coincodecap.com/bankr-bot-review); [Alea Research](https://alearesearch.substack.com/p/bankr-ai-execution-layer)

**Agent launchpads**
- Virtuals [HISTORICAL peak]: agent creation peaked at about 1,300 per day and daily revenue at about $1.02M in Jan 2025. By late Feb 2026 that had collapsed to fewer than 10 agents per day, $34,792/day revenue (-97%) and active wallets down from 181,000 to 7,642 — [BlockEden, Mar 2026](https://blockeden.xyz/blog/2026/03/27/agent-winter-paradox-ai-token-crash-production-adoption-soars/) (single-source blog). Virtuals claims about $470M to $479M of "agentic GDP", 18,000+ agents and about 1.77M completed jobs by early 2026 — [BlockEden](https://blockeden.xyz/blog/2026/05/09/virtuals-protocol-ai-economic-os-agdp-agent-platform/)
- Clanker on Farcaster: tokens were launched by tagging the bot in a cast, with a 20% cut of creator LP fees. Cumulative revenue was $15.12M, but recent 30-day fees were only about $137K to $271K — [DefiLlama Clanker](https://defillama.com/protocol/clanker)

**Telegram Mini Apps (tap-to-earn) [HISTORICAL]**
- Hamster Kombat reached about 300M users in summer 2024 and lost about 260M players after an airdrop users judged unsuccessful. Only 131M users (43%) were eligible. About 3.5M active players were discussing Season 2 in Sept 2025 — [ForkLog](https://forklog.com/en/hamster-kombat-developers-aim-to-reengage-players/)
- The Notcoin co-creator argued that retention requires social and emotional experiences, not just tapping — [ForkLog](https://forklog.com/en/hamster-kombat-developers-aim-to-reengage-players/)
- Blum trading bots made up 25% of TON on-chain activity in Apr 2025. Trading-app usage peaked at more than 850K interactions on 9 Apr 2025, then fell over 75% — [CCN](https://www.ccn.com/news/crypto/telegram-trading-bots-ton-wallets-decline/)

### Inferences
- What actually compounds is a fee-funded referral program plus visible social proof (following wallets, KOL leaderboards, public agent replies). Both are fueled by real trading volume, so they survive after token hype fades. Axiom built a $450M+ business on referrals and points without even launching a token.
- An "implied airdrop" points program is the strongest acquisition tool, but it sets a deadline for churn. Hamster lost about 87% of users after its airdrop, and Kaito's FDV fell from about $2B to $586M. The design lesson is to keep points tied to fee-paying volume and continuing utility (fee discounts, access), not to one-off TGE value.
- X is no longer safe for paid engagement mechanics. Any "post to earn" or reward-for-tweets loop risks an API ban (Jan 2026 precedent). An agent persona that replies to users (the Bankr model, where each command is a public ad) remains allowed and is organic.
- Mobile plus fiat on-ramp (Apple Pay) plus social feed (Fomo) is the 2026 growth pattern that took terminal share from web-only Axiom. It shows that the next growth tier comes from first-time crypto users, not existing memecoin traders.

### Gaps
- No quantitative data on PnL-card sharing (virality coefficient, share rates). Widely used (Axiom, GMGN, Photon, BullX), but no sourced metrics found.
- Notcoin 2025-2026 user and retention figures not found.
- Axiom user counts are only proxies: about 32K to 47K daily active traders on its routing program in Jul to Aug 2026 — [Solana Compass](https://solanacompass.com/news/fomo-overtakes-axiom-as-solanas-top-daily-trading-terminal-by-volume)
- No cohort retention data (D7/D30) published for any bot or terminal.

---

## Q3. Hype cycles: the AI agent token boom (late 2024 to early 2025) and crash; what survived; 2026 narratives

### Takeaway
AI agent tokens peaked at about $15B to $17B aggregate market cap in early Jan 2025. They fell below $5B by Mar 2025 and to about $2.9B by Mar 2026. Flagships fell 90% to 98% (VIRTUAL -90%, AIXBT -98%). Launchpad and agent activity collapsed about 97%. What survived are products with real fee revenue from execution (Bankr, trading terminals), or projects that pivoted to infrastructure and commerce (Virtuals ACP, x402). The 2026 narratives that hold volume are perps (Hyperliquid, HIP-3 equity perps), prediction markets (Kalshi and Polymarket at about $45B to $53B per month), stablecoins and agentic payments (x402). Memecoin activity collapsed: Solana memecoin share of spot volume fell from 40% to 16%.

### Cited Findings

**Boom and crash in numbers**
- AI agent token aggregate market cap was over $15B in early Jan 2025, then $12.55B after the first correction — [The Block](https://www.theblock.co/post/334213/ai-agent-tokens-reel-from-a-steep-market-correction). A 44% wipeout was reported in the sector — [Blockworks](https://blockworks.co/news/ai-agent-market-wipeout). By Mar 2025 it was "nearly $17 billion in early January ... below $5 billion" — [Decrypt](https://decrypt.co/310510)
- The aggregate was about $2.92B in Mar 2026, "down from peaks above $10 billion in late 2025" (single-source blog). That is inconsistent with other sources that put the peak in Jan 2025 — [BlockEden](https://blockeden.xyz/blog/2026/03/27/agent-winter-paradox-ai-token-crash-production-adoption-soars/)
- VIRTUAL hit an ATH of $5.07 on 2 Jan 2025 and is now about -90%. ElizaOS (ai16z) peaked near $2.5B market cap in Jan 2025. FET is about 91% below ATH — [BlockEden](https://blockeden.xyz/blog/2026/03/27/agent-winter-paradox-ai-token-crash-production-adoption-soars/)
- Whale examples: one lost $20.4M on Base AI agent tokens (-88.77%); another put $23M into six tokens and exited at $2.58M — [BlockEden](https://blockeden.xyz/blog/2026/03/27/agent-winter-paradox-ai-token-crash-production-adoption-soars/)
- DeFAI sub-narrative [HISTORICAL]: Griffain and HeyAnon each exceeded $100M market cap after one-week rallies in Jan 2025 — [Crypto.com Research](https://crypto.com/au/research/defai-jan-2025). No reliable 2026 status found.

**What survived and why (evidence-based)**
- Bankr still makes about $13.5M annualized revenue (Q1 2026 gross protocol revenue $18.17M) from execution and launchpad fees. BNKR set its ATH in Feb 2026, a year after the agent token peak — [DefiLlama Bankr](https://defillama.com/protocol/bankr); [DefiLlama BNKR](https://defillama.com/token/BNKR)
- Virtuals pivoted from a launchpad to agent commerce: Revenue Network (Feb 2026), ACP v2 (Apr 2026), expansion to BNB Chain, XLayer and Robinhood Chain — [Dextools](https://www.dextools.io/news/virtuals-protocol-bnb-chain-xlayer-expansion-ai-agents-de); [Fundstrat](https://fundstrat.com/wp-content/uploads/2026/06/20260624-Digital-Asset-Strategy-Virtuals-Protocol-–-Growing-Agentic-GDP-Q2-Update.pdf). ACP fees are still small (about $452K protocol revenue cumulative).
- BlockEden's thesis: "AI agents do not need native tokens to function." Value accrues to stablecoin issuers (Circle, Tether), infrastructure (Coinbase, Alchemy), L1/L2s (Base) and compute — [BlockEden](https://blockeden.xyz/blog/2026/03/27/agent-winter-paradox-ai-token-crash-production-adoption-soars/)
- The same source claims usage grew even as tokens crashed: over 250K daily active on-chain AI agents in early 2026 (+400% YoY), and over 30% of Polymarket wallets using AI agents (unverified figures from one blog) — [BlockEden](https://blockeden.xyz/blog/2026/03/27/agent-winter-paradox-ai-token-crash-production-adoption-soars/)

**2026 narratives [CURRENT]**
- Memecoins fading: Solana H1 2026 network revenue was $141M, about 87% below H1 2025. Memecoins fell from 40% to 16% of Solana spot volume, while stablecoin swaps rose to 19% — [21Shares via Solana Compass](https://solanacompass.com/news/21shares-solanas-h1-2026-network-revenue-fell-87-as-memecoin-fees-collapsed). Solana fees fell about 84% (from about 33K SOL/day in Jan 2026 to 5.3K SOL/day in Jun 2026). Traders are "rotating into perps", including HIP-3 and trade.xyz equity perps — [The Block](https://theblock.co/news/ecosystems/2026-06-16-pump-fun-activity-craters-80-three-months-solana-fees-lower-traders-rotate-perps-404806)
- Perps: Hyperliquid hit a record 6.63% share of global (CEX-inclusive) perps volume in May 2026, and HIP-3 markets (including equities and commodities) exceeded $62B monthly volume. Pure-crypto volumes are down YoY — [The Block](https://www.theblock.co/post/403384/hyperliquid-record-share-global-perps-market-hip-3-tops-62-billion-monthly-volume). Q1 2026 volume was $633B, about 32% of on-chain perps — [VanEck](https://www.vaneck.com/fr/en/blog/digital-assets/exploring-hyperliquid-redefining-derivatives-trading/)
- Prediction markets: combined Kalshi, Polymarket and Polymarket US volume was $25.66B in May 2026 and about $53B in July (Kalshi $40.1B, Polymarket $12.89B; July sum derived), then $45.33B in Aug 2026 (-14.5%, the first monthly decline in a year, after the World Cup spike). Kalshi held about 82% of August volume — [The Block, 2 Sep 2026](https://www.theblock.co/news/business/2026-09-02-kalshi-polymarkets-volume-falls-august-413309). The combined sports prediction market reached about $14.1B in one week of Sep 2026 — [Crypto Briefing](https://cryptobriefing.com/polymarket-nfl-college-football-volume-surge/)
- Agentic payments: x402 has 138M+ transactions on Base and an x402 Foundation under the Linux Foundation (Jul 2026) with Visa, Mastercard and Stripe. Dollar volume is still small (see Q1) — [Crowdfund Insider](https://www.crowdfundinsider.com/?p=283501); [LCX](https://lcx.com/nl/cryptonews/visa-mastercard-and-ripple-back-x402-as-agent-payments-average-32-cents)
- Pump.fun lost its launchpad lead to LetsBonk in Jul 2025: its revenue share fell from 88% to 19% while LetsBonk's rose to about 78%. Pump regained a 73.6% 7-day share by mid-Aug 2025 with $13.48M weekly revenue — [Cointelegraph](https://cointelegraph.com/news/pumpfun-solana-memecoin-revenue-lawsuit-august-2025); [Stepdata](https://stepdata.substack.com/p/solana-launchpad-showdown-pumpfun). This shows that launchpad leadership is highly contestable.

### Inferences
- AI agent tokens behaved like memecoins with an AI story. Value collapsed 80% to 98% within 3 to 14 months, and activity on agent launchpads fell about 97%. A product whose main value is "an AI persona plus a token" has a half-life of weeks to months.
- Survivors share one trait: fee revenue from real user actions (trades, launches), with the AI as the interface. For a new AI DeFi assistant, hype should be built on visible execution ("talk to trade") into 2026's live markets (perps, including equity perps; prediction markets; stablecoin yield), not on a standalone agent token.
- The 2026 rotation from memecoins to perps and prediction markets means a Solana-memecoin-sniper-only bot targets a shrinking pool. Solana fee revenue is down 87% YoY. The best-positioned product routes to Hyperliquid (builder fee), Kalshi/Polymarket and stablecoin yield.
- Narrative timing: x402 and "agentic payments" have elite institutional backing but tiny volumes. That is typical pre-hype positioning, so being early with credible x402 integration could ride the next agent wave.

### Gaps
- No consistent, authoritative Q3/Q4 2026 aggregate market cap for the AI agent token category (CoinGecko category snapshot not retrieved).
- ElizaOS/ai16z, GOAT, Griffain, HeyAnon, Wayfinder and Giza: no reliable 2026 status found.
- The "Virtuals got Robinhood's traffic and kept almost none of it" analysis (Aug 2026) could not be fetched (503).
- Polymarket and Kalshi fee revenue are not in the sources retrieved.

---

## Q4. Retention and trust: what makes users stay vs churn; products losing users after token launch or a hack

### Takeaway
Users stay for execution quality and speed, low or competitive fees, cashback and referral income, and a social feed that keeps surfacing opportunities. They leave when the token or airdrop event passes (Hamster: about -87%), when the speculative market they serve dries up (Banana Gun revenue -84% in 2025; pump.fun -83% per day), or when a better UX appears (Axiom's share fell from 72% to 44.6%). Hacks dent token prices (AIXBT -20%), but bots that refunded users from treasury, like Banana Gun, avoided a trust collapse. Security features (transfer delays, 2FA) became table stakes.

### Cited Findings

**Churn after token or airdrop events**
- Hamster Kombat: about 300M users fell to around 40M after the airdrop (lost about 260M). Only 43% were eligible — [ForkLog](https://forklog.com/en/hamster-kombat-developers-aim-to-reengage-players/)
- Kaito: FDV fell from about $2B (Feb 2025 airdrop) to $586M (Jan 2026) after X's API ban — [The Block](https://www.theblock.co/post/385805/kaito-token-plummets-x-revises-api-policies-ban-infofi-crypto-projects)
- Virtuals: active wallets fell from 181,000 to 7,642 and daily revenue fell 97% (Jan 2025 to Feb 2026) — [BlockEden](https://blockeden.xyz/blog/2026/03/27/agent-winter-paradox-ai-token-crash-production-adoption-soars/)
- Pump.fun after the PUMP token: revenue fell from about $4.8M/day (around Dec 2025) to about $800K/day (Jun 2026) and PUMP fell 40% in 6 months despite buybacks. The team said trust in "the longevity of the business, the certainty of buybacks" was lacking — [The Block](https://theblock.co/news/ecosystems/2026-06-16-pump-fun-activity-craters-80-three-months-solana-fees-lower-traders-rotate-perps-404806); [CoinDesk](https://www.coindesk.com/markets/2026/04/29/pump-fun-burns-36-of-pump-supply-in-usd370-million-wipe-locks-50-revenue-into-ongoing-buybacks)
- Lighter after TGE: debate over volume authenticity and incentive sustainability. LIT reportedly traded at about $2.7 vs. about $3.5 pre-market (unverified Telegram source) — [KuCoin Ventures](https://www.kucoin.com/blog/en-kucoin-ventures-weekly-report-asset-recovery-strategic-gaming-amid-geopolitical-shocks-from-lighter-s-sector-disruption-to-broccoli-s-liquidity-hunt); [Telegram top7ico](https://t.me/s/top7ico)

**Share loss to better UX or competitors**
- Axiom's share went from a 72% peak (Apr 2025) to 44.6% of terminal volume in Jun 2026 as Fomo grew to 17.2% — [Solana Compass](https://solanacompass.com/news/fomo-overtakes-axiom-as-solanas-top-daily-trading-terminal-by-volume)
- Photon's share fell from 30.7% (Jan 2025) to under 10% (Jul 2025) as Axiom launched — [Stepdata](https://stepdata.substack.com/p/solana-trading-bot-axiom-becomes) / [MEXC](https://www.mexc.com/news/113) (exact attribution among these search results uncertain)
- Banana Gun's quarterly revenue fell from $12.38M (Q1 2025) to $1.99M (Q4 2025) — [DefiLlama BANANA](https://defillama.com/token/BANANA)

**Hacks and trust events**
- Banana Gun (Sep 2024): a Telegram message-oracle flaw led to 11 users drained for about $3M. The bots were turned off, every user was refunded from the treasury ("no tokens being sold"), and a 2-hour transfer delay, 2FA for transfers and backend audits were added — [The Block](https://www.theblock.co/post/318074/banana-gun-exploit-refund); [Cointelegraph](https://cointelegraph.com/news/banana-gun-crypto-bot-refunds-3m)
- AIXBT (18 Mar 2025): unauthorized dashboard access queued two malicious replies, and 55.5 ETH (about $100K to $105K) left the Simulacrum wallet. The token fell about 15% to 21% that day, adding to a slide of about 90% from ATH. The team migrated servers and rotated keys — [The Block](https://www.theblock.co/news/regulation/2025-03-18-ai-crypto-bot-aixbt-lost-eth-hack-unauthorized-dashboard-access-346911); [Decrypt](https://decrypt.co/310510); [Cointelegraph](https://cointelegraph.com/news/hacker-breaches-ai-crypto-bot-aixbt-steals-55-eth)

**Signals of what retains**
- Axiom's daily active traders on its routing program rose from about 32K (early Jul 2026) to over 47K (4-5 Aug 2026), +48% in 4 weeks, even after losing share — [Solana Compass](https://solanacompass.com/news/fomo-overtakes-axiom-as-solanas-top-daily-trading-terminal-by-volume)
- Maestro (no token, fee-only) was described as the "most sustainable" bot of its cohort — [Blockcrunch](https://blockcrunch.substack.com/p/the-rise-of-crypto-telegram-bots)
- A sustained Hyperliquid retention through a long downturn is "still unproven", per the same VanEck/KuCoin coverage — [VanEck](https://www.vaneck.com/fr/en/blog/digital-assets/exploring-hyperliquid-redefining-derivatives-trading/)

### Inferences
- Retention follows the user's profit (PnL) and the health of the underlying market, not loyalty to a brand or token. A bot tied to one market (ETH snipers, then Solana memecoins) loses revenue when that market fades. Multi-venue routing (spot, perps, prediction markets, yield) is the structural retention hedge.
- A token launch acts as a liquidity event that converts mercenary users to sellers. If a token is planned, its utility should be continuing (fee discounts, rev-share, access to premium agent features), and the airdrop should reward sustained fee-paying activity.
- For an AI agent holding user keys or acting autonomously, the main attack surfaces are the control dashboard and social prompt injection (AIXBT) and messaging-layer oracles (Banana Gun). A treasury-funded refund policy, transfer delays, 2FA and spending limits are now expected trust features. Pre-commitment to them can be a marketing asset.

### Gaps
- No published D1/D7/D30 cohort retention data for any bot, terminal or AI agent.
- No sourced data on churn after hacks for Maestro (2023), Unibot (2023) or others in this research pass.
- Whether Banana Gun completed its refunds is not confirmed in the sources found.

---

## Q5. Distribution channels in 2026: Telegram vs X vs Farcaster/Base App vs web vs mobile; state of Telegram/TON

### Takeaway
In 2026 trading volume and revenue concentrate in web terminals (Axiom, GMGN) and increasingly in mobile social apps (Fomo, Phantom). Telegram has huge reach (about 950M to 1B MAU, about 500M Mini App users by estimate) but poor on-chain conversion (only 0.12% of Telegram MAU active on-chain; 1.48M TON monthly active wallets). Farcaster's social layer failed as a standalone app and was folded into wallets. Base App dropped its social feed to focus on trading. X remains the attention layer for agent personas, but has banned pay-to-post incentive schemes.

### Cited Findings

**Telegram/TON**
- The TON monthly-active-wallet to Telegram-MAU ratio is about 0.12%, so "conversion to economically active on-chain use remains low". The 1B user figure overstates the addressable base after blocked jurisdictions are excluded — [CoinShares research note](https://coinshares.com/insights/research-data/the-open-network-ton-an-institutional-research-note/)
- About 53M activated TON wallets but only 1.48M monthly active wallets (TonStat, cited May 2026). Durov announced Telegram will become TON's largest validator, replacing the TON Foundation as the driving force (not verified against a primary source) — [Alea Research](https://alearesearch.substack.com/p/ton-telegrams-superapp-chain)
- Telegram Mini Apps reach about 500M monthly users (estimate). Telegram MAU is over 950M. Blockchain-using Mini Apps must use TON Connect exclusively — [Reown](https://reown.com/blog/top-telegram-mini-apps); [BlockEden, Jan 2026](https://blockeden.xyz/blog/2026/01/26/ton-telegram-web3-onramp-mini-apps-500-million-users/)
- TON daily wallet activity fell about 90% from its Dec 2024 peak. Telegram apps "spike during moments of hype" — [CCN, May 2025](https://www.ccn.com/news/crypto/telegram-trading-bots-ton-wallets-decline/). The TON price fell 65% from its 2025 peak — [FXStreet, Dec 2025](https://www.fxstreet.com/cryptocurrencies/news/is-toncoin-undervalued-december-data-signals-potential-rebound-202512190850)
- Telegram posted a $222M net loss in H1 2025 despite about $400M operating profit. TON's exclusive role in Mini Apps generated about $300M of related revenue for Telegram — [Yellow Research](https://yellow.com/de/research/telegrams-blockchain-wette-wird-zu-groß-als-dass-krypto-sie-ignorieren-könnte) (attribution from search summary)
- The self-custodial TON Wallet went live for US users in Jul 2025 — [Alea Research](https://alearesearch.substack.com/p/ton-telegrams-superapp-chain)
- Telegram trading bots (Trojan, Banana Gun, Maestro, BonkBot, GMGN bot) still operate. Several now offer web terminals alongside Telegram, e.g., the Trojan Terminal — [askfuzz.ai](https://askfuzz.ai/discover/news/cryptocurrencies/top-6-telegram-trading-bots-in-june-2026)

**Web terminals and mobile apps**
- Trading terminals captured 77% of Solana DEX revenue over the past year — [Blockworks](https://blockworks.co/news/hyperliquid-the-frontend-wars) (search snippet)
- Axiom (web, Solana-focused) held 44.6% of terminal volume in Jun 2026. Fomo (mobile, multi-chain, Apple Pay) held 17.2% and passed GMGN for #2 in terminal revenue by early Aug 2026 — [Solana Compass](https://solanacompass.com/news/fomo-overtakes-axiom-as-solanas-top-daily-trading-terminal-by-volume)
- Phantom (mobile/extension wallet) is the #1 Hyperliquid builder at $20.6M in fees, showing that wallets act as distribution for perps — [Solana Compass](https://solanacompass.com/news/phantom-tops-hyperliquids-builder-program-with-206m-in-fees). About 40% of Hyperliquid DAU trade through third-party front-ends (unverified) — same source.

**Farcaster / Base App**
- Feb 2026: Base App (formerly Coinbase Wallet) removed its Farcaster-powered "Talk" feed to focus on on-chain trading. The feed now centers on tradable assets and on-chain activity. Coinbase ended Creator Rewards (over $450K to about 17K creators in 6 months). Jesse Pollak said testing showed limits in blending social content into a wallet — [The Block](https://www.theblock.co/post/389191/base-app-removes-farcaster-powered-talk-feed-to-sharpen-focus-on-onchain-trading)
- Dec 2025: Farcaster deprioritized its standalone social app in favor of wallet services, was acquired by Neynar, and planned to return about $180M to VCs. The protocol continues — reported in coverage surrounding [The Block](https://www.theblock.co/post/389191/base-app-removes-farcaster-powered-talk-feed-to-sharpen-focus-on-onchain-trading) / [MEXC](https://www.mexc.com/news/686226) (exact primary source not fetched)
- The Farcaster wallet now offers limit orders at a 0.85% fee (Jul 2026, promotional source) — [Binance Square](https://www.binance.com/square/hashtag/Farcaster)

**X (Twitter)**
- X revoked API access for apps that pay users to post (15 Jan 2026), killing the InfoFi/yap-to-earn model — [The Block](https://www.theblock.co/post/385805/kaito-token-plummets-x-revises-api-policies-ban-infofi-crypto-projects)
- X remains the main surface for agent personas (Bankr @bankrbot, AIXBT, Truth Terminal) — [CoinCodeCap](https://coincodecap.com/bankr-bot-review); [Decrypt](https://decrypt.co/310510)

### Inferences
- Telegram is still the best low-friction onboarding and notification channel, especially for CIS and Asian audiences (Telegram's core). It converts poorly to on-chain activity, and TON-only constraints on Mini Apps limit multi-chain DeFi. A Telegram bot should be the alerts, chat and quick-trade front door, paired with a web or mobile app for depth. That is what Trojan, GMGN and Banana Gun now do.
- The 2026 revenue gravity is in web terminals plus mobile social apps with fiat on-ramps. Fomo's $550M valuation and share gains show mobile-native social trading is the current hype channel for investors.
- X is the attention layer, and an agent that publicly replies with actions (Bankr-style "tag to trade") is viral by design. Avoid any rewards-for-posting mechanics because of the API ban precedent.
- Farcaster as a standalone distribution channel is effectively dead. Base App is a trading app now, so it is a possible integration point (mini apps, Base ecosystem) rather than a social growth channel.

### Gaps
- No verified 2026 user counts for Base App or Farcaster.
- No 2026 Telegram-bot-specific fee totals vs. web terminals (the DefiLlama category dashboard could not be fetched).
- No sourced 2026 data on Telegram Wallet (custodial) MAU.
- Geographic split of users by channel (e.g., Telegram share in CIS/Asia vs. US) not found.
