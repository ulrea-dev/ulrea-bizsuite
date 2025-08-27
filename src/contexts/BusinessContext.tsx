import React, { createContext, useContext, useReducer, useEffect } from 'react';
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
} from '@/types/business';
import { loadData, saveData, generateId } from '@/utils/storage';

interface BusinessContextProps {
  data: AppData;
  currentBusiness: Business | null;
  dispatch: React.Dispatch<BusinessAction>;
  // Added helpers used by components
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
  | { type: 'ADD_PAYROLL_PERIOD'; payload: PayrollPeriod }
  | { type: 'UPDATE_PAYROLL_PERIOD'; payload: { id: string; updates: Partial<PayrollPeriod> } }
  | { type: 'ADD_PAYSLIP'; payload: Payslip }
  | { type: 'ADD_EXCHANGE_RATE'; payload: ExchangeRate }
  | { type: 'UPDATE_EXCHANGE_RATE'; payload: { id: string; updates: Partial<ExchangeRate> } }
  | { type: 'DELETE_EXCHANGE_RATE'; payload: string }
  | { type: 'SET_USERNAME'; payload: string }
  | { type: 'SET_THEME'; payload: 'light' | 'dark' }
  | { type: 'SET_FONT'; payload: any }
  | { type: 'SET_COLOR_PALETTE'; payload: any }
  | { type: 'SET_DEFAULT_CURRENCY'; payload: Currency }
  | { type: 'ADD_CUSTOM_CURRENCY'; payload: Currency }
  | { type: 'DELETE_CUSTOM_CURRENCY'; payload: string }
  // Partner actions
  | { type: 'ADD_PARTNER'; payload: Partner }
  | { type: 'UPDATE_PARTNER'; payload: { id: string; updates: Partial<Partner> } }
  | { type: 'DELETE_PARTNER'; payload: string }
  // Expense actions
  | { type: 'ADD_EXPENSE'; payload: Expense }
  | { type: 'UPDATE_EXPENSE'; payload: { id: string; updates: Partial<Expense> } }
  | { type: 'DELETE_EXPENSE'; payload: string }
  // Added actions for allocations and client payments
  | { type: 'ADD_ALLOCATION'; payload: { projectId: string; allocation: ProjectAllocation } }
  | { type: 'UPDATE_ALLOCATION'; payload: { projectId: string; allocationId: string; updates: Partial<ProjectAllocation> } }
  | { type: 'DELETE_ALLOCATION'; payload: { projectId: string; allocationId: string } }
  | { type: 'ADD_TEAM_ALLOCATION'; payload: { projectId: string; allocation: TeamAllocation } } // legacy per-project
  | { type: 'ADD_PARTNER_ALLOCATION'; payload: { projectId: string; allocation: PartnerAllocation } } // legacy per-project
  | { type: 'SET_COMPANY_ALLOCATION'; payload: { projectId: string; allocation: CompanyAllocation } } // legacy per-project
  | { type: 'ADD_ALLOCATION_TEAM_ALLOCATION'; payload: { projectId: string; allocation: AllocationTeamAllocation } }
  | { type: 'UPDATE_ALLOCATION_TEAM_ALLOCATION'; payload: { projectId: string; allocationId: string; memberId: string; updates: Partial<AllocationTeamAllocation> } }
  | { type: 'REMOVE_ALLOCATION_TEAM_ALLOCATION'; payload: { projectId: string; allocationId: string; memberId: string } }
  | { type: 'ADD_ALLOCATION_PARTNER_ALLOCATION'; payload: { projectId: string; allocation: AllocationPartnerAllocation } }
  | { type: 'UPDATE_ALLOCATION_PARTNER_ALLOCATION'; payload: { projectId: string; allocationId: string; partnerId: string; updates: Partial<AllocationPartnerAllocation> } }
  | { type: 'REMOVE_ALLOCATION_PARTNER_ALLOCATION'; payload: { projectId: string; allocationId: string; partnerId: string } }
  | { type: 'SET_ALLOCATION_COMPANY_ALLOCATION'; payload: { projectId: string; allocation: AllocationCompanyAllocation } }
  | { type: 'UPDATE_ALLOCATION_COMPANY_ALLOCATION'; payload: { projectId: string; allocationId: string; updates: Partial<AllocationCompanyAllocation> } }
  | { type: 'UPDATE_CLIENT_PAYMENTS'; payload: { projectId: string; clientPayments: number } }
  // Quick Task actions
  | { type: 'ADD_QUICK_TASK'; payload: QuickTask }
  | { type: 'UPDATE_QUICK_TASK'; payload: { id: string; updates: Partial<QuickTask> } }
  | { type: 'DELETE_QUICK_TASK'; payload: string }
  | { type: 'COMPLETE_QUICK_TASK'; payload: { id: string; paidAt: string } };

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
          business.id === action.payload.id ? { ...business, ...action.payload.updates, updatedAt: new Date().toISOString() } : business
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
          project.id === action.payload.id ? { ...project, ...action.payload.updates, updatedAt: new Date().toISOString() } : project
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
    case 'ADD_PAYMENT': {
      const payment = action.payload;
      const updatedState = { ...state, payments: [...state.payments, payment] };
      
      // If this is a team member payment with an allocation, update the allocation amounts
      if (payment.recipientType === 'team' && payment.memberId && payment.allocationId && payment.projectId) {
        updatedState.projects = state.projects.map(project => {
          if (project.id === payment.projectId) {
            const updatedProject = { ...project };
            
            // Update allocationTeamAllocations
            if (updatedProject.allocationTeamAllocations) {
              updatedProject.allocationTeamAllocations = updatedProject.allocationTeamAllocations.map(teamAlloc => {
                if (teamAlloc.allocationId === payment.allocationId && teamAlloc.memberId === payment.memberId) {
                  const newPaidAmount = teamAlloc.paidAmount + payment.amount;
                  const newOutstanding = teamAlloc.totalAllocated - newPaidAmount;
                  return {
                    ...teamAlloc,
                    paidAmount: newPaidAmount,
                    outstanding: Math.max(0, newOutstanding)
                  };
                }
                return teamAlloc;
              });
            }
            
            return { ...updatedProject, updatedAt: new Date().toISOString() };
          }
          return project;
        });
      }
      
      return updatedState;
    }
    case 'UPDATE_PAYMENT': {
      const oldPayment = state.payments.find(p => p.id === action.payload.id);
      const updatedPayment = oldPayment ? { ...oldPayment, ...action.payload.updates } : null;
      
      const updatedState = {
        ...state,
        payments: state.payments.map(payment =>
          payment.id === action.payload.id ? { ...payment, ...action.payload.updates } : payment
        ),
      };
      
      // If this affects a team member allocation, recalculate allocation amounts
      if (oldPayment && updatedPayment && oldPayment.recipientType === 'team' && oldPayment.memberId && oldPayment.allocationId && oldPayment.projectId) {
        const amountDifference = updatedPayment.amount - oldPayment.amount;
        
        updatedState.projects = state.projects.map(project => {
          if (project.id === oldPayment.projectId) {
            const updatedProject = { ...project };
            
            // Update allocationTeamAllocations
            if (updatedProject.allocationTeamAllocations) {
              updatedProject.allocationTeamAllocations = updatedProject.allocationTeamAllocations.map(teamAlloc => {
                if (teamAlloc.allocationId === oldPayment.allocationId && teamAlloc.memberId === oldPayment.memberId) {
                  const newPaidAmount = teamAlloc.paidAmount + amountDifference;
                  const newOutstanding = teamAlloc.totalAllocated - newPaidAmount;
                  return {
                    ...teamAlloc,
                    paidAmount: newPaidAmount,
                    outstanding: Math.max(0, newOutstanding)
                  };
                }
                return teamAlloc;
              });
            }
            
            return { ...updatedProject, updatedAt: new Date().toISOString() };
          }
          return project;
        });
      }
      
      return updatedState;
    }
    case 'DELETE_PAYMENT': {
      const deletedPayment = state.payments.find(p => p.id === action.payload);
      
      const updatedState = {
        ...state,
        payments: state.payments.filter(payment => payment.id !== action.payload),
      };
      
      // If this was a team member allocation payment, adjust allocation amounts
      if (deletedPayment && deletedPayment.recipientType === 'team' && deletedPayment.memberId && deletedPayment.allocationId && deletedPayment.projectId) {
        updatedState.projects = state.projects.map(project => {
          if (project.id === deletedPayment.projectId) {
            const updatedProject = { ...project };
            
            // Update allocationTeamAllocations
            if (updatedProject.allocationTeamAllocations) {
              updatedProject.allocationTeamAllocations = updatedProject.allocationTeamAllocations.map(teamAlloc => {
                if (teamAlloc.allocationId === deletedPayment.allocationId && teamAlloc.memberId === deletedPayment.memberId) {
                  const newPaidAmount = teamAlloc.paidAmount - deletedPayment.amount;
                  const newOutstanding = teamAlloc.totalAllocated - newPaidAmount;
                  return {
                    ...teamAlloc,
                    paidAmount: Math.max(0, newPaidAmount),
                    outstanding: Math.max(0, newOutstanding)
                  };
                }
                return teamAlloc;
              });
            }
            
            return { ...updatedProject, updatedAt: new Date().toISOString() };
          }
          return project;
        });
      }
      
      return updatedState;
    }
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
    case 'ADD_PAYROLL_PERIOD':
      return { ...state, payrollPeriods: [...(state.payrollPeriods || []), action.payload] };
    case 'UPDATE_PAYROLL_PERIOD':
      return {
        ...state,
        payrollPeriods: (state.payrollPeriods || []).map(period =>
          period.id === action.payload.id ? { ...period, ...action.payload.updates } : period
        ),
      };
    case 'ADD_PAYSLIP':
      return { ...state, payslips: [...(state.payslips || []), action.payload] };
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
    case 'SET_DEFAULT_CURRENCY': {
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
    }
    case 'ADD_CUSTOM_CURRENCY': {
      const stateWithNewCurrency = {
        ...state,
        customCurrencies: [...(state.customCurrencies || []), action.payload],
      };
      saveData(stateWithNewCurrency);
      return stateWithNewCurrency;
    }
    case 'DELETE_CUSTOM_CURRENCY': {
      const stateWithoutCurrency = {
        ...state,
        customCurrencies: (state.customCurrencies || []).filter(c => c.code !== action.payload),
      };
      saveData(stateWithoutCurrency);
      return stateWithoutCurrency;
    }

