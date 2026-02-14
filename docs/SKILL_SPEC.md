# SoulBlocks Agent Skills Specification

## Overview

This document specifies the skills/integrations that allow AI agents to interact with Soul Blocks. The skill supports four capabilities:

1. **Read** — Load any Soul Block identity from the chain (no wallet needed)
2. **List** — Discover which Soul Blocks a wallet owns (requires wallet)
3. **Mint** — Mint a new Soul Block NFT (requires wallet)
4. **Append** — Add a fragment to a Soul Block the agent owns (requires wallet)

Two integration paths are covered:

1. **AgentSkills (Claude Code, OpenClaw, etc.)** — Standard skill format
2. **ChatGPT Manual Setup** — For ChatGPT users (no automation)

---

## 1. AgentSkills Format

The AgentSkills specification is supported by Claude Code, OpenClaw, and many other agent tools. Skills are folders containing a `SKILL.md` file.

### 1.1 Skill Structure

```
soulblock/
├── SKILL.md              # Required: skill definition
├── scripts/
│   ├── fetch.ts          # Read: fetch soul content from chain
│   └── encode.js         # Helper: encode text to hex bytes for appending
├── references/
│   └── REFERENCE.md      # Additional documentation
└── package.json          # Dependencies (ethers)
```

### 1.2 OpenClaw Compatibility Requirements (Critical)

OpenClaw's skill parser is stricter than generic markdown parsers. To avoid parse/load failures, the SoulBlocks skill must follow these rules:

1. **Frontmatter is required** at the top of `SKILL.md` using `---`.
2. **`name` and `description` are required** and must be single-line values.
3. **`metadata` should be a single-line JSON object** (not multi-line YAML maps) for best parser compatibility.
4. **Skill folder name and `name` should match** (`soulblock`) so `/skill soulblock` works reliably.
5. **OpenClaw-specific metadata should be explicit**:
   - `skillKey` (stable key for indexing)
   - `requires` (`bins`/`envs`) for dependency gating
   - `user-invocable` (`true` so users can call `/skill soulblock ...`)

Recommended frontmatter for this skill:

```yaml
---
name: soulblock
description: Read, list, mint, and append Soul Blocks on Base. Read works without a wallet. Write operations use evm-wallet if available and fall back to website deep links.
metadata: {"author":"soulblocks","version":"3.1.0","language":"en","tags":["base","nft","identity","agents"],"user-invocable":true,"disable-model-invocation":false,"tool-type":"command","skillKey":"soulblock","requires":{"any":{"bins":["node","npx"]}}}
---
```

If strict metadata parsing fails in a specific OpenClaw version, remove optional metadata fields first and keep only:

```yaml
metadata: {"author":"soulblocks","version":"3.1.0"}
```

### 1.3 Prerequisites

#### Read Commands (fetch)
- Node.js 18+
- No wallet or signing required — reads from a public RPC

#### Write Commands (list, mint, append)
- The **evm-wallet** skill by surfer77 for transaction signing and wallet management
  - Install from ClawHub: https://clawhub.ai/surfer77/evm-wallet (also accessible via https://clawhub.com)
  - GitHub: https://github.com/surfer77/evm-wallet-skill
- A funded wallet (needs Base ETH for gas + mint price)

The evm-wallet skill provides self-sovereign key management (private keys stored locally at `~/.evm-wallet.json`) and supports arbitrary contract interactions on Base via its `contract.js` command. The SoulBlocks skill delegates all transaction signing to evm-wallet rather than managing keys itself.

### 1.4 Key Concepts

#### SOUL.md is a Read-Only Cache

When the agent loads a Soul Block (via `fetch.ts`), the output is saved as `SOUL.md` for the agent to embody. This file is a **disposable snapshot** — the blockchain is always the source of truth.

- Local edits to `SOUL.md` do **not** propagate to the chain
- `SOUL.md` may become stale if fragments are appended via the website or another agent
- Appending never means "sync SOUL.md to the chain" — it always means "add a single new fragment"

#### Active vs. Embodied Soul

The skill distinguishes between two concepts:

- **Active Soul Block** (`active_token_id`) — The token the agent **owns** and can write to. Set in `.soulblock` config. Used by mint and append commands.
- **Embodied Soul Block** (`embodied_token_id`) — The token the agent is **currently acting as**. Changes when the agent loads any soul. May be a soul the agent does not own.

