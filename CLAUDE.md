# SoulBlocks — Agent Context

## What This Project Is

SoulBlocks is an ERC-721 NFT collection on Base (Ethereum L2) that stores append-only identity data for AI agents using code-as-storage. 10,000 tokens, 0.02 ETH mint price, fully immutable (no admin keys, no proxy, no upgrades).

## Style Guide

Follow these practices throughout the entire implementation.

### General
- Read the relevant spec doc BEFORE writing any code for a component. The specs are detailed and finalized — don't guess at behavior.
- Write the simplest code that satisfies the spec. No premature abstractions, no "just in case" features, no clever tricks.
- Every function should do one thing. If you're writing a comment to explain a section of a function, that section should probably be its own function.
- Name things for what they ARE, not what they DO. `fragmentAddresses` not `getAndStoreFragments`. Functions are verbs, variables are nouns.
- Delete dead code. No commented-out blocks, no unused imports, no placeholder TODOs.

### Solidity (Contract)
- Use custom errors everywhere (not `require` strings) — they're cheaper and the spec defines them all.
- Follow checks-effects-interactions pattern: validate inputs, update state, then make external calls.
- Every public/external function needs NatDoc (`@notice`, `@param`, `@return`). Internal functions need a one-liner.
- Write tests FIRST for each function, then implement until tests pass. The spec's testing checklist (section 10) is your task list.
- Test the unhappy paths thoroughly — every custom error should have at least one test that triggers it.
- Use `vm.expectRevert` with specific custom errors, not string matching.
- Gas-optimize last, not first. Get it correct, then profile with `forge test --gas-report`.

### TypeScript / React (Website)
- Prefer `const` over `let`. Never use `var`.
- Type everything explicitly at module boundaries (function params, return types, props). Let TypeScript infer the rest.
- One component per file. If a component needs a helper, put the helper in the same file unless it's reused elsewhere.
- Handle loading, error, and empty states for every data-fetching component. The spec's error table (WEBSITE_SPEC section 5.4) lists every case.
- Use wagmi hooks (`useReadContract`, `useWriteContract`) for all blockchain interaction — don't instantiate ethers/viem providers manually.
- Keep chain config derived from `NEXT_PUBLIC_CHAIN_ID` — never hardcode chain-specific values in components.
- All user-facing strings that reference on-chain constraints (price, limits, supply) should read from contract constants, not hardcoded values.

### Testing
- Test behavior, not implementation. Assert on what the user/caller sees, not internal state.
- Each test should test ONE thing and its name should describe the expected behavior: `test_appendFragment_revertsWhenNotOwner`.
- Use descriptive failure messages. When a test fails, you should know what went wrong from the test name alone.
- For the contract: test the full lifecycle end-to-end (mint → append → read → transfer → append by new owner) in addition to unit tests.

## Documentation

Read the relevant doc before implementing each component:

| File | Purpose |
|------|---------|
| `docs/PROJECT_OVERVIEW.md` | High-level architecture, philosophy, user journeys |
| `docs/SMART_CONTRACT_SPEC.md` | Complete contract specification — functions, data structures, events, interface |
| `docs/WEBSITE_SPEC.md` | Frontend spec — pages, components, design system, blockchain integration |
| `docs/DEPLOYMENT_GUIDE.md` | Deploy flow from local → testnet → mainnet, creator mints, post-deploy tasks |
| `docs/SKILL_SPEC.md` | Agent skill for reading/writing Soul Blocks, evm-wallet integration, deep links |
| `docs/MARKETING_GUIDE.md` | Launch strategy, target audiences, content calendar |

## Key Parameters

- **Chain:** Base (Chain ID 8453), testnet on Base Sepolia (84532)
- **Supply:** 10,000
- **Price:** 0.02 ETH
- **Fragment size limit:** 2048 bytes
- **Fragment count limit:** 64 per token
- **Genesis threshold:** First 500 tokens get GENESIS badge in SVG
- **Contract:** ERC721 + ERC721Enumerable, OpenZeppelin v5.x, Solidity ^0.8.20
- **Frontend:** Next.js 14 + Tailwind + wagmi v2 + viem
- **Toolchain:** Foundry (forge, cast, anvil)

