import React from 'react';
import { useGoogleDrive } from '@/contexts/GoogleDriveContext';
import { useBusiness } from '@/contexts/BusinessContext';
import { Button } from '@/components/ui/button';
import { RefreshCw, X, Cloud } from 'lucide-react';
import { setRestoringData } from '@/contexts/BusinessContext';

export const RemoteChangeNotification: React.FC = () => {
  const { hasNewRemoteChanges, lastRemoteChangeBy, clearRemoteChangeNotification, backups, loadBackups, restoreBackup } = useGoogleDrive();
  const { dispatch } = useBusiness();
  const [isLoading, setIsLoading] = React.useState(false);

  if (!hasNewRemoteChanges) return null;

  const handleRefresh = async () => {
    setIsLoading(true);
    try {
      await loadBackups();
    } catch (error) {
      console.error('Failed to load backups:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleRestoreLatest = async () => {
    if (backups.length === 0) {
      await handleRefresh();
      return;
    }
    
    setIsLoading(true);
    try {
      setRestoringData(true);
      const latestData = await restoreBackup(backups[0].id);
      dispatch({ type: 'LOAD_DATA', payload: latestData });
      clearRemoteChangeNotification();
    } catch (error) {
      console.error('Failed to restore latest data:', error);
    } finally {
      setIsLoading(false);
      setRestoringData(false);
    }
  };

  return (
    <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50 animate-in slide-in-from-top-2">
      <div className="flex items-center gap-3 px-4 py-3 bg-primary text-primary-foreground rounded-lg shadow-lg">
        <Cloud className="h-5 w-5" />
        <div className="text-sm">
          <span className="font-medium">New data available</span>
          {lastRemoteChangeBy && (
            <span className="opacity-90"> from {lastRemoteChangeBy}</span>
          )}
        </div>
        <div className="flex items-center gap-2 ml-2">
          <Button
            size="sm"
            variant="secondary"
            onClick={handleRestoreLatest}
            disabled={isLoading}
            className="h-7"
          >
            {isLoading ? (
              <RefreshCw className="h-3 w-3 animate-spin mr-1" />
            ) : (
              <RefreshCw className="h-3 w-3 mr-1" />
            )}
            Refresh
          </Button>
          <Button
            size="sm"
            variant="ghost"
            onClick={clearRemoteChangeNotification}
            className="h-7 w-7 p-0 text-primary-foreground hover:text-primary-foreground/80"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
};
