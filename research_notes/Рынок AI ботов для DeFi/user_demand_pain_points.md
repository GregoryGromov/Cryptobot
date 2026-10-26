# DeFi User Demand and Pain Points (2025–2026): Signals for an AI DeFi Assistant Bot

Research date: 2026-10-22. All figures carry their own dates. "OLD" marks data from before 2025. DefiLlama figures marked "DefiLlama API, pulled 2026-10-22" come from DefiLlama's public endpoints (api.llama.fi/v2/historicalChainTvl, api.llama.fi/protocols, stablecoins.llama.fi/stablecoincharts/all, api.llama.fi/overview/dexs, and DefiLlama's revenue overview), queried on the research date. They are primary data, not press coverage.

---

## 1. What are the top DeFi pain points, per surveys and community sentiment?

### Takeaway
The strongest recent survey (1inch-led, Feb 2026, n=8,199) ranks gas fees (27%), security risks (22%), failed or slow transactions (18%) and bridges (14%) as the biggest annoyances. Behind those sits a large "activation gap": about 716M people hold crypto, but only 40–70M are active users (a16z, Oct 2025). Other recurring pains are multi-chain fragmentation, approval and signature risk, the difficulty of tracking positions across tools, liquidation and leverage blow-ups (the Oct 10, 2025 crash), and DeFi tax self-reporting, which 1099-DA leaves to the user. Most of these are workflow, safety and comprehension problems, which an assistant can address better than another trading venue can.

### Cited Findings

