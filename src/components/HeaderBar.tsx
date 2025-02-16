// src/components/HeaderBar.tsx
import React from "react";
import { WalletMultiButton } from "@solana/wallet-adapter-react-ui";
import { Link } from "react-router-dom";

export function HeaderBar() {
  return (
    <header className="fixed top-0 left-0 right-0 flex items-center justify-between px-6 py-4 pb-8 bg-transparent z-40">
      {/* Left */}
      <div className="flex items-center">
        <img
          src="https://firebasestorage.googleapis.com/v0/b/fentsports-a8133.firebasestorage.app/o/fentsports-site%2Flogo2.png?alt=media&token=9d74cb35-3808-4c37-9b77-8e56f46d9e1f"
          alt="Logo"
          className="w-20 h-20 object-contain"
        />
      </div>

      {/* Middle: Navigation Links */}
      <nav className="flex space-x-8 ml-24">
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
        <a
          href="https://t.me/fentsports"
          className="text-white font-silkscreen hover:text-gray-300 transition-colors"
        >
          TELEGRAM
        </a>
      </nav>

      {/* Right: Wallet Multi Button */}
      <div>
        <WalletMultiButton />
      </div>
    </header>
  );
}