    // Partner actions
    case 'ADD_PARTNER':
      return { ...state, partners: [...(state.partners || []), action.payload] };
    case 'UPDATE_PARTNER':
      return {
        ...state,
        partners: (state.partners || []).map(partner =>
          partner.id === action.payload.id ? { ...partner, ...action.payload.updates } : partner
        ),
      };
    case 'DELETE_PARTNER':
      return {
        ...state,
        partners: (state.partners || []).filter(partner => partner.id !== action.payload),
      };

    // Expense actions
    case 'ADD_EXPENSE':
      return {
        ...state,
        projects: state.projects.map(p =>
          p.id === action.payload.projectId
            ? { ...p, expenses: [...(p.expenses || []), action.payload], updatedAt: new Date().toISOString() }
            : p
        ),
      };
    case 'UPDATE_EXPENSE':
      return {
        ...state,
        projects: state.projects.map(p => ({
          ...p,
          expenses: (p.expenses || []).map(expense =>
            expense.id === action.payload.id ? { ...expense, ...action.payload.updates, updatedAt: new Date().toISOString() } : expense
          ),
          updatedAt: new Date().toISOString(),
        })),
      };
    case 'DELETE_EXPENSE':
      return {
        ...state,
        projects: state.projects.map(p => ({
          ...p,
          expenses: (p.expenses || []).filter(expense => expense.id !== action.payload),
          updatedAt: new Date().toISOString(),
        })),
      };

