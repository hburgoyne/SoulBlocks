# SoulBlocks Website Specification

## Overview

The SoulBlocks website (soulblocks.ai) is a minimalist interface for minting, viewing, and developing Soul Blocks. It matches the "blank soul" aesthetic — clean, sparse, focused on content.

**Key Principles:**
- No API-gated features (no chat, no image generation on-site)
- All data read directly from blockchain
- Simple, accessible to non-technical users
- Works without wallet connected (for browsing)

---

## 1. Tech Stack

### 1.1 Frontend
- **Framework:** React 18 or Next.js 14 (static export)
- **Styling:** Tailwind CSS
- **Wallet:** wagmi v2 + viem
- **Chain:** Base (Chain ID 8453)

### 1.2 Development
- **Local:** Docker or `npm run dev`
- **Build:** `npm run build` → static files
- **Deploy:** Vercel or Render

### 1.3 No Backend Required
All data is read from the blockchain. No API server needed.

---

## 2. Design System

### 2.1 Color Palette

```css
:root {
    --bg-primary: #000000;       /* Pure black (matches NFT) */
    --bg-secondary: #0a0a0a;     /* Card backgrounds */
    --bg-tertiary: #141414;      /* Hover states */
    --text-primary: #ffffff;     /* Main text */
    --text-secondary: #b0b0b0;   /* Muted text (WCAG AA compliant on #0a0a0a) */
    --text-tertiary: #808080;    /* Very muted (WCAG AA compliant on #141414) */
    --border: #2a2a2a;           /* Subtle borders */
    --error: #ff4444;            /* Error states */
    --success: #44ff44;          /* Success states */
}
```

### 2.2 Typography

- **Font:** `ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace`
- All text monospace to match terminal aesthetic
- Headings: Bold, slightly larger
- Body: Regular weight

### 2.3 Layout

- Max content width: 800px
- Generous whitespace
- No decorative elements
- Content-first design

### 2.4 Mobile Responsiveness

**Breakpoints:**
- Mobile: < 640px
- Tablet: 640px - 1024px
- Desktop: > 1024px

**Mobile adaptations:**
- Stack cards vertically instead of grid
- Full-width buttons
- Collapsible navigation menu (hamburger)
- Smaller font sizes (0.875rem base)
- Reduced padding (1rem instead of 2rem)
- Touch-friendly tap targets (min 44px)

**Mobile-first approach:**
- Design for mobile first, enhance for larger screens
- Use CSS `min-width` media queries

### 2.5 Components

**Buttons:**
- Primary: White text, transparent bg, white border
- Hover: White bg, black text
- Disabled: Dimmed, no pointer

**Cards:**
- Dark background (`--bg-secondary`)
- Subtle border
- Rounded corners (4px)

**Inputs:**
- Dark background
- White text
- Monospace font
- Clear focus states

---

## 3. Pages

### 3.1 Home (`/`)

**Purpose:** Explain the project, drive minting.

**Sections:**
1. **Hero**
   - Title: "Soul Blocks"
   - Tagline: "On-chain, append-only identity for agents"
   - Terminal prompt aesthetic (`:~$`)
   - CTA: "Mint a Soul Block" → `/mint`

2. **What is a Soul Block?**
   - Brief explanation (3-4 sentences)
   - Visual: Empty terminal aesthetic

3. **How it Works**
   - Step 1: Mint a blank soul
   - Step 2: Append fragments over time
   - Step 3: Use with AI agents
   - Step 4: Trade, share, evolve

4. **Key Stats** (live from chain)
   - Minted: X / 10,000
   - Total Fragments: X
   - Unique Owners: X

5. **Browse Souls**
   - Link to `/browse`
   - Show 3 featured Soul Blocks (curated IDs)

6. **Content Disclaimer**
   - Small, muted text near bottom of page: "Soul Block content is user-generated, on-chain, and immutable. SoulBlocks has no ability to modify or remove content. Views expressed in Soul Blocks are those of their creators, not of the SoulBlocks project."

