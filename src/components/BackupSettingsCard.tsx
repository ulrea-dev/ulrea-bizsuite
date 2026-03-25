import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { useGoogleDrive } from '@/contexts/GoogleDriveContext';
import { useSupabaseStorage } from '@/contexts/SupabaseStorageContext';
import { useBusiness } from '@/contexts/BusinessContext';
import { Cloud, RefreshCw, Check, AlertCircle, HardDrive, Wifi, Download } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { LegacyImportBusinessPickerModal } from './LegacyImportBusinessPickerModal';
import { AppData } from '@/types/business';

export const BackupSettingsCard: React.FC = () => {
  const { data, dispatch } = useBusiness();
  const {
    isConnected: isDriveConnected,
    isLoading: isDriveLoading,
    isSyncing: isDriveSyncing,
    settings: driveSettings,
    connect: connectDrive,
    disconnect: disconnectDrive,
    syncNow: syncToDrive,
    setAutoSync,
    backups,
    loadBackups,
    restoreBackup,
  } = useGoogleDrive();

  const { cloudSync, uploadNow } = useSupabaseStorage();

  const [showSetupInfo, setShowSetupInfo] = useState(false);
  const [isLoadingBackups, setIsLoadingBackups] = useState(false);
  const [isRestoring, setIsRestoring] = useState(false);
  const [showRestoreSection, setShowRestoreSection] = useState(false);
  // Multi-business picker state
  const [pendingBackupData, setPendingBackupData] = useState<AppData | null>(null);
  const [showBusinessPicker, setShowBusinessPicker] = useState(false);

  const lastCloudSyncFormatted = cloudSync.lastSyncTime
    ? formatDistanceToNow(new Date(cloudSync.lastSyncTime), { addSuffix: true })
    : null;

  const lastDriveSyncFormatted = driveSettings.lastSyncTime
    ? formatDistanceToNow(new Date(driveSettings.lastSyncTime), { addSuffix: true })
    : null;

  const handlePushToDrive = async () => {
    await syncToDrive(data);
  };

  const handleShowRestore = async () => {
    setShowRestoreSection(true);
    if (isDriveConnected && backups.length === 0) {
      setIsLoadingBackups(true);
      await loadBackups().finally(() => setIsLoadingBackups(false));
    }
  };

  const handleConnectAndRestore = async () => {
    setShowRestoreSection(true);
    await connectDrive();
  };

  const handleRestoreBackup = async (fileId: string) => {
    setIsRestoring(true);
    try {
      const restoredData = await restoreBackup(fileId);
      if (restoredData) {
        // If the backup has multiple businesses, show the picker
        if ((restoredData.businesses?.length ?? 0) > 1) {
          setPendingBackupData(restoredData);
          setShowBusinessPicker(true);
          setIsRestoring(false);
          return;
        }
        await _applyRestoredData(restoredData);
      }
      setShowRestoreSection(false);
    } finally {
      setIsRestoring(false);
    }
  };

  const _applyRestoredData = async (restoredData: AppData) => {
    dispatch({ type: 'LOAD_DATA', payload: restoredData });
    await uploadNow(restoredData);
    setShowRestoreSection(false);
    setShowBusinessPicker(false);
    setPendingBackupData(null);
  };

  // When Drive connects while restore section is open, auto-load backups
  React.useEffect(() => {
    if (isDriveConnected && showRestoreSection && backups.length === 0) {
      setIsLoadingBackups(true);
      loadBackups().finally(() => setIsLoadingBackups(false));
    }
  }, [isDriveConnected, showRestoreSection]);

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

      {/* ── Restore from Google Drive (legacy migration) ── */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Download className="h-5 w-5 text-muted-foreground" />
              Restore from Google Drive
            </CardTitle>
            <Badge variant="outline" className="text-xs">
              Migration
            </Badge>
          </div>
          <CardDescription>
            Previously used WorkOS with Google Drive? Connect your account to scan for backups and import your data.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {!showRestoreSection ? (
            <Button variant="outline" className="w-full" onClick={handleShowRestore}>
              <Download className="h-4 w-4 mr-2" />
              Scan Drive for Backups
            </Button>
          ) : (
            <div className="space-y-3">
              {!isDriveConnected ? (
                <Button onClick={handleConnectAndRestore} disabled={isDriveLoading} className="w-full">
                  {isDriveLoading ? (
                    <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <svg className="w-4 h-4 mr-2" viewBox="0 0 24 24">
                      <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                      <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                      <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                    </svg>
                  )}
                  Connect Google to Scan
                </Button>
              ) : isLoadingBackups ? (
                <div className="flex items-center justify-center gap-2 py-4 text-sm text-muted-foreground">
                  <RefreshCw className="h-4 w-4 animate-spin" />
                  Scanning your Drive for backups…
                </div>
              ) : backups.length > 0 ? (
                <div className="space-y-2">
                  <p className="text-xs font-medium text-foreground">
                    Found {backups.length} backup{backups.length > 1 ? 's' : ''} in your Drive
                  </p>
                  {backups.slice(0, 3).map((backup) => (
                    <div key={backup.id} className="flex items-center justify-between p-3 rounded-lg border border-border bg-muted/40">
                      <div className="min-w-0 flex-1">
                        <p className="text-xs font-medium text-foreground truncate">{backup.name}</p>
                        <p className="text-xs text-muted-foreground">
                          {new Date(backup.createdTime).toLocaleDateString(undefined, { dateStyle: 'medium' })}
                        </p>
                      </div>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleRestoreBackup(backup.id)}
                        disabled={isRestoring}
                        className="ml-3 shrink-0"
                      >
                        {isRestoring ? <RefreshCw className="h-3.5 w-3.5 animate-spin" /> : 'Restore'}
                      </Button>
                    </div>
                  ))}
                  <button
                    className="w-full text-xs text-muted-foreground hover:text-foreground transition-colors py-1"
                    onClick={() => setShowRestoreSection(false)}
                  >
                    Cancel
                  </button>
                </div>
              ) : (
                <div className="space-y-3">
                  <div className="flex items-center gap-2 p-3 rounded-lg bg-muted text-xs text-muted-foreground">
                    <AlertCircle className="h-3.5 w-3.5 shrink-0" />
                    No backups found for {driveSettings.connectedEmail || 'this account'}.
                  </div>
                  <button
                    className="w-full text-xs text-muted-foreground hover:text-foreground transition-colors py-1"
                    onClick={() => setShowRestoreSection(false)}
                  >
                    Cancel
                  </button>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* ── Tier 2: External Drive (optional Google Drive export) ── */}
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
                    <AlertCircle className="h-3.5 w-3.5 mt-0.5 text-muted-foreground shrink-0" />
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

    {/* Legacy multi-business import picker */}
    {pendingBackupData && (
      <LegacyImportBusinessPickerModal
        isOpen={showBusinessPicker}
        onClose={() => {
          setShowBusinessPicker(false);
          setPendingBackupData(null);
          setIsRestoring(false);
        }}
        backupData={pendingBackupData}
        onConfirm={_applyRestoredData}
        isImporting={isRestoring}
      />
    )}
  );
};
