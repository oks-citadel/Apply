'use client';

import { useState, useEffect } from 'react';
import { useAuthStore } from '@/stores/authStore';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Github, Linkedin, CheckCircle, XCircle, AlertCircle } from 'lucide-react';
import { useToast } from '@/hooks/useToast';

interface ConnectedAccount {
  provider: string;
  isConnected: boolean;
  icon: JSX.Element;
  name: string;
  description: string;
}

export default function ConnectedAccountsPage() {
  const { user } = useAuthStore();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [disconnectingProvider, setDisconnectingProvider] = useState<string | null>(null);

  const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8001/api/v1';

  const accounts: ConnectedAccount[] = [
    {
      provider: 'google',
      isConnected: user?.authProvider === 'google',
      icon: (
        <svg className="w-6 h-6" viewBox="0 0 24 24">
          <path
            fill="currentColor"
            d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
          />
          <path
            fill="currentColor"
            d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
          />
          <path
            fill="currentColor"
            d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
          />
          <path
            fill="currentColor"
            d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
          />
        </svg>
      ),
      name: 'Google',
      description: 'Connect your Google account for easy sign-in',
    },
    {
      provider: 'linkedin',
      isConnected: user?.authProvider === 'linkedin',
      icon: <Linkedin className="w-6 h-6 text-blue-600" />,
      name: 'LinkedIn',
      description: 'Connect your LinkedIn account for professional networking',
    },
    {
      provider: 'github',
      isConnected: user?.authProvider === 'github',
      icon: <Github className="w-6 h-6" />,
      name: 'GitHub',
      description: 'Connect your GitHub account for developer features',
    },
  ];

  const handleConnect = (provider: string) => {
    // Store the current URL to redirect back after OAuth
    if (typeof window !== 'undefined') {
      sessionStorage.setItem('oauth_redirect', '/settings/connected-accounts');
    }

    // Redirect to OAuth provider
    window.location.href = `${API_URL}/auth/${provider}`;
  };

  const handleDisconnect = async (provider: string) => {
    if (!user) return;

    try {
      setDisconnectingProvider(provider);

      const token = localStorage.getItem('access_token');
      if (!token) {
        throw new Error('Not authenticated');
      }

      const response = await fetch(`${API_URL}/auth/oauth/disconnect`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to disconnect account');
      }

      toast({
        title: 'Account Disconnected',
        description: `Your ${provider} account has been disconnected successfully.`,
        variant: 'success',
      });

      // Refresh the page to update the connection status
      window.location.reload();
    } catch (error: any) {
      console.error('Disconnect error:', error);
      toast({
        title: 'Disconnection Failed',
        description: error.message || 'Failed to disconnect account. Please try again.',
        variant: 'error',
      });
    } finally {
      setDisconnectingProvider(null);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
          Connected Accounts
        </h1>
        <p className="mt-2 text-gray-600 dark:text-gray-400">
          Manage your social account connections for easy sign-in and enhanced features
        </p>
      </div>

      <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4 flex items-start gap-3">
        <AlertCircle className="w-5 h-5 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
        <div className="text-sm text-blue-800 dark:text-blue-200">
          <p className="font-medium mb-1">Account Security Notice</p>
          <p>
            Connecting social accounts allows you to sign in quickly. You can always disconnect
            them later. Make sure to set a password before disconnecting all social accounts.
          </p>
        </div>
      </div>

      <div className="space-y-4">
        {accounts.map((account) => (
          <Card key={account.provider} className="p-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-gray-100 dark:bg-gray-800 rounded-lg">
                  {account.icon}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                      {account.name}
                    </h3>
                    {account.isConnected ? (
                      <span className="inline-flex items-center gap-1 px-2 py-1 text-xs font-medium text-green-700 bg-green-100 dark:bg-green-900/30 dark:text-green-400 rounded-full">
                        <CheckCircle className="w-3 h-3" />
                        Connected
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 px-2 py-1 text-xs font-medium text-gray-700 bg-gray-100 dark:bg-gray-800 dark:text-gray-400 rounded-full">
                        <XCircle className="w-3 h-3" />
                        Not Connected
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                    {account.description}
                  </p>
                </div>
              </div>

              <div>
                {account.isConnected ? (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleDisconnect(account.provider)}
                    loading={disconnectingProvider === account.provider}
                    disabled={isLoading || disconnectingProvider !== null}
                  >
                    Disconnect
                  </Button>
                ) : (
                  <Button
                    variant="primary"
                    size="sm"
                    onClick={() => handleConnect(account.provider)}
                    disabled={isLoading || disconnectingProvider !== null}
                  >
                    Connect
                  </Button>
                )}
              </div>
            </div>
          </Card>
        ))}
      </div>

      <Card className="p-6 bg-yellow-50 dark:bg-yellow-900/20 border-yellow-200 dark:border-yellow-800">
        <div className="flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-yellow-600 dark:text-yellow-400 flex-shrink-0 mt-0.5" />
          <div className="text-sm text-yellow-800 dark:text-yellow-200">
            <p className="font-medium mb-1">Important</p>
            <p>
              If you disconnect all social accounts, make sure you have a password set for your
              account to maintain access. You can set or change your password in the Security
              settings.
            </p>
          </div>
        </div>
      </Card>
    </div>
  );
}
