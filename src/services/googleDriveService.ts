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

  setAccessToken(token: string | null) {
    this.accessToken = token;
  }

  setCurrentAccountFolder(folderId: string | null) {
    this.currentAccountFolderId = folderId;
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
   * List all BizSuite accounts (workspaces) the user has access to.
   * Searches for folders with appProperties.bizsuiteAccountId
   */
  async listBizSuiteAccounts(): Promise<BizSuiteAccount[]> {
    // Search for folders with bizsuiteAccountId property
    const searchResponse = await this.request(
      `${DRIVE_API_BASE}/files?q=mimeType='application/vnd.google-apps.folder' and trashed=false and appProperties has { key='bizsuiteAccountId' }&fields=files(id,name,ownedByMe,appProperties,owners(emailAddress),capabilities/canAddChildren,createdTime)`
    );
    const searchData = await searchResponse.json();

    if (!searchData.files || searchData.files.length === 0) {
      return [];
    }

    return searchData.files
      .filter((f: any) => f.appProperties?.bizsuiteAccountId && f.appProperties?.bizsuiteAccountName)
      .map((f: any) => ({
        id: f.appProperties.bizsuiteAccountId,
        name: f.appProperties.bizsuiteAccountName,
        folderId: f.id,
        ownedByMe: f.ownedByMe,
        sharedBy: !f.ownedByMe && f.owners?.[0]?.emailAddress ? f.owners[0].emailAddress : undefined,
        createdAt: f.createdTime,
      }));
  }

  /**
   * Search for legacy folders (without appProperties) that might need migration
   */
  async findLegacyFolders(): Promise<Array<{ id: string; name: string; ownedByMe: boolean }>> {
    const searchResponse = await this.request(
      `${DRIVE_API_BASE}/files?q=name contains '${FOLDER_NAME_PREFIX}' and mimeType='application/vnd.google-apps.folder' and trashed=false&fields=files(id,name,ownedByMe,appProperties)`
    );
    const searchData = await searchResponse.json();

    if (!searchData.files) return [];

    // Return folders that don't have bizsuiteAccountId yet
    return searchData.files
      .filter((f: any) => !f.appProperties?.bizsuiteAccountId)
      .map((f: any) => ({
        id: f.id,
        name: f.name,
        ownedByMe: f.ownedByMe,
      }));
  }

  /**
   * Create a new BizSuite account folder with metadata
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
   * Migrate a legacy folder to the new account system
   */
  async migrateLegacyFolder(folderId: string, accountName: string): Promise<BizSuiteAccount> {
    const accountId = generateAccountId();
    const folderName = `${FOLDER_NAME_PREFIX} - ${accountName}`;

    await this.request(`${DRIVE_API_BASE}/files/${folderId}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        name: folderName,
        appProperties: {
          bizsuiteAccountId: accountId,
          bizsuiteAccountName: accountName,
        },
      }),
    });

    return {
      id: accountId,
      name: accountName,
      folderId: folderId,
      ownedByMe: true,
      createdAt: new Date().toISOString(),
    };
  }

  /**
   * Get folder ID for a specific account
   */
  async getAccountFolder(accountId: string): Promise<string | null> {
    const searchResponse = await this.request(
      `${DRIVE_API_BASE}/files?q=mimeType='application/vnd.google-apps.folder' and trashed=false and appProperties has { key='bizsuiteAccountId' and value='${accountId}' }&fields=files(id)`
    );
    const searchData = await searchResponse.json();

    if (searchData.files && searchData.files.length > 0) {
      return searchData.files[0].id;
    }
    return null;
  }

  /**
   * Update account name
   */
  async updateAccountName(accountId: string, newName: string): Promise<void> {
    const folderId = await this.getAccountFolder(accountId);
    if (!folderId) throw new Error('Account folder not found');

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

  // ============ BACKUP OPERATIONS (now use currentAccountFolderId) ============

  private async getOrCreateFolder(): Promise<string> {
    // If we have a current account folder, use it
    if (this.currentAccountFolderId) {
      return this.currentAccountFolderId;
    }

    // Fallback: search for any writable folder (for backwards compatibility)
    const searchResponse = await this.request(
      `${DRIVE_API_BASE}/files?q=name contains '${FOLDER_NAME_PREFIX}' and mimeType='application/vnd.google-apps.folder' and trashed=false&fields=files(id,name,ownedByMe,capabilities/canAddChildren)`
    );
    const searchData = await searchResponse.json();

    if (searchData.files && searchData.files.length > 0) {
      // First, try to find a folder we own
      const ownedFolder = searchData.files.find((f: any) => f.ownedByMe);
      if (ownedFolder) {
        return ownedFolder.id;
      }
      
      // If no owned folder, check if any shared folder allows us to add files
      const writableFolder = searchData.files.find((f: any) => f.capabilities?.canAddChildren);
      if (writableFolder) {
        return writableFolder.id;
      }
    }

    // No folder found and no account set - this shouldn't happen in normal flow
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

  async getOrCreateSheetsFolder(): Promise<string> {
    // Search for existing folders - include 'ownedByMe' to prioritize user's own folder
    const searchResponse = await this.request(
      `${DRIVE_API_BASE}/files?q=name contains '${SHEETS_FOLDER_NAME_PREFIX}' and mimeType='application/vnd.google-apps.folder' and trashed=false&fields=files(id,name,ownedByMe,capabilities/canAddChildren)`
    );
    const searchData = await searchResponse.json();

    if (searchData.files && searchData.files.length > 0) {
      // First, try to find a folder we own
      const ownedFolder = searchData.files.find((f: any) => f.ownedByMe);
      if (ownedFolder) {
        return ownedFolder.id;
      }
      
      // If no owned folder, check if any shared folder allows us to add files
      const writableFolder = searchData.files.find((f: any) => f.capabilities?.canAddChildren);
      if (writableFolder) {
        return writableFolder.id;
      }
      
      // Folders exist but we can't write to them - create our own
    }

    // Create folder if it doesn't exist or we don't have write access to existing ones
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
    return createData.id;
  }

  async listSpreadsheets(): Promise<SpreadsheetInfo[]> {
    const folderId = await this.getOrCreateSheetsFolder();

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

  async moveSpreadsheetToFolder(spreadsheetId: string): Promise<void> {
    const folderId = await this.getOrCreateSheetsFolder();

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

  // Get the backup folder ID (creates if doesn't exist)
  async getBackupFolderId(): Promise<string> {
    return await this.getOrCreateFolder();
  }

  // Get the sheets folder ID (creates if doesn't exist)
  async getSheetsFolderId(): Promise<string> {
    return await this.getOrCreateSheetsFolder();
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
