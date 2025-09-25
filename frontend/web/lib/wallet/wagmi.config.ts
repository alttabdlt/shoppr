import { http, createConfig } from 'wagmi';
import { mainnet, arbitrum, base, optimism, polygon } from 'wagmi/chains';
import { coinbaseWallet, metaMask, walletConnect } from 'wagmi/connectors';

const isBrowser = typeof window !== 'undefined';
const fallbackAppUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000';
const appUrl = isBrowser ? window.location.origin : fallbackAppUrl;
const faviconUrl = new URL('/favicon.ico', appUrl).toString();

// Get project ID from environment (for WalletConnect)
const projectId = process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID;

// Create connectors array - only include WalletConnect if we have a valid project ID
const connectors = isBrowser
  ? [
      metaMask({
        dappMetadata: {
          name: 'Shoppr',
          url: appUrl,
          iconUrl: faviconUrl,
        },
      }),
      coinbaseWallet({
        appName: 'Shoppr',
        appLogoUrl: faviconUrl,
        preference: 'smartWalletOnly',
      }),
    ]
  : [];

// Only add WalletConnect if we have a valid project ID
if (isBrowser && projectId && projectId !== 'your-walletconnect-project-id') {
  connectors.push(
    walletConnect({
      projectId,
      metadata: {
        name: 'Shoppr',
        description: 'Cross-chain execution assistant',
        url: appUrl,
        icons: [faviconUrl],
      },
    }) as any,
  );
}

export const config = createConfig({
  chains: [mainnet, arbitrum, base, optimism, polygon],
  connectors,
  transports: {
    [mainnet.id]: http(),
    [arbitrum.id]: http(),
    [base.id]: http(),
    [optimism.id]: http(),
    [polygon.id]: http(),
  },
  ssr: true,
});

export type ChainId = typeof config.chains[number]['id'];

export const supportedChains = config.chains.map(chain => ({
  id: chain.id,
  name: chain.name,
  nativeCurrency: chain.nativeCurrency,
  rpcUrls: chain.rpcUrls,
  blockExplorers: chain.blockExplorers,
}));

// Map chain IDs to our internal chain names
export const chainIdToName: Record<number, string> = {
  [mainnet.id]: 'ethereum',
  [arbitrum.id]: 'arbitrum',
  [base.id]: 'base',
  [optimism.id]: 'optimism',
  [polygon.id]: 'polygon',
};

export const nameToChainId: Record<string, number> = {
  ethereum: mainnet.id,
  arbitrum: arbitrum.id,
  base: base.id,
  optimism: optimism.id,
  polygon: polygon.id,
};

declare module 'wagmi' {
  interface Register {
    config: typeof config;
  }
}
