"use client";

import { http, createConfig } from "wagmi";
import { avalancheFuji, sepolia } from "wagmi/chains";
import { getDefaultWallets } from "@rainbow-me/rainbowkit";
import { Chain } from "wagmi/chains";

// Only using Avalanche Fuji testnet
const chains = [avalancheFuji, sepolia] as [Chain, ...Chain[]];

// Get WalletConnect project ID from environment variables
const projectId =
  process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID || "DEFAULT_PROJECT_ID";

// Configure RainbowKit wallets
const { connectors } = getDefaultWallets({
  appName: "CrossMind Portfolio Dashboard",
  projectId,
});

// Create transport for Avalanche Fuji testnet
const transports = {
  // Avalanche Fuji testnet chain ID: 43113
  [avalancheFuji.id]: http(),
  [sepolia.id]: http(),
};

// Create the Wagmi config
export const config = createConfig({
  chains,
  transports,
  ssr: true,
  connectors,
});
