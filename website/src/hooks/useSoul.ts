'use client';

import { useEffect, useState, useRef, useCallback } from 'react';
import { useReadContract } from 'wagmi';
import { readContract, getContractEvents, getPublicClient } from '@wagmi/core';
import { SOULBLOCKS_ABI, getContractAddress } from '@/lib/contract';
import { wagmiConfig } from '@/lib/wagmiConfig';

interface SoulData {
  owner: string | undefined;
  fragmentCount: number | undefined;
  genesisBlock: bigint | undefined;
  minter: string | undefined;
  isLoading: boolean;
  isError: boolean;
  error: Error | null;
}

export function useSoul(tokenId: number): SoulData {
  const contractAddress = getContractAddress();

  const {
    data: owner,
    isLoading: ownerLoading,
    isError: ownerError,
    error: ownerErr,
  } = useReadContract({
    address: contractAddress,
    abi: SOULBLOCKS_ABI,
    functionName: 'ownerOf',
    args: [BigInt(tokenId)],
  });

  const {
    data: fragmentCount,
    isLoading: fragmentCountLoading,
    isError: fragmentCountError,
    error: fragmentCountErr,
  } = useReadContract({
    address: contractAddress,
    abi: SOULBLOCKS_ABI,
    functionName: 'getFragmentCount',
    args: [BigInt(tokenId)],
  });

  const {
    data: genesisBlock,
    isLoading: genesisLoading,
    isError: genesisError,
    error: genesisErr,
  } = useReadContract({
    address: contractAddress,
    abi: SOULBLOCKS_ABI,
    functionName: 'getGenesisBlock',
    args: [BigInt(tokenId)],
  });

  const {
    data: minter,
    isLoading: minterLoading,
    isError: minterError,
    error: minterErr,
  } = useReadContract({
    address: contractAddress,
    abi: SOULBLOCKS_ABI,
    functionName: 'getMinter',
    args: [BigInt(tokenId)],
  });

  const isLoading = ownerLoading || fragmentCountLoading || genesisLoading || minterLoading;
  const isError = ownerError || fragmentCountError || genesisError || minterError;
  const error = ownerErr || fragmentCountErr || genesisErr || minterErr;

  return {
    owner: owner as string | undefined,
    fragmentCount: fragmentCount !== undefined ? Number(fragmentCount) : undefined,
    genesisBlock: genesisBlock as bigint | undefined,
    minter: minter as string | undefined,
    isLoading,
    isError,
    error: error ?? null,
  };
}

export interface FragmentData {
  content: string;
  index: number;
  fragmentAddress?: string;
  appenderAddress?: string;
  blockNumber?: bigint;
  isFallbackMetadata?: boolean;
}

interface FragmentsResult {
  fragments: FragmentData[];
  isLoading: boolean;
  isAllLoaded: boolean;
  isError: boolean;
  hasLoadError: boolean;
  error: Error | null;
  loadedCount: number;
  totalCount: number | undefined;
}

const INITIAL_BATCH_SIZE = 5;

// Module-level cache for loaded fragments keyed by tokenId
const fragmentCache = new Map<number, { fragments: FragmentData[]; totalCount: number }>();

export function invalidateFragmentCache(tokenId?: number): void {
  if (tokenId !== undefined) {
    fragmentCache.delete(tokenId);
  } else {
    fragmentCache.clear();
  }
}

