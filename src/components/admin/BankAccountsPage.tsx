import React, { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useBusiness } from '@/contexts/BusinessContext';
import { BankAccountModal } from '@/components/BankAccountModal';
import { BankAccount, SUPPORTED_CURRENCIES } from '@/types/business';
import { groupByCurrency, formatCurrencyAmount } from '@/utils/currencySummary';
import { CurrencyTotals } from './CurrencyTotals';
import { 
  Plus, 
  Wallet, 
  CreditCard, 
  Building, 
  Pencil, 
  Trash2
} from 'lucide-react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';

const ACCOUNT_TYPE_ICONS: Record<string, React.ReactNode> = {
  bank: <Building className="h-4 w-4" />,
  stripe: <CreditCard className="h-4 w-4" />,
  paypal: <Wallet className="h-4 w-4" />,
  cash: <Wallet className="h-4 w-4" />,
  crypto: <Wallet className="h-4 w-4" />,
  other: <Wallet className="h-4 w-4" />,
};

export const BankAccountsPage: React.FC = () => {
  const { data, currentBusiness, dispatch } = useBusiness();
  
  const [accountModalOpen, setAccountModalOpen] = useState(false);
  const [selectedAccount, setSelectedAccount] = useState<BankAccount | null>(null);
  const [deleteAccountId, setDeleteAccountId] = useState<string | null>(null);
  const [businessFilter, setBusinessFilter] = useState<string>('all');

  const allCurrencies = [...SUPPORTED_CURRENCIES, ...(data.customCurrencies || [])];

  // Get all bank accounts (admin view shows all businesses)
  const allBankAccounts = useMemo(() => 
    data.bankAccounts || [],
    [data.bankAccounts]
  );

  // Filter by selected business
  const bankAccounts = useMemo(() => 
    businessFilter === 'all' 
      ? allBankAccounts 
      : allBankAccounts.filter((a) => a.businessId === businessFilter),
    [allBankAccounts, businessFilter]
  );

  // Get businesses that have accounts
  const businessesWithAccounts = useMemo(() => 
    [...new Set(allBankAccounts.map(a => a.businessId))],
    [allBankAccounts]
  );

  const totalsByCurrency = useMemo(() => 
    groupByCurrency(
      bankAccounts,
      (a) => a.balance,
      (a) => a.currency
    ),
    [bankAccounts]
  );

  // Helper to get business name
  const getBusinessName = (businessId: string) => 
    data.businesses.find(b => b.id === businessId)?.name || 'Unknown';

  const handleEditAccount = (account: BankAccount) => {
    setSelectedAccount(account);
    setAccountModalOpen(true);
  };

  const handleDeleteAccount = () => {
    if (deleteAccountId) {
      dispatch({ type: 'DELETE_BANK_ACCOUNT', payload: deleteAccountId });
      setDeleteAccountId(null);
    }
  };

  return (
    <div className="space-y-4 sm:space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start gap-3 sm:gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl md:text-3xl font-bold">Bank Accounts</h1>
          <p className="text-muted-foreground text-sm">
            Manage payment accounts across all businesses
          </p>
        </div>
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 w-full sm:w-auto">
          <Select value={businessFilter} onValueChange={setBusinessFilter}>
            <SelectTrigger className="w-full sm:w-[180px]">
              <SelectValue placeholder="Filter by business" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Businesses</SelectItem>
              {data.businesses.map((business) => (
                <SelectItem key={business.id} value={business.id}>
                  {business.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button onClick={() => { setSelectedAccount(null); setAccountModalOpen(true); }} className="w-full sm:w-auto">
            <Plus className="h-4 w-4 mr-2" />
            Add Account
          </Button>
        </div>
      </div>

      {/* Summary Card */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
            <Wallet className="h-4 w-4" />
            Total Balance
          </CardTitle>
        </CardHeader>
        <CardContent>
          <CurrencyTotals 
            totals={totalsByCurrency}
            customCurrencies={data.customCurrencies || []}
            amountClassName="text-3xl"
          />
          <p className="text-sm text-muted-foreground mt-2">
            Across {bankAccounts.length} account{bankAccounts.length !== 1 ? 's' : ''}
          </p>
        </CardContent>
      </Card>

      {/* Accounts Grid */}
      {bankAccounts.length === 0 ? (
        <Card>
          <CardContent className="py-8 text-center text-muted-foreground">
            No accounts yet. Add your first bank or payment account to get started.
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {bankAccounts.map((account) => (
            <Card key={account.id} className={account.isDefault ? 'border-primary' : ''}>
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    {ACCOUNT_TYPE_ICONS[account.type]}
                    <CardTitle className="text-base">{account.name}</CardTitle>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="text-xs">{account.currency}</Badge>
                    {account.isDefault && (
                      <Badge variant="secondary" className="text-xs">Default</Badge>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-2 mt-1">
                  <p className="text-xs text-muted-foreground capitalize">{account.type}</p>
                  <span className="text-xs text-muted-foreground">•</span>
                  <Badge variant="secondary" className="text-xs font-normal">
                    {getBusinessName(account.businessId)}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold mb-2">
                  {formatCurrencyAmount(account.balance, account.currency, data.customCurrencies || [])}
                </p>
                {account.accountNumber && (
                  <p className="text-xs text-muted-foreground">•••• {account.accountNumber}</p>
                )}
                {account.description && (
                  <p className="text-sm text-muted-foreground mt-2">{account.description}</p>
                )}
                <div className="flex gap-2 mt-4">
                  <Button variant="outline" size="sm" onClick={() => handleEditAccount(account)}>
                    <Pencil className="h-3 w-3 mr-1" />
                    Edit
                  </Button>
                  <Button variant="outline" size="sm" onClick={() => setDeleteAccountId(account.id)}>
                    <Trash2 className="h-3 w-3 mr-1" />
                    Delete
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Modals */}
      <BankAccountModal
        isOpen={accountModalOpen}
        onClose={() => setAccountModalOpen(false)}
        account={selectedAccount}
      />

      <AlertDialog open={!!deleteAccountId} onOpenChange={() => setDeleteAccountId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Account</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this account? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteAccount} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};
