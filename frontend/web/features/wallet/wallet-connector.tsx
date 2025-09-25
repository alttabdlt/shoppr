'use client';

import { useState } from 'react';
import { useConnect } from 'wagmi';
import { Button } from '@shoppr/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@shoppr/ui/dialog';
import { Wallet } from 'lucide-react';

interface WalletConnectorProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function WalletConnector({ open, onOpenChange }: WalletConnectorProps) {
  const { connectors, connect, isPending } = useConnect();
  const [pendingConnector, setPendingConnector] = useState<string | null>(null);

  const handleConnect = (connector: any) => {
    setPendingConnector(connector.id);
    connect({ connector }, {
      onSuccess: () => {
        setPendingConnector(null);
        onOpenChange(false);
      },
      onError: () => {
        setPendingConnector(null);
      }
    });
  };

  const getConnectorIcon = (connectorId: string) => {
    switch (connectorId) {
      case 'metaMask':
        return (
          <div className='flex h-8 w-8 items-center justify-center rounded-lg bg-orange-500'>
            <span className='font-bold text-sm text-white'>🦊</span>
          </div>
        );
      case 'coinbaseWalletSDK':
        return (
          <div className='flex h-8 w-8 items-center justify-center rounded-lg bg-blue-600'>
            <span className='font-bold text-sm text-white'>CB</span>
          </div>
        );
      case 'walletConnect':
        return (
          <div className='flex h-8 w-8 items-center justify-center rounded-lg bg-blue-500'>
            <span className='font-bold text-sm text-white'>WC</span>
          </div>
        );
      default:
        return (
          <div className='flex h-8 w-8 items-center justify-center rounded-lg bg-gray-500'>
            <Wallet className='h-4 w-4 text-white' />
          </div>
        );
    }
  };

  const getConnectorName = (connector: any) => {
    switch (connector.id) {
      case 'metaMask':
        return 'MetaMask';
      case 'coinbaseWalletSDK':
        return 'Coinbase Wallet';
      case 'walletConnect':
        return 'WalletConnect';
      default:
        return connector.name || 'Unknown Wallet';
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Connect Wallet</DialogTitle>
          <DialogDescription>
            Connect your crypto wallet to interact with blockchain tools
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3">
          {connectors.map((connector) => (
            <Button
              key={connector.id}
              variant="outline"
              className='h-12 w-full justify-start gap-3'
              onClick={() => handleConnect(connector)}
              disabled={isPending}
            >
              {getConnectorIcon(connector.id)}
              <div className="flex flex-col items-start">
                <span className="font-medium">{getConnectorName(connector)}</span>
                {connector.id === 'coinbaseWalletSDK' && (
                  <span className='text-muted-foreground text-xs'>Smart Wallet</span>
                )}
              </div>
              {pendingConnector === connector.id && (
                <div className="ml-auto">
                  <div className='h-4 w-4 animate-spin rounded-full border-current border-b-2' />
                </div>
              )}
            </Button>
          ))}
        </div>

        {connectors.length === 0 && (
          <div className='py-8 text-center text-muted-foreground'>
            No wallet connectors available
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}