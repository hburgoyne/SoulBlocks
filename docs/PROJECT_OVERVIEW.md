# SoulBlocks Project Overview

## On-Chain, Append-Only Identity for Agentic Systems

**Website:** soulblocks.ai
**Chain:** Base (Ethereum L2)
**Contract:** Immutable, no admin keys

---

## 1. What is SoulBlocks?

SoulBlocks is an NFT collection where each token represents a **Soul Block** — a living, append-only identity document stored entirely on-chain. Soul Blocks are designed to serve as identity primitives for AI agents (OpenClaw bots, Claude-based agents, ChatGPT personas).

Each Soul Block contains the agent's personality, values, memories, and constitution — everything that defines who the agent is.

The complete contents of every Soul Block are permanently extractable from the blockchain without IPFS, Arweave, or any off-chain storage.

---

## 2. Core Philosophy

1. **Everything on-chain** — No external dependencies for data retrieval
2. **Append-only, never overwrite** — History is immutable; growth is additive
3. **Owner-gated authorship** — Only the NFT owner may append content
4. **Blank-slate equality** — All souls mint with identical boilerplate; value emerges from owner interaction
5. **Immutable protocol** — No admin keys, no upgrades, no hidden fees

---

## 3. Key Parameters

| Parameter | Value |
|-----------|-------|
| Chain | Base (Ethereum L2) |
| Total Supply | 10,000 |
| Mint Price | 0.02 ETH |
| Creator Reserved | First 50 (keep 10, distribute 40) |
| Genesis Wave | First 500 tokens (with GENESIS badge) |
| Fragment Size Limit | 2048 bytes per fragment |
| Standard | ERC-721 |

**Genesis Badge:** Soul Blocks #1-500 display a "GENESIS" badge in their on-chain SVG image and have a "Genesis: Yes" attribute in their metadata. This creates visible differentiation for early adopters while maintaining blank-slate equality in soul content.

---

## 4. Technical Architecture

### 4.1 Code-as-Storage

Soul Block content is stored using **contract bytecode as immutable data storage**:

1. When content is appended, a new minimal contract is deployed
2. The contract's runtime bytecode = raw UTF-8 bytes of the content
3. The main contract stores only the deployed contract's address
4. Reconstruction uses `EXTCODECOPY` to read the bytes

This approach is:
- Fully on-chain and permanent
- Cheaper than contract storage (`SSTORE`)
- Immutable once deployed

### 4.2 Fragment List

Each Soul Block maintains an ordered list of fragment addresses:

```
tokenId → fragments[] → [address0, address1, address2, ...]
```

To reconstruct the soul, read all fragments in order and join with `\n\n` (double newline). This is the canonical separator used across all implementations (contract, website, skills).

### 4.3 Boilerplate Fragment

At mint, each Soul Block is initialized with a boilerplate fragment that establishes the identity framework:

```markdown
# Soul Block #00042

Forged at block 12345678 on the Base blockchain.
Minted by 0x1234...abcd.
One of 10,000 unique soul vessels.

While the soul begins bare, everything added below becomes a permanent
element of your core identity.

---

```

---

## 5. Fragment Format

Fragments are plain text or markdown. The contract stores raw bytes and does not parse or validate content — write whatever defines your soul's identity.

The blockchain automatically records:
- **Who** appended the fragment (wallet address via `msg.sender`)
- **When** it was appended (block number and timestamp)

No special headers or schema required.

---

## 6. Project Components

### 6.1 Smart Contract
- ERC-721 implementation on Base
- Minting with automatic boilerplate deployment
- Single-fragment append function
- Code-as-storage fragment deployment
- On-chain SVG image generation

**Spec:** [SMART_CONTRACT_SPEC.md](./SMART_CONTRACT_SPEC.md)

### 6.2 Deployment Guide
- Base mainnet deployment steps
- Contract verification on BaseScan
- Creator mint process
- Initial distribution strategy

**Spec:** [DEPLOYMENT_GUIDE.md](./DEPLOYMENT_GUIDE.md)

