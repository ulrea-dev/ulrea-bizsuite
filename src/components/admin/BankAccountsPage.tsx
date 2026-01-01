import React, { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useBusiness } from '@/contexts/BusinessContext';
import { BankAccountModal } from '@/components/BankAccountModal';
import { BankAccount, SUPPORTED_CURRENCIES } from '@/types/business';
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

  const allCurrencies = [...SUPPORTED_CURRENCIES, ...(data.customCurrencies || [])];
  
  const getCurrencySymbol = (code: string) => {
    return allCurrencies.find((c) => c.code === code)?.symbol || code;
  };

  const formatCurrency = (amount: number, currencyCode: string) => {
    const symbol = getCurrencySymbol(currencyCode);
    return `${symbol}${amount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

  const bankAccounts = useMemo(() => 
    data.bankAccounts.filter((a) => a.businessId === currentBusiness?.id),
    [data.bankAccounts, currentBusiness?.id]
  );

  const totalInAccounts = useMemo(() => 
    bankAccounts.reduce((sum, a) => sum + a.balance, 0),
    [bankAccounts]
  );

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

  if (!currentBusiness) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-muted-foreground">Please select a business to view accounts.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold">Bank Accounts</h1>
          <p className="text-muted-foreground text-sm sm:text-base">
            Manage your payment accounts and balances
          </p>
        </div>
        <Button onClick={() => { setSelectedAccount(null); setAccountModalOpen(true); }}>
          <Plus className="h-4 w-4 mr-2" />
          Add Account
        </Button>
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
          <p className="text-3xl font-bold">
            {formatCurrency(totalInAccounts, currentBusiness.currency.code)}
          </p>
          <p className="text-sm text-muted-foreground mt-1">
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
                  {account.isDefault && (
                    <Badge variant="secondary" className="text-xs">Default</Badge>
                  )}
                </div>
                <p className="text-xs text-muted-foreground capitalize">{account.type}</p>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold mb-2">
                  {formatCurrency(account.balance, account.currency)}
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
