import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { useGoogleDrive } from '@/contexts/GoogleDriveContext';
import { useBusiness } from '@/contexts/BusinessContext';
import { SelectSheetModal } from './SelectSheetModal';
import { SpreadsheetInfo } from '@/types/googleDrive';
import { formatDistanceToNow } from 'date-fns';
import {
  FileSpreadsheet,
  ExternalLink,
  Loader2,
  RefreshCw,
  Link as LinkIcon,
  Unlink,
  Plus,
} from 'lucide-react';

export const GoogleSheetsConnectionCard: React.FC = () => {
  const { data } = useBusiness();
  const {
    isConnected,
    settings,
    isSyncingSheet,
    connectToSheet,
    disconnectSheet,
    syncToConnectedSheet,
    createAndConnectSheet,
    setSheetAutoSync,
  } = useGoogleDrive();
  
  const [showSelectModal, setShowSelectModal] = useState(false);
  const [isCreating, setIsCreating] = useState(false);

  const connectedSheet = settings.connectedSheet;

  const handleCreateNew = async () => {
    setIsCreating(true);
    try {
      await createAndConnectSheet(data);
    } finally {
      setIsCreating(false);
    }
  };

  const handleSelectSheet = async (sheet: SpreadsheetInfo) => {
    await connectToSheet(sheet);
  };

  const handleSync = async () => {
    await syncToConnectedSheet(data);
  };

  if (!isConnected) {
    return null;
  }

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileSpreadsheet className="h-5 w-5" />
            Google Sheets Sync
          </CardTitle>
          <CardDescription>
            Keep a Google Sheet updated with your data in real-time.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {connectedSheet ? (
            <>
              {/* Connected state */}
              <div className="flex items-start gap-3 p-3 bg-muted rounded-lg">
                <FileSpreadsheet className="h-5 w-5 text-green-600 mt-0.5" />
                <div className="flex-1 min-w-0">
                  <p className="font-medium truncate">{connectedSheet.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {connectedSheet.lastSyncedAt
                      ? `Last synced ${formatDistanceToNow(new Date(connectedSheet.lastSyncedAt), { addSuffix: true })}`
                      : 'Not synced yet'}
                  </p>
                </div>
              </div>

              <div className="flex flex-wrap gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => window.open(connectedSheet.spreadsheetUrl, '_blank')}
                >
                  <ExternalLink className="h-4 w-4 mr-1" />
                  Open Sheet
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleSync}
                  disabled={isSyncingSheet}
                >
                  {isSyncingSheet ? (
                    <Loader2 className="h-4 w-4 mr-1 animate-spin" />
                  ) : (
                    <RefreshCw className="h-4 w-4 mr-1" />
                  )}
                  Sync Now
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={disconnectSheet}
                >
                  <Unlink className="h-4 w-4 mr-1" />
                  Disconnect
                </Button>
              </div>

              <div className="flex items-center space-x-2 pt-2 border-t">
                <Switch
                  id="sheet-auto-sync"
                  checked={settings.sheetAutoSyncEnabled}
                  onCheckedChange={setSheetAutoSync}
                />
                <Label htmlFor="sheet-auto-sync" className="text-sm">
                  Auto-sync when data changes
                </Label>
              </div>
            </>
          ) : (
            <>
              {/* Not connected state */}
              <p className="text-sm text-muted-foreground">
                Connect to a spreadsheet to keep it automatically updated with your BizSuite data.
                Changes you make in the app will sync to the sheet.
              </p>
              
              <div className="flex flex-wrap gap-2">
                <Button
                  onClick={handleCreateNew}
                  disabled={isCreating}
                >
                  {isCreating ? (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <Plus className="h-4 w-4 mr-2" />
                  )}
                  Create New Sheet
                </Button>
                <Button
                  variant="outline"
                  onClick={() => setShowSelectModal(true)}
                >
                  <LinkIcon className="h-4 w-4 mr-2" />
                  Connect Existing
                </Button>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      <SelectSheetModal
        isOpen={showSelectModal}
        onClose={() => setShowSelectModal(false)}
        onSelect={handleSelectSheet}
      />
    </>
  );
};