    // Allocations per project (phases)
    case 'ADD_ALLOCATION':
      return {
        ...state,
        projects: state.projects.map(p =>
          p.id === action.payload.projectId
            ? { ...p, allocations: [...(p.allocations || []), action.payload.allocation], updatedAt: new Date().toISOString() }
            : p
        ),
      };
    case 'UPDATE_ALLOCATION':
      return {
        ...state,
        projects: state.projects.map(p =>
          p.id === action.payload.projectId
            ? {
                ...p,
                allocations: (p.allocations || []).map(a =>
                  a.id === action.payload.allocationId ? { ...a, ...action.payload.updates, updatedAt: new Date().toISOString() } : a
                ),
                updatedAt: new Date().toISOString(),
              }
            : p
        ),
      };
    case 'DELETE_ALLOCATION':
      return {
        ...state,
        projects: state.projects.map(p =>
          p.id === action.payload.projectId
            ? {
                ...p,
                allocations: (p.allocations || []).filter(a => a.id !== action.payload.allocationId),
                updatedAt: new Date().toISOString(),
              }
            : p
        ),
      };

    // Legacy per-project allocations (still referenced)
    case 'ADD_TEAM_ALLOCATION':
      return {
        ...state,
        projects: state.projects.map(p =>
          p.id === action.payload.projectId
            ? { ...p, teamAllocations: [...(p.teamAllocations || []), action.payload.allocation], updatedAt: new Date().toISOString() }
            : p
        ),
      };
    case 'ADD_PARTNER_ALLOCATION':
      return {
        ...state,
        projects: state.projects.map(p =>
          p.id === action.payload.projectId
            ? { ...p, partnerAllocations: [...(p.partnerAllocations || []), action.payload.allocation], updatedAt: new Date().toISOString() }
            : p
        ),
      };
    case 'SET_COMPANY_ALLOCATION':
      return {
        ...state,
        projects: state.projects.map(p =>
          p.id === action.payload.projectId
            ? { ...p, companyAllocation: action.payload.allocation, updatedAt: new Date().toISOString() }
            : p
        ),
      };

