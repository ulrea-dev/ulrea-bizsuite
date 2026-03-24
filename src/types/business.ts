export interface Currency {
  code: string;
  symbol: string;
  name: string;
  isCustom?: boolean;
}

// Business Model Type - determines app behavior and available features
export type BusinessModel = 'service' | 'product' | 'hybrid';

export interface Business {
  id: string;
  name: string;
  type: string;
  businessModel: BusinessModel; // Determines which features are available
  currency: Currency;
  currentBalance: number;
  minimumBalance: number;
  createdAt: string;
  updatedAt: string;
}

// ============= Product-Based Business Entities =============

// Product Entity
export interface Product {
  id: string;
  businessId: string;
  name: string;
  sku: string;                    // Stock Keeping Unit
  description?: string;
  category?: string;
  unitPrice: number;
  costPrice: number;              // For profit calculation
  currency: string;
  unit: string;                   // e.g., "pcs", "kg", "liters"
  currentStock: number;
  minimumStock: number;           // For reorder alerts
  status: 'active' | 'discontinued' | 'out-of-stock';
  imageUrl?: string;
  createdAt: string;
  updatedAt: string;
}

// Customer/Distributor Entity (Product business equivalent of Client)
export type CustomerType = 'retail' | 'wholesale' | 'distributor';

export interface Customer {
  id: string;
  businessId: string;
  name: string;
  email?: string;
  phone?: string;
  company?: string;
  type: CustomerType;
  address?: string;
  totalPurchases: number;
  outstandingBalance: number;
  createdAt: string;
  updatedAt: string;
}

// Order Item for Sales Orders
export interface OrderItem {
  id: string;
  productId: string;
  productName: string;
  quantity: number;
  unitPrice: number;
  discount: number;
  total: number;
}

// Sales Order Status Types
export type SalesOrderStatus = 'draft' | 'confirmed' | 'processing' | 'shipped' | 'delivered' | 'cancelled';
export type PaymentStatusType = 'pending' | 'partial' | 'paid';

// Sales Order
export interface SalesOrder {
  id: string;
  businessId: string;
  customerId: string;
  orderNumber: string;
  items: OrderItem[];
  subtotal: number;
  discount: number;
  tax: number;
  total: number;
  currency: string;
  status: SalesOrderStatus;
  paymentStatus: PaymentStatusType;
  paidAmount: number;
  orderDate: string;
  deliveryDate?: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

// Production Batch Status
export type ProductionBatchStatus = 'planned' | 'in-progress' | 'completed' | 'cancelled';

// Production Batch (for manufacturing)
export interface ProductionBatch {
  id: string;
  businessId: string;
  productId: string;
  batchNumber: string;
  quantity: number;
  status: ProductionBatchStatus;
  startDate: string;
  completionDate?: string;
  productionCost: number;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

// Purchase Item for Purchase Orders
export interface PurchaseItem {
  id: string;
  productId?: string;
  itemName: string;
  quantity: number;
  unitCost: number;
  receivedQuantity: number;
  total: number;
}

// Purchase Order Status
export type PurchaseOrderStatus = 'draft' | 'ordered' | 'partial' | 'received' | 'cancelled';

// Procurement/Purchase Order
export interface PurchaseOrder {
  id: string;
  businessId: string;
  supplierName: string;
  orderNumber: string;
  items: PurchaseItem[];
  total: number;
  currency: string;
  status: PurchaseOrderStatus;
  orderDate: string;
  expectedDate?: string;
  receivedDate?: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

// ============= Service-Based Business Entities =============

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
  businessIds: string[]; // Partners can be associated with specific businesses
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

export interface ServiceType {
  id: string;
  name: string;
  icon?: string; // lucide icon name e.g. 'Globe', 'Server'
}

export const DEFAULT_SERVICE_TYPES: ServiceType[] = [
  { id: 'domain', name: 'Domain', icon: 'Globe' },
  { id: 'hosting', name: 'Hosting', icon: 'Server' },
  { id: 'software', name: 'Software', icon: 'Code' },
  { id: 'ssl', name: 'SSL Certificate', icon: 'Shield' },
  { id: 'email', name: 'Email Service', icon: 'Mail' },
  { id: 'other', name: 'Other', icon: 'MoreHorizontal' },
];

export interface Renewal {
  id: string;
  businessId: string;
  clientId: string;
  retainerId?: string; // Optional link to a retainer for charging alongside retainer dues
  name: string;
  type?: string; // deprecated, kept for migration
  serviceTypeId?: string;
  amount: number;
  currency: string;
  frequency: 'monthly' | 'quarterly' | 'yearly';
  nextRenewalDate: string;
  description?: string;
  lastPaidDate?: string;
  totalPaid?: number;
  createdAt: string;
  updatedAt: string;
}

export interface RenewalPayment {
  id: string;
  renewalId: string;
  amount: number;
  currency: string;
  date: string;
  invoiceUrl?: string;
  invoiceFileName?: string;
  notes?: string;
  status: 'pending' | 'completed';
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
  serviceTypeId?: string;
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

// User business access control
export type UserBusinessRole = 'owner' | 'admin' | 'viewer';

export interface UserBusinessAccess {
  userId: string;           // Unique identifier (generated on first login)
  email?: string;           // Email for matching with Google Drive users
  businessIds: string[];    // List of business IDs this user can access
  role: UserBusinessRole;   // Role determines permissions
}

// ============= To-Do System =============

// To-Do Priority Levels
export type ToDoPriority = 'low' | 'medium' | 'high' | 'urgent';

// What the to-do is linked to
export type ToDoLinkType = 
  | 'project' 
  | 'quick-task' 
  | 'retainer' 
  | 'client' 
  | 'product' 
  | 'sales-order'
  | 'expense'
  | 'renewal'
  | 'general';

// Who the task is assigned to
export type ToDoAssigneeType = 'self' | 'team-member' | 'partner' | 'operator';

// Individual assignee in a task (for multi-assignee support)
export interface ToDoAssignee {
  type: ToDoAssigneeType;
  id: string;
  name: string;
}

// Main To-Do Entity
export interface ToDo {
  id: string;
  businessId?: string;         // Optional - can be cross-business or specific
  title: string;
  description?: string;
  