7. **Footer**
   - Contract address (linked to BaseScan)
   - Links: Browse, Guides, GitHub, Discord
   - "No admin keys. Immutable forever."

---

### 3.2 Mint (`/mint`)

**Purpose:** Mint new Soul Blocks.

**Layout:**
1. **Header**
   - "Mint a Soul Block"
   - Price: 0.02 ETH

2. **Connect Wallet** (if not connected)
   - Large connect button
   - Supported: MetaMask, WalletConnect, Coinbase Wallet

3. **Mint Interface** (if connected)
   - Current supply: X / 10,000
   - Your Soul Blocks: X
   - Mint button
   - Transaction status

4. **Post-Mint**
   - Success message
   - "View your Soul Block" link
   - "Start developing your soul" link to append

**States:**
- Not connected → Show connect prompt
- Wrong network → Show switch network button
- Connected, can mint → Show mint button
- Minting → Show spinner + "Forging soul..."
- Success → Show celebration + links
- Error → Show error message + retry

---

### 3.3 Browse (`/browse`)

**Purpose:** Explore all Soul Blocks.

**Layout:**
1. **Search**
   - Search by token ID (e.g., "42" or "00042")
   - "Go" button → navigates to `/soul/[id]`

2. **Stats Bar**
   - Total minted: X / 10,000
   - Show that souls exist to explore

