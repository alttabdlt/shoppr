'use client';

import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import { useAccount, useChainId } from 'wagmi';
import type { ToolContext } from '@shoppr/core';
import { chainIdToName } from './wagmi.config';

interface WalletContextType {
  toolContext: ToolContext;
  isConnected: boolean;
  address?: string;
  chainName?: string;
}

const WalletContext = createContext<WalletContextType | null>(null);

interface WalletContextProviderProps {
  children: ReactNode;
  sessionId?: string;
}

export function WalletContextProvider({ children, sessionId }: WalletContextProviderProps) {
  const { address, isConnected } = useAccount();
  const chainId = useChainId();
  const [toolContext, setToolContext] = useState<ToolContext>({
    sessionId,
    permissions: []
  });

  useEffect(() => {
    const chainName = chainIdToName[chainId] || 'ethereum';

    setToolContext({
      userAddress: address,
      chainId: chainName as any,
      sessionId,
      permissions: isConnected ? ['read', 'balance'] : []
    });
  }, [address, chainId, isConnected, sessionId]);

  const chainName = chainIdToName[chainId];

  return (
    <WalletContext.Provider
      value={{
        toolContext,
        isConnected,
        address,
        chainName,
      }}
    >
      {children}
    </WalletContext.Provider>
  );
}

export function useWalletContext(): WalletContextType {
  const context = useContext(WalletContext);
  if (!context) {
    throw new Error('useWalletContext must be used within WalletContextProvider');
  }
  return context;
}