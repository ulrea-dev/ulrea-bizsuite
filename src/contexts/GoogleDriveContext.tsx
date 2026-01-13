// Google Drive integration context for backup, sync, and sharing features
import React, { createContext, useContext, useState, useCallback, useEffect, useRef } from 'react';
import { googleDriveService } from '@/services/googleDriveService';
import { googleSheetsService } from '@/services/googleSheetsService';
import { GoogleDriveBackup, GoogleDriveSettings, DEFAULT_GOOGLE_DRIVE_SETTINGS, ConnectedSheet, SpreadsheetInfo, SharedUser, PartnerSheet } from '@/types/googleDrive';
import { AppData, Partner } from '@/types/business';
import { useToast } from '@/hooks/use-toast';

const STORAGE_KEY = 'bizsuite-google-drive-settings';
const DEBOUNCE_DELAY = 5000;
const SHEET_SYNC_DELAY = 3000;

const GOOGLE_CLIENT_ID = "63460396574-lmeqr2hf2ucbj11vbmkr0m2va98ngt1a.apps.googleusercontent.com";

interface GoogleDriveContextValue {
  isConnected: boolean;
  isLoading: boolean;
  isSyncing: boolean;
  isExporting: boolean;
  isSyncingSheet: boolean;
  isSharing: boolean;
  isConfigured: boolean;
  isSyncingPartnerSheet: string | null;
  settings: GoogleDriveSettings;
  backups: GoogleDriveBackup[];
  connect: () => void;
  disconnect: () => void;
  syncNow: (data: AppData) => Promise<void>;
  loadBackups: () => Promise<void>;
  restoreBackup: (fileId: string) => Promise<AppData>;
  setAutoSync: (enabled: boolean) => void;
  scheduleSync: (data: AppData) => void;
  exportToSheets: (data: AppData) => Promise<string>;
  connectToSheet: (sheet: SpreadsheetInfo) => Promise<void>;
  disconnectSheet: () => void;
  syncToConnectedSheet: (data: AppData) => Promise<void>;
  createAndConnectSheet: (data: AppData) => Promise<void>;
  setSheetAutoSync: (enabled: boolean) => void;
  // Sharing functions
  shareWithUser: (email: string, role: 'reader' | 'writer' | 'commenter', resources: ('folder' | 'sheet')[], sendNotification?: boolean) => Promise<{ success: boolean; errors: string[] }>;
  getSharedUsers: () => Promise<SharedUser[]>;
  removeSharedUser: (email: string) => Promise<void>;
  updateUserPermission: (email: string, newRole: 'reader' | 'writer' | 'commenter') => Promise<{ success: boolean; errors: string[] }>;
  // Partner sheet functions
  createPartnerSheet: (partnerId: string, businessIds: string[], data: AppData) => Promise<void>;
  syncPartnerSheet: (partnerId: string, data: AppData) => Promise<void>;
  disconnectPartnerSheet: (partnerId: string) => void;
  setPartnerSheetAutoSync: (partnerId: string, enabled: boolean) => void;
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
  const [isExporting, setIsExporting] = useState(false);
  const [isSyncingSheet, setIsSyncingSheet] = useState(false);
  const [isSharing, setIsSharing] = useState(false);
  const [isSyncingPartnerSheet, setIsSyncingPartnerSheet] = useState<string | null>(null);
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
  const sheetSyncTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const partnerSheetSyncTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const tokenClientRef = useRef<google.accounts.oauth2.TokenClient | null>(null);

  const isConnected = !!settings.accessToken;

