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
import { RefreshCw, LogIn } from 'lucide-react';

interface GoogleReconnectModalProps {
  open: boolean;
  isReconnecting: boolean;
  onReconnect: () => void;
}

export const GoogleReconnectModal: React.FC<GoogleReconnectModalProps> = ({
  open,
  isReconnecting,
  onReconnect,
}) => {
  return (
    <Dialog open={open}>
      <DialogContent className="sm:max-w-md" onPointerDownOutside={(e) => e.preventDefault()}>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <RefreshCw className="h-5 w-5 text-primary" />
            Session Expired
          </DialogTitle>
          <DialogDescription>
            Your Google session has expired. Please reconnect to continue syncing your data.
          </DialogDescription>
        </DialogHeader>
        <div className="py-4">
          <p className="text-sm text-muted-foreground">
            This happens periodically for security reasons. Your data is safe and will sync once you reconnect.
          </p>
        </div>
        <DialogFooter>
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
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
