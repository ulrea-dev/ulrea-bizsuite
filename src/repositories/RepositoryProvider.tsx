import React, { createContext, useContext, useMemo } from 'react';
import { IDataRepository } from './IDataRepository';
import { LocalStorageRepository } from './LocalStorageRepository';

/**
 * Repository Context
 * 
 * This context provides dependency injection for the data repository.
 * Components can use the useRepository() hook to access data operations
 * without knowing the underlying storage mechanism.
 * 
 * To switch storage backends:
 * 1. Create a new class implementing IDataRepository (e.g., SupabaseRepository)
 * 2. Update the defaultRepository in this file
 * 3. All components will automatically use the new storage
 */

interface RepositoryContextValue {
  repository: IDataRepository;
}

const RepositoryContext = createContext<RepositoryContextValue | undefined>(undefined);

/**
 * Hook to access the data repository
 * 
 * @example
 * const { repository } = useRepository();
 * const data = repository.load();
 * repository.save(updatedData);
 */
export const useRepository = (): RepositoryContextValue => {
  const context = useContext(RepositoryContext);
  if (!context) {
    throw new Error('useRepository must be used within a RepositoryProvider');
  }
  return context;
};

interface RepositoryProviderProps {
  children: React.ReactNode;
  /**
   * Optional custom repository implementation
   * If not provided, LocalStorageRepository is used
   */
  repository?: IDataRepository;
}

/**
 * Repository Provider Component
 * 
 * Wraps the application and provides the data repository via context.
 * For database integration, pass a different repository implementation.
 * 
 * @example
 * // Using default localStorage
 * <RepositoryProvider>
 *   <App />
 * </RepositoryProvider>
 * 
 * // Using custom repository (future Supabase integration)
 * <RepositoryProvider repository={supabaseRepository}>
 *   <App />
 * </RepositoryProvider>
 */
export const RepositoryProvider: React.FC<RepositoryProviderProps> = ({ 
  children, 
  repository 
}) => {
  // Use provided repository or default to localStorage
  const activeRepository = useMemo(
    () => repository || new LocalStorageRepository(),
    [repository]
  );

  const value = useMemo(
    () => ({ repository: activeRepository }),
    [activeRepository]
  );

  return (
    <RepositoryContext.Provider value={value}>
      {children}
    </RepositoryContext.Provider>
  );
};

export default RepositoryProvider;