    // Allocation-specific allocations
    case 'ADD_ALLOCATION_TEAM_ALLOCATION':
      return {
        ...state,
        projects: state.projects.map(p =>
          p.id === action.payload.projectId
            ? {
                ...p,
                allocationTeamAllocations: [
                  ...(p.allocationTeamAllocations || []).filter(
                    a => !(a.allocationId === action.payload.allocation.allocationId && a.memberId === action.payload.allocation.memberId)
                  ),
                  action.payload.allocation,
                ],
                updatedAt: new Date().toISOString(),
              }
            : p
        ),
      };
    case 'REMOVE_ALLOCATION_TEAM_ALLOCATION':
      return {
        ...state,
        projects: state.projects.map(p =>
          p.id === action.payload.projectId
            ? {
                ...p,
                allocationTeamAllocations: (p.allocationTeamAllocations || []).filter(
                  a => !(a.allocationId === action.payload.allocationId && a.memberId === action.payload.memberId)
                ),
                updatedAt: new Date().toISOString(),
              }
            : p
        ),
      };
    case 'ADD_ALLOCATION_PARTNER_ALLOCATION':
      return {
        ...state,
        projects: state.projects.map(p =>
          p.id === action.payload.projectId
            ? {
                ...p,
                allocationPartnerAllocations: [
                  ...(p.allocationPartnerAllocations || []).filter(
                    a => !(a.allocationId === action.payload.allocation.allocationId && a.partnerId === action.payload.allocation.partnerId)
                  ),
                  action.payload.allocation,
                ],
                updatedAt: new Date().toISOString(),
              }
            : p
        ),
      };
    case 'REMOVE_ALLOCATION_PARTNER_ALLOCATION':
      return {
        ...state,
        projects: state.projects.map(p =>
          p.id === action.payload.projectId
            ? {
                ...p,
                allocationPartnerAllocations: (p.allocationPartnerAllocations || []).filter(
                  a => !(a.allocationId === action.payload.allocationId && a.partnerId === action.payload.partnerId)
                ),
                updatedAt: new Date().toISOString(),
              }
            : p
        ),
      };
    case 'UPDATE_ALLOCATION_TEAM_ALLOCATION':
      return {
        ...state,
        projects: state.projects.map(p =>
          p.id === action.payload.projectId
            ? {
                ...p,
                allocationTeamAllocations: (p.allocationTeamAllocations || []).map(a =>
                  a.allocationId === action.payload.allocationId && a.memberId === action.payload.memberId
                    ? { ...a, ...action.payload.updates }
                    : a
                ),
                updatedAt: new Date().toISOString(),
              }
            : p
        ),
      };
    case 'UPDATE_ALLOCATION_PARTNER_ALLOCATION':
      return {
        ...state,
        projects: state.projects.map(p =>
          p.id === action.payload.projectId
            ? {
                ...p,
                allocationPartnerAllocations: (p.allocationPartnerAllocations || []).map(a =>
                  a.allocationId === action.payload.allocationId && a.partnerId === action.payload.partnerId
                    ? { ...a, ...action.payload.updates }
                    : a
                ),
                updatedAt: new Date().toISOString(),
              }
            : p
        ),
      };
    case 'SET_ALLOCATION_COMPANY_ALLOCATION':
      return {
        ...state,
        projects: state.projects.map(p =>
          p.id === action.payload.projectId
            ? {
                ...p,
                allocationCompanyAllocations: [
                  ...(p.allocationCompanyAllocations || []).filter(
                    a => a.allocationId !== action.payload.allocation.allocationId
                  ),
                  action.payload.allocation,
                ],
                updatedAt: new Date().toISOString(),
              }
            : p
        ),
      };
    case 'UPDATE_ALLOCATION_COMPANY_ALLOCATION':
      return {
        ...state,
        projects: state.projects.map(p =>
          p.id === action.payload.projectId
            ? {
                ...p,
                allocationCompanyAllocations: (p.allocationCompanyAllocations || []).map(a =>
                  a.allocationId === action.payload.allocationId
                    ? { ...a, ...action.payload.updates }
                    : a
                ),
                updatedAt: new Date().toISOString(),
              }
            : p
        ),
      };