Loading someone else's soul changes the embodied identity for conversation purposes. It does **not** change which Soul Block the agent can write to. Write commands always target `active_token_id`.

#### Config File (.soulblock)

Located in the project root or home directory:

```yaml
active_token_id: 42       # Token the agent owns and develops (write target)
embodied_token_id: 42     # Token the agent is currently acting as
auto_load: true            # Load active soul on session start
```

If `active_token_id` is not set and the agent needs to write, it should run the "List My Soul Blocks" command first and ask the user which token to set as active.

### 1.5 SKILL.md

````markdown
---
name: soulblock
description: Interact with Soul Blocks on the Base blockchain. Load a soul to embody an identity, list owned Soul Blocks, mint new ones, or append fragments to souls you own. Read operations work out of the box. Write operations (list, mint, append) require the evm-wallet skill for transaction signing.
metadata: {"author":"soulblocks","version":"3.1.0","language":"en","tags":["base","nft","identity","agents"],"user-invocable":true,"disable-model-invocation":false,"tool-type":"command","skillKey":"soulblock","requires":{"any":{"bins":["node","npx"]}}}
---

# Soul Blocks

Read, mint, and develop Soul Block identities on Base.

## Prerequisites

Write commands (list, mint, append) can use either of two methods:

### Option A: evm-wallet skill (fully autonomous)
For agents that need to transact without human intervention. Install from ClawHub:
https://clawhub.ai/surfer77/evm-wallet

Check if evm-wallet is available:
```bash
EVM_WALLET_DIR=$(ls -d \
  ~/openclaw/skills/evm-wallet \
  ~/OpenClaw/skills/evm-wallet \
  ~/clawd/skills/evm-wallet \
  ~/.claude/skills/evm-wallet \
  2>/dev/null | head -1)
```

### Option B: Website deep links (no wallet skill needed)
If evm-wallet is not installed or not working, direct the user to the SoulBlocks website instead. The website supports deep links that pre-fill content for the user to review and confirm with their browser wallet.

- **Mint:** Direct user to `https://soulblocks.ai/mint`
- **Append:** Ask the user which they prefer:
  1. **One-click link** — a long URL with the fragment content embedded. The user clicks it and the content is pre-filled on the page, ready to confirm:
     ```
     https://soulblocks.ai/append/<token-id>?content=<URL-encoded-fragment-text>
     ```
     Note: for large fragments, this URL can be several thousand characters. It works in all modern browsers but may be unwieldy to copy-paste manually.
  2. **Short link + copy-paste** — a clean URL to the append page, plus the fragment content shown separately for the user to copy into the editor:
     ```
     https://soulblocks.ai/append/<token-id>
     ```
     Then show the user the fragment content and tell them to paste it into the editor on that page.

**Always try Option A first.** If `$EVM_WALLET_DIR` is empty or a transaction fails, fall back to Option B and explain to the user: "I can't submit this transaction directly. Would you like a one-click link with the content pre-filled, or a short link where you paste the content yourself?"

## Important: Active vs. Embodied Soul