**Surveys (2025–2026)**
- 1inch-led DeFi user survey (reported Feb 26, 2026; n=8,199; run with Bitget Wallet, Ondo, BOB, DaGama and SafePal; distributed through partner social channels, so the sample is self-selected). Biggest frustrations: **gas fees 27%, security risks 22%, failed/slow transactions 18%, bridges 14%** — [App Developer Magazine](https://appdevelopermagazine.com/DeFi-confidence-grows-with-experience-as-users-look-toward-2026/); [Crowdfund Insider](https://www.crowdfundinsider.com/?p=260254)
- Same survey, on what makes users try a new project or asset: **liquidity 56%, clear backing/custody 39%, legal/regulatory clarity 37%, transparency/attestations 35%, ability to trade onchain 31%, brand recognition 10%, "vibes" 4%** — [App Developer Magazine](https://appdevelopermagazine.com/DeFi-confidence-grows-with-experience-as-users-look-toward-2026/)
- Same survey: 72% are optimistic about DeFi (US 83%, Singapore 64%, Taiwan 63%, Hong Kong 56%). Newcomers are just over 60% optimistic, against about 73% for users with more than one year of experience. US users focus more on security, fees and gas; non-US users focus more on regulation — [App Developer Magazine](https://appdevelopermagazine.com/DeFi-confidence-grows-with-experience-as-users-look-toward-2026/)
- a16z State of Crypto 2025 (Oct 22, 2025): ~716M crypto owners (+16%) but only **40–70M active users** (+~10M YoY). Monthly active onchain addresses are ~181M (−18%). Mobile wallet users hit an ATH (+20% YoY). Average Ethereum L2 transaction cost is **under $0.01**, down from ~$24 in 2021 — [a16z State of Crypto 2025](https://a16zfrontier.com/posts/article/state-of-crypto-report-2025/)
- MEXC/Hacken AI trading survey (Oct 16, 2026; n=3,708; exchange-commissioned). Among people not using AI for crypto, the barriers are "getting started/high entry costs" (46.7%) and mistrust of AI (32.7%) — [Crypto Briefing](https://cryptobriefing.com/mexc-ai-trading-report-reveals-85-of-crypto-traders-use-ai-but-most-limit-its-control-over-funds/)
- ConsenSys/YouGov global survey (Dec 10, 2024; 18 countries; >18,000 people; **OLD, the latest edition found**): 93% are aware of crypto, but only 51% of those claim to understand it, and 42% own or have owned digital assets. Wallet ownership is highest in Nigeria (84%) and South Africa (66%), with the US at 43% and Turkey at 44% — [CryptoSlate](https://cryptoslate.com/global-crypto-awareness-hits-93-as-trust-in-traditional-finance-falters/); [ConsenSys](https://consensys.io/insight-report/web3-and-crypto-global-survey)
- Uniswap Labs survey (May 2023; n=1,860 US retail; **OLD**): complexity and cost deterred onchain trading. Users said they wanted education, better UX and support — [Uniswap blog](https://blog.uniswap.org/cefi-defi-uniswap-survey); [CoinDesk](https://coindesk-coindesk-prod.cdn.arcpublishing.com/business/2023/05/17/defi-must-get-easier-to-use-to-win-over-retail-customers-uniswap-survey-finds/)

**Specific pain points (community, industry commentary)**
- **Approvals.** Unlimited ERC-20 allowances and long-lived approvals are described as a persistent attack surface. Revoking them costs gas, which discourages hygiene — [DZap docs, "Problems in DeFi"](https://docs.dzap.io/product/problems-in-defi) (vendor content). Scam Sniffer data shows that the signature types draining wallets are Permit/Permit2, approve/increaseApproval, setApprovalForAll and EIP-7702 batch signatures (see Q2) — [Scam Sniffer 2025 report](https://drops.scamsniffer.io/scam-sniffer-2025-crypto-phishing-losses-fall-83-to-84-million/)
- **Position tracking and tool fragmentation.** DeFi power users juggle MetaMask, DeBank, Telegram alpha groups and custom Python scripts to track, trade and optimize — [Agoric blog](https://agoric.com/blog/product/defi-power-users-deserve-better-building-for-seamless-control) (vendor content)
- **Bridging and fragmentation.** Cross-chain bridging is described as error-prone and trust-eroding. Gas fees are reported as the #1 complaint in DeFi communities — [PainOnSocial Reddit research](https://painonsocial.com/blog/defi-user-pain-points-reddit) (secondary; I found no 2026 r/defi threads directly); [DZap docs](https://docs.dzap.io/product/problems-in-defi)
- **Liquidations and leverage.** On Oct 10, 2025, roughly **$19B+** of leveraged positions were liquidated in one day, with Hyperliquid alone at about $10.08B (Galaxy Research data via newsletter). Some estimates put the true total at $30–40B. Gauntlet's Tarun Chitra claims more than $650M was auto-deleveraged from profitable traders, which he puts at 28x the potential bad debt. That is one analyst's claim — [The Defiant](https://thedefiant.io/newsletter/defi-daily/the-ultimate-10-10-crash-autopsy); [Empire/Blockworks](https://empire-blockworks.beehiiv.com/p/hyperliquidated); [Forklog: forced liquidations in 2025 above $150B](https://forklog.com/en/forced-liquidations-in-2025-surpass-150-billion/amp)
- **Tax (US).** For 2025, Form 1099-DA reports gross proceeds only. Cost-basis reporting starts with assets acquired from Jan 1, 2026. Congress repealed the DeFi/non-custodial broker rule under the Congressional Review Act in April 2025, so onchain swaps, LP activity, staking and lending stay "entirely in the hands of the taxpayer and practitioner to document and report" — [NJCPA, Jun 16, 2026](https://njcpa.org/article/2026/06/16/form-1099-da--crypto-tax-issues); [Thomson Reuters](https://tax.thomsonreuters.com/news/crypto-users-want-to-comply-but-knowledge-gaps-persist-survey-finds/)
- **Old bot-trust data (Nov 2020, OLD).** In an Adam Cochran Twitter poll (n=10,388), 93% of people who paid for a trading-bot subscription stopped after a month. 63% hit technical issues, 69% found bots too technically complex, and 88% cited distrust of developers — [ForkLog](https://forklog.com/en/poll-trading-bots-fail-to-meet-crypto-traders-expectations/)

### Inferences
- Gas is still the #1 stated frustration even though L2 fees are under $0.01. The pain is therefore probably not the absolute cost. It is more likely the friction of holding the right gas token on every chain, failed transactions and fee unpredictability. Gas abstraction, gasless/intent execution and "you need X of token Y on chain Z" guidance are better-targeted fixes than a fee optimizer.
- Liquidity (56%) and verifiable backing (35–39%) drive users' willingness to try new assets. An assistant that explains liquidity depth, backing, custody and attestations in plain language before a trade covers the top due-diligence criteria users already apply.
- The holder/active-user gap (716M vs 40–70M) and the "getting started" barrier (46.7% of non-AI-users) support onboarding and explanation as a primary job for an AI assistant, especially for CEX converts.
- Tax and position tracking are chronic pains for DeFi-heavy users. The US regime explicitly leaves DeFi records to the user, so an assistant that keeps an annotated, exportable activity log has a durable job.

### Gaps
- I found no 2025–2026 large-sample independent survey (academic or neutral pollster) that ranks DeFi pain points. The 1inch survey is industry-run and self-selected.
- No 2025 ConsenSys/YouGov edition was found. The latest is Dec 2024.
- Direct 2026 Reddit/X thread sentiment could not be retrieved through search. The community-sentiment items above come through secondary or vendor sources.
- No quantified data on impermanent-loss losses, or on how many users cannot track their positions.

---

## 2. Losses to scams, phishing, wallet drainers, approval exploits and address poisoning (2025–2026)

### Takeaway
User-facing fraud is the largest addressable loss pool. In 2025, scams took **at least $14B, projected above $17B** (Chainalysis). Personal-wallet compromises were **$713M across 158,000 incidents** (Chainalysis). Signature-phishing drainers alone took **$83.85M from 106,106 victims**, down 83% YoY (Scam Sniffer). In H1 2026, CertiK counted **$1.32B** in total Web3 losses, of which **$366M was phishing** and **$445M wallet compromise**. Losses are shifting from mass drainers toward impersonation/social engineering, key compromise and targeted whale attacks such as address poisoning and Permit signatures. Pre-signature and pre-send checks in an AI assistant would address that shift directly.

### Cited Findings

**Chainalysis (2026 Crypto Crime Report, Jan 2026; 2025 data)**
- Scams received **at least $14B onchain in 2025**, expected to exceed **$17B** as more wallets are identified. 2024 was first reported at $9.9B and later revised to $12B — [Forklog](https://forklog.com/en/crypto-scammers-stole-a-record-14bn-in-2025/); [TechRepublic](https://techrepublic.com/article/news-2025-crypto-scam-losses)
- **Impersonation scams up ~1,400%** YoY, with average payments to them up over 600%. The average scam payment rose from $782 (2024) to **$2,764 (2025)**, +253% — [FastBull/Chainalysis summary](https://www.fastbull.com/brokersview/news/chainalysis-2026-report-crypto-scam-loss-estimated-at-17b-in-2025-impersonation-fraud-soars-1400-319993); [Forklog](https://forklog.com/en/crypto-scammers-stole-a-record-14bn-in-2025/)
- Scam operations with onchain links to AI vendors averaged **$3.2M revenue each vs $719K** without, about **4.5x**, and made 35.1 vs 3.89 transfers per day. This is a correlation, not proof that AI caused the difference — [Forklog](https://forklog.com/en/crypto-scammers-stole-a-record-14bn-in-2025/); [ProPakistani, Aug 2026](https://propakistani.pk/2026/08/12/ai-powered-crypto-scams-are-making-4-5-times-more-money/)
- Total crypto theft in 2025 was **$3.41B** (Jan–early Dec), against $3.38B in 2024, and Bybit's $1.5B was ~44% of it. **Personal-wallet compromises: 158,000 incidents, at least 80,000 unique victims, $713M stolen** (down from $1.5B in 2024). Attackers are spreading smaller thefts across more users — [The Block](https://www.theblock.co/post/382477/crypto-hack-2025-chainalysis)
- Wrench attacks (physical coercion) caused more than **$30M** in losses in 2026 YTD, or ~$107M including attempted extortion and frozen/returned funds (Chainalysis via Forklog; flagged as underestimated). Software cannot address these — [Forklog](https://forklog.com/en/wrench-attacks-cause-over-30-million-in-losses-in-2026/)

**Scam Sniffer 2025 annual report (EVM wallet-drainer phishing only; a lower bound)**
- **2025: $83.85M lost, 106,106 victims**, against 2024's $494M and 332,000 victims and 2023's $295M and 324,000 victims. Average loss per victim was **$790** (2024: $1,488). There were 11 cases of $1M or more, totalling $22.98M (~27% of losses) — [Scam Sniffer](https://drops.scamsniffer.io/scam-sniffer-2025-crypto-phishing-losses-fall-83-to-84-million/)
- By quarter: Q1 $21.94M / 22,654 victims; Q2 $17.78M / 20,974; **Q3 $31.04M / 39,886** (during the rally); Q4 $13.09M / 22,592. August ($12.17M) and September ($11.78M) were the worst months, so losses track market activity — [Scam Sniffer](https://drops.scamsniffer.io/scam-sniffer-2025-crypto-phishing-losses-fall-83-to-84-million/)
- Large-case signature types: **Permit/Permit2 $8.72M (3 cases; Permit = 38% of large-case losses)**, approve/increaseApproval $5.62M, plain transfer $4.87M, **EIP-7702 batch signatures $2.54M (2 cases, new after Pectra)**, setApprovalForAll $1.23M. The largest single case was **$6.5M via Permit** (stETH/aEthWBTC, Sep 2025). Several large victims held Aave aTokens (aEthUSDT, aEthWBTC, aPlaUSDT0), so DeFi-position holders are being targeted — [Scam Sniffer](https://drops.scamsniffer.io/scam-sniffer-2025-crypto-phishing-losses-fall-83-to-84-million/)
- Vectors named qualitatively, without a breakdown: compromised project X accounts, malicious Telegram bots, fake verification pages, frontend compromises and supply-chain attacks — [Scam Sniffer](https://drops.scamsniffer.io/scam-sniffer-2025-crypto-phishing-losses-fall-83-to-84-million/)

**CertiK Hack3d H1 2026**
- **$1,315.7M** gross losses across **344 incidents**. $115.3M was frozen or returned, leaving net losses of $1.20B. The mean loss was $3.82M and the **median $138.7K**. This is down 46.8% from H1 2025, but **about 28% higher excluding Bybit** — [CertiK](https://www.certik.com/blog/certik-hack3d-h1-2026-report)
- By vector: **wallet compromise $444.5M (33 incidents)**, which includes the Kelp DAO RPC compromise ($291M) and the Drift breach ($285M). **Phishing $366.3M (63 incidents**, −52% in count vs H1 2025, losses −10.8%; four incidents made up ~85% of phishing losses). Code vulnerabilities $151.6M across 204 incidents. By chain: Ethereum $522.8M (153 incidents), Solana $315.1M — [CertiK](https://www.certik.com/blog/certik-hack3d-h1-2026-report)

**Address poisoning**
- **$50M USDT** was lost in one address-poisoning attack in Dec 2025, the victim offering a $1M bounty — [The Block](https://www.theblock.co/post/383423/crypto-trader-loses-50-million-in-address-poisoning-attack-offers-1-million-bounty-for-return)
- About **$12.25M in ETH** was lost to address poisoning in early Feb 2026 (Scam Sniffer, via news aggregator), and a $600K case followed on Feb 17, 2026 — [MEXC News](https://www.mexc.com/news/605000) (aggregator; lower confidence)
- Trust Wallet reportedly cited more than 225M poisoning attacks and $500M in confirmed losses. This appeared in a sponsored post — [MEXC News](https://www.mexc.com/news/826424) (low confidence)

### Inferences
- The protective opportunity sits in three layers:
  - Mass retail phishing: ~$84M/yr in drainer losses across ~100K victims averaging $790. This is a high-frequency, low-ticket problem suited to always-on signature and URL screening.
  - Targeted high-value attacks: Permit and EIP-7702 batch signatures, address poisoning ($12M–$50M single cases) and large phishing incidents (four incidents = 85% of H1 2026 phishing losses). The fit here is pre-sign simulation, plain-language decoding and "first-time recipient / look-alike address" warnings.
  - Social-engineering and impersonation scams: $14–17B/yr, the largest pool, with impersonation up ~1,400%. A conversational assistant that sanity-checks "someone told me to send X" requests addresses this layer.
- Average scam payments are rising ($2,764) while drainer victims are falling. The threat has moved from "click a bad link" to "be persuaded to act", which favours a conversational advisor over a passive blocklist.
- AI-linked scam operations earn about 4.5x more. Users will expect any AI bot to prove it is not itself a vector: no custody of keys, transparent transaction previews and a verifiable identity for the bot.
- Some losses are out of scope for user-side tooling: protocol/infrastructure exploits (Kelp, Drift), CEX hacks (Bybit) and wrench attacks. Risk alerts about protocol exposure (for example, "your restaked ETH is in Kelp") can still help after an incident.

### Gaps
- No Q3 2026 CertiK, Scam Sniffer mid-2026 or Chainalysis mid-2026 figures were found. The latest comprehensive data is H1 2026 (CertiK) and full-year 2025 (Chainalysis, Scam Sniffer).
- No authoritative aggregate address-poisoning loss figure for 2025–2026 was found. The available numbers are individual cases or vendor claims.
- No Immunefi 2025/2026 report data was retrieved.
- No data on how much of the scam total hit DeFi users specifically rather than CEX/off-chain victims (pig-butchering, for example).

---

## 3. Which DeFi segments are growing as of 2026, and where is user activity?

### Takeaway
The 2026 picture is a sector-wide contraction with clear pockets of growth. Total DeFi TVL is **$89.7B (Oct 22, 2026)**, down from $166.7B (Oct 6, 2025) and a $68.2B low (Jul 1, 2026). Stablecoins are flat at about **$305B** YoY. Monthly DEX volume is roughly half its Oct 2025 peak. Growth and activity have concentrated in **perps DEXs, led by Hyperliquid** (~68% of perp DEX volume, OI ATHs in Sep 2026, HIP-3 equity and commodity perps), **prediction markets** (Kalshi and Polymarket reached ~$53B in July 2026), **tokenized Treasuries/RWAs** (~$15B in Treasuries in May 2026, up ~65% YTD) and **curated lending vaults** (Morpho, risk curators). Memecoin launchpads, restaking and Ethena/Pendle yield have shrunk sharply from their peaks. Wallets such as MetaMask, Phantom and Coinbase's Base App now embed perps and predictions. Users want one interface that reaches every venue.

### Cited Findings

**Macro baseline (DefiLlama API, pulled 2026-10-22)**
- Total DeFi TVL: **$89.72B (Oct 22, 2026)**. Earlier readings: $85.33B (Oct 22, 2024), $115.42B (Jan 1, 2025), **$166.66B (Oct 6, 2025)**, $147.53B (Oct 22, 2025), $114.36B (Jan 1, 2026), $93.19B (Apr 1, 2026), **$68.16B (Jul 1, 2026, the low)**, $86.71B (Sep 1, 2026) and $93.99B (Oct 1, 2026) — [DefiLlama](https://defillama.com/) (API: api.llama.fi/v2/historicalChainTvl). A secondary report put 2026's monthly decline at −39% ($115B → ~$70B) — [BeInCrypto](https://beincrypto.com/defi-tvl-decline-2026-downtrend/)
- TVL by category (Oct 22, 2026; excludes CEX and chain entries): Bridge $62.4B, Liquid Staking $54.0B, **Lending $52.6B**, Staking Pool $14.2B, DEXs $14.0B, Restaking $9.7B, **Risk Curators $9.6B**, **Onchain Capital Allocator $9.5B**, CDP $7.7B, Basis Trading $7.65B, Yield $4.7B, RWA $4.0B (DefiLlama's RWA category is narrower than RWA.xyz's), Derivatives $1.95B, Prediction Market $0.42B — [DefiLlama](https://defillama.com/categories) (API: api.llama.fi/protocols)
- Stablecoin supply: **$305.4B (Oct 22, 2026)**. Earlier: $172.7B (Oct 22, 2024), $307.0B (Oct 22, 2025), $305.0B (Jan 1, 2026), and an ATH of **$317.1B on May 17, 2026** — [DefiLlama Stablecoins](https://defillama.com/stablecoins). Another tracker puts the ATH at $322.4B (May 17, 2026) and early September at ~$301.7B, calling it the first supply contraction in four years. The difference is methodological — [Spark tracker](https://www.spark.money/tools/stablecoin-supply-growth-tracker); [Transak](https://transak.com/blog/stablecoin-market-cap-2026)
- Monthly DEX spot volume: **Oct 2025 $588.1B (peak)**, Jan 2026 $364.3B, Apr 2026 $202.6B (low), Aug 2026 $241.0B, **Sep 2026 $318.4B**, Oct 1–22, 2026 $183.5B. Trailing-1-year volume is $3.39T, and 30-day volume is down 15% vs the prior 30 days — [DefiLlama DEXs](https://defillama.com/dexs) (API: api.llama.fi/overview/dexs)
- Stablecoin payments (a16z, Sep 2025 data; most recent primary figure): **$46T** in trailing-12-month transaction volume (+106%), **$9T adjusted** (+87%), about $1.25T adjusted per month by Sep 2025. Tether and USDC hold 87% of supply. DEXs had almost one fifth of spot volume. Perps volume grew ~8x YoY — [a16z State of Crypto 2025](https://a16zfrontier.com/posts/article/state-of-crypto-report-2025/)

**Perps DEXs (strongest growth segment)**
- Hyperliquid has about **68%** of 30-day volume among tracked perp DEXs (DefiLlama, mid-2026), with Aster at ~15% and Lighter at ~13%. Analysts flag Aster's and Lighter's high volume-to-OI as incentive farming (unverified) — [Yellow Research](https://yellow.com/research/perp-dex-market-share-hyperliquid-2026)
- Perp DEX volume grew from ~$81.7B to **$739.5B per month** between Jan 2024 and Jan 2026, lifting their share of all perp volume from 2.0% to **10.2%** (CoinGecko data). Hyperliquid was the only DEX among the top 10 perps venues, with $1.59T cumulative volume from Aug 2025 to Jan 2026 — [Yahoo Finance / CoinGecko](https://finance.yahoo.com/news/hyperliquid-dexs-break-top-10-180000904.html)
- By April 2026, perp DEXs held more than **13.5% of total crypto perp open interest**, with Hyperliquid at $12.25–13.22B, over half the sector — [CryptoBriefing](https://cryptobriefing.com/perp-dex-open-interest-2026-high/)
- Hyperliquid did ~$633B in combined perps and spot volume in Q1 2026, and $181.7B in 30-day volume in April 2026 — [VanEck](https://www.vaneck.com/it/en/blog/digital-assets/exploring-hyperliquid-redefining-derivatives-trading/) (issuer marketing)
- Hyperliquid OI reached **$14.3B around Sep 8, 2026**, within 3% of its level just before the 10/10 crash. HIP-3 (builder-deployed markets: equities, commodities) grew from 18% of OI in Mar 2026 to more than **34% in Aug 2026**, with a record HIP-3 OI above $4.44B in August. **Coinbase began routing Base App users to Hyperliquid in mid-August 2026** — [The Block](https://www.theblock.co/news/ecosystems/2026-09-08-hyperliquid-open-interest-climbs-14-3-billion-hype-hits-all-time-high-413855). A reported ATH of **$18B OI on Sep 23, 2026** comes from an aggregator flash and has lower confidence — [KuCoin News](https://www.kucoin.com/news/flash/hyperliquid-open-interest-hits-all-time-high-of-18b)
- Revenue, trailing 30 days (DefiLlama, ~Oct 22, 2026): **Hyperliquid Perps $64.7M** (1y: $664M), Lighter Perps $2.8M, Jupiter Perps $1.8M. **Wallet-embedded perps** earn revenue too: Phantom Perps $1.3M/30d ($19.0M/1y) and MetaMask Perps $1.3M/30d ($11.7M/1y) — [DefiLlama Revenue](https://defillama.com/revenue)

**Prediction markets**
- Kalshi + Polymarket + Polymarket US combined monthly volume: **May 2026 $25.66B → Jul 2026 ~$52.99B** (Kalshi $40.1B; Polymarket+US $12.89B) → **Aug 2026 $45.33B** (−14.5% MoM, the first decline since Aug 2025; Kalshi $37.17B, Polymarket+US $8.16B) — [The Block, Sep 2, 2026](https://www.theblock.co/news/business/2026-09-02-kalshi-polymarkets-volume-falls-august-413309). Crypto Economy gives slightly different August figures (Kalshi $38.67B; Polymarket $8.41B) — [Crypto Economy](https://crypto-economy.com/polymarket-activity-slides-35-with-monthly-volume-down-to-4-59-billion/)
- Combined sports prediction-market volume was about $14.1B in one week of Sep 2026 (weekly figure) — [CryptoBriefing](https://cryptobriefing.com/polymarket-nfl-college-football-volume-surge/)
- Polymarket International revenue was $14.7M over 30 days and $133.3M over 1 year (DefiLlama, ~Oct 2026). Wallets are adding predictions too: MetaMask Predictions earned $0.2M in 30 days, and Hyperliquid Outcomes has launched — [DefiLlama Revenue](https://defillama.com/revenue)
- a16z: Polymarket+Kalshi volume was up nearly 5x from the start of 2025 to Sep 2025 — [a16z](https://a16zfrontier.com/posts/article/state-of-crypto-report-2025/)

**Memecoins and launchpads (contracting, but still big revenue)**
- Pump.fun's 7-day graduation rate was **0.26%** (−80% over 3 months). Revenue fell to about **$0.8M/day in June 2026** from $4.8M/day six months earlier. Solana fees dropped from ~33,000 SOL/day (Jan 2026) to ~5,300 SOL/day (Jun 2026), and The Block assumes the activity rotated into Hyperliquid perps — [The Block, Jun 16, 2026](https://theblock.co/post/404806/pump-fun-activity-craters-80-three-months-solana-fees-lower-traders-rotate-perps)
- Pump.fun had $28.4M in 30-day revenue in July 2026, with ~$1.05B lifetime. It cut buybacks to 50% of revenue in April 2026 — [BYDFi](https://www.bydfi.com/en/crypto-news/pump/pump-faces-125m-unlock-test-as-buyback-shrinks-21082); [CoinDesk, Apr 29, 2026](https://www.coindesk.com/markets/2026/04/29/pump-fun-burns-36-of-pump-supply-in-usd370-million-wipe-locks-50-revenue-into-ongoing-buybacks)
- DefiLlama trailing 30 days (~Oct 22, 2026): **pump.fun $46.3M** (1y $327M) plus PumpSwap $15.7M. Trading terminals: **Axiom $15.7M** (1y $156.8M), **GMGN $14.7M** (1y $160.7M), Photon $0.4M. Telegram bots: Trojan $0.7M, Maestro $0.6M, BONKbot $0.1M. The October launchpad revenue points to a partial rebound from the June trough — [DefiLlama Revenue](https://defillama.com/revenue)
- At an unclear date (likely 2025), Axiom had ~58% of Solana trading-bot volume (~$4.3B over two months). Weekly bot fees peaked near $100M, then settled at $30–50M/week — [DefiLlama TG bots dashboard](https://defillama.com/pro/tg-bots-trading-apps-7y0m8c)
- a16z: more than 13M memecoins launched in the year to Sep 2025, with Sep 2025 launches 56% below January — [a16z](https://a16zfrontier.com/posts/article/state-of-crypto-report-2025/)

**Yield, lending and stablecoin yield (DefiLlama API, pulled 2026-10-22)**
- Lending TVL: **Aave V3 $16.79B** (plus Aave V4 $0.68B and Aave Horizon RWA $0.25B), **Morpho Blue $11.13B**, Sky Lending $5.61B, SparkLend $5.05B, Maple $2.78B, Hyperliquid Earn $1.43B, Kamino Lend $1.31B, Jupiter Lend $1.03B — [DefiLlama](https://defillama.com/protocols/lending)
- **Ethena USDe TVL $4.65B** (Oct 22, 2026). LlamaRisk put USDe supply at $5.92B on Mar 16, 2026, down from $6.42B in mid-January. USDe supply peaked above $14B before the Oct 2025 crash (secondary) — [DefiLlama](https://defillama.com/protocol/ethena-usde); [Aave governance/LlamaRisk](https://governance.aave.com/t/direct-to-aip-onboard-usde-susde-april-expiry-pt-tokens-on-aave-v3-plasma-instance/23515/2)
- **Pendle V2 TVL $1.05B** (Oct 22, 2026). In Aug 2025, USDe-related assets alone were ~$4.01B (~60%) of Pendle's TVL. The contraction tracks Ethena's — [DefiLlama API](https://api.llama.fi/protocols); [Blockworks Ethena–Pendle dashboard](https://blockworks.com/analytics/ethena/ethena-defi-footprint/ethena-usde-related-tvl-in-pendle-markets)
- Curated and delegated yield: the "Risk Curators" ($9.61B) and "Onchain Capital Allocator" ($9.46B) categories together hold about $19B. In June 2026 Morpho raised $175M co-led by Paradigm, a16z crypto and Ribbit — [DefiLlama categories](https://defillama.com/categories); [Portals blog, Jun 2026](https://blog.portals.fi/defi-tvl-june-2026-week-2/)

**Restaking (contracting)**
- EigenLayer, now "EigenCloud" on DefiLlama, holds **$6.13B TVL** (Oct 22, 2026). Babylon has $3.31B and Symbiotic $0.32B (−29% in 7 days) — [DefiLlama API](https://api.llama.fi/protocols)
- EigenLayer TVL was reportedly above $15B earlier in 2026 before a withdrawal wave tied to the Kelp DAO exploit. ether.fi withdrew more than 2.25M ETH, and native restaked ETH fell from ~3.5M to ~643K by Sep 30, 2026. AVS yields underdelivered. These are secondary sources — [KuCoin Square](https://kucoin.com/square/post/content_6a509a6328ee51000797f834); [Baltex review, Oct 2026](https://baltex.io/blog/ecosystem/eigenlayer-review)
- Points and airdrop fatigue (**OLD, 2024**): EigenLayer TVL fell ~27% from its June 2024 high as farmers rotated out after the token launch — [The Block](https://www.theblock.co/post/305378/eigenlayer-exodus-leads-wider-decline-in-the-restaking-sector)

**RWA and tokenized treasuries (growing)**
- RWA.xyz (checked May 7, 2026): **$31.17B distributed tokenized RWAs**, $391.95B represented value, **749,168 RWA holders**, 173 platforms. Tokenized Treasuries were **$15.24B** across 76 assets (May 6, 2026) — [Mean CEO stats, citing RWA.xyz](https://blog.mean.ceo/?p=5732)
- Tokenized Treasuries grew from ~$9.2B (early Jan 2026) past $10B (Feb 2026) to $11.13B (Mar 2026). DefiLlama's method counts tokenized funds at ~$10.5B (44.5% of its onchain RWA total) — [Cointelegraph](https://cointelegraph.com/news/tokenized-rwas-rise-66-percent-2026-defillama?rand=6792); [KuCoin blog](https://www.kucoin.com/blog/en-real-world-assets-rwa-crypto-growth-2026-tokenization-trends-market-size-trading-insights)
- a16z: tokenized RWAs were $30B in Sep 2025, up nearly 4x in two years — [a16z](https://a16zfrontier.com/posts/article/state-of-crypto-report-2025/)

**Where revenue and attention go (DefiLlama revenue, trailing 30 days, ~Oct 22, 2026)**
- Tether $524.1M, Circle $212.1M, Hyperliquid Perps $64.7M, pump.fun $46.3M, PumpSwap $15.7M, Axiom $15.7M, Polymarket $14.7M, GMGN $14.7M, Uniswap V3 $8.4M, Phantom Wallet $5.9M, Aave V3 $4.8M, Lido $3.2M, Base App $2.3M, MetaMask Wallet $2.1M, Pendle V2 $0.4M, Ethena USDe $0.1M — [DefiLlama Revenue](https://defillama.com/revenue)

### Inferences
- Engagement-intensive segments, where users act often and need help most, are **perps (Hyperliquid and HIP-3 markets), prediction markets and memecoin/launchpad trading**. These earn far more revenue than passive yield protocols: Aave V3 makes $4.8M/30d against Hyperliquid's $64.7M and pump.fun's $46.3M. A retail-facing assistant has the most demand where users trade frequently and blow up often: liquidation alerts, position sizing, funding-rate and OI context, and market resolution rules.
- Front-ends such as Axiom, GMGN and Phantom, MetaMask and Base App capture tens of millions of dollars a month by wrapping protocols. That is direct evidence users pay, through fees, for a better execution interface. An AI assistant is the next form of this front-end layer. Telegram bots' revenue has fallen behind web terminals, which suggests the chat-only interface alone is not the moat.
- Yield is consolidating into curated vaults (Morpho, risk curators, ~$19B combined) and tokenized Treasuries ($15B+). Passive users increasingly want delegated, risk-managed yield, not hands-on farming. An assistant can help them compare curators and vault risk, which is the comparison-and-monitoring job.
- Restaking, Ethena/Pendle basis yield and points farming have shrunk 50–85% from their peaks. They are weaker targets as primary use cases, though monitoring still matters for existing holders exposed to depegs and exploits.
- Stablecoin supply is flat YoY (~$305B) but payments volume is huge ($9T adjusted per year as of 2025). Stablecoin moves, payments and yield parking are a broad, lower-risk entry use case for newcomers.

### Gaps
- No complete September or October 2026 monthly figures for Kalshi or Polymarket were found. August 2026 is the latest complete month.
- No authoritative Sep/Oct 2026 perp DEX aggregate volume: DefiLlama's derivatives endpoint is paid-only, and the latest market-share figure (68%) is "mid-2026".
- No RWA.xyz figures after May 2026.
- No reliable 2026 data on airdrop or points-farming participation (number of farmers, capital deployed).
- No 2026 user counts (unique traders) for Hyperliquid, Polymarket, Axiom or pump.fun. One March 2026 figure exists: 229,818 active Hyperliquid traders, from a Whale Alert story — [Whale Alert](https://whale-alert.io/stories/d39b01bcc9a83f/Hyperliquid-HIP-3-OI-174B-launches-licensed-SP-500-perpetual-records-229818-active-traders-as-institutions-file-HYPE-ETF-GHYP) (low confidence).
- Pendle's $1.05B "Pendle V2" figure may exclude other Pendle products such as Boros. Check it on the Pendle dashboard before relying on it.

---

## 4. What do users say they want from an AI crypto assistant? Trust, delegation and willingness to pay

### Takeaway
AI use for crypto is already mainstream among traders: 77–85% have used AI for research in recent months. Most of that use is **research, news summarization and analysis, not execution** (direct execution is only 7.6%). Willingness to delegate is real but **capped and conditional**. Most users would hand over **≤10–25% of a portfolio**, and only 2–15% would hand over everything. Willingness jumps when **hard risk limits, real-time alerts and instant permission revocation** are present: from 55% to 71.8% in MEXC's survey, and those controls rated more than 2x any other safeguard in OKX's. Stated willingness to pay is ~60%, but historical bot churn is severe (93% after one month in an old 2020 poll). Trust is the binding constraint.

### Cited Findings
- **MEXC/Hacken survey (Oct 16, 2026; n=3,708; exchange-commissioned):**
  - **84.8%** used AI to analyze or trade crypto in the past six months, and 53.1% use it weekly. Usage is 88.5% among 18–34-year-olds against 69.9% among those 45+.
  - Use cases: **news summarization 54.3%, market analysis 48.6%, finding trading opportunities 38%, direct execution 7.6%**. 68.9% said AI helped most *before* execution.
  - 58.3% said AI improved their research. For execution, 46% said it improved, 30.9% unchanged and 23.1% **worsened**.
  - **54% would let AI trade with ≤20% of their account; 6.5% with more than half.**
  - Willingness to allow automated trading is **55% with notifications, pause and revoke, rising to 71.8% with hard limits** on funds, assets, positions, leverage and losses plus an automatic stop at a loss threshold.
  - About half of those with automation experience fear they could not detect or stop problems in time. 95.5% support at least one mandatory protective measure. The most supported are a risk assessment or knowledge test before first use (55.3%), independent audits (38.8%) and non-disableable capital/loss limits (38.8%). 46.2% prefer optional user-enabled safety settings.
  - Source: [Crypto Briefing](https://cryptobriefing.com/mexc-ai-trading-report-reveals-85-of-crypto-traders-use-ai-but-most-limit-its-control-over-funds/)
- **OKX survey (Jul 21, 2026; n=1,400 US traders; methodology not disclosed):**
  - ~70% would let AI manage their portfolio, either fully autonomously or within limits they set.
  - **Full unsupervised authority: Gen Z 38%, millennials 37%, baby boomers 11%.**
  - **Real-time notifications and instant permission revocation** were the top safeguards, each drawing more than twice the support of any other.
  - **79% would switch exchanges for better AI tools.** 51% use AI tools several times a week, and **77% used a general-purpose chatbot to research a crypto position in the past 3 months**.
  - Source: [GNcrypto](https://www.gncrypto.news/news/7-in-10-us-crypto-traders-back-ai-portfolios-off-switch/)
- **Cryptonomist survey (Jun 3, 2026; n=1,036; sponsor not stated):**
  - **63.6% would NOT let AI trade autonomously with their capital** (36.3% would).
  - **79.4% would cap AI at ≤25% of the portfolio**. The most common cap is 5–10% (29.4%). 6.5% would allow more than half, 2% everything and 7.5% nothing.
  - Reliance is light: 14% rely heavily, 68.5% use AI as a reference or second opinion, and 3.3% follow signals directly.
  - 74.1% say AI helps decisions, but only 32.7% believe it beats trading on their own. 52.9% report profits from AI-assisted trades.
  - **59.8% definitely plan to use AI tools in 2026.**
  - Source: [The Cryptonomist](https://en.cryptonomist.ch/2026/06/03/ai-crypto-trading-trust-survey/)
- **CoinGecko Crypto x AI survey (Feb 20–Mar 10, 2025; n=2,632; slightly older):**
  - Trust in AI agents with wallets: **34.5% trust, 37.5% distrust, 27.9% neutral**.
  - **87.1%** would let an AI agent manage at least 10% of their portfolio. 35.9% would allow 60% or more, 14.5% everything and 12.9% none.
  - ~50% think AI agents will outperform humans most of the time.
  - Source: [Cryptopolitan](https://www.cryptopolitan.com/coingecko-survey-crypto-users/)
- **Willingness to pay.** In a Nov 2025 survey (n=2,022; weakly documented, platform-adjacent publisher), **nearly 60% would pay a monthly fee for a reliable AI bot**, and 36.4% would give AI bots no more than 20% of their portfolio — [CoinStats News](https://coinstats.app/en/news/2348788ca6766c318ac72bdb23a2acfb277792c36cd0c111016ea7f42645079f_1-in-3-Investors-Let-AI-Manage-Over-Half-Portfolio/); [NFT Plazas](https://nftplazas.com/crypto-ai-trading-investing/) (low confidence)
- **Retention counter-signal (OLD, Nov 2020).** In Adam Cochran's poll (n=10,388), 93% of people who paid for bot subscriptions stopped after one month. 81% found bots unsuited to their needs, 63% hit technical problems and 88% distrusted the developers — [ForkLog](https://forklog.com/en/poll-trading-bots-fail-to-meet-crypto-traders-expectations/)
- **AI as a threat to trust.** Scam operations linked to AI vendors earned ~4.5x more on average in 2025 — [Forklog / Chainalysis](https://forklog.com/en/crypto-scammers-stole-a-record-14bn-in-2025/)
- **Regulatory backdrop.** Bank of England Deputy Governor Sarah Breeden has warned that autonomous trading systems may need circuit breakers or kill switches (reported Jul 2026) — [GNcrypto](https://www.gncrypto.news/news/7-in-10-us-crypto-traders-back-ai-portfolios-off-switch/)

### Inferences
- **Demand ranking implied by the data:**
  1. Research, news summaries and explanations ("copilot"), already used by most traders.
  2. Alerts and monitoring: liquidation risk, depeg and exploit exposure, approvals.
  3. Pre-trade checks and transaction safety.
  4. Bounded execution under hard caps.
  5. Full autonomy, which is a minority demand concentrated among Gen Z and millennials.
- Non-custodial, session-key or delegation designs that cap the amount and scope give users what they ask for: **visible limits, real-time notifications and one-tap revoke**. A design that cannot be shown to be revocable will lose most of the market.
- Typical delegation caps of 5–25% of a portfolio support a business model built on recurring assistance and protection rather than AUM-style fees on the whole portfolio.
- 77% of traders already use general-purpose chatbots for crypto research. The differentiator is onchain-grounded truth that a general chatbot lacks: live positions, decoded transactions, protocol risk data and execution. Generic LLM chat alone is not differentiated.
- Retention risk is the main commercial threat: 93% churn in older bot data, and 23% of users saying execution got worse. The value has to show up continuously, through prevented losses and saved time, not just through signals.

### Gaps
- No rigorous, independent (non-exchange) 2026 survey on willingness to pay, price points or subscription tiers for AI crypto assistants was found.
- No published retention or churn data for 2025–2026 AI DeFi agents.
- Survey samples are self-selected crypto audiences, often exchange-sponsored (OKX, MEXC). Results probably overstate enthusiasm compared with the general holder population.
- No survey data separating DeFi-native users' attitudes to AI agents from CEX traders'.

---

## 5. User segments and how their needs differ

### Takeaway
The data supports five distinct segments with different jobs-to-be-done:
- **Retail degens / active traders**: perps, memecoins, prediction markets. They are the highest-revenue and highest-blow-up group, and the youngest and most willing to delegate.
- **Yield seekers / farmers**: lending, curated vaults, Pendle/Ethena. They are shifting to delegated, curated yield.
- **Passive holders / long-termers**: about half of surveyed crypto users. They want safety, tracking and simple yield.
- **Newcomers / CEX converts**: the biggest pool (716M holders vs 40–70M active). They are less confident, blocked by getting started, and increasingly onboarded through wallet super-apps such as Base App, MetaMask and Phantom.
- **Whales / funds**: few, but they bear the largest single losses (Permit, address poisoning) and drive RWA and Treasury demand.

### Cited Findings
- **Holder mix.** CoinGecko AI survey respondents (2025): **51% long-term holders, 26% short-term traders. 53% are in their first cycle**, 34% in their second, and the rest are veterans with 8+ years — [Cryptopolitan](https://www.cryptopolitan.com/coingecko-survey-crypto-users/)
- **Newcomers versus experienced users.** Optimism about DeFi is ~60% for newcomers against ~73% for those with more than one year of experience. "Confidence in DeFi comes with experience" (1inch co-founder) — [App Developer Magazine](https://appdevelopermagazine.com/DeFi-confidence-grows-with-experience-as-users-look-toward-2026/). Among non-AI users, "getting started/entry costs" is the top barrier at 46.7% — [Crypto Briefing](https://cryptobriefing.com/mexc-ai-trading-report-reveals-85-of-crypto-traders-use-ai-but-most-limit-its-control-over-funds/)
- **The activation gap.** About 716M holders against 40–70M active users, with monthly active addresses down 18% (Sep 2025) — [a16z](https://a16zfrontier.com/posts/article/state-of-crypto-report-2025/)
- **Geography.** Mobile-wallet growth is fastest in Argentina, Colombia, India and Nigeria (Argentina 16x in three years), driven by stablecoins and payments. Trading and token interest concentrate in developed markets such as Australia and South Korea — [a16z](https://a16zfrontier.com/posts/article/state-of-crypto-report-2025/). Wallet ownership is 84% in Nigeria and 66% in South Africa (ConsenSys, Dec 2024, OLD) — [CryptoSlate](https://cryptoslate.com/global-crypto-awareness-hits-93-as-trust-in-traditional-finance-falters/)
- **Age and delegation appetite.** Full unsupervised AI authority is acceptable to 38% of Gen Z and 37% of millennials, against 11% of boomers — [GNcrypto/OKX](https://www.gncrypto.news/news/7-in-10-us-crypto-traders-back-ai-portfolios-off-switch/). AI usage for crypto is 88.5% among 18–34-year-olds against 69.9% among those 45+ — [Crypto Briefing/MEXC](https://cryptobriefing.com/mexc-ai-trading-report-reveals-85-of-crypto-traders-use-ai-but-most-limit-its-control-over-funds/)
- **Retail degens and active traders.**
  - Trading terminals (Axiom $15.7M, GMGN $14.7M in 30-day revenue) and launchpads (pump.fun $46.3M) still earn heavily as of Oct 2026 — [DefiLlama Revenue](https://defillama.com/revenue)
  - Memecoin activity collapsed in H1 2026 (pump.fun graduation rate 0.26%), with activity assumed to rotate into Hyperliquid perps — [The Block](https://theblock.co/post/404806/pump-fun-activity-craters-80-three-months-solana-fees-lower-traders-rotate-perps)
  - Leverage blow-ups: $19B+ liquidated on Oct 10, 2025 — [The Defiant](https://thedefiant.io/newsletter/defi-daily/the-ultimate-10-10-crash-autopsy)
- **CEX-to-onchain converts.**
  - Coinbase began routing Base App users to Hyperliquid in mid-August 2026 — [The Block](https://www.theblock.co/news/ecosystems/2026-09-08-hyperliquid-open-interest-climbs-14-3-billion-hype-hits-all-time-high-413855)
  - Wallets monetize embedded perps and predictions: Phantom Perps $19.0M/yr, MetaMask Perps $11.7M/yr, MetaMask Predictions $1.4M/yr, Base App $9.6M/yr — [DefiLlama Revenue](https://defillama.com/revenue)
  - 79% of US traders would switch exchanges for better AI tools — [GNcrypto](https://www.gncrypto.news/news/7-in-10-us-crypto-traders-back-ai-portfolios-off-switch/)
- **Yield farmers and passive yield seekers.** Lending TVL is $52.6B. Curated vaults and allocators (Risk Curators $9.61B plus Onchain Capital Allocators $9.46B) and Morpho Blue ($11.13B) make up a large share. Basis-trade yield (Ethena USDe $4.65B, Pendle V2 $1.05B) shrank sharply after the Oct 2025 crash — [DefiLlama API](https://api.llama.fi/protocols)
- **Whales.** The largest individual losses come from targeted attacks:
  - $50M address poisoning (Dec 2025) — [The Block](https://www.theblock.co/post/383423/crypto-trader-loses-50-million-in-address-poisoning-attack-offers-1-million-bounty-for-return)
  - $6.5M Permit phishing (Sep 2025) — [Scam Sniffer](https://drops.scamsniffer.io/scam-sniffer-2025-crypto-phishing-losses-fall-83-to-84-million/)
  - CertiK's H1 2026 mean loss ($3.82M) is ~28x the median ($138.7K), showing how concentrated losses are — [CertiK](https://www.certik.com/blog/certik-hack3d-h1-2026-report)
- **Institutions and funds.** BTC and ETH ETPs hold more than $175B (+169% YoY). ETPs plus digital-asset-treasury companies hold ~10% of BTC and ETH supply (Sep 2025) — [a16z](https://a16zfrontier.com/posts/article/state-of-crypto-report-2025/). Tokenized Treasuries reached $15.24B and RWA holders 749K (May 2026) — [Mean CEO / RWA.xyz](https://blog.mean.ceo/?p=5732)

### Inferences
Segment needs inferred from the cited evidence:
- **Retail degens / active traders** (young, high AI appetite, high frequency):
  - Real-time liquidation and funding alerts, and position-sizing guardrails.
  - Contract and rug checks before buying memecoins.
  - Prediction-market resolution-rule explainers.
  - Cross-venue execution across Hyperliquid, Solana DEXs and Polymarket.
  - Fast chat-based execution with hard loss caps. This group is the most willing to pay through fees and the most likely to churn.
- **Yield seekers**:
  - Comparing curated vaults and curators (risk, collateral, oracle and depeg exposure).
  - Net-APY math after gas and bridging.
  - Rebalancing suggestions.
  - Exploit and depeg alerts, for example for exposure to Kelp DAO or Ethena-style events.
  - Tax-lot logging.
- **Passive holders**:
  - A portfolio overview across chains.
  - Approval hygiene (revoke suggestions).
  - Simple "park stablecoins in Treasury-backed or blue-chip yield" flows.
  - Scam and impersonation sanity checks.
- **Newcomers / CEX converts** (largest pool, lowest confidence):
  - Plain-language explanations of every signature.
  - Gas and bridge abstraction ("you need ETH on Base").
  - Guided first actions.
  - Strong default protections, such as optional knowledge checks and limits, which 55% support as mandatory.
  - The likely distribution channel is wallet super-apps and exchanges.
- **Whales / funds**:
  - Pre-sign simulation and decoding of Permit and EIP-7702 batch signatures.
  - Address-book allowlists and look-alike address alerts.
  - Multi-wallet risk dashboards.
  - Reporting.
  - Lower interest in autonomous execution, high value per prevented incident.

### Gaps
- No 2025–2026 dataset sizes these segments by headcount (for example, the number of active DeFi yield farmers or Hyperliquid unique traders).
- No segment-level willingness-to-pay data.
- No direct data on the share of CEX users who have tried DeFi in 2025–2026.
- Whale and fund needs are inferred from loss patterns and institutional flow data, not from surveys of those users.
