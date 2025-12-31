import { AppData } from '@/types/business';

/**
 * Data Repository Interface
 * 
 * This interface defines the contract for data persistence operations.
 * Following the Dependency Inversion Principle, components depend on this
 * abstraction rather than concrete implementations.
 * 
 * Current implementation: LocalStorageRepository
 * Future implementations: SupabaseRepository, APIRepository, etc.
 */
export interface IDataRepository {
  /**
   * Load all application data from the storage
   */
  load(): AppData;

  /**
   * Save all application data to the storage
   */
  save(data: AppData): void;

  /**
   * Export data as a JSON string with metadata
   */
  export(): ExportedData;

  /**
   * Import data from a JSON string
   */
  import(jsonString: string): AppData;

  /**
   * Clear all data from storage
   */
  clear(): void;

  /**
   * Generate a unique ID
   */
  generateId(): string;
}

/**
 * Backup metadata for version tracking and validation
 */
export interface BackupMetadata {
  backupVersion: string;
  backupDate: string;
  appVersion: string;
  dataChecksum?: string;
}

/**
 * Exported data structure with metadata
 */
export interface ExportedData {
  metadata: BackupMetadata;
  data: AppData;
}

/**
 * App data keys for validation
 * This list must be updated when new top-level fields are added to AppData
 */
export const APP_DATA_KEYS: (keyof AppData)[] = [
  'businesses',
  'projects',
  'teamMembers',
  'partners',
  'clients',
  'payments',
  'salaryRecords',
  'salaryPayments',
  'payrollPeriods',
  'payslips',
  'exchangeRates',
  'customCurrencies',
  'quickTasks',
  'retainers',
  'expenses',
  'currentBusinessId',
  'userSettings',
];

/**
 * Validate that exported data contains all required fields
 */
export const validateBackupCompleteness = (data: Partial<AppData>): { isValid: boolean; missingFields: string[] } => {
  const missingFields: string[] = [];
  
  for (const key of APP_DATA_KEYS) {
    if (!(key in data)) {
      missingFields.push(key);
    }
  }

  if (missingFields.length > 0) {
    console.warn('Backup validation warning: Missing fields in backup data:', missingFields);
  }

  return {
    isValid: missingFields.length === 0,
    missingFields,
  };
};