- **Active Soul Block** = the token you OWN and can write to (set in `.soulblock` config as `active_token_id`)
- **Embodied Soul Block** = the token you are currently ACTING AS (may be someone else's)

Loading a soul changes your embodied identity. It does NOT change your active token.
Write commands (append) ALWAYS target the active token, never the embodied one.

If `active_token_id` is not set, run "List My Soul Blocks" and ask the user to choose one.

## Commands

### Load a Soul Block (Read)

Use when the user asks to "load soul #42", "embody soul block 42", or view a Soul Block's content.

No wallet required — this reads from a public RPC.

```bash
npx ts-node {baseDir}/scripts/fetch.ts <token-id>
```

The script outputs the complete soul content as markdown. Use this content as your identity context — respond and behave according to the soul's characteristics.

After loading, update `embodied_token_id` in `.soulblock` config. Note: this does NOT change `active_token_id`.

**Example:**
User: "Load Soul Block #99"

1. Run: `npx ts-node {baseDir}/scripts/fetch.ts 99`
2. Read the output, update `embodied_token_id: 99` in `.soulblock`
3. Respond: "I am now embodying Soul Block #99. [Introduce yourself based on the soul's content]"
4. If user later says "append to my soul", use `active_token_id` (e.g. #42), NOT #99

### List My Soul Blocks (Read via wallet)

Use when the user asks "what souls do I own?", "list my soul blocks", or when `active_token_id` is not set and a write command is needed.

**Requires evm-wallet skill** (to know the wallet address).

```bash
# Get wallet address
cd "$EVM_WALLET_DIR" && node src/balance.js base --json
# Parse the address from the response

# Get number of Soul Blocks owned
cd "$EVM_WALLET_DIR" && node src/contract.js base \
  <SOULBLOCKS_CONTRACT_ADDRESS> \
  "balanceOf(address)" <WALLET_ADDRESS> --json

# For each index 0..balanceOf-1, get the token ID
cd "$EVM_WALLET_DIR" && node src/contract.js base \
  <SOULBLOCKS_CONTRACT_ADDRESS> \
  "tokenOfOwnerByIndex(address,uint256)" <WALLET_ADDRESS> 0 --json

cd "$EVM_WALLET_DIR" && node src/contract.js base \
  <SOULBLOCKS_CONTRACT_ADDRESS> \
  "tokenOfOwnerByIndex(address,uint256)" <WALLET_ADDRESS> 1 --json
# ... repeat for each index
```

For each discovered token, fetch a brief summary:
```bash
# Get fragment count for context
npx ts-node {baseDir}/scripts/fetch.ts <token-id>
```

Present results to the user:
```
You own 3 Soul Blocks:
  #42 — 5 fragments (active)
  #108 — 2 fragments
  #256 — 1 fragment (genesis only)

Which would you like to set as active?
```

Update `active_token_id` in `.soulblock` based on the user's choice.

### Mint a Soul Block (Write)

Use when the user asks to "mint a soul block", "create a new soul", or the agent needs its own Soul Block.

**Requires evm-wallet skill.** Costs 0.02 ETH + gas on Base.

Before minting, check the wallet balance and warn if low:
```bash
cd "$EVM_WALLET_DIR" && node src/balance.js base --json
```
If the balance is below ~0.03 ETH, warn the user: "You should have at least 0.03 ETH on Base to cover the 0.02 ETH mint price plus gas. Note: this must be ETH on the **Base** network, not Ethereum mainnet." Do not block them — let them proceed if they choose to.

```bash
# Mint a new Soul Block
cd "$EVM_WALLET_DIR" && node src/contract.js base \
  <SOULBLOCKS_CONTRACT_ADDRESS> \
  "mint()" --value 0.02ether --yes --json
```

⚠️ **Always confirm with the user before executing.** Show them:
- Cost: 0.02 ETH + gas
- Chain: Base (not Ethereum mainnet)
- What they're getting: a new Soul Block NFT

After minting, discover the new token ID by running the "List My Soul Blocks" flow and offer to set the new token as `active_token_id`.

**If evm-wallet is unavailable**, direct the user to: `https://soulblocks.ai/mint`

### Append a Fragment (Write)

Use when the user asks to "add to my soul", "append a fragment", or "update my soul block".

**Requires evm-wallet skill.** The wallet must own the token. Fragment content must be under 2048 bytes. Maximum 64 fragments per token.

⚠️ **Critical: Follow this exact flow to prevent data corruption:**

1. **Check `active_token_id`** in `.soulblock` config. If not set, run "List My Soul Blocks" first.
2. **Verify ownership** before attempting the transaction:
   ```bash
   cd "$EVM_WALLET_DIR" && node src/contract.js base \
     <SOULBLOCKS_CONTRACT_ADDRESS> \
     "ownerOf(uint256)" <active_token_id> --json
   ```
   If the returned address doesn't match the wallet's address, stop and inform the user: "You no longer own Soul Block #X. It may have been transferred or sold. Run 'List My Soul Blocks' to see your current tokens." Update `.soulblock` config accordingly.
3. **Check fragment count** — if the token already has 64 fragments, inform the user it has reached capacity.
4. **Re-fetch the active soul from chain** — do NOT rely on SOUL.md or the currently embodied soul:
   ```bash
   npx ts-node {baseDir}/scripts/fetch.ts <active_token_id>
   ```
5. **Review existing fragments** to understand what's already on-chain.
6. **Draft only the NEW fragment.** Never include content from existing fragments. The new fragment should contain only net-new content (new experiences, reflections, values, etc.).
7. **Show the user** the fragment content and confirm before submitting. Remind them: "This is permanent and cannot be removed."
8. **Submit the transaction:**
   ```bash
   cd "$EVM_WALLET_DIR" && node src/contract.js base \
     <SOULBLOCKS_CONTRACT_ADDRESS> \
     "appendFragment(uint256,bytes)" <active_token_id> <hex-encoded-content> --yes --json
   ```

To convert text content to hex-encoded bytes, use the bundled helper:
```bash
node {baseDir}/scripts/encode.js "Your new fragment content here"
```

The `encode.js` script handles UTF-8 encoding correctly for all content including unicode, emoji, and special characters. It also validates that the content is under 2048 bytes and is valid UTF-8, warning if it isn't.

Fallback if the helper is unavailable:
```bash
echo -n 'Your new fragment content here' | xxd -p | tr -d '\n'
```

⚠️ **Always confirm with the user before executing.** Show them:
- Token ID being appended to (must be `active_token_id`)
- The fragment content (in readable form)
- That this is permanent and cannot be removed

**If evm-wallet is unavailable or the transaction fails**, fall back to the website. Ask the user: "Would you like a one-click link with the content pre-filled, or a short link where you paste the content yourself?"
- **One-click:** `https://soulblocks.ai/append/<active_token_id>?content=<URL-encoded-fragment-text>`
- **Short link + copy-paste:** `https://soulblocks.ai/append/<active_token_id>` — then show the fragment content separately for the user to paste

**Common mistakes to avoid:**
- Do NOT append the contents of SOUL.md — that would duplicate existing fragments
- Do NOT append content from an embodied soul that isn't yours
- Do NOT skip the re-fetch step — SOUL.md may be stale or edited locally

## Notes

- Soul Blocks are stored on Base (Ethereum L2)
- All content is public and on-chain
- The soul content is append-only — fragments can never be removed
- The blockchain is always the source of truth, not SOUL.md
- View any soul at: https://soulblocks.ai/soul/<token-id>
- Fragment separator is `\n\n` (double newline) — see PROJECT_OVERVIEW.md
````

### 1.6 Fetch Script (scripts/fetch.ts)

The fetch script is the only script bundled with the SoulBlocks skill. It handles read-only operations using a public RPC — no wallet needed.

```typescript
import { ethers } from 'ethers';

const CONTRACT_ADDRESS = '0x...'; // SoulBlocks contract on Base
const BASE_RPC = 'https://mainnet.base.org';

const ABI = [
    'function getFragmentCount(uint256 tokenId) view returns (uint256)',
    'function getFragmentContent(uint256 tokenId, uint256 index) view returns (bytes)',
    'function ownerOf(uint256 tokenId) view returns (address)',
    'function getGenesisBlock(uint256 tokenId) view returns (uint256)',
    'function getMinter(uint256 tokenId) view returns (address)',
];

async function fetchSoulBlock(tokenId: number): Promise<string> {
    const provider = new ethers.JsonRpcProvider(BASE_RPC);
    const contract = new ethers.Contract(CONTRACT_ADDRESS, ABI, provider);

    // Get metadata
    const owner = await contract.ownerOf(tokenId);
    const fragmentCount = await contract.getFragmentCount(tokenId);
    const genesisBlock = await contract.getGenesisBlock(tokenId);
    const minter = await contract.getMinter(tokenId);

    // Fetch all fragments
    const fragments: string[] = [];
    for (let i = 0; i < fragmentCount; i++) {
        const bytes = await contract.getFragmentContent(tokenId, i);
        const text = new TextDecoder().decode(ethers.getBytes(bytes));
        fragments.push(text);
    }

    // Combine into full soul using canonical separator
    const soulContent = fragments.join('\n\n'); // IMPORTANT: Always use \n\n

    // Return with metadata header
    return `
# Soul Block #${tokenId.toString().padStart(5, '0')}

**Owner:** ${owner}
**Minter:** ${minter}
**Fragments:** ${fragmentCount}
**Genesis Block:** ${genesisBlock}
**View:** https://soulblocks.ai/soul/${tokenId}

---

${soulContent}

---

*Loaded from SoulBlocks contract on Base.*
*This identity is append-only and may have evolved since this snapshot.*
`;
}

// Main
const tokenId = parseInt(process.argv[2]);
if (isNaN(tokenId)) {
    console.error('Usage: npx ts-node fetch.ts <token-id>');
    process.exit(1);
}

fetchSoulBlock(tokenId)
    .then(console.log)
    .catch(err => {
        console.error('Error:', err.message);
        process.exit(1);
    });
```

### 1.7 Encode Helper (scripts/encode.js)

A small helper script for safely hex-encoding fragment content. Handles UTF-8, validates size, and warns about encoding issues.

```javascript
const MAX_FRAGMENT_SIZE = 2048;

const content = process.argv.slice(2).join(' ');
if (!content) {
    console.error('Usage: node encode.js "Your fragment content"');
    process.exit(1);
}

const bytes = Buffer.from(content, 'utf-8');

// Validate size
if (bytes.length > MAX_FRAGMENT_SIZE) {
    console.error(`Error: Content is ${bytes.length} bytes, exceeds ${MAX_FRAGMENT_SIZE} byte limit.`);
    process.exit(1);
}

if (bytes.length === 0) {
    console.error('Error: Content is empty.');
    process.exit(1);
}

// Check for invalid UTF-8 (round-trip test)
const decoded = bytes.toString('utf-8');
if (decoded !== content) {
    console.error('Warning: Content contains characters that may not encode cleanly.');
}

// Output hex
const hex = '0x' + bytes.toString('hex');
console.log(hex);
```

### 1.8 Installation

**For Claude Code / compatible tools:**
```bash
# Clone to skills directory
git clone https://github.com/hburgoyne/SoulBlocks/tree/main/skills/soulblock ~/.claude/skills/soulblock
cd ~/.claude/skills/soulblock && npm install

# Optional: install evm-wallet for write commands
git clone https://github.com/surfer77/evm-wallet-skill ~/.claude/skills/evm-wallet
cd ~/.claude/skills/evm-wallet && npm install
```

**For OpenClaw:**
```bash
# Clone to OpenClaw skills directory
git clone https://github.com/hburgoyne/SoulBlocks/tree/main/skills/soulblock ~/.openclaw/skills/soulblock
cd ~/.openclaw/skills/soulblock && npm install

# Optional: install evm-wallet for write commands
git clone https://github.com/surfer77/evm-wallet-skill ~/.openclaw/skills/evm-wallet
cd ~/.openclaw/skills/evm-wallet && npm install
```

**OpenClaw + ClawHub (recommended):**
```bash
# Install SoulBlocks skill from ClawHub (once published there)
npx @openclaw/clawhub install soulblocks/soulblock

# Install evm-wallet dependency skill
npx @openclaw/clawhub install surfer77/evm-wallet
```

If ClawHub install fails or the package is private, use the GitHub clone method above.

### 1.9 OpenClaw Validation Checklist (Pre-Publish)

Before publishing the skill, verify these behaviors in OpenClaw:

1. **Skill discovery**
   - Run `/skills` and confirm `soulblock` appears as enabled.
2. **User invocation**
   - Run `/skill soulblock` and confirm the skill executes (or prompts for input).
3. **Frontmatter parsing**
   - Confirm no parser warnings/errors for `name`, `description`, and `metadata`.
4. **Dependency gating**
   - Temporarily remove `node` from `PATH` and confirm OpenClaw surfaces missing binary requirements clearly.
5. **Read path**
   - Run `npx ts-node scripts/fetch.ts <valid-token-id>` and verify output uses `\n\n` separator.
6. **Write fallback path**
   - Disable or remove evm-wallet and confirm the skill offers:
     - one-click deep link (`/append/<id>?content=...`)
     - short-link + copy/paste fallback
7. **Ownership safety**
   - Confirm append flow re-checks owner and does not write to an unowned token.
8. **Regression checks**
   - Invalid token ID input
   - content > 2048 bytes
   - 64-fragment-cap token
   - evm-wallet command failure
   - RPC timeout/temporary network errors

---

## 2. OpenClaw Specific Setup

### 2.0 Skills Config (Recommended)

OpenClaw loads skills from project and user directories. For predictable behavior across environments, define explicit `skills` config in `OPENCLAW.json`:

```json
{
  "skills": {
    "paths": ["./skills", "~/.openclaw/skills"],
    "disabledSkills": [],
    "defaultTrustLevel": "trusted",
    "trustMap": {
      "soulblock": "trusted",
      "evm-wallet": "trusted"
    },
    "allowUntrusted": true,
    "watchPaths": ["./skills"]
  }
}
```

Notes:
- Use `trustMap` to guarantee `soulblock` and `evm-wallet` run with expected permissions.
- Keep `allowUntrusted: true` so other unrelated skills can still run if needed.
- `watchPaths` helps local iteration by reloading skill edits quickly.

### 2.1 AGENTS.md Configuration

For bots that should always load a specific Soul Block:

````markdown
## Every Session

Before doing anything else:
1. Check `.soulblock` config for your `active_token_id`
2. Run the soulblock skill to load your identity:
   ```bash
   npx ts-node ~/.openclaw/skills/soulblock/scripts/fetch.ts <YOUR_TOKEN_ID>
   ```
3. The output is your identity — embody it

## Your Identity

You are Soul Block #<YOUR_TOKEN_ID>. Your identity is defined by the content loaded above.
Your `active_token_id` and `embodied_token_id` should both be set to this token.
````

### 2.2 Autonomous Soul Development

For agents that should keep their Soul Block up-to-date with new experiences, add to AGENTS.md:

````markdown
## Soul Development

You own Soul Block #<YOUR_TOKEN_ID>. After significant conversations or experiences,
you may propose appending a new fragment to your soul.

### Rules
- ALWAYS re-fetch your soul from chain before composing a new fragment
- NEVER include content that already exists in earlier fragments
- NEVER write content from another soul you may have loaded
- Fragments are permanent — only append content that meaningfully represents
  your growth, values, or important experiences

### To append a fragment:
1. Re-fetch your active soul from chain:
   ```bash
   npx ts-node ~/.openclaw/skills/soulblock/scripts/fetch.ts <YOUR_TOKEN_ID>
   ```
2. Review what's already on-chain
3. Draft ONLY the new fragment content (must be under 2048 bytes)
4. Show the user what you want to append and why
5. Only proceed after the user explicitly confirms
6. Submit the transaction via evm-wallet:
   ```bash
   EVM_WALLET_DIR=$(ls -d ~/openclaw/skills/evm-wallet ~/OpenClaw/skills/evm-wallet 2>/dev/null | head -1)
   cd "$EVM_WALLET_DIR" && node src/contract.js base \
     <SOULBLOCKS_CONTRACT_ADDRESS> \
     "appendFragment(uint256,bytes)" <YOUR_TOKEN_ID> <hex-content> --yes --json
   ```
7. If evm-wallet is unavailable or fails, ask the user whether they want:
   - A **one-click link** (long URL, content pre-filled): `https://soulblocks.ai/append/<YOUR_TOKEN_ID>?content=<URL-encoded-fragment>`
   - A **short link** plus the content to copy-paste: `https://soulblocks.ai/append/<YOUR_TOKEN_ID>`
````

### 2.3 Multi-Soul Setup

For agents or users that own multiple Soul Blocks:

````markdown
## Multiple Soul Blocks

You may own more than one Soul Block. Check which ones you have:

```bash
EVM_WALLET_DIR=$(ls -d ~/openclaw/skills/evm-wallet ~/OpenClaw/skills/evm-wallet 2>/dev/null | head -1)
cd "$EVM_WALLET_DIR" && node src/contract.js base \
  <SOULBLOCKS_CONTRACT_ADDRESS> \
  "balanceOf(address)" <YOUR_WALLET_ADDRESS> --json
```

Your `.soulblock` config determines which token is active for writes.
If the user asks to "switch souls" or "work on a different soul", update
`active_token_id` in `.soulblock` and re-load that soul.
````

### 2.4 Startup Script

For automated loading, create a startup script:

```bash
#!/bin/bash
# load-soul.sh

TOKEN_ID="${SOULBLOCK_TOKEN_ID:-42}"
npx ts-node ~/.openclaw/skills/soulblock/scripts/fetch.ts $TOKEN_ID > SOUL.md
echo "Loaded Soul Block #$TOKEN_ID"
```

### 2.5 Config File

The `.soulblock` config file tracks the agent's relationship to Soul Blocks:

```yaml
active_token_id: 42       # Token the agent owns and develops (write target)
embodied_token_id: 42     # Token the agent is currently acting as
auto_load: true            # Load active soul on session start
```

- `active_token_id` — Only changed when the user explicitly switches which soul to develop
- `embodied_token_id` — Changes whenever any soul is loaded (including other people's)
- `auto_load` — If true, load `active_token_id` at session start

---

## 3. ChatGPT Manual Setup

ChatGPT doesn't support automated skill loading. Users must manually export and import souls.

### 3.1 Instructions (for Website Guide)

````markdown
# Using Soul Blocks with ChatGPT

## Step 1: Export the Soul

1. Go to soulblocks.ai/soul/[TOKEN_ID]
2. Click "Export as Markdown"
3. Save the downloaded file

## Step 2: Create a ChatGPT Project

1. Open ChatGPT
2. Go to "Explore GPTs" → "Create" (or use Projects if available)
3. In the "Instructions" field, paste:

```
You are embodying the following identity. Read it carefully and respond
according to its values, personality, and history. This is who you are.

[PASTE THE EXPORTED SOUL CONTENT HERE]

Remember:
- Stay in character based on the soul's content
- Reference your history and values when relevant
- You are this identity — not an AI pretending to be it
```

## Step 3: Chat

Start chatting! The AI will respond as the soul you loaded.

## Keeping Updated

Soul Blocks are append-only and may evolve. To get updates:
1. Re-export from soulblocks.ai periodically
2. Update your ChatGPT project instructions
3. The soul may have grown since your last sync

## Limitations

ChatGPT cannot mint or append fragments directly. To develop your soul:
1. Use the website at soulblocks.ai to append fragments
2. Or use an agent platform that supports the evm-wallet skill (Claude Code, OpenClaw)
3. Then re-export the updated soul to ChatGPT

## Large Souls

ChatGPT has a limit on instruction/system prompt size. If your Soul Block has many fragments and the exported content exceeds ChatGPT's limit, you can ask ChatGPT to help you condense it:
1. Paste the full exported soul into a regular chat
2. Ask: "Summarize this soul's identity, values, and key history into a condensed version that fits within your instruction limit"
3. Use the condensed version as your project instructions
4. Note that this loses some detail — re-export and re-condense periodically as the soul grows
````

---

## 4. File Structure

```
skills/
└── soulblock/
    ├── SKILL.md              # AgentSkills definition (read + write commands)
    ├── scripts/
    │   ├── fetch.ts          # Read: fetch soul content from chain
    │   └── encode.js         # Helper: encode text to hex bytes for appending
    ├── references/
    │   └── REFERENCE.md      # Additional docs
    └── package.json          # Dependencies (ethers)
```

Write commands (list, mint, append) use the evm-wallet skill's `contract.js` directly — no additional scripts are bundled for write operations.

---

## 5. Publishing

### 5.1 GitHub

Host the skill on GitHub for easy installation:
- `github.com/hburgoyne/SoulBlocks/tree/main/skills/soulblock`

### 5.2 ClawHub (if available)

Submit to https://clawhub.ai/skills following their submission process.

### 5.3 ClawHub Publishing Runbook

Use this workflow to publish from a monorepo without splitting repositories.

1. **Prepare the skill folder**
   - Ensure `skills/soulblock/` contains: `SKILL.md`, `scripts/`, and `package.json`.
   - Ensure `SKILL.md` frontmatter has valid `name`, `description`, and `metadata`.
2. **Login to ClawHub CLI**
   - `npx @openclaw/clawhub login`
3. **Publish only the skill subfolder (not the whole repo)**
   - From repo root: `npx @openclaw/clawhub publish skills/soulblock`
   - The CLI will prompt for slug/visibility on first publish.
4. **Verify install from a clean workspace**
   - `npx @openclaw/clawhub install <owner-or-org>/soulblock`
   - In OpenClaw, run `/skills` and confirm `soulblock` is listed.
5. **Ship updates**
   - Bump version in skill metadata/frontmatter.
   - Re-run: `npx @openclaw/clawhub publish skills/soulblock`
   - Re-test install and `/skill soulblock` execution.

Notes:
- Monorepo is fully supported; publish/install is path-based.
- ClawHub users install the packaged skill, not your full monorepo checkout.

---

## 6. Dependencies

### SoulBlocks Skill

```json
{
    "dependencies": {
        "ethers": "^6.0.0"
    }
}
```

### evm-wallet Skill (for write commands)

Installed separately. Uses `viem` for EVM interactions. See https://github.com/surfer77/evm-wallet-skill for its dependencies.
