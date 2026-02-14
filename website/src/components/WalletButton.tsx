"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import Link from "next/link";
import {
  useAccount,
  useConnect,
  useDisconnect,
  useSwitchChain,
  useConnectors,
} from "wagmi";
import { truncateAddress, getExpectedChainId } from "@/lib/utils";

interface NavLink {
  readonly href: string;
  readonly label: string;
}

export function MobileMenu({ links }: { links: readonly NavLink[] }) {
  const [open, setOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  const close = useCallback(() => setOpen(false), []);

  useEffect(() => {
    if (!open) return;
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [open]);

  return (
    <div ref={menuRef} className="relative sm:hidden">
      <button
        onClick={() => setOpen((prev) => !prev)}
        className="flex items-center justify-center p-2 text-[var(--text-secondary)] transition-colors hover:text-[var(--text-primary)]"
        aria-label="Toggle menu"
      >
        {open ? (
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
            <line x1="18" y1="6" x2="6" y2="18" />
            <line x1="6" y1="6" x2="18" y2="18" />
          </svg>
        ) : (
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
            <line x1="3" y1="6" x2="21" y2="6" />
            <line x1="3" y1="12" x2="21" y2="12" />
            <line x1="3" y1="18" x2="21" y2="18" />
          </svg>
        )}
      </button>
      {open && (
        <div className="absolute right-0 top-full mt-2 w-[200px] border border-[var(--border)] bg-[var(--bg-secondary)] py-2" style={{ borderRadius: "4px", zIndex: 50 }}>
          {links.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              onClick={close}
              className="block px-4 py-3 text-sm text-[var(--text-secondary)] transition-colors hover:bg-[var(--bg-tertiary)] hover:text-[var(--text-primary)]"
            >
              {link.label}
            </Link>
          ))}
          <div className="border-t border-[var(--border)] px-4 pt-3 pb-1">
            <WalletButton />
          </div>
        </div>
      )}
    </div>
  );
}

export default function WalletButton() {
  const { address, isConnected, chain } = useAccount();
  const { connect } = useConnect();
  const { disconnect } = useDisconnect();
  const connectors = useConnectors();
  const { switchChain } = useSwitchChain();

  const [mounted, setMounted] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [showConnectors, setShowConnectors] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const connectRef = useRef<HTMLDivElement>(null);

  const expectedChainId = getExpectedChainId();
  const wrongNetwork = isConnected && chain?.id !== expectedChainId;

  useEffect(() => setMounted(true), []);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setDropdownOpen(false);
      }
      if (
        connectRef.current &&
        !connectRef.current.contains(event.target as Node)
      ) {
        setShowConnectors(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  function handleConnect() {
    if (connectors.length === 1) {
      connect({ connector: connectors[0] });
    } else {
      setShowConnectors((prev) => !prev);
    }
  }

  function handleSwitchNetwork() {
    switchChain({ chainId: expectedChainId });
    setDropdownOpen(false);
  }

  function handleDisconnect() {
    disconnect();
    setDropdownOpen(false);
  }

  if (!mounted || !isConnected) {
    return (
      <div ref={connectRef} className="relative">
        <button
          onClick={handleConnect}
          className="border border-white bg-transparent px-4 py-2 font-mono text-sm text-white transition-colors hover:bg-white hover:text-black"
          style={{ borderRadius: "4px" }}
        >
          Connect Wallet
        </button>
        {showConnectors && connectors.length > 1 && (
          <div
            className="absolute right-0 top-full mt-1 min-w-[180px] border border-[#2a2a2a] bg-[#0a0a0a] font-mono text-sm"
            style={{ borderRadius: "4px", zIndex: 50 }}
          >
            {connectors.map((connector) => (
              <button
                key={connector.uid}
                onClick={() => {
                  connect({ connector });
                  setShowConnectors(false);
                }}
                className="block w-full px-4 py-2 text-left text-[#b0b0b0] transition-colors hover:bg-[#141414] hover:text-white"
              >
                {connector.name}
              </button>
            ))}
          </div>
        )}
      </div>
    );
  }

  if (wrongNetwork) {
    return (
      <button
        onClick={handleSwitchNetwork}
        className="border border-[#ff4444] bg-transparent px-4 py-2 font-mono text-sm text-[#ff4444] transition-colors hover:bg-[#ff4444] hover:text-black"
        style={{ borderRadius: "4px" }}
      >
        Switch to Base
      </button>
    );
  }

  return (
    <div ref={dropdownRef} className="relative">
      <button
        onClick={() => setDropdownOpen((prev) => !prev)}
        className="border border-white bg-transparent px-4 py-2 font-mono text-sm text-white transition-colors hover:bg-white hover:text-black"
        style={{ borderRadius: "4px" }}
      >
        {truncateAddress(address!)}
      </button>
      {dropdownOpen && (
        <div
          className="absolute right-0 top-full mt-1 min-w-[180px] border border-[#2a2a2a] bg-[#0a0a0a] font-mono text-sm"
          style={{ borderRadius: "4px", zIndex: 50 }}
        >
          <button
            onClick={handleDisconnect}
            className="block w-full px-4 py-2 text-left text-[#b0b0b0] transition-colors hover:bg-[#141414] hover:text-white"
          >
            Disconnect
          </button>
        </div>
      )}
    </div>
  );
}
