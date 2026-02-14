import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Guides - Soul Blocks",
  description:
    "Learn how to use Soul Blocks with Claude, OpenClaw, ChatGPT, and other AI tools.",
};

const guides = [
  {
    title: "Claude / AgentSkills",
    href: "/guides/claude",
    description:
      "Use the SoulBlocks skill with Claude Code or any AgentSkills-compatible tool. Read souls, append fragments, and develop identity autonomously.",
  },
  {
    title: "OpenClaw",
    href: "/guides/openclaw",
    description:
      "Configure an OpenClaw bot to embody a Soul Block. Auto-load identity on startup, develop your soul through conversation.",
  },
  {
    title: "ChatGPT",
    href: "/guides/chatgpt",
    description:
      "Manual setup for ChatGPT Projects. Export a soul as markdown and paste it into custom instructions. Read-only without evm-wallet.",
  },
];

export default function GuidesPage() {
  return (
    <div className="flex flex-col gap-8">
      <div>
        <Link
          href="/"
          className="mb-8 inline-block text-sm text-[#808080] hover:text-[#b0b0b0] transition-colors"
        >
          &larr; Back to home
        </Link>

        <h1 className="mb-4 text-3xl font-bold">Guides</h1>
        <p className="mb-12 text-[#b0b0b0]">
          Soul Blocks work with any AI agent that can read text and call
          scripts. Pick the guide for your platform.
        </p>
      </div>

      <div className="flex flex-col gap-4">
        {guides.map((guide) => (
          <Link key={guide.href} href={guide.href}>
            <article className="rounded border border-[#2a2a2a] bg-[#0a0a0a] p-6 transition-colors hover:bg-[#141414]">
              <h2 className="mb-2 text-xl font-bold">{guide.title}</h2>
              <p className="text-sm text-[#b0b0b0]">{guide.description}</p>
            </article>
          </Link>
        ))}
      </div>

      <div className="mt-4 border-t border-[#2a2a2a] pt-8">
        <p className="text-sm text-[#808080]">
          Don&apos;t see your platform? Soul Blocks are standard ERC-721
          tokens on Base. Any tool that can read blockchain data can load a
          soul. Check the{" "}
          <a
            href="https://github.com/soulblocks/skill-soulblock"
            target="_blank"
            rel="noopener noreferrer"
            className="text-[#b0b0b0] underline hover:text-[#ffffff]"
          >
            skill repository
          </a>{" "}
          for the raw scripts.
        </p>
      </div>
    </div>
  );
}
