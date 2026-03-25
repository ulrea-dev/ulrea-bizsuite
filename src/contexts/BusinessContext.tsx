import { createContext, useContext, useReducer, useEffect, useMemo, useRef, useState, type ReactNode, type Dispatch, type FC } from 'react';
import {
  AppData,
  Business,
  BusinessModel,
  Project,
  TeamMember,
  Client,
  Payment,
  SalaryRecord,
  SalaryPayment,
  PayrollPeriod,
  Payslip,
  ExchangeRate,
  Currency,
  ProjectAllocation,
  TeamAllocation,
  PartnerAllocation,
  CompanyAllocation,
  AllocationTeamAllocation,
  AllocationPartnerAllocation,
  AllocationCompanyAllocation,
  Partner,
  Expense,
  QuickTask,
  Retainer,
} from '@/types/business';
import { rootReducer, BusinessAction } from '@/reducers';
import { useRepository } from '@/repositories';
import { SupabaseDBRepository } from '@/repositories/SupabaseDBRepository';
import { getUserAccessibleBusinessIds } from '@/utils/filterDataForUser';

// Flag to prevent sync during restore operations
let isRestoringData = false;
export const setRestoringData = (value: boolean) => { isRestoringData = value; };
export const getIsRestoringData = () => isRestoringData;

// Re-export BusinessAction for backward compatibility
export type { BusinessAction } from '@/reducers';

interface BusinessContextProps {
  data: AppData;
  currentBusiness: Business | null;
  accessibleBusinesses: Business[];
  dispatch: Dispatch<BusinessAction>;
  isLoadingFromDB: boolean;
  // Helper functions used by components
  addBusiness: (input: {
    name: string;
    type: string;
    businessModel: BusinessModel;
    currentBalance: number;
    minimumBalance: number;
    currency: Currency;
  }) => void;
  switchBusiness: (id: string | null) => void;
  addProject: (projectData: Omit<Project, 'id' | 'createdAt' | 'updatedAt'>) => void;
  updateProject: (id: string, updates: Partial<Project>) => void;
  // Export function for backup
  exportData: () => string;
  // Import function for restore
  importData: (jsonString: string) => void;
  // Switch to a different venture/workspace
  switchVenture: (workspaceId: string) => Promise<void>;
}

const BusinessContext = createContext<BusinessContextProps | undefined>(undefined);

export const useBusiness = (): BusinessContextProps => {
  const context = useContext(BusinessContext);
  if (!context) {
    throw new Error('useBusiness must be used within a BusinessProvider');
  }
  return context;
};

interface BusinessProviderProps {
  children: ReactNode;
}

export const BusinessProvider: FC<BusinessProviderProps> = ({ children }) => {
  const { repository } = useRepository();
  
  // Initialize state from local cache (synchronous, fast)
  const [data, dispatch] = useReducer(rootReducer, repository.load());
  const [isLoadingFromDB, setIsLoadingFromDB] = useState(false);

  const isInitialMount = useRef(true);

  // On mount: async load from Supabase DB (replaces local cache)
  useEffect(() => {
    if (repository instanceof SupabaseDBRepository) {
      setIsLoadingFromDB(true);
      repository.loadAsync().then(dbData => {
        dispatch({ type: 'LOAD_DATA', payload: dbData });
        setIsLoadingFromDB(false);
      }).catch(() => setIsLoadingFromDB(false));
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Save to repository whenever data changes (after initial load)
  useEffect(() => {
    if (isInitialMount.current) {
      isInitialMount.current = false;
      return;
    }

    repository.save(data);
    
    if (!isRestoringData) {
      window.dispatchEvent(new CustomEvent('bizsuite-data-change', { detail: data }));
    }
  }, [data, repository]);

  const currentBusiness = useMemo(
    () => data.businesses.find(business => business.id === data.currentBusinessId) || null,
    [data.businesses, data.currentBusinessId]
  );

  // Filter businesses based on user access
  const accessibleBusinesses = useMemo(() => {
    const userId = data.userSettings.userId;
    if (!userId) return data.businesses; // Backward compatibility
    const accessibleIds = getUserAccessibleBusinessIds(data, userId);
    return data.businesses.filter(b => accessibleIds.includes(b.id));
  }, [data]);

  // Helper: addBusiness
  const addBusiness: BusinessContextProps['addBusiness'] = (input) => {
    const now = new Date().toISOString();
    const business: Business = {
      id: repository.generateId(),
      name: input.name,
      type: input.type,
      businessModel: input.businessModel,
      currency: input.currency,
      currentBalance: input.currentBalance,
      minimumBalance: input.minimumBalance,
      createdAt: now,
      updatedAt: now,
    };
    dispatch({ type: 'ADD_BUSINESS', payload: business });
    dispatch({ type: 'SET_CURRENT_BUSINESS', payload: business.id });
  };

  const switchBusiness: BusinessContextProps['switchBusiness'] = (id) => {
    dispatch({ type: 'SET_CURRENT_BUSINESS', payload: id });
  };

  const addProject: BusinessContextProps['addProject'] = (projectData) => {
    const now = new Date().toISOString();
    const project: Project = {
      ...projectData,
      id: repository.generateId(),
      createdAt: now,
      updatedAt: now,
    };
    dispatch({ type: 'ADD_PROJECT', payload: project });
  };

  const updateProject: BusinessContextProps['updateProject'] = (id, updates) => {
    dispatch({ type: 'UPDATE_PROJECT', payload: { id, updates } });
  };

  const exportData = (): string => {
    const exported = repository.export();
    return JSON.stringify(exported, null, 2);
  };

  const importData = (jsonString: string): void => {
    const importedData = repository.import(jsonString);
    dispatch({ type: 'LOAD_DATA', payload: importedData });
  };

  // Switch to a different venture/workspace — updates JWT workspace_id and reloads data
  const switchVenture = async (workspaceId: string): Promise<void> => {
    setIsLoadingFromDB(true);
    try {
      // Update JWT metadata so RLS uses the new workspace_id
      await supabase.auth.updateUser({ data: { workspace_id: workspaceId } });
      await supabase.auth.refreshSession();
      // Reload data from the new workspace
      if (repository instanceof SupabaseDBRepository) {
        const newData = await repository.loadAsync();
        dispatch({ type: 'LOAD_DATA', payload: newData });
      }
    } finally {
      setIsLoadingFromDB(false);
    }
  };

  const value = useMemo(
    () => ({
      data,
      currentBusiness,
      accessibleBusinesses,
      dispatch,
      isLoadingFromDB,
      addBusiness,
      switchBusiness,
      addProject,
      updateProject,
      exportData,
      importData,
      switchVenture,
    }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [data, currentBusiness, accessibleBusinesses, isLoadingFromDB, repository]
  );

  return (
    <BusinessContext.Provider value={value}>
      {children}
    </BusinessContext.Provider>
  );
};
