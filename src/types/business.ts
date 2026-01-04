export interface Currency {
  code: string;
  symbol: string;
  name: string;
  isCustom?: boolean;
}

export interface Business {
  id: string;
  name: string;
  type: string;
  currency: Currency;
  currentBalance: number;
  minimumBalance: number;
  createdAt: string;
  updatedAt: string;
}

export interface TeamMember {
  id: string;
  name: string;
  email: string;
  role: string;
  memberType: 'employee' | 'contractor';
  businessIds: string[]; // Team members can belong to multiple businesses
  paymentHistory: Payment[];
  createdAt: string;
}

export interface Partner {
  id: string;
  name: string;
  email: string;
  type: 'sales' | 'managing';
  paymentHistory: Payment[];
  createdAt: string;
}

export interface PartnerAllocation {
  partnerId: string;
  partnerName: string;
  allocationType: 'percentage' | 'fixed';
  allocationValue: number;
  totalAllocated: number;
  paidAmount: number;
  outstanding: number;
}

export interface CompanyAllocation {
  businessId: string;
  businessName: string;
  allocationType: 'percentage' | 'fixed';
  allocationValue: number;
  totalAllocated: number;
  paidAmount: number;
  outstanding: number;
}

export interface Client {
  id: string;
  name: string;
  email: string;
  company: string;
  projects: string[];
  totalValue: number;
  createdAt: string;
}

export interface Retainer {
  id: string;
  businessId: string;
  clientId: string;
  name: string;
  amount: number;
  currency: string;
  frequency: 'monthly' | 'quarterly' | 'yearly';
  startDate: string;
  endDate?: string;
  status: 'active' | 'paused' | 'cancelled';
  description?: string;
  nextBillingDate: string;
  totalReceived: number;
  createdAt: string;
  updatedAt: string;
}

export interface QuickTask {
  id: string;
  businessId: string;
  title: string;
  amount: number;
  currencyCode: string;
  assignedToId: string;
  dueDate?: string;
  status: 'pending' | 'active' | 'completed';
  taskType?: string;
  description?: string;
  createdAt: string;
  updatedAt: string;
  paidAt?: string;
}

export interface Payment {
  id: string;
  amount: number;
  date: string;
  projectId?: string;
  allocationId?: string;
  memberId?: string;
  partnerId?: string;
  clientId?: string;
  retainerId?: string;
  expenseId?: string;
  type: 'incoming' | 'outgoing';
  recipientType?: 'team' | 'partner' | 'company' | 'client';
  status: 'pending' | 'completed';
  method?: string;
  description?: string;
  paymentSource?: 'project' | 'salary' | 'task' | 'retainer' | 'expense' | 'extra';
  taskDescription?: string;
  taskType?: string;
  taskId?: string;
}

export interface ProjectAllocation {
  id: string;
  title: string;
  budget: number;
  startDate: string;
  endDate?: string;
  status: 'planning' | 'active' | 'completed' | 'on-hold';
  description?: string;
  createdAt: string;
  updatedAt: string;
}

export interface TeamAllocation {
  memberId: string;
  memberName: string;
  allocationType: 'percentage' | 'fixed';
  allocationValue: number;
  totalAllocated: number;
  paidAmount: number;
  outstanding: number;
}

export interface AllocationTeamAllocation extends TeamAllocation {
  allocationId: string;
  allocationName: string;
}

export interface AllocationPartnerAllocation extends PartnerAllocation {
  allocationId: string;
  allocationName: string;
}

export interface AllocationCompanyAllocation extends CompanyAllocation {
  allocationId: string;
  allocationName: string;
}

export type ExpenseCategory = 
  | 'software'
  | 'equipment'
  | 'marketing'
  | 'travel'
  | 'contractor'
  | 'supplies'
  | 'hosting'
  | 'services'
  | 'domain'
  | 'email'
  | 'subscription'
  | 'other';

export interface Expense {
  id: string;
  businessId: string;
  projectId?: string;
  retainerId?: string;
  allocationId?: string;
  memberId?: string;
  partnerId?: string;
  taskId?: string;
  name: string;
  category: ExpenseCategory;
  amount: number;
  date: string;
  description?: string;
  status: 'pending' | 'paid';
  receipt?: string;
  isRecurring?: boolean;
  recurringFrequency?: 'weekly' | 'monthly' | 'quarterly' | 'yearly';
  recurringEndDate?: string;
  parentExpenseId?: string;
  createdAt: string;
  updatedAt: string;
}

