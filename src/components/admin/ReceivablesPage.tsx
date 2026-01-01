import React, { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useBusiness } from '@/contexts/BusinessContext';
import { ReceivableModal } from '@/components/ReceivableModal';
import { Receivable, SUPPORTED_CURRENCIES } from '@/types/business';
import { groupByCurrency, formatCurrencyAmount } from '@/utils/currencySummary';
import { CurrencyTotals } from './CurrencyTotals';
import { 
  Plus, 
  ArrowDownLeft, 
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

export const ReceivablesPage: React.FC = () => {
  const { data, currentBusiness, dispatch } = useBusiness();
  
  const [receivableModalOpen, setReceivableModalOpen] = useState(false);
  const [selectedReceivable, setSelectedReceivable] = useState<Receivable | null>(null);
  const [deleteReceivableId, setDeleteReceivableId] = useState<string | null>(null);
  const [currencyFilter, setCurrencyFilter] = useState<string>('all');
  const [businessFilter, setBusinessFilter] = useState<string>('all');

  const allCurrencies = [...SUPPORTED_CURRENCIES, ...(data.customCurrencies || [])];

  // Get all receivables (admin view shows all businesses)
  const allReceivables = useMemo(() => 
    data.receivables || [],
    [data.receivables]
  );

  // Filter by selected business
  const receivables = useMemo(() => 
    businessFilter === 'all' 
      ? allReceivables 
      : allReceivables.filter((r) => r.businessId === businessFilter),
    [allReceivables, businessFilter]
  );

  // Helper to get business name
  const getBusinessName = (businessId: string) => 
    data.businesses.find(b => b.id === businessId)?.name || 'Unknown';

  // Get unique currencies from receivables
  const availableCurrencies = useMemo(() => 
    [...new Set(receivables.map(r => r.currency))],
    [receivables]
  );

  const filteredReceivables = useMemo(() => 
    currencyFilter === 'all' ? receivables : receivables.filter(r => r.currency === currencyFilter),
    [receivables, currencyFilter]
  );

  const pendingReceivables = useMemo(() =>
    receivables.filter((r) => r.status !== 'paid'),
    [receivables]
  );

  const totalsByCurrency = useMemo(() => 
    groupByCurrency(
      pendingReceivables,
      (r) => r.amount - r.receivedAmount,
      (r) => r.currency
    ),
    [pendingReceivables]
  );

  const pendingCount = receivables.filter(r => r.status === 'pending').length;
  const overdueCount = receivables.filter(r => r.status === 'overdue').length;

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

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold">Receivables</h1>
          <p className="text-muted-foreground text-sm sm:text-base">
            Track money owed to you across all businesses
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
          <Button onClick={() => { setSelectedReceivable(null); setReceivableModalOpen(true); }}>
            <Plus className="h-4 w-4 mr-2" />
            Add Receivable
          </Button>
        </div>
      </div>

      {/* Summary Card */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
            <ArrowDownLeft className="h-4 w-4 text-green-600" />
            Total Expected
          </CardTitle>
        </CardHeader>
        <CardContent>
          <CurrencyTotals 
            totals={totalsByCurrency}
            customCurrencies={data.customCurrencies || []}
            amountClassName="text-3xl text-green-600"
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

      {/* Currency Filter & Receivables Table */}
      {receivables.length === 0 ? (
        <Card>
          <CardContent className="py-8 text-center text-muted-foreground">
            No receivables recorded. Add invoices or payments you expect to receive.
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base">All Receivables</CardTitle>
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
                <TableHead>Source</TableHead>
                <TableHead>Business</TableHead>
                <TableHead>Amount</TableHead>
                <TableHead>Currency</TableHead>
                <TableHead>Received</TableHead>
                <TableHead>Due Date</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredReceivables.map((receivable) => (
                <TableRow key={receivable.id}>
                  <TableCell className="font-medium">
                    {receivable.sourceName}
                    {receivable.invoiceRef && (
                      <span className="text-xs text-muted-foreground ml-2">({receivable.invoiceRef})</span>
                    )}
                  </TableCell>
                  <TableCell>
                    <Badge variant="secondary" className="text-xs font-normal">
                      {getBusinessName(receivable.businessId)}
                    </Badge>
                  </TableCell>
                  <TableCell>{formatCurrencyAmount(receivable.amount, receivable.currency, data.customCurrencies || [])}</TableCell>
                  <TableCell>
                    <Badge variant="outline" className="text-xs">{receivable.currency}</Badge>
                  </TableCell>
                  <TableCell>{formatCurrencyAmount(receivable.receivedAmount, receivable.currency, data.customCurrencies || [])}</TableCell>
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

      {/* Modals */}
      <ReceivableModal
        isOpen={receivableModalOpen}
        onClose={() => setReceivableModalOpen(false)}
        receivable={selectedReceivable}
      />

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
            <AlertDialogAction onClick={handleDeleteReceivable} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};