    case 'UPDATE_CLIENT_PAYMENTS':
      return {
        ...state,
        projects: state.projects.map(p =>
          p.id === action.payload.projectId
            ? { ...p, clientPayments: action.payload.clientPayments, updatedAt: new Date().toISOString() }
            : p
        ),
      };

    // Quick Task actions
    case 'ADD_QUICK_TASK':
      return { ...state, quickTasks: [...(state.quickTasks || []), action.payload] };
    case 'UPDATE_QUICK_TASK':
      return {
        ...state,
        quickTasks: (state.quickTasks || []).map(task =>
          task.id === action.payload.id ? { ...task, ...action.payload.updates, updatedAt: new Date().toISOString() } : task
        ),
      };
    case 'DELETE_QUICK_TASK':
      return {
        ...state,
        quickTasks: (state.quickTasks || []).filter(task => task.id !== action.payload),
      };
    case 'COMPLETE_QUICK_TASK':
      return {
        ...state,
        quickTasks: (state.quickTasks || []).map(task =>
          task.id === action.payload.id 
            ? { ...task, status: 'completed' as const, paidAt: action.payload.paidAt, updatedAt: new Date().toISOString() }
            : task
        ),
      };

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

  // Helper: addBusiness used by BusinessSetup
  const addBusiness: BusinessContextProps['addBusiness'] = (input) => {
    const now = new Date().toISOString();
    const business: Business = {
      id: generateId(),
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
      id: generateId(),
      createdAt: now,
      updatedAt: now,
    };
    dispatch({ type: 'ADD_PROJECT', payload: project });
  };

  // Helper: updateProject
  const updateProject: BusinessContextProps['updateProject'] = (id, updates) => {
    dispatch({ type: 'UPDATE_PROJECT', payload: { id, updates } });
  };

  return (
    <BusinessContext.Provider value={{ data, currentBusiness, dispatch, addBusiness, switchBusiness, addProject, updateProject }}>
      {children}
    </BusinessContext.Provider>
  );
};
