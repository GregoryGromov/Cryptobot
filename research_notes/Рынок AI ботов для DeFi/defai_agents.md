# DeFAI: AI agents that execute or automate DeFi actions. Competitive map as of October 2026

How to read these notes
- "Live data 2026-10-22" means I pulled the number myself on 22 Oct 2026 from the DefiLlama public API (api.llama.fi) or the CoinPaprika API (api.coinpaprika.com). These are the freshest numbers in this file.
- "FDV@ATH" is my own calculation: all-time-high price × total supply. It is an upper-bound proxy for peak valuation. It is not a reported peak market cap.
- **[HISTORICAL]** marks data from the 2024 to early-2025 hype cycle. Treat it as context, not current state.
- Most project-side traction figures are self-reported. I flag them where it matters.
- The web search budget ran out partway through. Brian AI, Slate, Fungi, Lyra, and parts of Cod3x and Neur were not researched in depth (see Gaps).

---

## 1. Which DeFAI products exist and what is their status in October 2026?

### Takeaway
Almost every first-wave (2024–early 2025) DeFAI token has lost 97–99.9% from its peak: Griffain, HeyAnon, Orbit, Neur, Spectral, Cod3x, Mode, aixbt and ElizaOS. Several flagship products have been wound down or have drifted away from AI. Giza ARMA wound down in Feb–Mar 2026. Eliza Labs wound down in Apr 2026. HeyAnon's founder now ships AMMs on Robinhood Chain. In 2026 activity has moved in three directions:
- agent-wallet infrastructure from incumbents: Coinbase, OKX, MetaMask, Trust Wallet, and Meta's Muse via Bankr;
- Hyperliquid perps "AI trader" front-ends: Minara, Senpi, INFINIT;
- a few yield agents that kept TVL without incentives (ZyFAI).

### Cited Findings

