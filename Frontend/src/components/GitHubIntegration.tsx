import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { githubAPI } from '@/lib/api';
import { Github, Check, X, Loader2, ExternalLink } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

interface GitHubUser {
  login: string;
  name: string;
  avatar_url: string;
  html_url: string;
}

export function GitHubIntegration() {
  const [isConnected, setIsConnected] = useState(false);
  const [user, setUser] = useState<GitHubUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [showDisconnectDialog, setShowDisconnectDialog] = useState(false);

  useEffect(() => {
    checkConnection();
  }, []);

  const checkConnection = async () => {
    try {
      const status = await githubAPI.getStatus();
      setIsConnected(status.connected);
      
      if (status.connected) {
        const userData = await githubAPI.getUser();
        setUser(userData);
      }
    } catch (error) {
      console.error('Error checking GitHub connection:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleConnect = async () => {
    try {
      const { authUrl } = await githubAPI.getAuthUrl();
      window.location.href = authUrl;
    } catch (error) {
      console.error('Error getting GitHub auth URL:', error);
    }
  };

  const handleDisconnect = async () => {
    try {
      await githubAPI.disconnect();
      setIsConnected(false);
      setUser(null);
      setShowDisconnectDialog(false);
    } catch (error) {
      console.error('Error disconnecting GitHub:', error);
    }
  };

  if (isLoading) {
    return (
      <Card className="border-2">
        <CardContent className="p-8 flex items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card className="border-2">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Github className="h-5 w-5" />
            GitHub Integration
          </CardTitle>
          <CardDescription>
            Connect your GitHub account to review pull requests directly
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isConnected ? (
            <div className="space-y-4">
              {user && (
                <div className="flex items-center gap-4 p-4 bg-muted rounded-lg">
                  <img
                    src={user.avatar_url}
                    alt={user.name || user.login}
                    className="h-12 w-12 rounded-full"
                  />
                  <div className="flex-1">
                    <p className="font-medium">{user.name || user.login}</p>
                    <p className="text-sm text-muted-foreground">@{user.login}</p>
                  </div>
                  <a
                    href={user.html_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-muted-foreground hover:text-foreground"
                  >
                    <ExternalLink className="h-4 w-4" />
                  </a>
                </div>
              )}
              
              <div className="flex items-center gap-2 text-sm text-green-600 dark:text-green-400">
                <Check className="h-4 w-4" />
                <span>Connected to GitHub</span>
              </div>

              <Button
                variant="outline"
                onClick={() => setShowDisconnectDialog(true)}
                className="w-full"
              >
                <X className="h-4 w-4 mr-2" />
                Disconnect GitHub
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="flex flex-col items-center justify-center py-8 text-center">
                <div className="bg-muted rounded-full p-4 mb-4">
                  <Github className="h-8 w-8 opacity-50" />
                </div>
                <p className="text-muted-foreground mb-4">
                  Connect your GitHub account to review pull requests and repositories
                </p>
                <Button onClick={handleConnect} className="w-full">
                  <Github className="h-4 w-4 mr-2" />
                  Connect with GitHub
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={showDisconnectDialog} onOpenChange={setShowDisconnectDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Disconnect GitHub?</DialogTitle>
            <DialogDescription>
              This will remove your GitHub connection. You'll need to reconnect to review pull requests.
            </DialogDescription>
          </DialogHeader>
          <div className="flex gap-2 justify-end">
            <Button
              variant="outline"
              onClick={() => setShowDisconnectDialog(false)}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleDisconnect}
            >
              Disconnect
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
