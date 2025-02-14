// src/components/HeaderBar.tsx
import React from "react";
import { WalletMultiButton } from "@solana/wallet-adapter-react-ui";
import { Link } from "react-router-dom";

export function HeaderBar() {
  return (
    <header className="fixed top-0 left-0 right-0 flex items-center justify-between px-6 py-4 pb-8 bg-transparent z-40">
      {/* Left: Logo */}
      <div className="flex items-center">
        <img
          src="/images/logo.png"
          alt="Logo"
          className="w-20 h-20 object-contain"
        />
      </div>

      {/* Middle: Navigation Links */}
      <nav className="flex space-x-8 ml-20">
        <a
          href="https://twitter.com/fentsports"
          className="text-white font-silkscreen hover:text-gray-300 transition-colors"
        >
          TWITTER
        </a>
        <Link
          to="/leaderboard"
          className="text-white font-silkscreen hover:text-gray-300 transition-colors"
        >
          LEADERBOARD
        </Link>
      </nav>

      {/* Right: Wallet Multi Button */}
      <div>
        <WalletMultiButton />
      </div>
    </header>
  );
}
