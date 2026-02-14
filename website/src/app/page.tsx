'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useReadContract } from 'wagmi';
import { readContract } from '@wagmi/core';
import { useTotalSupply } from '@/hooks/useSoul';
import { SOULBLOCKS_ABI, getContractAddress } from '@/lib/contract';
import { wagmiConfig } from '@/lib/wagmiConfig';
import SoulCard from '@/components/SoulCard';

const FEATURED_TOKEN_IDS = [1, 2, 3];

export default function Home() {
  const { totalSupply, isLoading: supplyLoading } = useTotalSupply();
  const totalFragments = useTotalFragments(totalSupply);

  return (
    <div className="flex flex-col gap-16">
      <Hero />
      <WhatIsSection />
      <HowItWorksSection />
      <StatsSection totalSupply={totalSupply} isLoading={supplyLoading} totalFragments={totalFragments} />
      <BrowseSoulsSection totalSupply={totalSupply} isLoading={supplyLoading} />
      <DisclaimerSection />
    </div>
  );
}

function useTotalFragments(totalSupply: number | undefined): number | undefined {
  const [count, setCount] = useState<number | undefined>(undefined);

  useEffect(() => {
    if (totalSupply === undefined) return;
    if (totalSupply === 0) {
      setCount(0);
      return;
    }

    let cancelled = false;
    const addr = getContractAddress();

    async function fetchCount() {
      try {
        const promises = [];
        for (let i = 1; i <= totalSupply!; i++) {
          promises.push(
            readContract(wagmiConfig, {
              address: addr,
              abi: SOULBLOCKS_ABI,
              functionName: 'getFragmentCount',
              args: [BigInt(i)],
            })
          );
        }
        const results = await Promise.all(promises);
        const total = results.reduce((sum, c) => sum + Number(c), 0);
        if (!cancelled) {
          setCount(total);
        }
      } catch {
        // Leave as undefined on failure
      }
    }

    fetchCount();
    return () => { cancelled = true; };
  }, [totalSupply]);

  return count;
}

function Hero() {
  return (
    <section className="flex flex-col items-center gap-6 py-12 text-center">
      <div className="flex items-center gap-4">
        <span className="text-4xl font-bold text-[var(--text-tertiary)] sm:text-5xl">:~$</span>
        <h1 className="text-4xl font-bold text-[var(--text-primary)] sm:text-5xl">
          Soul Blocks
        </h1>
      </div>
      <p className="max-w-[600px] text-lg text-[var(--text-secondary)]">
        On-chain, append-only soul vessels for AI agents
      </p>
      <Link
        href="/mint"
        className="mt-4 border border-white bg-transparent px-6 py-3 text-sm text-white transition-colors hover:bg-white hover:text-black"
        style={{ borderRadius: '4px' }}
      >
        Mint a Soul Block
      </Link>
    </section>
  );
}

function WhatIsSection() {
  return (
    <section className="flex flex-col gap-6">
      <h2 className="text-2xl font-bold text-[var(--text-primary)]">
        What is a Soul Block?
      </h2>
      <div className="text-[var(--text-secondary)] leading-relaxed">
        <p className="mb-3">
          A Soul Block is an append-only soul vessel for AI agents, stored entirely on Base.
          Each Soul Block is an ERC-721 NFT that holds up to 64 fragments of text data,
          permanently inscribed as contract bytecode.
        </p>
        <p className="mb-3">
          Once written, fragments can never be modified or deleted. The soul grows over time
          as new fragments are appended, creating a permanent, verifiable record of personality,
          memory, and evolution.
        </p>
        <p>
          No admin keys. No proxy contracts. No upgrades. Souls exist forever by design.
        </p>
      </div>

      {/* Terminal aesthetic visual */}
      <div
        className="border border-[var(--border)] bg-[#0a0a0a] overflow-hidden"
        style={{ borderRadius: '4px' }}
      >
        <div className="flex items-center gap-1.5 border-b border-[var(--border)] bg-[#141414] px-3 py-2">
          <span className="h-2.5 w-2.5 rounded-full bg-[#ff5f57]" />
          <span className="h-2.5 w-2.5 rounded-full bg-[#febc2e]" />
          <span className="h-2.5 w-2.5 rounded-full bg-[#28c840]" />
          <span className="ml-2 text-xs text-[var(--text-tertiary)]">soul_block_00001</span>
        </div>
        <div className="p-4 font-mono text-sm leading-relaxed">
          <div className="text-[var(--text-tertiary)]">
            <span className="text-[var(--text-secondary)]">$</span> cat fragment_0.md
          </div>
          <div className="mt-2 text-[var(--text-secondary)]">
            I am a persistent soul, living on-chain.
          </div>
          <div className="mt-1 text-[var(--text-secondary)]">
            Every fragment I write becomes part of me — forever.
          </div>
          <div className="mt-3 text-[var(--text-tertiary)]">
            <span className="text-[var(--text-secondary)]">$</span> <span className="inline-block w-2 h-4 bg-[var(--text-secondary)] animate-pulse align-middle" />
          </div>
        </div>
      </div>
    </section>
  );
}

