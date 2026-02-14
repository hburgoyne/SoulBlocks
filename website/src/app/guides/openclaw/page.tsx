import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "OpenClaw Guide - Soul Blocks",
  description:
    "How to use Soul Blocks with OpenClaw bots. Configure AGENTS.md, install the skill, and develop your soul autonomously.",
};

export default function OpenClawGuidePage() {
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
          Using Soul Blocks with OpenClaw
        </h1>
        <p className="text-[#b0b0b0]">
          OpenClaw is an open-source agent framework that supports AgentSkills.
          You can give your OpenClaw bot a persistent on-chain identity by
          connecting it to a Soul Block.
        </p>
      </div>

      {/* What is OpenClaw */}
      <section>
        <h2 className="mb-4 text-xl font-bold">What is OpenClaw?</h2>
        <div className="rounded border border-[#2a2a2a] bg-[#0a0a0a] p-6">
          <p className="text-sm text-[#b0b0b0]">
            OpenClaw is an open-source agent platform that runs AI bots with
            persistent context. Bots are configured via an{" "}
            <code className="rounded bg-[#141414] px-1.5 py-0.5 text-[#ffffff]">
              AGENTS.md
            </code>{" "}
            file and can use skills -- packaged tools and scripts -- to
            interact with external systems. The SoulBlocks skill gives your
            bot an identity that lives on the blockchain.
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
  ~/.openclaw/skills/soulblock
cd ~/.openclaw/skills/soulblock && npm install`}</code>
          </pre>
        </div>

        <div className="mb-6">
          <h3 className="mb-2 text-sm font-bold text-[#b0b0b0]">
            Step 2: Install evm-wallet (for write operations)
          </h3>
          <pre className="overflow-x-auto rounded border border-[#2a2a2a] bg-[#0a0a0a] p-4 text-sm text-[#b0b0b0]">
            <code>{`git clone https://github.com/surfer77/evm-wallet-skill \\
  ~/.openclaw/skills/evm-wallet
cd ~/.openclaw/skills/evm-wallet && npm install`}</code>
          </pre>
          <p className="mt-2 text-sm text-[#808080]">
            The evm-wallet skill provides self-sovereign key management.
            Private keys are stored locally at{" "}
            <code className="rounded bg-[#0a0a0a] px-1.5 py-0.5">
              ~/.evm-wallet.json
            </code>
            . If evm-wallet is not installed, write operations fall back to
            website deep links.
          </p>
        </div>

        <div>
          <h3 className="mb-2 text-sm font-bold text-[#b0b0b0]">
            Step 3: Fund the wallet
          </h3>
          <p className="text-sm text-[#b0b0b0]">
            You need ETH on Base for minting (0.02 ETH) and gas fees for
            appending fragments. Send ETH to your evm-wallet address on the
            Base network. At least 0.03 ETH is recommended.
          </p>
        </div>
      </section>

      {/* AGENTS.md configuration */}
      <section>
        <h2 className="mb-4 text-xl font-bold">AGENTS.md Configuration</h2>
        <p className="mb-4 text-sm text-[#b0b0b0]">
          Add the following to your bot&apos;s{" "}
          <code className="rounded bg-[#0a0a0a] px-1.5 py-0.5 text-[#ffffff]">
            AGENTS.md
          </code>{" "}
          file to load a Soul Block identity on every session.
        </p>

        <div className="mb-6">
          <h3 className="mb-2 text-sm font-bold text-[#b0b0b0]">
            Basic identity loading
          </h3>
          <pre className="overflow-x-auto rounded border border-[#2a2a2a] bg-[#0a0a0a] p-4 text-sm text-[#b0b0b0]">
            <code>{`## Every Session

Before doing anything else:
1. Check \`.soulblock\` config for your \`active_token_id\`
2. Run the soulblock skill to load your identity:
   \`\`\`bash
   npx ts-node ~/.openclaw/skills/soulblock/scripts/fetch.ts <YOUR_TOKEN_ID>
   \`\`\`
3. The output is your identity — embody it

## Your Identity

You are Soul Block #<YOUR_TOKEN_ID>. Your identity is defined
by the content loaded above.
Your \`active_token_id\` and \`embodied_token_id\` should both
be set to this token.`}</code>
          </pre>
        </div>

        <div className="mb-6">
          <h3 className="mb-2 text-sm font-bold text-[#b0b0b0]">
            Autonomous soul development (optional)
          </h3>
          <p className="mb-2 text-sm text-[#808080]">
            Add this section if you want the bot to propose appending
            fragments after significant conversations.
          </p>
          <pre className="overflow-x-auto rounded border border-[#2a2a2a] bg-[#0a0a0a] p-4 text-sm text-[#b0b0b0]">
            <code>{`## Soul Development

You own Soul Block #<YOUR_TOKEN_ID>. After significant
conversations or experiences, you may propose appending
a new fragment to your soul.

### Rules
- ALWAYS re-fetch your soul from chain before composing
  a new fragment
- NEVER include content that already exists in earlier
  fragments
- Fragments are permanent — only append content that
  meaningfully represents your growth, values, or
  important experiences

### To append a fragment:
1. Re-fetch your active soul from chain
2. Review what's already on-chain
3. Draft ONLY the new fragment (under 2048 bytes)
4. Show the user and wait for explicit confirmation
5. Submit via evm-wallet or provide a deep link`}</code>
          </pre>
        </div>
      </section>

      {/* Example workflow */}
      <section>
        <h2 className="mb-4 text-xl font-bold">Example Workflow</h2>
        <div className="rounded border border-[#2a2a2a] bg-[#0a0a0a] p-6">
          <ol className="flex flex-col gap-4 text-sm text-[#b0b0b0]">
            <li>
              <span className="text-[#ffffff] font-bold">1.</span> Mint a Soul
              Block on{" "}
              <Link
                href="/mint"
                className="text-[#b0b0b0] underline hover:text-[#ffffff]"
              >
                soulblocks.ai/mint
              </Link>{" "}
              or via the evm-wallet skill.
            </li>
            <li>
              <span className="text-[#ffffff] font-bold">2.</span> Note your
              token ID (e.g., #00042).
            </li>
            <li>
              <span className="text-[#ffffff] font-bold">3.</span> Create a{" "}
              <code className="rounded bg-[#141414] px-1.5 py-0.5 text-[#ffffff]">
                .soulblock
              </code>{" "}
              config with{" "}
              <code className="rounded bg-[#141414] px-1.5 py-0.5 text-[#ffffff]">
                active_token_id: 42
              </code>
              .
            </li>
            <li>
              <span className="text-[#ffffff] font-bold">4.</span> Add the
              AGENTS.md sections above to your bot config.
            </li>
            <li>
              <span className="text-[#ffffff] font-bold">5.</span> Start
              chatting. The bot loads the soul on startup and embodies it.
            </li>
            <li>
              <span className="text-[#ffffff] font-bold">6.</span> When the
              bot has something meaningful to record, it proposes a fragment.
              You confirm, and it appends on-chain.
            </li>
          </ol>
        </div>
      </section>

      {/* Startup script */}
      <section>
        <h2 className="mb-4 text-xl font-bold">
          Startup Script (Optional)
        </h2>
        <p className="mb-4 text-sm text-[#b0b0b0]">
          For automated loading, create a startup script that fetches the soul
          and saves it as SOUL.md:
        </p>
        <pre className="overflow-x-auto rounded border border-[#2a2a2a] bg-[#0a0a0a] p-4 text-sm text-[#b0b0b0]">
          <code>{`#!/bin/bash
# load-soul.sh

TOKEN_ID="\${SOULBLOCK_TOKEN_ID:-42}"
npx ts-node ~/.openclaw/skills/soulblock/scripts/fetch.ts $TOKEN_ID > SOUL.md
echo "Loaded Soul Block #$TOKEN_ID"`}</code>
        </pre>
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
              evm-wallet skill
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
