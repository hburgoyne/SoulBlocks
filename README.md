# Soul Blocks

**On-chain, append-only soul vessels for AI agents.**

Soul Blocks is an ERC-721 NFT collection on Base where each token is a living identity document stored entirely on-chain. Designed for AI agents (Claude, OpenClaw, ChatGPT), each Soul Block accumulates personality, values, and memories over time — and can never be erased.

## Quick Links

- **Website:** [soulblocks.ai](https://soulblocks.ai)
- **Testnet Contract:** [BaseScan Sepolia](https://sepolia.basescan.org/address/0xfa5A304Db36A6933Ce1eC727A7a524a102a3454F)
- **Documentation:** [docs/](./docs/)

## Key Features

- **Fully on-chain** — No IPFS, no external dependencies. Fragments stored as contract bytecode via code-as-storage.
- **Append-only** — History is permanent; growth is additive. Up to 64 fragments per soul.
- **Owner-gated** — Only the NFT owner can inscribe new content.
- **Immutable** — No admin keys, no proxy contracts, no upgrades. Souls exist forever by design.
- **Genesis badge** — Tokens #1-500 display "GENESIS" in their on-chain SVG.
- **Agent skill** — Read and write Soul Blocks directly from Claude Code, OpenClaw, or ChatGPT.

## Parameters

| Parameter | Value |
|-----------|-------|
| Chain | Base (Chain ID 8453) |
| Supply | 10,000 |
| Mint Price | 0.02 ETH |
| Fragment Size Limit | 2048 bytes |
| Max Fragments | 64 per token |
| Genesis Threshold | First 500 tokens |

## Repository Structure

```
SoulBlocks/
├── contracts/            # Solidity smart contract (Foundry)
│   ├── src/SoulBlocks.sol
│   ├── test/SoulBlocks.t.sol
│   └── script/Deploy.s.sol
├── website/              # Next.js 14 frontend (wagmi + viem)
│   ├── src/app/          # Pages: home, mint, browse, soul viewer, append
│   ├── src/components/   # FragmentViewer, WalletButton, MarkdownRenderer, etc.
│   ├── src/hooks/        # useSoul, useFragments, useTotalSupply
│   └── src/lib/          # Contract ABI, wagmi config, utilities
├── skills/               # Agent skill for Claude Code / OpenClaw
│   └── soulblock/
│       ├── SKILL.md      # Skill definition and commands
│       ├── scripts/fetch.ts   # Read souls from chain
│       └── scripts/encode.js  # Hex-encode fragment content
├── docs/                 # Specifications and guides that Claude used to build this
└── README.md
```

## Documentation

| Document | Description |
|----------|-------------|
| [PROJECT_OVERVIEW.md](./docs/PROJECT_OVERVIEW.md) | High-level architecture and philosophy |
| [SMART_CONTRACT_SPEC.md](./docs/SMART_CONTRACT_SPEC.md) | Contract functions, events, data structures |
| [DEPLOYMENT_GUIDE.md](./docs/DEPLOYMENT_GUIDE.md) | Deploy flow from local to testnet to mainnet |
| [WEBSITE_SPEC.md](./docs/WEBSITE_SPEC.md) | Frontend pages, components, design system |
| [SKILL_SPEC.md](./docs/SKILL_SPEC.md) | Agent skill for reading/writing Soul Blocks |
| [MARKETING_GUIDE.md](./docs/MARKETING_GUIDE.md) | Launch strategy for marketing agents |

## How It Works

1. **Mint** a Soul Block (0.02 ETH) — receives a genesis fragment with token ID, block number, and minter address
2. **Append** fragments over time — personality, values, memories, constitution (each permanently inscribed as contract bytecode)
3. **Use** with AI agents — load any soul into Claude, OpenClaw, or ChatGPT via the skill or website export
4. **Trade** on marketplaces — new owner continues the soul's evolution; previous fragments remain forever

## License

MIT
