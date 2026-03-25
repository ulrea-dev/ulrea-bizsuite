import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { useGoogleDrive } from '@/contexts/GoogleDriveContext';
import { useSupabaseStorage } from '@/contexts/SupabaseStorageContext';
import { useBusiness } from '@/contexts/BusinessContext';
import { Cloud, CloudOff, RefreshCw, Check, AlertCircle, HardDrive, Wifi } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

export const BackupSettingsCard: React.FC = () => {
  const { data } = useBusiness();
  const {
    isConnected: isDriveConnected,
    isLoading: isDriveLoading,
    isSyncing: isDriveSyncing,
    settings: driveSettings,
    connect: connectDrive,
    disconnect: disconnectDrive,
    syncNow: syncToDrive,
    setAutoSync,
  } = useGoogleDrive();

  const { cloudSync, uploadNow } = useSupabaseStorage();

  const [showSetupInfo, setShowSetupInfo] = useState(false);

  const lastCloudSyncFormatted = cloudSync.lastSyncTime
    ? formatDistanceToNow(new Date(cloudSync.lastSyncTime), { addSuffix: true })
    : null;

  const lastDriveSyncFormatted = driveSettings.lastSyncTime
    ? formatDistanceToNow(new Date(driveSettings.lastSyncTime), { addSuffix: true })
    : null;

  const handlePushToDrive = async () => {
    await syncToDrive(data);
  };

  return (
    <div className="space-y-4">

      {/* ── Tier 1: Cloud Storage (always-on Supabase) ── */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Wifi className="h-5 w-5 text-primary" />
              Cloud Storage
            </CardTitle>
            <Badge variant="secondary" className="text-xs font-medium">
              Always On
            </Badge>
          </div>
          <CardDescription>
            Your data is automatically saved to the cloud on every change.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex items-center gap-2 p-3 rounded-lg border" style={{ backgroundColor: 'hsl(var(--primary) / 0.05)', borderColor: 'hsl(var(--primary) / 0.2)' }}>
            <Check className="h-4 w-4 text-primary shrink-0" />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-foreground">Auto-saving to cloud</p>
              <p className="text-xs text-muted-foreground">
                {lastCloudSyncFormatted
                  ? `Last saved ${lastCloudSyncFormatted}`
                  : 'Syncs on every change — no configuration needed'}
              </p>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => uploadNow(data)}
              disabled={cloudSync.isSyncing}
              className="shrink-0"
            >
              {cloudSync.isSyncing ? (
                <RefreshCw className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <RefreshCw className="h-3.5 w-3.5" />
              )}
            </Button>
          </div>
          {!data.userSettings.accountName && (
            <div className="flex items-start gap-2 p-3 rounded-lg border" style={{ backgroundColor: 'hsl(38 92% 95%)', borderColor: 'hsl(38 92% 70%)' }}>
              <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" style={{ color: 'hsl(38 92% 40%)' }} />
              <p className="text-xs" style={{ color: 'hsl(38 92% 30%)' }}>
                Set an <strong>Account Name</strong> in Settings → Account so your cloud backup can be recovered on a new device.
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* ── Tier 2: External Drive (optional Google Drive) ── */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <HardDrive className="h-5 w-5 text-muted-foreground" />
              External Drive
            </CardTitle>
            <Badge variant="outline" className="text-xs">
              Optional
            </Badge>
          </div>
          <CardDescription>
            Push your data to Google Drive as an external archive.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {isDriveConnected ? (
            <div className="space-y-4">
              <div className="flex items-center justify-between p-3 rounded-lg border" style={{ backgroundColor: 'hsl(142 76% 36% / 0.08)', borderColor: 'hsl(142 76% 36% / 0.3)' }}>
                <div className="flex items-center gap-2">
                  <Check className="h-4 w-4" style={{ color: 'hsl(142 76% 36%)' }} />
                  <span className="text-sm font-medium">{driveSettings.connectedEmail}</span>
                </div>
                <Button variant="outline" size="sm" onClick={disconnectDrive}>
                  Disconnect
                </Button>
              </div>

              {/* Auto-sync toggle */}
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="auto-sync-drive">Auto-push to Drive</Label>
                  <p className="text-xs text-muted-foreground">Push automatically on each change</p>
                </div>
                <Switch
                  id="auto-sync-drive"
                  checked={driveSettings.autoSyncEnabled}
                  onCheckedChange={setAutoSync}
                />
              </div>

              {/* Manual push */}
              <div className="flex items-center justify-between border-t pt-4">
                <div>
                  <p className="text-sm font-medium">Last pushed to Drive</p>
                  <p className="text-xs text-muted-foreground">{lastDriveSyncFormatted || 'Never'}</p>
                </div>
                <Button
                  onClick={handlePushToDrive}
                  disabled={isDriveSyncing}
                  variant="outline"
                  size="sm"
                >
                  {isDriveSyncing ? (
                    <>
                      <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                      Pushing...
                    </>
                  ) : (
                    <>
                      <Cloud className="h-4 w-4 mr-2" />
                      Push to Drive
                    </>
                  )}
                </Button>
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              <Button onClick={connectDrive} disabled={isDriveLoading} variant="outline" className="w-full">
                {isDriveLoading ? (
                  <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <Cloud className="h-4 w-4 mr-2" />
                )}
                Connect Google Drive
              </Button>

              <button
                className="w-full text-xs text-muted-foreground hover:text-foreground transition-colors"
                onClick={() => setShowSetupInfo(!showSetupInfo)}
              >
                {showSetupInfo ? 'Hide setup instructions' : 'First time? View setup instructions'}
              </button>

              {showSetupInfo && (
                <div className="p-3 bg-muted rounded-lg text-xs space-y-1">
                  <div className="flex items-start gap-2">
                    <AlertCircle className="h-3.5 w-3.5 mt-0.5 text-amber-500 shrink-0" />
                    <p className="text-muted-foreground">
                      Google Drive requires a configured Google Cloud project with OAuth credentials. Ask your developer to set up the Google Client ID.
                    </p>
                  </div>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};
