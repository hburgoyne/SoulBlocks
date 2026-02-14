"use client";

import ReactMarkdown from "react-markdown";
import type { Components } from "react-markdown";

interface MarkdownRendererProps {
  content: string;
}

const REPLACEMENT_CHAR = "\uFFFD";

function hasReplacementCharacters(text: string): boolean {
  return text.includes(REPLACEMENT_CHAR);
}

const markdownComponents: Components = {
  h1: ({ children }) => (
    <h1 className="mb-4 mt-6 text-2xl font-bold text-white">{children}</h1>
  ),
  h2: ({ children }) => (
    <h2 className="mb-3 mt-5 text-xl font-bold text-white">{children}</h2>
  ),
  h3: ({ children }) => (
    <h3 className="mb-2 mt-4 text-lg font-bold text-white">{children}</h3>
  ),
  h4: ({ children }) => (
    <h4 className="mb-2 mt-3 text-base font-bold text-white">{children}</h4>
  ),
  p: ({ children }) => (
    <p className="mb-3 leading-relaxed text-[#b0b0b0]">{children}</p>
  ),
  a: ({ href, children }) => (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="text-white underline transition-colors hover:text-[#b0b0b0]"
    >
      {children}
    </a>
  ),
  ul: ({ children }) => (
    <ul className="mb-3 ml-4 list-disc text-[#b0b0b0]">{children}</ul>
  ),
  ol: ({ children }) => (
    <ol className="mb-3 ml-4 list-decimal text-[#b0b0b0]">{children}</ol>
  ),
  li: ({ children }) => <li className="mb-1">{children}</li>,
  code: ({ className, children }) => {
    const isBlock = className?.includes("language-");
    if (isBlock) {
      return (
        <code className="block overflow-x-auto rounded bg-[#141414] p-3 text-sm text-[#b0b0b0]">
          {children}
        </code>
      );
    }
    return (
      <code className="break-all rounded bg-[#141414] px-1.5 py-0.5 text-sm text-[#b0b0b0]">
        {children}
      </code>
    );
  },
  pre: ({ children }) => (
    <pre className="mb-3 overflow-x-auto rounded border border-[#2a2a2a] bg-[#141414] p-3 font-mono text-sm">
      {children}
    </pre>
  ),
  blockquote: ({ children }) => (
    <blockquote className="mb-3 border-l-2 border-[#2a2a2a] pl-4 text-[#808080]">
      {children}
    </blockquote>
  ),
  hr: () => <hr className="my-4 border-[#2a2a2a]" />,
  strong: ({ children }) => (
    <strong className="font-bold text-white">{children}</strong>
  ),
  em: ({ children }) => <em className="italic text-[#b0b0b0]">{children}</em>,
  img: () => null,
};

export default function MarkdownRenderer({ content }: MarkdownRendererProps) {
  const showEncodingWarning = hasReplacementCharacters(content);

  return (
    <div className="min-w-0 break-words font-mono">
      {showEncodingWarning && (
        <div
          className="mb-3 border border-[#2a2a2a] bg-[#141414] px-3 py-2 text-sm text-[#b0b0b0]"
          style={{ borderRadius: "4px" }}
        >
          This fragment contains invalid text encoding and may not display
          correctly.
        </div>
      )}
      <ReactMarkdown components={markdownComponents}>{content}</ReactMarkdown>
    </div>
  );
}
