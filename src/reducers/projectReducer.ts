import { AppData } from '@/types/business';
import { BusinessAction } from './types';

/**
 * Project Entity Reducer
 * 
 * Handles all CRUD operations for Project entities including allocations.
 * Following Single Responsibility Principle.
 */
export const projectReducer = (state: AppData, action: BusinessAction): AppData | null => {
  switch (action.type) {
    case 'ADD_PROJECT':
      return { ...state, projects: [...state.projects, action.payload] };

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
      return {
        ...state,
        projects: state.projects.filter(project => project.id !== action.payload),
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
                  a.id === action.payload.allocationId
                    ? { ...a, ...action.payload.updates, updatedAt: new Date().toISOString() }
                    : a
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

    // Legacy per-project allocations
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

    // Allocation-specific team allocations
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

    // Allocation-specific partner allocations
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

    // Allocation-specific company allocations
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

    // Expense actions (project-level)
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
            expense.id === action.payload.id
              ? { ...expense, ...action.payload.updates, updatedAt: new Date().toISOString() }
              : expense
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

    default:
      return null; // Not handled by this reducer
  }
};
