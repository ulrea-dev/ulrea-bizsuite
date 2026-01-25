export interface GoogleDriveBackup {
  id: string;
  name: string;
  createdTime: string;
  size: number;
  modifiedBy?: {
    name?: string;
    email: string;
  };
}

export interface RemoteChange {
  backupId: string;
  modifiedBy: {
    name?: string;
    email: string;
  };
  modifiedAt: string;
}

// Custom error for token expiry
export class TokenExpiredError extends Error {
  constructor(message: string = 'Google session has expired') {
    super(message);
    this.name = 'TokenExpiredError';
  }
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

export interface PartnerSheet {
  partnerId: string;
  partnerName: string;
  spreadsheetId: string;
  spreadsheetUrl: string;
  createdAt: string;
  lastSyncedAt: string | null;
  businessIds: string[]; // Businesses included in this export
  autoSyncEnabled: boolean;
}

// BizSuite Account/Workspace - identified by appProperties in Google Drive
export interface BizSuiteAccount {
  id: string;              // UUID - stored in appProperties.bizsuiteAccountId
  name: string;            // Human-readable name (e.g., "Opomu", "Team Alpha")
  folderId: string;        // Google Drive backup folder ID
  sheetsFolderId?: string; // Sheets folder ID (optional)
  ownedByMe: boolean;      // Whether current user owns this account
  sharedBy?: string;       // Email of owner if shared
  createdAt?: string;      // When the account was created
}

export interface GoogleDriveSettings {
  autoSyncEnabled: boolean;
  lastSyncTime: string | null;
  connectedEmail: string | null;
  accessToken: string | null;
  connectedSheet: ConnectedSheet | null;
  sheetAutoSyncEnabled: boolean;
  backupFolderId: string | null;
  partnerSheets: PartnerSheet[];
  // Change detection
  lastKnownBackupId: string | null;
  lastKnownBackupTime: string | null;
  // Account/Workspace management
  currentAccountId: string | null;
  currentAccountName: string | null;
}

export const DEFAULT_GOOGLE_DRIVE_SETTINGS: GoogleDriveSettings = {
  autoSyncEnabled: true,
  lastSyncTime: null,
  connectedEmail: null,
  accessToken: null,
  connectedSheet: null,
  sheetAutoSyncEnabled: false,
  backupFolderId: null,
  partnerSheets: [],
  lastKnownBackupId: null,
  lastKnownBackupTime: null,
  currentAccountId: null,
  currentAccountName: null,
};