  // Timing
  dueDate: string;             // ISO date (the target date)
  originalDueDate?: string;    // Tracks if task was carried forward
  isRecurring?: boolean;
  recurringPattern?: 'daily' | 'weekly' | 'monthly';
  recurringEndDate?: string;   // When to stop recurring
  parentRecurringId?: string;  // Link to original recurring task
  lastGeneratedDate?: string;  // Track last auto-generation
  
  // Status
  status: 'pending' | 'done' | 'cancelled';
  completedAt?: string;
  completedBy?: string;          // userId of who completed
  completedByName?: string;      // Display name of who completed
  
  // Priority
  priority: ToDoPriority;
  
  // Assignment - NEW: Multiple assignees support
  assignees: ToDoAssignee[];
  
  // DEPRECATED: Legacy single-assignee fields (kept for backward compatibility)
  assigneeType?: ToDoAssigneeType;
  assigneeId?: string;
  assigneeName?: string;
  
  createdBy: string;           // Who created this task (userId)
  createdByName?: string;      // Display name of who created this task
  
  // Links to other entities
  linkType: ToDoLinkType;
  linkedEntityId?: string;     // ID of the linked project/client/etc.
  linkedEntityName?: string;   // Cached name for quick display
  
  // Metadata
  tags?: string[];
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface AppData {
  // Core entities
  businesses: Business[];
  projects: Project[];
  teamMembers: TeamMember[];
  partners: Partner[];
  clients: Client[];
  payments: Payment[];
  
  // Salary & Payroll
  salaryRecords: SalaryRecord[];
  salaryPayments: SalaryPayment[];
  payrollPeriods: PayrollPeriod[];
  payslips: Payslip[];
  
  // Financial
  exchangeRates: ExchangeRate[];
  customCurrencies: Currency[];
  expenses: Expense[];
  extraPayments: ExtraPayment[];
  bankAccounts: BankAccount[];
  payables: Payable[];
  receivables: Receivable[];
  
  // Service-based business entities
  serviceTypes: ServiceType[];
  quickTasks: QuickTask[];
  retainers: Retainer[];
  renewals: Renewal[];
  renewalPayments: RenewalPayment[];
  
  // Product-based business entities
  products: Product[];
  customers: Customer[];
  salesOrders: SalesOrder[];
  productionBatches: ProductionBatch[];
  purchaseOrders: PurchaseOrder[];
  
  // To-Do system
  todos: ToDo[];
  
  // Access control
  userBusinessAccess: UserBusinessAccess[];
  currentBusinessId: string | null;
  
  // User preferences
  userSettings: {
    username: string;
    accountName: string;
    userId: string;
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
