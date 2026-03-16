import { AppData } from '@/types/business';
import { GoogleDriveBackup, SpreadsheetInfo, TokenExpiredError, BizSuiteAccount } from '@/types/googleDrive';

const FOLDER_NAME_PREFIX = 'BizSuite Backups';
const SHEETS_FOLDER_NAME_PREFIX = 'BizSuite Sheets';
const DRIVE_API_BASE = 'https://www.googleapis.com/drive/v3';
const UPLOAD_API_BASE = 'https://www.googleapis.com/upload/drive/v3';

// Generate a UUID for account IDs
function generateAccountId(): string {
  return crypto.randomUUID();
}

class GoogleDriveService {
  private accessToken: string | null = null;
  private currentAccountFolderId: string | null = null;
  private sheetsFolderId: string | null = null;

  setAccessToken(token: string | null) {
    this.accessToken = token;
  }

  setCurrentAccountFolder(folderId: string | null) {
    this.currentAccountFolderId = folderId;
  }

  setSheetsFolder(folderId: string | null) {
    this.sheetsFolderId = folderId;
  }

  private async request(url: string, options: RequestInit = {}) {
    if (!this.accessToken) {
      throw new Error('Not authenticated with Google Drive');
    }

    const response = await fetch(url, {
      ...options,
      headers: {
        Authorization: `Bearer ${this.accessToken}`,
        ...options.headers,
      },
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      const status = response.status;
      const message = error.error?.message || `Google Drive API error: ${status}`;
      
      // Detect token expiry (401 Unauthorized or 403 with auth-related message)
      if (status === 401 || (status === 403 && message.toLowerCase().includes('auth'))) {
        throw new TokenExpiredError(message);
      }
      
      throw new Error(message);
    }

    return response;
  }

  // ============ ACCOUNT/WORKSPACE MANAGEMENT ============

  /**
   * List BizSuite accounts using stored folder IDs (drive.file scope compatible).
   * Under drive.file scope we cannot search Drive — we rely on the caller passing
   * known account data from localStorage. This method verifies a known folder still
   * exists and is accessible by fetching it directly.
   */
  async verifyAccountFolder(folderId: string): Promise<{ accessible: boolean; canWrite: boolean }> {
    try {
      const response = await this.request(
        `${DRIVE_API_BASE}/files/${folderId}?fields=id,name,ownedByMe,capabilities/canAddChildren,trashed`
      );
      const data = await response.json();
      if (data.trashed) return { accessible: false, canWrite: false };
      return {
        accessible: true,
        canWrite: data.ownedByMe || data.capabilities?.canAddChildren === true,
      };
    } catch {
      return { accessible: false, canWrite: false };
    }
  }

  /**
   * Create a new BizSuite account folder with metadata.
   * Works with drive.file scope since we are creating the folder.
   */
  async createAccountFolder(accountName: string): Promise<BizSuiteAccount> {
    const accountId = generateAccountId();
    const folderName = `${FOLDER_NAME_PREFIX} - ${accountName}`;

    const createResponse = await this.request(`${DRIVE_API_BASE}/files`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        name: folderName,
        mimeType: 'application/vnd.google-apps.folder',
        appProperties: {
          bizsuiteAccountId: accountId,
          bizsuiteAccountName: accountName,
        },
      }),
    });

    const createData = await createResponse.json();
    
    return {
      id: accountId,
      name: accountName,
      folderId: createData.id,
      ownedByMe: true,
      createdAt: new Date().toISOString(),
    };
  }

  /**
   * Update account name. Works with drive.file scope since the folder was created by the app.
   */
  async updateAccountName(folderId: string, accountId: string, newName: string): Promise<void> {
    const folderName = `${FOLDER_NAME_PREFIX} - ${newName}`;
    
    await this.request(`${DRIVE_API_BASE}/files/${folderId}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        name: folderName,
        appProperties: {
          bizsuiteAccountId: accountId,
          bizsuiteAccountName: newName,
        },
      }),
    });
  }

  // ============ BACKUP OPERATIONS ============

  private async getOrCreateFolder(): Promise<string> {
    // Always use the stored current account folder — no Drive search needed
    if (this.currentAccountFolderId) {
      return this.currentAccountFolderId;
    }

    // No workspace selected — caller should have set one up
    throw new Error('No workspace selected. Please select or create a workspace first.');
  }

  async uploadBackup(data: AppData): Promise<GoogleDriveBackup> {
    const folderId = await this.getOrCreateFolder();
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const fileName = `bizsuite-backup-${timestamp}.json`;
    const fileContent = JSON.stringify(data, null, 2);

    const metadata = {
      name: fileName,
      parents: [folderId],
      mimeType: 'application/json',
    };

    const form = new FormData();
    form.append(
      'metadata',
      new Blob([JSON.stringify(metadata)], { type: 'application/json' })
    );
    form.append('file', new Blob([fileContent], { type: 'application/json' }));

    const response = await fetch(
      `${UPLOAD_API_BASE}/files?uploadType=multipart&fields=id,name,createdTime,size`,
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${this.accessToken}`,
        },
        body: form,
      }
    );

    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      throw new Error(error.error?.message || 'Failed to upload backup');
    }

    const result = await response.json();
    return {
      id: result.id,
      name: result.name,
      createdTime: result.createdTime,
      size: parseInt(result.size) || 0,
    };
  }

  async listBackups(): Promise<GoogleDriveBackup[]> {
    const folderId = await this.getOrCreateFolder();

    // Include lastModifyingUser fields to track who made changes
    const response = await this.request(
      `${DRIVE_API_BASE}/files?q='${folderId}' in parents and trashed=false&fields=files(id,name,createdTime,size,lastModifyingUser(displayName,emailAddress))&orderBy=createdTime desc`
    );

    const data = await response.json();
    return (data.files || []).map((file: any) => ({
      id: file.id,
      name: file.name,
      createdTime: file.createdTime,
      size: parseInt(file.size) || 0,
      modifiedBy: file.lastModifyingUser ? {
        name: file.lastModifyingUser.displayName,
        email: file.lastModifyingUser.emailAddress,
      } : undefined,
    }));
  }

  // Get the latest backup info for change detection
  async getLatestBackup(): Promise<GoogleDriveBackup | null> {
    const backups = await this.listBackups();
    return backups.length > 0 ? backups[0] : null;
  }

  async downloadBackup(fileId: string): Promise<AppData> {
    const response = await this.request(
      `${DRIVE_API_BASE}/files/${fileId}?alt=media`
    );

    const data = await response.json();
    return data as AppData;
  }

  async deleteBackup(fileId: string): Promise<void> {
    await this.request(`${DRIVE_API_BASE}/files/${fileId}`, {
      method: 'DELETE',
    });
  }

  async deleteOldBackups(keepCount: number = 10): Promise<number> {
    const backups = await this.listBackups();
    
    if (backups.length <= keepCount) {
      return 0;
    }

    const toDelete = backups.slice(keepCount);
    
    for (const backup of toDelete) {
      await this.deleteBackup(backup.id);
    }

    return toDelete.length;
  }

  // ============ SHEETS FOLDER MANAGEMENT ============

  /**
   * Get or create the sheets folder.
   * Under drive.file scope: if we have a stored sheets folder ID, verify it;
   * otherwise create a new one.
   */
  async getOrCreateSheetsFolder(storedFolderId?: string | null): Promise<string> {
    // Try stored ID first — avoids any Drive search
    if (storedFolderId || this.sheetsFolderId) {
      const idToCheck = storedFolderId || this.sheetsFolderId!;
      const { accessible, canWrite } = await this.verifyAccountFolder(idToCheck);
      if (accessible && canWrite) {
        this.sheetsFolderId = idToCheck;
        return idToCheck;
      }
      // Stored folder is gone or inaccessible — fall through to create
    }

    // Create a new sheets folder
    const createResponse = await this.request(`${DRIVE_API_BASE}/files`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        name: SHEETS_FOLDER_NAME_PREFIX,
        mimeType: 'application/vnd.google-apps.folder',
      }),
    });

    const createData = await createResponse.json();
    this.sheetsFolderId = createData.id;
    return createData.id;
  }

  async listSpreadsheets(storedSheetsFolderId?: string | null): Promise<SpreadsheetInfo[]> {
    const folderId = await this.getOrCreateSheetsFolder(storedSheetsFolderId);

    const response = await this.request(
      `${DRIVE_API_BASE}/files?q='${folderId}' in parents and mimeType='application/vnd.google-apps.spreadsheet' and trashed=false&fields=files(id,name,createdTime,webViewLink)&orderBy=createdTime desc`
    );

    const data = await response.json();
    return (data.files || []).map((file: any) => ({
      id: file.id,
      name: file.name,
      createdTime: file.createdTime,
      webViewLink: file.webViewLink,
    }));
  }

  async moveSpreadsheetToFolder(spreadsheetId: string, storedSheetsFolderId?: string | null): Promise<string> {
    const folderId = await this.getOrCreateSheetsFolder(storedSheetsFolderId);

    // Get current parents
    const fileResponse = await this.request(
      `${DRIVE_API_BASE}/files/${spreadsheetId}?fields=parents`
    );
    const fileData = await fileResponse.json();
    const currentParents = (fileData.parents || []).join(',');

    // Move file to sheets folder
    await this.request(
      `${DRIVE_API_BASE}/files/${spreadsheetId}?addParents=${folderId}&removeParents=${currentParents}`,
      { method: 'PATCH' }
    );
    return folderId;
  }

  async getSpreadsheetInfo(spreadsheetId: string): Promise<SpreadsheetInfo> {
    const response = await this.request(
      `${DRIVE_API_BASE}/files/${spreadsheetId}?fields=id,name,createdTime,webViewLink`
    );
    const data = await response.json();
    return {
      id: data.id,
      name: data.name,
      createdTime: data.createdTime,
      webViewLink: data.webViewLink,
    };
  }

  // Get the backup folder ID (uses stored ID — no search)
  async getBackupFolderId(): Promise<string> {
    return await this.getOrCreateFolder();
  }

  // Get the sheets folder ID (uses stored ID or creates new)
  async getSheetsFolderId(storedSheetsFolderId?: string | null): Promise<string> {
    return await this.getOrCreateSheetsFolder(storedSheetsFolderId);
  }

  // Share a file/folder with a user
  async shareWithUser(
    fileId: string,
    email: string,
    role: 'reader' | 'writer' | 'commenter',
    sendNotification: boolean = true
  ): Promise<{ success: boolean; error?: string }> {
    try {
      await this.request(
        `${DRIVE_API_BASE}/files/${fileId}/permissions?sendNotificationEmail=${sendNotification}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            type: 'user',
            role: role,
            emailAddress: email,
          }),
        }
      );
      return { success: true };
    } catch (error) {
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Failed to share' 
      };
    }
  }

  // List current permissions on a file/folder
  async listPermissions(fileId: string): Promise<Array<{
    id: string;
    email: string;
    displayName?: string;
    role: string;
    photoUrl?: string;
  }>> {
    const response = await this.request(
      `${DRIVE_API_BASE}/files/${fileId}/permissions?fields=permissions(id,emailAddress,displayName,role,photoLink)`
    );
    const data = await response.json();
    return (data.permissions || []).map((p: any) => ({
      id: p.id,
      email: p.emailAddress,
      displayName: p.displayName,
      role: p.role,
      photoUrl: p.photoLink,
    }));
  }

  // Remove a permission
  async removePermission(fileId: string, permissionId: string): Promise<void> {
    await this.request(
      `${DRIVE_API_BASE}/files/${fileId}/permissions/${permissionId}`,
      { method: 'DELETE' }
    );
  }

  // Update a permission role
  async updatePermission(
    fileId: string,
    permissionId: string,
    role: 'reader' | 'writer' | 'commenter'
  ): Promise<{ success: boolean; error?: string }> {
    try {
      await this.request(
        `${DRIVE_API_BASE}/files/${fileId}/permissions/${permissionId}`,
        {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ role }),
        }
      );
      return { success: true };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to update permission',
      };
    }
  }
}

export const googleDriveService = new GoogleDriveService();
