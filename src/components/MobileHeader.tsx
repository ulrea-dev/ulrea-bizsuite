import React, { useState } from 'react';
import { ChevronLeft, MoreVertical, Settings, Download, Moon, Sun, Cloud, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';
import { useTheme } from '@/hooks/useTheme';
import { useBusiness } from '@/contexts/BusinessContext';
import { useGoogleDrive } from '@/contexts/GoogleDriveContext';
import { exportData } from '@/utils/storage';
import { useToast } from '@/hooks/use-toast';

interface MobileHeaderProps {
  title?: string;
  actions?: React.ReactNode;
  showBack?: boolean;
  backTo?: string;
}

export const MobileHeader: React.FC<MobileHeaderProps> = ({ title, actions, showBack, backTo }) => {
  const navigate = useNavigate();
  const { theme, toggleTheme } = useTheme();
  const { data } = useBusiness();
  const { isConnected, isSyncing, syncNow } = useGoogleDrive();
  const { toast } = useToast();
  const [menuOpen, setMenuOpen] = useState(false);

  const handleBack = () => {
    if (backTo) {
      navigate(backTo);
    } else {
      navigate(-1);
    }
  };

  const handleExport = async () => {
    setMenuOpen(false);
    try {
      const localData = exportData();
      const blob = new Blob([localData], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `bizsuite-backup-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      if (isConnected) await syncNow(data);
      toast({ title: "Data Exported", description: "Your data has been downloaded." });
    } catch {
      toast({ title: "Export Failed", description: "Please try again.", variant: "destructive" });
    }
  };

  return (
    <>
      <header className="sticky top-0 z-40 flex items-center justify-between h-12 px-4 border-b bg-background/80 backdrop-blur-xl supports-[backdrop-filter]:bg-background/60 md:hidden">
        <div className="flex items-center gap-1 min-w-[40px]">
          {showBack && (
            <Button variant="ghost" size="icon" className="h-8 w-8 -ml-1" onClick={handleBack}>
              <ChevronLeft className="h-5 w-5" />
            </Button>
          )}
        </div>
        <span className="font-semibold text-sm truncate max-w-[200px] text-center absolute left-1/2 -translate-x-1/2">
          {title || ''}
        </span>
        <div className="flex items-center gap-1 min-w-[40px] justify-end">
          {actions}
          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setMenuOpen(!menuOpen)}>
            <MoreVertical className="h-5 w-5" />
          </Button>
        </div>
      </header>

      {/* Dropdown menu */}
      {menuOpen && (
        <>
          <div className="fixed inset-0 z-40 md:hidden" onClick={() => setMenuOpen(false)} />
          <div className="fixed top-12 right-2 z-50 w-48 rounded-lg border bg-popover shadow-lg py-1 md:hidden animate-scale-in">
            <button
              onClick={() => { setMenuOpen(false); navigate('/settings'); }}
              className="flex w-full items-center gap-3 px-4 py-3 text-sm text-popover-foreground hover:bg-accent active:bg-accent/80 transition-colors"
            >
              <Settings className="h-4 w-4" />
              Settings
            </button>
            <button
              onClick={handleExport}
              className="flex w-full items-center gap-3 px-4 py-3 text-sm text-popover-foreground hover:bg-accent active:bg-accent/80 transition-colors"
            >
              {isSyncing ? <RefreshCw className="h-4 w-4 animate-spin" /> : isConnected ? <Cloud className="h-4 w-4" /> : <Download className="h-4 w-4" />}
              {isSyncing ? 'Syncing...' : 'Export Data'}
            </button>
            <button
              onClick={() => { setMenuOpen(false); toggleTheme(); }}
              className="flex w-full items-center gap-3 px-4 py-3 text-sm text-popover-foreground hover:bg-accent active:bg-accent/80 transition-colors"
            >
              {theme === 'light' ? <Moon className="h-4 w-4" /> : <Sun className="h-4 w-4" />}
              {theme === 'light' ? 'Dark Mode' : 'Light Mode'}
            </button>
          </div>
        </>
      )}
    </>
  );
};
