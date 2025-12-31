import { AppData } from '@/types/business';
import { BusinessAction } from './types';

/**
 * Payment Entity Reducer
 * 
 * Handles all CRUD operations for Payment entities including allocation updates.
 * Following Single Responsibility Principle.
 */
export const paymentReducer = (state: AppData, action: BusinessAction): AppData | null => {
  switch (action.type) {
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
                    outstanding: Math.max(0, newOutstanding),
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
          payment.id === action.payload.id
            ? { ...payment, ...action.payload.updates }
            : payment
        ),
      };

      // If this affects a team member allocation, recalculate allocation amounts
      if (
        oldPayment &&
        updatedPayment &&
        oldPayment.recipientType === 'team' &&
        oldPayment.memberId &&
        oldPayment.allocationId &&
        oldPayment.projectId
      ) {
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
                    outstanding: Math.max(0, newOutstanding),
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
      if (
        deletedPayment &&
        deletedPayment.recipientType === 'team' &&
        deletedPayment.memberId &&
        deletedPayment.allocationId &&
        deletedPayment.projectId
      ) {
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
                    outstanding: Math.max(0, newOutstanding),
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

    default:
      return null; // Not handled by this reducer
  }
};
