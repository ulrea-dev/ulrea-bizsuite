import React, { useState, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useBusiness } from '@/contexts/BusinessContext';
import { BankAccountModal } from './BankAccountModal';
import { PayableModal } from './PayableModal';
import { ReceivableModal } from './ReceivableModal';
import { BankAccount, Payable, Receivable, SUPPORTED_CURRENCIES } from '@/types/business';
import { 
  Plus, 
  Wallet, 
  CreditCard, 
  ArrowDownLeft, 
  ArrowUpRight, 
  Building, 
  Pencil, 
  Trash2,
  CheckCircle,
  AlertCircle,
  Clock,
  TrendingUp
} from 'lucide-react';
import { format } from 'date-fns';
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

const VALID_TABS = ['bank-accounts', 'payables', 'receivables'] as const;
type TabValue = typeof VALID_TABS[number];

const ACCOUNT_TYPE_ICONS: Record<string, React.ReactNode> = {
  bank: <Building className="h-4 w-4" />,
  stripe: <CreditCard className="h-4 w-4" />,
  paypal: <Wallet className="h-4 w-4" />,
  cash: <Wallet className="h-4 w-4" />,
  crypto: <Wallet className="h-4 w-4" />,
  other: <Wallet className="h-4 w-4" />,
};

const STATUS_STYLES: Record<string, { variant: 'default' | 'secondary' | 'destructive' | 'outline'; icon: React.ReactNode }> = {
  paid: { variant: 'default', icon: <CheckCircle className="h-3 w-3" /> },
  pending: { variant: 'secondary', icon: <Clock className="h-3 w-3" /> },
  partial: { variant: 'outline', icon: <TrendingUp className="h-3 w-3" /> },
  overdue: { variant: 'destructive', icon: <AlertCircle className="h-3 w-3" /> },
};

