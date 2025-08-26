import React, { createContext, useContext, useReducer, useEffect } from 'react';
import { AppData, Business, Project, TeamMember, Client, Partner, Payment, TeamAllocation, PartnerAllocation, FontOption, ColorPalette } from '@/types/business';
import { loadData, saveData, generateId } from '@/utils/storage';
import { applyFont, applyColorPalette } from '@/utils/appearance';
import { useTheme } from '@/hooks/useTheme';

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
  | { type: 'ADD_TEAM_MEMBER'; payload: TeamMember }
  | { type: 'UPDATE_TEAM_MEMBER'; payload: { id: string; updates: Partial<TeamMember> } }
  | { type: 'ADD_PARTNER'; payload: Partner }
  | { type: 'UPDATE_PARTNER'; payload: { id: string; updates: Partial<Partner> } }
  | { type: 'ADD_CLIENT'; payload: Client }
  | { type: 'UPDATE_CLIENT'; payload: { id: string; updates: Partial<Client> } }
  | { type: 'ADD_PAYMENT'; payload: Payment }
  | { type: 'UPDATE_PAYMENT'; payload: { id: string; updates: Partial<Payment> } }
  | { type: 'ADD_TEAM_ALLOCATION'; payload: { projectId: string; allocation: TeamAllocation } }
  | { type: 'ADD_PARTNER_ALLOCATION'; payload: { projectId: string; allocation: PartnerAllocation } }
  
  | { type: 'UPDATE_BUSINESS'; payload: { id: string; updates: Partial<Business> } }
  | { type: 'DELETE_BUSINESS'; payload: string }
  | { type: 'SET_USERNAME'; payload: string }
  | { type: 'SET_FONT'; payload: FontOption }
  | { type: 'SET_COLOR_PALETTE'; payload: ColorPalette };

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
    
    case 'ADD_TEAM_MEMBER':
      return {
        ...state,
        teamMembers: [...state.teamMembers, action.payload],
      };
    
    case 'UPDATE_TEAM_MEMBER':
      return {
        ...state,
        teamMembers: state.teamMembers.map(member =>
          member.id === action.payload.id
            ? { ...member, ...action.payload.updates }
            : member
        ),
      };
    
    case 'ADD_PARTNER':
      return {
        ...state,
        partners: [...state.partners, action.payload],
      };
    
    case 'UPDATE_PARTNER':
      return {
        ...state,
        partners: state.partners.map(partner =>
          partner.id === action.payload.id
            ? { ...partner, ...action.payload.updates }
            : partner
        ),
      };
    
    case 'ADD_CLIENT':
      return {
        ...state,
        clients: [...state.clients, action.payload],
      };
    
    case 'UPDATE_CLIENT':
      return {
        ...state,
        clients: state.clients.map(client =>
          client.id === action.payload.id
            ? { ...client, ...action.payload.updates }
            : client
        ),
      };

    case 'ADD_PAYMENT':
      return {
        ...state,
        payments: [...state.payments, action.payload],
      };
    
    case 'UPDATE_PAYMENT':
      return {
        ...state,
        payments: state.payments.map(payment =>
          payment.id === action.payload.id
            ? { ...payment, ...action.payload.updates }
            : payment
        ),
      };

    case 'ADD_TEAM_ALLOCATION':
      return {
        ...state,
        projects: state.projects.map(project =>
          project.id === action.payload.projectId
            ? { 
                ...project, 
                teamAllocations: [...(project.teamAllocations || []), action.payload.allocation],
                updatedAt: new Date().toISOString() 
              }
            : project
        ),
      };

    case 'ADD_PARTNER_ALLOCATION':
      return {
        ...state,
        projects: state.projects.map(project =>
          project.id === action.payload.projectId
            ? { 
                ...project, 
                partnerAllocations: [...(project.partnerAllocations || []), action.payload.allocation],
                updatedAt: new Date().toISOString() 
              }
            : project
        ),
      };

    case 'UPDATE_BUSINESS':
      return {
        ...state,
        businesses: state.businesses.map(business =>
          business.id === action.payload.id
            ? { ...business, ...action.payload.updates }
            : business
        ),
      };

    case 'DELETE_BUSINESS':
      return {
        ...state,
        businesses: state.businesses.filter(business => business.id !== action.payload),
        projects: state.projects.filter(project => project.businessId !== action.payload),
        currentBusinessId: state.currentBusinessId === action.payload ? null : state.currentBusinessId,
      };
    
    case 'SET_USERNAME':
      return {
        ...state,
        userSettings: {
          ...state.userSettings,
          username: action.payload,
        },
      };

    case 'SET_FONT':
      return {
        ...state,
        userSettings: {
          ...state.userSettings,
          fontFamily: action.payload,
        },
      };

    case 'SET_COLOR_PALETTE':
      return {
        ...state,
        userSettings: {
          ...state.userSettings,
          colorPalette: action.payload,
        },
      };
    
    default:
      return state;
  }
};

export const BusinessProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { theme } = useTheme();
  
  let initialData;
  try {
    initialData = loadData();
    console.log('BusinessProvider: Data loaded successfully', initialData);
  } catch (error) {
    console.error('BusinessProvider: Error loading data', error);
    // Fallback to basic initial data
    initialData = {
      businesses: [],
      projects: [],
      teamMembers: [],
      partners: [],
      clients: [],
      payments: [],
      currentBusinessId: null,
      userSettings: {
        username: '',
        theme: 'light' as const,
        defaultCurrency: { code: 'USD', name: 'US Dollar', symbol: '$' },
        fontFamily: undefined,
        colorPalette: undefined,
      },
    };
  }
  
  const [data, dispatch] = useReducer(businessReducer, initialData);

  const currentBusiness = data.currentBusinessId
    ? data.businesses.find(b => b.id === data.currentBusinessId) || null
    : null;

  // Save to localStorage whenever data changes
  useEffect(() => {
    saveData(data);
  }, [data]);

  // Apply font and color palette on load and when they change
  useEffect(() => {
    if (data.userSettings.fontFamily) {
      applyFont(data.userSettings.fontFamily);
    }
    if (data.userSettings.colorPalette) {
      const isDark = theme === 'dark';
      applyColorPalette(data.userSettings.colorPalette, isDark);
    }
  }, [data.userSettings.fontFamily, data.userSettings.colorPalette, theme]);

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
