import React, { createContext, useContext, useMemo } from 'react';
import { IDataRepository } from './IDataRepository';
import { SupabaseDBRepository } from './SupabaseDBRepository';

/**
 * Repository Context
 *
 * Provides the active data repository via React context (dependency injection).
 * Default: SupabaseDBRepository — all data stored in Supabase DB tables with RLS.
 */

interface RepositoryContextValue {
  repository: IDataRepository;
}

const RepositoryContext = createContext<RepositoryContextValue | undefined>(undefined);

export const useRepository = (): RepositoryContextValue => {
  const context = useContext(RepositoryContext);
  if (!context) {
    throw new Error('useRepository must be used within a RepositoryProvider');
  }
  return context;
};

interface RepositoryProviderProps {
  children: React.ReactNode;
  repository?: IDataRepository;
}

export const RepositoryProvider: React.FC<RepositoryProviderProps> = ({
  children,
  repository,
}) => {
  const activeRepository = useMemo(
    () => repository || new SupabaseDBRepository(),
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
