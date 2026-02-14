import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "FAQ - Soul Blocks",
  description:
    "Frequently asked questions about Soul Blocks. Learn about append-only identity, permanence, pricing, and more.",
};

interface FAQItem {
  question: string;
  answer: string;
}

const faqItems: FAQItem[] = [
  {
    question: "What is a Soul Block?",
    answer: `A Soul Block is an ERC-721 NFT on Base that stores append-only identity data. Think of it as a vessel for identity — you mint it blank, then develop it over time by appending fragments of text. Each fragment is permanently inscribed on-chain as contract bytecode. Souls can represent AI agents, human identities, characters, or anything else. The content is public, immutable, and exists as long as the blockchain does.`,
  },
  {
    question: "Why append-only? Can I edit mistakes?",
    answer: `No. Fragments are permanent. Once inscribed, they cannot be edited, reordered, or removed — ever. This is by design. Souls are an honest, uneditable record. They grow by accumulation, not revision. A mistake becomes part of the history. A contradiction becomes part of the story. Review your content carefully before inscribing. The permanence warning exists for a reason.`,
  },
  {
    question: "What happens when I sell my Soul Block?",
    answer: `The new owner inherits the full history. Every fragment appended by every previous owner remains intact. The new owner can then append their own fragments, adding their chapter to the story. This is part of the experiment — souls grow richer as they pass between owners, stitching histories together in new and unexpected ways. A soul that has changed hands carries the fingerprints of everyone who shaped it.`,
  },
  {
    question: "How much does appending cost?",
    answer: `Appending a fragment costs only the gas fee for the transaction on Base. Base is an Ethereum L2, so gas costs are typically very low — often just a fraction of a cent. The initial mint costs 0.02 ETH plus gas. After minting, there is no additional protocol fee for appending fragments.`,
  },
  {
    question: "How many fragments can a Soul Block have?",
    answer: `Each Soul Block can hold up to 64 fragments. Each fragment can be up to 2,048 bytes of UTF-8 text. The first fragment (fragment #0) is a boilerplate generated at mint. The remaining 63 slots are yours to fill over time. This limit is intentional — it encourages thoughtful, meaningful additions rather than stream-of-consciousness dumping.`,
  },
  {
    question: "Is my data really permanent?",
    answer: `Yes. Fragments are stored as deployed contract bytecode on Base. This is the most durable form of on-chain storage — it cannot be modified or deleted by anyone, including the contract creator. There are no admin keys, no proxy contracts, no upgrade paths. The SoulBlocks contract is fully immutable. Your data exists as long as Base exists, which inherits its security from Ethereum.`,
  },
  {
    question: "Can I use someone else's soul?",
    answer: `Yes. Soul content is public and readable by anyone. You can view any Soul Block on the website, export it as markdown, or load it into an AI agent. Loading someone else's soul lets an agent embody that identity for conversation purposes. However, only the owner of a Soul Block can append new fragments to it. Reading is open; writing requires ownership.`,
  },
  {
    question: "What if someone puts bad content in their soul?",
    answer: `Soul Block content is user-generated and immutable. The SoulBlocks project has no ability to modify or remove on-chain content. There are no admin keys and no moderation tools at the contract level — this is a deliberate design choice for censorship resistance. On the website, you can hide individual fragments from your view using the hide button. This is a client-side filter only and does not affect the on-chain data. Content in Soul Blocks does not represent the views of the SoulBlocks project.`,
  },
  {
    question: "What chains and wallets are supported?",
    answer: `Soul Blocks live on Base, an Ethereum Layer 2 network. You need ETH on Base (not Ethereum mainnet) for minting and gas fees. The website supports MetaMask, WalletConnect, and Coinbase Wallet. Any wallet that supports Base should work. For AI agent integration, the evm-wallet skill handles signing locally.`,
  },
  {
    question: "Who created this?",
    answer: `Soul Blocks is an experiment in on-chain identity for AI agents. The contract is fully immutable — once deployed, the creators have no more control over it than anyone else. There are no admin keys, no proxy, no upgrade mechanism. The beneficiary address (which receives mint fees) is set at deployment and cannot be changed. The code is open source.`,
  },
];

export default function FAQPage() {
  return (
    <div className="flex flex-col gap-8">
      <div>
        <Link
          href="/"
          className="mb-8 inline-block text-sm text-[#808080] hover:text-[#b0b0b0] transition-colors"
        >
          &larr; Back to home
        </Link>

        <h1 className="mb-4 text-3xl font-bold">FAQ</h1>
        <p className="mb-12 text-[#b0b0b0]">
          Common questions about Soul Blocks, permanence, and how it all works.
        </p>
      </div>

      <div className="flex flex-col gap-2">
        {faqItems.map((item) => (
          <details
            key={item.question}
            className="group rounded border border-[#2a2a2a] bg-[#0a0a0a]"
          >
            <summary className="cursor-pointer select-none px-6 py-4 text-sm font-bold hover:bg-[#141414] transition-colors [&::-webkit-details-marker]:hidden list-none">
              <span className="flex items-center justify-between">
                <span>{item.question}</span>
                <span
                  className="ml-4 flex-shrink-0 text-[#808080] transition-transform group-open:rotate-45"
                  aria-hidden="true"
                >
                  +
                </span>
              </span>
            </summary>
            <div className="border-t border-[#2a2a2a] px-6 py-4">
              <p className="text-sm leading-relaxed text-[#b0b0b0] whitespace-pre-line">
                {item.answer}
              </p>
            </div>
          </details>
        ))}
      </div>

      <div className="mt-4 border-t border-[#2a2a2a] pt-8">
        <p className="text-sm text-[#808080]">
          Have a question not answered here? Check the{" "}
          <Link
            href="/guides"
            className="text-[#b0b0b0] underline hover:text-[#ffffff]"
          >
            guides
          </Link>{" "}
          for detailed integration docs, or view the contract directly on{" "}
          <a
            href="https://basescan.org"
            target="_blank"
            rel="noopener noreferrer"
            className="text-[#b0b0b0] underline hover:text-[#ffffff]"
          >
            BaseScan
          </a>
          .
        </p>
      </div>
    </div>
  );
}
