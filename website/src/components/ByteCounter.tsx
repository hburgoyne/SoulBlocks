"use client";

import { getByteLength } from '@/lib/utils';

interface ByteCounterProps {
  content: string;
  limit: number;
}

function getColorClass(byteCount: number, limit: number): string {
  if (byteCount > limit) return "text-[#ff4444]";
  if (byteCount >= 1800) return "text-yellow-400";
  return "text-[#b0b0b0]";
}

export default function ByteCounter({ content, limit }: ByteCounterProps) {
  const byteCount = getByteLength(content);
  const colorClass = getColorClass(byteCount, limit);

  return (
    <span className={`font-mono text-sm ${colorClass}`}>
      {byteCount} / {limit} bytes
    </span>
  );
}