export interface SalaryRecord {
  id: string;
  businessId: string;
  teamMemberId: string;
  position: string;
  amount: number;
  currency: string;
  frequency: 'weekly' | 'bi-weekly' | 'monthly' | 'quarterly' | 'annually';
  startDate: string;
  endDate?: string; // For contract-based secondary salaries
  description?: string;
  projectId?: string;
  clientId?: string;
  isProjectBased?: boolean;
  salaryType: 'primary' | 'secondary'; // New field to distinguish salary types
  contractDuration?: number; // Duration in months for secondary salaries
  createdAt: string;
  updatedAt: string;
}

export interface SalaryPayment {
  id: string;
  salaryRecordId: string;
  amount: number;
  paymentDate: string;
  period: string;
  method?: string;
  description?: string;
  status: 'pending' | 'paid' | 'overdue';
  createdAt: string;
}

export interface PayrollPeriod {
  id: string;
  businessId: string;
  year: number;
  month: number;
  status: 'open' | 'processing' | 'closed';
  totalEmployees: number;
  totalAmount: number;
  paidEmployees: number;
  pendingEmployees: number;
  overdueEmployees: number;
  createdAt: string;
  updatedAt: string;
}

export interface Payslip {
  id: string;
  businessId: string;
  teamMemberId: string;
  salaryRecordId: string;
  payrollPeriodId: string;
  grossSalary: number;
  deductions: PayrollDeduction[];
  bonuses: PayrollBonus[];
  netSalary: number;
  currency: string;
  generatedAt: string;
}

export interface PayrollDeduction {
  id: string;
  name: string;
  amount: number;
  type: 'tax' | 'insurance' | 'retirement' | 'other';
  isPercentage: boolean;
}

export interface PayrollBonus {
  id: string;
  name: string;
  amount: number;
  type: 'performance' | 'commission' | 'overtime' | 'other';
}

export type ExtraPaymentType = 'bonus' | 'commission' | 'overtime' | 'allowance' | 'reimbursement' | 'other';

export interface ExtraPayment {
  id: string;
  businessId: string;
  teamMemberId: string;
  amount: number;
  currency: string;
  period: string; // Format: "YYYY-MM" (e.g., "2025-12")
  paymentDate: string;
  type: ExtraPaymentType;
  name: string; // e.g., "Performance Bonus", "Holiday Bonus"
  description?: string;
  status: 'pending' | 'paid';
  createdAt: string;
}

export interface ExchangeRate {
  id: string;
  fromCurrency: string;
  toCurrency: string;
  rate: number;
  createdAt: string;
  updatedAt: string;
}

export interface Project {
  id: string;
  businessId: string;
  name: string;
  description: string;
  totalValue: number;
  status: 'active' | 'completed' | 'on-hold' | 'cancelled';
  startDate: string;
  endDate?: string;
  clientId?: string;
  isMultiPhase?: boolean;
  allocations: ProjectAllocation[];
  teamAllocations: TeamAllocation[]; // Legacy - will be removed
  partnerAllocations: PartnerAllocation[]; // Legacy - will be removed
  companyAllocation?: CompanyAllocation; // Legacy - will be removed
  allocationTeamAllocations: AllocationTeamAllocation[];
  allocationPartnerAllocations: AllocationPartnerAllocation[];
  allocationCompanyAllocations: AllocationCompanyAllocation[];
  clientPayments: number;
  expenses: Expense[];
  createdAt: string;
  updatedAt: string;
}

export interface FontOption {
  id: string;
  name: string;
  family: string;
  weights: string[];
  googleFontUrl?: string;
}

export interface ColorPalette {
  id: string;
  name: string;
  type: 'predefined' | 'custom';
  colors: {
    background: string;
    foreground: string;
    card: string;
    cardForeground: string;
    popover: string;
    popoverForeground: string;
    primary: string;
    primaryForeground: string;
    secondary: string;
    secondaryForeground: string;
    muted: string;
    mutedForeground: string;
    accent: string;
    accentForeground: string;
    destructive: string;
    destructiveForeground: string;
    border: string;
    input: string;
    ring: string;
  };
}

