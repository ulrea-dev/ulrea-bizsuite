import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { RefreshCw, LogIn, CheckCircle2 } from 'lucide-react';

interface GoogleReconnectModalProps {
  open: boolean;
  isReconnecting: boolean;
  reconnectSuccess: boolean;
  onReconnect: () => void;
  onClose: () => void;
}

export const GoogleReconnectModal: React.FC<GoogleReconnectModalProps> = ({
  open,
  isReconnecting,
  reconnectSuccess,
  onReconnect,
  onClose,
}) => {
  return (
    <Dialog open={open}>
      <DialogContent className="sm:max-w-md" onPointerDownOutside={(e) => e.preventDefault()}>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {reconnectSuccess ? (
              <>
                <CheckCircle2 className="h-5 w-5 text-green-500" />
                Connection Successful
              </>
            ) : (
              <>
                <RefreshCw className="h-5 w-5 text-primary" />
                Session Expired
              </>
            )}
          </DialogTitle>
          <DialogDescription>
            {reconnectSuccess
              ? "You're reconnected to Google Drive. Your data will continue syncing."
              : 'Your Google session has expired. Please reconnect to continue syncing your data.'}
          </DialogDescription>
        </DialogHeader>
        <div className="py-4">
          <p className="text-sm text-muted-foreground">
            {reconnectSuccess
              ? 'You can now continue working. Any pending changes will be synced automatically.'
              : 'This happens periodically for security reasons. Your data is safe and will sync once you reconnect.'}
          </p>
        </div>
        <DialogFooter>
          {reconnectSuccess ? (
            <Button onClick={onClose} className="w-full">
              Continue Working
            </Button>
          ) : (
            <Button onClick={onReconnect} disabled={isReconnecting} className="w-full">
              {isReconnecting ? (
                <>
                  <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                  Reconnecting...
                </>
              ) : (
                <>
                  <LogIn className="mr-2 h-4 w-4" />
                  Reconnect to Google
                </>
              )}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
