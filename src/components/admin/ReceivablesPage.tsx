import React, { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useBusiness } from '@/contexts/BusinessContext';
import { ReceivableModal } from '@/components/ReceivableModal';
import { Receivable, ReceivablePaymentRecord, SUPPORTED_CURRENCIES } from '@/types/business';
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
  TrendingUp,
  ChevronDown,
  ChevronRight,
  Link2
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
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';

const STATUS_STYLES: Record<string, { variant: 'default' | 'secondary' | 'destructive' | 'outline'; icon: React.ReactNode }> = {
  paid: { variant: 'default', icon: <CheckCircle className="h-3 w-3" /> },
  pending: { variant: 'secondary', icon: <Clock className="h-3 w-3" /> },
  partial: { variant: 'outline', icon: <TrendingUp className="h-3 w-3" /> },
  overdue: { variant: 'destructive', icon: <AlertCircle className="h-3 w-3" /> },
};

// Component to display individual payment records
const PaymentRecordsList: React.FC<{ 
  records: ReceivablePaymentRecord[]; 
  currency: string;
  customCurrencies: any[];
}> = ({ records, currency, customCurrencies }) => {
  if (!records || records.length === 0) {
    return (
      <div className="text-sm text-muted-foreground py-2 pl-8">
        No payments recorded yet
      </div>
    );
  }

  return (
    <div className="py-2 pl-8 space-y-2">
      {records.map((record, index) => (
        <div key={record.id || index} className="flex items-center justify-between text-sm bg-muted/50 rounded-lg px-3 py-2">
          <div className="flex items-center gap-3">
            <CheckCircle className="h-3 w-3 text-green-600" />
            <span className="text-muted-foreground">
              {format(new Date(record.date), 'MMM d, yyyy')}
            </span>
            {record.description && (
              <span className="text-muted-foreground">• {record.description}</span>
            )}
          </div>
          <span className="font-medium text-green-600">
            +{formatCurrencyAmount(record.amount, currency, customCurrencies)}
          </span>
        </div>
      ))}
    </div>
  );
};

