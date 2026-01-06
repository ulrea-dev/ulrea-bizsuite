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
  Retainer,
  RetainerRenewal,
  ExtraPayment,
  BankAccount,
  Payable,
  Receivable,
  RenewalPayment,
} from '@/types/business';

/**
 * All Business Actions
 * 
 * This type union defines all possible actions that can be dispatched.
 * Following Open/Closed Principle - new action types can be added
 * without modifying existing reducers.
 */
export type BusinessAction =
  // Data loading
  | { type: 'LOAD_DATA'; payload: AppData }
  // Business actions
  | { type: 'ADD_BUSINESS'; payload: Business }
  | { type: 'UPDATE_BUSINESS'; payload: { id: string; updates: Partial<Business> } }
  | { type: 'DELETE_BUSINESS'; payload: string }
  | { type: 'SET_CURRENT_BUSINESS'; payload: string | null }
  // Project actions
  | { type: 'ADD_PROJECT'; payload: Project }
  | { type: 'UPDATE_PROJECT'; payload: { id: string; updates: Partial<Project> } }
  | { type: 'DELETE_PROJECT'; payload: string }
  // Team Member actions
  | { type: 'ADD_TEAM_MEMBER'; payload: TeamMember }
  | { type: 'UPDATE_TEAM_MEMBER'; payload: { id: string; updates: Partial<TeamMember> } }
  | { type: 'DELETE_TEAM_MEMBER'; payload: string }
  // Client actions
  | { type: 'ADD_CLIENT'; payload: Client }
  | { type: 'UPDATE_CLIENT'; payload: { id: string; updates: Partial<Client> } }
  | { type: 'DELETE_CLIENT'; payload: string }
  // Payment actions
  | { type: 'ADD_PAYMENT'; payload: Payment }
  | { type: 'UPDATE_PAYMENT'; payload: { id: string; updates: Partial<Payment> } }
  | { type: 'DELETE_PAYMENT'; payload: string }
  // Salary Record actions
  | { type: 'ADD_SALARY_RECORD'; payload: SalaryRecord }
  | { type: 'UPDATE_SALARY_RECORD'; payload: { id: string; updates: Partial<SalaryRecord> } }
  | { type: 'DELETE_SALARY_RECORD'; payload: string }
  // Salary Payment actions
  | { type: 'ADD_SALARY_PAYMENT'; payload: SalaryPayment }
  | { type: 'UPDATE_SALARY_PAYMENT'; payload: { id: string; updates: Partial<SalaryPayment> } }
  | { type: 'DELETE_SALARY_PAYMENT'; payload: string }
  // Payroll Period actions
  | { type: 'ADD_PAYROLL_PERIOD'; payload: PayrollPeriod }
  | { type: 'UPDATE_PAYROLL_PERIOD'; payload: { id: string; updates: Partial<PayrollPeriod> } }
  // Payslip actions
  | { type: 'ADD_PAYSLIP'; payload: Payslip }
  // Exchange Rate actions
  | { type: 'ADD_EXCHANGE_RATE'; payload: ExchangeRate }
  | { type: 'UPDATE_EXCHANGE_RATE'; payload: { id: string; updates: Partial<ExchangeRate> } }
  | { type: 'DELETE_EXCHANGE_RATE'; payload: string }
  // User Settings actions
  | { type: 'SET_USERNAME'; payload: string }
  | { type: 'SET_THEME'; payload: 'light' | 'dark' }
  | { type: 'SET_FONT'; payload: any }
  | { type: 'SET_COLOR_PALETTE'; payload: any }
  | { type: 'SET_DEFAULT_CURRENCY'; payload: Currency }
  // Custom Currency actions
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
  // Allocation actions (phases)
  | { type: 'ADD_ALLOCATION'; payload: { projectId: string; allocation: ProjectAllocation } }
  | { type: 'UPDATE_ALLOCATION'; payload: { projectId: string; allocationId: string; updates: Partial<ProjectAllocation> } }
  | { type: 'DELETE_ALLOCATION'; payload: { projectId: string; allocationId: string } }
  // Legacy per-project allocations
  | { type: 'ADD_TEAM_ALLOCATION'; payload: { projectId: string; allocation: TeamAllocation } }
  | { type: 'ADD_PARTNER_ALLOCATION'; payload: { projectId: string; allocation: PartnerAllocation } }
  | { type: 'SET_COMPANY_ALLOCATION'; payload: { projectId: string; allocation: CompanyAllocation } }
  // Allocation-specific allocations
  | { type: 'ADD_ALLOCATION_TEAM_ALLOCATION'; payload: { projectId: string; allocation: AllocationTeamAllocation } }
  | { type: 'UPDATE_ALLOCATION_TEAM_ALLOCATION'; payload: { projectId: string; allocationId: string; memberId: string; updates: Partial<AllocationTeamAllocation> } }
  | { type: 'REMOVE_ALLOCATION_TEAM_ALLOCATION'; payload: { projectId: string; allocationId: string; memberId: string } }
  | { type: 'ADD_ALLOCATION_PARTNER_ALLOCATION'; payload: { projectId: string; allocation: AllocationPartnerAllocation } }
  | { type: 'UPDATE_ALLOCATION_PARTNER_ALLOCATION'; payload: { projectId: string; allocationId: string; partnerId: string; updates: Partial<AllocationPartnerAllocation> } }
  | { type: 'REMOVE_ALLOCATION_PARTNER_ALLOCATION'; payload: { projectId: string; allocationId: string; partnerId: string } }
  | { type: 'SET_ALLOCATION_COMPANY_ALLOCATION'; payload: { projectId: string; allocation: AllocationCompanyAllocation } }
  | { type: 'UPDATE_ALLOCATION_COMPANY_ALLOCATION'; payload: { projectId: string; allocationId: string; updates: Partial<AllocationCompanyAllocation> } }
  // Client Payments
  | { type: 'UPDATE_CLIENT_PAYMENTS'; payload: { projectId: string; clientPayments: number } }
  // Quick Task actions
  | { type: 'ADD_QUICK_TASK'; payload: QuickTask }
  | { type: 'UPDATE_QUICK_TASK'; payload: { id: string; updates: Partial<QuickTask> } }
  | { type: 'DELETE_QUICK_TASK'; payload: string }
  | { type: 'COMPLETE_QUICK_TASK'; payload: { id: string; paidAt: string } }
  // Retainer actions
  | { type: 'ADD_RETAINER'; payload: Retainer }
  | { type: 'UPDATE_RETAINER'; payload: { id: string; updates: Partial<Retainer> } }
  | { type: 'DELETE_RETAINER'; payload: string }
  // Extra Payment actions
  | { type: 'ADD_EXTRA_PAYMENT'; payload: ExtraPayment }
  | { type: 'UPDATE_EXTRA_PAYMENT'; payload: { id: string; updates: Partial<ExtraPayment> } }
  | { type: 'DELETE_EXTRA_PAYMENT'; payload: string }
  // Bank Account actions
  | { type: 'ADD_BANK_ACCOUNT'; payload: BankAccount }
  | { type: 'UPDATE_BANK_ACCOUNT'; payload: { id: string; updates: Partial<BankAccount> } }
  | { type: 'DELETE_BANK_ACCOUNT'; payload: string }
  // Payable actions
  | { type: 'ADD_PAYABLE'; payload: Payable }
  | { type: 'UPDATE_PAYABLE'; payload: { id: string; updates: Partial<Payable> } }
  | { type: 'DELETE_PAYABLE'; payload: string }
  // Receivable actions
  | { type: 'ADD_RECEIVABLE'; payload: Receivable }
  | { type: 'UPDATE_RECEIVABLE'; payload: { id: string; updates: Partial<Receivable> } }
  | { type: 'DELETE_RECEIVABLE'; payload: string }
  // Renewal actions (adding to existing retainer)
  | { type: 'ADD_RENEWAL_TO_RETAINER'; payload: { retainerId: string; renewal: RetainerRenewal } }
  | { type: 'UPDATE_RENEWAL_IN_RETAINER'; payload: { retainerId: string; renewalId: string; updates: Partial<RetainerRenewal> } }
  | { type: 'DELETE_RENEWAL_FROM_RETAINER'; payload: { retainerId: string; renewalId: string } }
  // Renewal Payment actions
  | { type: 'ADD_RENEWAL_PAYMENT'; payload: RenewalPayment }
  | { type: 'UPDATE_RENEWAL_PAYMENT'; payload: { id: string; updates: Partial<RenewalPayment> } }
  | { type: 'DELETE_RENEWAL_PAYMENT'; payload: string };
