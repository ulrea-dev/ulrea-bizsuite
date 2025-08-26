export interface Currency {
  code: string;
  symbol: string;
  name: string;
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

export interface Payment {
  id: string;
  amount: number;
  date: string;
  projectId: string;
  allocationId?: string;
  memberId?: string;
  partnerId?: string;
  clientId?: string;
  type: 'incoming' | 'outgoing';
  recipientType?: 'team' | 'partner' | 'company' | 'client';
  status: 'pending' | 'completed';
  method?: string;
  description?: string;
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
  | 'other';

export interface Expense {
  id: string;
  projectId: string;
  allocationId?: string;
  name: string;
  category: ExpenseCategory;
  amount: number;
  date: string;
  description?: string;
  status: 'pending' | 'paid';
  receipt?: string;
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

export interface AppData {
  businesses: Business[];
  projects: Project[];
  teamMembers: TeamMember[];
  partners: Partner[];
  clients: Client[];
  payments: Payment[];
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
  { value: 'other', label: 'Other' },
];
