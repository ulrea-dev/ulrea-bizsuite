export interface GoogleDriveBackup {
  id: string;
  name: string;
  createdTime: string;
  size: number;
}

export interface ConnectedSheet {
  spreadsheetId: string;
  spreadsheetUrl: string;
  name: string;
  connectedAt: string;
  lastSyncedAt: string | null;
}

export interface SpreadsheetInfo {
  id: string;
  name: string;
  createdTime: string;
  webViewLink: string;
}

export interface SharedUser {
  id: string;
  email: string;
  displayName?: string;
  role: 'reader' | 'writer' | 'commenter' | 'owner';
  photoUrl?: string;
}

export interface GoogleDriveSettings {
  autoSyncEnabled: boolean;
  lastSyncTime: string | null;
  connectedEmail: string | null;
  accessToken: string | null;
  connectedSheet: ConnectedSheet | null;
  sheetAutoSyncEnabled: boolean;
  backupFolderId: string | null;
}

export const DEFAULT_GOOGLE_DRIVE_SETTINGS: GoogleDriveSettings = {
  autoSyncEnabled: true,
  lastSyncTime: null,
  connectedEmail: null,
  accessToken: null,
  connectedSheet: null,
  sheetAutoSyncEnabled: false,
  backupFolderId: null,
};
