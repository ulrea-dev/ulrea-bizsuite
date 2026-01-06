import { AppData } from '@/types/business';
import { GoogleDriveBackup, SpreadsheetInfo } from '@/types/googleDrive';

const FOLDER_NAME = 'BizSuite Backups';
const SHEETS_FOLDER_NAME = 'BizSuite Sheets';
const DRIVE_API_BASE = 'https://www.googleapis.com/drive/v3';
const UPLOAD_API_BASE = 'https://www.googleapis.com/upload/drive/v3';

class GoogleDriveService {
  private accessToken: string | null = null;

  setAccessToken(token: string | null) {
    this.accessToken = token;
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
      throw new Error(error.error?.message || `Google Drive API error: ${response.status}`);
    }

    return response;
  }

  private async getOrCreateFolder(): Promise<string> {
    // Search for existing folder
    const searchResponse = await this.request(
      `${DRIVE_API_BASE}/files?q=name='${FOLDER_NAME}' and mimeType='application/vnd.google-apps.folder' and trashed=false&fields=files(id,name)`
    );
    const searchData = await searchResponse.json();

    if (searchData.files && searchData.files.length > 0) {
      return searchData.files[0].id;
    }

    // Create folder if it doesn't exist
    const createResponse = await this.request(`${DRIVE_API_BASE}/files`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        name: FOLDER_NAME,
        mimeType: 'application/vnd.google-apps.folder',
      }),
    });

    const createData = await createResponse.json();
    return createData.id;
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

    const response = await this.request(
      `${DRIVE_API_BASE}/files?q='${folderId}' in parents and trashed=false&fields=files(id,name,createdTime,size)&orderBy=createdTime desc`
    );

    const data = await response.json();
    return (data.files || []).map((file: any) => ({
      id: file.id,
      name: file.name,
      createdTime: file.createdTime,
      size: parseInt(file.size) || 0,
    }));
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
    // Search for existing folder
    const searchResponse = await this.request(
      `${DRIVE_API_BASE}/files?q=name='${SHEETS_FOLDER_NAME}' and mimeType='application/vnd.google-apps.folder' and trashed=false&fields=files(id,name)`
    );
    const searchData = await searchResponse.json();

    if (searchData.files && searchData.files.length > 0) {
      return searchData.files[0].id;
    }

    // Create folder if it doesn't exist
    const createResponse = await this.request(`${DRIVE_API_BASE}/files`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        name: SHEETS_FOLDER_NAME,
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
}

export const googleDriveService = new GoogleDriveService();