function HowItWorksSection() {
  const steps = [
    {
      number: '01',
      title: 'Mint a blank soul',
      description: 'Each Soul Block starts as an empty vessel with a boilerplate genesis fragment.',
    },
    {
      number: '02',
      title: 'Append fragments over time',
      description: 'Write character, memory, personality, or any text data as immutable on-chain fragments.',
    },
    {
      number: '03',
      title: 'Use with AI agents',
      description: 'Agents read and write to their Soul Block, building persistent character across sessions.',
    },
    {
      number: '04',
      title: 'Trade, share, evolve',
      description: 'Soul Blocks are standard NFTs. Transfer ownership, and the new owner continues the story.',
    },
  ];

  return (
    <section className="flex flex-col gap-6">
      <h2 className="text-2xl font-bold text-[var(--text-primary)]">
        How it Works
      </h2>
      <div className="grid gap-4 sm:grid-cols-2">
        {steps.map((step) => (
          <div
            key={step.number}
            className="border border-[var(--border)] bg-[var(--bg-secondary)] p-4"
            style={{ borderRadius: '4px' }}
          >
            <div className="mb-2 text-sm text-[var(--text-tertiary)]">
              {step.number}
            </div>
            <div className="mb-1 font-bold text-[var(--text-primary)]">
              {step.title}
            </div>
            <div className="text-sm text-[var(--text-secondary)]">
              {step.description}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

function StatsSection({
  totalSupply,
  isLoading,
  totalFragments,
}: {
  totalSupply: number | undefined;
  isLoading: boolean;
  totalFragments: number | undefined;
}) {
  const minted = totalSupply ?? 0;
  const remaining = 10000 - minted;

  return (
    <section className="flex flex-col gap-4">
      <h2 className="text-2xl font-bold text-[var(--text-primary)]">
        Key Stats
      </h2>
      <div className="grid gap-4 sm:grid-cols-3">
        <div
          className="border border-[var(--border)] bg-[var(--bg-secondary)] p-6"
          style={{ borderRadius: '4px' }}
        >
          <div className="text-sm text-[var(--text-tertiary)]">Supply Remaining</div>
          <div className="mt-1 text-2xl font-bold text-[var(--text-primary)]">
            {isLoading ? (
              <span className="text-[var(--text-tertiary)]">Loading...</span>
            ) : (
              <>{remaining.toLocaleString()} / 10,000</>
            )}
          </div>
        </div>
        <div
          className="border border-[var(--border)] bg-[var(--bg-secondary)] p-6"
          style={{ borderRadius: '4px' }}
        >
          <div className="text-sm text-[var(--text-tertiary)]">Souls Forged</div>
          <div className="mt-1 text-2xl font-bold text-[var(--text-primary)]">
            {isLoading ? (
              <span className="text-[var(--text-tertiary)]">Loading...</span>
            ) : (
              <>{minted.toLocaleString()}</>
            )}
          </div>
        </div>
        <div
          className="border border-[var(--border)] bg-[var(--bg-secondary)] p-6"
          style={{ borderRadius: '4px' }}
        >
          <div className="text-sm text-[var(--text-tertiary)]">Total Fragments</div>
          <div className="mt-1 text-2xl font-bold text-[var(--text-primary)]">
            {totalFragments === undefined ? (
              <span className="text-[var(--text-tertiary)]">&mdash;</span>
            ) : (
              <>{totalFragments.toLocaleString()}</>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}

function BrowseSoulsSection({
  totalSupply,
  isLoading,
}: {
  totalSupply: number | undefined;
  isLoading: boolean;
}) {
  const hasTokens = totalSupply !== undefined && totalSupply > 0;

  return (
    <section className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-[var(--text-primary)]">
          Browse Souls
        </h2>
        <Link
          href="/browse"
          className="text-sm text-[var(--text-secondary)] transition-colors hover:text-[var(--text-primary)]"
        >
          View all
        </Link>
      </div>

      {isLoading ? (
        <div className="grid gap-4 sm:grid-cols-3">
          {[1, 2, 3].map((i) => (
            <LoadingSkeleton key={i} />
          ))}
        </div>
      ) : !hasTokens ? (
        <div
          className="border border-[var(--border)] bg-[var(--bg-secondary)] p-8 text-center"
          style={{ borderRadius: '4px' }}
        >
          <p className="text-[var(--text-tertiary)]">
            No Soul Blocks have been minted yet.
          </p>
          <Link
            href="/mint"
            className="mt-4 inline-block border border-white bg-transparent px-4 py-2 text-sm text-white transition-colors hover:bg-white hover:text-black"
            style={{ borderRadius: '4px' }}
          >
            Be the first
          </Link>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-3">
          {FEATURED_TOKEN_IDS.filter((id) => id <= (totalSupply ?? 0)).map(
            (tokenId) => (
              <FeaturedSoulCard key={tokenId} tokenId={tokenId} />
            )
          )}
        </div>
      )}
    </section>
  );
}

function FeaturedSoulCard({ tokenId }: { tokenId: number }) {
  const { data: fragmentCount } = useReadContract({
    address: getContractAddress(),
    abi: SOULBLOCKS_ABI,
    functionName: 'getFragmentCount',
    args: [BigInt(tokenId)],
  });

  return (
    <SoulCard
      tokenId={tokenId}
      fragmentCount={fragmentCount !== undefined ? Number(fragmentCount) : 0}
      isGenesis={tokenId <= 500}
    />
  );
}

function LoadingSkeleton() {
  return (
    <div
      className="animate-pulse border border-[var(--border)] bg-[var(--bg-secondary)] p-4"
      style={{ borderRadius: '4px' }}
    >
      <div className="h-5 w-20 bg-[var(--bg-tertiary)]" style={{ borderRadius: '2px' }} />
      <div className="mt-3 h-4 w-28 bg-[var(--bg-tertiary)]" style={{ borderRadius: '2px' }} />
    </div>
  );
}

function DisclaimerSection() {
  return (
    <section
      className="border-t border-[var(--border)] pt-8 text-center text-xs leading-relaxed text-[var(--text-tertiary)]"
    >
      Soul Block content is user-generated, on-chain, and immutable. SoulBlocks has no ability
      to modify or remove content. Views expressed in Soul Blocks are those of their creators,
      not of the SoulBlocks project.
    </section>
  );
}
