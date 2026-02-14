import type { Metadata, Viewport } from 'next';
import Link from 'next/link';
import './globals.css';
import { Providers } from './providers';
import WalletButton from '@/components/WalletButton';
import { MobileMenu } from '@/components/WalletButton';
import { getContractExplorerUrl } from '@/lib/contract';

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export const metadata: Metadata = {
  metadataBase: new URL('https://soulblocks.ai'),
  title: 'Soul Blocks - On-Chain Identity for AI Agents',
  description:
    'Mint, develop, and trade append-only identity vessels for AI agents. Fully on-chain on Base.',
  icons: {
    icon: '/favicon.svg',
  },
  openGraph: {
    type: 'website',
    url: 'https://soulblocks.ai',
    title: 'Soul Blocks',
    description: 'On-chain, append-only identity for agents',
    siteName: 'Soul Blocks',
  },
  twitter: {
    card: 'summary',
    site: '@cryptoAIdev',
  },
};

const NAV_LINKS = [
  { href: '/mint', label: 'Mint' },
  { href: '/browse', label: 'Browse' },
  { href: '/my-souls', label: 'My Souls' },
  { href: '/guides', label: 'Guides' },
  { href: '/faq', label: 'FAQ' },
] as const;

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="min-h-screen overflow-x-hidden antialiased">
        <Providers>
          <Nav />
          <main className="mx-auto max-w-[800px] px-4 py-8 sm:px-6 sm:py-12">
            {children}
          </main>
          <Footer />
        </Providers>
      </body>
    </html>
  );
}

function Nav() {
  return (
    <nav className="sticky top-0 z-50 border-b border-[var(--border)] bg-[var(--bg-primary)] shadow-[0_1px_3px_rgba(0,0,0,0.4)]">
      <div className="mx-auto flex max-w-[800px] items-center justify-between px-4 py-4 sm:px-6">
        <div className="flex items-center gap-6">
          <Link
            href="/"
            className="text-lg font-bold text-[var(--text-primary)]"
          >
            Soul Blocks
          </Link>
          <div className="hidden items-center gap-4 sm:flex">
            {NAV_LINKS.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="text-sm text-[var(--text-secondary)] transition-colors hover:text-[var(--text-primary)]"
              >
                {link.label}
              </Link>
            ))}
          </div>
        </div>
        <div className="hidden sm:block">
          <WalletButton />
        </div>
        <MobileMenu links={NAV_LINKS} />
      </div>
    </nav>
  );
}

function Footer() {
  let contractExplorerUrl: string;
  try {
    contractExplorerUrl = getContractExplorerUrl();
  } catch {
    contractExplorerUrl = '#';
  }

  return (
    <footer className="mt-16 border-t border-[var(--border)] py-8">
      <div className="mx-auto max-w-[800px] px-4 text-center text-sm text-[var(--text-tertiary)] sm:px-6">
        <div className="mb-4 flex flex-wrap items-center justify-center gap-4">
          <Link
            href="/browse"
            className="transition-colors hover:text-[var(--text-secondary)]"
          >
            Browse
          </Link>
          <Link
            href="/guides"
            className="transition-colors hover:text-[var(--text-secondary)]"
          >
            Guides
          </Link>
          <a
            href={contractExplorerUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="transition-colors hover:text-[var(--text-secondary)]"
          >
            Contract
          </a>
          <a
            href="https://github.com/hburgoyne/SoulBlocks"
            target="_blank"
            rel="noopener noreferrer"
            className="transition-colors hover:text-[var(--text-secondary)]"
          >
            GitHub
          </a>
          <a
            href="https://discord.gg/EtwNqkzc"
            target="_blank"
            rel="noopener noreferrer"
            className="transition-colors hover:text-[var(--text-secondary)]"
          >
            Discord
          </a>
        </div>
        <p className="text-[var(--text-tertiary)]">
          No admin keys. Immutable forever.
        </p>
      </div>
    </footer>
  );
}
