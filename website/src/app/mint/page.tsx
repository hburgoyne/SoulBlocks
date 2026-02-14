'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  useAccount,
  useConnect,
  useConnectors,
  useSwitchChain,
  useReadContract,
  useWriteContract,
  useWaitForTransactionReceipt,
  type Connector,
} from 'wagmi';
import { parseEther, decodeEventLog } from 'viem';
import { useTotalSupply } from '@/hooks/useSoul';
import { SOULBLOCKS_ABI, getContractAddress } from '@/lib/contract';
import { getExpectedChainId, getErrorMessage } from '@/lib/utils';
import TransactionStatus from '@/components/TransactionStatus';

export default function MintPage() {
  const { address, isConnected, chain } = useAccount();
  const { connect } = useConnect();
  const connectors = useConnectors();
  const { switchChain } = useSwitchChain();

  const expectedChainId = getExpectedChainId();
  const wrongNetwork = isConnected && chain?.id !== expectedChainId;

  const { totalSupply, isLoading: supplyLoading } = useTotalSupply();

  const { data: balance } = useReadContract({
    address: getContractAddress(),
    abi: SOULBLOCKS_ABI,
    functionName: 'balanceOf',
    args: address ? [address] : undefined,
    query: {
      enabled: !!address,
    },
  });

  const {
    writeContract,
    data: txHash,
    isPending: isWritePending,
    isError: isWriteError,
    error: writeError,
    reset: resetWrite,
  } = useWriteContract();

  const {
    data: receipt,
    isLoading: isReceiptLoading,
    isSuccess: isReceiptSuccess,
    isError: isReceiptError,
    error: receiptError,
  } = useWaitForTransactionReceipt({
    hash: txHash,
  });

  const [mintedTokenId, setMintedTokenId] = useState<number | null>(null);

  useEffect(() => {
    if (receipt && isReceiptSuccess) {
      const transferLog = receipt.logs.find((log) => {
        try {
          const decoded = decodeEventLog({
            abi: SOULBLOCKS_ABI,
            data: log.data,
            topics: log.topics,
          });
          return decoded.eventName === 'Transfer';
        } catch {
          return false;
        }
      });

      if (transferLog) {
        try {
          const decoded = decodeEventLog({
            abi: SOULBLOCKS_ABI,
            data: transferLog.data,
            topics: transferLog.topics,
          });
          if (decoded.eventName === 'Transfer' && decoded.args) {
            const args = decoded.args as { tokenId: bigint };
            setMintedTokenId(Number(args.tokenId));
          }
        } catch {
          // Could not decode token ID from logs
        }
      }
    }
  }, [receipt, isReceiptSuccess]);

  function handleConnect(connector?: (typeof connectors)[number]) {
    if (connector) {
      connect({ connector });
    } else if (connectors.length > 0) {
      connect({ connector: connectors[0] });
    }
  }

  function handleSwitchNetwork() {
    switchChain({ chainId: expectedChainId });
  }

  function handleMint() {
    setMintedTokenId(null);
    writeContract({
      address: getContractAddress(),
      abi: SOULBLOCKS_ABI,
      functionName: 'mint',
      value: parseEther('0.02'),
    });
  }

  function handleReset() {
    setMintedTokenId(null);
    resetWrite();
  }

  function getTransactionStatus(): 'idle' | 'pending' | 'success' | 'error' {
    if (isReceiptSuccess) return 'success';
    if (isReceiptError || isWriteError) return 'error';
    if (isWritePending || isReceiptLoading) return 'pending';
    return 'idle';
  }

  function getTransactionError(): string | undefined {
    if (isWriteError && writeError) return getErrorMessage(writeError);
    if (isReceiptError && receiptError) return getErrorMessage(receiptError);
    return undefined;
  }

  const txStatus = getTransactionStatus();
  const isMinting = txStatus === 'pending';
  const isSoldOut = totalSupply !== undefined && totalSupply >= 10000;

  return (
    <div className="flex flex-col gap-8">
      <section className="flex flex-col gap-2">
        <h1 className="text-3xl font-bold text-[var(--text-primary)]">
          Mint a Soul Block
        </h1>
        <p className="text-[var(--text-secondary)]">
          Price: 0.02 ETH
        </p>
      </section>

      <section
        className="border border-[var(--border)] bg-[var(--bg-secondary)] p-6"
        style={{ borderRadius: '4px' }}
      >
        {!isConnected ? (
          <NotConnectedState onConnect={handleConnect} connectors={connectors} />
        ) : wrongNetwork ? (
          <WrongNetworkState onSwitch={handleSwitchNetwork} />
        ) : isSoldOut ? (
          <SoldOutState />
        ) : txStatus === 'success' && mintedTokenId !== null ? (
          <MintSuccessState tokenId={mintedTokenId} onReset={handleReset} />
        ) : (
          <ConnectedState
            totalSupply={totalSupply}
            supplyLoading={supplyLoading}
            balance={balance !== undefined ? Number(balance) : undefined}
            onMint={handleMint}
            isMinting={isMinting}
            isSoldOut={isSoldOut}
          />
        )}

        {txStatus !== 'idle' && txStatus !== 'success' && (
          <div className="mt-6">
            <TransactionStatus
              hash={txHash}
              status={txStatus}
              error={getTransactionError()}
            />
          </div>
        )}

        {txStatus === 'error' && (
          <div className="mt-4">
            <button
              onClick={handleReset}
              className="border border-white bg-transparent px-4 py-2 text-sm text-white transition-colors hover:bg-white hover:text-black"
              style={{ borderRadius: '4px' }}
            >
              Try Again
            </button>
          </div>
        )}
      </section>

      {txStatus === 'success' && txHash && (
        <section className="text-center">
          <TransactionStatus
            hash={txHash}
            status="success"
          />
        </section>
      )}
    </div>
  );
}

