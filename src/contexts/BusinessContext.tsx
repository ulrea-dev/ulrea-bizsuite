import React, { createContext, useContext, useReducer, useEffect, useMemo, useRef } from 'react';
import {
  AppData,
  Business,
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
  dispatch: React.Dispatch<BusinessAction>;
  // Helper functions used by components
  addBusiness: (input: {
    name: string;
    type: string;
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
  children: React.ReactNode;
}

export const BusinessProvider: React.FC<BusinessProviderProps> = ({ children }) => {
  const { repository } = useRepository();
  
  // Initialize state from repository
  const [data, dispatch] = useReducer(rootReducer, repository.load());

  const isInitialMount = useRef(true);

  // Save to repository whenever data changes
  useEffect(() => {
    repository.save(data);
    
    // Only dispatch sync event if not restoring and not initial mount
    if (!isRestoringData && !isInitialMount.current) {
      window.dispatchEvent(new CustomEvent('bizsuite-data-change', { detail: data }));
    }
    
    // After first render, mark as not initial
    if (isInitialMount.current) {
      isInitialMount.current = false;
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

  // Helper: addBusiness used by BusinessSetup
  const addBusiness: BusinessContextProps['addBusiness'] = (input) => {
    const now = new Date().toISOString();
    const business: Business = {
      id: repository.generateId(),
      name: input.name,
      type: input.type,
      currency: input.currency,
      currentBalance: input.currentBalance,
      minimumBalance: input.minimumBalance,
      createdAt: now,
      updatedAt: now,
    };
    dispatch({ type: 'ADD_BUSINESS', payload: business });
    // Set as current after creation
    dispatch({ type: 'SET_CURRENT_BUSINESS', payload: business.id });
  };

  // Helper: switchBusiness used by Sidebar and management pages
  const switchBusiness: BusinessContextProps['switchBusiness'] = (id) => {
    dispatch({ type: 'SET_CURRENT_BUSINESS', payload: id });
  };

  // Helper: addProject
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

  // Helper: updateProject
  const updateProject: BusinessContextProps['updateProject'] = (id, updates) => {
    dispatch({ type: 'UPDATE_PROJECT', payload: { id, updates } });
  };

  // Export data with metadata for complete backup
  const exportData = (): string => {
    const exported = repository.export();
    return JSON.stringify(exported, null, 2);
  };

  // Import data from backup
  const importData = (jsonString: string): void => {
    const importedData = repository.import(jsonString);
    dispatch({ type: 'LOAD_DATA', payload: importedData });
  };

  const value = useMemo(
    () => ({
      data,
      currentBusiness,
      accessibleBusinesses,
      dispatch,
      addBusiness,
      switchBusiness,
      addProject,
      updateProject,
      exportData,
      importData,
    }),
    [data, currentBusiness, accessibleBusinesses, repository]
  );

  return (
    <BusinessContext.Provider value={value}>
      {children}
    </BusinessContext.Provider>
  );
};
