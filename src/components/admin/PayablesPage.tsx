import React, { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useBusiness } from '@/contexts/BusinessContext';
import { PayableModal } from '@/components/PayableModal';
import { Payable, SUPPORTED_CURRENCIES } from '@/types/business';
import { groupByCurrency, formatCurrencyAmount } from '@/utils/currencySummary';
import { CurrencyTotals } from './CurrencyTotals';
import { 
  Plus, 
  ArrowUpRight, 
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

const STATUS_STYLES: Record<string, { variant: 'default' | 'secondary' | 'destructive' | 'outline'; icon: React.ReactNode }> = {
  paid: { variant: 'default', icon: <CheckCircle className="h-3 w-3" /> },
  pending: { variant: 'secondary', icon: <Clock className="h-3 w-3" /> },
  partial: { variant: 'outline', icon: <TrendingUp className="h-3 w-3" /> },
  overdue: { variant: 'destructive', icon: <AlertCircle className="h-3 w-3" /> },
};

export const PayablesPage: React.FC = () => {
  const { data, currentBusiness, dispatch } = useBusiness();
  
  const [payableModalOpen, setPayableModalOpen] = useState(false);
  const [selectedPayable, setSelectedPayable] = useState<Payable | null>(null);
  const [deletePayableId, setDeletePayableId] = useState<string | null>(null);
  const [currencyFilter, setCurrencyFilter] = useState<string>('all');
  const [businessFilter, setBusinessFilter] = useState<string>('all');

  const allCurrencies = [...SUPPORTED_CURRENCIES, ...(data.customCurrencies || [])];

  // Get all payables (admin view shows all businesses)
  const allPayables = useMemo(() => 
    data.payables || [],
    [data.payables]
  );

  // Filter by selected business
  const payables = useMemo(() => 
    businessFilter === 'all' 
      ? allPayables 
      : allPayables.filter((p) => p.businessId === businessFilter),
    [allPayables, businessFilter]
  );

  // Helper to get business name
  const getBusinessName = (businessId: string) => 
    data.businesses.find(b => b.id === businessId)?.name || 'Unknown';

  // Get unique currencies from payables
  const availableCurrencies = useMemo(() => 
    [...new Set(payables.map(p => p.currency))],
    [payables]
  );

  const filteredPayables = useMemo(() => 
    currencyFilter === 'all' ? payables : payables.filter(p => p.currency === currencyFilter),
    [payables, currencyFilter]
  );

  const pendingPayables = useMemo(() =>
    payables.filter((p) => p.status !== 'paid'),
    [payables]
  );

  const totalsByCurrency = useMemo(() => 
    groupByCurrency(
      pendingPayables,
      (p) => p.amount - p.paidAmount,
      (p) => p.currency
    ),
    [pendingPayables]
  );

  const pendingCount = payables.filter(p => p.status === 'pending').length;
  const overdueCount = payables.filter(p => p.status === 'overdue').length;

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

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold">Payables</h1>
          <p className="text-muted-foreground text-sm sm:text-base">
            Track money owed to vendors across all businesses
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Select value={businessFilter} onValueChange={setBusinessFilter}>
            <SelectTrigger className="w-[180px]">
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
          <Button onClick={() => { setSelectedPayable(null); setPayableModalOpen(true); }}>
            <Plus className="h-4 w-4 mr-2" />
            Add Payable
          </Button>
        </div>
      </div>

      {/* Summary Card */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
            <ArrowUpRight className="h-4 w-4 text-destructive" />
            Total Outstanding
          </CardTitle>
        </CardHeader>
        <CardContent>
          <CurrencyTotals 
            totals={totalsByCurrency}
            customCurrencies={data.customCurrencies || []}
            amountClassName="text-3xl text-destructive"
          />
          <div className="flex items-center gap-4 mt-2 text-sm text-muted-foreground">
            <span>{pendingCount} pending</span>
            {overdueCount > 0 && (
              <span className="text-destructive flex items-center gap-1">
                <AlertCircle className="h-3 w-3" />
                {overdueCount} overdue
              </span>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Currency Filter & Payables Table */}
      {payables.length === 0 ? (
        <Card>
          <CardContent className="py-8 text-center text-muted-foreground">
            No payables recorded. Add bills or invoices you need to pay.
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base">All Payables</CardTitle>
              <Select value={currencyFilter} onValueChange={setCurrencyFilter}>
                <SelectTrigger className="w-[140px]">
                  <SelectValue placeholder="Filter by currency" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Currencies</SelectItem>
                  {availableCurrencies.map((currency) => (
                    <SelectItem key={currency} value={currency}>
                      {currency}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </CardHeader>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Vendor</TableHead>
                <TableHead>Business</TableHead>
                <TableHead>Amount</TableHead>
                <TableHead>Currency</TableHead>
                <TableHead>Paid</TableHead>
                <TableHead>Due Date</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredPayables.map((payable) => (
                <TableRow key={payable.id}>
                  <TableCell className="font-medium">
                    {payable.vendorName}
                    {payable.invoiceRef && (
                      <span className="text-xs text-muted-foreground ml-2">({payable.invoiceRef})</span>
                    )}
                  </TableCell>
                  <TableCell>
                    <Badge variant="secondary" className="text-xs font-normal">
                      {getBusinessName(payable.businessId)}
                    </Badge>
                  </TableCell>
                  <TableCell>{formatCurrencyAmount(payable.amount, payable.currency, data.customCurrencies || [])}</TableCell>
                  <TableCell>
                    <Badge variant="outline" className="text-xs">{payable.currency}</Badge>
                  </TableCell>
                  <TableCell>{formatCurrencyAmount(payable.paidAmount, payable.currency, data.customCurrencies || [])}</TableCell>
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

      {/* Modals */}
      <PayableModal
        isOpen={payableModalOpen}
        onClose={() => setPayableModalOpen(false)}
        payable={selectedPayable}
      />

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
            <AlertDialogAction onClick={handleDeletePayable} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};
