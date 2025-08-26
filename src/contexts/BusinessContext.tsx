
import React, { createContext, useContext, useReducer, useEffect } from 'react';
import { AppData, Business, Project, TeamMember, Client } from '@/types/business';
import { loadData, saveData, generateId } from '@/utils/storage';

interface BusinessContextType {
  data: AppData;
  currentBusiness: Business | null;
  dispatch: React.Dispatch<BusinessAction>;
  addBusiness: (business: Omit<Business, 'id' | 'createdAt' | 'updatedAt'>) => void;
  switchBusiness: (businessId: string) => void;
  addProject: (project: Omit<Project, 'id' | 'createdAt' | 'updatedAt'>) => void;
  updateProject: (projectId: string, updates: Partial<Project>) => void;
}

type BusinessAction = 
  | { type: 'LOAD_DATA'; payload: AppData }
  | { type: 'SET_CURRENT_BUSINESS'; payload: string | null }
  | { type: 'ADD_BUSINESS'; payload: Business }
  | { type: 'ADD_PROJECT'; payload: Project }
  | { type: 'UPDATE_PROJECT'; payload: { id: string; updates: Partial<Project> } }
  | { type: 'SET_USERNAME'; payload: string };

const BusinessContext = createContext<BusinessContextType | undefined>(undefined);

const businessReducer = (state: AppData, action: BusinessAction): AppData => {
  switch (action.type) {
    case 'LOAD_DATA':
      return action.payload;
    
    case 'SET_CURRENT_BUSINESS':
      return { ...state, currentBusinessId: action.payload };
    
    case 'ADD_BUSINESS':
      return {
        ...state,
        businesses: [...state.businesses, action.payload],
        currentBusinessId: state.currentBusinessId || action.payload.id,
      };
    
    case 'ADD_PROJECT':
      return {
        ...state,
        projects: [...state.projects, action.payload],
      };
    
    case 'UPDATE_PROJECT':
      return {
        ...state,
        projects: state.projects.map(project =>
          project.id === action.payload.id
            ? { ...project, ...action.payload.updates, updatedAt: new Date().toISOString() }
            : project
        ),
      };
    
    case 'SET_USERNAME':
      return {
        ...state,
        userSettings: {
          ...state.userSettings,
          username: action.payload,
        },
      };
    
    default:
      return state;
  }
};

export const BusinessProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [data, dispatch] = useReducer(businessReducer, loadData());

  const currentBusiness = data.currentBusinessId
    ? data.businesses.find(b => b.id === data.currentBusinessId) || null
    : null;

  // Save to localStorage whenever data changes
  useEffect(() => {
    saveData(data);
  }, [data]);

  const addBusiness = (businessData: Omit<Business, 'id' | 'createdAt' | 'updatedAt'>) => {
    const business: Business = {
      ...businessData,
      id: generateId(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    dispatch({ type: 'ADD_BUSINESS', payload: business });
  };

  const switchBusiness = (businessId: string) => {
    dispatch({ type: 'SET_CURRENT_BUSINESS', payload: businessId });
  };

  const addProject = (projectData: Omit<Project, 'id' | 'createdAt' | 'updatedAt'>) => {
    const project: Project = {
      ...projectData,
      id: generateId(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    dispatch({ type: 'ADD_PROJECT', payload: project });
  };

  const updateProject = (projectId: string, updates: Partial<Project>) => {
    dispatch({ type: 'UPDATE_PROJECT', payload: { id: projectId, updates } });
  };

  return (
    <BusinessContext.Provider value={{
      data,
      currentBusiness,
      dispatch,
      addBusiness,
      switchBusiness,
      addProject,
      updateProject,
    }}>
      {children}
    </BusinessContext.Provider>
  );
};

export const useBusiness = () => {
  const context = useContext(BusinessContext);
  if (!context) {
    throw new Error('useBusiness must be used within BusinessProvider');
  }
  return context;
};
