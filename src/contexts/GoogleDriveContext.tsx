// Google Drive integration context for backup, sync, and sharing features
import React, { createContext, useContext, useState, useCallback, useEffect, useRef } from 'react';
import { googleDriveService } from '@/services/googleDriveService';
import { googleSheetsService } from '@/services/googleSheetsService';
import { GoogleDriveBackup, GoogleDriveSettings, DEFAULT_GOOGLE_DRIVE_SETTINGS, ConnectedSheet, SpreadsheetInfo, SharedUser, PartnerSheet, TokenExpiredError, RemoteChange, BizSuiteAccount } from '@/types/googleDrive';
import { AppData, Partner } from '@/types/business';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

const STORAGE_KEY = 'bizsuite-google-drive-settings';
const DEBOUNCE_DELAY = 5000;
const SHEET_SYNC_DELAY = 3000;
const CHANGE_POLL_INTERVAL = 15000; // Poll every 15 seconds

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
  // Reconnect modal state
  showReconnectModal: boolean;
  isReconnecting: boolean;
  reconnectSuccess: boolean;
  closeReconnectModal: () => void;
  // Remote change detection
  remoteChange: RemoteChange | null;
  isRefreshingFromRemote: boolean;
  // Account/Workspace management
  currentAccount: BizSuiteAccount | null;
  availableAccounts: BizSuiteAccount[];
  legacyFolders: Array<{ id: string; name: string; ownedByMe: boolean }>;
  showAccountSelection: boolean;
  isDiscoveringAccounts: boolean;
  // Core methods
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
  // Reconnect functions
  handleReconnect: () => void;
  // Remote change functions
  refreshFromRemote: () => Promise<AppData | null>;
  clearRemoteChange: () => void;
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
  // Account/Workspace functions
  discoverAccounts: () => Promise<void>;
  selectAccount: (account: BizSuiteAccount) => void;
  createAccount: (name: string) => Promise<BizSuiteAccount>;
  migrateAccount: (folderId: string, name: string) => Promise<BizSuiteAccount>;
  closeAccountSelection: () => void;
  switchAccount: () => void;
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
  
  // Reconnect modal state
  const [showReconnectModal, setShowReconnectModal] = useState(false);
  const [isReconnecting, setIsReconnecting] = useState(false);
  const [reconnectSuccess, setReconnectSuccess] = useState(false);
  const [pendingOperation, setPendingOperation] = useState<{ type: string; data?: AppData } | null>(null);
  
  // Remote change detection state
  const [remoteChange, setRemoteChange] = useState<RemoteChange | null>(null);
  const [isRefreshingFromRemote, setIsRefreshingFromRemote] = useState(false);
  
  // Account/Workspace state
  const [currentAccount, setCurrentAccount] = useState<BizSuiteAccount | null>(null);
  const [availableAccounts, setAvailableAccounts] = useState<BizSuiteAccount[]>([]);
  const [legacyFolders, setLegacyFolders] = useState<Array<{ id: string; name: string; ownedByMe: boolean }>>([]);
  const [showAccountSelection, setShowAccountSelection] = useState(false);
  const [isDiscoveringAccounts, setIsDiscoveringAccounts] = useState(false);
  
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

  const syncTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const sheetSyncTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const partnerSheetSyncTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const changePollTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const tokenClientRef = useRef<google.accounts.oauth2.TokenClient | null>(null);
  const isPollingRef = useRef(false);
  const lastUserSyncTimeRef = useRef<string | null>(null);
  const isReconnectingRef = useRef(false);
  const pendingAccountSelectCallback = useRef<(() => void) | null>(null);

  const isConnected = !!settings.accessToken;

  // Passive workspace registration — fire-and-forget, no UI side effects
  const registerWorkspacePassively = useCallback((account: BizSuiteAccount, ownerEmail?: string | null) => {
    void supabase.from('workspace_registry').upsert({
      folder_id: account.folderId,
      workspace_name: account.name,
      owner_email: ownerEmail || null,
      last_sync_at: new Date().toISOString(),
    }, { onConflict: 'folder_id' });
  }, []);

  useEffect(() => {
    if (settings.accessToken) {
      googleDriveService.setAccessToken(settings.accessToken);
      googleSheetsService.setAccessToken(settings.accessToken);
    }
  }, [settings.accessToken]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
  }, [settings]);

  // Restore current account from settings on mount
  useEffect(() => {
    if (settings.currentAccountId && settings.backupFolderId && !currentAccount) {
      setCurrentAccount({
        id: settings.currentAccountId,
        name: settings.currentAccountName || 'Workspace',
        folderId: settings.backupFolderId,
        ownedByMe: true, // Assume owned, will be corrected on next discovery
      });
      googleDriveService.setCurrentAccountFolder(settings.backupFolderId);
    }
  }, [settings.currentAccountId, settings.backupFolderId, currentAccount]);

  const updateSettings = useCallback((updates: Partial<GoogleDriveSettings>) => {
    setSettings(prev => ({ ...prev, ...updates }));
  }, []);

  // Handle token expiry errors
  const handleTokenExpiry = useCallback((operation: { type: string; data?: AppData }, silent = false) => {
    setPendingOperation(operation);
    // Only show the reconnect modal for user-initiated Drive actions (exports, backups, etc.)
    // Background operations (polling, auto-checks) should fail silently
    if (!silent) {
      setShowReconnectModal(true);
    }
  }, []);

  // Initialize Google OAuth client
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
            toast({ title: 'Connection Failed', description: 'Could not connect to Google Drive.', variant: 'destructive' });
            setIsLoading(false);
            setIsReconnecting(false);
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
            
            // If reconnecting, show success and close modal (use ref to avoid stale closure)
            if (isReconnectingRef.current) {
              setPendingOperation(null);
              setReconnectSuccess(true);
            } else {
              // Execute callback if pending (e.g., from Auth flow)
              if (pendingAccountSelectCallback.current) {
                pendingAccountSelectCallback.current();
                pendingAccountSelectCallback.current = null;
              }
              toast({ title: 'Connected to Google Drive', description: `Signed in as ${userInfo.email}` });
            }
          } catch {
            toast({ title: 'Connection Failed', description: 'Could not connect to Google Drive.', variant: 'destructive' });
          } finally {
            setIsLoading(false);
            isReconnectingRef.current = false;
            setIsReconnecting(false);
          }
        },
      });
    };
    document.body.appendChild(script);
    return () => { document.body.removeChild(script); };
  }, [toast, updateSettings]);

  const connect = useCallback(() => {
    if (tokenClientRef.current) {
      setIsLoading(true);
      tokenClientRef.current.requestAccessToken({ prompt: 'consent' });
    }
  }, []);

  // Connect with a callback for account discovery
  const connectWithCallback = useCallback((callback: () => void) => {
    pendingAccountSelectCallback.current = callback;
    connect();
  }, [connect]);

  const handleReconnect = useCallback(() => {
    if (tokenClientRef.current) {
      isReconnectingRef.current = true;
      setIsReconnecting(true);
      tokenClientRef.current.requestAccessToken({ prompt: 'consent' });
    }
  }, []);

  const disconnect = useCallback(() => {
    if (settings.accessToken) {
      google.accounts.oauth2.revoke(settings.accessToken, () => {});
    }
    googleDriveService.setAccessToken(null);
    googleDriveService.setCurrentAccountFolder(null);
    setCurrentAccount(null);
    setAvailableAccounts([]);
    setLegacyFolders([]);
    updateSettings({ 
      accessToken: null, 
      connectedEmail: null, 
      lastSyncTime: null, 
      connectedSheet: null, 
      partnerSheets: [], 
      lastKnownBackupId: null, 
      lastKnownBackupTime: null,
      currentAccountId: null,
      currentAccountName: null,
      backupFolderId: null,
    });
    setBackups([]);
    setRemoteChange(null);
    toast({ title: 'Disconnected', description: 'Google Drive has been disconnected.' });
  }, [settings.accessToken, updateSettings, toast]);

  // Account discovery — under drive.file scope we cannot search Drive by name.
  // Instead we rely on the locally stored account data (backupFolderId, currentAccountId).
  // If a stored account exists, verify it is still accessible; otherwise show creation flow.
  const discoverAccounts = useCallback(async () => {
    if (!isConnected) return;

    setIsDiscoveringAccounts(true);
    try {
      const storedFolderId = settings.backupFolderId;
      const storedAccountId = settings.currentAccountId;
      const storedAccountName = settings.currentAccountName;

      if (storedFolderId && storedAccountId) {
        // Verify the stored folder is still accessible
        const { accessible, canWrite } = await googleDriveService.verifyAccountFolder(storedFolderId);
        if (accessible) {
          const account: BizSuiteAccount = {
            id: storedAccountId,
            name: storedAccountName || 'Workspace',
            folderId: storedFolderId,
            ownedByMe: canWrite,
          };
          setAvailableAccounts([account]);
          setLegacyFolders([]);
          // Auto-select the known account
          selectAccount(account);
          return;
        }
        // Stored folder is gone — fall through to creation flow
      }

      // No stored account — prompt user to create one
      setAvailableAccounts([]);
      setLegacyFolders([]);
      setShowAccountSelection(true);
    } catch (error) {
      if (error instanceof TokenExpiredError) {
        handleTokenExpiry({ type: 'discoverAccounts' });
      } else {
        console.error('Failed to discover accounts:', error);
        setShowAccountSelection(true);
      }
    } finally {
      setIsDiscoveringAccounts(false);
    }
  }, [isConnected, settings.backupFolderId, settings.currentAccountId, settings.currentAccountName, handleTokenExpiry]);

  const selectAccount = useCallback((account: BizSuiteAccount) => {
    setCurrentAccount(account);
    googleDriveService.setCurrentAccountFolder(account.folderId);
    updateSettings({
      currentAccountId: account.id,
      currentAccountName: account.name,
      backupFolderId: account.folderId,
    });
    setShowAccountSelection(false);
    toast({ 
      title: 'Workspace Selected', 
      description: `Using "${account.name}" workspace.` 
    });
    // Passive background registration for super admin tracking
    registerWorkspacePassively(account);
  }, [updateSettings, toast, registerWorkspacePassively]);

  const createAccount = useCallback(async (name: string): Promise<BizSuiteAccount> => {
    const account = await googleDriveService.createAccountFolder(name);
    selectAccount(account);
    return account;
  }, [selectAccount]);

  // Legacy migration is no longer supported under drive.file scope (no Drive search).
  // This stub keeps the interface intact while gracefully handling any residual calls.
  const migrateAccount = useCallback(async (_folderId: string, name: string): Promise<BizSuiteAccount> => {
    // Under drive.file scope we can't patch arbitrary folders — create a fresh one instead.
    return createAccount(name);
  }, [createAccount]);

  const closeAccountSelection = useCallback(() => {
    setShowAccountSelection(false);
  }, []);

  const switchAccount = useCallback(() => {
    discoverAccounts();
  }, [discoverAccounts]);

  // NOTE: We intentionally do NOT auto-trigger account discovery here.
  // Discovery is initiated explicitly by the Auth component after the user
  // clicks "Continue with Google".  An auto-trigger would re-open the
  // workspace modal every time the user dismisses it, making it unclosable.

  const syncNow = useCallback(async (data: AppData, silent = false) => {
    if (!isConnected) return;
    
    // If no account selected, trigger discovery
    if (!currentAccount) {
      toast({
        title: 'Workspace Required',
        description: 'Please select or create a workspace first.',
      });
      discoverAccounts();
      return;
    }
    
    setIsSyncing(true);
    try {
      const backup = await googleDriveService.uploadBackup(data);
      const syncTime = new Date().toISOString();
      lastUserSyncTimeRef.current = syncTime;
      updateSettings({ 
        lastSyncTime: syncTime,
        lastKnownBackupId: backup.id,
        lastKnownBackupTime: backup.createdTime,
      });
      
      // Try to clean up old backups, but don't fail the entire sync if this fails
      // (e.g., secondary users may not have permission to delete files created by others)
      try {
        await googleDriveService.deleteOldBackups(10);
      } catch (cleanupError) {
        // Silently ignore cleanup errors - the backup itself succeeded
        console.log('Could not clean up old backups:', cleanupError);
      }
      
      toast({ title: 'Backup Complete', description: 'Your data has been backed up.' });
    } catch (error) {
      if (error instanceof TokenExpiredError) {
        handleTokenExpiry({ type: 'sync', data }, silent); // silent for auto-sync
      } else {
        toast({ title: 'Backup Failed', description: error instanceof Error ? error.message : 'Could not backup.', variant: 'destructive' });
      }
    } finally {
      setIsSyncing(false);
    }
  }, [isConnected, currentAccount, discoverAccounts, updateSettings, toast, handleTokenExpiry]);

  const scheduleSync = useCallback((data: AppData) => {
    if (!isConnected || !settings.autoSyncEnabled || !currentAccount) return;
    if (syncTimeoutRef.current) clearTimeout(syncTimeoutRef.current);
    syncTimeoutRef.current = setTimeout(() => syncNow(data, true), DEBOUNCE_DELAY); // silent auto-sync
  }, [isConnected, settings.autoSyncEnabled, currentAccount, syncNow]);

  const loadBackups = useCallback(async () => {
    if (!isConnected) return;
    setIsLoading(true);
    try {
      const list = await googleDriveService.listBackups();
      setBackups(list);
    } catch (error) {
      if (error instanceof TokenExpiredError) {
      if (error instanceof TokenExpiredError) {
        handleTokenExpiry({ type: 'loadBackups' }, true); // silent — background load
      }
      } else {
        toast({ title: 'Failed to Load Backups', description: error instanceof Error ? error.message : 'Could not load backups.', variant: 'destructive' });
      }
    } finally {
      setIsLoading(false);
    }
  }, [isConnected, toast, handleTokenExpiry]);

  const restoreBackup = useCallback(async (fileId: string): Promise<AppData> => {
    setIsLoading(true);
    try {
      const data = await googleDriveService.downloadBackup(fileId);
      toast({ title: 'Backup Restored', description: 'Your data has been restored.' });
      return data;
    } catch (error) {
      if (error instanceof TokenExpiredError) {
        handleTokenExpiry({ type: 'restoreBackup' });
      }
      toast({ title: 'Restore Failed', description: error instanceof Error ? error.message : 'Could not restore.', variant: 'destructive' });
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, [toast, handleTokenExpiry]);

  const setAutoSync = useCallback((enabled: boolean) => {
    updateSettings({ autoSyncEnabled: enabled });
    toast({ title: enabled ? 'Auto-sync Enabled' : 'Auto-sync Disabled', description: enabled ? 'Changes will be backed up automatically.' : 'You can still backup manually.' });
  }, [updateSettings, toast]);

  const exportToSheets = useCallback(async (data: AppData): Promise<string> => {
    if (!isConnected) throw new Error('Not connected');
    setIsExporting(true);
    try {
      const { spreadsheetId, spreadsheetUrl } = await googleSheetsService.exportAppData(data);
      const usedSheetsFolderId = await googleDriveService.moveSpreadsheetToFolder(spreadsheetId, settings.sheetsFolderId);
      if (usedSheetsFolderId && usedSheetsFolderId !== settings.sheetsFolderId) {
        updateSettings({ sheetsFolderId: usedSheetsFolderId });
      }
      toast({ title: 'Export Complete', description: 'Data exported to Google Sheets.' });
      return spreadsheetUrl;
    } catch (error) {
      if (error instanceof TokenExpiredError) {
        handleTokenExpiry({ type: 'exportToSheets', data });
      }
      toast({ title: 'Export Failed', description: error instanceof Error ? error.message : 'Could not export.', variant: 'destructive' });
      throw error;
    } finally {
      setIsExporting(false);
    }
  }, [isConnected, toast, handleTokenExpiry]);

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
      if (error instanceof TokenExpiredError) {
        handleTokenExpiry({ type: 'syncToConnectedSheet', data });
      } else {
        toast({ title: 'Sync Failed', description: error instanceof Error ? error.message : 'Could not update sheet.', variant: 'destructive' });
      }
    } finally {
      setIsSyncingSheet(false);
    }
  }, [isConnected, settings.connectedSheet, updateSettings, toast, handleTokenExpiry]);

  const createAndConnectSheet = useCallback(async (data: AppData) => {
    if (!isConnected) return;
    setIsExporting(true);
    try {
      const { spreadsheetId, spreadsheetUrl } = await googleSheetsService.exportAppData(data);
      const usedSheetsFolderId = await googleDriveService.moveSpreadsheetToFolder(spreadsheetId, settings.sheetsFolderId);
      if (usedSheetsFolderId !== settings.sheetsFolderId) {
        updateSettings({ sheetsFolderId: usedSheetsFolderId });
      }
      const sheetInfo = await googleDriveService.getSpreadsheetInfo(spreadsheetId);
      const connectedSheet: ConnectedSheet = { spreadsheetId, spreadsheetUrl, name: sheetInfo.name, connectedAt: new Date().toISOString(), lastSyncedAt: new Date().toISOString() };
      updateSettings({ connectedSheet, sheetAutoSyncEnabled: true });
      toast({ title: 'Sheet Created & Connected', description: 'A new spreadsheet has been created and connected.' });
    } catch (error) {
      if (error instanceof TokenExpiredError) {
        handleTokenExpiry({ type: 'createAndConnectSheet', data });
      } else {
        toast({ title: 'Failed to Create Sheet', description: error instanceof Error ? error.message : 'Could not create sheet.', variant: 'destructive' });
      }
    } finally {
      setIsExporting(false);
    }
  }, [isConnected, updateSettings, toast, handleTokenExpiry]);

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
      const usedSheetsFolderId = await googleDriveService.moveSpreadsheetToFolder(spreadsheetId, settings.sheetsFolderId);
      if (usedSheetsFolderId !== settings.sheetsFolderId) {
        updateSettings({ sheetsFolderId: usedSheetsFolderId });
      }

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
      if (error instanceof TokenExpiredError) {
        handleTokenExpiry({ type: 'createPartnerSheet', data });
      } else {
        toast({
          title: 'Failed to Create Sheet',
          description: error instanceof Error ? error.message : 'Could not create partner sheet.',
          variant: 'destructive',
        });
      }
    } finally {
      setIsSyncingPartnerSheet(null);
    }
  }, [isConnected, settings.partnerSheets, updateSettings, toast, handleTokenExpiry]);

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
      if (error instanceof TokenExpiredError) {
        handleTokenExpiry({ type: 'syncPartnerSheet', data });
      } else {
        toast({
          title: 'Sync Failed',
          description: error instanceof Error ? error.message : 'Could not sync partner sheet.',
          variant: 'destructive',
        });
      }
    } finally {
      setIsSyncingPartnerSheet(null);
    }
  }, [isConnected, settings.partnerSheets, updateSettings, toast, handleTokenExpiry]);

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

  // Remote change detection - poll for changes from other users
  const checkForRemoteChanges = useCallback(async () => {
    if (!isConnected || !currentAccount || isPollingRef.current || remoteChange) return;
    
    isPollingRef.current = true;
    try {
      const latestBackup = await googleDriveService.getLatestBackup();
      
      if (latestBackup && latestBackup.modifiedBy) {
        const isOwnChange = latestBackup.modifiedBy.email === settings.connectedEmail;
        const isNewBackup = latestBackup.id !== settings.lastKnownBackupId;
        
        // Also check if this was a sync we just made (within last 10 seconds)
        const recentOwnSync = lastUserSyncTimeRef.current && 
          (new Date().getTime() - new Date(lastUserSyncTimeRef.current).getTime()) < 10000;
        
        if (isNewBackup && !isOwnChange && !recentOwnSync) {
          // Remote change detected!
          setRemoteChange({
            backupId: latestBackup.id,
            modifiedBy: latestBackup.modifiedBy,
            modifiedAt: latestBackup.createdTime,
          });
        } else if (isNewBackup && (isOwnChange || recentOwnSync)) {
          // Update our known backup ID for our own changes
          updateSettings({
            lastKnownBackupId: latestBackup.id,
            lastKnownBackupTime: latestBackup.createdTime,
          });
        }
      }
    } catch (error) {
      // Don't show errors for polling failures - just retry next time
      if (error instanceof TokenExpiredError) {
        handleTokenExpiry({ type: 'checkForRemoteChanges' }, true); // silent — background poll
      }
    } finally {
      isPollingRef.current = false;
    }
  }, [isConnected, currentAccount, settings.connectedEmail, settings.lastKnownBackupId, remoteChange, updateSettings, handleTokenExpiry]);

  // Start/stop polling based on connection and window visibility
  useEffect(() => {
    if (!isConnected || !currentAccount) {
      if (changePollTimeoutRef.current) {
        clearInterval(changePollTimeoutRef.current);
        changePollTimeoutRef.current = null;
      }
      return;
    }

    const startPolling = () => {
      if (changePollTimeoutRef.current) clearInterval(changePollTimeoutRef.current);
      // Initial check
      checkForRemoteChanges();
      // Then poll every 15 seconds
      changePollTimeoutRef.current = setInterval(checkForRemoteChanges, CHANGE_POLL_INTERVAL);
    };

    const stopPolling = () => {
      if (changePollTimeoutRef.current) {
        clearInterval(changePollTimeoutRef.current);
        changePollTimeoutRef.current = null;
      }
    };

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        startPolling();
      } else {
        stopPolling();
      }
    };

    // Start polling if window is visible
    if (document.visibilityState === 'visible') {
      startPolling();
    }

    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      stopPolling();
    };
  }, [isConnected, currentAccount, checkForRemoteChanges]);

  // Refresh from remote change
  const refreshFromRemote = useCallback(async (): Promise<AppData | null> => {
    if (!remoteChange) return null;
    
    setIsRefreshingFromRemote(true);
    try {
      const data = await googleDriveService.downloadBackup(remoteChange.backupId);
      
      // Update our known backup
      updateSettings({
        lastKnownBackupId: remoteChange.backupId,
        lastKnownBackupTime: remoteChange.modifiedAt,
      });
      
      setRemoteChange(null);
      toast({ title: 'Data Synced', description: 'You now have the latest data.' });
      
      return data;
    } catch (error) {
      if (error instanceof TokenExpiredError) {
      if (error instanceof TokenExpiredError) {
        handleTokenExpiry({ type: 'refreshFromRemote' }, true); // silent — user triggered via sync overlay, not export section
      }
      } else {
        toast({ title: 'Sync Failed', description: error instanceof Error ? error.message : 'Could not sync.', variant: 'destructive' });
      }
      return null;
    } finally {
      setIsRefreshingFromRemote(false);
    }
  }, [remoteChange, updateSettings, toast, handleTokenExpiry]);

  const clearRemoteChange = useCallback(() => {
    setRemoteChange(null);
  }, []);

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
      if (resources.includes('folder') && currentAccount) {
        const result = await googleDriveService.shareWithUser(currentAccount.folderId, email, role, sendNotification);
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
      if (error instanceof TokenExpiredError) {
        handleTokenExpiry({ type: 'shareWithUser' });
      }
      return { 
        success: false, 
        errors: [error instanceof Error ? error.message : 'Failed to share'] 
      };
    } finally {
      setIsSharing(false);
    }
  }, [isConnected, currentAccount, settings.connectedSheet, handleTokenExpiry]);

  const getSharedUsers = useCallback(async (): Promise<SharedUser[]> => {
    if (!isConnected || !currentAccount) return [];
    
    try {
      const permissions = await googleDriveService.listPermissions(currentAccount.folderId);
      
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
      if (error instanceof TokenExpiredError) {
        handleTokenExpiry({ type: 'getSharedUsers' });
      }
      console.error('Failed to get shared users:', error);
      return [];
    }
  }, [isConnected, currentAccount, handleTokenExpiry]);

  const removeSharedUser = useCallback(async (email: string): Promise<void> => {
    if (!isConnected || !currentAccount) throw new Error('Not connected to Google Drive');
    
    setIsSharing(true);
    try {
      // Get folder permissions and remove matching email
      const folderPermissions = await googleDriveService.listPermissions(currentAccount.folderId);
      const folderPerm = folderPermissions.find(p => p.email === email);
      if (folderPerm && folderPerm.role !== 'owner') {
        await googleDriveService.removePermission(currentAccount.folderId, folderPerm.id);
      }
      
      // Also remove from connected sheet if exists
      if (settings.connectedSheet) {
        const sheetPermissions = await googleDriveService.listPermissions(settings.connectedSheet.spreadsheetId);
        const sheetPerm = sheetPermissions.find(p => p.email === email);
        if (sheetPerm && sheetPerm.role !== 'owner') {
          await googleDriveService.removePermission(settings.connectedSheet.spreadsheetId, sheetPerm.id);
        }
      }
    } catch (error) {
      if (error instanceof TokenExpiredError) {
        handleTokenExpiry({ type: 'removeSharedUser' });
      }
      throw error;
    } finally {
      setIsSharing(false);
    }
  }, [isConnected, currentAccount, settings.connectedSheet, handleTokenExpiry]);

  const updateUserPermission = useCallback(async (
    email: string,
    newRole: 'reader' | 'writer' | 'commenter'
  ): Promise<{ success: boolean; errors: string[] }> => {
    if (!isConnected || !currentAccount) return { success: false, errors: ['Not connected to Google Drive'] };
    
    setIsSharing(true);
    const errors: string[] = [];
    
    try {
      // Update folder permission
      const folderPermissions = await googleDriveService.listPermissions(currentAccount.folderId);
      const folderPerm = folderPermissions.find(p => p.email === email);
      if (folderPerm && folderPerm.role !== 'owner') {
        const result = await googleDriveService.updatePermission(currentAccount.folderId, folderPerm.id, newRole);
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
      if (error instanceof TokenExpiredError) {
        handleTokenExpiry({ type: 'updateUserPermission' });
      }
      return { 
        success: false, 
        errors: [error instanceof Error ? error.message : 'Failed to update permission'] 
      };
    } finally {
      setIsSharing(false);
    }
  }, [isConnected, currentAccount, settings.connectedSheet, handleTokenExpiry]);

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

  const closeReconnectModal = useCallback(() => {
    setShowReconnectModal(false);
    setReconnectSuccess(false);
    setIsReconnecting(false);
  }, []);

  const value: GoogleDriveContextValue = {
    isConnected, isLoading, isSyncing, isExporting, isSyncingSheet, isSharing, isConfigured: true,
    isSyncingPartnerSheet, settings, backups,
    showReconnectModal, isReconnecting, reconnectSuccess, closeReconnectModal,
    remoteChange, isRefreshingFromRemote,
    currentAccount, availableAccounts, legacyFolders, showAccountSelection, isDiscoveringAccounts,
    connect, disconnect, syncNow, loadBackups, restoreBackup, setAutoSync, scheduleSync, exportToSheets,
    connectToSheet, disconnectSheet, syncToConnectedSheet, createAndConnectSheet, setSheetAutoSync,
    handleReconnect, refreshFromRemote, clearRemoteChange,
    shareWithUser, getSharedUsers, removeSharedUser, updateUserPermission,
    createPartnerSheet, syncPartnerSheet, disconnectPartnerSheet, setPartnerSheetAutoSync,
    discoverAccounts, selectAccount, createAccount, migrateAccount, closeAccountSelection, switchAccount,
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
