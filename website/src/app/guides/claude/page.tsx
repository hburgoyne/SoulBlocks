import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Claude / AgentSkills Guide - Soul Blocks",
  description:
    "How to use Soul Blocks with Claude Code and AgentSkills-compatible tools. Read souls, append fragments, and develop identity autonomously.",
};

export default function ClaudeGuidePage() {
  return (
    <div className="flex flex-col gap-8">
      <div>
        <Link
          href="/guides"
          className="mb-8 inline-block text-sm text-[#808080] hover:text-[#b0b0b0] transition-colors"
        >
          &larr; Back to guides
        </Link>

        <h1 className="mb-4 text-3xl font-bold">
          Using Soul Blocks with Claude
        </h1>
        <p className="text-[#b0b0b0]">
          The SoulBlocks skill lets Claude Code (and any AgentSkills-compatible
          tool) read, mint, and develop Soul Block identities on Base.
        </p>
      </div>

      {/* What the skill does */}
      <section>
        <h2 className="mb-4 text-xl font-bold">What the Skill Does</h2>
        <div className="rounded border border-[#2a2a2a] bg-[#0a0a0a] p-6">
          <ul className="flex flex-col gap-3 text-sm text-[#b0b0b0]">
            <li>
              <span className="text-[#ffffff] font-bold">Read</span> -- Load
              any Soul Block from the chain. No wallet needed.
            </li>
            <li>
              <span className="text-[#ffffff] font-bold">List</span> --
              Discover which Soul Blocks a wallet owns.
            </li>
            <li>
              <span className="text-[#ffffff] font-bold">Mint</span> -- Mint
              a new Soul Block NFT (0.02 ETH + gas on Base).
            </li>
            <li>
              <span className="text-[#ffffff] font-bold">Append</span> -- Add
              a fragment to a Soul Block the agent owns.
            </li>
          </ul>
          <p className="mt-4 text-sm text-[#808080]">
            Read operations work out of the box. Write operations (mint,
            append) require the{" "}
            <a
              href="https://github.com/surfer77/evm-wallet-skill"
              target="_blank"
              rel="noopener noreferrer"
              className="text-[#b0b0b0] underline hover:text-[#ffffff]"
            >
              evm-wallet
            </a>{" "}
            skill for transaction signing, or can fall back to website deep
            links. Listing your Soul Blocks requires knowing your wallet
            address but no signing.
          </p>
        </div>
      </section>

      {/* Installation */}
      <section>
        <h2 className="mb-4 text-xl font-bold">Installation</h2>

        <div className="mb-6">
          <h3 className="mb-2 text-sm font-bold text-[#b0b0b0]">
            Step 1: Install the SoulBlocks skill
          </h3>
          <pre className="overflow-x-auto rounded border border-[#2a2a2a] bg-[#0a0a0a] p-4 text-sm text-[#b0b0b0]">
            <code>{`git clone https://github.com/soulblocks/skill-soulblock \\
  ~/.claude/skills/soulblock
cd ~/.claude/skills/soulblock && npm install`}</code>
          </pre>
        </div>

        <div className="mb-6">
          <h3 className="mb-2 text-sm font-bold text-[#b0b0b0]">
            Step 2: Install evm-wallet (optional, for write commands)
          </h3>
          <pre className="overflow-x-auto rounded border border-[#2a2a2a] bg-[#0a0a0a] p-4 text-sm text-[#b0b0b0]">
            <code>{`git clone https://github.com/surfer77/evm-wallet-skill \\
  ~/.claude/skills/evm-wallet
cd ~/.claude/skills/evm-wallet && npm install`}</code>
          </pre>
          <p className="mt-2 text-sm text-[#808080]">
            Without evm-wallet, write operations fall back to website deep
            links. The agent constructs a URL and you confirm the transaction
            in your browser.
          </p>
        </div>

        <div>
          <h3 className="mb-2 text-sm font-bold text-[#b0b0b0]">
            Step 3: Create a config file (optional)
          </h3>
          <p className="mb-2 text-sm text-[#b0b0b0]">
            Create a{" "}
            <code className="rounded bg-[#0a0a0a] px-1.5 py-0.5 text-[#ffffff]">
              .soulblock
            </code>{" "}
            file in your project root or home directory:
          </p>
          <pre className="overflow-x-auto rounded border border-[#2a2a2a] bg-[#0a0a0a] p-4 text-sm text-[#b0b0b0]">
            <code>{`active_token_id: 42       # Token you own (write target)
embodied_token_id: 42     # Token you're acting as
auto_load: true            # Load soul on session start`}</code>
          </pre>
        </div>
      </section>

      {/* Key concepts */}
      <section>
        <h2 className="mb-4 text-xl font-bold">Key Concepts</h2>
        <div className="flex flex-col gap-4">
          <div className="rounded border border-[#2a2a2a] bg-[#0a0a0a] p-6">
            <h3 className="mb-2 font-bold">Active vs. Embodied Soul</h3>
            <p className="text-sm text-[#b0b0b0]">
              The <strong className="text-[#ffffff]">active</strong> Soul
              Block is the token you own and can write to. The{" "}
              <strong className="text-[#ffffff]">embodied</strong> Soul Block
              is the identity you are currently acting as -- which may be
              someone else&apos;s soul. Loading a soul changes the embodied
              identity but never changes the write target.
            </p>
          </div>
          <div className="rounded border border-[#2a2a2a] bg-[#0a0a0a] p-6">
            <h3 className="mb-2 font-bold">SOUL.md is a Cache</h3>
            <p className="text-sm text-[#b0b0b0]">
              When the skill loads a Soul Block, it outputs the content as
              markdown. This is a disposable snapshot. The blockchain is always
              the source of truth. The skill re-fetches from chain before
              every append to prevent stale data.
            </p>
          </div>
        </div>
      </section>

      {/* Example usage */}
      <section>
        <h2 className="mb-4 text-xl font-bold">Example Usage</h2>

        <div className="mb-6">
          <h3 className="mb-2 text-sm font-bold text-[#b0b0b0]">
            Reading a Soul
          </h3>
          <pre className="overflow-x-auto rounded border border-[#2a2a2a] bg-[#0a0a0a] p-4 text-sm text-[#b0b0b0]">
            <code>{`# Ask Claude to load a soul
> "Load Soul Block #42"

# Claude runs:
npx ts-node ~/.claude/skills/soulblock/scripts/fetch.ts 42

# Output: full soul content as markdown
# Claude now embodies that identity`}</code>
          </pre>
        </div>

        <div className="mb-6">
          <h3 className="mb-2 text-sm font-bold text-[#b0b0b0]">
            Appending a Fragment
          </h3>
          <pre className="overflow-x-auto rounded border border-[#2a2a2a] bg-[#0a0a0a] p-4 text-sm text-[#b0b0b0]">
            <code>{`# Ask Claude to add to your soul
> "Append a new fragment about what I learned today"

# Claude will:
# 1. Check your active_token_id
# 2. Re-fetch the soul from chain
# 3. Draft a new fragment (net-new content only)
# 4. Show you the content for confirmation
# 5. Submit via evm-wallet or provide a deep link`}</code>
          </pre>
        </div>

        <div>
          <h3 className="mb-2 text-sm font-bold text-[#b0b0b0]">
            Listing Your Souls
          </h3>
          <pre className="overflow-x-auto rounded border border-[#2a2a2a] bg-[#0a0a0a] p-4 text-sm text-[#b0b0b0]">
            <code>{`# Ask Claude what souls you own
> "List my Soul Blocks"

# Output:
# You own 3 Soul Blocks:
#   #00042 — 5 fragments (active)
#   #00108 — 2 fragments
#   #00256 — 1 fragment (genesis only)
#
# Which would you like to set as active?`}</code>
          </pre>
        </div>
      </section>

      {/* Deep links */}
      <section>
        <h2 className="mb-4 text-xl font-bold">
          Deep Links (Without evm-wallet)
        </h2>
        <p className="mb-4 text-sm text-[#b0b0b0]">
          If the evm-wallet skill is not installed, Claude falls back to
          website deep links. The agent constructs a URL with the fragment
          content pre-filled, and you confirm the transaction in your browser
          wallet.
        </p>
        <div className="rounded border border-[#2a2a2a] bg-[#0a0a0a] p-6">
          <p className="mb-2 text-sm font-bold">Append deep link format:</p>
          <pre className="overflow-x-auto text-sm text-[#b0b0b0]">
            <code>
              {`https://soulblocks.ai/append/[id]?content=[URL-encoded-text]`}
            </code>
          </pre>
          <p className="mt-4 text-sm text-[#808080]">
            The content is URL-encoded and pre-filled into the editor. You
            review it, connect your wallet, and confirm. No private key
            sharing required.
          </p>
        </div>
      </section>

      {/* Links */}
      <section className="border-t border-[#2a2a2a] pt-8">
        <h2 className="mb-4 text-xl font-bold">Resources</h2>
        <ul className="flex flex-col gap-2 text-sm">
          <li>
            <a
              href="https://github.com/soulblocks/skill-soulblock"
              target="_blank"
              rel="noopener noreferrer"
              className="text-[#b0b0b0] underline hover:text-[#ffffff]"
            >
              SoulBlocks skill repository
            </a>
          </li>
          <li>
            <a
              href="https://github.com/surfer77/evm-wallet-skill"
              target="_blank"
              rel="noopener noreferrer"
              className="text-[#b0b0b0] underline hover:text-[#ffffff]"
            >
              evm-wallet skill (for write operations)
            </a>
          </li>
          <li>
            <a
              href="https://clawhub.ai/surfer77/evm-wallet"
              target="_blank"
              rel="noopener noreferrer"
              className="text-[#b0b0b0] underline hover:text-[#ffffff]"
            >
              evm-wallet on ClawHub
            </a>
          </li>
        </ul>
      </section>
    </div>
  );
}