export function useFragments(tokenId: number, refetchKey?: number): FragmentsResult {
  const contractAddress = getContractAddress();
  const [fragments, setFragments] = useState<FragmentData[]>([]);
  const [isAllLoaded, setIsAllLoaded] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [backgroundError, setBackgroundError] = useState<Error | null>(null);
  const [hasLoadError, setHasLoadError] = useState(false);
  const [totalCount, setTotalCount] = useState<number | undefined>(undefined);
  const loadIdRef = useRef<number>(0);

  const loadFragments = useCallback(async (tid: number, loadId: number) => {
    const addr = contractAddress;
    setIsLoading(true);
    setBackgroundError(null);
    setHasLoadError(false);

    try {
      // Fetch fragment count
      const count = await readContract(wagmiConfig, {
        address: addr,
        abi: SOULBLOCKS_ABI,
        functionName: 'getFragmentCount',
        args: [BigInt(tid)],
      });

      if (loadIdRef.current !== loadId) return;

      const total = Number(count);
      setTotalCount(total);

      if (total === 0) {
        fragmentCache.set(tid, { fragments: [], totalCount: 0 });
        setIsAllLoaded(true);
        setIsLoading(false);
        return;
      }

      // Check cache: if we have all fragments for this tokenId and count matches, use cache
      const cached = fragmentCache.get(tid);
      if (cached && cached.totalCount === total && cached.fragments.length === total) {
        setFragments(cached.fragments);
        setIsAllLoaded(true);
        setIsLoading(false);
        return;
      }

      // Fetch FragmentAppended events for metadata (addresses + block numbers)
      const eventMap = new Map<number, { fragmentAddress: string; appenderAddress: string; blockNumber: bigint }>();
      let eventsFailed = false;
      try {
        const events = await getContractEvents(wagmiConfig, {
          address: addr,
          abi: SOULBLOCKS_ABI,
          eventName: 'FragmentAppended',
          args: { tokenId: BigInt(tid) },
          fromBlock: 'earliest',
          toBlock: 'latest',
        });

        // Fetch transaction for each event to get the appender's wallet address
        const publicClient = getPublicClient(wagmiConfig);
        for (const event of events) {
          const args = event.args as {
            tokenId?: bigint;
            fragment?: string;
            byteLength?: bigint;
            fragmentIndex?: bigint;
          };
          if (args.fragmentIndex !== undefined && args.fragment) {
            let appenderAddress = '';
            let resolvedBlockNumber = event.blockNumber ?? 0n;
            if (publicClient && event.transactionHash) {
              try {
                const tx = await publicClient.getTransaction({ hash: event.transactionHash });
                appenderAddress = tx.from;
                // Use tx.blockNumber as fallback when event.blockNumber is null
                if (resolvedBlockNumber === 0n && tx.blockNumber) {
                  resolvedBlockNumber = tx.blockNumber;
                }
              } catch {
                // Transaction fetch is best-effort
              }
            }
            eventMap.set(Number(args.fragmentIndex), {
              fragmentAddress: args.fragment,
              appenderAddress,
              blockNumber: resolvedBlockNumber,
            });
          }
        }
      } catch (err) {
        // Event fetching failed — fall back to getFragmentAddress for metadata
        console.warn('Failed to fetch FragmentAppended events, falling back to getFragmentAddress:', err);
        eventsFailed = true;
      }

      // If events failed, fetch fragment addresses as fallback
      if (eventsFailed) {
        for (let i = 0; i < total; i++) {
          try {
            const fragmentAddr = await readContract(wagmiConfig, {
              address: addr,
              abi: SOULBLOCKS_ABI,
              functionName: 'getFragmentAddress',
              args: [BigInt(tid), BigInt(i)],
            });
            eventMap.set(i, {
              fragmentAddress: fragmentAddr as string,
              appenderAddress: '',
              blockNumber: 0n,
            });
          } catch {
            // Best-effort fallback
          }
        }
      }

      if (loadIdRef.current !== loadId) return;

      // Load first batch in parallel
      const firstBatchSize = Math.min(INITIAL_BATCH_SIZE, total);
      let batchHasError = false;
      const firstBatchPromises = Array.from({ length: firstBatchSize }, (_, i) =>
        readContract(wagmiConfig, {
          address: addr,
          abi: SOULBLOCKS_ABI,
          functionName: 'getFragmentContent',
          args: [BigInt(tid), BigInt(i)],
        }).then((content) => {
          const meta = eventMap.get(i);
          return {
            content: decodeFragmentContent(content as `0x${string}`),
            index: i,
            fragmentAddress: meta?.fragmentAddress,
            appenderAddress: meta?.appenderAddress || undefined,
            blockNumber: meta?.blockNumber,
            isFallbackMetadata: eventsFailed,
          } as FragmentData;
        })
      );

      const firstBatch = await Promise.all(firstBatchPromises);
      if (loadIdRef.current !== loadId) return;

      setFragments(firstBatch);

      if (firstBatchSize >= total) {
        fragmentCache.set(tid, { fragments: firstBatch, totalCount: total });
        setIsAllLoaded(true);
        setIsLoading(false);
        return;
      }

      // Load remaining fragments sequentially
      const allFragments = [...firstBatch];
      for (let i = firstBatchSize; i < total; i++) {
        if (loadIdRef.current !== loadId) return;

        try {
          const content = await readContract(wagmiConfig, {
            address: addr,
            abi: SOULBLOCKS_ABI,
            functionName: 'getFragmentContent',
            args: [BigInt(tid), BigInt(i)],
          });

          if (loadIdRef.current !== loadId) return;

          const meta = eventMap.get(i);
          const fragment: FragmentData = {
            content: decodeFragmentContent(content as `0x${string}`),
            index: i,
            fragmentAddress: meta?.fragmentAddress,
            appenderAddress: meta?.appenderAddress || undefined,
            blockNumber: meta?.blockNumber,
            isFallbackMetadata: eventsFailed,
          };

          allFragments.push(fragment);
          setFragments((prev) => [...prev, fragment]);
        } catch (err) {
          batchHasError = true;
          setHasLoadError(true);
          setBackgroundError(err instanceof Error ? err : new Error('Failed to load fragment'));
        }
      }

      if (loadIdRef.current !== loadId) return;

      // Only mark as all loaded if no fragments failed
      if (!batchHasError) {
        fragmentCache.set(tid, { fragments: allFragments, totalCount: total });
        setIsAllLoaded(true);
      }
      setIsLoading(false);
    } catch (err) {
      if (loadIdRef.current !== loadId) return;
      setHasLoadError(true);
      setBackgroundError(err instanceof Error ? err : new Error('Failed to load fragments'));
      setIsLoading(false);
    }
  }, [contractAddress]);

  // Reset and reload when tokenId or refetchKey changes
  useEffect(() => {
    const loadId = ++loadIdRef.current;
    setFragments([]);
    setIsAllLoaded(false);
    setIsLoading(true);
    setBackgroundError(null);
    setHasLoadError(false);
    setTotalCount(undefined);

    loadFragments(tokenId, loadId);

    // Capture ref for cleanup — incrementing invalidates in-flight loads
    const ref = loadIdRef;
    return () => {
      ref.current++;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tokenId, refetchKey, loadFragments]);

  const sortedFragments = [...fragments].sort((a, b) => a.index - b.index);

  return {
    fragments: sortedFragments,
    isLoading,
    isAllLoaded: isAllLoaded && !hasLoadError,
    isError: backgroundError !== null,
    hasLoadError,
    error: backgroundError,
    loadedCount: fragments.length,
    totalCount,
  };
}

interface TotalSupplyResult {
  totalSupply: number | undefined;
  isLoading: boolean;
  isError: boolean;
  error: Error | null;
}

export function useTotalSupply(): TotalSupplyResult {
  const contractAddress = getContractAddress();

  const { data, isLoading, isError, error } = useReadContract({
    address: contractAddress,
    abi: SOULBLOCKS_ABI,
    functionName: 'totalSupply',
  });

  return {
    totalSupply: data !== undefined ? Number(data) : undefined,
    isLoading,
    isError,
    error: error ?? null,
  };
}

function decodeFragmentContent(hex: `0x${string}`): string {
  const bytes = hexToBytes(hex);
  const decoded = new TextDecoder().decode(bytes);
  return decoded;
}

function hexToBytes(hex: `0x${string}`): Uint8Array {
  const stripped = hex.slice(2);
  const bytes = new Uint8Array(stripped.length / 2);
  for (let i = 0; i < bytes.length; i++) {
    bytes[i] = parseInt(stripped.slice(i * 2, i * 2 + 2), 16);
  }
  return bytes;
}
