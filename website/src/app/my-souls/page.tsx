'use client';

import Link from 'next/link';
import { useAccount, useConnect, useConnectors, useReadContract } from 'wagmi';
import SoulCard from '@/components/SoulCard';
import { truncateAddress, decodeHexContent } from '@/lib/utils';
import { SOULBLOCKS_ABI, getContractAddress } from '@/lib/contract';

export default function MySoulsPage() {
  const { address, isConnected } = useAccount();
  const { connect } = useConnect();
  const connectors = useConnectors();

  function handleConnect(connector?: (typeof connectors)[number]) {
    if (connector) {
      connect({ connector });
    } else if (connectors.length > 0) {
      connect({ connector: connectors[0] });
    }
  }

  // Not connected state
  if (!isConnected || !address) {
    return (
      <div className="font-mono">
        <h1 className="mb-8 text-2xl font-bold text-white">My Soul Blocks</h1>
        <div
          className="border border-[#2a2a2a] bg-[#0a0a0a] p-8 text-center"
          style={{ borderRadius: '4px' }}
        >
          <p className="mb-4 text-[#b0b0b0]">
            Connect your wallet to see your owned Soul Blocks.
          </p>
          <div className="flex flex-wrap items-center justify-center gap-3">
            {connectors.map((connector) => (
              <button
                key={connector.uid}
                onClick={() => handleConnect(connector)}
                className="border border-white bg-transparent px-6 py-3 text-sm text-white transition-colors hover:bg-white hover:text-black"
                style={{ borderRadius: '4px' }}
              >
                {connector.name}
              </button>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="font-mono">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-white">My Soul Blocks</h1>
        <p className="mt-2 text-sm text-[#808080]">
          {truncateAddress(address)}
        </p>
      </div>

      {/* Soul list */}
      <OwnedSoulsList ownerAddress={address} />
    </div>
  );
}

function OwnedSoulsList({ ownerAddress }: { ownerAddress: string }) {
  const {
    data: balance,
    isLoading: balanceLoading,
    isError: balanceError,
  } = useReadContract({
    address: getContractAddress(),
    abi: SOULBLOCKS_ABI,
    functionName: 'balanceOf',
    args: [ownerAddress as `0x${string}`],
  });

  const balanceNumber = balance !== undefined ? Number(balance) : undefined;

  if (balanceLoading) {
    return (
      <div className="py-8 text-center">
        <p className="text-[#b0b0b0]">Loading your souls...</p>
      </div>
    );
  }

  if (balanceError) {
    return (
      <div className="py-8 text-center">
        <p className="text-[#ff4444]">Failed to load your Soul Blocks.</p>
        <p className="mt-2 text-sm text-[#808080]">Please try again later.</p>
      </div>
    );
  }

  if (balanceNumber === undefined || balanceNumber === 0) {
    return (
      <div
        className="border border-[#2a2a2a] bg-[#0a0a0a] p-8 text-center"
        style={{ borderRadius: '4px' }}
      >
        <p className="mb-4 text-[#b0b0b0]">
          You don&apos;t own any Soul Blocks yet.
        </p>
        <Link
          href="/mint"
          className="inline-block border border-white bg-transparent px-6 py-3 text-sm text-white transition-colors hover:bg-white hover:text-black"
          style={{ borderRadius: '4px' }}
        >
          Mint your first soul
        </Link>
      </div>
    );
  }

  const indices = Array.from({ length: balanceNumber }, (_, i) => i);

  return (
    <div className="grid gap-4 sm:grid-cols-2">
      {indices.map((index) => (
        <OwnedSoulCard
          key={index}
          ownerAddress={ownerAddress}
          index={index}
        />
      ))}
    </div>
  );
}

function OwnedSoulCard({
  ownerAddress,
  index,
}: {
  ownerAddress: string;
  index: number;
}) {
  const {
    data: tokenId,
    isLoading: tokenIdLoading,
    isError: tokenIdError,
  } = useReadContract({
    address: getContractAddress(),
    abi: SOULBLOCKS_ABI,
    functionName: 'tokenOfOwnerByIndex',
    args: [ownerAddress as `0x${string}`, BigInt(index)],
  });

  const tokenIdNumber = tokenId !== undefined ? Number(tokenId) : undefined;

  if (tokenIdLoading || tokenIdNumber === undefined) {
    return (
      <div
        className="border border-[#2a2a2a] bg-[#0a0a0a] p-4"
        style={{ borderRadius: '4px' }}
      >
        <div className="h-5 w-20 animate-pulse bg-[#141414]" style={{ borderRadius: '2px' }} />
        <div className="mt-2 h-4 w-32 animate-pulse bg-[#141414]" style={{ borderRadius: '2px' }} />
      </div>
    );
  }

  if (tokenIdError) {
    return (
      <div
        className="border border-[#2a2a2a] bg-[#0a0a0a] p-4"
        style={{ borderRadius: '4px' }}
      >
        <p className="text-sm text-[#ff4444]">Failed to load token</p>
      </div>
    );
  }

  return <OwnedSoulCardDetails tokenId={tokenIdNumber} />;
}

function OwnedSoulCardDetails({ tokenId }: { tokenId: number }) {
  const contractAddress = getContractAddress();

  const {
    data: fragmentCount,
    isLoading: fragmentCountLoading,
  } = useReadContract({
    address: contractAddress,
    abi: SOULBLOCKS_ABI,
    functionName: 'getFragmentCount',
    args: [BigInt(tokenId)],
  });

  const fragmentCountNumber = fragmentCount !== undefined ? Number(fragmentCount) : 0;
  const hasFragments = fragmentCountNumber > 0;

  // Fetch first fragment content for preview
  const {
    data: firstFragmentContent,
  } = useReadContract({
    address: contractAddress,
    abi: SOULBLOCKS_ABI,
    functionName: 'getFragmentContent',
    args: [BigInt(tokenId), 0n],
    query: {
      enabled: hasFragments,
    },
  });

  const preview = firstFragmentContent
    ? decodeHexContent(firstFragmentContent as `0x${string}`).slice(0, 100)
    : undefined;

  const isGenesis = tokenId <= 500;

  if (fragmentCountLoading) {
    return (
      <div
        className="border border-[#2a2a2a] bg-[#0a0a0a] p-4"
        style={{ borderRadius: '4px' }}
      >
        <div className="h-5 w-20 animate-pulse bg-[#141414]" style={{ borderRadius: '2px' }} />
        <div className="mt-2 h-4 w-32 animate-pulse bg-[#141414]" style={{ borderRadius: '2px' }} />
      </div>
    );
  }

  return (
    <div>
      <SoulCard
        tokenId={tokenId}
        fragmentCount={fragmentCountNumber}
        isGenesis={isGenesis}
        preview={preview}
      />
      <div className="mt-2 flex gap-2">
        <Link
          href={`/soul/${tokenId}`}
          className="flex-1 border border-[#2a2a2a] bg-transparent px-3 py-1.5 text-center text-xs text-[#b0b0b0] transition-colors hover:border-white hover:text-white"
          style={{ borderRadius: '4px' }}
        >
          View
        </Link>
        <Link
          href={`/append/${tokenId}`}
          className="flex-1 border border-[#2a2a2a] bg-transparent px-3 py-1.5 text-center text-xs text-[#b0b0b0] transition-colors hover:border-white hover:text-white"
          style={{ borderRadius: '4px' }}
        >
          Append
        </Link>
      </div>
    </div>
  );
}
