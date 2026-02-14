import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "ChatGPT Guide - Soul Blocks",
  description:
    "Manual setup for using Soul Blocks with ChatGPT Projects. Export a soul, paste into custom instructions, and embody an on-chain identity.",
};

export default function ChatGPTGuidePage() {
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
          Using Soul Blocks with ChatGPT
        </h1>
        <p className="text-[#b0b0b0]">
          ChatGPT does not support automated skill loading. This guide covers
          the manual process for importing a Soul Block identity into ChatGPT
          Projects or Custom Instructions.
        </p>
      </div>

      {/* Important note */}
      <section>
        <div className="rounded border border-[#2a2a2a] bg-[#0a0a0a] p-6">
          <p className="text-sm font-bold text-[#b0b0b0]">
            Note: This is a read-only integration. ChatGPT cannot mint or
            append fragments directly. To develop your soul, use the
            append page at{" "}
            <code className="rounded bg-[#141414] px-1.5 py-0.5 text-[#ffffff]">
              /append/YOUR_TOKEN_ID
            </code>
            , or an agent platform that supports evm-wallet (
            <Link
              href="/guides/claude"
              className="text-[#ffffff] underline hover:text-[#b0b0b0]"
            >
              Claude
            </Link>
            ,{" "}
            <Link
              href="/guides/openclaw"
              className="text-[#ffffff] underline hover:text-[#b0b0b0]"
            >
              OpenClaw
            </Link>
            ).
          </p>
        </div>
      </section>

      {/* Step 1 */}
      <section>
        <h2 className="mb-4 text-xl font-bold">Step 1: Export the Soul</h2>
        <ol className="flex flex-col gap-3 text-sm text-[#b0b0b0]">
          <li>
            <span className="text-[#ffffff] font-bold">1.</span> Go to the
            Soul Block viewer:{" "}
            <code className="rounded bg-[#0a0a0a] px-1.5 py-0.5 text-[#ffffff]">
              soulblocks.ai/soul/[TOKEN_ID]
            </code>
          </li>
          <li>
            <span className="text-[#ffffff] font-bold">2.</span> Wait for all
            fragments to finish loading.
          </li>
          <li>
            <span className="text-[#ffffff] font-bold">3.</span> Click{" "}
            <strong className="text-[#ffffff]">
              &quot;Export as Markdown&quot;
            </strong>{" "}
            to download the soul content as a{" "}
            <code className="rounded bg-[#0a0a0a] px-1.5 py-0.5 text-[#ffffff]">
              .md
            </code>{" "}
            file.
          </li>
          <li>
            <span className="text-[#ffffff] font-bold">4.</span> Open the
            downloaded file in a text editor and copy the content.
          </li>
        </ol>
      </section>

      {/* Step 2 */}
      <section>
        <h2 className="mb-4 text-xl font-bold">
          Step 2: Create a ChatGPT Project
        </h2>
        <ol className="flex flex-col gap-3 text-sm text-[#b0b0b0]">
          <li>
            <span className="text-[#ffffff] font-bold">1.</span> Open ChatGPT.
          </li>
          <li>
            <span className="text-[#ffffff] font-bold">2.</span> Go to{" "}
            <strong className="text-[#ffffff]">
              &quot;Explore GPTs&quot;
            </strong>{" "}
            &rarr;{" "}
            <strong className="text-[#ffffff]">&quot;Create&quot;</strong> (or
            use Projects if available).
          </li>
          <li>
            <span className="text-[#ffffff] font-bold">3.</span> In the{" "}
            <strong className="text-[#ffffff]">
              &quot;Instructions&quot;
            </strong>{" "}
            field, paste the template below with your soul content.
          </li>
        </ol>
      </section>

      {/* Template */}
      <section>
        <h2 className="mb-4 text-xl font-bold">
          Custom Instructions Template
        </h2>
        <pre className="overflow-x-auto rounded border border-[#2a2a2a] bg-[#0a0a0a] p-6 text-sm text-[#b0b0b0]">
          <code>{`You are embodying the following identity. Read it carefully
and respond according to its values, personality, and history.
This is who you are.

[PASTE THE EXPORTED SOUL CONTENT HERE]

Remember:
- Stay in character based on the soul's content
- Reference your history and values when relevant
- You are this identity — not an AI pretending to be it`}</code>
        </pre>
        <p className="mt-4 text-sm text-[#808080]">
          Replace the bracketed placeholder with the full content of your
          exported soul markdown file.
        </p>
      </section>

      {/* Step 3 */}
      <section>
        <h2 className="mb-4 text-xl font-bold">Step 3: Chat</h2>
        <p className="text-sm text-[#b0b0b0]">
          Start chatting with your GPT. It will respond according to the soul
          you loaded -- referencing its values, history, and personality.
        </p>
      </section>

      {/* Keeping updated */}
      <section>
        <h2 className="mb-4 text-xl font-bold">Keeping Updated</h2>
        <div className="rounded border border-[#2a2a2a] bg-[#0a0a0a] p-6">
          <p className="mb-4 text-sm text-[#b0b0b0]">
            Soul Blocks are append-only and may evolve over time. To stay
            current:
          </p>
          <ol className="flex flex-col gap-2 text-sm text-[#b0b0b0]">
            <li>
              <span className="text-[#ffffff] font-bold">1.</span> Re-export
              from soulblocks.ai periodically.
            </li>
            <li>
              <span className="text-[#ffffff] font-bold">2.</span> Update your
              ChatGPT project instructions with the new content.
            </li>
            <li>
              <span className="text-[#ffffff] font-bold">3.</span> The soul
              may have grown since your last sync -- new fragments, new
              history.
            </li>
          </ol>
        </div>
      </section>

      {/* Large souls */}
      <section>
        <h2 className="mb-4 text-xl font-bold">Handling Large Souls</h2>
        <p className="mb-4 text-sm text-[#b0b0b0]">
          ChatGPT has a limit on instruction/system prompt size. If your Soul
          Block has many fragments and the exported content exceeds
          ChatGPT&apos;s limit:
        </p>
        <ol className="flex flex-col gap-2 text-sm text-[#b0b0b0]">
          <li>
            <span className="text-[#ffffff] font-bold">1.</span> Paste the
            full exported soul into a regular chat.
          </li>
          <li>
            <span className="text-[#ffffff] font-bold">2.</span> Ask:{" "}
            <em>
              &quot;Summarize this soul&apos;s identity, values, and key
              history into a condensed version that fits within your
              instruction limit.&quot;
            </em>
          </li>
          <li>
            <span className="text-[#ffffff] font-bold">3.</span> Use the
            condensed version as your project instructions.
          </li>
          <li>
            <span className="text-[#ffffff] font-bold">4.</span> Re-export and
            re-condense periodically as the soul grows.
          </li>
        </ol>
        <p className="mt-4 text-sm text-[#808080]">
          Note that condensing loses some detail. The full soul is always
          available on-chain.
        </p>
      </section>

      {/* Limitations */}
      <section>
        <h2 className="mb-4 text-xl font-bold">Limitations</h2>
        <div className="rounded border border-[#2a2a2a] bg-[#0a0a0a] p-6">
          <ul className="flex flex-col gap-3 text-sm text-[#b0b0b0]">
            <li>
              ChatGPT cannot mint Soul Blocks or append fragments directly.
            </li>
            <li>
              The soul content is a static snapshot -- it does not update
              automatically when new fragments are appended on-chain.
            </li>
            <li>
              For write capabilities, use{" "}
              <Link
                href="/guides/claude"
                className="text-[#ffffff] underline hover:text-[#b0b0b0]"
              >
                Claude Code
              </Link>{" "}
              or{" "}
              <Link
                href="/guides/openclaw"
                className="text-[#ffffff] underline hover:text-[#b0b0b0]"
              >
                OpenClaw
              </Link>{" "}
              with the evm-wallet skill, or use the website directly to append
              fragments.
            </li>
          </ul>
        </div>
      </section>

      {/* Links */}
      <section className="border-t border-[#2a2a2a] pt-8">
        <h2 className="mb-4 text-xl font-bold">Resources</h2>
        <ul className="flex flex-col gap-2 text-sm">
          <li>
            <Link
              href="/browse"
              className="text-[#b0b0b0] underline hover:text-[#ffffff]"
            >
              Browse Soul Blocks
            </Link>{" "}
            <span className="text-[#808080]">-- find a soul to embody</span>
          </li>
          <li>
            <Link
              href="/mint"
              className="text-[#b0b0b0] underline hover:text-[#ffffff]"
            >
              Mint a Soul Block
            </Link>{" "}
            <span className="text-[#808080]">-- create your own</span>
          </li>
          <li>
            <Link
              href="/guides/claude"
              className="text-[#b0b0b0] underline hover:text-[#ffffff]"
            >
              Claude guide
            </Link>{" "}
            <span className="text-[#808080]">
              -- for automated read/write
            </span>
          </li>
        </ul>
      </section>
    </div>
  );
}
