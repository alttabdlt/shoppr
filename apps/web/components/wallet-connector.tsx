'use client';

import { useState } from 'react';
import { useConnect } from 'wagmi';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
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
          <div className="w-8 h-8 rounded-lg bg-orange-500 flex items-center justify-center">
            <span className="text-white font-bold text-sm">🦊</span>
          </div>
        );
      case 'coinbaseWalletSDK':
        return (
          <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center">
            <span className="text-white font-bold text-sm">CB</span>
          </div>
        );
      case 'walletConnect':
        return (
          <div className="w-8 h-8 rounded-lg bg-blue-500 flex items-center justify-center">
            <span className="text-white font-bold text-sm">WC</span>
          </div>
        );
      default:
        return (
          <div className="w-8 h-8 rounded-lg bg-gray-500 flex items-center justify-center">
            <Wallet className="w-4 h-4 text-white" />
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
              className="w-full justify-start gap-3 h-12"
              onClick={() => handleConnect(connector)}
              disabled={isPending}
            >
              {getConnectorIcon(connector.id)}
              <div className="flex flex-col items-start">
                <span className="font-medium">{getConnectorName(connector)}</span>
                {connector.id === 'coinbaseWalletSDK' && (
                  <span className="text-xs text-muted-foreground">Smart Wallet</span>
                )}
              </div>
              {pendingConnector === connector.id && (
                <div className="ml-auto">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-current"></div>
                </div>
              )}
            </Button>
          ))}
        </div>

        {connectors.length === 0 && (
          <div className="text-center py-8 text-muted-foreground">
            No wallet connectors available
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}