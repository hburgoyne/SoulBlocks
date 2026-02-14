"use client";

import { useState } from "react";
import MarkdownRenderer from "@/components/MarkdownRenderer";
import { truncateAddress } from "@/lib/utils";

interface FragmentViewerProps {
  content: string;
  index: number;
  fragmentAddress?: string;
  appenderAddress?: string;
  blockNumber?: bigint;
  onHide?: () => void;
}

export default function FragmentViewer({
  content,
  index,
  fragmentAddress,
  appenderAddress,
  blockNumber,
  onHide,
}: FragmentViewerProps) {
  const [hidden, setHidden] = useState(false);

  if (hidden) return null;

  function handleHide() {
    setHidden(true);
    onHide?.();
  }

  const displayAddress = appenderAddress || fragmentAddress;
  const addressLabel = displayAddress
    ? truncateAddress(displayAddress)
    : "unknown";
  const blockLabel = blockNumber !== undefined && blockNumber !== 0n
    ? String(blockNumber)
    : "?";

  const hideButton = (
    <button
      onClick={handleHide}
      className="flex-shrink-0 p-1 text-[#808080] opacity-0 transition-opacity hover:text-white group-hover:opacity-100"
      title="Hide fragment"
      aria-label={`Hide fragment ${index + 1}`}
    >
      <svg
        xmlns="http://www.w3.org/2000/svg"
        width="16"
        height="16"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94" />
        <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19" />
        <line x1="1" y1="1" x2="23" y2="23" />
      </svg>
    </button>
  );

  return (
    <div className="group font-mono">
      {index > 0 ? (
        <div className="my-6 flex items-center gap-2 overflow-hidden text-xs text-[#808080]">
          <span className="min-w-0 flex-1 truncate border-t border-[#808080]" />
          <span className="flex-shrink-0 whitespace-nowrap">
            Fragment {index + 1}
          </span>
          <span className="flex-shrink-0 text-[#2a2a2a]">&middot;</span>
          <span className="flex-shrink-0 whitespace-nowrap">{addressLabel}</span>
          <span className="flex-shrink-0 text-[#2a2a2a]">&middot;</span>
          <span className="flex-shrink-0 whitespace-nowrap">Block {blockLabel}</span>
          <span className="min-w-0 flex-1 truncate border-t border-[#808080]" />
          {hideButton}
        </div>
      ) : (
        <div className="relative">
          <div className="absolute right-0 top-0 z-10">
            {hideButton}
          </div>
        </div>
      )}
      <MarkdownRenderer content={index === 0 ? content.replace(/(?<!\n)\n(?!\n)/g, '  \n') : content} />
    </div>
  );
}