function NotConnectedState({
  onConnect,
  connectors,
}: {
  onConnect: (connector?: Connector) => void;
  connectors: readonly Connector[];
}) {
  return (
    <div className="flex flex-col items-center gap-4 py-8 text-center">
      <p className="text-[var(--text-secondary)]">
        Connect your wallet to mint a Soul Block.
      </p>
      <div className="flex flex-wrap items-center justify-center gap-3">
        {connectors.map((connector) => (
          <button
            key={connector.uid}
            onClick={() => onConnect(connector)}
            className="border border-white bg-transparent px-6 py-3 text-sm text-white transition-colors hover:bg-white hover:text-black"
            style={{ borderRadius: '4px' }}
          >
            {connector.name}
          </button>
        ))}
      </div>
    </div>
  );
}

function WrongNetworkState({ onSwitch }: { onSwitch: () => void }) {
  return (
    <div className="flex flex-col items-center gap-4 py-8 text-center">
      <p className="text-[var(--error)]">
        Wrong network detected.
      </p>
      <p className="text-sm text-[var(--text-secondary)]">
        Please switch to Base to mint a Soul Block.
      </p>
      <button
        onClick={onSwitch}
        className="border border-[var(--error)] bg-transparent px-6 py-3 text-sm text-[var(--error)] transition-colors hover:bg-[var(--error)] hover:text-black"
        style={{ borderRadius: '4px' }}
      >
        Switch to Base
      </button>
    </div>
  );
}

function SoldOutState() {
  return (
    <div className="flex flex-col items-center gap-4 py-8 text-center">
      <p className="text-xl font-bold text-[var(--text-primary)]">
        Sold Out
      </p>
      <p className="text-[var(--text-secondary)]">
        All 10,000 Soul Blocks have been minted.
      </p>
      <Link
        href="/browse"
        className="border border-white bg-transparent px-4 py-2 text-sm text-white transition-colors hover:bg-white hover:text-black"
        style={{ borderRadius: '4px' }}
      >
        Browse Existing Souls
      </Link>
    </div>
  );
}

function MintSuccessState({
  tokenId,
  onReset,
}: {
  tokenId: number;
  onReset: () => void;
}) {
  return (
    <div className="flex flex-col items-center gap-6 py-8 text-center">
      <div className="text-3xl text-[var(--success)]">
        Soul Forged
      </div>
      <p className="text-[var(--text-secondary)]">
        Soul Block #{String(tokenId).padStart(5, '0')} has been minted.
      </p>
      <div className="flex flex-wrap items-center justify-center gap-4">
        <Link
          href={`/soul/${tokenId}`}
          className="border border-white bg-transparent px-4 py-2 text-sm text-white transition-colors hover:bg-white hover:text-black"
          style={{ borderRadius: '4px' }}
        >
          View Your Soul Block
        </Link>
        <Link
          href={`/append/${tokenId}`}
          className="border border-[var(--success)] bg-transparent px-4 py-2 text-sm text-[var(--success)] transition-colors hover:bg-[var(--success)] hover:text-black"
          style={{ borderRadius: '4px' }}
        >
          Start Developing Your Soul
        </Link>
      </div>
      <button
        onClick={onReset}
        className="text-sm text-[var(--text-tertiary)] transition-colors hover:text-[var(--text-secondary)]"
      >
        Mint another
      </button>
    </div>
  );
}

function ConnectedState({
  totalSupply,
  supplyLoading,
  balance,
  onMint,
  isMinting,
  isSoldOut,
}: {
  totalSupply: number | undefined;
  supplyLoading: boolean;
  balance: number | undefined;
  onMint: () => void;
  isMinting: boolean;
  isSoldOut: boolean;
}) {
  return (
    <div className="flex flex-col gap-6">
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <div className="text-sm text-[var(--text-tertiary)]">Supply Remaining</div>
          <div className="mt-1 text-lg font-bold text-[var(--text-primary)]">
            {supplyLoading ? (
              <span className="text-[var(--text-tertiary)]">Loading...</span>
            ) : (
              <>{(10000 - (totalSupply ?? 0)).toLocaleString()} / 10,000 remaining</>
            )}
          </div>
        </div>
        <div>
          <div className="text-sm text-[var(--text-tertiary)]">Your Soul Blocks</div>
          <div className="mt-1 text-lg font-bold text-[var(--text-primary)]">
            {balance !== undefined ? balance : (
              <span className="text-[var(--text-tertiary)]">Loading...</span>
            )}
          </div>
        </div>
      </div>

      <button
        onClick={onMint}
        disabled={isMinting || isSoldOut}
        className="w-full border border-white bg-transparent px-6 py-3 text-sm text-white transition-colors hover:bg-white hover:text-black disabled:cursor-not-allowed disabled:border-[var(--text-tertiary)] disabled:text-[var(--text-tertiary)] disabled:hover:bg-transparent disabled:hover:text-[var(--text-tertiary)]"
        style={{ borderRadius: '4px' }}
      >
        {isMinting ? 'Forging soul...' : 'Mint for 0.02 ETH'}
      </button>
    </div>
  );
}
