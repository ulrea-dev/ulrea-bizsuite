import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { useGoogleDrive } from '@/contexts/GoogleDriveContext';
import { useBusiness } from '@/contexts/BusinessContext';
import { Cloud, CloudOff, RefreshCw, Check, AlertCircle } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

export const GoogleDriveBackupCard: React.FC = () => {
  const { data } = useBusiness();
  const {
    isConnected,
    isLoading,
    isSyncing,
    settings,
    connect,
    disconnect,
    syncNow,
    setAutoSync,
  } = useGoogleDrive();

  const [showSetupInfo, setShowSetupInfo] = useState(false);

  const handleBackupNow = async () => {
    await syncNow(data);
  };

  const lastSyncFormatted = settings.lastSyncTime
    ? formatDistanceToNow(new Date(settings.lastSyncTime), { addSuffix: true })
    : null;

  return (
    <div className="space-y-4">
      {/* Connection Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            {isConnected ? (
              <Cloud className="h-5 w-5 text-green-500" />
            ) : (
              <CloudOff className="h-5 w-5 text-muted-foreground" />
            )}
            Google Drive Connection
          </CardTitle>
          <CardDescription>
            Connect your Google account to automatically backup your data.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {isConnected ? (
            <div className="space-y-4">
              <div className="flex items-center justify-between p-3 bg-green-50 dark:bg-green-950/20 rounded-lg border border-green-200 dark:border-green-900">
                <div className="flex items-center gap-2">
                  <Check className="h-4 w-4 text-green-600" />
                  <span className="text-sm font-medium">Connected as {settings.connectedEmail}</span>
                </div>
                <Button variant="outline" size="sm" onClick={disconnect}>
                  Disconnect
                </Button>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <Button onClick={connect} disabled={isLoading} className="w-full">
                {isLoading ? (
                  <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <Cloud className="h-4 w-4 mr-2" />
                )}
                Connect Google Drive
              </Button>
              
              <Button 
                variant="link" 
                className="w-full text-xs"
                onClick={() => setShowSetupInfo(!showSetupInfo)}
              >
                {showSetupInfo ? 'Hide setup instructions' : 'First time? View setup instructions'}
              </Button>

              {showSetupInfo && (
                <div className="p-4 bg-muted rounded-lg text-sm space-y-2">
                  <div className="flex items-start gap-2">
                    <AlertCircle className="h-4 w-4 mt-0.5 text-amber-500" />
                    <div>
                      <p className="font-medium">Google Cloud Setup Required</p>
                      <p className="text-muted-foreground mt-1">
                        To enable Google Drive backup, you need to configure a Google Cloud project with OAuth credentials.
                        Ask the developer to set up the Google Client ID.
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Backup Settings Card */}
      {isConnected && (
        <Card>
          <CardHeader>
            <CardTitle>Backup Settings</CardTitle>
            <CardDescription>
              Configure how your data is backed up to Google Drive.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="auto-sync">Auto-sync on changes</Label>
                <p className="text-xs text-muted-foreground">
                  Automatically backup when you make changes
                </p>
              </div>
              <Switch
                id="auto-sync"
                checked={settings.autoSyncEnabled}
                onCheckedChange={setAutoSync}
              />
            </div>

            <div className="border-t pt-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium">Last backup</p>
                  <p className="text-xs text-muted-foreground">
                    {lastSyncFormatted || 'Never'}
                  </p>
                </div>
                <Button 
                  onClick={handleBackupNow} 
                  disabled={isSyncing}
                  variant="outline"
                >
                  {isSyncing ? (
                    <>
                      <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                      Backing up...
                    </>
                  ) : (
                    <>
                      <Cloud className="h-4 w-4 mr-2" />
                      Backup Now
                    </>
                  )}
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};
