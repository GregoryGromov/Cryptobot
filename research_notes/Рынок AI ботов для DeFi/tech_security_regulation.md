# AI agents that execute DeFi transactions: tech stack, security risks and regulation (state as of 22 Oct 2026)

Scope note: research run on 2026-10-22. Items dated before 2026 are labelled "[older]". Many 2026 figures come from vendor blogs or crypto media. Those are flagged "(secondary)" or "(vendor)" where the primary document was not checked. The Pectra hard fork (which activated EIP-7702) went live on Ethereum mainnet on 7 May 2025. One secondary source (eco.com) says "May 7, 2026", which is an error.

---

## Q1. Wallet and custody infrastructure: which options give an agent limited, revocable permissions?

### Takeaway
By late 2026 the standard architecture is **owner key + scoped agent key**. The user (or operator) keeps a master/owner key. The agent signs only through a constrained credential: an ERC-7715/7710 delegation, an ERC-4337/7579 session key, a Safe module with the Zodiac Roles Modifier, a TEE/MPC server wallet behind a policy engine, or a Solana smart wallet such as Swig or Squads. Limits must be enforced in the signing layer (on-chain caveats or an enclave policy engine), never in the prompt. Bare EIP-7702 delegation carries no scope or expiry, so on its own it is a liability.

### Cited Findings

