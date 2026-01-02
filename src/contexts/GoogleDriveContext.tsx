import React, { createContext, useContext, useState, useCallback, useEffect, useRef } from 'react';
import { googleDriveService } from '@/services/googleDriveService';
import { GoogleDriveBackup, GoogleDriveSettings, DEFAULT_GOOGLE_DRIVE_SETTINGS } from '@/types/googleDrive';
import { AppData } from '@/types/business';
import { useToast } from '@/hooks/use-toast';

const STORAGE_KEY = 'bizsuite-google-drive-settings';
const DEBOUNCE_DELAY = 5000; // 5 seconds

// Google OAuth Client ID (public key - safe to include in client-side code)
// Exported for use in Auth component
const GOOGLE_CLIENT_ID = "63460396574-lmeqr2hf2ucbj11vbmkr0m2va98ngt1a.apps.googleusercontent.com";

interface GoogleDriveContextValue {
  isConnected: boolean;
  isLoading: boolean;
  isSyncing: boolean;
  isConfigured: boolean;
  settings: GoogleDriveSettings;
  backups: GoogleDriveBackup[];
  connect: () => void;
  disconnect: () => void;
  syncNow: (data: AppData) => Promise<void>;
  loadBackups: () => Promise<void>;
  restoreBackup: (fileId: string) => Promise<AppData>;
  setAutoSync: (enabled: boolean) => void;
  scheduleSync: (data: AppData) => void;
}

const GoogleDriveContext = createContext<GoogleDriveContextValue | undefined>(undefined);

export const useGoogleDrive = (): GoogleDriveContextValue => {
  const context = useContext(GoogleDriveContext);
  if (!context) {
    throw new Error('useGoogleDrive must be used within a GoogleDriveProvider');
  }
  return context;
};

interface GoogleDriveProviderProps {
  children: React.ReactNode;
}

