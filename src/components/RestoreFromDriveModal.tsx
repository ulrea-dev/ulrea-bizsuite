import React, { useEffect, useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useGoogleDrive } from '@/contexts/GoogleDriveContext';
import { useBusiness } from '@/contexts/BusinessContext';
import { GoogleDriveBackup } from '@/types/googleDrive';
import { formatDistanceToNow, format } from 'date-fns';
import { RefreshCw, FileJson, Check, AlertTriangle } from 'lucide-react';

interface RestoreFromDriveModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const RestoreFromDriveModal: React.FC<RestoreFromDriveModalProps> = ({
  isOpen,
  onClose,
}) => {
  const { backups, isLoading, loadBackups, restoreBackup, isConnected } = useGoogleDrive();
  const { dispatch } = useBusiness();
  const [selectedBackup, setSelectedBackup] = useState<GoogleDriveBackup | null>(null);
  const [isRestoring, setIsRestoring] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  useEffect(() => {
    if (isOpen && isConnected) {
      loadBackups();
    }
  }, [isOpen, isConnected, loadBackups]);

  const handleSelectBackup = (backup: GoogleDriveBackup) => {
    setSelectedBackup(backup);
    setShowConfirm(true);
  };

  const handleRestore = async () => {
    if (!selectedBackup) return;

    setIsRestoring(true);
    try {
      const data = await restoreBackup(selectedBackup.id);
      dispatch({ type: 'LOAD_DATA', payload: data });
      onClose();
    } catch (error) {
      // Error is handled in the context
    } finally {
      setIsRestoring(false);
      setShowConfirm(false);
      setSelectedBackup(null);
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  if (showConfirm && selectedBackup) {
    return (
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-amber-500" />
              Confirm Restore
            </DialogTitle>
            <DialogDescription>
              This will replace all your current data with the selected backup. This action cannot be undone.
            </DialogDescription>
          </DialogHeader>

          <div className="p-4 bg-muted rounded-lg">
            <p className="text-sm font-medium">{selectedBackup.name}</p>
            <p className="text-xs text-muted-foreground">
              {format(new Date(selectedBackup.createdTime), 'PPpp')}
            </p>
          </div>

          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => {
                setShowConfirm(false);
                setSelectedBackup(null);
              }}
              disabled={isRestoring}
            >
              Cancel
            </Button>
            <Button 
              variant="destructive" 
              onClick={handleRestore}
              disabled={isRestoring}
            >
              {isRestoring ? (
                <>
                  <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                  Restoring...
                </>
              ) : (
                'Restore Backup'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Restore from Google Drive</DialogTitle>
          <DialogDescription>
            Select a backup to restore. Your current data will be replaced.
          </DialogDescription>
        </DialogHeader>

        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <RefreshCw className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : backups.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <FileJson className="h-12 w-12 mx-auto mb-2 opacity-50" />
            <p>No backups found in Google Drive</p>
          </div>
        ) : (
          <ScrollArea className="max-h-[300px]">
            <div className="space-y-2">
              {backups.map((backup) => (
                <button
                  key={backup.id}
                  onClick={() => handleSelectBackup(backup)}
                  className="w-full p-3 text-left rounded-lg border hover:bg-muted transition-colors"
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="text-sm font-medium truncate">{backup.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {formatDistanceToNow(new Date(backup.createdTime), { addSuffix: true })}
                      </p>
                    </div>
                    <span className="text-xs text-muted-foreground">
                      {formatFileSize(backup.size)}
                    </span>
                  </div>
                </button>
              ))}
            </div>
          </ScrollArea>
        )}

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button variant="outline" onClick={loadBackups} disabled={isLoading}>
            <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
