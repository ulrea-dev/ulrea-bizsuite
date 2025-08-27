import React, { createContext, useContext, useReducer, useEffect } from 'react';
import { AppData, Business, Project, TeamMember, Client, Payment, SalaryRecord, SalaryPayment, ExchangeRate, Currency } from '@/types/business';
import { loadData, saveData } from '@/utils/storage';

interface BusinessContextProps {
  data: AppData;
  currentBusiness: Business | null;
  dispatch: React.Dispatch<BusinessAction>;
}

const BusinessContext = createContext<BusinessContextProps | undefined>(undefined);

export const useBusiness = (): BusinessContextProps => {
  const context = useContext(BusinessContext);
  if (!context) {
    throw new Error('useBusiness must be used within a BusinessProvider');
  }
  return context;
};

export type BusinessAction =
  | { type: 'LOAD_DATA'; payload: AppData }
  | { type: 'ADD_BUSINESS'; payload: Business }
  | { type: 'UPDATE_BUSINESS'; payload: { id: string; updates: Partial<Business> } }
  | { type: 'DELETE_BUSINESS'; payload: string }
  | { type: 'SET_CURRENT_BUSINESS'; payload: string | null }
  | { type: 'ADD_PROJECT'; payload: Project }
  | { type: 'UPDATE_PROJECT'; payload: { id: string; updates: Partial<Project> } }
  | { type: 'DELETE_PROJECT'; payload: string }
  | { type: 'ADD_TEAM_MEMBER'; payload: TeamMember }
  | { type: 'UPDATE_TEAM_MEMBER'; payload: { id: string; updates: Partial<TeamMember> } }
  | { type: 'DELETE_TEAM_MEMBER'; payload: string }
  | { type: 'ADD_CLIENT'; payload: Client }
  | { type: 'UPDATE_CLIENT'; payload: { id: string; updates: Partial<Client> } }
  | { type: 'DELETE_CLIENT'; payload: string }
  | { type: 'ADD_PAYMENT'; payload: Payment }
  | { type: 'UPDATE_PAYMENT'; payload: { id: string; updates: Partial<Payment> } }
  | { type: 'DELETE_PAYMENT'; payload: string }
  | { type: 'ADD_SALARY_RECORD'; payload: SalaryRecord }
  | { type: 'UPDATE_SALARY_RECORD'; payload: { id: string; updates: Partial<SalaryRecord> } }
  | { type: 'DELETE_SALARY_RECORD'; payload: string }
  | { type: 'ADD_SALARY_PAYMENT'; payload: SalaryPayment }
  | { type: 'UPDATE_SALARY_PAYMENT'; payload: { id: string; updates: Partial<SalaryPayment> } }
  | { type: 'DELETE_SALARY_PAYMENT'; payload: string }
  | { type: 'ADD_EXCHANGE_RATE'; payload: ExchangeRate }
  | { type: 'UPDATE_EXCHANGE_RATE'; payload: { id: string; updates: Partial<ExchangeRate> } }
  | { type: 'DELETE_EXCHANGE_RATE'; payload: string }
  | { type: 'SET_USERNAME'; payload: string }
  | { type: 'SET_THEME'; payload: 'light' | 'dark' }
  | { type: 'SET_FONT'; payload: any }
  | { type: 'SET_COLOR_PALETTE'; payload: any }
  | { type: 'SET_DEFAULT_CURRENCY'; payload: Currency }
  | { type: 'ADD_CUSTOM_CURRENCY'; payload: Currency }
  | { type: 'DELETE_CUSTOM_CURRENCY'; payload: string };