export const AccountsPage: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const tabParam = searchParams.get('tab');
  const activeTab: TabValue = VALID_TABS.includes(tabParam as TabValue) ? (tabParam as TabValue) : 'bank-accounts';

  const { data, currentBusiness, dispatch } = useBusiness();
  
  // Modals
  const [accountModalOpen, setAccountModalOpen] = useState(false);
  const [payableModalOpen, setPayableModalOpen] = useState(false);
  const [receivableModalOpen, setReceivableModalOpen] = useState(false);
  const [selectedAccount, setSelectedAccount] = useState<BankAccount | null>(null);
  const [selectedPayable, setSelectedPayable] = useState<Payable | null>(null);
  const [selectedReceivable, setSelectedReceivable] = useState<Receivable | null>(null);
  
  // Delete dialogs
  const [deleteAccountId, setDeleteAccountId] = useState<string | null>(null);
  const [deletePayableId, setDeletePayableId] = useState<string | null>(null);
  const [deleteReceivableId, setDeleteReceivableId] = useState<string | null>(null);

  const allCurrencies = [...SUPPORTED_CURRENCIES, ...(data.customCurrencies || [])];
  
  const getCurrencySymbol = (code: string) => {
    return allCurrencies.find((c) => c.code === code)?.symbol || code;
  };

  const formatCurrency = (amount: number, currencyCode: string) => {
    const symbol = getCurrencySymbol(currencyCode);
    return `${symbol}${amount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

  // Filter data by current business
  const bankAccounts = useMemo(() => 
    data.bankAccounts.filter((a) => a.businessId === currentBusiness?.id),
    [data.bankAccounts, currentBusiness?.id]
  );

  const payables = useMemo(() => 
    data.payables.filter((p) => p.businessId === currentBusiness?.id),
    [data.payables, currentBusiness?.id]
  );

  const receivables = useMemo(() => 
    data.receivables.filter((r) => r.businessId === currentBusiness?.id),
    [data.receivables, currentBusiness?.id]
  );

  // Summary calculations
  const totalInAccounts = useMemo(() => 
    bankAccounts.reduce((sum, a) => sum + a.balance, 0),
    [bankAccounts]
  );

  const totalPayables = useMemo(() => 
    payables.filter((p) => p.status !== 'paid').reduce((sum, p) => sum + (p.amount - p.paidAmount), 0),
    [payables]
  );

  const totalReceivables = useMemo(() => 
    receivables.filter((r) => r.status !== 'paid').reduce((sum, r) => sum + (r.amount - r.receivedAmount), 0),
    [receivables]
  );

  const netPosition = totalInAccounts + totalReceivables - totalPayables;

  const handleTabChange = (value: string) => {
    setSearchParams({ tab: value });
  };

  // Bank Account handlers
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

  // Payable handlers
  const handleEditPayable = (payable: Payable) => {
    setSelectedPayable(payable);
    setPayableModalOpen(true);
  };

  const handleDeletePayable = () => {
    if (deletePayableId) {
      dispatch({ type: 'DELETE_PAYABLE', payload: deletePayableId });
      setDeletePayableId(null);
    }
  };

  const handleMarkPayablePaid = (payable: Payable) => {
    dispatch({
      type: 'UPDATE_PAYABLE',
      payload: {
        id: payable.id,
        updates: {
          paidAmount: payable.amount,
          status: 'paid',
        },
      },
    });
  };

  // Receivable handlers
  const handleEditReceivable = (receivable: Receivable) => {
    setSelectedReceivable(receivable);
    setReceivableModalOpen(true);
  };

  const handleDeleteReceivable = () => {
    if (deleteReceivableId) {
      dispatch({ type: 'DELETE_RECEIVABLE', payload: deleteReceivableId });
      setDeleteReceivableId(null);
    }
  };

  const handleMarkReceivableReceived = (receivable: Receivable) => {
    dispatch({
      type: 'UPDATE_RECEIVABLE',
      payload: {
        id: receivable.id,
        updates: {
          receivedAmount: receivable.amount,
          status: 'paid',
        },
      },
    });
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
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold">Accounts</h1>
        <p className="text-muted-foreground text-sm sm:text-base">
          Track bank accounts, money you owe, and money owed to you
        </p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <Wallet className="h-4 w-4" />
              Total in Accounts
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">
              {formatCurrency(totalInAccounts, currentBusiness.currency.code)}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <ArrowUpRight className="h-4 w-4 text-destructive" />
              Total Payables
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-destructive">
              {formatCurrency(totalPayables, currentBusiness.currency.code)}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <ArrowDownLeft className="h-4 w-4 text-green-600" />
              Total Receivables
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-green-600">
              {formatCurrency(totalReceivables, currentBusiness.currency.code)}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <TrendingUp className="h-4 w-4" />
              Net Position
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className={`text-2xl font-bold ${netPosition >= 0 ? 'text-green-600' : 'text-destructive'}`}>
              {formatCurrency(netPosition, currentBusiness.currency.code)}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={handleTabChange} className="space-y-6">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="bank-accounts" className="gap-1.5">
            <Wallet className="h-4 w-4" />
            <span className="hidden sm:inline">Bank Accounts</span>
            <span className="sm:hidden">Accounts</span>
          </TabsTrigger>
          <TabsTrigger value="payables" className="gap-1.5">
            <ArrowUpRight className="h-4 w-4" />
            <span className="hidden sm:inline">Payables</span>
            <span className="sm:hidden">Owe</span>
          </TabsTrigger>
          <TabsTrigger value="receivables" className="gap-1.5">
            <ArrowDownLeft className="h-4 w-4" />
            <span className="hidden sm:inline">Receivables</span>
            <span className="sm:hidden">Owed</span>
          </TabsTrigger>
        </TabsList>

        {/* Bank Accounts Tab */}
        <TabsContent value="bank-accounts" className="space-y-4">
          <div className="flex justify-between items-center">
            <h2 className="text-lg font-semibold">Your Accounts</h2>
            <Button onClick={() => { setSelectedAccount(null); setAccountModalOpen(true); }}>
              <Plus className="h-4 w-4 mr-2" />
              Add Account
            </Button>
          </div>

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
        </TabsContent>

        {/* Payables Tab */}
        <TabsContent value="payables" className="space-y-4">
          <div className="flex justify-between items-center">
            <h2 className="text-lg font-semibold">Money You Owe</h2>
            <Button onClick={() => { setSelectedPayable(null); setPayableModalOpen(true); }}>
              <Plus className="h-4 w-4 mr-2" />
              Add Payable
            </Button>
          </div>

          {payables.length === 0 ? (
            <Card>
              <CardContent className="py-8 text-center text-muted-foreground">
                No payables recorded. Add bills or invoices you need to pay.
              </CardContent>
            </Card>
          ) : (
            <Card>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Vendor</TableHead>
                    <TableHead>Amount</TableHead>
                    <TableHead>Paid</TableHead>
                    <TableHead>Due Date</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {payables.map((payable) => (
                    <TableRow key={payable.id}>
                      <TableCell className="font-medium">
                        {payable.vendorName}
                        {payable.invoiceRef && (
                          <span className="text-xs text-muted-foreground ml-2">({payable.invoiceRef})</span>
                        )}
                      </TableCell>
                      <TableCell>{formatCurrency(payable.amount, payable.currency)}</TableCell>
                      <TableCell>{formatCurrency(payable.paidAmount, payable.currency)}</TableCell>
                      <TableCell>{format(new Date(payable.dueDate), 'MMM d, yyyy')}</TableCell>
                      <TableCell>
                        <Badge variant={STATUS_STYLES[payable.status]?.variant} className="gap-1">
                          {STATUS_STYLES[payable.status]?.icon}
                          {payable.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex gap-1 justify-end">
                          {payable.status !== 'paid' && (
                            <Button variant="ghost" size="sm" onClick={() => handleMarkPayablePaid(payable)}>
                              <CheckCircle className="h-4 w-4" />
                            </Button>
                          )}
                          <Button variant="ghost" size="sm" onClick={() => handleEditPayable(payable)}>
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="sm" onClick={() => setDeletePayableId(payable.id)}>
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </Card>
          )}
        </TabsContent>

        {/* Receivables Tab */}
        <TabsContent value="receivables" className="space-y-4">
          <div className="flex justify-between items-center">
            <h2 className="text-lg font-semibold">Money Owed to You</h2>
            <Button onClick={() => { setSelectedReceivable(null); setReceivableModalOpen(true); }}>
              <Plus className="h-4 w-4 mr-2" />
              Add Receivable
            </Button>
          </div>

          {receivables.length === 0 ? (
            <Card>
              <CardContent className="py-8 text-center text-muted-foreground">
                No receivables recorded. Add invoices or payments you expect to receive.
              </CardContent>
            </Card>
          ) : (
            <Card>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Source</TableHead>
                    <TableHead>Amount</TableHead>
                    <TableHead>Received</TableHead>
                    <TableHead>Due Date</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {receivables.map((receivable) => (
                    <TableRow key={receivable.id}>
                      <TableCell className="font-medium">
                        {receivable.sourceName}
                        {receivable.invoiceRef && (
                          <span className="text-xs text-muted-foreground ml-2">({receivable.invoiceRef})</span>
                        )}
                      </TableCell>
                      <TableCell>{formatCurrency(receivable.amount, receivable.currency)}</TableCell>
                      <TableCell>{formatCurrency(receivable.receivedAmount, receivable.currency)}</TableCell>
                      <TableCell>{format(new Date(receivable.dueDate), 'MMM d, yyyy')}</TableCell>
                      <TableCell>
                        <Badge variant={STATUS_STYLES[receivable.status]?.variant} className="gap-1">
                          {STATUS_STYLES[receivable.status]?.icon}
                          {receivable.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex gap-1 justify-end">
                          {receivable.status !== 'paid' && (
                            <Button variant="ghost" size="sm" onClick={() => handleMarkReceivableReceived(receivable)}>
                              <CheckCircle className="h-4 w-4" />
                            </Button>
                          )}
                          <Button variant="ghost" size="sm" onClick={() => handleEditReceivable(receivable)}>
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="sm" onClick={() => setDeleteReceivableId(receivable.id)}>
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </Card>
          )}
        </TabsContent>
      </Tabs>

      {/* Modals */}
      <BankAccountModal
        isOpen={accountModalOpen}
        onClose={() => { setAccountModalOpen(false); setSelectedAccount(null); }}
        account={selectedAccount}
      />
      <PayableModal
        isOpen={payableModalOpen}
        onClose={() => { setPayableModalOpen(false); setSelectedPayable(null); }}
        payable={selectedPayable}
      />
      <ReceivableModal
        isOpen={receivableModalOpen}
        onClose={() => { setReceivableModalOpen(false); setSelectedReceivable(null); }}
        receivable={selectedReceivable}
      />

      {/* Delete Dialogs */}
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
            <AlertDialogAction onClick={handleDeleteAccount}>Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={!!deletePayableId} onOpenChange={() => setDeletePayableId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Payable</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this payable? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeletePayable}>Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={!!deleteReceivableId} onOpenChange={() => setDeleteReceivableId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Receivable</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this receivable? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteReceivable}>Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};
