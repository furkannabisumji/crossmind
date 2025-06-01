import { http } from 'wagmi';
import { mainnet, polygon, optimism, arbitrum, base, zora } from 'wagmi/chains';
import { getDefaultConfig } from '@rainbow-me/rainbowkit';

// Define supported chains
const chains = [
  mainnet,
  polygon,
  optimism,
  arbitrum,
  base,
  zora
] as const;

// Get WalletConnect project ID from environment variables
const projectId = process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID || 'YOUR_PROJECT_ID';

// Create wagmi config with RainbowKit integration
export const config = getDefaultConfig({
  appName: 'CrossMind Portfolio Dashboard',
  projectId,
  chains,
  transports: {
    [mainnet.id]: http(),
    [polygon.id]: http(),
    [optimism.id]: http(),
    [arbitrum.id]: http(),
    [base.id]: http(),
    [zora.id]: http(),
  },
  ssr: true, // Enable server-side rendering support
});