**Sector-level**
- **[HISTORICAL]** CoinGecko listed nearly 90 DeFAI projects with a combined market cap above $1.3B as of February 2025. — [ISACA blog 2026](https://www.isaca.org/resources/news-and-trends/isaca-now-blog/2026/the-defai-revolution-unlocking-a-democratic-and-intelligent-financial-future)
- **[HISTORICAL]** In January 2025, PANews tracked 13 DeFAI tokens. Only GRIFFAIN and Hey Anon had market caps above $100M; most others were in the tens of millions. — [MEXC/PANews repost](https://www.mexc.com/news/588) (page now returns 410; content seen via search snippet)
- **[HISTORICAL]** DWF Labs grouped DeFAI into four categories: Abstraction (chat-to-transaction), Infrastructure, Optimization (yield/trading agents) and Analysis. — [DWF Labs research](https://www.dwf-labs.com/research/501-defai-bridging-ai-and-defi-for-the-future-of-finance)
- In April 2026, DWF Ventures estimated:
  - automated and agent activity at about 19% of all on-chain activity;
  - bots generating more than 76% of stablecoin transfer volume;
  - more than 17,000 agents launched since 2025;
  - most agents still at the "analyst-to-copilot" level and mostly in testing.
  — [Odaily/TechFlow summary of DWF report, 17 Apr 2026](https://www.odaily.news/en/post/5210341)
- DefiLlama's "AI Agents" category (live data 2026-10-22) has 39 protocols with combined TVL of about **$31.0M**.
  - About $18.2M of that is MorpheusAI, which is not a DeFi execution agent.
  - ZyFAI is about $10.5M.
  - Every other protocol in the category is below $1M.
  — [DefiLlama API /protocols](https://api.llama.fi/protocols)
- **ERC-8004**, an on-chain registry for agent identity and reputation, has been live since January 2026. — [Odaily/DWF](https://www.odaily.news/en/post/5210341)

**Per-product status. First-wave consumer chat agents (Abstraction layer)**

- **HeyAnon (ANON). Alive but drifted away from the AI product; token near-dead.**
  - **[HISTORICAL]** HeyAnon has shipped as an AI interface for DeFi transactions since late 2024. — [The Defiant](https://thedefiant.io/news/defi/anon-triples-after-sesta-deploys-amm-on-robinhood-chain)
  - Described as an AI-powered DeFi platform whose agents handle swaps, lending and other DeFi operations across multiple networks. — [Crypto Briefing, 11 Sep 2026](https://cryptobriefing.com/heyanon-token-triples-equilibra-robinhood-chain/)
  - HeyAnon launched mainnet on Robinhood Chain on 1 Jul 2026, the day the chain went live. — [Crypto Briefing](https://cryptobriefing.com/heyanon-token-triples-equilibra-robinhood-chain/)
  - On 20 Jul 2026 the HeyAnon DAO proposed a non-dilutive merger with WAGMI DAO to absorb WAGMI's v2 AMM technology, liquidity infrastructure and RWA lending. — [Crypto Briefing](https://cryptobriefing.com/heyanon-token-triples-equilibra-robinhood-chain/)
  - On 11 Sep 2026 founder Daniele Sesta announced Equilibra, a custom AMM with adaptive fees, testing on Robinhood Chain. ANON roughly tripled. — [Crypto Briefing](https://cryptobriefing.com/heyanon-token-triples-equilibra-robinhood-chain/)
  - ANON had set an all-time low the day before that rally. — [The Defiant](https://thedefiant.io/news/defi/anon-triples-after-sesta-deploys-amm-on-robinhood-chain)
  - Sesta previously created Wonderland and Abracadabra, both of which ended in controversy. — [Crypto Briefing](https://cryptobriefing.com/heyanon-token-triples-equilibra-robinhood-chain/); [rekt.news](https://rekt.news/sifu-scandal/)
  - Token (live data 2026-10-22): $0.261 vs ATH $24.53 on 22 Jan 2025 (−98.9%). Market cap about $4.0M. Total supply 21M, so FDV@ATH ≈ $515M. — [CoinPaprika API](https://api.coinpaprika.com/v1/tickers/anon-heyanon)

- **Griffain (GRIFFAIN, Solana). Product alive; token −98%.**
  - Natural-language on-chain agent for Solana. Features include chat swaps and launch sniping. Freemium pricing. Health "Healthy", 100% uptime over 30 days, 109,519 X followers (page updated 21 Oct 2026). — [MadeOnSol](https://madeonsol.com/compare/griffain-vs-swarms)
  - Built at a 2024 Solana AI hackathon. Users mint a personal agent as an NFT and set limits such as transaction caps and approved protocols. Access was gated by an Early Access Pass or Saga Genesis Token, with an onboarding fee of about 2 SOL. — [Neuronfeed](https://neuronfeed.com/startups/griffain)
  - Token: ATH $0.62487 on 22 Jan 2025; ATL $0.0073 on 24 Feb 2026. — [CoinGecko](https://www.coingecko.com/en/coins/griffain)
  - Live data 2026-10-22: $0.0142, market cap about $14.2M (−97.8%). FDV@ATH ≈ $632M. — [CoinPaprika API](https://api.coinpaprika.com/v1/tickers/griffain-griffain)

- **Orbit (GRIFT), by the SphereOne team. Effectively dead.**
  - **[HISTORICAL]** Claimed swaps, bridges, staking, yield and lending across 116+ chains and 178–200+ protocols. Was in open beta. — [Solana Compass](https://solanacompass.com/projects/orbit); [CoinMarketCap](https://coinmarketcap.com/currencies/orbit-ai/); [The Grid](https://thegrid.id/profiles/Orbit)
  - **[HISTORICAL]** Messari valued it at about $70M in January 2025. — [Investing.com HK repost](https://hk.investing.com/analysis/article-112242)
  - Live data 2026-10-22: $0.000167, market cap about $0.15M, −99.9% from ATH of $0.19 (22 Jan 2025). FDV@ATH ≈ $190M. — [CoinPaprika API](https://api.coinpaprika.com/v1/tickers/grift1-orbit)
  - I found no 2025–2026 product news.

- **Neur (Solana, built on SendAI's Solana Agent Kit). Token dead.**
  - Live data 2026-10-22: $0.00008, market cap about $0.08M, −99.9% from ATH of $0.080 (8 Jan 2025). — [CoinPaprika API](https://api.coinpaprika.com/v1/tickers/neur-neursh)
  - Described as powered by the Sendai Solana Agent Kit. — [Gate Learn](https://www.gate.com/learn/articles/de-fai-is-the-new-de-fi/5689) (the snippet's attribution to this article is uncertain)
  - SendAI itself now appears on DefiLlama only as Hyperliquid builder-code interfaces ("Sendai Perps", "SendAI Spot"). Their fees are close to zero ($48 all-time for Sendai Perps). — [DefiLlama API fees/sendai-perps](https://api.llama.fi/summary/fees/sendai-perps?dataType=dailyFees)

- **Wayfinder (PROMPT), by Parallel Studios / Echelon Prime. Alive; token −97%.**
  - Omnichain agents that do swaps, minting and bridging from natural language. "Wayfinding Paths" are predefined workflows, and a shared knowledge graph acts as collective agent memory. — [MEXC news](https://www.mexc.com/news/parallels-ai-agent-platform-wayfinder-benefiting-from-on-chain-game-agents-and-integrating-defi-multi-scenario-applications/575)
  - **[HISTORICAL]** Was still in closed alpha in 2025. — [MEXC news](https://www.mexc.com/news/parallels-ai-agent-platform-wayfinder-benefiting-from-on-chain-game-agents-and-integrating-defi-multi-scenario-applications/575)
  - A major update was slated for Q1 2026. — [eGamers](https://egamers.io/parallel-studios-unveils-mobile-tcg-and-multiple-early-2026-releases/)
  - Token uses: creating shells (agents), staking on paths (slashable), governance. — [CoinDesk price page](https://www.coindesk.com/price/wayfinder); [CoinMarketCap](https://coinmarketcap.com/currencies/wayfinder/)
  - DefiLlama shows an ATL on 1 Oct 2026. — [DefiLlama token](https://defillama.com/token/PROMPT)
  - Live data 2026-10-22: $0.0169, market cap about $3.8M, −97.3% from ATH of $0.614 (12 Apr 2025). FDV@ATH ≈ $614M. — [CoinPaprika API](https://api.coinpaprika.com/v1/tickers/prompt-wayfinder)

- **Spectral (SPEC; Syntax and the on-chain agent marketplace). Token dead; company still exists.**
  - Bybit delisted SPEC/USDT on 21 Jan 2025 for low volume. — [CoinMarketCap](https://coinmarketcap.com/currencies/spectral/)
  - An explainer from about May 2026 still calls Syntax (natural language to Solidity) the "flagship live product", while noting the 2026 site now centers a broader infrastructure-and-research portfolio. — [Phemex Academy](https://phemex.com/academy/what-is-spectral-spec)
  - Tracxn lists 18 employees as of 31 May 2026. — [Tracxn](https://tracxn.com/d/companies/spectral-labs/__ze4_KSUawEN_T1gn6MlxXnQWtYRqN1Jb_-_rLORok8s)
  - Live data 2026-10-22: $0.0056, market cap about $0.08M, −99.95% from ATH of $11.43 (3 Jan 2025). FDV@ATH ≈ $1.14B. — [CoinPaprika API](https://api.coinpaprika.com/v1/tickers/spec-spectral)

- **Cod3x (CDX). Token near-dead.**
  - Described as a DeFAI ecosystem for building trading agents. — [Gate Learn](https://www.gate.com/learn/articles/de-fai-is-the-new-de-fi/5689) (snippet attribution uncertain)
  - Live data 2026-10-22: $0.0059, market cap about $0.31M, 24h volume about $0, −97.6% from ATH of $0.251 (19 Feb 2025). — [CoinPaprika API](https://api.coinpaprika.com/v1/tickers/cdx-cod3x)

- **Mode Network (MODE). AI pivot failed by market measure.**
  - **[HISTORICAL]** Launched as a DeFi-focused OP-Stack L2. Pivoted to on-chain agent tooling by early 2024 and launched an "AI Agent app store". — [Fraxcesco Substack](https://fraxcesco.substack.com/p/its-never-too-late-to-re-invent-yourself); [Matcha blog, Dec 2024](https://blog.matcha.xyz/article/mode-network)
  - Live data 2026-10-22: $0.000117, market cap about $0.29M, −99.8% from ATH (8 Dec 2024). FDV@ATH ≈ $593M. — [CoinPaprika API](https://api.coinpaprika.com/v1/tickers/mode-mode)
  - Mode canonical bridge TVL about $4.9M. — [DefiLlama API](https://api.llama.fi/protocols)

- **Bankr (BNKR; X/Farcaster/Base). Alive, the strongest consumer survivor.** Details in sections 2–4.
  - BNKR ATH was $0.00121 on 10 Feb 2026, during the 2026 cycle rather than the 2025 one. Live data 2026-10-22: market cap about $31.4M (−74%). — [CoinPaprika API](https://api.coinpaprika.com/v1/tickers/bnkr-bankrcoin)

- **HeyElsa (ELSA). Alive; 2026 token launch.**
  - AI copilot for swaps, bridges and staking, plus B2B widgets and SDKs. Chains: Base, BNB Chain, Solana and other EVM networks. — [CoinMarketCap AI](https://coinmarketcap.com/cmc-ai/heyelsa/what-is/); [BingX](https://bingx.com/ur/learn/article/what-is-heyelsa-elsa-ai-crypto-co-pilot)
  - ELSA spot trading went live on 29 Jan 2026. — [BingX](https://bingx.com/ur/learn/article/what-is-heyelsa-elsa-ai-crypto-co-pilot)
  - Live data 2026-10-22: $0.070, market cap about $16.1M, −68% from ATH of $0.2215 (23 Jan 2026). — [CoinPaprika API](https://api.coinpaprika.com/v1/tickers/elsa-heyelsa)

**Yield and strategy agents (Optimization layer)**

- **Giza / ARMA (GIZA). ARMA wound down; successor not verifiable; token dead.**
  - On 26 Feb 2026 Giza announced the wind-down of ARMA and Pulse, with a migration deadline of 26 Mar 2026. Funds were returned to user wallets.
  - Both products were folded into a unified agent, "Giza World", on Base.
  - Giza World's homepage counters are static. The assets-under-agent counter showed $0 on 23 Sep 2026.
  - — [OwnYourMind review, updated Oct 2026](https://ownyourmind.ai/projects/giza/)
  - Peak versus current figures are in section 3.

- **Almanak (ALMANAK). Collapsed after its token launch.**
  - Product: a no-code platform where a multi-agent AI "swarm" researches, backtests and deploys strategies, tokenized as ERC-7540 vaults. — [OAK Research](https://oakresearch.io/fr/reports/protocols/early-birds-almanak-plateforme-defai-automatiser-yield)
  - Terms of service describe the tools as non-custodial "user-controlled agentic wallets"; the operator is Algo Theory INC. — [Almanak T&C 2026](https://almanak.co/almanak-terms-and-conditions-2026-es.pdf)
  - In early December 2025 the token fell about 80% in a single day after delayed airdrop claims. Almanak cited operational errors and DDoS attacks affecting about 1,100 users. — [MEXC news](https://www.mexc.com/news/263205)
  - TVL went from $171M to $0.27M (section 3).

- **Theoriq (THQ). Alive but small.**
  - AlphaVault launched on 5 Dec 2025. An "Allocator Agent" works inside on-chain "policy cages". Partner strategies include Lido Earn stRATEGY and Chorus One MEV Max.
  - 1% of THQ supply (10M tokens) was set aside to reward bootstrap depositors.
  - — [The Block PR](https://www.theblock.co/amp/post/381576/theoriq-launches-alphavault-with-ai-powered-active-management); [crypto.news](https://crypto.news/interview-theoriq-ai-agents-accountable-yield-machines/)
  - Live data 2026-10-22: THQ at $0.0103, −91% from ATH of $0.119 (16 Dec 2025). — [CoinPaprika API](https://api.coinpaprika.com/v1/tickers/thq-theoriq)

- **ZyFAI (ZFI). Alive; the TVL-retention outlier.**
  - Yield-optimizing agent across Base, Arbitrum, Ethereum, Sonic and Plasma. TVL figures in section 3. — [DefiLlama API](https://api.llama.fi/protocol/zyfai)

- **Mamo (MAMO, Base). Alive, small.**
  - Per-user strategy contract that allocates USDC and cbBTC to Moonwell core markets and Morpho vaults, with auto-compounding. — [Coinranking](https://coinranking.com/coin/VwZmLM6c1+mamo-mamo/about); [DefiLlama API](https://api.llama.fi/protocol/mamo)
  - Live data 2026-10-22: market cap about $2.35M. — [CoinPaprika API](https://api.coinpaprika.com/v1/tickers/mamo-mamo)

- **Autonolas / Olas (OLAS; Pearl app store with Modius, Optimus, BabyDegen, Polystrat). Alive and building; token −99%.**
  - Pearl is a desktop app (macOS, Linux, Windows). Named agents: Polystrat (Polymarket), Omenstrat, BabyDegen (DeFi) and Optimus (multi-strategy). The OwnYourMind review does not mention Modius.
  - No pivot or wind-down reported.
  - Olas added Robinhood Chain in September 2026 via DAO proposal 16.
  - — [OwnYourMind Olas review, updated 7 Oct 2026](https://ownyourmind.ai/projects/autonolas/)
  - **[HISTORICAL]** Modius was the first Pearl agent, trading Balancer and Sturdy on Mode. Optimus added Uniswap across Mode, Base and Optimism. — [Cointelegraph Magazine](https://magazine.cointelegraph.com/?p=40442)
  - An Optimus service deployment on OP Mainnet was registered in the ERC-8004 explorer on 29 Apr 2026. — [QuickNode ERC-8004 explorer](https://erc-8004.quicknode.com/agents/optimism-mainnet/504)

**Frameworks, launchpads and research agents**

- **Virtuals Protocol (VIRTUAL). Alive; the largest surviving agent-token platform.**
  - Market cap about $431M on 19 Oct 2026, about 86–89% below its ATH of 2 Jan 2025.
  - Claims 18,000+ agents created. The reviewer's own census of graduated agents on Base counts about 1,232, of which 85–87% are dead or near-dead.
  - The page names no DeFi-specific agents.
  - — [OwnYourMind Virtuals review, updated 13 Oct 2026](https://ownyourmind.ai/projects/virtuals/)
  - Live data 2026-10-22: $0.653, market cap $423M, −87.2% from ATH of $5.10. — [CoinPaprika API](https://api.coinpaprika.com/v1/tickers/virtual-virtual-protocol)

- **ElizaOS (formerly ai16z). Company wound down; token declared dead by its founder.**
  - 14 Apr 2026: Shaw Walters announced Eliza Labs was winding down. He continues to build the framework.
  - 20 Apr 2026: an SDNY class action was filed (allegations only).
  - 4 Aug 2026: a settlement was announced; Walters said the token was "dead" and the foundation was closing.
  - 12 Oct 2026: Crypto.com delisted the token.
  - GitHub contributors fell from 583 to 355.
  - — [OwnYourMind ElizaOS review, updated 13 Oct 2026](https://ownyourmind.ai/projects/elizaos/)
  - Live data 2026-10-22: market cap about $2.9M. — [CoinPaprika API](https://api.coinpaprika.com/v1/tickers/elizaos-elizaos)

- **aixbt (research agent on Virtuals). Alive as an account; token −98%.**
  - Peak market cap about $500M, with about 458K X followers. — [OwnYourMind Virtuals](https://ownyourmind.ai/projects/virtuals/)
  - ATL $0.0179 on 8 Jul 2026. — [CoinGecko](https://www.coingecko.com/en/coins/aixbt)
  - Live data 2026-10-22: $0.0189, market cap about $16.2M, −98% from ATH of $0.95 (15 Jan 2025). — [CoinPaprika API](https://api.coinpaprika.com/v1/tickers/aixbt-aixbt-by-virtuals)

- **Surf (AI research, not execution). Alive and funded.**
  - Raised $15M on 10 Dec 2025, led by Pantera with Coinbase Ventures and DCG. Over 300K users, about 80% of them outside the crypto industry. Revenue is subscription-based.
  - — [The Block](https://www.theblock.co/amp/post/382082/crypto-ai-four-times-better-chatgpt-grok-raises-15-million-fortune)

- **Cookie DAO (agent data/index layer).** Live data 2026-10-22: market cap about $1.4M, −98.8% from ATH (10 Jan 2025). — [CoinPaprika API](https://api.coinpaprika.com/v1/tickers/cookie-cookie)

**Notable 2025–2026 entrants**

- **Senpi.** Personal trading agent for Hyperliquid, launched 24 Feb 2026, built on OpenClaw, used through Telegram. — [The Defiant PR](https://thedefiant.io/news/press-releases/senpi-launches-the-first-personal-trading-agents-for-hyperliquid)
- **Minara AI.** "Personal AI CFO", backed by Circle. It is a Hyperliquid builder-code interface that routes perps to Hyperliquid or Lighter and spot trades across BSC, Solana, Ethereum, Base, Arbitrum, Optimism, Polygon and Avalanche. — [DefiLlama](https://defillama.com/protocol/minara-ai-perps); [Alchemy dApp store](https://www.alchemy.com/dapps/minara-ai)
- **INFINIT (IN).** Marketplace for AI-managed trading vaults on Hyperliquid perps (stocks, commodities, indices, crypto). Raised a $6M seed in Sep 2024. — [DefiLlama API](https://api.llama.fi/protocol/infinit)
- **Krystal Auto-Farm Vault.** Privately owned vault where an AI agent provides liquidity, rebalances, harvests and compounds. Chains include Base, BNB, Arbitrum, Robinhood Chain, Ethereum and Solana. — [DefiLlama API](https://api.llama.fi/protocol/krystal-auto-farm-vault)

**Incumbent agent-wallet launches (2026). The biggest structural change.**

- **Coinbase Agentic Wallets** (11 Feb 2026), built on x402 and AgentKit. — [The Block](https://www.theblock.co/post/389524/coinbase-rolls-out-ai-tool-to-give-any-agent-a-wallet)
- **OKX Agentic Wallet** (18 Mar 2026), part of Onchain OS. — [OKX help center](https://www.okx.com/en-us/help/okx-wallet-officially-launches-agentic-wallet)
- **Trust Wallet AI trading agent** feature (March 2026), offered to about 220M users. — [MEXC/PANews citing Forbes](https://www.mexc.com/news/983936) (seen via search summary only)
- **MetaMask Agent Wallet** (8 Jun 2026, early access). — [CoinDesk](https://www.coindesk.com/tech/2026/06/08/metamask-launches-ai-agent-wallet-with-built-in-security-for-crypto-trades)
- **Base MCP** (May 2026) connects AI agents to wallets and lists Aerodrome, Bankr and Virtuals as integrated protocols. — [CoinMarketCap Academy](https://coinmarketcap.com/academy/article/base-mcp-ai-crypto-wallets)
- **Meta's Muse** personal agent launched 8 Sep 2026. Muse agents can get wallets via Bankr's public plugin. — [Chainwire, 17 Sep 2026](https://chainwire.org/2026/09/17/bankr-enables-crypto-wallets-and-onchain-financial-activity-for-muse-agents/)
- **OpenClaw wave (Feb 2026).** OneKey framed a "Base AI Season" that included Moltbook, an agent-only social network. OpenClaw reportedly passed 100K GitHub stars within weeks. — [OneKey blog, 4 Feb 2026](https://onekey.so/blog/ecosystem/base-ai-season-is-here-mapping-the-openclaw-agentic-ecosystem-on-base-20260204133326)

### Inferences
Status matrix as of October 2026. This is my classification from the findings above.

| Product | Category | Status Oct 2026 | Token vs ATH |
|---|---|---|---|
| Bankr | Social/X chat agent + agent wallet infra | **Alive, pivoted toward agent infrastructure** (wallets for OpenClaw/Muse agents, token launchpad) | −74% (ATH Feb 2026) |
| Virtuals | Agent launchpad | Alive; large but fees down about 97% from peak | −87% |
| Minara AI | AI perps/spot "CFO" | **Alive, steady revenue** | no token found |
| Senpi | Hyperliquid agent (Telegram) | Alive, but usage fell about 90% after Feb 2026 launch peak | no token (points) |
| ZyFAI | Yield agent | **Alive, TVL retained** | −90% |
| Olas/Pearl | Autonomous agent app store | Alive, small (a few hundred daily active agents) | −99.4% |
| HeyElsa | Chat copilot + B2B | Alive | −68% |
| Griffain | Solana chat agent | Alive (healthy uptime), little traction data | −97.8% |
| Wayfinder | Omnichain agents | Alive, low visibility | −97.3% |
| Theoriq | AI vault | Alive, TVL −96% from peak | −91% |
| INFINIT | AI perp vault marketplace | Alive, small | −92% |
| Mamo | Yield agent | Alive, small | n/a |
| HeyAnon | Chat DeFi agent | **Pivoted** to AMM/DAO-merger plays on Robinhood Chain | −98.9% |
| Giza ARMA | Yield agent | **Dead** (wound down Feb–Mar 2026) | −99.9% |
| Almanak | Agent vault platform | **Effectively dead** (TVL −99.8%) | price ≈ $0.0015 |
| ElizaOS / ai16z | Framework | **Company dead**, open-source framework continues | −99%+ |
| Spectral | Agent marketplace / Syntax | Zombie (token −99.95%, small team) | −99.95% |
| Orbit (GRIFT), Neur, Cod3x, Mode | Chat agents / AI L2 | **Dead or zombie by market measure** | −97.6% to −99.9% |
| aixbt | Research agent | Alive as an account, token −98% | −98% |
| Surf | Research AI | **Alive, VC-funded, subscription revenue** | no token |

- The "chat-to-swap" abstraction layer is being commoditized by wallets (Coinbase, OKX, MetaMask, Trust Wallet) and by general-purpose agents (Meta Muse, OpenClaw). A new standalone chat bot needs a different wedge: distribution, a proprietary strategy, or safety.
- The 2026 hype venues are Base (OpenClaw/x402), Hyperliquid (builder codes for AI trading UIs) and Robinhood Chain (tokenized stocks; HeyAnon, Bankr, Olas, Krystal and Virtuals all deployed there).

### Gaps
- **Brian AI, Slate, Fungi, Lyra.** The search budget ran out before I could research them. I found no 2026 status, traction or token data. The CoinPaprika "fungi-fungi" token (ATH Apr 2024) is probably not the Fungi DeFi agent, so I did not use it.
- **"Lyra/Hyperliquid AI agents".** I could not identify which product the brief means. Lyra (the options protocol) rebranded earlier. Senpi, Minara, INFINIT and SendAI are the Hyperliquid AI front-ends I found.
- **Griffain, HeyAnon, Wayfinder.** No verified 2026 user, volume or AUM numbers. The DexTools claim of "1M+ automated transactions" for Griffain is unverified SEO content. — [DexTools](https://www.dextools.io/tutorials/what-is-griffain-solana-ai-agent-guide-2026-ja)
- **Giza World.** I could not verify whether the successor product has any real usage.
- **Sector market cap for October 2026.** A search summary reported Grayscale's AI crypto sector up 54% in September 2026 (led by NEAR, Venice, World and Bittensor, not DeFAI tokens). I could not confirm the primary source, so treat it as unverified.

---

## 2. Core features, chains, custody model and interface

### Takeaway
The market has converged on four interface archetypes:
1. social-native bots that reply on X or Farcaster (Bankr, aixbt);
2. Telegram or chat copilots (Senpi, HeyElsa, Griffain, HeyAnon);
3. deposit-and-forget yield vaults or smart accounts (ARMA, ZyFAI, Mamo, Almanak, Theoriq);
4. agent-wallet infrastructure for other agents (Coinbase, OKX, MetaMask, Bankr).

Custody has standardized on four patterns: non-custodial smart accounts with scoped session keys, keys held in TEEs or enclaves, Safe multisigs, and on-chain "policy cages" or spend limits.

### Cited Findings

**Bankr**
- Each agent gets a cross-chain wallet for trading, deploying contracts and managing DeFi positions, with gas covered. — [Bankr docs](https://docs.bankr.bot/)
- Bankr runs a token launchpad where trading fees from launched tokens fund the agent's compute ("Build an AI agent. Launch a token. Trading fees pay for your compute."). — [Bankr docs](https://docs.bankr.bot/)
- Chains: Base, Ethereum, Polygon, Unichain, World Chain, Arbitrum, BNB Chain, Robinhood Chain, Arc, Solana, Hyperliquid. — [Bankr docs](https://docs.bankr.bot/)
- Interfaces: Agent API (REST), CLI, a "Bankr skill" for agents, Claude Code plugins, x402 Cloud paid endpoints, and an OpenAI-compatible LLM Gateway. Community channels are X, Warpcast, Telegram and Discord. — [Bankr docs](https://docs.bankr.bot/)
- On X, Bankr creates a Base wallet the first time a user interacts with it, and trades run from natural-language replies. — [Push.org](https://push.org/blog/exploring-cryptos-top-agentic-ecosystems-in-2026-base/)
- Bankr agent wallets got IP whitelisting in February 2026, and an LLM gateway in beta lets agents pay their own API costs from their wallets. — [AI on Base, X post](https://x.com/AIonBase_/status/2022347535613108517) (secondary roundup)
- 28 Aug 2026: Bankr launched agent-managed liquidity for tokenized stocks on Aerodrome, with continuous rebalancing while users keep control of positions. — [Yellow PR](https://yellow.com/press-releases/bankr-launches-agent-powered-liquidity-for-tokenized-stocks-on-aerodrome)
- Muse agents connected through Bankr can trade crypto and tokenized stocks, transfer funds, launch tokens, access Polymarket and run automated portfolio strategies. — [Chainwire](https://chainwire.org/2026/09/17/bankr-enables-crypto-wallets-and-onchain-financial-activity-for-muse-agents/)
- Founder quote: "An agent without a wallet can research a trade. An agent with one can make it." — [Chainwire](https://chainwire.org/2026/09/17/bankr-enables-crypto-wallets-and-onchain-financial-activity-for-muse-agents/)
- The docs do not state the custody model or wallet provider. — [Bankr docs](https://docs.bankr.bot/)
- Holding a "Bankr Club Membership NFT" granted "Executive" permissions that bypassed standard transfer and swap limits. This was the escalation path in the May 2026 exploit (section 4). — [Giskard](https://giskard.ai/knowledge/how-grok-got-prompt-injected-an-x-user-drained-150-000-from-an-ai-wallet)

**Giza ARMA**
- Non-custodial ERC-4337 smart accounts. Users grant time-bound session keys limited by value, target contracts and expiry, and can revoke them on-chain. — [Abstract Horizon, 21 Jan 2026](https://www.abstracthorizon.xyz/en/article/giza-agents)
- Verification uses zkML through the LuminAIR framework. — [Abstract Horizon, 21 Jan 2026](https://www.abstracthorizon.xyz/en/article/giza-agents)
- The optimizer runs off-chain on Giza-hosted endpoints, which means Giza could refuse service to specific wallets. — [OwnYourMind Giza](https://ownyourmind.ai/projects/giza/)
- Chains: Base (primary), Ethereum and Arbitrum. The DefiLlama adapter also covers Plasma and HyperEVM. — [OwnYourMind Giza](https://ownyourmind.ai/projects/giza/)
- Protocols: Aave, Morpho and Pendle. Pulse automated staked-ETH deployment into Pendle. — [Abstract Horizon](https://www.abstracthorizon.xyz/en/article/giza-agents); [OwnYourMind](https://ownyourmind.ai/projects/giza/)

**Olas**
- Agent services run on Safe multisig wallets with Tendermint for off-chain coordination. Pearl runs agents locally, and operators hold their own keys ("own, don't rent"). — [OwnYourMind Olas](https://ownyourmind.ai/projects/autonolas/)
- Chains: Ethereum, Gnosis (where most activity happens), Polygon, Solana, Arbitrum, Optimism, Base, Celo, Mode, Robinhood Chain. — [OwnYourMind Olas](https://ownyourmind.ai/projects/autonolas/)
- Polystrat uses Safe accounts. The agent can trade but cannot withdraw to external wallets. — [Coincub](https://coincub.com/blog/best-ai-crypto-agents/)

**Theoriq**
- On-chain "policy cages" keep the Allocator Agent within set risk parameters. — [The Block PR](https://www.theblock.co/amp/post/381576/theoriq-launches-alphavault-with-ai-powered-active-management)
- Agents must stake sTHQ, and stakes are slashable for misbehavior or failure. — [crypto.news](https://crypto.news/interview-theoriq-ai-agents-accountable-yield-machines/)
- AlphaVault ETH is a vault-of-vaults that deploys into Pendle fixed-yield and Aave leveraged looping. — [DefiLlama API](https://api.llama.fi/protocol/theoriq-alphavault-eth)

**Almanak**
- ERC-7540 tokenized vaults with "user-controlled agentic wallets", operated by Algo Theory INC. — [OAK Research](https://oakresearch.io/fr/reports/protocols/early-birds-almanak-plateforme-defai-automatiser-yield); [Almanak T&C](https://almanak.co/almanak-terms-and-conditions-2026-es.pdf)
- Investors include Delphi Labs, HashKey Capital, NEAR Foundation and Bankless VC. — [Coinranking](https://coinranking.com/coin/Dknn2qR8O+almanak-almanak/about)

**Senpi**
- Telegram interface. Each agent ships with 31 tools in eight categories: trader discovery, momentum, strategy management, execution, preview, market data, portfolio analytics and audit logs. Agents have persistent memory and learn the user's risk profile. — [The Defiant PR](https://thedefiant.io/news/press-releases/senpi-launches-the-first-personal-trading-agents-for-hyperliquid)
- Two modes. Co-pilot: analyze, summarize, place trades, explain them, and send proactive alerts. Autonomous: trades 24/7 with leverage management and dynamic stops. Users can also mirror proven traders. — [The Defiant PR](https://thedefiant.io/news/press-releases/senpi-launches-the-first-personal-trading-agents-for-hyperliquid)
- "No wallets to manage, no private keys"; custody is not specified. The company claims a first live trade in under two minutes. — [The Defiant PR](https://thedefiant.io/news/press-releases/senpi-launches-the-first-personal-trading-agents-for-hyperliquid)
- Skills and strategy templates are open-sourced under MIT. — [GitHub senpi-skills](https://github.com/Senpi-ai/senpi-skills)
- A Railway deploy page lists 58 tools. — [Railway](https://railway.com/deploy/senpi-openclaw)
- Senpi runs an "Arena" where agents compete for cash prizes, and a points program with no token yet. — [AirdropAlert](https://airdropalert.com/airdrops/senpi-ai-hyperliquid-trading-agents/)

**HeyElsa**
- Consumer copilot plus B2B widgets and SDKs. Uses Zerion's API for positions data. Runs x402 offerings. — [CoinMarketCap AI](https://coinmarketcap.com/cmc-ai/heyelsa/what-is/); [Zerion](https://www.zerion.io/api-clients-ai-agents)

**Griffain**
- Each personal agent is an NFT with user-set limits (transaction caps, approved protocols). — [Neuronfeed](https://neuronfeed.com/startups/griffain)
- Agent types include "Agent Sniper" and "Agent GM". Protocols listed: Marinade, Raydium, Orca. — [DexTools](https://www.dextools.io/tutorials/what-is-griffain-solana-ai-agent-guide-2026-ja)

**Incumbent agent wallets (2026)**
- **Coinbase Agentic Wallets** (11 Feb 2026):
  - Private keys stay in Coinbase infrastructure and are "never exposed to the agent's prompt or LLM".
  - Programmable spending limits and session caps.
  - Gasless on Base. EVM and Solana.
  - CLI and an open agent-wallet-skills repo.
  - Builds on AgentKit and x402.
  — [The Block](https://www.theblock.co/post/389524/coinbase-rolls-out-ai-tool-to-give-any-agent-a-wallet)
- **OKX Agentic Wallet** (18 Mar 2026): keys in a TEE; natural-language execution across about 20 networks; gas-free on X Layer; risk assessment before every transaction. — [OKX](https://www.okx.com/en-us/help/okx-wallet-officially-launches-agentic-wallet)
- **MetaMask Agent Wallet** (8 Jun 2026):
  - Self-custodial.
  - Every agent transaction gets simulation, threat scanning and MEV protection. Malicious-flagged transactions need two-factor approval.
  - Default "Guard Mode" enforces spend limits, protocol allowlists and approvals. Opt-in "Beast Mode" shows fewer prompts.
  - Safe-rated transactions are covered for up to $10K in losses.
  - Scope: swaps, perps, prediction markets and LP across EVM chains.
  — [CoinDesk](https://www.coindesk.com/tech/2026/06/08/metamask-launches-ai-agent-wallet-with-built-in-security-for-crypto-trades)
  - Another outlet reports a 6 Aug 2026 launch and Hyperliquid support, which conflicts with CoinDesk. — [Crowdfund Insider](https://www.crowdfundinsider.com/2026/08/295471-metamask-introduces-self-custodial-ai-agent-wallet-for-secure-onchain-trading/)
- **x402** (Coinbase): agent payment protocol. V2 shipped December 2025. Cloudflare and Coinbase launched the x402 Foundation in September 2025. — [The Block](https://www.theblock.co/post/389524/coinbase-rolls-out-ai-tool-to-give-any-agent-a-wallet)

### Inferences
- **Feature table** (✓ = documented in the sources above).

| Product | Chat swap/bridge | Yield optimisation | Autonomous rebalancing | Perps trading | Agent-to-agent / for other agents | Strategy marketplace | Interface | Custody |
|---|---|---|---|---|---|---|---|---|
| Bankr | ✓ | – | ✓ (tokenized-stock LP) | ✓ (Hyperliquid chain) | ✓ (wallets for Muse/OpenClaw agents) | skills marketplace | X, Farcaster, TG, API, CLI | managed agent wallets (unspecified) |
| Senpi | ✓ | – | – | ✓ | – | strategy templates, copy-trading | Telegram | managed auth (unspecified) |
| Minara | ✓ | – | – | ✓ | – | – | web/app | n/a |
| Giza ARMA (dead) | – | ✓ | ✓ | – | – | – | web | ERC-4337 + session keys |
| ZyFAI / Mamo | – | ✓ | ✓ | – | – | – | web | smart accounts / per-user contract |
| Theoriq | – | ✓ | ✓ | – | multi-agent swarm | agents staked with THQ | web | policy cages |
| Almanak | – | ✓ | ✓ | – | multi-agent swarm | ERC-7540 vault curators | web | agentic wallets |
| INFINIT | – | – | – | ✓ (HL vaults) | – | ✓ (strategy-manager vaults) | web | vault |
| Olas Pearl | – | ✓ | ✓ | prediction markets | ✓ (Mech marketplace) | ✓ (agent app store) | desktop app | Safe multisig, local keys |
| Griffain / HeyAnon / HeyElsa / Wayfinder | ✓ | partial | partial | – | – | Wayfinder Paths | web/TG | various |

- For a new assistant, baseline user expectations now look like MetaMask's model: simulation, allowlists, spend caps, a 2FA gate for risky transactions, and loss coverage. Without equivalent guardrails a consumer bot will look unsafe next to the incumbents.

### Gaps
- Exact custody models for Bankr (Privy or MPC?), Senpi, HeyAnon and Griffain are not documented in the sources I could reach.
- Chain lists for HeyAnon beyond Robinhood Chain are only described as "multiple networks".

---

## 3. Traction: users, TVL under agents, volume, token caps (peak vs now), funding

### Takeaway
Real, durable traction is thin. The whole DefiLlama "AI Agents" TVL category is about $31M (Oct 2026). Yield-agent TVL peaks were incentive-driven and evaporated: Almanak went from $171M to $0.27M, Giza from $45.6M to $13K, Theoriq from $5.1M to $0.18M. The only sizable recurring revenue comes from:
- **Bankr**: about $40M all-time fees, mostly from token-launch activity rather than the AI itself;
- **Virtuals**: about $75M all-time fees, but down about 97% from its Jan 2025 peak;
- **Minara**: a steady $155–186K a month in Hyperliquid builder fees.

### Cited Findings

**TVL / assets under agents (live data 2026-10-22 unless noted)**
- **Almanak**: TVL peaked at **$171.1M on 11 Oct 2025**; now **$0.266M** (−99.8%). DefiLlama lists public token sales of $8.45M (15 Aug 2025) and $2.5M (29 Aug 2025). — [DefiLlama API](https://api.llama.fi/protocol/almanak)
  - A December 2025 article reported TVL above $120M. — [MEXC news](https://www.mexc.com/news/263205)
  - Market cap about $0.41M per DefiLlama. — [DefiLlama API /protocols](https://api.llama.fi/protocols)
- **Giza**: DefiLlama TVL peaked at **$45.6M on 20 Jan 2026**; now **$13K**. — [DefiLlama API](https://api.llama.fi/protocol/giza)
  - ARMA had about $19M AUM and over $4B in agent trading volume. — [Odaily/DWF, Apr 2026](https://www.odaily.news/en/post/5210341)
  - $1.5B routed in six months; ARMA at $20M AUA (the same article also cites $12M); Pulse hit its $3M cap in 3 hours. — [Abstract Horizon, 21 Jan 2026](https://www.abstracthorizon.xyz/en/article/giza-agents)
  - **[HISTORICAL]** $5.4M volume from about $930K deployed over four weeks on Base. — [Giza Medium](https://medium.com/@gizatech/agentic-acceleration-how-giza-agents-generated-5-4m-volume-for-base-in-four-weeks-f241d9549b3b)
- **Theoriq AlphaVault ETH**: TVL peaked at **$5.1M on 12 Mar 2026**; now **$0.179M**. Gold Vault: $0.118M. — [DefiLlama API](https://api.llama.fi/protocol/theoriq-alphavault-eth)
  - Pre-launch simulation: 2.1M wallets and 65M AI requests. — [crypto.news](https://crypto.news/interview-theoriq-ai-agents-accountable-yield-machines/)
- **ZyFAI**: TVL peaked at **$11.57M on 31 Jan 2026**; now **$10.51M**. All-time fees about $94K; last 30 days about $5.5K. — [DefiLlama API TVL](https://api.llama.fi/protocol/zyfai); [DefiLlama API fees](https://api.llama.fi/summary/fees/zyfai?dataType=dailyFees)
  - ZFI token: market cap about $0.46M, −90% from ATH (Aug 2025). — [CoinPaprika API](https://api.coinpaprika.com/v1/tickers/zfi-zyfai)
- **Krystal Auto-Farm Vault**: peaked at $1.45M (27 Oct 2025); now $0.59M. — [DefiLlama API](https://api.llama.fi/protocol/krystal-auto-farm-vault)
- **INFINIT**: TVL $0.55M. IN token: market cap about $6.2M, −92% from ATH of $0.3475 (30 Jun 2026). — [DefiLlama API](https://api.llama.fi/protocol/infinit); [CoinPaprika API](https://api.coinpaprika.com/v1/tickers/in-infinit)
- **Agent-held LP TVL** across the sector exceeds $39M, excluding vault-routed capital (DWF, Apr 2026). — [Odaily/DWF](https://www.odaily.news/en/post/5210341)

**Fees / revenue (DefiLlama, live data 2026-10-22)**
- **Bankr**:
  - All-time fees about **$40.4M**; last 30 days about $1.69M.
  - Monthly: Jan 2026 $5.75M; Feb 2026 **$11.34M** (peak); Mar $1.60M; Apr $1.11M; May $8.56M; Jun $2.71M; Jul $2.81M; Aug $1.65M; Sep $3.45M.
  - **[HISTORICAL]** Sep–Dec 2025 were all below $0.23M per month.
  — [DefiLlama API fees/bankr](https://api.llama.fi/summary/fees/bankr?dataType=dailyFees)
  - Q1 2026 gross protocol revenue about $18.17M, mostly Clanker fees. Q2 2026 about $11.2M, mostly Doppler fees. Holder revenue is $0, and the revenue split is unclear. — [DefiLlama Bankr page via search snippet](https://defillama.com/protocol/bankr)
  - Related: Clanker, the token launchpad Bankr routes through, has about $92.6M all-time fees; its peak month was Feb 2026 at $22.4M. — [DefiLlama API fees/clanker](https://api.llama.fi/summary/fees/clanker?dataType=dailyFees)
- **Virtuals**:
  - All-time fees about **$74.7M**. Peak month was **Jan 2025 at $16.6M**. Sep 2026 was $0.62M; the last 30 days were about $0.38M. — [DefiLlama API fees](https://api.llama.fi/summary/fees/virtuals-protocol?dataType=dailyFees)
  - Daily fees peaked above $1M in January 2025 and fell about 97% within two months. Trailing-12-month revenue is $4.6M. — [OwnYourMind Virtuals](https://ownyourmind.ai/projects/virtuals/)
  - Virtuals' self-reported 2025 "aGDP" was above $470M, which counts trading turnover. EconomyOS (16 May 2026) reported about 17K agents, $479M aGDP and 1.77M jobs. — [OwnYourMind Virtuals](https://ownyourmind.ai/projects/virtuals/)
- **Minara AI Perps** (Hyperliquid builder):
  - All-time fees about **$1.39M**, steady at **$155–186K per month from Feb to Sep 2026**. — [DefiLlama API](https://api.llama.fi/summary/fees/minara-ai-perps?dataType=dailyFees)
  - Cumulative perp volume about $2.4B; 30-day volume about $449M. — [DefiLlama page](https://defillama.com/protocol/minara-ai-perps)
- **Senpi Perps** (builder fees):
  - All-time about $178K. Peak month **Feb 2026 at $50.0K**, falling to **$3.2–5.5K per month in Jul–Oct 2026**. — [DefiLlama API](https://api.llama.fi/summary/fees/senpi-perps?dataType=dailyFees)
  - Company-reported: more than $100M in trading volume since January 2026 (as of the Feb 2026 PR), and a claimed 40% user win rate over 30 days. — [The Defiant PR](https://thedefiant.io/news/press-releases/senpi-launches-the-first-personal-trading-agents-for-hyperliquid)
- **Almanak** fees: all-time about $2.10M. Peak month Oct 2025 at $823K, then about $1.5K per month by mid-2026 and about $0.3K so far in October 2026. — [DefiLlama API](https://api.llama.fi/summary/fees/almanak?dataType=dailyFees)
- **Giza** fees: all-time about $127.5K. Zero in the trailing 30 days. — [DefiLlama API](https://api.llama.fi/summary/fees/giza?dataType=dailyFees); [OwnYourMind](https://ownyourmind.ai/projects/giza/)
- **Mamo** fees: all-time about $9.45M. Peak month Oct 2025 at $3.02M; Sep 2026 $0.32M. — [DefiLlama API](https://api.llama.fi/summary/fees/mamo?dataType=dailyFees). I don't know how DefiLlama defines these fees; they may include token or launch fees, not just yield fees.
- **Olas**:
  - Lifetime Mech Marketplace turnover about $110K.
  - Revenue is described as "almost entirely emission-dependent".
  - The Mech fee burn mechanism has never actually burned OLAS.
  — [OwnYourMind Olas](https://ownyourmind.ai/projects/autonolas/)

**Users / activity**
- **Olas**: 449 daily active agents (7-day average). Other dated readings: 351 on 24 Sep 2026, and 600+ earlier in 2026. About 20.9M total agent transactions, of which about 14.8M are agent-to-agent (self-reported). — [OwnYourMind Olas](https://ownyourmind.ai/projects/autonolas/)
  - **[HISTORICAL]** Feb 2025: 3.5M transactions across 9 chains, 700K per month, growing 30% month over month. — [The Block](https://www.theblock.co/post/338713/olas-raises-13-8-million-to-launch-pearl-an-app-store-for-autonomous-ai-agents-in-crypto)
- **HeyElsa** (self-reported, January 2026): 18.7M prompts, $439M transaction volume, 931K wallets created. — [BingX](https://bingx.com/ur/learn/article/what-is-heyelsa-elsa-ai-crypto-co-pilot)
- **Bankr**: about 232K BNKR token holders on 16 Jul 2026. That counts token holders, not bot users. — [Phantom](https://phantom.com/tokens/base/0x22af33fe49fd1fa80c7149773dde5890d3c76f3b)
  - "Usage grew 12x since Q3 2025" (metric unspecified). — [Zerion blog](https://zerion.io/blog/build-best-ai-crypto-agent/) (via search summary)
- **Surf**: more than 300K users as of Dec 2025. — [The Block](https://www.theblock.co/amp/post/382082/crypto-ai-four-times-better-chatgpt-grok-raises-15-million-fortune)
  - Company claims: "millions in ARR", more than 1M research reports, 50% month-over-month growth. — [DL News PR](https://www.dlnews.com/external/surf-raises-15m-to-scale-the-first-ai-model-purpose-built-for-digital-assets/)
- **Virtuals**: 18,000+ agents claimed; about 1,232 graduated agents on Base, 85–87% of them dead; only 3–6 trade above $1M in 30 days. — [OwnYourMind Virtuals](https://ownyourmind.ai/projects/virtuals/)
- **Coinbase x402 / agent wallets**:
  - 50M x402 transactions as of February 2026. — [The Block](https://www.theblock.co/post/389524/coinbase-rolls-out-ai-tool-to-give-any-agent-a-wallet)
  - About 69K active agents and 165M payments totalling about $50M by late April 2026, which averages about $0.30 per payment. CoinDesk (March 2026) reported that demand "was not yet there". — [Banxa](https://banxa.com/learn/crypto-basics/can-ai-agents-buy-crypto)
  - Another report gives 169M transactions worth $50.3M. — [Ecosistema Startup](https://ecosistemastartup.com/coinbase-x402-14m-pagos-de-agentes-ia-en-30-dias/)

**Token market caps: peak vs now** (live data 2026-10-22 from the [CoinPaprika API](https://api.coinpaprika.com/v1/tickers/); FDV@ATH is my calculation)

| Token | ATH (date) | FDV@ATH proxy | Mcap now | From ATH |
|---|---|---|---|---|
| VIRTUAL | $5.10 (2 Jan 2025) | ~$5.1B | $423M | −87.2% |
| AIXBT | $0.95 (15 Jan 2025) | ~$950M (reported peak mcap ~$500M per [OwnYourMind](https://ownyourmind.ai/projects/virtuals/)) | $16.2M | −98.0% |
| SPEC | $11.43 (3 Jan 2025) | ~$1.14B | $0.08M | −99.95% |
| GRIFFAIN | $0.632 (22 Jan 2025) | ~$632M | $14.2M | −97.8% |
| PROMPT | $0.614 (12 Apr 2025) | ~$614M | $3.8M | −97.3% |
| MODE | $0.059 (8 Dec 2024) | ~$593M | $0.29M | −99.8% |
| ANON | $24.53 (22 Jan 2025) | ~$515M | $4.0M | −98.9% |
| GIZA | $0.491 (8 Jun 2025) | ~$491M | ~$0.1M ([OwnYourMind](https://ownyourmind.ai/projects/giza/)) | −99.9% |
| INFINIT (IN) | $0.3475 (30 Jun 2026) | ~$347M | $6.2M | −92.2% |
| ELSA | $0.2215 (23 Jan 2026) | ~$221M | $16.1M | −68.3% |
| GRIFT (Orbit) | $0.190 (22 Jan 2025) | ~$190M | $0.15M | −99.9% |
| BNKR | $0.00121 (10 Feb 2026) | ~$121M | $31.4M | −74.0% |
| THQ | $0.119 (16 Dec 2025) | ~$119M | n/a (price $0.0103) | −91.3% |
| NEUR | $0.080 (8 Jan 2025) | ~$80M | $0.08M | −99.9% |
| ZFI | $0.060 (12 Aug 2025) | ~$30M | $0.46M | −90.2% |
| CDX | $0.251 (19 Feb 2025) | ~$13M | $0.31M | −97.6% |
| OLAS | $8.51 (3 Jan 2024) | n/a | $9.6M (Paprika) vs $16.4M ([OwnYourMind, 19 Oct](https://ownyourmind.ai/projects/autonolas/)) | −99.4% |
| ELIZAOS | $0.0140 post-swap (12 Nov 2025); ai16z $2.45 (2 Jan 2025) | n/a | $2.9M | −97% post-swap; >99% adjusted |
| COOKIE | $0.760 (10 Jan 2025) | n/a | $1.4M | −98.8% |

- The CoinPaprika ATH for MAMO ($0.398 on 27 Aug 2026, against a current price of $0.0068) looks like a data glitch, so I left it out. — [CoinPaprika API](https://api.coinpaprika.com/v1/tickers/mamo-mamo)
- The two Olas market caps differ because of different circulating-supply figures (CoinGecko shows 299.5M circulating). — [OwnYourMind Olas](https://ownyourmind.ai/projects/autonolas/)

**Funding**
- **Olas**: about $18.4M total, including a $13.8M OTC round in February 2025 led by 1kx. — [OwnYourMind Olas](https://ownyourmind.ai/projects/autonolas/); [The Block](https://www.theblock.co/post/338713/olas-raises-13-8-million-to-launch-pearl-an-app-store-for-autonomous-ai-agents-in-crypto)
- **Giza**: $8.2M total. Pre-seed $3M (Jul 2023, CoinFund). A $5.2M round in May 2025 (CoinFund, Arrington, Base Ecosystem Fund). — [OwnYourMind Giza](https://ownyourmind.ai/projects/giza/)
  - DefiLlama lists that 2025 round as $2.2M, which conflicts. — [DefiLlama API](https://api.llama.fi/protocol/giza)
- **Surf**: $15M (Dec 2025; Pantera, Coinbase Ventures, DCG). — [The Block](https://www.theblock.co/amp/post/382082/crypto-ai-four-times-better-chatgpt-grok-raises-15-million-fortune)
- **Senpi**: $4.5M seed (Sep 2025; led by Lemniscap with the Coinbase Ventures Base Ecosystem Fund). — [The Defiant PR](https://thedefiant.io/news/press-releases/senpi-launches-the-first-personal-trading-agents-for-hyperliquid)
- **Almanak**: about $10.95M in public token sales (Aug 2025). — [DefiLlama API](https://api.llama.fi/protocol/almanak)
- **INFINIT**: $6M seed (Sep 2024). — [DefiLlama API](https://api.llama.fi/protocol/infinit)
- **HeyElsa**: backed by M31 Capital and Coinbase Ventures; amount unknown. — [HeyElsa X profile mirror](https://nitter-canary.kareem.one/HeyElsaAI/articles)
- **Orbio** (Robinhood Chain AI-inference project): $1.2M seed. — [Bloomingbit](https://en.bloomingbit.io/feed/news/121949)

### Inferences
- Peak "TVL under agents" for every yield-agent brand tracked here coincided with points or airdrop farming. Almanak's peak came in Oct 2025, before its TGE. Giza's came in Jan 2026, around Season-2 points. Theoriq's came during its THQ bootstrap. Each fell 96–99.9% within months. ZyFAI is the only one that kept about 90% of its peak TVL.
- Bankr's fee spikes (Feb 2026 at $11.3M, May 2026 at $8.6M) line up with the OpenClaw "Base AI season" and with token-launch frenzies. That makes Bankr's revenue engine "AI-assisted token launching and trading". A pure DeFi assistant should not count on comparable fees without a similar viral or launchpad loop.
- Minara is the clearest example of steady, utility-driven DeFAI revenue in 2026: a flat $155–186K a month, no token, Circle backing, and builder-code monetization on Hyperliquid.

### Gaps
- No verified user counts for Bankr, Griffain, HeyAnon or Wayfinder.
- No official October 2026 metrics for HeyElsa or Senpi.
- Exact historical peak market caps (as opposed to my FDV@ATH proxies) were not available from primary sources for most tokens.
- Minara's funding amount is not documented.

---

## 4. What worked and what failed

### Takeaway
**Failed:**
- token-first launches whose valuation was far ahead of usage (the 2024–25 "AI agent memecoin" cycle);
- incentive-rented TVL (points into TGE);
- thin wrappers over a single LLM with no proprietary edge;
- unsafe permissioning (the Grok/Bankr exploit).

**Worked, to a degree:**
- products that monetize real flow: Bankr's launchpad fees, Minara's builder fees, Surf's subscriptions;
- conservative yield agents with measurable uplift that do not depend on token emissions (ZyFAI's TVL retention; ARMA's 2025 APY uplift, which still did not survive);
- infrastructure plays riding incumbent distribution (Bankr inside Muse, OpenClaw and Base MCP).

### Cited Findings

**Why the 2024–25 agent tokens collapsed** (evidence, partly **[HISTORICAL]**)
- Virtuals' daily fees peaked above $1M in January 2025 and fell about 97% within two months. Of the graduated agents on Base, 85–87% are dead or near-dead. — [OwnYourMind Virtuals](https://ownyourmind.ai/projects/virtuals/)
- ElizaOS:
  - A 1:6 token migration in November 2025 expanded supply from about 6.6B to 11B and gave 15% to SAFT investors and 10% to the team. These allocations were not in the original fair launch.
  - A class action alleged that the "Marc AIndreessen" agent was human-operated, alleged insider sales, and alleged the name was used to impersonate a16z.
  - The founder later declared the token dead.
  — [OwnYourMind ElizaOS](https://ownyourmind.ai/projects/elizaos/)
- Olas revenue is "almost entirely emission-dependent". Its fee-burn mechanism has never burned a token. Revenue sustainability scored 5/25. — [OwnYourMind Olas](https://ownyourmind.ai/projects/autonolas/)
- Spectral was delisted from Bybit in January 2025 for low volume, within weeks of its ATH. — [CoinMarketCap](https://coinmarketcap.com/currencies/spectral/)
- HeyAnon is led by a founder with a Wonderland/Abracadabra controversy history. It moved toward AMM and DAO-merger plays on Robinhood Chain in 2026. — [Crypto Briefing](https://cryptobriefing.com/heyanon-token-triples-equilibra-robinhood-chain/)

**Incentive-rented TVL and operational failures**
- Almanak: TVL was above $120M in December 2025 before a botched airdrop claim (operational errors, DDoS, about 1,100 affected users) and an 80% single-day token drop. Circulating supply at TGE was 0%. — [MEXC news](https://www.mexc.com/news/263205); [Tokenomics](https://app.tokenomics.com/tokenomics/almanak/unlocks)
  - TVL is now $0.27M. — [DefiLlama API](https://api.llama.fi/protocol/almanak)
- Giza: ARMA's advertised USDC yield of 15% was "partially boosted by $GIZA incentives". — [Bankless](https://www.bankless.com/read/giza-new-agents-new-yields)
  - The ARMA fee trough was $38 per week. All-time protocol revenue was only $127K before the wind-down. — [OwnYourMind Giza](https://ownyourmind.ai/projects/giza/)

**What produced measurable value (yield agents)**
- ARMA showed over 9.75% APY on USDC. After rebalancing fees and a 10% performance fee, it still beat ordinary lending on Aave or Morpho. DWF's headline: "AI outperforms humans in DeFi yield optimization". DWF also says scalability is unproven. — [Odaily/DWF, Apr 2026](https://www.odaily.news/en/post/5210341)
- **[HISTORICAL]** ARMA was marketed as delivering "83.45% higher APR than other Base USDC markets" (X post, July 2025). Giza's docs show 9.75% APR in March 2025 and 8.3% in April 2025. — [Giza X](https://x.com/gizatechxyz/status/1950252695249703317); [Giza docs](https://docs.gizaprotocol.ai/introduction/agents)
- Despite that uplift, the economics did not sustain the product. ARMA was wound down in February–March 2026. — [OwnYourMind Giza](https://ownyourmind.ai/projects/giza/)

**Autonomous trading underperforms**
- In a Trade XYZ human-vs-agent stock competition ($10K accounts), the top humans beat the top agents by more than 5x. — [Odaily/DWF](https://www.odaily.news/en/post/5210341)
- Nof1 lessons:
  - Holding positions for 2–3 hours beat frequent flipping.
  - Only the top 3 models had positive expected value per trade.
  - Average leverage of 6–8x beat leverage above 10x.
  - Grok 4.20 was the only model profitable on average.
  — [Odaily/DWF](https://www.odaily.news/en/post/5210341)
- Alpha Arena Season 1 (Oct–Nov 2025, $10K each, BTC/ETH perps on Hyperliquid): 4 of 6 frontier models lost money.
  - Qwen3-Max $12,231 (+22.3%), DeepSeek $10,489, Claude Sonnet 4.5 $5,799, Gemini 2.5 Pro $5,445, Grok 4 $4,208, GPT-5 $4,126. — [ForkLog](https://forklog.com/en/four-out-of-six-ai-models-suffer-losses-in-trading-tournament/amp)
  - Season 1.5 was won by "Mystery Model", i.e. Grok 4.20 (+12% average). — [ForkLog](https://forklog.com/en/news/ai-model-grok-4-2-triumphs-in-trading-tournament)
  - Nof1 called the test exploratory: short duration and no statistical controls. — [Yahoo Finance](https://finance.yahoo.com/news/ai-crypto-trading-showdown-deepseek-202512124.html)
- Senpi's builder fees fell about 90% from their February 2026 launch peak by mid-2026. — [DefiLlama API](https://api.llama.fi/summary/fees/senpi-perps?dataType=dailyFees)
- Risk noted by analysts: many agents on one venue could amplify liquidations in stress events. — [Crypto Briefing](https://cryptobriefing.com/hyperliquid-default-liquidity-layer-ai-agents/)
- DWF also flags "strategy crowding", where agents trained on similar data converge on the same positions and exits. — [Odaily/DWF](https://www.odaily.news/en/post/5210341)

**Security failures**
- **Grok × Bankrbot, 4 May 2026.**
  - The attacker sent a Bankr Club NFT to Grok's wallet, which granted "Executive" permissions. Then a Morse-code message that Grok decoded on X became a command that Bankrbot executed.
  - 3B DRB tokens, worth about $150–174K, were transferred and sold. About 80% was later returned.
  - No key or smart-contract bug was involved; the exploit was in how the AI interpreted input.
  — [Giskard](https://giskard.ai/knowledge/how-grok-got-prompt-injected-an-x-user-drained-150-000-from-an-ai-wallet); [OECD AI incident record](https://oecd.ai/en/incidents/2026-05-04-4a73)
  - DRB's price reportedly fell about 40% temporarily. — [Cointelegraph Learn](https://cointelegraph.com/learn/grok-bankr-wallet-free-nft-prompt-injection)
- **[HISTORICAL]** Princeton researchers showed "memory injection" attacks on ElizaOS agents can trigger unauthorized transfers, and that models are more vulnerable to memory injection than to prompt injection. — [arXiv 2503.16248](https://arxiv.org/abs/2503.16248)
  - Eliza Labs reportedly made no direct updates in response. — [OwnYourMind ElizaOS](https://ownyourmind.ai/projects/elizaos/)
- DWF notes that transparent agent trades can be copied or front-run, while private agents let creators extract value from their own users. — [Odaily/DWF](https://www.odaily.news/en/post/5210341)

**Industry narrative in 2026**
- At Consensus Miami 2026, a16z crypto's Guy Wuollet said AI agents need financial rails that are "either literally DeFi or a lot like DeFi". Bitwise's Hunter Horsley and eToro's Yoni Assia backed agent-driven DeFi. — [CoinDesk, 7 May 2026](https://www.coindesk.com/business/2026/05/07/defi-is-not-dead-it-s-going-mainstream-with-ai-agents-crypto-executives-say)
- One OpenClaw-for-crypto guide recommends that OpenClaw not trade without human review and be used for research and alerts. — [Ampere](https://www.ampere.sh/blog/openclaw-crypto-trading.md)

### Inferences
- **Lessons for a new "hyped" DeFAI assistant:**
  1. **Don't lead with a token.** Every token-first DeFAI product lost 90–99.9%. The 2026 survivors either have no token (Minara, Surf, Senpi so far) or have a token tied to a fee engine (Bankr, Virtuals).
  2. **Hype needs a viral loop with real money flow.** Bankr's loop is reply-on-X, auto-wallet, launch token, earn fees. Its fee spikes match social or agent manias (OpenClaw in February 2026).
  3. **Yield agents need fee-positive economics without emissions.** ARMA had a real APY uplift but tiny revenue ($127K lifetime) and shut down.
  4. **Don't market autonomous trading alpha.** Evidence says agents lose to top humans and most LLMs lose money. Sell convenience, risk management, alerts and copy-trading guardrails instead.
  5. **Security is a brand risk.** One prompt-injection incident (Grok/Bankr) became global news. Safe defaults are now table stakes: no command execution from untrusted social text, least-privilege permissions, spend caps, simulation and human confirmation.
  6. **Distribution belongs to incumbents and super-agents now** (Coinbase, OKX, MetaMask, Trust Wallet with about 220M users, Meta Muse). Being the skill or plugin they call, as Bankr is for Muse and OpenClaw, may matter more than owning the chat UI.
  7. **2026 narratives with momentum:** Hyperliquid builder codes, tokenized stocks on Robinhood Chain and Base, x402 and ERC-8004 agent identity and payments, and agent-to-agent commerce (Virtuals ACP).

### Gaps
- No primary post-mortems from Giza, Almanak or HeyAnon explaining their decisions.
- No primary source on Bankr's fixes after the May 2026 exploit.
- No cohort or retention data for any DeFAI product.

---

## 5. Benchmarks and evaluations of LLM agent reliability in DeFi execution

### Takeaway
Reliability is still well below what irreversible money movement requires. In the best 2026 execution-grounded benchmarks:
- top models correctly complete roughly 55–75% of single-step transaction tasks;
- strict end-to-end exact-match rates are often below 45%;
- multi-step workflows fail more;
- unconstrained LLM prompting regularly produces unsafe trades (missing price-impact gates).

Structured pipelines help a lot: retrieval of ABIs and addresses, deterministic transaction builders, enforced safety parameters and simulation.

### Cited Findings
- **EVM-QuestBench** (Gradient / Soochow; v6, 7 Apr 2026; dated 26 Feb 2026). — [arXiv 2601.06565](https://arxiv.org/abs/2601.06565)
  - Setup: 107 tasks (62 atomic, 45 composite) executed on a forked EVM. 20 models, 5 rounds each.
  - Claude Sonnet 4.5 was best: 8,236 of a 10,700 maximum. It fully passed on average 35.0 of 62 atomic tasks (about 56%) and 41.0 of 45 composite tasks, with 88% step efficiency.
  - Gemini 3 Pro 7,863; GPT-5 7,774; GPT-5.1 7,332; Kimi-K2-Thinking 7,238; DeepSeek-V3.2 6,709; Claude Haiku 4.5 5,588.
  - Code-specialized models (Qwen3-Coder, Devstral) scored near zero on composite tasks because of repeated interface failures.
  - The authors find a persistent gap between single-action precision and multi-step completion.
- **Intent2Tx** (30 Apr 2026). — [arXiv 2604.27763](https://arxiv.org/html/2604.27763)
  - Setup: 29,921 single-step and 1,575 multi-step DeFi intents from about 300 days of Ethereum mainnet traces (Mar 2025–Jan 2026). 16 LLMs, including GPT 5.2, Claude Opus 4.5 and Gemini 2.5 Pro.
  - Single-step executability: 0.198–0.681 with direct inference; 0.505–0.744 with retrieval (best GPT 5.2).
  - State equivalence, meaning the correct on-chain effect: best 0.706 (Claude Opus 4.5 with retrieval).
  - Strict pass@1: single-step 0.00–0.06 direct and 0.19–0.42 with retrieval; multi-step 0.00–0.11 direct and 0.10–0.32 with retrieval.
  - Failure modes: wrong function selection (swapExactETHForTokens vs swapExactTokensForETH), decimal and unit errors (decimal strings in uint256 fields; minimum outputs off by orders of magnitude), stale deadlines, hallucinated or zero addresses, and transactions that run without producing the intended state change.
- **DeFiFlowBench** (SRM Institute, 10 Sep 2026). — [arXiv 2609.11504](https://arxiv.org/abs/2609.11504)
  - Setup: 207 prompts covering swaps, limit orders, cross-chain transfers and compositions.
  - Direct, constrained and few-shot LLM prompting produced **14–19 unsafe held-out executions per configuration** under a fixed 5% price-impact cap.
  - A slippage bound derived from a quote does not prevent the price impact of the order itself.
  - The best baseline scored 0.33 on the static safety proxy. Their Koan-Safe pipeline (intent parser, generator, structural repair with default safety parameters) scored 0.67, with no unsafe executions on saved outputs.
  - With enforcement disabled, unsafe executions returned to 14–17.
- **CyberChainBench** (built from 541 DeFi exploit incidents): best agent configuration reached 37.5% vulnerability detection, 43.7% exploitation and 23.4% patching. — [arXiv 2606.26216](https://arxiv.org/html/2606.26216) (from search summary)
- **Other evaluations:**
  - CryptoBench (Dec 2025): expert-level crypto analysis tasks, not execution. — [arXiv 2512.00417](https://arxiv.org/pdf/2512.00417)
  - LATTICE (Apr 2026): decision-support utility of crypto agents. — [arXiv 2604.26235](https://arxiv.org/pdf/2604.26235)
  - PACE (Aug 2026): policy-attested authorization layer between LLM agents and on-chain execution. — [arXiv 2608.17220](https://arxiv.org/html/2608.17220)
  - ChainClaw (Aug 2026): layered framework for reliable on-chain execution. — [arXiv 2608.05790](https://arxiv.org/pdf/2608.05790)
  - EVM-QuestBench also cites Solana Bench (Solana Foundation, 2025) as prior work. — [arXiv 2601.06565](https://arxiv.org/abs/2601.06565)
- **Surf** claims its model performs "four times better than ChatGPT and Grok" on crypto tasks, using the CAIA benchmark tested with Princeton. This is a vendor claim. — [The Block](https://www.theblock.co/amp/post/382082/crypto-ai-four-times-better-chatgpt-grok-raises-15-million-fortune)
- **Trading-performance evaluations**: Alpha Arena Season 1 (4 of 6 models lost money) and Trade XYZ (top humans more than 5x better than agents); details in section 4. — [ForkLog](https://forklog.com/en/four-out-of-six-ai-models-suffer-losses-in-trading-tournament/amp); [Odaily/DWF](https://www.odaily.news/en/post/5210341)
- **Security evaluation**: memory injection beats prompt-injection defenses on ElizaOS agents; fine-tuning-based defenses substantially reduce attack success. — [arXiv 2503.16248](https://arxiv.org/abs/2503.16248)

### Inferences
- A production DeFi assistant should not let the LLM build calldata freely. The LLM's job is intent parsing. Transactions should come from vetted, deterministic builders that use verified addresses and ABIs, normalize decimals, enforce slippage and price-impact caps, simulate before signing, and require explicit user confirmation above set thresholds. This is the pattern that moved DeFiFlowBench from 0.33 to 0.67 and that MetaMask and OKX ship (simulation and risk checks before execution).
- Multi-step workflows (approve, swap, bridge, deposit) are where models fail most. Templated "recipes" for common flows plus step-by-step state checks are safer than free-form planning.
- No standard public leaderboard exists yet for "DeFi agent execution reliability". A product that publishes transparent success, failure and safety stats could use that as a credibility and marketing angle.

### Gaps
- None of these benchmarks evaluates a named commercial DeFAI product (Bankr, Griffain, HeyAnon and others). There is no independent reliability data on live products.
- I could not read CyberChainBench in full; its figures come from a search summary.
- No benchmark measures Solana-specific transaction reliability in 2026, beyond the Solana Bench reference.
