import { AppData } from '@/types/business';
import { BusinessAction } from './types';

/**
 * Team Entity Reducer
 * 
 * Handles all CRUD operations for TeamMember, Partner entities.
 * Following Single Responsibility Principle.
 */
export const teamReducer = (state: AppData, action: BusinessAction): AppData | null => {
  switch (action.type) {
    // Team Member actions
    case 'ADD_TEAM_MEMBER':
      return { ...state, teamMembers: [...state.teamMembers, action.payload] };

    case 'UPDATE_TEAM_MEMBER':
      return {
        ...state,
        teamMembers: state.teamMembers.map(member =>
          member.id === action.payload.id
            ? { ...member, ...action.payload.updates }
            : member
        ),
      };

    case 'DELETE_TEAM_MEMBER':
      return {
        ...state,
        teamMembers: state.teamMembers.filter(member => member.id !== action.payload),
      };

    // Partner actions
    case 'ADD_PARTNER':
      return { ...state, partners: [...(state.partners || []), action.payload] };

    case 'UPDATE_PARTNER':
      return {
        ...state,
        partners: (state.partners || []).map(partner =>
          partner.id === action.payload.id
            ? { ...partner, ...action.payload.updates }
            : partner
        ),
      };

    case 'DELETE_PARTNER':
      return {
        ...state,
        partners: (state.partners || []).filter(partner => partner.id !== action.payload),
      };

    default:
      return null; // Not handled by this reducer
  }
};
