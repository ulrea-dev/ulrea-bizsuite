import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Cloud, RefreshCw, AlertTriangle } from 'lucide-react';

interface ReconnectGoogleModalProps {
  isOpen: boolean;
  onClose: () => void;
  onReconnect: () => void;
  isLoading: boolean;
  pendingAction?: () => Promise<void>;
}

export const ReconnectGoogleModal: React.FC<ReconnectGoogleModalProps> = ({
  isOpen,
  onClose,
  onReconnect,
  isLoading,
}) => {
  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-amber-500" />
            Session Expired
          </DialogTitle>
          <DialogDescription>
            Your Google Drive connection has expired. Please reconnect to continue syncing your data.
          </DialogDescription>
        </DialogHeader>

        <div className="p-4 bg-muted rounded-lg text-sm space-y-3">
          <p className="text-muted-foreground">
            This can happen after a period of inactivity or when your browser clears cookies.
            Your local data is safe - just reconnect to resume syncing.
          </p>
        </div>

        <div className="flex gap-3 pt-2">
          <Button variant="outline" onClick={onClose} className="flex-1">
            Later
          </Button>
          <Button onClick={onReconnect} disabled={isLoading} className="flex-1">
            {isLoading ? (
              <>
                <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                Reconnecting...
              </>
            ) : (
              <>
                <Cloud className="h-4 w-4 mr-2" />
                Reconnect Now
              </>
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
