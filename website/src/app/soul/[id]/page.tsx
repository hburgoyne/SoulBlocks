'use client';

import { useEffect, useMemo, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAccount, useBlockNumber, useReadContract, useSwitchChain } from 'wagmi';
import { useSoul, useFragments } from '@/hooks/useSoul';
import FragmentViewer from '@/components/FragmentViewer';
import {
  padTokenId,
  truncateAddress,
  formatAge,
  getErrorMessage,
  getExpectedChainId,
  isTokenNotFoundError,
} from '@/lib/utils';
import { SOULBLOCKS_ABI, getContractAddress, getAddressExplorerUrl } from '@/lib/contract';

function isValidTokenId(id: unknown): boolean {
  if (typeof id !== 'string') return false;
  const num = Number(id);
  return Number.isInteger(num) && num >= 1;
}

export default function SoulViewerPage() {
  const params = useParams();
  const rawId = params.id;
  const validId = isValidTokenId(rawId);
  const tokenId = validId ? Number(rawId) : 0;

  // key={tokenId} ensures full remount when navigating between souls
  return validId ? (
    <SoulViewerContent key={tokenId} tokenId={tokenId} />
  ) : (
    <InvalidTokenRedirect />
  );
}

function InvalidTokenRedirect() {
  const router = useRouter();

  useEffect(() => {
    router.replace('/browse');
  }, [router]);

  return (
    <div className="py-16 text-center font-mono">
      <p className="text-[#ff4444]">Invalid token ID.</p>
      <p className="mt-2 text-sm text-[#808080]">Redirecting...</p>
    </div>
  );
}