## Implementation Order

1. **Smart contract** (`contracts/`) — start here, everything else depends on it
2. **Contract tests** — comprehensive Foundry tests before any deployment
3. **Deploy script** (`script/Deploy.s.sol`)
4. **Testnet deployment** (Base Sepolia) — verify full lifecycle before mainnet
5. **Website** (`website/`) — can develop against testnet deployment
6. **Skill** (`skills/soulblock/`) — fetch.ts + encode.js scripts

## Architecture Decisions Made

- **Code-as-storage:** Fragments are deployed as contract bytecode via CREATE opcode, read back via EXTCODECOPY. See SMART_CONTRACT_SPEC section 3.4.
- **Boilerplate fragment:** Generated at mint as fragment #0. Separate from user fragments — each fragment gets the full 2048 bytes independently.
- **No backend:** Website reads entirely from blockchain. Static export via Next.js.
- **Immutable beneficiary:** Set at construction, cannot be changed. Deployment guide recommends Safe multisig.
- **evm-wallet skill dependency:** Write operations in the skill use surfer77's evm-wallet for signing. Fallback is website deep links (`/append/[id]?content=URL-encoded-text`).
- **Active vs Embodied soul:** Skill tracks which token the agent owns (active_token_id, write target) separately from which token it's acting as (embodied_token_id, may be someone else's).
- **SOUL.md is a disposable cache:** Blockchain is always source of truth. Skill must re-fetch from chain before appending, never sync SOUL.md back.
- **Testnet via env vars:** Website uses `NEXT_PUBLIC_CHAIN_ID` and `NEXT_PUBLIC_RPC_URL` to switch between Base mainnet and Sepolia. No code changes needed.

## Contract Gotchas

- `appendFragment` must check: owner, fragment count < 64, data not empty, data <= 2048 bytes
- `reconstructSoul` is a public read function — the `require` checks token existence, not caller ownership
- `_padTokenId` returns 5-digit zero-padded string. Only works for tokenId < 100,000 (fine with MAX_SUPPLY=10,000)
- `withdraw()` has no access control — anyone can trigger it, funds always go to immutable beneficiary
- No token burning — souls exist forever by design
- ERC721Enumerable provides `tokenOfOwnerByIndex` which the skill uses to enumerate owned tokens

## Website Gotchas

- **XSS:** MarkdownRenderer must sanitize HTML. Use react-markdown (no raw HTML by default). Never dangerouslySetInnerHTML with fragment content.
- **Non-existent tokens:** `/soul/9999` when only 500 minted → redirect to `/mint` with toast message
- **Progressive loading:** Load first 5 fragments immediately, rest in background. Disable "Export as Markdown" button until all fragments loaded.
- **Append page deep links:** Support `?content=` query param to pre-fill editor from external tools/agents. Show "pre-filled by external tool" banner.
- **Fragment hide button:** Client-side only, not persisted. Lets users dismiss content they don't want to see.
- **Accessibility:** Secondary text `#b0b0b0`, tertiary `#808080` — these were bumped for WCAG AA compliance.
- **Confirmation modal** on append: "This fragment will be permanently inscribed on-chain. Are you sure?"

## File Structure Target

```
SoulBlocks/
├── CLAUDE.md                    # This file
├── README.md
├── docs/                        # Specifications (finalized)
├── contracts/
│   ├── src/SoulBlocks.sol
│   ├── script/Deploy.s.sol
│   ├── test/SoulBlocks.t.sol
│   ├── foundry.toml
│   └── .env.example
├── website/
│   ├── src/app/                 # Next.js pages
│   ├── src/components/          # React components
│   ├── src/hooks/               # useContract, useSoul
│   ├── src/lib/                 # contract.ts, utils.ts
│   └── .env.example
└── skills/
    └── soulblock/
        ├── SKILL.md
        ├── scripts/fetch.ts
        ├── scripts/encode.js
        └── package.json
```
