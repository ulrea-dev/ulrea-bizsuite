import React from 'react';
import { Button } from '@/components/ui/button';
import { RefreshCw, Cloud, User } from 'lucide-react';

interface SyncRequiredOverlayProps {
  modifiedBy: { name?: string; email: string };
  modifiedAt: string;
  isRefreshing: boolean;
  onRefresh: () => void;
}

export const SyncRequiredOverlay: React.FC<SyncRequiredOverlayProps> = ({
  modifiedBy,
  modifiedAt,
  isRefreshing,
  onRefresh,
}) => {
  const displayName = modifiedBy.name || modifiedBy.email;
  const timeAgo = getTimeAgo(modifiedAt);

  return (
    <div className="fixed inset-0 z-[100] bg-background/95 backdrop-blur-sm flex items-center justify-center">
      <div className="max-w-md w-full mx-4 p-6 bg-card border rounded-lg shadow-lg text-center">
        <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-primary/10 flex items-center justify-center">
          <Cloud className="h-8 w-8 text-primary animate-pulse" />
        </div>
        
        <h2 className="text-xl font-semibold mb-2">New Changes Detected</h2>
        
        <div className="flex items-center justify-center gap-2 mb-4 text-muted-foreground">
          <User className="h-4 w-4" />
          <span className="font-medium text-foreground">{displayName}</span>
          <span>made changes {timeAgo}</span>
        </div>
        
        <p className="text-sm text-muted-foreground mb-6">
          To prevent data conflicts, please refresh to get the latest data before continuing.
        </p>
        
        <Button 
          onClick={onRefresh} 
          disabled={isRefreshing}
          size="lg"
          className="w-full"
        >
          {isRefreshing ? (
            <>
              <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
              Refreshing...
            </>
          ) : (
            <>
              <RefreshCw className="mr-2 h-4 w-4" />
              Refresh Now
            </>
          )}
        </Button>
      </div>
    </div>
  );
};

function getTimeAgo(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const seconds = Math.floor((now.getTime() - date.getTime()) / 1000);

  if (seconds < 60) return 'just now';
  if (seconds < 3600) return `${Math.floor(seconds / 60)} minutes ago`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)} hours ago`;
  return `${Math.floor(seconds / 86400)} days ago`;
}
