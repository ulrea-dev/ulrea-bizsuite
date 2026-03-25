import { AppData } from '@/types/business';
import { IDataRepository, ExportedData, BackupMetadata, validateBackupCompleteness } from './IDataRepository';
import { LocalStorageRepository } from './LocalStorageRepository';
import { supabase } from '@/integrations/supabase/client';

const BUCKET = 'workspace-data';
const FILE_NAME = 'data.json';
const LAST_CLOUD_SYNC_KEY = 'bizsuite-last-cloud-sync';
const APP_VERSION = '1.0.0';
const BACKUP_VERSION = '1.0.0';

/**
 * Derives a stable, URL-safe storage path key from an account name.
 * Falls back to userId if no account name is set.
 */
export function deriveStoragePath(accountName: string, userId: string): string | null {
  const slug = accountName?.trim();
  if (slug) {
    return slug.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
  }
  if (userId?.trim()) return userId.trim();
  return null;
}

/**
 * SupabaseStorageRepository
 *
 * Wraps LocalStorageRepository and additionally performs async uploads
 * to Supabase Storage on every save. localStorage is still used for
 * fast synchronous reads. Cloud upload is fire-and-forget — failures
 * are logged but never interrupt the user.
 */
export class SupabaseStorageRepository implements IDataRepository {
  private local: LocalStorageRepository;

  constructor() {
    this.local = new LocalStorageRepository();
  }

  load(): AppData {
    return this.local.load();
  }

  save(data: AppData): void {
    this.local.save(data);
    // Fire-and-forget upload to Supabase Storage
    void this._uploadToCloud(data);
  }

  private async _uploadToCloud(data: AppData): Promise<void> {
    try {
      const path = deriveStoragePath(
        data.userSettings?.accountName || '',
        data.userSettings?.userId || ''
      );
      if (!path) return; // No identity yet — skip

      const filePath = `${path}/${FILE_NAME}`;
      const json = JSON.stringify(data);
      const blob = new Blob([json], { type: 'application/json' });

      const { error } = await supabase.storage
        .from(BUCKET)
        .upload(filePath, blob, {
          upsert: true,
          contentType: 'application/json',
        });

      if (error) {
        console.warn('[CloudSync] Upload failed:', error.message);
        return;
      }

      // Track last successful cloud sync time
      localStorage.setItem(LAST_CLOUD_SYNC_KEY, new Date().toISOString());
    } catch (err) {
      console.warn('[CloudSync] Unexpected upload error:', err);
    }
  }

  /**
   * Download the latest cloud backup for a given path key.
   * Returns null if no backup exists or download fails.
   */
  async downloadFromCloud(pathKey: string): Promise<{ data: AppData; syncedAt: string } | null> {
    try {
      const filePath = `${pathKey}/${FILE_NAME}`;
      const { data: fileData, error } = await supabase.storage
        .from(BUCKET)
        .download(filePath);

      if (error || !fileData) return null;

      const text = await fileData.text();
      const parsed = JSON.parse(text) as AppData;
      
      // Get file metadata to know when it was last updated
      const { data: listData } = await supabase.storage
        .from(BUCKET)
        .list(pathKey, { limit: 1, search: FILE_NAME });

      const syncedAt = listData?.[0]?.updated_at || listData?.[0]?.created_at || new Date().toISOString();
      return { data: parsed, syncedAt };
    } catch (err) {
      console.warn('[CloudSync] Download failed:', err);
      return null;
    }
  }

  /**
   * Check if a cloud backup exists for a given path key without downloading it.
   */
  async checkCloudBackupExists(pathKey: string): Promise<{ exists: boolean; syncedAt?: string } | null> {
    try {
      const { data: listData, error } = await supabase.storage
        .from(BUCKET)
        .list(pathKey, { limit: 1, search: FILE_NAME });

      if (error) return null;
      if (!listData || listData.length === 0) return { exists: false };

      const file = listData[0];
      return {
        exists: true,
        syncedAt: file.updated_at || file.created_at || undefined,
      };
    } catch {
      return null;
    }
  }

  getLastCloudSyncTime(): string | null {
    return localStorage.getItem(LAST_CLOUD_SYNC_KEY);
  }

  export(): ExportedData {
    return this.local.export();
  }

  import(jsonString: string): AppData {
    return this.local.import(jsonString);
  }

  clear(): void {
    this.local.clear();
  }

  generateId(): string {
    return this.local.generateId();
  }
}

export const supabaseStorageRepository = new SupabaseStorageRepository();
