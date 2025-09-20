'use client';

import { useAccount, useConnect, useDisconnect, useEnsName } from 'wagmi';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuLabel
} from '@/components/ui/dropdown-menu';
import { Wallet, ChevronDown, ExternalLink, Copy, LogOut } from 'lucide-react';
import { formatAddress } from '@/lib/utils';
import { chainIdToName } from '../lib/wallet/wagmi.config';
import { WalletConnector } from './wallet-connector';
import { useState } from 'react';

export function WalletConnect() {
  const { address, isConnected, chain, connector } = useAccount();
  const { disconnect } = useDisconnect();
  const { data: ensName } = useEnsName({ address });
  const { connectors, connect } = useConnect();
  const [showConnector, setShowConnector] = useState(false);

  // Check if Web3Modal is available
  const hasWeb3Modal = typeof window !== 'undefined' &&
    process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID &&
    process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID !== 'your-walletconnect-project-id';

  // Get Web3Modal hook if available
  let openModal: (() => void) | undefined;
  if (hasWeb3Modal) {
    try {
      const { useWeb3Modal } = require('@web3modal/wagmi/react');
      const { open } = useWeb3Modal();
      openModal = open;
    } catch (error) {
      console.warn('Web3Modal not available');
    }
  }

  const handleCopyAddress = () => {
    if (address) {
      navigator.clipboard.writeText(address);
    }
  };

  const openBlockExplorer = () => {
    if (address && chain?.blockExplorers?.default) {
      window.open(`${chain.blockExplorers.default.url}/address/${address}`, '_blank');
    }
  };

  const handleConnect = () => {
    if (openModal) {
      openModal();
    } else {
      // Fallback: connect to first available connector (likely MetaMask)
      const firstConnector = connectors[0];
      if (firstConnector) {
        connect({ connector: firstConnector });
      }
    }
  };

  if (!isConnected) {
    return (
      <Button
        onClick={handleConnect}
        variant="outline"
        size="sm"
        className="gap-2"
      >
        <Wallet className="h-4 w-4" />
        Connect Wallet
      </Button>
    );
  }

  const displayName = ensName || formatAddress(address);
  const chainName = chain ? chainIdToName[chain.id] || chain.name : 'Unknown';

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="sm" className="gap-2">
          <Wallet className="h-4 w-4" />
          <div className="flex items-center gap-2">
            <span className="hidden sm:inline">{displayName}</span>
            <Badge variant="secondary" className="text-xs">
              {chainName}
            </Badge>
          </div>
          <ChevronDown className="h-3 w-3" />
        </Button>
      </DropdownMenuTrigger>

      <DropdownMenuContent align="end" className="w-64">
        <DropdownMenuLabel>
          <div className="flex flex-col space-y-1">
            <div className="flex items-center gap-2">
              <span>Connected via {connector?.name}</span>
            </div>
            <div className="text-xs text-muted-foreground">
              {ensName ? address : formatAddress(address)}
            </div>
          </div>
        </DropdownMenuLabel>

        <DropdownMenuSeparator />

        <DropdownMenuItem onClick={handleCopyAddress}>
          <Copy className="h-4 w-4 mr-2" />
          Copy Address
        </DropdownMenuItem>

        {chain?.blockExplorers?.default && (
          <DropdownMenuItem onClick={openBlockExplorer}>
            <ExternalLink className="h-4 w-4 mr-2" />
            View on {chain.blockExplorers.default.name}
          </DropdownMenuItem>
        )}

        <DropdownMenuSeparator />

        {openModal && (
          <DropdownMenuItem onClick={() => openModal && openModal()}>
            <Wallet className="h-4 w-4 mr-2" />
            Wallet Settings
          </DropdownMenuItem>
        )}

        <DropdownMenuItem onClick={() => disconnect()}>
          <LogOut className="h-4 w-4 mr-2" />
          Disconnect
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}