  useEffect(() => {
    if (settings.accessToken) {
      googleDriveService.setAccessToken(settings.accessToken);
      googleSheetsService.setAccessToken(settings.accessToken);
    }
  }, [settings.accessToken]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
  }, [settings]);

  useEffect(() => {
    const script = document.createElement('script');
    script.src = 'https://accounts.google.com/gsi/client';
    script.async = true;
    script.defer = true;
    script.onload = () => {
      tokenClientRef.current = google.accounts.oauth2.initTokenClient({
        client_id: GOOGLE_CLIENT_ID,
        scope: 'https://www.googleapis.com/auth/drive https://www.googleapis.com/auth/userinfo.email https://www.googleapis.com/auth/spreadsheets',
        callback: async (tokenResponse) => {
          if (tokenResponse.error) {
            toast({ title: 'Connection Failed', description: 'Could not connect to Google Drive.', variant: 'destructive' });
            setIsLoading(false);
            return;
          }
          try {
            const userInfoResponse = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
              headers: { Authorization: `Bearer ${tokenResponse.access_token}` },
            });
            const userInfo = await userInfoResponse.json();
            googleDriveService.setAccessToken(tokenResponse.access_token);
            googleSheetsService.setAccessToken(tokenResponse.access_token);
            updateSettings({ accessToken: tokenResponse.access_token, connectedEmail: userInfo.email });
            toast({ title: 'Connected to Google Drive', description: `Signed in as ${userInfo.email}` });
          } catch {
            toast({ title: 'Connection Failed', description: 'Could not connect to Google Drive.', variant: 'destructive' });
          } finally {
            setIsLoading(false);
          }
        },
      });
    };
    document.body.appendChild(script);
    return () => { document.body.removeChild(script); };
  }, [toast]);

  const updateSettings = useCallback((updates: Partial<GoogleDriveSettings>) => {
    setSettings(prev => ({ ...prev, ...updates }));
  }, []);

  const connect = useCallback(() => {
    if (tokenClientRef.current) {
      setIsLoading(true);
      tokenClientRef.current.requestAccessToken({ prompt: 'consent' });
    }
  }, []);

  const disconnect = useCallback(() => {
    if (settings.accessToken) {
      google.accounts.oauth2.revoke(settings.accessToken, () => {});
    }
    googleDriveService.setAccessToken(null);
    updateSettings({ accessToken: null, connectedEmail: null, lastSyncTime: null, connectedSheet: null, partnerSheets: [] });
    setBackups([]);
    toast({ title: 'Disconnected', description: 'Google Drive has been disconnected.' });
  }, [settings.accessToken, updateSettings, toast]);

  const syncNow = useCallback(async (data: AppData) => {
    if (!isConnected) return;
    setIsSyncing(true);
    try {
      await googleDriveService.uploadBackup(data);
      updateSettings({ lastSyncTime: new Date().toISOString() });
      await googleDriveService.deleteOldBackups(10);
      toast({ title: 'Backup Complete', description: 'Your data has been backed up.' });
    } catch (error) {
      toast({ title: 'Backup Failed', description: error instanceof Error ? error.message : 'Could not backup.', variant: 'destructive' });
    } finally {
      setIsSyncing(false);
    }
  }, [isConnected, updateSettings, toast]);

  const scheduleSync = useCallback((data: AppData) => {
    if (!isConnected || !settings.autoSyncEnabled) return;
    if (syncTimeoutRef.current) clearTimeout(syncTimeoutRef.current);
    syncTimeoutRef.current = setTimeout(() => syncNow(data), DEBOUNCE_DELAY);
  }, [isConnected, settings.autoSyncEnabled, syncNow]);

  const loadBackups = useCallback(async () => {
    if (!isConnected) return;
    setIsLoading(true);
    try {
      const list = await googleDriveService.listBackups();
      setBackups(list);
    } catch (error) {
      toast({ title: 'Failed to Load Backups', description: error instanceof Error ? error.message : 'Could not load backups.', variant: 'destructive' });
    } finally {
      setIsLoading(false);
    }
  }, [isConnected, toast]);

  const restoreBackup = useCallback(async (fileId: string): Promise<AppData> => {
    setIsLoading(true);
    try {
      const data = await googleDriveService.downloadBackup(fileId);
      toast({ title: 'Backup Restored', description: 'Your data has been restored.' });
      return data;
    } catch (error) {
      toast({ title: 'Restore Failed', description: error instanceof Error ? error.message : 'Could not restore.', variant: 'destructive' });
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, [toast]);

  const setAutoSync = useCallback((enabled: boolean) => {
    updateSettings({ autoSyncEnabled: enabled });
    toast({ title: enabled ? 'Auto-sync Enabled' : 'Auto-sync Disabled', description: enabled ? 'Changes will be backed up automatically.' : 'You can still backup manually.' });
  }, [updateSettings, toast]);

  const exportToSheets = useCallback(async (data: AppData): Promise<string> => {
    if (!isConnected) throw new Error('Not connected');
    setIsExporting(true);
    try {
      const { spreadsheetId, spreadsheetUrl } = await googleSheetsService.exportAppData(data);
      await googleDriveService.moveSpreadsheetToFolder(spreadsheetId);
      toast({ title: 'Export Complete', description: 'Data exported to Google Sheets.' });
      return spreadsheetUrl;
    } catch (error) {
      toast({ title: 'Export Failed', description: error instanceof Error ? error.message : 'Could not export.', variant: 'destructive' });
      throw error;
    } finally {
      setIsExporting(false);
    }
  }, [isConnected, toast]);

  const connectToSheet = useCallback(async (sheet: SpreadsheetInfo) => {
    const connectedSheet: ConnectedSheet = { spreadsheetId: sheet.id, spreadsheetUrl: sheet.webViewLink, name: sheet.name, connectedAt: new Date().toISOString(), lastSyncedAt: null };
    updateSettings({ connectedSheet });
    toast({ title: 'Sheet Connected', description: `Connected to "${sheet.name}".` });
  }, [updateSettings, toast]);

  const disconnectSheet = useCallback(() => {
    updateSettings({ connectedSheet: null, sheetAutoSyncEnabled: false });
    toast({ title: 'Sheet Disconnected', description: 'The spreadsheet has been disconnected.' });
  }, [updateSettings, toast]);

  const syncToConnectedSheet = useCallback(async (data: AppData) => {
    if (!isConnected || !settings.connectedSheet) return;
    setIsSyncingSheet(true);
    try {
      await googleSheetsService.updateSpreadsheet(settings.connectedSheet.spreadsheetId, data);
      updateSettings({ connectedSheet: { ...settings.connectedSheet, lastSyncedAt: new Date().toISOString() } });
      toast({ title: 'Sheet Updated', description: 'Your spreadsheet has been updated.' });
    } catch (error) {
      toast({ title: 'Sync Failed', description: error instanceof Error ? error.message : 'Could not update sheet.', variant: 'destructive' });
    } finally {
      setIsSyncingSheet(false);
    }
  }, [isConnected, settings.connectedSheet, updateSettings, toast]);

  const createAndConnectSheet = useCallback(async (data: AppData) => {
    if (!isConnected) return;
    setIsExporting(true);
    try {
      const { spreadsheetId, spreadsheetUrl } = await googleSheetsService.exportAppData(data);
      await googleDriveService.moveSpreadsheetToFolder(spreadsheetId);
      const sheetInfo = await googleDriveService.getSpreadsheetInfo(spreadsheetId);
      const connectedSheet: ConnectedSheet = { spreadsheetId, spreadsheetUrl, name: sheetInfo.name, connectedAt: new Date().toISOString(), lastSyncedAt: new Date().toISOString() };
      updateSettings({ connectedSheet, sheetAutoSyncEnabled: true });
      toast({ title: 'Sheet Created & Connected', description: 'A new spreadsheet has been created and connected.' });
    } catch (error) {
      toast({ title: 'Failed to Create Sheet', description: error instanceof Error ? error.message : 'Could not create sheet.', variant: 'destructive' });
    } finally {
      setIsExporting(false);
    }
  }, [isConnected, updateSettings, toast]);

  const setSheetAutoSync = useCallback((enabled: boolean) => {
    updateSettings({ sheetAutoSyncEnabled: enabled });
    toast({ title: enabled ? 'Auto-sync Enabled' : 'Auto-sync Disabled', description: enabled ? 'Changes will sync to the sheet.' : 'You can still sync manually.' });
  }, [updateSettings, toast]);

  const scheduleSheetSync = useCallback((data: AppData) => {
    if (!isConnected || !settings.sheetAutoSyncEnabled || !settings.connectedSheet) return;
    if (sheetSyncTimeoutRef.current) clearTimeout(sheetSyncTimeoutRef.current);
    sheetSyncTimeoutRef.current = setTimeout(() => syncToConnectedSheet(data), SHEET_SYNC_DELAY);
  }, [isConnected, settings.sheetAutoSyncEnabled, settings.connectedSheet, syncToConnectedSheet]);

  // Partner sheet functions
  const createPartnerSheet = useCallback(async (partnerId: string, businessIds: string[], data: AppData) => {
    if (!isConnected) return;
    setIsSyncingPartnerSheet(partnerId);
    try {
      const partner = data.partners?.find(p => p.id === partnerId);
      if (!partner) throw new Error('Partner not found');

      const { spreadsheetId, spreadsheetUrl } = await googleSheetsService.exportPartnerData(
        partner,
        businessIds,
        data
      );
      await googleDriveService.moveSpreadsheetToFolder(spreadsheetId);

      const newPartnerSheet: PartnerSheet = {
        partnerId,
        partnerName: partner.name,
        spreadsheetId,
        spreadsheetUrl,
        createdAt: new Date().toISOString(),
        lastSyncedAt: new Date().toISOString(),
        businessIds,
        autoSyncEnabled: true,
      };

      updateSettings({
        partnerSheets: [...(settings.partnerSheets || []), newPartnerSheet],
      });

      toast({
        title: 'Partner Sheet Created',
        description: `Report sheet created for ${partner.name}.`,
      });
    } catch (error) {
      toast({
        title: 'Failed to Create Sheet',
        description: error instanceof Error ? error.message : 'Could not create partner sheet.',
        variant: 'destructive',
      });
    } finally {
      setIsSyncingPartnerSheet(null);
    }
  }, [isConnected, settings.partnerSheets, updateSettings, toast]);

  const syncPartnerSheet = useCallback(async (partnerId: string, data: AppData) => {
    if (!isConnected) return;
    const partnerSheet = settings.partnerSheets?.find(ps => ps.partnerId === partnerId);
    if (!partnerSheet) return;

    setIsSyncingPartnerSheet(partnerId);
    try {
      const partner = data.partners?.find(p => p.id === partnerId);
      if (!partner) throw new Error('Partner not found');

      await googleSheetsService.updatePartnerSpreadsheet(
        partnerSheet.spreadsheetId,
        partner,
        partnerSheet.businessIds,
        data
      );

      const updatedSheets = (settings.partnerSheets || []).map(ps =>
        ps.partnerId === partnerId
          ? { ...ps, lastSyncedAt: new Date().toISOString() }
          : ps
      );
      updateSettings({ partnerSheets: updatedSheets });

      toast({
        title: 'Partner Sheet Updated',
        description: `Report for ${partner.name} has been synced.`,
      });
    } catch (error) {
      toast({
        title: 'Sync Failed',
        description: error instanceof Error ? error.message : 'Could not sync partner sheet.',
        variant: 'destructive',
      });
    } finally {
      setIsSyncingPartnerSheet(null);
    }
  }, [isConnected, settings.partnerSheets, updateSettings, toast]);

  const disconnectPartnerSheet = useCallback((partnerId: string) => {
    const updatedSheets = (settings.partnerSheets || []).filter(ps => ps.partnerId !== partnerId);
    updateSettings({ partnerSheets: updatedSheets });
    toast({
      title: 'Partner Sheet Removed',
      description: 'The partner report sheet has been disconnected.',
    });
  }, [settings.partnerSheets, updateSettings, toast]);

  const setPartnerSheetAutoSync = useCallback((partnerId: string, enabled: boolean) => {
    const updatedSheets = (settings.partnerSheets || []).map(ps =>
      ps.partnerId === partnerId ? { ...ps, autoSyncEnabled: enabled } : ps
    );
    updateSettings({ partnerSheets: updatedSheets });
  }, [settings.partnerSheets, updateSettings]);

  const schedulePartnerSheetSync = useCallback((data: AppData) => {
    if (!isConnected) return;
    const sheetsToSync = (settings.partnerSheets || []).filter(ps => ps.autoSyncEnabled);
    if (sheetsToSync.length === 0) return;

    if (partnerSheetSyncTimeoutRef.current) clearTimeout(partnerSheetSyncTimeoutRef.current);
    partnerSheetSyncTimeoutRef.current = setTimeout(async () => {
      for (const partnerSheet of sheetsToSync) {
        try {
          const partner = data.partners?.find(p => p.id === partnerSheet.partnerId);
          if (partner) {
            await googleSheetsService.updatePartnerSpreadsheet(
              partnerSheet.spreadsheetId,
              partner,
              partnerSheet.businessIds,
              data
            );
            const updatedSheets = (settings.partnerSheets || []).map(ps =>
              ps.partnerId === partnerSheet.partnerId
                ? { ...ps, lastSyncedAt: new Date().toISOString() }
                : ps
            );
            updateSettings({ partnerSheets: updatedSheets });
          }
        } catch (error) {
          console.error(`Failed to sync partner sheet for ${partnerSheet.partnerName}:`, error);
        }
      }
    }, SHEET_SYNC_DELAY);
  }, [isConnected, settings.partnerSheets, updateSettings]);

  // Sharing functions
  const shareWithUser = useCallback(async (
    email: string,
    role: 'reader' | 'writer' | 'commenter',
    resources: ('folder' | 'sheet')[],
    sendNotification: boolean = true
  ): Promise<{ success: boolean; errors: string[] }> => {
    if (!isConnected) return { success: false, errors: ['Not connected to Google Drive'] };
    
    setIsSharing(true);
    const errors: string[] = [];
    
    try {
      // Share backup folder if requested
      if (resources.includes('folder')) {
        const folderId = await googleDriveService.getBackupFolderId();
        const result = await googleDriveService.shareWithUser(folderId, email, role, sendNotification);
        if (!result.success && result.error) {
          errors.push(`Folder: ${result.error}`);
        }
      }
      
      // Share connected sheet if requested and available
      if (resources.includes('sheet') && settings.connectedSheet) {
        const result = await googleDriveService.shareWithUser(
          settings.connectedSheet.spreadsheetId,
          email,
          role,
          sendNotification
        );
        if (!result.success && result.error) {
          errors.push(`Sheet: ${result.error}`);
        }
      }
      
      return { success: errors.length === 0, errors };
    } catch (error) {
      return { 
        success: false, 
        errors: [error instanceof Error ? error.message : 'Failed to share'] 
      };
    } finally {
      setIsSharing(false);
    }
  }, [isConnected, settings.connectedSheet]);

  const getSharedUsers = useCallback(async (): Promise<SharedUser[]> => {
    if (!isConnected) return [];
    
    try {
      const folderId = await googleDriveService.getBackupFolderId();
      const permissions = await googleDriveService.listPermissions(folderId);
      
      return permissions
        .filter(p => p.email) // Filter out "anyone" permissions
        .map(p => ({
          id: p.id,
          email: p.email,
          displayName: p.displayName,
          role: p.role as SharedUser['role'],
          photoUrl: p.photoUrl,
        }));
    } catch (error) {
      console.error('Failed to get shared users:', error);
      return [];
    }
  }, [isConnected]);

  const removeSharedUser = useCallback(async (email: string): Promise<void> => {
    if (!isConnected) throw new Error('Not connected to Google Drive');
    
    setIsSharing(true);
    try {
      // Get folder permissions and remove matching email
      const folderId = await googleDriveService.getBackupFolderId();
      const folderPermissions = await googleDriveService.listPermissions(folderId);
      const folderPerm = folderPermissions.find(p => p.email === email);
      if (folderPerm && folderPerm.role !== 'owner') {
        await googleDriveService.removePermission(folderId, folderPerm.id);
      }
      
      // Also remove from connected sheet if exists
      if (settings.connectedSheet) {
        const sheetPermissions = await googleDriveService.listPermissions(settings.connectedSheet.spreadsheetId);
        const sheetPerm = sheetPermissions.find(p => p.email === email);
        if (sheetPerm && sheetPerm.role !== 'owner') {
          await googleDriveService.removePermission(settings.connectedSheet.spreadsheetId, sheetPerm.id);
        }
      }
    } finally {
      setIsSharing(false);
    }
  }, [isConnected, settings.connectedSheet]);

  const updateUserPermission = useCallback(async (
    email: string,
    newRole: 'reader' | 'writer' | 'commenter'
  ): Promise<{ success: boolean; errors: string[] }> => {
    if (!isConnected) return { success: false, errors: ['Not connected to Google Drive'] };
    
    setIsSharing(true);
    const errors: string[] = [];
    
    try {
      // Update folder permission
      const folderId = await googleDriveService.getBackupFolderId();
      const folderPermissions = await googleDriveService.listPermissions(folderId);
      const folderPerm = folderPermissions.find(p => p.email === email);
      if (folderPerm && folderPerm.role !== 'owner') {
        const result = await googleDriveService.updatePermission(folderId, folderPerm.id, newRole);
        if (!result.success && result.error) {
          errors.push(`Folder: ${result.error}`);
        }
      }
      
      // Also update connected sheet if exists
      if (settings.connectedSheet) {
        const sheetPermissions = await googleDriveService.listPermissions(settings.connectedSheet.spreadsheetId);
        const sheetPerm = sheetPermissions.find(p => p.email === email);
        if (sheetPerm && sheetPerm.role !== 'owner') {
          const result = await googleDriveService.updatePermission(
            settings.connectedSheet.spreadsheetId,
            sheetPerm.id,
            newRole
          );
          if (!result.success && result.error) {
            errors.push(`Sheet: ${result.error}`);
          }
        }
      }
      
      return { success: errors.length === 0, errors };
    } catch (error) {
      return { 
        success: false, 
        errors: [error instanceof Error ? error.message : 'Failed to update permission'] 
      };
    } finally {
      setIsSharing(false);
    }
  }, [isConnected, settings.connectedSheet]);

  useEffect(() => {
    const handleDataChange = (event: CustomEvent<AppData>) => {
      scheduleSync(event.detail);
      scheduleSheetSync(event.detail);
      schedulePartnerSheetSync(event.detail);
    };
    window.addEventListener('bizsuite-data-change', handleDataChange as EventListener);
    return () => {
      window.removeEventListener('bizsuite-data-change', handleDataChange as EventListener);
      if (syncTimeoutRef.current) clearTimeout(syncTimeoutRef.current);
      if (sheetSyncTimeoutRef.current) clearTimeout(sheetSyncTimeoutRef.current);
      if (partnerSheetSyncTimeoutRef.current) clearTimeout(partnerSheetSyncTimeoutRef.current);
    };
  }, [scheduleSync, scheduleSheetSync, schedulePartnerSheetSync]);

  const value: GoogleDriveContextValue = {
    isConnected, isLoading, isSyncing, isExporting, isSyncingSheet, isSharing, isConfigured: true,
    isSyncingPartnerSheet, settings, backups,
    connect, disconnect, syncNow, loadBackups, restoreBackup, setAutoSync, scheduleSync, exportToSheets,
    connectToSheet, disconnectSheet, syncToConnectedSheet, createAndConnectSheet, setSheetAutoSync,
    shareWithUser, getSharedUsers, removeSharedUser, updateUserPermission,
    createPartnerSheet, syncPartnerSheet, disconnectPartnerSheet, setPartnerSheetAutoSync,
  };

  return <GoogleDriveContext.Provider value={value}>{children}</GoogleDriveContext.Provider>;
};

declare global {
  interface Window { google?: typeof google; }
  namespace google {
    namespace accounts {
      namespace oauth2 {
        function initTokenClient(config: { client_id: string; scope: string; callback: (response: { access_token?: string; error?: string }) => void; }): TokenClient;
        function revoke(token: string, callback: () => void): void;
        interface TokenClient { requestAccessToken(options?: { prompt?: string }): void; }
      }
    }
  }
}