export const GoogleDriveProvider: React.FC<GoogleDriveProviderProps> = ({ children }) => {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [backups, setBackups] = useState<GoogleDriveBackup[]>([]);
  const [settings, setSettings] = useState<GoogleDriveSettings>(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      try {
        return { ...DEFAULT_GOOGLE_DRIVE_SETTINGS, ...JSON.parse(stored) };
      } catch {
        return DEFAULT_GOOGLE_DRIVE_SETTINGS;
      }
    }
    return DEFAULT_GOOGLE_DRIVE_SETTINGS;
  });

  const syncTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const tokenClientRef = useRef<google.accounts.oauth2.TokenClient | null>(null);

  const isConnected = !!settings.accessToken;

  // Initialize service with stored token
  useEffect(() => {
    if (settings.accessToken) {
      googleDriveService.setAccessToken(settings.accessToken);
    }
  }, [settings.accessToken]);

  // Persist settings to localStorage
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
  }, [settings]);

  // Load Google Identity Services script
  useEffect(() => {
    

    const script = document.createElement('script');
    script.src = 'https://accounts.google.com/gsi/client';
    script.async = true;
    script.defer = true;
    script.onload = () => {
      tokenClientRef.current = google.accounts.oauth2.initTokenClient({
        client_id: GOOGLE_CLIENT_ID,
        scope: 'https://www.googleapis.com/auth/drive.file https://www.googleapis.com/auth/userinfo.email',
        callback: async (tokenResponse) => {
          if (tokenResponse.error) {
            console.error('Google login error:', tokenResponse.error);
            toast({
              title: 'Connection Failed',
              description: 'Could not connect to Google Drive. Please try again.',
              variant: 'destructive',
            });
            setIsLoading(false);
            return;
          }

          try {
            // Get user info
            const userInfoResponse = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
              headers: { Authorization: `Bearer ${tokenResponse.access_token}` },
            });
            const userInfo = await userInfoResponse.json();

            googleDriveService.setAccessToken(tokenResponse.access_token);
            
            updateSettings({
              accessToken: tokenResponse.access_token,
              connectedEmail: userInfo.email,
            });

            toast({
              title: 'Connected to Google Drive',
              description: `Signed in as ${userInfo.email}`,
            });
          } catch (error) {
            console.error('Failed to get user info:', error);
            toast({
              title: 'Connection Failed',
              description: 'Could not connect to Google Drive. Please try again.',
              variant: 'destructive',
            });
          } finally {
            setIsLoading(false);
          }
        },
      });
    };
    document.body.appendChild(script);

    return () => {
      document.body.removeChild(script);
    };
  }, [toast]);

  const updateSettings = useCallback((updates: Partial<GoogleDriveSettings>) => {
    setSettings(prev => ({ ...prev, ...updates }));
  }, []);

  const connect = useCallback(() => {
    if (tokenClientRef.current) {
      setIsLoading(true);
      tokenClientRef.current.requestAccessToken({ prompt: 'consent' });
    }
  }, [toast]);

  const disconnect = useCallback(() => {
    if (settings.accessToken) {
      google.accounts.oauth2.revoke(settings.accessToken, () => {
        console.log('Token revoked');
      });
    }
    googleDriveService.setAccessToken(null);
    updateSettings({
      accessToken: null,
      connectedEmail: null,
      lastSyncTime: null,
    });
    setBackups([]);
    toast({
      title: 'Disconnected',
      description: 'Google Drive has been disconnected.',
    });
  }, [settings.accessToken, updateSettings, toast]);

  const syncNow = useCallback(async (data: AppData) => {
    if (!isConnected) return;

    setIsSyncing(true);
    try {
      await googleDriveService.uploadBackup(data);
      const now = new Date().toISOString();
      updateSettings({ lastSyncTime: now });
      
      // Clean up old backups (keep last 10)
      await googleDriveService.deleteOldBackups(10);
      
      toast({
        title: 'Backup Complete',
        description: 'Your data has been backed up to Google Drive.',
      });
    } catch (error) {
      console.error('Sync failed:', error);
      toast({
        title: 'Backup Failed',
        description: error instanceof Error ? error.message : 'Could not backup to Google Drive.',
        variant: 'destructive',
      });
    } finally {
      setIsSyncing(false);
    }
  }, [isConnected, updateSettings, toast]);

  const scheduleSync = useCallback((data: AppData) => {
    if (!isConnected || !settings.autoSyncEnabled) return;

    // Clear existing timeout
    if (syncTimeoutRef.current) {
      clearTimeout(syncTimeoutRef.current);
    }

    // Schedule new sync after debounce delay
    syncTimeoutRef.current = setTimeout(() => {
      syncNow(data);
    }, DEBOUNCE_DELAY);
  }, [isConnected, settings.autoSyncEnabled, syncNow]);

  const loadBackups = useCallback(async () => {
    if (!isConnected) return;

    setIsLoading(true);
    try {
      const list = await googleDriveService.listBackups();
      setBackups(list);
    } catch (error) {
      console.error('Failed to load backups:', error);
      toast({
        title: 'Failed to Load Backups',
        description: error instanceof Error ? error.message : 'Could not load backups from Google Drive.',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  }, [isConnected, toast]);

  const restoreBackup = useCallback(async (fileId: string): Promise<AppData> => {
    setIsLoading(true);
    try {
      const data = await googleDriveService.downloadBackup(fileId);
      toast({
        title: 'Backup Restored',
        description: 'Your data has been restored from Google Drive.',
      });
      return data;
    } catch (error) {
      console.error('Restore failed:', error);
      toast({
        title: 'Restore Failed',
        description: error instanceof Error ? error.message : 'Could not restore backup.',
        variant: 'destructive',
      });
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, [toast]);

  const setAutoSync = useCallback((enabled: boolean) => {
    updateSettings({ autoSyncEnabled: enabled });
    toast({
      title: enabled ? 'Auto-sync Enabled' : 'Auto-sync Disabled',
      description: enabled 
        ? 'Changes will automatically be backed up to Google Drive.' 
        : 'You can still backup manually.',
    });
  }, [updateSettings, toast]);

  // Listen for data changes and trigger auto-sync
  useEffect(() => {
    const handleDataChange = (event: CustomEvent<AppData>) => {
      scheduleSync(event.detail);
    };

    window.addEventListener('bizsuite-data-change', handleDataChange as EventListener);
    
    return () => {
      window.removeEventListener('bizsuite-data-change', handleDataChange as EventListener);
      if (syncTimeoutRef.current) {
        clearTimeout(syncTimeoutRef.current);
      }
    };
  }, [scheduleSync]);

  const value: GoogleDriveContextValue = {
    isConnected,
    isLoading,
    isSyncing,
    isConfigured: true,
    settings,
    backups,
    connect,
    disconnect,
    syncNow,
    loadBackups,
    restoreBackup,
    setAutoSync,
    scheduleSync,
  };

  return (
    <GoogleDriveContext.Provider value={value}>
      {children}
    </GoogleDriveContext.Provider>
  );
};

// Add type declaration for Google Identity Services
declare global {
  interface Window {
    google?: typeof google;
  }
  namespace google {
    namespace accounts {
      namespace oauth2 {
        function initTokenClient(config: {
          client_id: string;
          scope: string;
          callback: (response: { access_token?: string; error?: string }) => void;
        }): TokenClient;
        function revoke(token: string, callback: () => void): void;
        interface TokenClient {
          requestAccessToken(options?: { prompt?: string }): void;
        }
      }
    }
  }
}
