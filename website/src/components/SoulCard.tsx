"use client";

import Link from "next/link";
import { padTokenId } from "@/lib/utils";

interface SoulCardProps {
  tokenId: number;
  fragmentCount: number;
  isGenesis: boolean;
  preview?: string;
}

export default function SoulCard({
  tokenId,
  fragmentCount,
  isGenesis,
  preview,
}: SoulCardProps) {
  return (
    <Link href={`/soul/${tokenId}`}>
      <div
        className="border border-[#2a2a2a] bg-[#0a0a0a] p-4 font-mono transition-colors hover:bg-[#141414]"
        style={{ borderRadius: "4px" }}
      >
        <div className="flex items-center justify-between">
          <span className="text-base text-white">
            #{padTokenId(tokenId)}
          </span>
          {isGenesis && (
            <span className="border border-[#44ff44] px-2 py-0.5 text-xs text-[#44ff44]">
              GENESIS
            </span>
          )}
        </div>
        <div className="mt-2 text-sm text-[#808080]">
          {fragmentCount} / 64 fragments
        </div>
        {preview && (
          <div className="mt-2 text-xs text-[#606060] truncate">
            {preview}
          </div>
        )}
      </div>
    </Link>
  );
}