const businessReducer = (state: AppData, action: BusinessAction): AppData => {
  switch (action.type) {
    case 'LOAD_DATA':
      return action.payload;
    case 'ADD_BUSINESS':
      return { ...state, businesses: [...state.businesses, action.payload] };
    case 'UPDATE_BUSINESS':
      return {
        ...state,
        businesses: state.businesses.map(business =>
          business.id === action.payload.id ? { ...business, ...action.payload.updates } : business
        ),
      };
    case 'DELETE_BUSINESS':
      return {
        ...state,
        businesses: state.businesses.filter(business => business.id !== action.payload),
      };
    case 'SET_CURRENT_BUSINESS':
      return { ...state, currentBusinessId: action.payload };
    case 'ADD_PROJECT':
      return { ...state, projects: [...state.projects, action.payload] };
    case 'UPDATE_PROJECT':
      return {
        ...state,
        projects: state.projects.map(project =>
          project.id === action.payload.id ? { ...project, ...action.payload.updates } : project
        ),
      };
    case 'DELETE_PROJECT':
      return {
        ...state,
        projects: state.projects.filter(project => project.id !== action.payload),
      };
    case 'ADD_TEAM_MEMBER':
      return { ...state, teamMembers: [...state.teamMembers, action.payload] };
    case 'UPDATE_TEAM_MEMBER':
      return {
        ...state,
        teamMembers: state.teamMembers.map(member =>
          member.id === action.payload.id ? { ...member, ...action.payload.updates } : member
        ),
      };
    case 'DELETE_TEAM_MEMBER':
      return {
        ...state,
        teamMembers: state.teamMembers.filter(member => member.id !== action.payload),
      };
    case 'ADD_CLIENT':
      return { ...state, clients: [...state.clients, action.payload] };
    case 'UPDATE_CLIENT':
      return {
        ...state,
        clients: state.clients.map(client =>
          client.id === action.payload.id ? { ...client, ...action.payload.updates } : client
        ),
      };
    case 'DELETE_CLIENT':
      return {
        ...state,
        clients: state.clients.filter(client => client.id !== action.payload),
      };
    case 'ADD_PAYMENT':
      return { ...state, payments: [...state.payments, action.payload] };
    case 'UPDATE_PAYMENT':
      return {
        ...state,
        payments: state.payments.map(payment =>
          payment.id === action.payload.id ? { ...payment, ...action.payload.updates } : payment
        ),
      };
    case 'DELETE_PAYMENT':
      return {
        ...state,
        payments: state.payments.filter(payment => payment.id !== action.payload),
      };
    case 'ADD_SALARY_RECORD':
      return { ...state, salaryRecords: [...state.salaryRecords, action.payload] };
    case 'UPDATE_SALARY_RECORD':
      return {
        ...state,
        salaryRecords: state.salaryRecords.map(record =>
          record.id === action.payload.id ? { ...record, ...action.payload.updates } : record
        ),
      };
    case 'DELETE_SALARY_RECORD':
      return {
        ...state,
        salaryRecords: state.salaryRecords.filter(record => record.id !== action.payload),
      };
    case 'ADD_SALARY_PAYMENT':
      return { ...state, salaryPayments: [...state.salaryPayments, action.payload] };
    case 'UPDATE_SALARY_PAYMENT':
      return {
        ...state,
        salaryPayments: state.salaryPayments.map(payment =>
          payment.id === action.payload.id ? { ...payment, ...action.payload.updates } : payment
        ),
      };
    case 'DELETE_SALARY_PAYMENT':
      return {
        ...state,
        salaryPayments: state.salaryPayments.filter(payment => payment.id !== action.payload),
      };
    case 'ADD_EXCHANGE_RATE':
      return { ...state, exchangeRates: [...state.exchangeRates, action.payload] };
    case 'UPDATE_EXCHANGE_RATE':
      return {
        ...state,
        exchangeRates: state.exchangeRates.map(rate =>
          rate.id === action.payload.id ? { ...rate, ...action.payload.updates } : rate
        ),
      };
    case 'DELETE_EXCHANGE_RATE':
      return {
        ...state,
        exchangeRates: state.exchangeRates.filter(rate => rate.id !== action.payload),
      };
    case 'SET_USERNAME':
      return {
        ...state,
        userSettings: { ...state.userSettings, username: action.payload },
      };
    case 'SET_THEME':
      return {
        ...state,
        userSettings: { ...state.userSettings, theme: action.payload },
      };
    case 'SET_FONT':
      return {
        ...state,
        userSettings: { ...state.userSettings, fontFamily: action.payload },
      };
    case 'SET_COLOR_PALETTE':
      return {
        ...state,
        userSettings: { ...state.userSettings, colorPalette: action.payload },
      };
    case 'SET_DEFAULT_CURRENCY':
      const updatedSettings = {
        ...state.userSettings,
        defaultCurrency: action.payload,
      };
      const updatedState = {
        ...state,
        userSettings: updatedSettings,
      };
      saveData(updatedState);
      return updatedState;

    case 'ADD_CUSTOM_CURRENCY':
      const stateWithNewCurrency = {
        ...state,
        customCurrencies: [...(state.customCurrencies || []), action.payload],
      };
      saveData(stateWithNewCurrency);
      return stateWithNewCurrency;

    case 'DELETE_CUSTOM_CURRENCY':
      const stateWithoutCurrency = {
        ...state,
        customCurrencies: (state.customCurrencies || []).filter(c => c.code !== action.payload),
      };
      saveData(stateWithoutCurrency);
      return stateWithoutCurrency;

    default:
      return state;
  }
};

interface BusinessProviderProps {
  children: React.ReactNode;
}

export const BusinessProvider: React.FC<BusinessProviderProps> = ({ children }) => {
  const [data, dispatch] = useReducer(businessReducer, loadData());

  useEffect(() => {
    saveData(data);
  }, [data]);

  const currentBusiness = data.businesses.find(business => business.id === data.currentBusinessId) || null;

  return (
    <BusinessContext.Provider value={{ data, currentBusiness, dispatch }}>
      {children}
    </BusinessContext.Provider>
  );
};