function SoulViewerContent({ tokenId }: { tokenId: number }) {
  const router = useRouter();
  const { address, isConnected, chain } = useAccount();
  const { switchChain } = useSwitchChain();
  const { data: currentBlock } = useBlockNumber();

  const expectedChainId = getExpectedChainId();
  const wrongNetwork = isConnected && chain?.id !== expectedChainId;

  const {
    owner,
    fragmentCount,
    genesisBlock,
    minter,
    isLoading: soulLoading,
    isError: soulError,
    error: soulErr,
  } = useSoul(tokenId);

  const {
    fragments,
    isLoading: fragmentsLoading,
    isAllLoaded,
    isError: fragmentsError,
    loadedCount,
    totalCount,
  } = useFragments(tokenId);

  // Fetch tokenURI for SVG display
  const {
    data: tokenURIData,
  } = useReadContract({
    address: getContractAddress(),
    abi: SOULBLOCKS_ABI,
    functionName: 'tokenURI',
    args: [BigInt(tokenId)],
  });

  const svgImageSrc = useMemo(() => {
    if (!tokenURIData) return undefined;
    const uri = tokenURIData as string;
    const jsonPrefix = 'data:application/json;base64,';
    if (!uri.startsWith(jsonPrefix)) return undefined;
    try {
      const jsonStr = atob(uri.slice(jsonPrefix.length));
      const metadata = JSON.parse(jsonStr);
      if (typeof metadata.image === 'string') {
        return metadata.image;
      }
    } catch {
      // Malformed tokenURI — ignore
    }
    return undefined;
  }, [tokenURIData]);

  const [redirectMessage, setRedirectMessage] = useState('');
  const [networkError, setNetworkError] = useState(false);
  const [copiedSoul, setCopiedSoul] = useState<'idle' | 'copied' | 'failed'>('idle');
  const [copiedLink, setCopiedLink] = useState<'idle' | 'copied' | 'failed'>('idle');
  const [canNativeShare, setCanNativeShare] = useState(false);

  const isGenesis = tokenId <= 500;
  const isOwner = address && owner && address.toLowerCase() === owner.toLowerCase();
  const hasChangedHands = owner && minter && owner.toLowerCase() !== minter.toLowerCase();
  const paddedId = padTokenId(tokenId);
  const soulUrl = `https://soulblocks.ai/soul/${tokenId}`;

  useEffect(() => {
    setCanNativeShare(typeof navigator !== 'undefined' && typeof navigator.share === 'function');
  }, []);

  useEffect(() => {
    if (soulError) {
      if (isTokenNotFoundError(soulErr)) {
        setRedirectMessage(`Soul Block #${tokenId} doesn't exist yet. Mint one!`);
        const timeout = setTimeout(() => {
          router.push('/mint');
        }, 2000);
        return () => clearTimeout(timeout);
      } else if (!soulLoading) {
        setNetworkError(true);
      }
    }
  }, [soulError, soulLoading, soulErr, tokenId, router]);

  function handleCopySoul() {
    if (!isAllLoaded) return;
    const body = fragments.map((f) => f.content).join('\n\n');
    navigator.clipboard.writeText(body).then(() => {
      setCopiedSoul('copied');
      setTimeout(() => setCopiedSoul('idle'), 2000);
    }).catch(() => {
      setCopiedSoul('failed');
      setTimeout(() => setCopiedSoul('idle'), 2000);
    });
  }

  function handleCopyLink() {
    navigator.clipboard.writeText(soulUrl).then(() => {
      setCopiedLink('copied');
      setTimeout(() => setCopiedLink('idle'), 2000);
    }).catch(() => {
      setCopiedLink('failed');
      setTimeout(() => setCopiedLink('idle'), 2000);
    });
  }

  function handleShareX() {
    const text = encodeURIComponent(`Check out Soul Block #${paddedId}`);
    const url = encodeURIComponent(soulUrl);
    window.open(`https://twitter.com/intent/tweet?text=${text}&url=${url}`, '_blank');
  }

  function handleNativeShare() {
    if (navigator.share) {
      navigator.share({
        title: `Soul Block #${paddedId}`,
        url: soulUrl,
      }).catch(() => {
        // User cancelled or share failed — silently ignore
      });
    }
  }

  if (redirectMessage) {
    return (
      <div className="py-16 text-center font-mono">
        <div
          className="mx-auto max-w-md border border-[#2a2a2a] bg-[#0a0a0a] px-6 py-4"
          style={{ borderRadius: '4px' }}
        >
          <p className="text-[#ff4444]">{redirectMessage}</p>
          <p className="mt-2 text-sm text-[#808080]">Redirecting to mint page...</p>
        </div>
      </div>
    );
  }

  if (networkError || (soulError && !redirectMessage)) {
    return (
      <div className="py-16 text-center font-mono">
        <p className="text-[#ff4444]">{getErrorMessage(soulErr)}</p>
        <button
          onClick={() => window.location.reload()}
          className="mt-4 border border-white bg-transparent px-4 py-2 text-sm text-white transition-colors hover:bg-white hover:text-black"
          style={{ borderRadius: '4px' }}
        >
          Retry
        </button>
      </div>
    );
  }

  if (soulLoading) {
    return (
      <div className="py-16 text-center font-mono">
        <p className="text-[#b0b0b0]">Loading Soul Block #{paddedId}...</p>
      </div>
    );
  }

  const soulAge =
    genesisBlock !== undefined && currentBlock !== undefined
      ? formatAge(genesisBlock, currentBlock)
      : undefined;

  const actionButtonClasses =
    'border border-white bg-transparent px-4 py-2 text-sm text-white transition-colors hover:bg-white hover:text-black disabled:cursor-not-allowed disabled:border-[#2a2a2a] disabled:text-[#808080] disabled:hover:bg-transparent disabled:hover:text-[#808080]';
  const secondaryButtonClasses =
    'border border-[#2a2a2a] bg-transparent px-3 py-1.5 text-xs text-[#808080] transition-colors hover:border-[#808080] hover:text-[#b0b0b0]';

  return (
    <div className="font-mono">
      {/* Header with SVG */}
      <div className="mb-8">
        <div className="flex flex-row items-start gap-4">
          {/* Left: metadata */}
          <div className="flex-1 min-w-0">
            <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
              <h1 className="text-2xl font-bold text-white">
                Soul Block #{paddedId}
              </h1>
              {isGenesis && (
                <span
                  className="border border-[#44ff44] px-2 py-0.5 text-xs text-[#44ff44]"
                  style={{ borderRadius: '4px' }}
                >
                  GENESIS
                </span>
              )}
            </div>

            <div className="mt-4 space-y-2 text-sm">
              {soulAge && (
                <div className="text-[#808080]">{soulAge}</div>
              )}

              {owner && (
                <div className="flex items-center gap-2">
                  <span className="text-[#808080]">Owner:</span>
                  <a
                    href={getAddressExplorerUrl(owner)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-white underline transition-colors hover:text-[#b0b0b0]"
                  >
                    {truncateAddress(owner)}
                  </a>
                </div>
              )}

              {minter && (
                <div className="flex items-center gap-2">
                  <span className="text-[#808080]">Forged by:</span>
                  <a
                    href={getAddressExplorerUrl(minter)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-white underline transition-colors hover:text-[#b0b0b0]"
                  >
                    {truncateAddress(minter)}
                  </a>
                </div>
              )}

              {hasChangedHands && (
                <p className="mt-2 text-xs text-[#808080] italic">
                  This soul has changed hands. Its history includes fragments from
                  previous owners — part of what makes each soul unique.
                </p>
              )}

              <div className="flex items-center gap-2">
                <span className="text-[#808080]">Fragments:</span>
                <span className="text-white">
                  {fragmentCount ?? '...'} / 64
                </span>
              </div>
            </div>
          </div>

          {/* Right: SVG image */}
          {svgImageSrc && (
            <div className="flex-shrink-0">
              <img
                src={svgImageSrc}
                alt={`Soul Block #${paddedId}`}
                className="h-[150px] w-[150px] border-2 border-green-500"
                style={{ imageRendering: 'auto', borderRadius: '4px' }}
              />
            </div>
          )}
        </div>
      </div>

      {/* Actions */}
      {isOwner && (
        <div className="mb-3">
          <Link
            href={`/append/${tokenId}`}
            className={actionButtonClasses}
            style={{ borderRadius: '4px' }}
          >
            Append Fragment
          </Link>
          {wrongNetwork && (
            <div className="mt-2 flex items-center gap-2">
              <span className="text-xs text-[#ff4444]">Wrong network —</span>
              <button
                onClick={() => switchChain({ chainId: expectedChainId })}
                className="text-xs text-[#ff4444] underline transition-colors hover:text-white"
              >
                Switch to Base
              </button>
            </div>
          )}
        </div>
      )}

      {/* Share & Copy */}
      <div className="mb-6 flex flex-wrap items-center gap-3">
        <button
          onClick={handleCopySoul}
          disabled={!isAllLoaded}
          title={!isAllLoaded ? 'Loading fragments...' : undefined}
          className={secondaryButtonClasses}
          style={{ borderRadius: '4px' }}
        >
          {copiedSoul === 'copied' ? 'Copied!' : copiedSoul === 'failed' ? 'Failed' : 'Copy Markdown'}
        </button>
        <button
          onClick={handleCopyLink}
          className={secondaryButtonClasses}
          style={{ borderRadius: '4px' }}
        >
          {copiedLink === 'copied' ? 'Link copied!' : copiedLink === 'failed' ? 'Failed' : 'Copy Link'}
        </button>
        <button
          onClick={handleShareX}
          className={secondaryButtonClasses}
          style={{ borderRadius: '4px' }}
        >
          Share on X
        </button>
        {canNativeShare && (
          <button
            onClick={handleNativeShare}
            className={secondaryButtonClasses}
            style={{ borderRadius: '4px' }}
          >
            Share
          </button>
        )}
      </div>

      {/* Soul Content */}
      <div
        className="overflow-hidden border border-[#2a2a2a] bg-[#0a0a0a] p-6"
        style={{ borderRadius: '4px' }}
      >
        {fragments.length === 0 && !fragmentsLoading && isAllLoaded && (
          <p className="text-center text-[#808080]">
            This soul has no fragments yet.
          </p>
        )}

        {fragments.map((fragment) => (
          <FragmentViewer
            key={fragment.index}
            content={fragment.content}
            index={fragment.index}
            fragmentAddress={fragment.fragmentAddress}
            appenderAddress={fragment.appenderAddress}
            blockNumber={fragment.blockNumber}
          />
        ))}

        {fragmentsLoading && !isAllLoaded && totalCount !== undefined && totalCount > 0 && (
          <div className="mt-4 text-center text-sm text-[#808080]">
            Loading {loadedCount} of {totalCount} fragments...
          </div>
        )}

        {fragmentsError && (
          <div className="mt-4 text-center text-sm text-[#ff4444]">
            Error loading some fragments. Showing {loadedCount} of {totalCount ?? '?'}.
          </div>
        )}
      </div>
    </div>
  );
}
