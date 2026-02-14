'use client';

import { useEffect, useState, useCallback } from 'react';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import { useAccount, useConnect, useConnectors, useSwitchChain, useWriteContract, useWaitForTransactionReceipt } from 'wagmi';
import { toHex } from 'viem';
import Link from 'next/link';
import { useSoul, useFragments, invalidateFragmentCache } from '@/hooks/useSoul';
import FragmentViewer from '@/components/FragmentViewer';
import ByteCounter from '@/components/ByteCounter';
import TransactionStatus from '@/components/TransactionStatus';
import MarkdownRenderer from '@/components/MarkdownRenderer';
import {
  padTokenId,
  getByteLength,
  getErrorMessage,
  getExpectedChainId,
} from '@/lib/utils';
import { SOULBLOCKS_ABI, getContractAddress } from '@/lib/contract';

const MAX_FRAGMENT_SIZE = 2048;
const MAX_FRAGMENTS = 64;

function isValidTokenId(id: unknown): boolean {
  if (typeof id !== 'string') return false;
  const num = Number(id);
  return Number.isInteger(num) && num >= 1;
}

export default function AppendPage() {
  const params = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();
  const rawId = params.id;
  const validId = isValidTokenId(rawId);
  const tokenId = validId ? Number(rawId) : 0;

  const { address, isConnected, chain } = useAccount();
  const { connect } = useConnect();
  const connectors = useConnectors();
  const { switchChain } = useSwitchChain();

  const expectedChainId = getExpectedChainId();
  const wrongNetwork = isConnected && chain?.id !== expectedChainId;

  const {
    owner,
    fragmentCount,
    isLoading: soulLoading,
    isError: soulError,
  } = useSoul(tokenId);

  const [content, setContent] = useState('');
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [preFilled, setPreFilled] = useState(false);
  const [pendingContent, setPendingContent] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState(false);
  const [refetchKey, setRefetchKey] = useState(0);

  const {
    fragments,
    isLoading: fragmentsLoading,
    isAllLoaded,
    isError: fragmentsError,
    loadedCount,
    totalCount,
  } = useFragments(tokenId, refetchKey);

  const {
    writeContract,
    data: txHash,
    isPending: isWritePending,
    isError: isWriteError,
    error: writeError,
    reset: resetWrite,
  } = useWriteContract();

  const {
    isLoading: isConfirming,
    isSuccess: isConfirmed,
    isError: isReceiptError,
    error: receiptError,
  } = useWaitForTransactionReceipt({
    hash: txHash,
  });

  // Handle deep link content parameter
  useEffect(() => {
    const contentParam = searchParams.get('content');
    if (contentParam) {
      setContent(contentParam);
      setPreFilled(true);
    }
  }, [searchParams]);

  // On success: show success message, clear form, reload fragments
  useEffect(() => {
    if (isConfirmed && pendingContent !== null) {
      setPendingContent(null);
      setContent('');
      setSuccessMessage(true);
      // Invalidate cache and trigger re-fetch to show the new fragment
      invalidateFragmentCache(tokenId);
      setRefetchKey((k) => k + 1);
    }
  }, [isConfirmed, pendingContent, tokenId]);

  // On error: restore form content from pending
  useEffect(() => {
    if ((isWriteError || isReceiptError) && pendingContent !== null) {
      setContent(pendingContent);
      setPendingContent(null);
    }
  }, [isWriteError, isReceiptError, pendingContent]);

  // Redirect if token doesn't exist
  useEffect(() => {
    if (soulError && !soulLoading) {
      router.push('/mint');
    }
  }, [soulError, soulLoading, router]);

  // Redirect if connected but not owner
  useEffect(() => {
    if (!soulLoading && owner && isConnected && address) {
      if (address.toLowerCase() !== owner.toLowerCase()) {
        router.push(`/soul/${tokenId}`);
      }
    }
  }, [soulLoading, owner, isConnected, address, tokenId, router]);

  // Escape key closes confirmation modal
  useEffect(() => {
    if (!showConfirmation) return;

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        setShowConfirmation(false);
      }
    }

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [showConfirmation]);

  const byteLength = getByteLength(content);
  const isOverLimit = byteLength > MAX_FRAGMENT_SIZE;
  const isEmpty = content.trim().length === 0;
  const fragmentsFull = fragmentCount !== undefined && fragmentCount >= MAX_FRAGMENTS;
  const canSubmit = !isEmpty && !isOverLimit && !fragmentsFull && !isWritePending && !isConfirming;

  const currentFragmentNumber = fragmentCount !== undefined ? fragmentCount + 1 : '?';

  const handleSubmit = useCallback(() => {
    if (!canSubmit) return;
    setShowConfirmation(true);
  }, [canSubmit]);

  function handleConfirmInscribe() {
    setShowConfirmation(false);
    resetWrite();
    setSuccessMessage(false);

    // Save content for optimistic display and error recovery
    setPendingContent(content);

    const encoded = toHex(new TextEncoder().encode(content));

    writeContract({
      address: getContractAddress(),
      abi: SOULBLOCKS_ABI,
      functionName: 'appendFragment',
      args: [BigInt(tokenId), encoded],
    });
  }

  function handleCancelConfirmation() {
    setShowConfirmation(false);
  }


  // Determine transaction status for the component
  function getTransactionStatus(): 'idle' | 'pending' | 'success' | 'error' {
    if (isConfirmed) return 'success';
    if (isWriteError || isReceiptError) return 'error';
    if (isWritePending || isConfirming) return 'pending';
    return 'idle';
  }

  function getTransactionError(): string | undefined {
    if (isWriteError && writeError) return getErrorMessage(writeError);
    if (isReceiptError && receiptError) return getErrorMessage(receiptError);
    return undefined;
  }

  useEffect(() => {
    if (!validId) {
      router.replace('/browse');
    }
  }, [validId, router]);

  if (!validId) {
    return (
      <div className="py-16 text-center font-mono">
        <p className="text-[#ff4444]">Invalid token ID.</p>
        <p className="mt-2 text-sm text-[#808080]">Redirecting...</p>
      </div>
    );
  }

  // Loading state
  if (soulLoading) {
    return (
      <div className="py-16 text-center font-mono">
        <p className="text-[#b0b0b0]">Loading Soul Block #{padTokenId(tokenId)}...</p>
      </div>
    );
  }

  // Not connected state
  if (!isConnected) {
    return (
      <div className="py-16 text-center font-mono">
        <h1 className="mb-4 text-2xl font-bold text-white">
          Develop Soul Block #{padTokenId(tokenId)}
        </h1>
        <div
          className="mx-auto max-w-md border border-[#2a2a2a] bg-[#0a0a0a] p-6"
          style={{ borderRadius: '4px' }}
        >
          <p className="mb-4 text-[#b0b0b0]">
            Connect your wallet to append fragments to this soul.
          </p>
          <div className="flex flex-wrap items-center justify-center gap-3">
            {connectors.map((connector) => (
              <button
                key={connector.uid}
                onClick={() => connect({ connector })}
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

  if (wrongNetwork) {
    return (
      <div className="py-16 text-center font-mono">
        <h1 className="mb-4 text-2xl font-bold text-white">
          Develop Soul Block #{padTokenId(tokenId)}
        </h1>
        <div
          className="mx-auto max-w-md border border-[#2a2a2a] bg-[#0a0a0a] p-6"
          style={{ borderRadius: '4px' }}
        >
          <p className="mb-4 text-[#ff4444]">
            Wrong network detected.
          </p>
          <p className="mb-4 text-sm text-[#b0b0b0]">
            Please switch to Base to append fragments.
          </p>
          <button
            onClick={() => switchChain({ chainId: expectedChainId })}
            className="border border-[#ff4444] bg-transparent px-6 py-3 text-sm text-[#ff4444] transition-colors hover:bg-[#ff4444] hover:text-black"
            style={{ borderRadius: '4px' }}
          >
            Switch to Base
          </button>
        </div>
      </div>
    );
  }

  const txStatus = getTransactionStatus();

  return (
    <div className="font-mono">
      {/* Back link */}
      <div className="mb-4">
        <Link
          href={`/soul/${tokenId}`}
          className="text-sm text-[#b0b0b0] transition-colors hover:text-white"
        >
          &larr; Back to Soul Block #{padTokenId(tokenId)}
        </Link>
      </div>

      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-white">
          Develop Soul Block #{padTokenId(tokenId)}
        </h1>
        <div className="mt-3 space-y-1 text-sm">
          <div className="text-[#808080]">
            Fragment {currentFragmentNumber} of {MAX_FRAGMENTS}
          </div>
          <div className="text-[#808080]">
            Size limit: {MAX_FRAGMENT_SIZE} bytes
          </div>
        </div>
      </div>

      {/* Existing soul content */}
      <div className="mb-8">
        <div className="mb-2 text-xs text-[#808080] uppercase tracking-wider">
          Existing Fragments
        </div>
        <div
          className="border border-[#2a2a2a] bg-[#0a0a0a] p-6 opacity-70"
          style={{ borderRadius: '4px' }}
        >
          {fragments.length === 0 && !fragmentsLoading && isAllLoaded && (
            <p className="text-center text-[#808080]">
              This soul has no fragments yet. Write the first one below.
            </p>
          )}

          {fragments.map((fragment) => (
            <FragmentViewer
              key={fragment.index}
              content={fragment.content}
              index={fragment.index}
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

          {/* Optimistic pending fragment */}
          {pendingContent !== null && (
            <div className="relative">
              <div className="my-6 flex items-center gap-2 text-xs text-[#808080]">
                <span className="flex-shrink-0">{"────────────"}</span>
                <span className="whitespace-nowrap">
                  Fragment {currentFragmentNumber}
                </span>
                <span className="text-[#2a2a2a]">&middot;</span>
                <span className="whitespace-nowrap text-yellow-400">Pending</span>
                <span className="flex-shrink-0">{"────────────"}</span>
              </div>
              <div className="opacity-60">
                <MarkdownRenderer content={pendingContent} />
              </div>
              <div className="mt-2 flex items-center gap-2 text-xs text-yellow-400">
                <svg
                  className="inline-block h-3 w-3 animate-spin"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                >
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                  />
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                  />
                </svg>
                <span>Waiting for confirmation...</span>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Success message */}
      {successMessage && (
        <div
          className="mb-6 border border-[#44ff44] bg-[#0a0a0a] px-4 py-3 text-sm text-[#44ff44]"
          style={{ borderRadius: '4px' }}
        >
          Fragment inscribed successfully!
        </div>
      )}

      {/* Deep link banner */}
      {preFilled && (
        <div
          className="mb-6 border border-[#2a2a2a] bg-[#141414] px-4 py-3 text-sm text-[#b0b0b0]"
          style={{ borderRadius: '4px' }}
        >
          This fragment was pre-filled by an external tool. Review it carefully
          before inscribing.
        </div>
      )}

      {/* Permanence warning */}
      <div
        className="mb-6 border border-[#2a2a2a] bg-[#0a0a0a] px-4 py-3 text-sm text-[#808080]"
        style={{ borderRadius: '4px' }}
      >
        Fragments are permanent. Once inscribed, they cannot be edited or
        removed — ever. Take a moment to review before submitting.
      </div>

      {/* Max fragments reached */}
      {fragmentsFull && (
        <div
          className="mb-6 border border-[#ff4444] bg-[#0a0a0a] px-4 py-3 text-sm text-[#ff4444]"
          style={{ borderRadius: '4px' }}
        >
          This Soul Block has reached its maximum of {MAX_FRAGMENTS} fragments.
        </div>
      )}

      {/* Editor */}
      <div className="mb-4">
        <textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          disabled={fragmentsFull || isWritePending || isConfirming}
          placeholder="Write what defines this soul..."
          className="h-64 w-full resize-y border border-[#2a2a2a] bg-[#0a0a0a] p-4 font-mono text-sm text-white placeholder-[#808080] outline-none transition-colors focus:border-[#b0b0b0] disabled:cursor-not-allowed disabled:opacity-50"
          style={{ borderRadius: '4px' }}
        />
      </div>

      {/* Byte counter and validation */}
      <div className="mb-6 flex items-center justify-between">
        <ByteCounter content={content} limit={MAX_FRAGMENT_SIZE} />
        {isEmpty && content.length > 0 && (
          <span className="text-sm text-[#ff4444]">
            Content cannot be empty whitespace.
          </span>
        )}
        {isOverLimit && (
          <span className="text-sm text-[#ff4444]">
            Fragment exceeds {MAX_FRAGMENT_SIZE} byte limit.
          </span>
        )}
      </div>

      {/* Submit button */}
      <div className="mb-6">
        <button
          onClick={handleSubmit}
          disabled={!canSubmit}
          className="border border-white bg-transparent px-6 py-3 text-sm text-white transition-colors hover:bg-white hover:text-black disabled:cursor-not-allowed disabled:border-[#2a2a2a] disabled:text-[#808080] disabled:hover:bg-transparent disabled:hover:text-[#808080]"
          style={{ borderRadius: '4px' }}
        >
          {isWritePending || isConfirming ? 'Inscribing...' : 'Inscribe Fragment'}
        </button>
      </div>

      {/* Transaction status */}
      {txStatus !== 'idle' && (
        <div className="mb-4">
          <TransactionStatus
            hash={txHash}
            status={txStatus}
            error={getTransactionError()}
            pendingMessage="Inscribing fragment..."
          />
        </div>
      )}

      {/* Confirmation modal */}
      {showConfirmation && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80">
          <div
            className="mx-4 max-w-md border border-[#2a2a2a] bg-[#0a0a0a] p-6 font-mono"
            style={{ borderRadius: '4px' }}
          >
            <h2 className="mb-4 text-lg font-bold text-white">
              Confirm Inscription
            </h2>
            <p className="mb-6 text-sm text-[#b0b0b0]">
              This fragment will be permanently inscribed on-chain. Are you sure?
            </p>
            <div className="flex gap-3">
              <button
                onClick={handleConfirmInscribe}
                className="border border-white bg-transparent px-4 py-2 text-sm text-white transition-colors hover:bg-white hover:text-black"
                style={{ borderRadius: '4px' }}
              >
                Inscribe
              </button>
              <button
                onClick={handleCancelConfirmation}
                className="border border-[#2a2a2a] bg-transparent px-4 py-2 text-sm text-[#808080] transition-colors hover:border-white hover:text-white"
                style={{ borderRadius: '4px' }}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
