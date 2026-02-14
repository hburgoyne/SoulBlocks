'use client';

import { useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useReadContract } from 'wagmi';
import { useTotalSupply } from '@/hooks/useSoul';
import { SOULBLOCKS_ABI, getContractAddress } from '@/lib/contract';
import SoulCard from '@/components/SoulCard';

const PAGE_SIZE = 20;

export default function BrowsePage() {
  const { totalSupply, isLoading: supplyLoading, isError: supplyError } = useTotalSupply();
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);
  const [searchValue, setSearchValue] = useState('');
  const router = useRouter();

  const tokenIds = useMemo(() => {
    if (totalSupply === undefined || totalSupply === 0) return [];
    const ids: number[] = [];
    for (let i = totalSupply; i >= 1 && ids.length < visibleCount; i--) {
      ids.push(i);
    }
    return ids;
  }, [totalSupply, visibleCount]);

  const hasMore = totalSupply !== undefined && visibleCount < totalSupply;

  const [searchError, setSearchError] = useState('');

  function handleSearch() {
    const trimmed = searchValue.trim();
    if (!trimmed) return;

    if (!/^\d+$/.test(trimmed)) {
      setSearchError('Please enter a valid numeric token ID.');
      return;
    }

    const id = parseInt(trimmed, 10);
    if (id <= 0) {
      setSearchError('Token ID must be a positive number.');
      return;
    }

    if (totalSupply !== undefined && id > totalSupply) {
      setSearchError(`Token #${id} has not been minted yet. Total minted: ${totalSupply}.`);
      return;
    }

    setSearchError('');
    router.push(`/soul/${id}`);
  }

  function handleSearchKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Enter') {
      handleSearch();
    }
  }

  function handleLoadMore() {
    setVisibleCount((prev) => prev + PAGE_SIZE);
  }

  return (
    <div className="flex flex-col gap-8">
      <h1 className="text-3xl font-bold text-[var(--text-primary)]">
        Browse Soul Blocks
      </h1>

      <section className="flex gap-2">
        <input
          type="text"
          value={searchValue}
          onChange={(e) => { setSearchValue(e.target.value); setSearchError(''); }}
          onKeyDown={handleSearchKeyDown}
          placeholder="Enter token ID..."
          className="flex-1 border border-[var(--border)] bg-[var(--bg-secondary)] px-4 py-2 text-sm text-[var(--text-primary)] placeholder-[var(--text-tertiary)] outline-none focus:border-[var(--text-secondary)]"
          style={{ borderRadius: '4px' }}
        />
        <button
          onClick={handleSearch}
          disabled={!searchValue.trim()}
          className="border border-white bg-transparent px-6 py-2 text-sm text-white transition-colors hover:bg-white hover:text-black disabled:cursor-not-allowed disabled:border-[var(--text-tertiary)] disabled:text-[var(--text-tertiary)] disabled:hover:bg-transparent disabled:hover:text-[var(--text-tertiary)]"
          style={{ borderRadius: '4px' }}
        >
          Go
        </button>
      </section>

      {searchError && (
        <p className="text-sm text-[var(--error)]">{searchError}</p>
      )}

      <section
        className="border border-[var(--border)] bg-[var(--bg-secondary)] px-4 py-3"
        style={{ borderRadius: '4px' }}
      >
        <span className="text-sm text-[var(--text-tertiary)]">Total minted: </span>
        <span className="text-sm font-bold text-[var(--text-primary)]">
          {supplyLoading ? (
            <span className="text-[var(--text-tertiary)]">Loading...</span>
          ) : supplyError ? (
            <span className="text-[var(--error)]">Error loading supply</span>
          ) : (
            <>{totalSupply ?? 0} / 10,000</>
          )}
        </span>
      </section>

      <section>
        {supplyLoading ? (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 6 }, (_, i) => (
              <LoadingSkeleton key={i} />
            ))}
          </div>
        ) : totalSupply === 0 || totalSupply === undefined ? (
          <EmptyState />
        ) : (
          <>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {tokenIds.map((tokenId) => (
                <BrowseSoulCard key={tokenId} tokenId={tokenId} />
              ))}
            </div>

            {hasMore && (
              <div className="mt-8 text-center">
                <button
                  onClick={handleLoadMore}
                  className="border border-white bg-transparent px-6 py-2 text-sm text-white transition-colors hover:bg-white hover:text-black"
                  style={{ borderRadius: '4px' }}
                >
                  Load more
                </button>
              </div>
            )}
          </>
        )}
      </section>
    </div>
  );
}

function BrowseSoulCard({ tokenId }: { tokenId: number }) {
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

function EmptyState() {
  return (
    <div
      className="border border-[var(--border)] bg-[var(--bg-secondary)] p-12 text-center"
      style={{ borderRadius: '4px' }}
    >
      <p className="text-lg text-[var(--text-tertiary)]">
        No Soul Blocks have been minted yet.
      </p>
      <Link
        href="/mint"
        className="mt-6 inline-block border border-white bg-transparent px-6 py-3 text-sm text-white transition-colors hover:bg-white hover:text-black"
        style={{ borderRadius: '4px' }}
      >
        Mint the First Soul Block
      </Link>
    </div>
  );
}