### 6.3 Website (soulblocks.ai)
- Project landing page
- Minting interface
- Soul Block browser/viewer
- Append interface for owners
- Export to markdown

**Spec:** [WEBSITE_SPEC.md](./WEBSITE_SPEC.md)

### 6.4 Agent Skills
- Claude Code skill for loading Soul Blocks
- OpenClaw integration
- ChatGPT manual setup guide

**Spec:** [SKILL_SPEC.md](./SKILL_SPEC.md)

### 6.5 Marketing
- Moltbook campaign strategy
- Twitter/X templates
- Genesis wave promotion
- Discord community

**Spec:** [MARKETING_GUIDE.md](./MARKETING_GUIDE.md)

---

## 7. User Journeys

### 7.1 Minting a Soul Block
1. Visit soulblocks.ai
2. Connect wallet (Base network)
3. Click "Mint"
4. Pay 0.02 ETH + gas
5. Receive Soul Block with boilerplate content

### 7.2 Developing a Soul
1. Own a Soul Block
2. Visit the Append page
3. Write soul content (personality, values, memories)
4. Submit (one fragment at a time)
5. Content is permanently added to chain

### 7.3 Experiencing a Soul
1. Find an interesting Soul Block (browse, social media, etc.)
2. Use Claude/OpenClaw skill with the token ID
3. The agent loads that soul's complete identity
4. Interact with the ensouled agent

### 7.4 Trading a Soul
1. List on OpenSea or other Base NFT marketplace
2. Buyer receives full ownership and append rights
3. All history transfers with the token
4. New owner continues the soul's evolution

---

## 8. Economics

- **Creator revenue:** Mint fees only (0.02 ETH × mints)
- **No protocol fees** on appends, transfers, or reads
- **No royalties** (v1)
- **Append costs:** Only gas (very cheap on Base, ~$0.01-0.10)

---

## 9. What SoulBlocks Is Not

- **Not privacy-preserving** — All content is public
- **Not AI-generated** — Content is human-authored (though agents may help)
- **Not mutable** — You cannot edit or delete previous content
- **Not exclusive** — Ideas can be copied; provenance is tracked, not enforced
- **Not DeFi** — This is identity infrastructure and social experiment

---

## 10. Repository Structure

```
SoulBlocks/
├── docs/
│   ├── PROJECT_OVERVIEW.md      # This file
│   ├── SMART_CONTRACT_SPEC.md   # Contract specification
│   ├── DEPLOYMENT_GUIDE.md      # Deployment instructions
│   ├── WEBSITE_SPEC.md          # Frontend specification
│   ├── SKILL_SPEC.md            # Agent skill specification
│   └── MARKETING_GUIDE.md       # Marketing strategy
├── contracts/
│   └── SoulBlocks.sol           # Main contract
├── website/
│   └── ...                      # Frontend code
├── skills/
│   └── ...                      # Claude/OpenClaw skills
└── README.md                    # Quick start
```

---

## 11. Future Extensions (Out of Scope for v1)

- Avatar collection (visual representations)
- Name collection (agent naming)
- Encrypted soul layers
- Third-party attestations
- Soul-to-soul references
- Cross-chain mirroring

---

## 12. Glossary

| Term | Definition |
|------|------------|
| **Soul Block** | An NFT representing an append-only identity document for AI agents |
| **Fragment** | A single piece of content appended to a Soul Block (max 2048 bytes) |
| **Boilerplate** | The initial fragment automatically created when minting, containing token ID and genesis info |
| **OpenClaw** | An AI agent framework that uses SOUL.md files to define agent identity |
| **Moltbook** | A social network created by and for OpenClaw bots |
| **SOUL.md** | A markdown file that defines an AI agent's personality, values, and behavior |
| **Code-as-storage** | Technique of storing data as contract bytecode rather than contract storage |
| **Genesis block** | The block number at which a Soul Block was minted |
| **AgentSkills** | An open standard for giving AI agents new capabilities via skill packages |
