import { AppData } from '@/types/business';
import { BusinessAction } from './types';

/**
 * Salary Entity Reducer
 * 
 * Handles all CRUD operations for SalaryRecord, SalaryPayment, PayrollPeriod, and Payslip entities.
 * Following Single Responsibility Principle.
 */
export const salaryReducer = (state: AppData, action: BusinessAction): AppData | null => {
  switch (action.type) {
    // Salary Record actions
    case 'ADD_SALARY_RECORD':
      return { ...state, salaryRecords: [...state.salaryRecords, action.payload] };

    case 'UPDATE_SALARY_RECORD':
      return {
        ...state,
        salaryRecords: state.salaryRecords.map(record =>
          record.id === action.payload.id
            ? { ...record, ...action.payload.updates }
            : record
        ),
      };

    case 'DELETE_SALARY_RECORD':
      return {
        ...state,
        salaryRecords: state.salaryRecords.filter(record => record.id !== action.payload),
      };

    // Salary Payment actions
    case 'ADD_SALARY_PAYMENT':
      return { ...state, salaryPayments: [...state.salaryPayments, action.payload] };

    case 'UPDATE_SALARY_PAYMENT':
      return {
        ...state,
        salaryPayments: state.salaryPayments.map(payment =>
          payment.id === action.payload.id
            ? { ...payment, ...action.payload.updates }
            : payment
        ),
      };

    case 'DELETE_SALARY_PAYMENT':
      return {
        ...state,
        salaryPayments: state.salaryPayments.filter(payment => payment.id !== action.payload),
      };

    // Payroll Period actions
    case 'ADD_PAYROLL_PERIOD':
      return { ...state, payrollPeriods: [...(state.payrollPeriods || []), action.payload] };

    case 'UPDATE_PAYROLL_PERIOD':
      return {
        ...state,
        payrollPeriods: (state.payrollPeriods || []).map(period =>
          period.id === action.payload.id
            ? { ...period, ...action.payload.updates }
            : period
        ),
      };

    // Payslip actions
    case 'ADD_PAYSLIP':
      return { ...state, payslips: [...(state.payslips || []), action.payload] };

    // Extra Payment actions
    case 'ADD_EXTRA_PAYMENT':
      return { ...state, extraPayments: [...(state.extraPayments || []), action.payload] };

    case 'UPDATE_EXTRA_PAYMENT':
      return {
        ...state,
        extraPayments: (state.extraPayments || []).map(payment =>
          payment.id === action.payload.id
            ? { ...payment, ...action.payload.updates }
            : payment
        ),
      };

    case 'DELETE_EXTRA_PAYMENT':
      return {
        ...state,
        extraPayments: (state.extraPayments || []).filter(payment => payment.id !== action.payload),
      };

    default:
      return null; // Not handled by this reducer
  }
};
