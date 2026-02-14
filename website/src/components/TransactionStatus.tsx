"use client";

import { getTransactionExplorerUrl } from "@/lib/contract";

interface TransactionStatusProps {
  hash?: string;
  status: "idle" | "pending" | "success" | "error";
  error?: string;
  pendingMessage?: string;
}

function Spinner() {
  return (
    <svg
      className="inline-block h-4 w-4 animate-spin"
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
  );
}

function Checkmark() {
  return (
    <svg
      className="inline-block h-4 w-4"
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <polyline points="20 6 9 17 4 12" />
    </svg>
  );
}

export default function TransactionStatus({
  hash,
  status,
  error,
  pendingMessage = "Forging soul...",
}: TransactionStatusProps) {
  if (status === "idle") return null;

  const txUrl = hash ? getTransactionExplorerUrl(hash) : undefined;

  if (status === "pending") {
    return (
      <div className="flex items-center gap-2 font-mono text-sm text-[#b0b0b0]">
        <Spinner />
        <span>{pendingMessage}</span>
      </div>
    );
  }

  if (status === "success") {
    return (
      <div className="flex items-center gap-2 font-mono text-sm text-[#44ff44]">
        <Checkmark />
        <span>Transaction confirmed</span>
        {txUrl && (
          <a
            href={txUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="underline transition-colors hover:text-white"
          >
            View on BaseScan
          </a>
        )}
      </div>
    );
  }

  return (
    <div className="font-mono text-sm">
      <div className="text-[#ff4444]">
        {error ?? "Transaction failed"}
      </div>
    </div>
  );
}
