'use client';

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { WagmiProvider } from 'wagmi';
import { createWeb3Modal } from '@web3modal/wagmi/react';
import { config } from './wagmi.config';
import { useEffect, useState, type ReactNode } from 'react';

// Create Web3Modal only if we have a valid project ID
const projectId = process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID;

interface WalletProvidersProps {
  children: ReactNode;
}

export function WalletProviders({ children }: WalletProvidersProps) {
  const [queryClient] = useState(() => new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 1000 * 60 * 5, // 5 minutes
        refetchOnWindowFocus: false,
      },
    },
  }));

  useEffect(() => {
    if (
      typeof window === 'undefined' ||
      !projectId ||
      projectId === 'your-walletconnect-project-id'
    ) {
      return;
    }

    const globalScope = window as typeof window & {
      __SHOPPR_W3M_INITIALISED__?: boolean;
    };

    if (globalScope.__SHOPPR_W3M_INITIALISED__) {
      return;
    }

    createWeb3Modal({
      wagmiConfig: config,
      projectId,
      enableAnalytics: false,
      enableOnramp: false,
      themeMode: 'light',
      themeVariables: {
        '--w3m-font-family': 'var(--font-geist-sans)',
        '--w3m-accent': 'hsl(var(--primary))',
      },
    });

    globalScope.__SHOPPR_W3M_INITIALISED__ = true;
  }, []);

  return (
    <WagmiProvider config={config}>
      <QueryClientProvider client={queryClient}>
        {children}
      </QueryClientProvider>
    </WagmiProvider>
  );
}