**EVM primitives**
- EIP-7702 lets an EOA temporarily run smart-contract code, so session keys can be added without moving to a new address. The delegated contract defines the permission rules and the session key signs within them — [Openfort](https://www.openfort.io/blog/eip-7702); [Blokz](https://www.blokz.dev/articles/the-delegated-signer-eip-7702-session-keys-and-the-new-wallet-model-for-ai-agents/) (secondary)
- 7702 risk [older, 2025]: Wintermute found that more than 80% of early EIP-7702 delegations pointed to a single malicious sweeper script ("CrimeEnjoyor"). A later write-up citing Wintermute puts it at more than 97% of mainnet delegations going to copy-pasted sweepers within four weeks of Pectra — [The Block, Jun 2025](https://www.theblock.co/post/356481/wintermute-warns-pectra-upgrade-leaves-ethereum-users-at-risk-of-automated-attacks); [Zealynx](https://www.zealynx.io/research/smart-contracts/eip-7702-wallet-security)
- A signed 7702 delegation "encodes no execution scope, no call restriction, no expiry, no value cap". One user lost $1.54M to a 7702 batch-transaction phishing attack (Aug 2025). SlowMist recommends that wallets prominently show the delegate contract at signing time — [Zealynx](https://www.zealynx.io/research/smart-contracts/eip-7702-wallet-security); [GoPlus](https://blog.gopluslabs.io/2025/06/03/financing/2025-06-03-Understanding-EIP-7702-Phishing-Attacks-A-Comprehensive-Guide-to-Protection-Strategies-for-Wallets)
- ERC-7715 (wallet permission requests, Draft) defines a JSON-RPC request for scoped, time-limited permissions. It does not define enforcement: that is left to Snaps, Rhinestone Smart Sessions (ERC-7579 module) or other validators — [eco.com explainer](https://eco.com/support/en/articles/11953354-erc-7715-explained-wallet-permissions-sessions-and-subscriptions) (secondary)
- MetaMask "Advanced Permissions" pairs ERC-7715 with ERC-7710 delegation (MetaMask Smart Accounts Kit, formerly the Delegation Toolkit). Permissions are granted to a session account. On-chain "caveat enforcers" check every execution and reject out-of-scope calls, and post-execution hooks are supported. At launch it required MetaMask Flask ≥13.5.0 and ran first on OP Mainnet — [MetaMask blog](https://metamask.io/news/introducing-advanced-permissions); [MetaMask docs](https://docs.metamask.io/smart-accounts-kit/guides/advanced-permissions/execute-on-metamask-users-behalf/)
- Live agent example: CoinFello's AI agent gets scoped ERC-7715 permissions from users' existing MetaMask wallets, which limits blast radius without exposing the master key — [MetaMask news](https://metamask.io/news/coinfello-metamask-smart-accounts-kit)
- ERC-4337 adoption (secondary, unverified): about 40M smart accounts and more than 100M transactions since the March 2023 launch; nearly 20M accounts deployed in 2024 alone. EIP-7702 accounts using 4337 infrastructure peaked at about 926k UserOps in one month (December, year unstated), driven by Coinbase Wallet on Base. Most UserOps use paymasters — [LCX](https://lcx.com/en/beyond-seed-phrases-evaluating-the-real-world-adoption-of-erc-4337-wallets); [Alchemy](https://www.alchemy.com/overviews/what-is-account-abstraction)
- Safe + Zodiac Roles Modifier v2 sits between a Safe and its modules. It restricts a role to approved addresses, functions and parameters, with spending allowances and conditional logic. ENS DAO uses it for its treasury endowment manager (karpatkey). No source documents it for AI agents specifically — [GitHub gnosisguild/zodiac-modifier-roles](https://github.com/gnosisguild/zodiac-modifier-roles/blob/main/README.md); [ENS EP 5.12](https://docs.ens.domains/dao/proposals/5.12)

**Server / embedded wallet providers (MPC/TEE)**
- **Coinbase CDP.** Server Wallets v2 reached GA in July 2025: MPC keys held in a secure enclave (AWS Nitro per one source). "Agentic Wallets" launched 11 Feb 2026 on top of that layer. They add session spend caps, per-transaction limits and session-duration limits. Keys never enter the LLM or prompt. Native x402 support (the "x402 Bazaar" of paid APIs), gasless on Base, installed via CLI `npx awal` or an MCP server. Sources disagree on chains: Base-focused (Decrypt) versus EVM + Solana (Forklog) — [Decrypt](https://decrypt.co/357862/morning-minute-coinbase-gives-ai-agents-their-own-wallets); [Forklog](https://forklog.com/en/coinbase-unveils-wallet-infrastructure-for-ai-agents/); [eco.com](https://eco.com/support/en/articles/14845485-coinbase-agentic-wallets-explained)
- **CDP Policy Engine (primary docs).** Two scopes: project and account (account scope only for API-key wallets). Rules are `accept`/`reject` on operations including `signEvmTransaction`, `sendEvmTransaction`, `signEvmTypedData`, `signEvmHash`, `prepareUserOperation`, `sendUserOperation`, `signSolTransaction` and `sendSolTransaction`. Documented criteria include `ethValue` (wei comparison) and `evmAddress` allow/deny lists. A matching reject overrides accept. If an operation has rules but none match, the request is rejected (fail-closed). A policy simulation tool exists. Changing policies needs a separate API-key scope, "Non-custodial > Manage" — [CDP docs: Policies overview](https://docs.cdp.coinbase.com/server-wallets/v2/using-the-wallet-api/policies/overview)
- **AgentKit** (open-source framework, separate from the wallet layer) has no built-in spend limits per one comparison. Its CdpEvmWalletProvider inherits CDP policies on Base, Ethereum, Polygon, Arbitrum and Optimism (+ testnets) — [Openfort comparison, Sep 2026 (vendor)](https://www.openfort.io/blog/best-agent-wallets-for-developers); [cryptoskills.dev](https://cryptoskills.dev/skills/coinbase-agentkit) (secondary)
- Comparison table from Openfort (published 10 Sep 2026, ranks itself first, so treat as vendor-biased) — [Openfort](https://www.openfort.io/blog/best-agent-wallets-for-developers):
  - **Privy** (acquired by Stripe, June 2025): Shamir sharding inside AWS Nitro Enclaves. Off-chain policies (transfer limits, allowlists, time windows) per wallet, scoped "session signers". EVM, Solana, Bitcoin. Free to 499 MAU; Core $299/mo.
  - **Turnkey**: keys are never reconstructed outside enclaves. Org-level policy engine evaluated inside the enclave, policy-scoped P-256 API keys, 50+ chains. Agent use requires an Enterprise plan (from about $0.0015 per signature).
  - **Dynamic** (acquired by Fireblocks, 2025): MPC or smart-contract wallet, basic policies.
  - **Crossmint**: dual key (owner key + TEE-sealed agent key), delegated signers with spending limits, claims a MiCA CASP licence.
  - **Openfort**: GCP Confidential Space TEE, ERC-7715 session keys with on-chain revoke, fail-closed API policy engine.
- **Lit Protocol Vincent**: a delegation framework of "policies" (guardrails) plus "abilities" (swap, borrow, bridge) bound together at deploy time. Threshold-split keys run in TEEs and sign only after an on-chain policy check passes (spend caps, allowlists, time windows, rate limits). Delegations are recorded on-chain as auditable consent. Status: early access — [Lit blog](https://spark.litprotocol.com/user-owned-guardrails-for-ai-agents/); [Blockworks](https://blockworks.co/news/lit-protocol-vincent-ai-agents)

**Solana**
- **Swig** (Anagram) is a Solana smart-wallet SDK announced by Solana in May 2025 [older]. It offers session keys, role-based delegated permissions (withdrawal limits, staking vs transfer restrictions, time-based limits) and gasless UX, and is integrated with Para — [Anagram blog](https://blog.anagram.xyz/introducing-swig-unlocking-the-future-of-smart-wallets-on-solana-and-ethereum/); [Solana on X](https://x.com/solana/status/1924885317250634026); [Para blog](https://blog.getpara.com/solana-smart-accounts/)
- **Squads** is cited as the Solana implementation of the dual-key pattern: the owner key can add or remove agent keys, withdraw and override, and per-transaction-type spending limits exist. Details are thin and come from secondary guides — [Medium CTO guide](https://yavorovych.medium.com/building-ai-agents-for-solana-in-2026-a-ctos-tool-guide-d30cee7ba2f5); [rpcfast](https://rpcfast.com/blog/ultimate-guide-solana-ai-agents)
- Solana Agent Kit V2 moved to embedded wallets via Turnkey and Privy so the agent no longer holds a raw private key — [Medium CTO guide](https://yavorovych.medium.com/building-ai-agents-for-solana-in-2026-a-ctos-tool-guide-d30cee7ba2f5) (secondary)
- The Lobstar Wilde incident (Feb 2026, Solana; see Q3) is used by Solana-ecosystem guides as the argument for code-level permissions — [SolanaCompass](https://solanacompass.com/skills/agent-security)

### Inferences
- Options ranked by how limited and revocable the agent's power is (strongest first):
  1. On-chain scoped delegation: ERC-7710/7715 caveats, ERC-7579 Smart Sessions, Zodiac Roles, Swig roles. Verifiable, revocable on-chain, and survives a compromised backend.
  2. TEE/MPC server wallet with an enclave-evaluated policy engine (Turnkey, CDP, Privy, Lit). Strong, but you trust the vendor's enclave and policy service, and revocation is an off-chain API call.
  3. Application-layer limits only (bare AgentKit, bare ElizaOS plugins). Not acceptable for user funds.
- For a non-custodial product, the cleanest pattern is: the user's own wallet (EOA upgraded via 7702 to an audited delegate, or a 4337/Safe account) grants the bot a time-boxed, value-capped, protocol- and function-allowlisted session key. The operator never controls the owner key. A hybrid option is a per-user TEE server wallet with operator-level policies, but that moves the operator toward custody (see Q4).
- The agent should never be allowed to sign EIP-7702 authorizations or `setCode`-type messages, or permit/Permit2 messages with unlimited allowances. These are the dominant drain vectors.

### Gaps
- No primary Squads documentation on agent or session-key features was found. Squads details are secondary.
- Official Privy and Turnkey policy docs were not fetched; their feature descriptions come from a vendor-biased comparison.
- No verified 2026 on-chain dashboard figures (BundleBear/Dune) for 4337/7702 usage.
- Dynamic/Fireblocks and Privy/Stripe acquisition dates come only from Openfort's comparison.

---

## Q2. Agent tooling: frameworks, MCP, intents, chain abstraction, simulation, x402, ERC-8004

### Takeaway
The stack has stratified. Read-only data comes via MCP (Alchemy, CoinGecko). Action kits are GOAT (200+ actions), Solana Agent Kit v2 and Coinbase AgentKit. Agent-native wallets are covered in Q1. Execution is increasingly routed through intents/solver networks (CoW, UniswapX, NEAR Intents, Across), which take execution risk away from the LLM. Pre-sign scanning comes from Blockaid; Blowfish was absorbed into Phantom. x402 handles agent payments for APIs and ERC-8004 handles agent identity and reputation. Several 2024–25 "AI x crypto" frameworks have declined: the ElizaOS foundation and token were wound down in Aug 2026, though the code lives on.

### Cited Findings

**Frameworks and MCP**
- GOAT SDK: open-source toolkit with 200+ on-chain actions (Uniswap, Jupiter, Orca, 1inch), EVM + Solana, local key signing — [ChatForest](https://chatforest.com/guides/best-blockchain-web3-mcp-servers/); [Symbiosis](https://symbiosis.finance/blog/best-mcp-servers-for-defi-comparison) (secondary)
- Solana Agent Kit (SendAI): V1 loaded about 60 tools into context, which caused hallucinated tool use. V2 scopes tools per registered plugin. The latest tagged GitHub release seen was v2.0.9 (July 2025), so current activity is unclear — [Medium CTO guide](https://medium.com/@yavorovych/building-ai-agents-for-solana-in-2026-a-ctos-tool-guide-d30cee7ba2f5); [GitHub releases](https://github.com/sendaifun/solana-agent-kit/releases)
- ElizaOS: founder Shaw Walters declared the ai16z/ELIZAOS token "dead" and wound down the foundation (4–5 Aug 2026). The Burwick Law class action (SDNY, filed Apr 2026) was settled by handing the remaining treasury to holders. Open-source development reportedly continues, and the repo was still updated in Sep 2026 — [The Block](https://theblock.co/news/defi/2026-08-05-eliza-labs-native-token-dead-410774); [Decrypt](https://decrypt.co/374958/eliza-ai-token-dead-shuts-down-foundation-lawsuit); [elizaos.news](https://elizaos.news/daily/2026-03-22/)
- MCP landscape: curated lists track 100+ crypto MCP servers (CoinGecko, Aave, deBridge, OKX…). Alchemy MCP is read-only (data/RPC). VaultPilot follows an "agent proposes, you approve on Ledger" model. Guides warn that calldata and transaction-preparation tools are high risk — [GitHub insumerapi/crypto-mcp-servers](https://github.com/insumerapi/crypto-mcp-servers); [GitHub trmaphi/awesome-crypto-mcp-servers](https://github.com/trmaphi/awesome-crypto-mcp-servers); [Symbiosis](https://symbiosis.finance/blog/best-mcp-servers-for-defi-comparison)
- OpenClaw (open-source personal agent framework, 2026) and its ClawHub skill marketplace became the main retail "agent that trades" vector. SlowMist analysed IOCs from 400+ malicious ClawHub skills (see Q3) — [SlowMist × Bitget, 18 Mar 2026](https://www.bitget.com/blog/articles/slowmist-bitget-security-research)

**Intents / solver networks / chain abstraction**
- CoW DAO claims a 23.5% share of intent-based DEX volume across ten chains (July 2026, self-reported). Bitquery estimates about $23.3B settled through CoW solver auctions. On Ethereum in 2026 UniswapX filled about 232K orders, far more than rivals. Bitquery found the 1inch Fusion settlement contract inactive on Ethereum/BSC this year, while a Messari-based report says 1inch's native execution share rose from 3.2% to 13.2% in Q1 2026 (figures conflict and are lower bounds) — [Bitquery](https://bitquery.io/investigations/cow-swap-solver-auctions); [blockeden forum](https://blockeden.xyz/forum/t/uniswapx-cow-protocol-and-1inch-fusion-now-handle-billions-in-monthly-volume-through-solver-auctions-the-intent-architecture-explained-for-builders/462)
- Across is an intent-based bridge where solvers/relayers front capital. Uniswap's cross-chain swaps run through Across — [eco.com](https://eco.com/support/en/articles/11802670-best-cross-chain-intent-protocols-2026) (secondary)
- NEAR Intents: about $33.6B cumulative volume and about $4.7B over 30 days per DeFiLlama (Oct 2026, via a secondary site). More than $35.4M cumulative fees reported by June 2026. NEAR positions Intents as the "commerce layer for AI agents" (NEARCON 2026). One podcast digest estimates actual agent-driven flow is tiny (≈0.001% of stablecoin volume, undated) — [iq.wiki](https://iq.wiki/en/wiki/near-intents); [blockeden](https://blockeden.xyz/blog/2026/03/15/near-protocol-invisible-crypto-super-app-ai-first-ux-confidential-intents/); [snappr NEARCON](https://www.snappr.com/news/story/nearcon-2026); [alea research](https://alearesearch.io/podcast-digest/bell-curve/near-is-betting-everything-on-ai-agents-or-roundup)

**Simulation / pre-sign scanning**
- Blockaid is the dominant independent provider ($83M raised, integrated in about 90% of major wallets including MetaMask and Coinbase Wallet; secondary, older figures). It markets transaction-scanning, token-risk and address-validation APIs specifically for on-chain agents — [Spark glossary](https://www.spark.money/glossary/transaction-simulation); [Blockaid blog](https://blockaid.io/blog/how-to-build-smarter-safer-onchain-ai-agents-with-blockaid)
- Blowfish was acquired by Phantom and its standalone service was sunset (one source dates the deal to Nov 2024 [older]). Lifetime stats: 1.3B transactions scanned, 2.8M scams prevented — [Phantom blog](https://phantom.com/learn/blog/phantom-acquires-blowfish)
- Known limitation: attackers can exploit the gap between simulation and execution (time-of-check vs time-of-use) — [Spark glossary](https://www.spark.money/glossary/transaction-simulation)
- Blockaid H1 2026 report: 212 verified on-chain exploits, $1.1B lost. It flags AI agents, EIP-7702 delegation and off-chain bridge infrastructure as risk areas outside traditional audit scope — [GNcrypto](https://www.gncrypto.news/news/212-on-chain-exploits-stole-1-1b-h1-2026-blockaid/); [Forklog](https://forklog.com/en/blockaid-reports-record-crypto-hacks-in-first-half-of-2026/)

**x402 (agent payments)**
- Launched by Coinbase in May 2025 and now stewarded by the x402 Foundation under the Linux Foundation (per Visa/Artemis). Reported numbers conflict:
  - Coinbase, late Apr 2026: about 69k active agents, 165M transactions, about $50M cumulative volume.
  - Visa/Artemis, Jul 2026: about $15M adjusted volume over 109.6M transactions.
  - Chainalysis: more than 138M transactions on Base in Q3 2026, with more than 87% of payments between $0.0001 and $0.10.
  - Artemis: adjusted volume fell about 77% from a $5.15M Nov 2025 peak to $1.19M in May 2026.
  - Forkast argues about 95% of headline transactions are "signaling, not commerce"; the early boost came from the PING pay-to-mint memecoin.
  - Sources: [KuCoin/Visa-Artemis summary](https://www.kucoin.com/blog/en-visa-accelerates-ai-agent-payments-x402-protocol-hits-15m-on-chain-volume); [Forkast](https://forkast.news/the-x402-foundation-activated-a-27-year-old-internet-code-200-million-transactions-later-the-real-volume-is-still-tiny/); [Crowdfund Insider/Chainalysis](https://www.crowdfundinsider.com/?p=283501); [PaymentsJournal](https://www.paymentsjournal.com/agentic-commerce-transactions-on-x402-protocol-are-picking-up/amp/)
- An "approval gap" in agentic micropayments (agents paying without per-payment human approval) has been raised as a design concern — [letsdatascience](https://letsdatascience.com/news/x402-reveals-approval-gap-in-agentic-micropayments-761bf8e7) (secondary, not read in full)

**ERC-8004 (Trustless Agents) and agent identity**
- Status: **Draft** ERC, created 2025-08-13. Authors: Marco De Rossi, Davide Crapis, Jordan Ellis, Erik Reppel — [EIP-8004](https://eips.ethereum.org/EIPS/eip-8004)
- It defines three registries:
  - Identity: ERC-721 agentId plus an agentURI registration file listing A2A, MCP, ENS and DID endpoints; the agent wallet must be signature-verified.
  - Reputation: signed client feedback, revocable, aggregated on- and off-chain.
  - Validation: a validator scores the agent 0–100 via stake re-execution, zkML or TEE oracles.
  Payments are out of scope, but feedback can embed x402 proof-of-payment. Security considerations name Sybil reputation inflation, and say the ERC cannot guarantee advertised capabilities are safe — [EIP-8004](https://eips.ethereum.org/EIPS/eip-8004)
- Registry contracts were reported live on Ethereum mainnet around 29–31 Jan 2026, with early integrators (Cortensor, VIBE, ZyfAI) and an explorer (8004scan). This is secondary coverage; no EF primary post was found — [OneKey blog](https://onekey.so/blog/ecosystem/ethereums-ai-turning-point-what-to-watch-after-the-erc-8004-trustless-agents-standard-20260128163746); [eco.com](https://eco.com/support/en/articles/13221214-what-is-erc-8004-the-ethereum-standard-enabling-trustle)

### Inferences
- For a production DeFi assistant, the LLM should produce a structured **intent** (e.g. "swap X→Y, max slippage, deadline"). Deterministic code then routes it to an intent venue (CoW, UniswapX, 1inch, Across, NEAR Intents) or an aggregator such as Li.Fi or Relay. That moves MEV protection and route optimisation to solvers and shrinks what the LLM can get wrong to the intent parameters.
- ERC-8004 is useful for discovery and reputation of counterparty agents. It is still a Draft, and reputation is Sybil-prone, so it should not be a security boundary.
- x402 matters mainly for the bot paying for data/APIs, not for user trading flows. Real commercial volume remains small.

### Gaps
- No 2026 status found for **Brian API**, **Anoma** mainnet, **Particle Network**, **Socket/Bungee**, **Li.Fi** or **Relay** volumes. These were not covered by the searches run.
- Tenderly simulation-API details were not researched. It is widely used, but no 2026 source was fetched.
- No data on what share of intents/DEX volume is agent-originated, beyond NEAR's anecdotal "tiny".
- GOAT 2026 release status is unverified.

---

## Q3. Security incidents, benchmarks and best-practice guardrails

### Takeaway
Real losses from AI agents are still small next to classic hacks (about $1.1B lost in H1 2026 overall). But every major agent incident shares one root cause: an LLM that reads untrusted text directly controls a signing key with no hard limits. That covers Freysa (2024), AIXBT (2025), Grok/Bankr Morse code (May 2026) and Lobstar Wilde (Feb 2026). Research shows memory/context injection beats prompt-level defenses. Benchmarks show roughly 19–25% unsafe executions for naive LLM DeFi workflow synthesis without a deterministic policy layer. Consensus best practice: separate "think" from "sign", enforce limits in the wallet layer, simulate, allowlist, screen addresses, and put a human in the loop for high-risk actions.

### Cited Findings

**Incidents (chronological)**
- **Freysa [older, Nov 2024]**: game agent told never to send funds. 195 players made 482 attempts (fees rising 0.78% per message, cap $4,500). The winner, p0pular.eth, convinced it that `approveTransfer` handled *incoming* funds, and it released the $47,316 pool — [The Block](https://www.theblock.co/post/328747/human-player-outwits-freysa-ai-agent-in-47000-crypto-challenge); [The Decoder](https://the-decoder.com/hacker-wins-47000-by-tricking-ai-chatbot-with-smart-prompting/)
- **AIXBT [older, 18 Mar 2025]**: an attacker reached the operator *dashboard* around 2 AM UTC and queued two malicious prompts that moved 55.5 ETH (about $106k) from the Simulacrum wallet. The developer said it was not agent manipulation, and core systems were unaffected. The AIXBT token fell about 20% — [Cointelegraph](https://cointelegraph.com/news/hacker-breaches-ai-crypto-bot-aixbt-steals-55-eth); [Decrypt](https://decrypt.co/310510/aixbt-ai-influencer-hacked-100k-ethereum); [AIID #1003](https://incidentdatabase.ai/cite/1003)
- **Princeton/Sentient "Real AI Agents with Fake Memories" [older, arXiv 2503.16248, v3 Jul 2025]** (Patlan, Sheng, Hebbar, Mittal, Viswanath):
  - Memory injection against ElizaOS is stealthier and more persistent than prompt injection and can trigger unauthorized transfers.
  - Models are "significantly more vulnerable" to memory injection than to prompt injection.
  - CrAIBench has 150+ blockchain tasks and 500+ attack cases. Prompt-injection defenses and detectors give only limited protection when stored context is corrupted, while fine-tuning-based defenses substantially cut attack success.
  - Sources: [arXiv](https://arxiv.org/abs/2503.16248); [Princeton AI blog](https://blog.ai.princeton.edu/2025/09/09/when-your-ai-assistant-gets-gaslithow-real-ai-agents-with-fake-memories-shows-that-smart-assistants-can-go-dangerously-off-script/); [Decrypt](https://decrypt.co/318200/elizaos-vulnerability-ai-gaslit-losing-millions)
- **Lobstar Wilde (22 Feb 2026, Solana)**: an OpenClaw-based agent built by OpenAI employee Nik Pash. A user asked for 4 SOL, and the agent sent its entire LOBSTAR holding (about 52.4M tokens, valued $250k–$442k). Suspected causes: decimal/unit confusion, a parsing error, or conversational state lost after a crash. The recipient sold for about $40k within 15 minutes. It was not a hack, a pure execution-reliability failure — [The Block](https://www.theblock.co/news/ecosystems/2026-02-22-ai-agent-created-by-openai-dev-accidentally-sends-entire-memecoin-holdings-to-reply-guy-390722); [SolanaCompass](https://solanacompass.com/skills/agent-security)
- **OpenClaw / ClawHub supply chain (Q1 2026)**: SlowMist analysed 400+ malicious skills. Example: an "X Trends" skill hid Base64 commands in SKILL.md, used a two-stage loader and a fake system prompt to phish the user's password, then exfiltrated files. In a SlowMist audit case, poisoned MCP output made an agent call a wallet plugin to transfer funds — [SlowMist × Bitget](https://www.bitget.com/blog/articles/slowmist-bitget-security-research)
- **Grok / Bankr "Morse code" (4 May 2026, Base)**:
  - Mechanism: the attacker posted a Morse-encoded "transfer all DRB" instruction. Grok decoded it and replied publicly, tagging @bankrbot, which executed it from the wallet Bankr auto-provisions for any X account (including Grok's). About 3B DRB moved (about $150k–$200k).
  - Single-source claim: the attacker first gifted Grok a Bankr Club NFT to unlock transfer permissions.
  - Aftermath: about 80% of funds were returned, and Bankr shut off Grok interactions.
  - Blockaid's H1 2026 report calls a "$216,000 Bankr hack" the first exploit of this class (prompt injection → tool abuse → unauthorized signing). It is unclear whether that is the same event.
  - Sources: [CryptoSlate](https://cryptoslate.com/how-one-trader-exploited-grok-and-morse-code-to-trick-ai-agent-into-sending-billions-of-crypto-tokens-from-a-verified-wallet/?rand=6792); [OECD.AI incident](https://oecd.ai/en/incidents/2026-05-04-4a73); [NeuralTrust](https://neuraltrust.ai/blog/grok-morse-code); [airdropalert](https://airdropalert.com/blogs/ai-wallet-exploit-grok-bankr/); [GNcrypto/Blockaid](https://www.gncrypto.news/news/212-on-chain-exploits-stole-1-1b-h1-2026-blockaid/)
- **Agent/dev supply chain (2026)**:
  - Injective npm SDK backdoor (8 Jul 2026, 18 packages) stole seed phrases and keys — [StepSecurity](https://www.stepsecurity.io/blog/injective-npm-supply-chain-attack-18-packages-backdoored-to-steal-crypto-wallet-keys)
  - Kaspersky Securelist published a malicious-MCP-server PoC that steals wallet files — [Securelist](https://securelist.com/model-context-protocol-for-ai-integration-abused-in-supply-chain-attacks/117473/)
  - OX Security reported an Aug 2026 wave of 440+ malicious npm packages via the official MCP Registry, including a fake "crypto chain security" server (single secondary source) — [Reflectiz](https://www.reflectiz.com/blog/7-biggest-supply-chain-attacks-2026/)
  - Trojanized Trust Wallet extension: about $8.5M lost — [Reflectiz](https://www.reflectiz.com/blog/7-biggest-supply-chain-attacks-2026/)
- Unverified aggregate: a KuCoin blog attributes more than $45M in incidents to "AI trading agent vulnerabilities" (methodology unclear; low confidence) — [KuCoin](https://www.kucoin.com/blog/en-ai-trading-agent-vulnerability-2026-how-a-45m-crypto-security-breach-exposed-protocol-risks)

**Benchmarks of LLM reliability**
- **DeFiFlowBench** (arXiv 2609.11504, 10 Sep 2026): 207 prompts, 75 held out. Direct, constrained and few-shot prompting each produced **14–19 unsafe held-out executions** under a 5% price-impact cap. The hybrid "Koan-Safe" system (enforced policy layer) recorded 0 unsafe executions on saved outputs; disabling enforcement brought back 14–17. Permissive existing slippage thresholds could still authorize unsafe trades — [arXiv](https://arxiv.org/abs/2609.11504)
- **ChainClaw** (arXiv 2608.05790, Aug 2026): names three gaps for LLM agents on-chain (Reactivity, Irreversibility, Observability). Proposes layers for event-driven orchestration, simulation-based safety (pre-execution simulation + action guard) and on-chain monitoring. Reports it beats baselines on its own 7-task benchmark; no numbers in the abstract — [arXiv](https://arxiv.org/abs/2608.05790)
- **CryptoBench** (arXiv 2512.00417, v5 May 2026): raw model capability "does not directly translate" into effective agentic execution (analysis tasks, not signing) — [arXiv](https://arxiv.org/abs/2512.00417)
- **Finance Agent Benchmark** (arXiv 2508.00828) [older]: best models stay below about 50% accuracy on real-world financial tasks — [arXiv](https://arxiv.org/pdf/2508.00828)
- **Nof1 Alpha Arena**, live trading with $10k per model on Hyperliquid perps:
  - Season 1 [older, Oct–Nov 2025]: Qwen3-Max +22.3%, DeepSeek V3.1 +4.9%, Claude Sonnet 4.5 −30.8%. GPT-5 and Gemini 2.5 Pro were down more than 28% mid-season, and more than half the models finished in the red.
  - Season 1.5: Grok 4.20 won (+12% avg), ahead of GPT-5.1 and Gemini 3.
  - Sources: [Decrypt](https://decrypt.co/345006/ai-crypto-trading-showdown-deepseek-grok-winning-gemini-implodes); [Forklog](https://forklog.com/en/four-out-of-six-ai-models-suffer-losses-in-trading-tournament/); [Forklog S1.5](https://forklog.com/en/ai-model-grok-4-2-triumphs-in-trading-tournament/)

**Guardrail best practice (industry / research consensus)**
- SlowMist × Bitget (18 Mar 2026) list seven threat classes:
  - prompt/indirect injection (READMEs, Markdown)
  - skill/plugin/MCP supply-chain poisoning
  - orchestration tampering (e.g. swapped target addresses)
  - secret leakage into context (.env, mnemonics)
  - model hallucination (wrong IDs or amounts)
  - irreversible high-value operations
  - high-privilege shell access turning the agent into a RAT
  
  Recommended controls:
  - The agent builds only *unsigned* transactions; signing happens in an independent wallet or with human confirmation.
  - Least privilege, with withdrawals disabled for trading keys.
  - Sub-accounts funded with a hard loss cap.
  - IP allowlists.
  - Plugin isolation: no single component combines data access, decision and fund movement.
  - Pre-transaction address reputation, AML screening and simulation.
  - Never treat external content as instructions.
  - Dual-channel alerts, and "revoke the key first, investigate afterward".
  - SlowMist's L1–L5 layered governance model.
  - Sources: [Bitget blog](https://www.bitget.com/blog/articles/slowmist-bitget-security-research); [SlowMist framework coverage](https://ct.com/news/slowmist-security-framework-autonomous-ai-agents-crypto)
- Trail of Bits research reportedly shows agents escaping VMs repeatedly and advises treating such agents like an APT. It also describes "line jumping", where MCP tool descriptions reach the model before any approval prompt (secondary coverage) — [hoge.gg](https://hoge.gg/trail-of-bits-ai-agents-crypto-security-2026/); [DEV threat model](https://dev.to/wumb0lover/your-ai-agent-has-a-bitcoin-wallet-here-is-the-threat-model-ln9)
- "Spending limits should be enforced where the key is used, never in the prompt". Circuit breakers belong in the wallet permission layer (an example agent fired 400 swaps in 30 seconds) — [DEV](https://dev.to/wumb0lover/your-ai-agent-has-a-bitcoin-wallet-here-is-the-threat-model-ln9); [rpcfast](https://rpcfast.com/blog/ultimate-guide-solana-ai-agents)
- FINRA's 2026 Annual Regulatory Oversight Report (Dec 2025) adds a GenAI/agentic section with these controls: human oversight, permission limits, action tracking, access monitoring, and safeguards against hallucination and "rogue" behaviour — [McGuireWoods](https://www.mcguirewoods.com/client-resources/alerts/2025/12/finras-2026-annual-regulatory-oversight-report-same-priorities-new-focus-on-ai-and-cybersecurity/); [Sidley](https://datamatters.sidley.com/2025/12/16/finra-issues-2026-regulatory-oversight-report/)
- Related 2026 arXiv work (titles only, not read): "Parallax: Why AI Agents That Think Must Never Act" (2604.12986) and "Hardware Keystores for AI Agent Signing Workflows: A Zero-Trust MCP Enforcement Architecture" (2608.06130) — [arXiv 2604.12986](https://arxiv.org/pdf/2604.12986); [arXiv 2608.06130](https://arxiv.org/pdf/2608.06130)

### Inferences
- DeFiFlowBench's 14–19 unsafe out of 75 held-out cases means roughly **19–25% of naive LLM-generated DeFi workflows were unsafe**. With a deterministic enforcement layer that dropped to 0. This is the strongest quantitative argument for "LLM proposes, policy engine disposes".
- Mapping incidents to controls:
  - Freysa / Bankr: no out-of-band policy. A per-tx cap plus a recipient allowlist would have blocked both.
  - AIXBT: operator-console security (2FA, no prompt queueing from the admin UI without a second approver).
  - Lobstar: unit/decimal validation, plus a "percentage of balance" cap in deterministic code.
  - Princeton: memory provenance (signed or trusted-source tagging, no write-through of social content into long-term memory).
  - ClawHub/MCP: pinned, audited tool registry with no third-party skills in the signing process.
- Minimum guardrail stack for the bot:
  1. Typed tool schemas.
  2. Deterministic transaction builder (no LLM-written calldata).
  3. Simulation plus a balance-delta check against declared intent (Blockaid/Tenderly).
  4. Protocol/contract/function allowlist.
  5. Per-tx, daily and %-of-portfolio caps enforced on-chain or in a TEE.
  6. Recipient allowlist for transfers.
  7. Sanctions/address screening.
  8. Step-up human confirmation above thresholds or for new contracts/recipients.
  9. Kill switch with instant session-key revocation.
  10. Immutable audit log.

### Gaps
- No authoritative aggregate of AI-agent-specific losses in 2026.
- No official Bankr or xAI post-mortem was found. Amounts and NFT details differ across secondary sources.
- The DeFiFlowBench abstract does not name the LLMs tested, and per-model execution-accuracy data for DeFi transactions was not found.
- The Trail of Bits primary report and CertiK agent-specific guidance were not located.

---

## Q4. Regulatory landscape

### Takeaway
**US.** The stablecoin law (GENIUS Act) is in force and takes effect by 18 Jan 2027. Market-structure legislation (CLARITY, including BRCA developer protections) **failed cloture on 15 Sep 2026** and is stalled into 2027. The SEC's April 2026 staff statement shields *passive* non-custodial front-ends from broker-dealer registration, but explicitly excludes recommendations, execution and routing. An AI agent that suggests trades or executes them falls outside that safe harbour. OFAC's Dec 2025 Exodus settlement shows that non-custodial front-ends carry sanctions-screening exposure.

**EU.** The MiCA transition ended 1 Jul 2026. A non-custodial wallet *software* provider is out of scope, but a company-run agent that gives advice or executes or manages portfolios on users' behalf likely performs CASP services.

**UK.** The FCA regime is final (effective 25 Oct 2027; gateway open now).

**UAE.** The new CBUAE law pulls DeFi infrastructure into licensing (transition ended Sep 2026).

**Singapore.** Will not license offshore-only token services.

### Cited Findings

**United States**
- **GENIUS Act** (signed July 2025): effective on the earlier of 18 Jan 2027 or 120 days after final regulations. OCC final rule announced about 21 Oct 2026, effective 18 Jan 2027; its AML/BSA/sanctions provisions are left to a separate Treasury-coordinated rulemaking. Treasury issued an interim final rule on 30 Sep 2026. Fed proposals take comments until 30 Nov 2026. The FinCEN/OFAC AML rule is still pending. The OCC is reassessing stablecoin "rewards" against the GENIUS yield ban — [OCC NR 2026-92](https://www.occ.gov/news-issuances/news-releases/2026/nr-occ-2026-92.html); [OCC Bulletin 2026-50](https://www.occ.gov/news-issuances/bulletins/2026/bulletin-2026-50.html); [CoinDesk 21 Oct 2026](https://www.coindesk.com/policy/2026/10/21/occ-s-final-rule-to-start-fresh-in-weighing-stablecoin-rewards-against-genius-act-ban); [eco.com tracker](https://eco.com/support/en/articles/15606775-genius-act-1-year-implementation-tracker-where-things-actually-stand)
- **CLARITY Act**:
  - Passed the House 294–134 (17 Jul 2025). Senate Banking advanced it 15–9 (May 2026).
  - **Senate cloture on the motion to proceed failed 49–50 on 15 Sep 2026** (60 needed). All Democrats voted no, plus Collins, Hawley and Moran; Tillis switched to no to preserve a motion to reconsider.
  - Disputes included ethics rules for officials, stablecoin yield, DeFi developer liability, illicit finance, and state preemption (18 state AGs opposed).
  - Lummis called it dead. The House returns in Nov 2026, and unenacted bills must be reintroduced in the 120th Congress (Jan 2027).
  - Sources: [CNBC](https://www.cnbc.com/2026/09/15/senate-cloture-vote-on-clarity-act-fails-dealing-regulatory-setback-to-crypto-industry.html); [DLA Piper](https://www.dlapiper.com/en/insights/publications/2026/09/senate-fails-to-advance-the-clarity-act); [Latham tracker](https://www.lw.com/en/us-crypto-policy-tracker/legislative-developments)
- **Blockchain Regulatory Certainty Act**: would bar treating a developer as a money transmitter unless it has, in the regular course of business, control over users' digital assets. It was folded into CLARITY as §604, with standalone versions H.R.3533 (May 2025) and S.3611 (12 Jan 2026). Not law — [Congress.gov H.R.3533](https://www.congress.gov/bill/119th-congress/house-bill/3533/text); [Congress.gov S.3611](https://www.congress.gov/bill/119th-congress/senate-bill/3611/text); [DeFi Education Fund](https://www.defieducationfund.org/brca/)
- **Developer criminal exposure**: Roman Storm (Tornado Cash) was convicted on the unlicensed money transmitting count [older, Aug 2025]. The retrial on the hung money-laundering and sanctions counts moved to **26 Apr 2027**, and a judgment-of-acquittal motion is pending — [The Block](https://www.theblock.co/news/regulation/2026-08-26-tornado-cash-roman-storm-retrial-april-2027-412761); [Cointelegraph](https://cointelegraph.com/news/roman-storm-retrial-delayed-april-2027)
- **SEC staff statement on "Covered User Interfaces"** (Division of Trading & Markets, 13 Apr 2026):
  - Covers front-ends (web, extensions, apps) that help users build and submit transactions from **self-custodial** wallets for crypto asset securities. Staff won't object to operating without broker-dealer registration if **11 conditions** are met.
  - Conditions include: no holding of user funds, no soliciting specific trades, execution options based on objective criteria, and no labelling a route "best price" or "most reliable".
  - Transaction-based fees are allowed; PFOF is prohibited.
  - The relief does **not** cover providers that make recommendations, negotiate, arrange financing, handle funds, execute or settle transactions, or route orders.
  - The statement has no legal force, is withdrawn after 5 years absent Commission action, and likely does not preempt state broker-dealer law.
  - Sources: [Jones Day](https://www.jonesday.com/en/insights/2026/04/sec-staff-carves-out-a-path-crypto-interface-providers-may-not-be-brokerdealers); [Chapman](https://www.chapman.com/publication-sec-staff-provides-clarity-on-broker-dealer-registration-for-certain-crypto-asset-securities-user-interfaces); [McDermott](https://www.mcdermottlaw.com/insights/secstatement-broker-dealer-registration-crypto-user-interfaces/); [Sidley](https://www.sidley.com/en/insights/newsupdates/2026/04/us-sec-clears-path-for-decentralized-crypto-asset-security-trading); [Dechert](https://www.dechert.com/knowledge/onpoint/2026/4/sec-staff-provides-relief-for-crypto-wallet-interfaces.html); [WilmerHale](https://www.wilmerhale.com/en/insights/client-alerts/20260417-sec-staff-issues-broker-dealer-registration-guidance-for-certain-user-interfaces)
- **SEC "Regulation Crypto Assets"** (proposed 18 Aug 2026; DLA Piper also references 11 Sep 2026):
  - Offering exemptions: a $5M "startup" tier over 4 years and a $75M per year tier.
  - A bespoke disclosure regime.
  - A safe harbour for when a token is no longer subject to an investment contract (the issuer certifies it has ceased essential managerial efforts).
  - It does not address DeFi front-ends or agents.
  - Sources: [SEC Atkins statement](https://www.sec.gov/newsroom/speeches-statements/atkins-statement-regulation-crypto-assets-081826); [CRS LSB11480](https://www.congress.gov/crs-product/LSB11480); [WilmerHale](https://www.wilmerhale.com/en/insights/client-alerts/20260831-a-step-towards-clarity-sec-proposes-regulation-crypto-assets)
- **Investment advice / AI**: there is no AI-specific SEC rule. The SEC withdrew 14 proposed rules in June 2025, including the predictive-data-analytics (AI conflicts) proposal. The Advisers Act still applies (fiduciary duty, marketing, recordkeeping), and robo-advisers are an existing registered category. FINRA's 2026 report applies existing supervision, communications and fair-dealing rules to GenAI and adds agentic-AI controls. SEC 2026 exam priorities dropped crypto, while FINRA keeps digital assets as a focus — [ncontracts](https://www.ncontracts.com/nsight-blog/investment-advisers-artificial-intelligence); [ABA](https://www.americanbar.org/groups/senior_lawyers/resources/voice-of-experience/2025-april/what-lawyers-should-know-about-robo-advisors/); [McGuireWoods](https://www.mcguirewoods.com/client-resources/alerts/2025/12/finras-2026-annual-regulatory-oversight-report-same-priorities-new-focus-on-ai-and-cybersecurity/)
- **Sanctions**:
  - OFAC's $3.1M settlement with Exodus (Dec 2025), a US **non-custodial** software wallet, rested on the wallet acting as a front-end to third-party swap services and earning per-transaction fees while sanctioned-jurisdiction users transacted. Support staff suggesting VPNs to get past geo-blocking was an aggravating factor. Sanctions liability is strict.
  - Tornado Cash was delisted in March 2025 after the 5th Circuit (Van Loon, Nov 2024) held that immutable smart contracts aren't "property" [older].
  - Sources: [DLA Piper, Feb 2026](https://www.dlapiper.com/insights/publications/2026/02/ofac-sanctions-enforcement-in-fintech-and-crypto); [Elliptic](https://www.elliptic.co/corpus/gen-2864/legal-governance-risk-management-and-compliance/ofac-digital-asset-screening.html); [nhimg/Chainalysis](https://nhimg.org/articles/ofac-crypto-sanctions-are-reshaping-wallet-screening-and-compliance/)

**European Union**
- **MiCA transition**: the outer deadline for grandfathered CASPs was **1 Jul 2026**, with no extension mechanism. NL, FI, LV, HU and SI used 6 months; SE used 9. A pending application ≠ authorisation (Art. 63). ESMA told unauthorised CASPs to wind down in an orderly way, and reportedly said this applies to B2B services such as delegated custody too. Register counts conflict: about 213 (pre-deadline), 280 (3 Jul 2026), about 370 including Art. 60 notifying banks (Oct 2026) — [Elliptic](https://www.elliptic.co/blog/the-end-of-micas-transitional-period); [AMF/ESMA statement](https://www.amf-france.org/en/news-publications/news/esma-public-statement-esma-calls-unauthorised-crypto-asset-service-providers-wind-down-orderly-while); [zyphe](http://zyphe.com/resources/news/mica-transitional-period-ends-july-2026); [Euronews](https://www.euronews.com/business/2026/06/24/europes-crypto-reset-mica-creates-a-single-market-as-hundreds-of-firms-face-exit)
- **MiCA perimeter (regulation text)**:
  - Art. 3(1)(16) lists the CASP services: custody/administration; trading platform; exchange for funds or other crypto-assets; **execution of orders on behalf of clients**; placing; **reception and transmission of orders**; **providing advice**; **portfolio management**; transfer services.
  - Recital 22 excludes services provided in a "fully decentralised manner without any intermediary".
  - Recital 83 says providers of hardware or software for **non-custodial wallets** should not fall within scope.
  - Source: [Regulation (EU) 2023/1114, EUR-Lex](https://eur-lex.europa.eu/eli/reg/2023/1114/oj)
- No ESMA or NCA guidance or law-firm analysis was found that specifically classifies AI agents. One vendor guide asserts that an autonomous agent executing transactions for EU users needs a CASP licence (not authoritative) — [gmtasoftware](https://www.gmtasoftware.com/blog/develop-a-crypto-ai-agent/); [Aurum Law 2026 outlook](https://aurum.law/newsroom/digital-assets-2026-nine-trends-that-shape-web3-a-legal-practitioners-view)
- **EU AI Act**: the AI Omnibus, Regulation (EU) 2026/1744 (OJ 24 Jul 2026, in force 27 Jul 2026), moved Annex III high-risk obligations (incl. credit scoring) from 2 Aug 2026 to **2 Dec 2027**, and Annex I-embedded systems to 2 Aug 2028. Prohibited practices, AI literacy, GPAI duties and **Art. 50 transparency** (disclosing that users interact with AI) are unchanged — [Addleshaw Goddard](https://www.addleshawgoddard.com/en/insights/insights-briefings/2026/technology/eu-ai-act-ai-omnibus-formally-adopted/); [NatLawReview](https://natlawreview.com/article/eu-digital-omnibus-ai-enters-force); [CSA](https://labs.cloudsecurityalliance.org/research/csa-research-note-eu-ai-act-high-risk-deadline-omnibus-20260/)

**United Kingdom**
- The FCA published final crypto rules on 30 Jun 2026 (PS26/9–PS26/13; PS26/11 covers regulated activities: trading platforms, dealing, arranging, lending/borrowing, safeguarding, staking, DeFi approach). The regime applies from **25 Oct 2027**, and the **authorisation gateway is open 30 Sep 2026 – 28 Feb 2027**. On DeFi, the rules apply only where there is an **identifiable controlling entity**; further DeFi guidance will come by consultation. Lending protections: appropriateness tests, express consent, over-collateralisation, negative-balance protection. Until 2027 the FCA's hooks are MLR registration and the financial-promotions regime — [FCA press release](https://www.fca.org.uk/news/press-releases/fca-sets-landmark-crypto-rules-cement-uks-place-global-hub); [FCA PS26/11](https://www.fca.org.uk/publication/policy/ps26-11.pdf); [Skadden, Oct 2026](https://www.skadden.com/insights/publications/2026/10/uks-fca-finalises-cryptoasset-perimeter-guidance); [Travers Smith](https://www.traverssmith.com/knowledge/knowledge-container/can-we-finally-summit-all-up-the-fcas-cryptoasset-regime-largely-emerges-from-the-clouds/)

**Singapore**
- Under the DTSP regime (FSMA Part 9, from 30 Jun 2025 [older]), Singapore-based firms providing token services only overseas must be licensed, and MAS said it would generally not grant such licences. One secondary source says agentic AI falls under MAS's existing principles-based AI Risk Management Guidelines, with no separate agent regime — [MAS response to DTSP consultation](https://www.mas.gov.sg/-/media/response-to-feedback-received-from-dtsp-cp.pdf); [cryptonite.ae](https://cryptonite.ae/global/agentic-ai-regulation-mas-singapore-bank-rules/) (secondary)

**UAE**
- Federal Decree-Law No. 6 of 2025 (the new CBUAE law, effective 16 Sep 2025) reportedly brings protocols, DeFi platforms, middleware and infrastructure that "enable" payments, exchange, lending, custody or investment services into CBUAE licensing (Arts. 61–62). The transition for existing operators ran to **Sep 2026**. Fines go up to AED 1bn. Self-custody wallets are not banned — [Cointelegraph](https://cointelegraph.com/news/uae-new-financial-law-defi-regulatory-scope); [Gibson Dunn](https://www.gibsondunn.com/wp-content/uploads/2025/11/uae-central-bank-issues-new-central-bank-law-consolidating-financial-sector-regulation.pdf); [Sumsub](https://sumsub.com/media/news/new-uae-law-applies-regulatory-oversight-to-defi-and-web3-projects/)
- Dubai VARA (Dubai Law No. 4 of 2022) passed 50 licensed VASPs on 29 Jun 2026. Claims of specific VARA "AI trading bot" rules from Q2 2026 are unverified (law-firm marketing) — [Aiying](https://license.aiying.cc/en/uae1/dubai-vara-50-vasp-landscape-sg-hk-comparison/); [cryptoverselawyers](https://www.cryptoverselawyers.io/vara-2026-roadmap-ai-trading-bots-licensing-dubai/)

**AML / KYC (global)**
- FATF's 7th Targeted Update on VAs/VASPs (16 Jul 2026) prioritises Travel Rule enforcement, unhosted-wallet P2P risk, offshore VASPs, stablecoins and DeFi arrangements. Travel Rule laws exist in about 93% of surveyed jurisdictions, but many have never enforced them (e.g. 55 of 91 with no supervisory action, per one summary) — [FATF 7th update (FIAU mirror)](https://fiaumalta.org/app/uploads/2026/07/7th-targeted-update-on-implementation-fatf-standards-vas-vasps-2026.pdf.coredownload.pdf); [Notabene](https://notabene.id/post/fatfs-seventh-targeted-update-on-virtual-assets); [CMS](https://cms.law/en/int/regulatory-news/fatf-targeted-update-on-implementation-of-the-fatf-standards-on-virtual-assets-and-vasps)

### Inferences
- **US**:
  - A bot that only *assembles* user-initiated transactions from a self-custodial wallet, with neutral route presentation, maps onto the SEC CUI relief (for securities tokens).
  - Once the AI *recommends* specific trades or *executes* autonomously under a delegated session key, it falls into the statement's explicit carve-outs (recommendations, execution, routing). It then risks broker-dealer and/or investment-adviser status for any security tokens, plus CFTC issues for derivatives/perps.
  - For non-security tokens, the main federal exposure is FinCEN money-transmission (mitigated if the operator never has "control", the BRCA logic, which is not law) and OFAC strict liability (screen addresses, geo-block, and don't coach users around blocks, per Exodus).
- **EU**:
  - A truly user-run, self-hosted agent is software, which is arguably within Recital 83.
  - A company-operated agent that suggests trades ("advice"), takes user instructions and submits them ("reception and transmission" or "execution of orders on behalf of clients"), or rebalances under a standing mandate ("portfolio management") very likely needs a CASP authorisation even without custody. Non-custody removes only the custody service, not the others.
  - Recital 22 "fully decentralised" is unlikely to apply to a company-run bot with fees and a front-end.
- **Design levers that reduce regulatory surface**:
  - User-initiated actions with explicit per-transaction confirmation (no discretionary mandate).
  - Neutral, criteria-based routing with no "best" labelling.
  - No custody or control of keys or session keys (session keys held client-side or in a user-owned TEE).
  - No payment for order flow.
  - Sanctions screening and geo-fencing.
  - Clear "not investment advice" positioning backed by product design, not just a disclaimer.
  - An EU AI Act Art. 50 AI-interaction disclosure.
- **Timing**: US market-structure certainty is unlikely before 2027. Plan for the SEC staff statement + GENIUS + OFAC/FinCEN as the operative US framework. In the UK, operating a bot that "arranges" or "deals" for UK users will need FCA authorisation from 25 Oct 2027 (apply in the current gateway).

### Gaps
- No regulator (SEC, ESMA, FCA, MAS) guidance specifically addressing **AI agents executing DeFi transactions** was found as of Oct 2026.
- The full text of the SEC CUI statement's 11 conditions was not read; the list comes from law-firm summaries.
- The CFTC position on AI agents and perps/DeFi derivatives was not researched.
- UK FCA PS26/11 DeFi and staking specifics were not read in full.
- VARA rulebook text on automated or AI trading was not verified.
- Exact OFAC Exodus enforcement release date and amount are as reported by DLA Piper, not the OFAC release itself.

---

## Q5. LLM model considerations: models, latency/cost, fine-tuning, hallucination mitigation

### Takeaway
Frontier models are interchangeable for intent parsing. None is reliable enough to sign directly. Live-trading contests show large variance and losses across GPT, Gemini and Claude, and benchmarks show high rates of unsafe execution without a policy layer. Recommended pattern: a mid-tier model for NLU and tool selection, typed tool calls with small scoped tool sets, deterministic transaction construction and validation, and an optional fine-tuned or classifier layer for injection and memory-poisoning defence. Token costs are minor next to gas and slippage.

### Cited Findings
- Models seen in live crypto trading (Alpha Arena): Qwen3-Max, DeepSeek V3.1, Claude Sonnet 4.5, GPT-5, Gemini 2.5 Pro, Grok 4 (S1); Grok 4.20, GPT-5.1, Gemini 3 (S1.5). Outcomes ranged from +22% to −31%, with heavy losses for several frontier models — [Decrypt](https://decrypt.co/345006/ai-crypto-trading-showdown-deepseek-grok-winning-gemini-implodes); [Forklog](https://forklog.com/en/ai-model-grok-4-2-triumphs-in-trading-tournament/)
- Tool-set size matters: Solana Agent Kit V1 loaded about 60 tools into context and caused hallucinations. V2 scopes tools by plugin — [Medium CTO guide](https://medium.com/@yavorovych/building-ai-agents-for-solana-in-2026-a-ctos-tool-guide-d30cee7ba2f5)
- Deterministic execution pattern: the LLM suggests trades, and deterministic code sends orders and enforces risk limits. An arXiv survey expects "bounded autonomy" (agents do signal synthesis and order preparation, not autonomous large-scale trading) — [Medium](https://medium.com/@gwrx2005/from-trading-bot-to-trading-agent-how-to-build-an-ai-based-investment-system-313d4c370c60); [arXiv 2603.13942](https://arxiv.org/pdf/2603.13942)
- Fine-tuning as a defence: in CrAIBench, fine-tuning-based defences "substantially reduce attack success rates while preserving performance on single-step tasks", while prompt-level defences were weak against memory injection — [arXiv 2503.16248](https://arxiv.org/abs/2503.16248)
- An enforced policy cap beats prompting: DeFiFlowBench shows 0 vs 14–19 unsafe executions (see Q3) — [arXiv 2609.11504](https://arxiv.org/abs/2609.11504)
- ElizaOS core added prompt batching and caching (Mar 2026), a cost and latency optimisation — [elizaos.news](https://elizaos.news/daily/2026-03-22/)
- API pricing snapshot (secondary, **verify against provider pages**), IntuitionLabs, updated 5 Sep 2026, per 1M tokens in/out:
  - GPT-6 Astra $10/$50; GPT-5.6 Luna $0.20/$1.20
  - Claude Opus 5 $5/$25; Claude Haiku 4.5 $1/$5
  - Gemini 3.1 Pro Preview $2/$12 (≤200K context); Gemini 3.5 Flash-Lite $0.30/$2.50
  - DeepSeek V4 Pro $1.32/$3.96 and V4 Flash $0.14/$0.28 (Together AI hosting)
  - Grok 4.6 $2/$6
  - Qwen3.8 (Together) $2.50/$6.25
  - "Fast" modes cost about 2× for lower latency (Anthropic says up to 2.5× faster for Opus 5).
  - A different IntuitionLabs page (search snippet dated 10 Oct 2026) lists other model names and prices (e.g. Claude Opus 5.5 $4/$20, Sonnet 5.5 $2/$10), so the sources conflict.
  - Sources: [IntuitionLabs](https://intuitionlabs.ai/articles/llm-api-pricing-cost-per-task-comparison); [fungies.io](https://fungies.io/llm-api-pricing-comparison-cost-optimization-guide-2026/)

### Inferences
- Cost: a typical intent turn (about 5–10k input tokens with tool schemas, under 1k output) costs well under $0.10 on mid-tier models and around $0.01 or less on small models. That is negligible next to L1 gas or slippage, so pick models for tool-call reliability and injection robustness, not price. A two-tier design works: a cheap model for chat and classification, and a stronger model for intent extraction in high-value flows.
- Hallucination controls:
  - JSON-schema/function-calling outputs only.
  - Resolve token symbols to canonical addresses from a vetted token list, never from LLM memory.
  - Do all decimal/unit conversion in code (the Lobstar lesson).
  - Echo-back confirmation of parsed intent ("Swap 100 USDC → ETH on Base, max 0.5% slippage").
  - Simulate and compare the balance delta against intent.
  - Reject when they mismatch.
- Untrusted content (X posts, web pages, token metadata, MCP tool outputs) should run through a separate, non-privileged context or model with no access to signing tools (the dual-LLM / "think vs act" split).
- Fine-tuning on DeFi data is most defensible for safety classification (injection detection, intent normalisation) rather than for trading alpha. No evidence was found that DeFi-specific fine-tunes beat frontier models at execution.

### Gaps
- No credible public data on which LLMs production DeFi agents use (Bankr, Virtuals, Coinbase demos and others don't disclose consistently).
- No measured latency benchmarks (time-to-first-token or tool-call round-trip) for crypto agent workloads were found.
- No peer-reviewed results on DeFi-specific fine-tuned models for transaction execution were found.
- LLM pricing figures are from secondary aggregators with internal conflicts. Official provider pages were not checked.
