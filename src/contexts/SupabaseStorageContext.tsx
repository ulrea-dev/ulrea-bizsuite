import React, { createContext, useContext, useState, useCallback, type ReactNode } from 'react';
import { SupabaseStorageRepository, deriveStoragePath } from '@/repositories/SupabaseStorageRepository';
import { AppData } from '@/types/business';

interface CloudSyncStatus {
  /** ISO string of last successful Supabase cloud sync */
  lastSyncTime: string | null;
  /** Whether an upload is currently in-flight (used for UI indicator) */
  isSyncing: boolean;
}

interface SupabaseStorageContextValue {
  cloudSync: CloudSyncStatus;
  /** Manually trigger a cloud upload */
  uploadNow: (data: AppData) => Promise<void>;
  /** Download cloud backup for a path key and return the data */
  downloadCloud: (pathKey: string) => Promise<{ data: AppData; syncedAt: string } | null>;
  /** Check if a cloud backup exists without downloading */
  checkCloudExists: (pathKey: string) => Promise<{ exists: boolean; syncedAt?: string } | null>;
  /** Get the storage path key for a given account/userId */
  getStoragePath: (accountName: string, userId: string) => string | null;
}

const SupabaseStorageContext = createContext<SupabaseStorageContextValue | undefined>(undefined);

export const useSupabaseStorage = (): SupabaseStorageContextValue => {
  const context = useContext(SupabaseStorageContext);
  if (!context) throw new Error('useSupabaseStorage must be used within SupabaseStorageProvider');
  return context;
};

const repo = new SupabaseStorageRepository();

export const SupabaseStorageProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [cloudSync, setCloudSync] = useState<CloudSyncStatus>({
    lastSyncTime: repo.getLastCloudSyncTime(),
    isSyncing: false,
  });

  const uploadNow = useCallback(async (data: AppData) => {
    setCloudSync(prev => ({ ...prev, isSyncing: true }));
    try {
      // Save triggers cloud upload internally
      repo.save(data);
      const syncTime = new Date().toISOString();
      setCloudSync({ isSyncing: false, lastSyncTime: syncTime });
    } catch {
      setCloudSync(prev => ({ ...prev, isSyncing: false }));
    }
  }, []);

  const downloadCloud = useCallback(async (pathKey: string) => {
    return repo.downloadFromCloud(pathKey);
  }, []);

  const checkCloudExists = useCallback(async (pathKey: string) => {
    return repo.checkCloudBackupExists(pathKey);
  }, []);

  const getStoragePath = useCallback((accountName: string, userId: string) => {
    return deriveStoragePath(accountName, userId);
  }, []);

  return (
    <SupabaseStorageContext.Provider value={{ cloudSync, uploadNow, downloadCloud, checkCloudExists, getStoragePath }}>
      {children}
    </SupabaseStorageContext.Provider>
  );
};