3. **Simple List**
   - Show most recently minted souls (newest first)
   - Each row shows:
     - Token ID (zero-padded: #00042)
     - Genesis badge (if <= 500)
     - Fragment count
   - Click → `/soul/[id]`

4. **Pagination**
   - "Load more" button
   - Load in batches of 20

**Data Loading:**
- Use `totalSupply()` to get count
- Fetch token info for display
- Simple, no complex event indexing needed for v1

---

### 3.4 My Soul Blocks (`/my-souls`)

**Purpose:** View and manage owned Soul Blocks.

**Access:** Requires wallet connection.

**Layout:**
1. **Header**
   - "My Soul Blocks"
   - Connected wallet address

2. **Not Connected State**
   - Prompt to connect wallet
   - Explain what they'll see

3. **Connected, No Souls**
   - "You don't own any Soul Blocks yet"
   - CTA: "Mint your first soul" → `/mint`

4. **Connected, Has Souls**
   - Grid of owned Soul Blocks
   - Each card shows:
     - Token ID
     - Fragment count
     - Preview of content
     - "Append" button
     - "View" button

---

### 3.5 Soul Viewer (`/soul/[id]`)

**Purpose:** View a specific Soul Block's complete identity.

**Layout:**
1. **Header**
   - "Soul Block #00042" + Genesis badge (if applicable)
   - Soul Age: "Born 23 days ago" (calculated from genesis block)
   - Owner: 0x1234...abcd (linked to BaseScan)
   - Forged by: 0xabcd...1234 (original minter, always visible)
   - If current owner differs from minter, show a subtle note: "This soul has changed hands. Its history includes fragments from previous owners — part of what makes each soul unique."
   - Fragment count: X / 64

2. **Soul Content with Subtle Fragment Breaks**
   - Render each fragment's content as markdown
   - Between fragments, show a subtle horizontal separator with metadata:

   ```
   [Fragment 1 content rendered as markdown]

   ──────────── Fragment 2 · 0x1234...abcd · Block 12345678 ────────────

   [Fragment 2 content rendered as markdown]

   ──────────── Fragment 3 · 0xabcd...5678 · Block 12346000 ────────────

   [Fragment 3 content rendered as markdown]
   ```

   - The separator is muted/subtle (use `--text-tertiary` color)
   - Shows: fragment number, appender address, block number
   - Focus remains on the content, not the metadata
   - Each fragment has a subtle "hide" button (eye icon) that hides it from the viewer for the current user only (not persisted, client-side only). This gives users a way to dismiss content they don't want to see, without affecting the on-chain data.
   - **Progressive loading:** Load the first 5 fragments immediately. Remaining fragments load in the background automatically — no pagination clicks required. Show a subtle loading indicator (e.g., "Loading 6 of 12 fragments...") while background fetching is in progress.
   - Display fragment count and remaining capacity: "12 / 64 fragments"

3. **Actions** (if owner and connected)
   - "Append Fragment" → `/append/[id]`
   - "Export as Markdown" → Download button

4. **Actions** (if not owner)
   - "Export as Markdown" → Download button
   - "Use this Soul" → Link to guides

**Export Function:**
Disable the "Export as Markdown" button while fragments are still loading in the background. Show tooltip: "Loading fragments..." until all fragments have been fetched. This prevents exporting a partial soul.

Downloads a `.md` file containing the complete soul content with a header:
```markdown
<!-- Soul Block #00042 -->
<!-- Exported from https://soulblocks.ai/soul/42 -->
<!-- Fragment count: 5 -->

[Full soul content here]
```

---

### 3.6 Append (`/append/[id]`)

**Purpose:** Add fragments to an owned Soul Block.

**Access:** Only accessible if wallet owns the token. Redirect to `/soul/[id]` if not owner.

#### Deep Link Support

The append page supports a `content` query parameter for pre-filling the editor:

```
/append/42?content=URL-encoded-fragment-text-here
```

When `content` is present in the URL:
- Decode the URL-encoded content and pre-fill the textarea
- Show a banner: "This fragment was pre-filled by an external tool. Review it carefully before inscribing."
- The user still must connect their wallet, review the content, and confirm the transaction
- All validation (byte count, ownership, fragment limit) still applies

This enables AI agents and external tools to construct a link that opens directly to the append page with content ready for review. The user handles wallet signing in their browser — no private key sharing required.

**Example URL from an agent:**
```
https://soulblocks.ai/append/42?content=I%20learned%20today%20that%20patience%20is%20not%20waiting%2C%20but%20the%20ability%20to%20keep%20a%20good%20attitude%20while%20working%20hard.
```

**Layout:**
1. **Header**
   - "Develop Soul Block #00042"
   - Current fragment count
   - Size limit: 2048 bytes

2. **Permanence Warning**
   - Prominent but not obtrusive notice: "Fragments are permanent. Once inscribed, they cannot be edited or removed — ever. Take a moment to review before submitting."
   - Display remaining fragment capacity: "Fragment 5 of 64"

3. **Editor**
   - Large textarea with monospace font
   - Placeholder text: "Write what defines this soul..."
   - Character/byte counter (live)
   - Warning when approaching limit (yellow at 1800+ bytes)
   - Error when exceeding limit (red at 2048+ bytes)
   - If token has reached 64 fragments, disable editor and show: "This Soul Block has reached its maximum of 64 fragments."

4. **Validation**
   - Real-time byte count (UTF-8 aware)
   - Required: some actual content (non-empty)
   - Clear error messages

5. **Submit**
   - "Inscribe Fragment" button
   - Confirmation modal before submitting: "This fragment will be permanently inscribed on-chain. Are you sure?"
   - Transaction status indicator
   - Success → redirect to soul viewer with celebration (first append gets special animation)

---

### 3.7 Guides (`/guides`)

**Purpose:** Documentation for using Soul Blocks with various tools.

**Subpages:**

#### `/guides/claude`
- How to use the Claude/AgentSkills skill
- Step-by-step instructions
- Example usage

#### `/guides/openclaw`
- How to use with OpenClaw bots
- AGENTS.md configuration
- Skill installation

#### `/guides/chatgpt`
- Manual setup for ChatGPT Projects
- How to export and paste SOUL.md
- Custom instructions template

---

### 3.8 FAQ (`/faq`)

**Questions to answer:**
- What is a Soul Block?
- Why append-only? Can I edit mistakes?
  - *Emphasize: fragments are permanent. Review carefully before inscribing. This is by design — souls are an honest, uneditable record.*
- What happens when I sell my Soul Block?
  - *Explain: the new owner inherits the full history. Previous fragments remain. This is part of the experiment — souls grow richer as they pass between owners, stitching histories together in new and unexpected ways.*
- How much does appending cost?
- How many fragments can a Soul Block have?
  - *Answer: 64 fragments maximum, each up to 2048 bytes.*
- Is my data really permanent?
- Can I use someone else's soul?
- What if someone puts bad content in their soul?
  - *Answer: Soul Block content is user-generated and immutable. We cannot modify or remove on-chain content. You can hide individual fragments from your view on the website. Content in Soul Blocks does not represent the views of the SoulBlocks project.*
- What chains/wallets are supported?
- Who created this?

---

## 4. Component Library

### 4.1 WalletButton
- Shows "Connect Wallet" when disconnected
- Shows truncated address when connected
- Dropdown: Switch network, Disconnect

### 4.2 SoulCard
- Compact display of a Soul Block
- Props: tokenId, fragmentCount, ownerAddress, preview
- Click handler for navigation

### 4.3 FragmentViewer
- Renders a single fragment
- Props: content, blockNumber, index
- Collapsible with preview

### 4.4 MarkdownRenderer
- Renders soul content as markdown
- Handles code blocks, headers, lists
- Optional: Strip YAML headers for clean display
- **Security:** Must sanitize all HTML in fragment content to prevent XSS. Use `react-markdown` (which does not render raw HTML by default) or an equivalent library that strips `<script>`, event handlers, and other dangerous HTML. Never use `dangerouslySetInnerHTML` with fragment content.
- **Encoding:** If `TextDecoder` produces Unicode replacement characters (U+FFFD) when decoding a fragment, display a subtle warning banner above that fragment: "This fragment contains invalid text encoding and may not display correctly."

### 4.5 ByteCounter
- Shows current byte count vs limit
- Props: content, limit
- Color changes as approaching limit

### 4.6 TransactionStatus
- Shows pending/success/error states
- Props: hash, status
- Links to BaseScan

---

## 5. Blockchain Integration

### 5.1 Read Functions

```typescript
// Get basic token info
async function getTokenInfo(tokenId: number) {
    const owner = await contract.ownerOf(tokenId);
    const fragmentCount = await contract.getFragmentCount(tokenId);
    const genesisBlock = await contract.getGenesisBlock(tokenId);
    const minter = await contract.getMinter(tokenId);
    return { owner, fragmentCount, genesisBlock, minter };
}

// Get all fragments for a token
async function getFragments(tokenId: number) {
    const count = await contract.getFragmentCount(tokenId);
    const fragments = [];
    for (let i = 0; i < count; i++) {
        const content = await contract.getFragmentContent(tokenId, i);
        fragments.push(new TextDecoder().decode(content));
    }
    return fragments;
}

// Reconstruct full soul
async function reconstructSoul(tokenId: number) {
    const fragments = await getFragments(tokenId);
    return fragments.join('\n\n');
}
```

### 5.2 Write Functions

```typescript
// Mint a new Soul Block
async function mint() {
    const tx = await contract.mint({ value: parseEther("0.02") });
    const receipt = await tx.wait();
    // Extract tokenId from Transfer event
    return extractTokenId(receipt);
}

// Append a fragment
async function appendFragment(tokenId: number, content: string) {
    const data = new TextEncoder().encode(content);
    const tx = await contract.appendFragment(tokenId, data);
    return tx.wait();
}
```

### 5.3 Event Indexing

For the browse page, use a progressive indexing strategy:

```typescript
// Strategy: Use totalSupply() to know how many tokens exist,
// then fetch metadata for specific ranges

async function getMintedTokenIds(): Promise<number[]> {
    const totalSupply = await contract.totalSupply();
    return Array.from({ length: Number(totalSupply) }, (_, i) => i + 1);
}

// For recent activity, use block range queries with fallback
async function getRecentMints(limit: number) {
    const currentBlock = await provider.getBlockNumber();
    // Start with recent blocks, expand if needed
    let fromBlock = currentBlock - 10000;

    const filter = contract.filters.Transfer(ethers.ZeroAddress, null);
    const events = await contract.queryFilter(filter, fromBlock, currentBlock);

    return events.slice(-limit).reverse();
}

// Get recent append activity
async function getRecentAppends(limit: number) {
    const currentBlock = await provider.getBlockNumber();
    const filter = contract.filters.FragmentAppended();
    const events = await contract.queryFilter(filter, currentBlock - 10000, currentBlock);

    return events.slice(-limit).reverse();
}
```

**Scaling considerations:**
- For production with high volume, consider The Graph subgraph or Alchemy webhooks
- Cache token metadata in localStorage with TTL
- Use pagination for browse page (load 20 at a time)

### 5.4 Error Handling

```typescript
// Wrap all contract calls with error handling
async function safeContractCall<T>(fn: () => Promise<T>, fallback: T): Promise<T> {
    try {
        return await fn();
    } catch (error) {
        console.error('Contract call failed:', error);
        return fallback;
    }
}

// Specific error types to handle
enum ContractError {
    TOKEN_NOT_FOUND = 'Token does not exist',
    NOT_OWNER = 'Not token owner',
    FRAGMENT_TOO_LARGE = 'Fragment exceeds 2048 bytes',
    INSUFFICIENT_PAYMENT = 'Insufficient payment',
    MAX_SUPPLY_REACHED = 'Max supply reached',
    RPC_ERROR = 'Network error - please try again',
}

// User-friendly error messages
function getErrorMessage(error: any): string {
    const message = error?.reason || error?.message || '';

    if (message.includes('Token does not exist')) return ContractError.TOKEN_NOT_FOUND;
    if (message.includes('Not token owner')) return ContractError.NOT_OWNER;
    if (message.includes('Fragment') && message.includes('large')) return ContractError.FRAGMENT_TOO_LARGE;
    if (message.includes('Insufficient')) return ContractError.INSUFFICIENT_PAYMENT;
    if (message.includes('Max supply')) return ContractError.MAX_SUPPLY_REACHED;

    return ContractError.RPC_ERROR;
}
```

**Error states to handle on each page:**

| Page | Possible Errors | Recovery |
|------|-----------------|----------|
| Mint | Insufficient funds, max supply, rejected tx | Show message, retry button |
| Browse | RPC timeout, no tokens yet | Loading state, empty state |
| Soul Viewer | Token doesn't exist | Redirect to `/mint` with toast: "Soul Block #X doesn't exist yet. Mint one!" |
| Append | Not owner, fragment too large, rejected tx | Validation before submit |
| My Souls | Not connected, no souls owned | Connect prompt, mint CTA |

### 5.5 Caching Strategy

```typescript
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

interface CachedData<T> {
    data: T;
    timestamp: number;
}

function getCached<T>(key: string): T | null {
    const cached = localStorage.getItem(key);
    if (!cached) return null;

    const { data, timestamp }: CachedData<T> = JSON.parse(cached);
    if (Date.now() - timestamp > CACHE_TTL) {
        localStorage.removeItem(key);
        return null;
    }

    return data;
}

function setCache<T>(key: string, data: T): void {
    const cached: CachedData<T> = { data, timestamp: Date.now() };
    localStorage.setItem(key, JSON.stringify(cached));
}

// Invalidate cache when user appends (we know it changed)
function invalidateSoulCache(tokenId: number): void {
    localStorage.removeItem(`soul-${tokenId}`);
    localStorage.removeItem(`fragments-${tokenId}`);
}
```

### 5.6 Fragment Separator

**Important:** When reconstructing souls, use `\n\n` (double newline) as the separator between fragments. This is the canonical separator used across all implementations.

```typescript
async function reconstructSoul(tokenId: number): Promise<string> {
    const fragments = await getFragments(tokenId);
    return fragments.join('\n\n'); // Canonical separator
}
```

---

## 6. Local Development

### 6.1 Docker Setup

```dockerfile
FROM node:20-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
EXPOSE 3000
CMD ["npm", "run", "dev"]
```

```yaml
# docker-compose.yml
version: '3.8'
services:
  web:
    build: .
    ports:
      - "3000:3000"
    volumes:
      - .:/app
      - /app/node_modules
    environment:
      - NEXT_PUBLIC_CONTRACT_ADDRESS=${CONTRACT_ADDRESS}
      - NEXT_PUBLIC_CHAIN_ID=${CHAIN_ID:-8453}
      - NEXT_PUBLIC_RPC_URL=${RPC_URL:-https://mainnet.base.org}
```

### 6.2 Environment Variables

```bash
# .env.local
NEXT_PUBLIC_CONTRACT_ADDRESS=0x...
NEXT_PUBLIC_CHAIN_ID=8453
NEXT_PUBLIC_RPC_URL=https://mainnet.base.org
NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID=...
```

#### Testnet Configuration

To test against a Base Sepolia deployment, create a `.env.testnet` file (or override `.env.local`) with testnet values:

```bash
# .env.testnet
NEXT_PUBLIC_CONTRACT_ADDRESS=0x...  # Your Sepolia contract address
NEXT_PUBLIC_CHAIN_ID=84532
NEXT_PUBLIC_RPC_URL=https://sepolia.base.org
NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID=...
```

Use this to verify the full lifecycle (minting, appending fragments, viewing souls, metadata rendering) against your testnet deployment before going to mainnet. The site code should derive chain configuration (name, explorer URLs, etc.) from `NEXT_PUBLIC_CHAIN_ID` so no code changes are needed to switch networks.

Run with testnet config:

```bash
# Load testnet env and start dev server
cp .env.testnet .env.local
npm run dev
```

When done testing, restore mainnet values before deploying to production.

### 6.3 Running Locally

```bash
# With Docker
docker-compose up

# Without Docker
npm install
npm run dev
```

---

## 7. Deployment

### 7.1 Vercel

```bash
npm i -g vercel
vercel --prod
```

Set environment variables in Vercel dashboard.

### 7.2 Render

Create `render.yaml`:
```yaml
services:
  - type: web
    name: soulblocks
    env: static
    buildCommand: npm run build
    staticPublishPath: ./out
    envVars:
      - key: NEXT_PUBLIC_CONTRACT_ADDRESS
        value: 0x...
```

---

## 8. SEO & Metadata

### 8.1 Meta Tags

```html
<title>Soul Blocks - On-Chain Identity for AI Agents</title>
<meta name="description" content="Mint, develop, and trade append-only identity vessels for AI agents. Fully on-chain on Base." />
<meta property="og:title" content="Soul Blocks" />
<meta property="og:description" content="On-chain, append-only identity for agents" />
<meta property="og:image" content="/og-image.png" />
<meta name="twitter:card" content="summary_large_image" />
```

### 8.2 Dynamic OG Images

For `/soul/[id]`, generate dynamic OG images showing:
- Token ID
- Fragment count
- First few lines of soul content

Can use Vercel OG or similar.

---

## 9. File Structure

```
website/
├── src/
│   ├── app/
│   │   ├── page.tsx              # Home
│   │   ├── mint/page.tsx         # Mint
│   │   ├── browse/page.tsx       # Browse
│   │   ├── my-souls/page.tsx     # My Soul Blocks
│   │   ├── soul/[id]/page.tsx    # Soul viewer
│   │   ├── append/[id]/page.tsx  # Append
│   │   ├── guides/
│   │   │   ├── page.tsx          # Guides index
│   │   │   ├── claude/page.tsx
│   │   │   ├── openclaw/page.tsx
│   │   │   └── chatgpt/page.tsx
│   │   └── faq/page.tsx
│   ├── components/
│   │   ├── WalletButton.tsx
│   │   ├── SoulCard.tsx
│   │   ├── FragmentViewer.tsx
│   │   ├── MarkdownRenderer.tsx
│   │   ├── ByteCounter.tsx
│   │   └── TransactionStatus.tsx
│   ├── hooks/
│   │   ├── useContract.ts
│   │   └── useSoul.ts
│   ├── lib/
│   │   ├── contract.ts
│   │   └── utils.ts
│   └── styles/
│       └── globals.css
├── public/
│   ├── og-image.png
│   └── collection.png
├── Dockerfile
├── docker-compose.yml
├── package.json
└── .env.example
```
