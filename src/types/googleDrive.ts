export interface GoogleDriveBackup {
  id: string;
  name: string;
  createdTime: string;
  size: number;
}

export interface GoogleDriveSettings {
  autoSyncEnabled: boolean;
  lastSyncTime: string | null;
  connectedEmail: string | null;
  accessToken: string | null;
}

export const DEFAULT_GOOGLE_DRIVE_SETTINGS: GoogleDriveSettings = {
  autoSyncEnabled: true,
  lastSyncTime: null,
  connectedEmail: null,
  accessToken: null,
};
