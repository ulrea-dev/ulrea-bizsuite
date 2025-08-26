
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
  defaultRate: number;
  paymentHistory: Payment[];
  createdAt: string;
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
  memberId?: string;
  clientId?: string;
  type: 'incoming' | 'outgoing';
  status: 'pending' | 'completed';
  method?: string;
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
  teamAllocations: TeamAllocation[];
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