// Bank/Payment Account types
export type BankAccountType = 'bank' | 'stripe' | 'paypal' | 'cash' | 'crypto' | 'other';

export interface BankAccount {
  id: string;
  businessId: string;
  name: string;
  type: BankAccountType;
  balance: number;
  currency: string;
  accountNumber?: string;
  description?: string;
  isDefault: boolean;
  createdAt: string;
  updatedAt: string;
}

export type PayableStatus = 'pending' | 'partial' | 'paid' | 'overdue';

export interface Payable {
  id: string;
  businessId: string;
  accountId?: string;
  vendorName: string;
  amount: number;
  paidAmount: number;
  currency: string;
  dueDate: string;
  status: PayableStatus;
  category?: string;
  description?: string;
  invoiceRef?: string;
  createdAt: string;
  updatedAt: string;
}

export type ReceivableStatus = 'pending' | 'partial' | 'paid' | 'overdue';

// Individual payment record within a receivable
export interface ReceivablePaymentRecord {
  id: string;
  amount: number;
  date: string;
  paymentId?: string; // Links to the Payment entity if synced from client payments
  description?: string;
}

export interface Receivable {
  id: string;
  businessId: string;
  accountId?: string;
  clientId?: string;
  projectId?: string;
  retainerId?: string;
  sourceName: string;
  amount: number;
  receivedAmount: number;
  currency: string;
  dueDate: string;
  status: ReceivableStatus;
  description?: string;
  invoiceRef?: string;
  paymentRecords?: ReceivablePaymentRecord[]; // Track individual payments with dates
  isProjectSynced?: boolean; // True if this receivable is auto-synced with a project
  createdAt: string;
  updatedAt: string;
}

export interface AppData {
  businesses: Business[];
  projects: Project[];
  teamMembers: TeamMember[];
  partners: Partner[];
  clients: Client[];
  payments: Payment[];
  salaryRecords: SalaryRecord[];
  salaryPayments: SalaryPayment[];
  payrollPeriods: PayrollPeriod[];
  payslips: Payslip[];
  exchangeRates: ExchangeRate[];
  customCurrencies: Currency[];
  quickTasks: QuickTask[];
  retainers: Retainer[];
  expenses: Expense[];
  extraPayments: ExtraPayment[];
  bankAccounts: BankAccount[];
  payables: Payable[];
  receivables: Receivable[];
  currentBusinessId: string | null;
  userSettings: {
    username: string;
    theme: 'light' | 'dark';
    defaultCurrency: Currency;
    fontFamily: FontOption;
    colorPalette: ColorPalette;
  };
}

export const SUPPORTED_CURRENCIES: Currency[] = [
  { code: 'USD', symbol: '$', name: 'US Dollar' },
  { code: 'EUR', symbol: '€', name: 'Euro' },
  { code: 'GBP', symbol: '£', name: 'British Pound' },
  { code: 'CAD', symbol: 'C$', name: 'Canadian Dollar' },
  { code: 'AUD', symbol: 'A$', name: 'Australian Dollar' },
  { code: 'NGN', symbol: '₦', name: 'Nigerian Naira' },
  { code: 'JPY', symbol: '¥', name: 'Japanese Yen' },
];

export const EXPENSE_CATEGORIES: { value: ExpenseCategory; label: string }[] = [
  { value: 'software', label: 'Software & Tools' },
  { value: 'equipment', label: 'Equipment' },
  { value: 'marketing', label: 'Marketing & Advertising' },
  { value: 'travel', label: 'Travel & Transportation' },
  { value: 'contractor', label: 'Contractor Fees' },
  { value: 'supplies', label: 'Office Supplies' },
  { value: 'hosting', label: 'Hosting & Infrastructure' },
  { value: 'services', label: 'Professional Services' },
  { value: 'domain', label: 'Domain Registration' },
  { value: 'email', label: 'Email Services' },
  { value: 'subscription', label: 'Subscriptions' },
  { value: 'other', label: 'Other' },
];
