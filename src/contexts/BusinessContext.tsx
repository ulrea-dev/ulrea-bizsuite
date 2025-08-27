import React, { createContext, useContext, useReducer, useEffect } from 'react';
import { AppData, Business, Project, TeamMember, Client, Partner, Payment, TeamAllocation, PartnerAllocation, CompanyAllocation, FontOption, ColorPalette, Expense, ProjectAllocation, AllocationTeamAllocation, AllocationPartnerAllocation, AllocationCompanyAllocation, SalaryRecord, SalaryPayment, ExchangeRate } from '@/types/business';
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
  | { type: 'DELETE_PROJECT'; payload: string }
  | { type: 'ADD_TEAM_MEMBER'; payload: TeamMember }
  | { type: 'UPDATE_TEAM_MEMBER'; payload: { id: string; updates: Partial<TeamMember> } }
  | { type: 'ADD_PARTNER'; payload: Partner }
  | { type: 'UPDATE_PARTNER'; payload: { id: string; updates: Partial<Partner> } }
  | { type: 'ADD_CLIENT'; payload: Client }
  | { type: 'UPDATE_CLIENT'; payload: { id: string; updates: Partial<Client> } }
  | { type: 'ADD_PAYMENT'; payload: Payment }
  | { type: 'UPDATE_PAYMENT'; payload: { id: string; updates: Partial<Payment> } }
  | { type: 'DELETE_PAYMENT'; payload: string }
  | { type: 'ADD_TEAM_ALLOCATION'; payload: { projectId: string; allocation: TeamAllocation } }
  | { type: 'REMOVE_TEAM_ALLOCATION'; payload: { projectId: string; memberId: string } }
  | { type: 'ADD_PARTNER_ALLOCATION'; payload: { projectId: string; allocation: PartnerAllocation } }
  | { type: 'REMOVE_PARTNER_ALLOCATION'; payload: { projectId: string; partnerId: string } }
  | { type: 'SET_COMPANY_ALLOCATION'; payload: { projectId: string; allocation: CompanyAllocation } }
  | { type: 'UPDATE_CLIENT_PAYMENTS'; payload: { projectId: string; amount: number } }
  | { type: 'ADD_EXPENSE'; payload: Expense }
  | { type: 'UPDATE_EXPENSE'; payload: { id: string; updates: Partial<Expense> } }
  | { type: 'DELETE_EXPENSE'; payload: string }
  | { type: 'UPDATE_BUSINESS'; payload: { id: string; updates: Partial<Business> } }
  | { type: 'DELETE_BUSINESS'; payload: string }
  | { type: 'SET_USERNAME'; payload: string }
  | { type: 'SET_FONT'; payload: FontOption }
  | { type: 'SET_COLOR_PALETTE'; payload: ColorPalette }
  | { type: 'ADD_ALLOCATION'; payload: { projectId: string; allocation: ProjectAllocation } }
  | { type: 'UPDATE_ALLOCATION'; payload: { projectId: string; allocationId: string; updates: Partial<ProjectAllocation> } }
  | { type: 'DELETE_ALLOCATION'; payload: { projectId: string; allocationId: string } }
  | { type: 'ADD_ALLOCATION_TEAM_ALLOCATION'; payload: { projectId: string; allocation: AllocationTeamAllocation } }
  | { type: 'REMOVE_ALLOCATION_TEAM_ALLOCATION'; payload: { projectId: string; allocationId: string; memberId: string } }
  | { type: 'ADD_ALLOCATION_PARTNER_ALLOCATION'; payload: { projectId: string; allocation: AllocationPartnerAllocation } }
  | { type: 'REMOVE_ALLOCATION_PARTNER_ALLOCATION'; payload: { projectId: string; allocationId: string; partnerId: string } }
  | { type: 'SET_ALLOCATION_COMPANY_ALLOCATION'; payload: { projectId: string; allocation: AllocationCompanyAllocation } }
  | { type: 'ADD_SALARY_RECORD'; payload: SalaryRecord }
  | { type: 'UPDATE_SALARY_RECORD'; payload: { id: string; updates: Partial<SalaryRecord> } }
  | { type: 'DELETE_SALARY_RECORD'; payload: string }
  | { type: 'ADD_SALARY_PAYMENT'; payload: SalaryPayment }
  | { type: 'UPDATE_SALARY_PAYMENT'; payload: { id: string; updates: Partial<SalaryPayment> } }
  | { type: 'DELETE_SALARY_PAYMENT'; payload: string }
  | { type: 'ADD_EXCHANGE_RATE'; payload: ExchangeRate }
  | { type: 'UPDATE_EXCHANGE_RATE'; payload: { id: string; updates: Partial<ExchangeRate> } }
  | { type: 'DELETE_EXCHANGE_RATE'; payload: string };

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
    
    case 'DELETE_PROJECT':
      const projectToDelete = state.projects.find(p => p.id === action.payload);
      return {
        ...state,
        projects: state.projects.filter(p => p.id !== action.payload),
        // Remove all payments for this project
        payments: state.payments.filter(p => p.projectId !== action.payload),
      };

    case 'ADD_ALLOCATION':
      return {
        ...state,
        projects: state.projects.map(project =>
          project.id === action.payload.projectId
            ? { 
                ...project, 
                allocations: [...(project.allocations || []), action.payload.allocation],
                updatedAt: new Date().toISOString() 
              }
            : project
        ),
      };

    case 'UPDATE_ALLOCATION':
      return {
        ...state,
        projects: state.projects.map(project =>
          project.id === action.payload.projectId
            ? {
                ...project,
                allocations: project.allocations?.map(allocation =>
                  allocation.id === action.payload.allocationId
                    ? { ...allocation, ...action.payload.updates, updatedAt: new Date().toISOString() }
                    : allocation
                ) || [],
                updatedAt: new Date().toISOString()
              }
            : project
        ),
      };

    case 'DELETE_ALLOCATION':
      return {
        ...state,
        projects: state.projects.map(project =>
          project.id === action.payload.projectId
            ? {
                ...project,
                allocations: project.allocations?.filter(allocation => allocation.id !== action.payload.allocationId) || [],
                allocationTeamAllocations: project.allocationTeamAllocations?.filter(allocation => allocation.allocationId !== action.payload.allocationId) || [],
                allocationPartnerAllocations: project.allocationPartnerAllocations?.filter(allocation => allocation.allocationId !== action.payload.allocationId) || [],
                allocationCompanyAllocations: project.allocationCompanyAllocations?.filter(allocation => allocation.allocationId !== action.payload.allocationId) || [],
                updatedAt: new Date().toISOString()
              }
            : project
        ),
        payments: state.payments.filter(payment => payment.allocationId !== action.payload.allocationId),
      };

    case 'ADD_ALLOCATION_TEAM_ALLOCATION':
      return {
        ...state,
        projects: state.projects.map(project => {
          if (project.id === action.payload.projectId) {
            const newAllocation = action.payload.allocation;
            const updatedAllocations = [...(project.allocationTeamAllocations || []), newAllocation];
            
            // Calculate total allocations across all allocations for this member
            const memberTotalAllocated = updatedAllocations
              .filter(alloc => alloc.memberId === newAllocation.memberId)
              .reduce((sum, alloc) => sum + alloc.totalAllocated, 0);
            
            // Update or create regular team allocation to sync with allocation allocations
            const existingTeamAllocation = project.teamAllocations?.find(
              alloc => alloc.memberId === newAllocation.memberId
            );
            
            let updatedTeamAllocations = project.teamAllocations || [];
            if (existingTeamAllocation) {
              updatedTeamAllocations = updatedTeamAllocations.map(alloc =>
                alloc.memberId === newAllocation.memberId
                  ? { ...alloc, totalAllocated: memberTotalAllocated, outstanding: memberTotalAllocated - alloc.paidAmount }
                  : alloc
              );
            } else {
              updatedTeamAllocations = [...updatedTeamAllocations, {
                memberId: newAllocation.memberId,
                memberName: newAllocation.memberName,
                allocationType: 'fixed' as const,
                allocationValue: memberTotalAllocated,
                totalAllocated: memberTotalAllocated,
                paidAmount: 0,
                outstanding: memberTotalAllocated
              }];
            }
            
            return {
              ...project,
              allocationTeamAllocations: updatedAllocations,
              teamAllocations: updatedTeamAllocations,
              updatedAt: new Date().toISOString()
            };
          }
          return project;
        }),
      };

    case 'REMOVE_ALLOCATION_TEAM_ALLOCATION':
      return {
        ...state,
        projects: state.projects.map(project => {
          if (project.id === action.payload.projectId) {
            const updatedAllocations = project.allocationTeamAllocations?.filter(allocation => 
              !(allocation.allocationId === action.payload.allocationId && allocation.memberId === action.payload.memberId)
            ) || [];
            
            // Recalculate total allocations for this member across remaining allocations
            const memberTotalAllocated = updatedAllocations
              .filter(alloc => alloc.memberId === action.payload.memberId)
              .reduce((sum, alloc) => sum + alloc.totalAllocated, 0);
            
            // Update regular team allocation or remove if no allocations left
            let updatedTeamAllocations = project.teamAllocations || [];
            if (memberTotalAllocated === 0) {
              updatedTeamAllocations = updatedTeamAllocations.filter(alloc => 
                alloc.memberId !== action.payload.memberId
              );
            } else {
              updatedTeamAllocations = updatedTeamAllocations.map(alloc =>
                alloc.memberId === action.payload.memberId
                  ? { ...alloc, totalAllocated: memberTotalAllocated, outstanding: memberTotalAllocated - alloc.paidAmount }
                  : alloc
              );
            }
            
            return {
              ...project,
              allocationTeamAllocations: updatedAllocations,
              teamAllocations: updatedTeamAllocations,
              updatedAt: new Date().toISOString()
            };
          }
          return project;
        }),
        payments: state.payments.filter(payment => 
          !(payment.projectId === action.payload.projectId && 
            payment.allocationId === action.payload.allocationId &&
            payment.memberId === action.payload.memberId)
        ),
      };

    case 'ADD_ALLOCATION_PARTNER_ALLOCATION':
      return {
        ...state,
        projects: state.projects.map(project => {
          if (project.id === action.payload.projectId) {
            const newAllocation = action.payload.allocation;
            const updatedAllocations = [...(project.allocationPartnerAllocations || []), newAllocation];
            
            // Calculate total allocations across all allocations for this partner
            const partnerTotalAllocated = updatedAllocations
              .filter(alloc => alloc.partnerId === newAllocation.partnerId)
              .reduce((sum, alloc) => sum + alloc.totalAllocated, 0);
            
            // Update or create regular partner allocation to sync with allocation allocations
            const existingPartnerAllocation = project.partnerAllocations?.find(
              alloc => alloc.partnerId === newAllocation.partnerId
            );
            
            let updatedPartnerAllocations = project.partnerAllocations || [];
            if (existingPartnerAllocation) {
              updatedPartnerAllocations = updatedPartnerAllocations.map(alloc =>
                alloc.partnerId === newAllocation.partnerId
                  ? { ...alloc, totalAllocated: partnerTotalAllocated, outstanding: partnerTotalAllocated - alloc.paidAmount }
                  : alloc
              );
            } else {
              updatedPartnerAllocations = [...updatedPartnerAllocations, {
                partnerId: newAllocation.partnerId,
                partnerName: newAllocation.partnerName,
                allocationType: 'fixed' as const,
                allocationValue: partnerTotalAllocated,
                totalAllocated: partnerTotalAllocated,
                paidAmount: 0,
                outstanding: partnerTotalAllocated
              }];
            }
            
            return {
              ...project,
              allocationPartnerAllocations: updatedAllocations,
              partnerAllocations: updatedPartnerAllocations,
              updatedAt: new Date().toISOString()
            };
          }
          return project;
        }),
      };

    case 'REMOVE_ALLOCATION_PARTNER_ALLOCATION':
      return {
        ...state,
        projects: state.projects.map(project => {
          if (project.id === action.payload.projectId) {
            const updatedAllocations = project.allocationPartnerAllocations?.filter(allocation => 
              !(allocation.allocationId === action.payload.allocationId && allocation.partnerId === action.payload.partnerId)
            ) || [];
            
            // Recalculate total allocations for this partner across remaining allocations
            const partnerTotalAllocated = updatedAllocations
              .filter(alloc => alloc.partnerId === action.payload.partnerId)
              .reduce((sum, alloc) => sum + alloc.totalAllocated, 0);
            
            // Update regular partner allocation or remove if no allocations left
            let updatedPartnerAllocations = project.partnerAllocations || [];
            if (partnerTotalAllocated === 0) {
              updatedPartnerAllocations = updatedPartnerAllocations.filter(alloc => 
                alloc.partnerId !== action.payload.partnerId
              );
            } else {
              updatedPartnerAllocations = updatedPartnerAllocations.map(alloc =>
                alloc.partnerId === action.payload.partnerId
                  ? { ...alloc, totalAllocated: partnerTotalAllocated, outstanding: partnerTotalAllocated - alloc.paidAmount }
                  : alloc
              );
            }
            
            return {
              ...project,
              allocationPartnerAllocations: updatedAllocations,
              partnerAllocations: updatedPartnerAllocations,
              updatedAt: new Date().toISOString()
            };
          }
          return project;
        }),
        payments: state.payments.filter(payment => 
          !(payment.projectId === action.payload.projectId && 
            payment.allocationId === action.payload.allocationId &&
            payment.partnerId === action.payload.partnerId)
        ),
      };

    case 'SET_ALLOCATION_COMPANY_ALLOCATION':
      return {
        ...state,
        projects: state.projects.map(project => {
          if (project.id === action.payload.projectId) {
            const newAllocation = action.payload.allocation;
            const updatedAllocations = [
              ...project.allocationCompanyAllocations?.filter(allocation => allocation.allocationId !== newAllocation.allocationId) || [],
              newAllocation
            ];
            
            // Calculate total company allocations across all allocations
            const companyTotalAllocated = updatedAllocations
              .reduce((sum, alloc) => sum + alloc.totalAllocated, 0);
            
            // Update company allocation to sync with allocation allocations
            const updatedCompanyAllocation = {
              businessId: newAllocation.businessId,
              businessName: newAllocation.businessName,
              allocationType: 'fixed' as const,
              allocationValue: companyTotalAllocated,
              totalAllocated: companyTotalAllocated,
              paidAmount: project.companyAllocation?.paidAmount || 0,
              outstanding: companyTotalAllocated - (project.companyAllocation?.paidAmount || 0)
            };
            
            return {
              ...project,
              allocationCompanyAllocations: updatedAllocations,
              companyAllocation: updatedCompanyAllocation,
              updatedAt: new Date().toISOString()
            };
          }
          return project;
        }),
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
      const newState = {
        ...state,
        payments: [...state.payments, action.payload],
      };

      // Update allocations when payment is made
      if (action.payload.recipientType === 'team' && action.payload.memberId) {
        return {
          ...newState,
          projects: newState.projects.map(project =>
            project.id === action.payload.projectId
              ? {
                  ...project,
                  teamAllocations: project.teamAllocations?.map(allocation =>
                    allocation.memberId === action.payload.memberId
                      ? {
                          ...allocation,
                          paidAmount: allocation.paidAmount + action.payload.amount,
                          outstanding: allocation.totalAllocated - (allocation.paidAmount + action.payload.amount)
                        }
                      : allocation
                  ) || [],
                  allocationTeamAllocations: project.allocationTeamAllocations?.map(allocation =>
                    allocation.memberId === action.payload.memberId && 
                    (!action.payload.allocationId || allocation.allocationId === action.payload.allocationId)
                      ? {
                          ...allocation,
                          paidAmount: allocation.paidAmount + action.payload.amount,
                          outstanding: allocation.totalAllocated - (allocation.paidAmount + action.payload.amount)
                        }
                      : allocation
                  ) || [],
                  updatedAt: new Date().toISOString()
                }
              : project
          ),
        };
      } else if (action.payload.recipientType === 'partner' && action.payload.partnerId) {
        return {
          ...newState,
          projects: newState.projects.map(project =>
            project.id === action.payload.projectId
              ? {
                  ...project,
                  partnerAllocations: project.partnerAllocations?.map(allocation =>
                    allocation.partnerId === action.payload.partnerId
                      ? {
                          ...allocation,
                          paidAmount: allocation.paidAmount + action.payload.amount,
                          outstanding: allocation.totalAllocated - (allocation.paidAmount + action.payload.amount)
                        }
                      : allocation
                  ) || [],
                  allocationPartnerAllocations: project.allocationPartnerAllocations?.map(allocation =>
                    allocation.partnerId === action.payload.partnerId && 
                    (!action.payload.allocationId || allocation.allocationId === action.payload.allocationId)
                      ? {
                          ...allocation,
                          paidAmount: allocation.paidAmount + action.payload.amount,
                          outstanding: allocation.totalAllocated - (allocation.paidAmount + action.payload.amount)
                        }
                      : allocation
                  ) || [],
                  updatedAt: new Date().toISOString()
                }
              : project
          ),
        };
      }

      return newState;
    
    case 'UPDATE_PAYMENT':
      const oldPayment = state.payments.find(p => p.id === action.payload.id);
      const updatedPayments = state.payments.map(payment =>
        payment.id === action.payload.id
          ? { ...payment, ...action.payload.updates }
          : payment
      );

      let updatedState = {
        ...state,
        payments: updatedPayments,
      };

      // Update allocations based on payment changes
      if (oldPayment && oldPayment.recipientType === 'team' && oldPayment.memberId) {
        const amountDifference = (action.payload.updates.amount || oldPayment.amount) - oldPayment.amount;
        updatedState = {
          ...updatedState,
          projects: updatedState.projects.map(project =>
            project.id === oldPayment.projectId
              ? {
                  ...project,
                  teamAllocations: project.teamAllocations?.map(allocation =>
                    allocation.memberId === oldPayment.memberId
                      ? {
                          ...allocation,
                          paidAmount: allocation.paidAmount + amountDifference,
                          outstanding: allocation.totalAllocated - (allocation.paidAmount + amountDifference)
                        }
                      : allocation
                  ) || [],
                  allocationTeamAllocations: project.allocationTeamAllocations?.map(allocation =>
                    allocation.memberId === oldPayment.memberId && 
                    (!oldPayment.allocationId || allocation.allocationId === oldPayment.allocationId)
                      ? {
                          ...allocation,
                          paidAmount: allocation.paidAmount + amountDifference,
                          outstanding: allocation.totalAllocated - (allocation.paidAmount + amountDifference)
                        }
                      : allocation
                  ) || [],
                  updatedAt: new Date().toISOString()
                }
              : project
          ),
        };
      } else if (oldPayment && oldPayment.recipientType === 'partner' && oldPayment.partnerId) {
        const amountDifference = (action.payload.updates.amount || oldPayment.amount) - oldPayment.amount;
        updatedState = {
          ...updatedState,
          projects: updatedState.projects.map(project =>
            project.id === oldPayment.projectId
              ? {
                  ...project,
                  partnerAllocations: project.partnerAllocations?.map(allocation =>
                    allocation.partnerId === oldPayment.partnerId
                      ? {
                          ...allocation,
                          paidAmount: allocation.paidAmount + amountDifference,
                          outstanding: allocation.totalAllocated - (allocation.paidAmount + amountDifference)
                        }
                      : allocation
                  ) || [],
                  allocationPartnerAllocations: project.allocationPartnerAllocations?.map(allocation =>
                    allocation.partnerId === oldPayment.partnerId && 
                    (!oldPayment.allocationId || allocation.allocationId === oldPayment.allocationId)
                      ? {
                          ...allocation,
                          paidAmount: allocation.paidAmount + amountDifference,
                          outstanding: allocation.totalAllocated - (allocation.paidAmount + amountDifference)
                        }
                      : allocation
                  ) || [],
                  updatedAt: new Date().toISOString()
                }
              : project
          ),
        };
      }

      return updatedState;

    case 'DELETE_PAYMENT':
      const paymentToDelete = state.payments.find(p => p.id === action.payload);
      let stateAfterDelete = {
        ...state,
        payments: state.payments.filter(payment => payment.id !== action.payload),
      };

      // Reverse the allocation changes when payment is deleted
      if (paymentToDelete && paymentToDelete.recipientType === 'team' && paymentToDelete.memberId) {
        stateAfterDelete = {
          ...stateAfterDelete,
          projects: stateAfterDelete.projects.map(project =>
            project.id === paymentToDelete.projectId
              ? {
                  ...project,
                  teamAllocations: project.teamAllocations?.map(allocation =>
                    allocation.memberId === paymentToDelete.memberId
                      ? {
                          ...allocation,
                          paidAmount: allocation.paidAmount - paymentToDelete.amount,
                          outstanding: allocation.totalAllocated - (allocation.paidAmount - paymentToDelete.amount)
                        }
                      : allocation
                  ) || [],
                  allocationTeamAllocations: project.allocationTeamAllocations?.map(allocation =>
                    allocation.memberId === paymentToDelete.memberId && 
                    (!paymentToDelete.allocationId || allocation.allocationId === paymentToDelete.allocationId)
                      ? {
                          ...allocation,
                          paidAmount: allocation.paidAmount - paymentToDelete.amount,
                          outstanding: allocation.totalAllocated - (allocation.paidAmount - paymentToDelete.amount)
                        }
                      : allocation
                  ) || [],
                  updatedAt: new Date().toISOString()
                }
              : project
          ),
        };
      } else if (paymentToDelete && paymentToDelete.recipientType === 'partner' && paymentToDelete.partnerId) {
        stateAfterDelete = {
          ...stateAfterDelete,
          projects: stateAfterDelete.projects.map(project =>
            project.id === paymentToDelete.projectId
              ? {
                  ...project,
                  partnerAllocations: project.partnerAllocations?.map(allocation =>
                    allocation.partnerId === paymentToDelete.partnerId
                      ? {
                          ...allocation,
                          paidAmount: allocation.paidAmount - paymentToDelete.amount,
                          outstanding: allocation.totalAllocated - (allocation.paidAmount - paymentToDelete.amount)
                        }
                      : allocation
                  ) || [],
                  allocationPartnerAllocations: project.allocationPartnerAllocations?.map(allocation =>
                    allocation.partnerId === paymentToDelete.partnerId && 
                    (!paymentToDelete.allocationId || allocation.allocationId === paymentToDelete.allocationId)
                      ? {
                          ...allocation,
                          paidAmount: allocation.paidAmount - paymentToDelete.amount,
                          outstanding: allocation.totalAllocated - (allocation.paidAmount - paymentToDelete.amount)
                        }
                      : allocation
                  ) || [],
                  updatedAt: new Date().toISOString()
                }
              : project
          ),
        };
      } else if (paymentToDelete && paymentToDelete.type === 'incoming') {
        // Handle client payment deletion
        stateAfterDelete = {
          ...stateAfterDelete,
          projects: stateAfterDelete.projects.map(project =>
            project.id === paymentToDelete.projectId
              ? {
                  ...project,
                  clientPayments: (project.clientPayments || 0) - paymentToDelete.amount,
                  updatedAt: new Date().toISOString()
                }
              : project
          ),
        };
      }

      return stateAfterDelete;

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

    case 'REMOVE_TEAM_ALLOCATION':
      return {
        ...state,
        projects: state.projects.map(project =>
          project.id === action.payload.projectId
            ? { 
                ...project, 
                teamAllocations: project.teamAllocations?.filter(allocation => 
                  allocation.memberId !== action.payload.memberId
                ) || [],
                updatedAt: new Date().toISOString() 
              }
            : project
        ),
        // Also remove any payments associated with this team member and project
        payments: state.payments.filter(payment => 
          !(payment.projectId === action.payload.projectId && 
            payment.memberId === action.payload.memberId && 
            payment.recipientType === 'team')
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

    case 'REMOVE_PARTNER_ALLOCATION':
      return {
        ...state,
        projects: state.projects.map(project =>
          project.id === action.payload.projectId
            ? { 
                ...project, 
                partnerAllocations: project.partnerAllocations?.filter(allocation => 
                  allocation.partnerId !== action.payload.partnerId
                ) || [],
                updatedAt: new Date().toISOString() 
              }
            : project
        ),
        // Also remove any payments associated with this partner and project
        payments: state.payments.filter(payment => 
          !(payment.projectId === action.payload.projectId && 
            payment.partnerId === action.payload.partnerId && 
            payment.recipientType === 'partner')
        ),
      };

    case 'SET_COMPANY_ALLOCATION':
      return {
        ...state,
        projects: state.projects.map(project =>
          project.id === action.payload.projectId
            ? { 
                ...project, 
                companyAllocation: action.payload.allocation,
                updatedAt: new Date().toISOString() 
              }
            : project
        ),
      };

    case 'UPDATE_CLIENT_PAYMENTS':
      return {
        ...state,
        projects: state.projects.map(project =>
          project.id === action.payload.projectId
            ? { 
                ...project, 
                clientPayments: (project.clientPayments || 0) + action.payload.amount,
                updatedAt: new Date().toISOString() 
              }
            : project
        ),
      };

    case 'ADD_EXPENSE':
      return {
        ...state,
        projects: state.projects.map(project =>
          project.id === action.payload.projectId
            ? {
                ...project,
                expenses: [...(project.expenses || []), action.payload],
                updatedAt: new Date().toISOString()
              }
            : project
        ),
      };

    case 'UPDATE_EXPENSE':
      return {
        ...state,
        projects: state.projects.map(project => {
          const expense = project.expenses?.find(e => e.id === action.payload.id);
          if (expense) {
            return {
              ...project,
              expenses: project.expenses?.map(e =>
                e.id === action.payload.id
                  ? { ...e, ...action.payload.updates }
                  : e
              ) || [],
              updatedAt: new Date().toISOString()
            };
          }
          return project;
        }),
      };

    case 'DELETE_EXPENSE':
      return {
        ...state,
        projects: state.projects.map(project => ({
          ...project,
          expenses: project.expenses?.filter(e => e.id !== action.payload) || [],
          updatedAt: new Date().toISOString()
        })),
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

    case 'ADD_SALARY_RECORD':
      return {
        ...state,
        salaryRecords: [...(state.salaryRecords || []), action.payload],
      };

    case 'UPDATE_SALARY_RECORD':
      return {
        ...state,
        salaryRecords: (state.salaryRecords || []).map(record =>
          record.id === action.payload.id
            ? { ...record, ...action.payload.updates, updatedAt: new Date().toISOString() }
            : record
        ),
      };

    case 'DELETE_SALARY_RECORD':
      return {
        ...state,
        salaryRecords: (state.salaryRecords || []).filter(record => record.id !== action.payload),
        salaryPayments: (state.salaryPayments || []).filter(payment => payment.salaryRecordId !== action.payload),
      };

    case 'ADD_SALARY_PAYMENT':
      return {
        ...state,
        salaryPayments: [...(state.salaryPayments || []), action.payload],
      };

    case 'UPDATE_SALARY_PAYMENT':
      return {
        ...state,
        salaryPayments: (state.salaryPayments || []).map(payment =>
          payment.id === action.payload.id
            ? { ...payment, ...action.payload.updates }
            : payment
        ),
      };

    case 'DELETE_SALARY_PAYMENT':
      return {
        ...state,
        salaryPayments: (state.salaryPayments || []).filter(payment => payment.id !== action.payload),
      };

    case 'ADD_EXCHANGE_RATE':
      return {
        ...state,
        exchangeRates: [...(state.exchangeRates || []), action.payload],
      };

    case 'UPDATE_EXCHANGE_RATE':
      return {
        ...state,
        exchangeRates: (state.exchangeRates || []).map(rate =>
          rate.id === action.payload.id
            ? { ...rate, ...action.payload.updates, updatedAt: new Date().toISOString() }
            : rate
        ),
      };

    case 'DELETE_EXCHANGE_RATE':
      return {
        ...state,
        exchangeRates: (state.exchangeRates || []).filter(rate => rate.id !== action.payload),
      };

    default:
      return state;
  }
};

export const BusinessProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  
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
      // We'll handle theme detection via document class or localStorage
      const isDark = document.documentElement.classList.contains('dark') || 
                    localStorage.getItem('theme') === 'dark';
      applyColorPalette(data.userSettings.colorPalette, isDark);
    }
  }, [data.userSettings.fontFamily, data.userSettings.colorPalette]);

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
