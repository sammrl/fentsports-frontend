//src/main.tsx
import '@solana/wallet-adapter-react-ui/styles.css';
import React from "react";
import { StrictMode } from 'react'
import ReactDOM from "react-dom/client";

import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'

import { ConnectionProvider, WalletProvider } from '@solana/wallet-adapter-react';
import { WalletModalProvider } from '@solana/wallet-adapter-react-ui';
import {
  PhantomWalletAdapter,
  SolflareWalletAdapter,
  // add any other wallet adapters you need
} from '@solana/wallet-adapter-wallets';

// Import default styles for wallet adapter UI
import '@solana/wallet-adapter-react-ui/styles.css';

const network = import.meta.env.VITE_SOLANA_NETWORK || 'devnet';
const endpoint = `https://api.${network}.solana.com`;

const wallets = [
  new PhantomWalletAdapter(),
  new SolflareWalletAdapter(),
  // add more wallet adapters if needed
];

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <ConnectionProvider endpoint={endpoint}>
      <WalletProvider wallets={wallets} autoConnect>
        <WalletModalProvider>
          <App />
        </WalletModalProvider>
      </WalletProvider>
    </ConnectionProvider>
  </React.StrictMode>
);