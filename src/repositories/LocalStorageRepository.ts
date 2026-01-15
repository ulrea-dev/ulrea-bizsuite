import { AppData, SUPPORTED_CURRENCIES } from '@/types/business';
import { getDefaultFont, getDefaultColorPalette } from '@/utils/appearance';
import { 
  IDataRepository, 
  ExportedData, 
  BackupMetadata,
  validateBackupCompleteness,
} from './IDataRepository';

const STORAGE_KEY = 'bizsuite-data';
const APP_VERSION = '1.0.0';
const BACKUP_VERSION = '1.0.0';

/**
 * LocalStorage implementation of IDataRepository
 * 
 * This class handles all localStorage-specific operations.
 * To switch to a database, create a new class implementing IDataRepository
 * (e.g., SupabaseRepository) and swap it in RepositoryProvider.
 */
export class LocalStorageRepository implements IDataRepository {
  private getInitialData(): AppData {
    return {
      businesses: [],
      projects: [],
      teamMembers: [],
      partners: [],
      clients: [],
      payments: [],
      salaryRecords: [],
      salaryPayments: [],
      payrollPeriods: [],
      payslips: [],
      exchangeRates: [],
      customCurrencies: [],
      quickTasks: [],
      retainers: [],
      renewals: [],
      expenses: [],
      extraPayments: [],
      bankAccounts: [],
      payables: [],
      receivables: [],
      renewalPayments: [],
      userBusinessAccess: [],
      currentBusinessId: null,
      userSettings: {
        username: '',
        userId: '',
        theme: 'light',
        defaultCurrency: SUPPORTED_CURRENCIES[0], // USD
        fontFamily: getDefaultFont(),
        colorPalette: getDefaultColorPalette(),
      },
    };
  }

  load(): AppData {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (!stored) return this.getInitialData();

      const data = JSON.parse(stored) as AppData;
      const initialData = this.getInitialData();

      return {
        ...initialData,
        ...data,
        // Ensure arrays exist (for backward compatibility)
        partners: data.partners || [],
        salaryRecords: data.salaryRecords || [],
        salaryPayments: data.salaryPayments || [],
        payrollPeriods: data.payrollPeriods || [],
        payslips: data.payslips || [],
        exchangeRates: data.exchangeRates || [],
        customCurrencies: data.customCurrencies || [],
        quickTasks: data.quickTasks || [],
        retainers: data.retainers || [],
        renewals: data.renewals || [],
        expenses: data.expenses || [],
        extraPayments: data.extraPayments || [],
        bankAccounts: data.bankAccounts || [],
        payables: data.payables || [],
        receivables: data.receivables || [],
        renewalPayments: data.renewalPayments || [],
        userBusinessAccess: data.userBusinessAccess || [],
        // Ensure projects have clientPayments field (for backward compatibility)
        projects: (data.projects || []).map(project => ({
          ...project,
          clientPayments: project.clientPayments ?? 0,
        })),
        userSettings: {
          ...initialData.userSettings,
          ...data.userSettings,
          // Generate userId if missing (backward compatibility)
          userId: data.userSettings?.userId || '',
        },
      };
    } catch (error) {
      console.error('Error loading data:', error);
      return this.getInitialData();
    }
  }

  save(data: AppData): void {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    } catch (error) {
      console.error('Error saving data:', error);
    }
  }

  export(): ExportedData {
    const data = this.load();

    // Validate completeness before export
    const validation = validateBackupCompleteness(data);
    if (!validation.isValid) {
      console.warn('Export warning: Backup may be incomplete. Missing fields:', validation.missingFields);
    }

    const metadata: BackupMetadata = {
      backupVersion: BACKUP_VERSION,
      backupDate: new Date().toISOString(),
      appVersion: APP_VERSION,
    };

    return {
      metadata,
      data,
    };
  }

  import(jsonString: string): AppData {
    try {
      const parsed = JSON.parse(jsonString);

      // Handle both new format (with metadata) and legacy format (raw AppData)
      let data: AppData;
      if (parsed.metadata && parsed.data) {
        // New format with metadata
        data = parsed.data as AppData;
        console.log('Importing backup from:', parsed.metadata.backupDate, 'version:', parsed.metadata.backupVersion);
      } else {
        // Legacy format (raw AppData)
        data = parsed as AppData;
        console.log('Importing legacy backup format');
      }

      // Validate the imported data
      const validation = validateBackupCompleteness(data);
      if (!validation.isValid) {
        console.warn('Import warning: Backup may be incomplete. Missing fields:', validation.missingFields);
      }

      this.save(data);
      return data;
    } catch (error) {
      throw new Error('Invalid data format');
    }
  }

  clear(): void {
    localStorage.removeItem(STORAGE_KEY);
  }

  generateId(): string {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }
}

// Singleton instance for backward compatibility
export const localStorageRepository = new LocalStorageRepository();