export const ReceivablesPage: React.FC = () => {
  const { data, currentBusiness, dispatch } = useBusiness();
  
  const [receivableModalOpen, setReceivableModalOpen] = useState(false);
  const [selectedReceivable, setSelectedReceivable] = useState<Receivable | null>(null);
  const [deleteReceivableId, setDeleteReceivableId] = useState<string | null>(null);
  const [currencyFilter, setCurrencyFilter] = useState<string>('all');
  const [businessFilter, setBusinessFilter] = useState<string>('all');
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set());

  const toggleRow = (id: string) => {
    setExpandedRows(prev => {
      const newSet = new Set(prev);
      if (newSet.has(id)) {
        newSet.delete(id);
      } else {
        newSet.add(id);
      }
      return newSet;
    });
  };

  // Compute project-based receivables from projects and their payments
  const computedProjectReceivables = useMemo(() => {
    const businessProjects = businessFilter === 'all'
      ? data.projects
      : data.projects.filter(p => p.businessId === businessFilter);

    return businessProjects.map(project => {
      const business = data.businesses.find(b => b.id === project.businessId);
      const client = project.clientId ? data.clients.find(c => c.id === project.clientId) : null;
      
      // Get all incoming client payments for this project
      const clientPayments = data.payments.filter(
        p => p.projectId === project.id && p.type === 'incoming'
      );

      // Calculate total project value
      const totalProjectValue = project.isMultiPhase && project.allocations?.length
        ? project.allocations.reduce((sum, allocation) => sum + allocation.budget, 0)
        : project.totalValue;

      // Calculate received amount from payments
      const receivedAmount = clientPayments.reduce((sum, p) => sum + p.amount, 0);

      // Create payment records
      const paymentRecords: ReceivablePaymentRecord[] = clientPayments.map(payment => ({
        id: payment.id,
        amount: payment.amount,
        date: payment.date,
        paymentId: payment.id,
        description: payment.description,
      }));

      // Determine status
      let status: Receivable['status'] = 'pending';
      if (receivedAmount >= totalProjectValue) {
        status = 'paid';
      } else if (receivedAmount > 0) {
        status = 'partial';
      } else if (project.endDate && new Date(project.endDate) < new Date()) {
        status = 'overdue';
      }

      const currency = business?.currency.code || 'USD';

      return {
        id: `project-${project.id}`,
        businessId: project.businessId,
        projectId: project.id,
        clientId: project.clientId,
        sourceName: client ? `${project.name} - ${client.name}` : project.name,
        amount: totalProjectValue,
        receivedAmount,
        currency,
        dueDate: project.endDate || new Date().toISOString().split('T')[0],
        status,
        paymentRecords,
        isProjectSynced: true,
        createdAt: project.createdAt,
        updatedAt: project.updatedAt,
      } as Receivable;
    }).filter(r => r.amount > 0); // Only show projects with value
  }, [data.projects, data.payments, data.clients, data.businesses, businessFilter]);

  // Get manual receivables (non-project-synced)
  const manualReceivables = useMemo(() => {
    const allReceivables = data.receivables || [];
    return businessFilter === 'all' 
      ? allReceivables.filter(r => !r.isProjectSynced)
      : allReceivables.filter(r => r.businessId === businessFilter && !r.isProjectSynced);
  }, [data.receivables, businessFilter]);

  // Combine all receivables
  const allReceivables = useMemo(() => 
    [...computedProjectReceivables, ...manualReceivables],
    [computedProjectReceivables, manualReceivables]
  );

  // Helper to get business name
  const getBusinessName = (businessId: string) => 
    data.businesses.find(b => b.id === businessId)?.name || 'Unknown';

  // Get unique currencies from receivables
  const availableCurrencies = useMemo(() => 
    [...new Set(allReceivables.map(r => r.currency))],
    [allReceivables]
  );

  const filteredReceivables = useMemo(() => 
    currencyFilter === 'all' ? allReceivables : allReceivables.filter(r => r.currency === currencyFilter),
    [allReceivables, currencyFilter]
  );

  const pendingReceivables = useMemo(() =>
    allReceivables.filter((r) => r.status !== 'paid'),
    [allReceivables]
  );

  const totalsByCurrency = useMemo(() => 
    groupByCurrency(
      pendingReceivables,
      (r) => r.amount - r.receivedAmount,
      (r) => r.currency
    ),
    [pendingReceivables]
  );

  const pendingCount = allReceivables.filter(r => r.status === 'pending').length;
  const overdueCount = allReceivables.filter(r => r.status === 'overdue').length;
  const partialCount = allReceivables.filter(r => r.status === 'partial').length;

  const handleEditReceivable = (receivable: Receivable) => {
    // Only allow editing non-synced receivables
    if (receivable.isProjectSynced) return;
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
    // Only allow marking non-synced receivables as received
    if (receivable.isProjectSynced) return;
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
    <div className="space-y-4 sm:space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start gap-3 sm:gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl md:text-3xl font-bold">Receivables</h1>
          <p className="text-muted-foreground text-sm">
            Track money owed to you across all businesses.
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
          <Button onClick={() => { setSelectedReceivable(null); setReceivableModalOpen(true); }} className="w-full sm:w-auto">
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
            Total Outstanding
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
            {partialCount > 0 && (
              <span className="text-blue-600 flex items-center gap-1">
                <TrendingUp className="h-3 w-3" />
                {partialCount} partial
              </span>
            )}
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
      {allReceivables.length === 0 ? (
        <Card>
          <CardContent className="py-8 text-center text-muted-foreground">
            No receivables yet. Create projects with clients to automatically track receivables, or add manual receivables.
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
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[40px]"></TableHead>
                  <TableHead>Source</TableHead>
                  <TableHead className="hidden sm:table-cell">Business</TableHead>
                  <TableHead>Expected</TableHead>
                  <TableHead className="hidden md:table-cell">Received</TableHead>
                  <TableHead className="hidden md:table-cell">Outstanding</TableHead>
                  <TableHead className="hidden sm:table-cell">Due Date</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredReceivables.map((receivable) => {
                  const isExpanded = expandedRows.has(receivable.id);
                  const hasPaymentRecords = receivable.paymentRecords && receivable.paymentRecords.length > 0;
                  const outstanding = receivable.amount - receivable.receivedAmount;
                  
                  return (
                    <React.Fragment key={receivable.id}>
                      <TableRow className={isExpanded ? 'border-b-0' : ''}>
                        <TableCell className="w-[40px]">
                          {(hasPaymentRecords || receivable.isProjectSynced) && (
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-6 w-6 p-0"
                              onClick={() => toggleRow(receivable.id)}
                            >
                              {isExpanded ? (
                                <ChevronDown className="h-4 w-4" />
                              ) : (
                                <ChevronRight className="h-4 w-4" />
                              )}
                            </Button>
                          )}
                        </TableCell>
                        <TableCell className="font-medium">
                          <div className="flex items-center gap-2">
                            {receivable.sourceName}
                            {receivable.isProjectSynced && (
                              <Badge variant="outline" className="text-xs gap-1">
                                <Link2 className="h-2.5 w-2.5" />
                                Project
                              </Badge>
                            )}
                          </div>
                          {receivable.invoiceRef && (
                            <span className="text-xs text-muted-foreground ml-2">({receivable.invoiceRef})</span>
                          )}
                        </TableCell>
                        <TableCell className="hidden sm:table-cell">
                          <Badge variant="secondary" className="text-xs font-normal">
                            {getBusinessName(receivable.businessId)}
                          </Badge>
                        </TableCell>
                        <TableCell>{formatCurrencyAmount(receivable.amount, receivable.currency, data.customCurrencies || [])}</TableCell>
                        <TableCell className="hidden md:table-cell text-green-600 font-medium">
                          {formatCurrencyAmount(receivable.receivedAmount, receivable.currency, data.customCurrencies || [])}
                        </TableCell>
                        <TableCell className={`hidden md:table-cell ${outstanding > 0 ? 'text-orange-600 font-medium' : ''}`}>
                          {formatCurrencyAmount(outstanding, receivable.currency, data.customCurrencies || [])}
                        </TableCell>
                        <TableCell className="hidden sm:table-cell">{format(new Date(receivable.dueDate), 'MMM d, yyyy')}</TableCell>
                        <TableCell>
                          <Badge variant={STATUS_STYLES[receivable.status]?.variant} className="gap-1">
                            {STATUS_STYLES[receivable.status]?.icon}
                            {receivable.status}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex gap-1 justify-end">
                            {!receivable.isProjectSynced && receivable.status !== 'paid' && (
                              <Button variant="ghost" size="sm" onClick={() => handleMarkReceivableReceived(receivable)}>
                                <CheckCircle className="h-4 w-4" />
                              </Button>
                            )}
                            {!receivable.isProjectSynced && (
                              <>
                                <Button variant="ghost" size="sm" onClick={() => handleEditReceivable(receivable)}>
                                  <Pencil className="h-4 w-4" />
                                </Button>
                                <Button variant="ghost" size="sm" onClick={() => setDeleteReceivableId(receivable.id)}>
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                      {isExpanded && (
                        <TableRow>
                          <TableCell colSpan={9} className="bg-muted/30 py-0">
                            <div className="py-3">
                              <div className="text-xs font-medium text-muted-foreground mb-2 pl-8">
                                Payment Records
                              </div>
                              <PaymentRecordsList 
                                records={receivable.paymentRecords || []} 
                                currency={receivable.currency}
                                customCurrencies={data.customCurrencies || []}
                              />
                              {receivable.isProjectSynced && (
                                <div className="text-xs text-muted-foreground pl-8 mt-2">
                                  💡 This receivable syncs automatically with client payments from the project.
                                </div>
                              )}
                            </div>
                          </TableCell>
                        </TableRow>
                      )}
                    </React.Fragment>
                  );
                })}
              </TableBody>
            </Table>
          </div>
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
