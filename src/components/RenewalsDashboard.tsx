import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { 
  Calendar, 
  AlertCircle, 
  AlertTriangle, 
  Clock, 
  CheckCircle2,
  Globe,
  Server,
  Code,
  Shield,
  Mail,
  MoreHorizontal,
  Plus,
  DollarSign,
  History,
  Pencil,
  Trash2,
} from 'lucide-react';
import { useBusiness } from '@/contexts/BusinessContext';
import { getAllRenewals, getRenewalSummary, EnrichedRenewal, RenewalStatus } from '@/utils/renewalUtils';
import { RenewalType, Renewal } from '@/types/business';
import { format, parseISO } from 'date-fns';
import { getCurrencySymbol, convertAmountWithRate } from '@/utils/currencyConversion';
import { AddRenewalModal } from './AddRenewalModal';
import { RenewalPaymentModal } from './RenewalPaymentModal';
import { RenewalPaymentHistoryModal } from './RenewalPaymentHistoryModal';
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

const RENEWAL_TYPE_ICONS: Record<RenewalType, React.ReactNode> = {
  domain: <Globe className="h-4 w-4" />,
  hosting: <Server className="h-4 w-4" />,
  software: <Code className="h-4 w-4" />,
  ssl: <Shield className="h-4 w-4" />,
  email: <Mail className="h-4 w-4" />,
  other: <MoreHorizontal className="h-4 w-4" />,
};

const RENEWAL_TYPE_LABELS: Record<RenewalType, string> = {
  domain: 'Domain',
  hosting: 'Hosting',
  software: 'Software',
  ssl: 'SSL',
  email: 'Email',
  other: 'Other',
};

const STATUS_CONFIG: Record<RenewalStatus, { label: string; color: string; icon: React.ReactNode }> = {
  overdue: { 
    label: 'Overdue', 
    color: 'bg-destructive text-destructive-foreground', 
    icon: <AlertCircle className="h-3 w-3" /> 
  },
  urgent: { 
    label: 'Due Soon', 
    color: 'bg-orange-500 text-white', 
    icon: <AlertTriangle className="h-3 w-3" /> 
  },
  warning: { 
    label: 'Due in 30 days', 
    color: 'bg-yellow-500 text-white', 
    icon: <Clock className="h-3 w-3" /> 
  },
  upcoming: { 
    label: 'Upcoming', 
    color: 'bg-muted text-muted-foreground', 
    icon: <CheckCircle2 className="h-3 w-3" /> 
  },
};

export const RenewalsDashboard: React.FC = () => {
  const navigate = useNavigate();
  const { data, currentBusiness, dispatch } = useBusiness();
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [clientFilter, setClientFilter] = useState<string>('all');
  const [isAddingRenewal, setIsAddingRenewal] = useState(false);
  const [paymentRenewal, setPaymentRenewal] = useState<Renewal | null>(null);
  const [historyRenewal, setHistoryRenewal] = useState<Renewal | null>(null);
  const [deletingRenewalId, setDeletingRenewalId] = useState<string | null>(null);

  const businessRenewals = useMemo(() => {
    if (!currentBusiness) return [];
    return data.renewals?.filter((r) => r.businessId === currentBusiness.id) || [];
  }, [data.renewals, currentBusiness]);

  const allRenewals = useMemo(() => {
    return getAllRenewals(businessRenewals, data.clients);
  }, [businessRenewals, data.clients]);

  const summary = useMemo(() => getRenewalSummary(allRenewals), [allRenewals]);

  const filteredRenewals = useMemo(() => {
    return allRenewals.filter((r) => {
      const matchesType = typeFilter === 'all' || r.type === typeFilter;
      const matchesClient = clientFilter === 'all' || r.clientId === clientFilter;
      return matchesType && matchesClient;
    });
  }, [allRenewals, typeFilter, clientFilter]);

  const uniqueClients = useMemo(() => {
    const clientIds = [...new Set(allRenewals.map((r) => r.clientId))];
    return clientIds.map((id) => {
      const client = data.clients.find((c) => c.id === id);
      return { id, name: client?.name || 'Unknown' };
    });
  }, [allRenewals, data.clients]);

  const formatAmount = (renewal: EnrichedRenewal) => {
    const symbol = getCurrencySymbol(renewal.currency);
    const businessCurrency = currentBusiness?.currency.code || 'USD';
    
    if (renewal.currency === businessCurrency) {
      return `${symbol}${renewal.amount.toLocaleString()}`;
    }

    const result = convertAmountWithRate(renewal.amount, renewal.currency, businessCurrency, data.exchangeRates);
    if (result.rate) {
      const businessSymbol = getCurrencySymbol(businessCurrency);
      return (
        <div className="text-right">
          <div>{symbol}{renewal.amount.toLocaleString()}</div>
          <div className="text-xs text-muted-foreground">
            ≈ {businessSymbol}{result.converted.toLocaleString()}
          </div>
        </div>
      );
    }

    return `${symbol}${renewal.amount.toLocaleString()}`;
  };

  const formatDaysUntilDue = (days: number) => {
    if (days < 0) {
      return `${Math.abs(days)} days overdue`;
    } else if (days === 0) {
      return 'Due today';
    } else if (days === 1) {
      return 'Due tomorrow';
    } else {
      return `${days} days`;
    }
  };

  const getPaymentCount = (renewalId: string) => {
    return (data.renewalPayments || []).filter((p) => p.renewalId === renewalId).length;
  };

  const handleDeleteRenewal = () => {
    if (!deletingRenewalId) return;
    
    // Delete associated payments first
    const paymentsToDelete = (data.renewalPayments || []).filter(p => p.renewalId === deletingRenewalId);
    paymentsToDelete.forEach(payment => {
      dispatch({ type: 'DELETE_RENEWAL_PAYMENT', payload: payment.id });
    });
    
    dispatch({ type: 'DELETE_RENEWAL', payload: deletingRenewalId });
    setDeletingRenewalId(null);
  };

  if (!currentBusiness) {
    return (
      <div className="p-6">
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <h3 className="text-lg font-medium mb-2">No Business Selected</h3>
            <p className="text-muted-foreground">Please select a business to view renewals</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-4 sm:space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl sm:text-2xl md:text-3xl font-bold tracking-tight">Renewals</h1>
          <p className="text-sm sm:text-base text-muted-foreground">
            Track all upcoming renewals for your clients
          </p>
        </div>
        <Button onClick={() => setIsAddingRenewal(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Add Renewal
        </Button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Renewals</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{summary.total}</div>
          </CardContent>
        </Card>

        <Card className="border-destructive/50 bg-destructive/5">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <AlertCircle className="h-4 w-4 text-destructive" />
              Overdue
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-destructive">{summary.overdue}</div>
          </CardContent>
        </Card>

        <Card className="border-orange-500/50 bg-orange-500/5">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-orange-500" />
              Due This Week
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-500">{summary.urgent}</div>
          </CardContent>
        </Card>

        <Card className="border-yellow-500/50 bg-yellow-500/5">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Clock className="h-4 w-4 text-yellow-600" />
              Due in 30 Days
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">{summary.warning}</div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <Select value={typeFilter} onValueChange={setTypeFilter}>
          <SelectTrigger className="w-full sm:w-40">
            <SelectValue placeholder="All Types" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Types</SelectItem>
            {Object.entries(RENEWAL_TYPE_LABELS).map(([value, label]) => (
              <SelectItem key={value} value={value}>{label}</SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={clientFilter} onValueChange={setClientFilter}>
          <SelectTrigger className="w-full sm:w-48">
            <SelectValue placeholder="All Clients" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Clients</SelectItem>
            {uniqueClients.map((client) => (
              <SelectItem key={client.id} value={client.id}>{client.name}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Renewals Table */}
      {filteredRenewals.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Calendar className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium mb-2">No Renewals Found</h3>
            <p className="text-muted-foreground text-center mb-4">
              {allRenewals.length === 0
                ? 'Add renewals to track services for your clients'
                : 'No renewals match your current filters'}
            </p>
            {allRenewals.length === 0 && (
              <Button onClick={() => setIsAddingRenewal(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Add First Renewal
              </Button>
            )}
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Renewal</TableHead>
                  <TableHead>Client</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Frequency</TableHead>
                  <TableHead>Due Date</TableHead>
                  <TableHead>Last Paid</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="w-[60px]"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredRenewals.map((renewal) => {
                  const statusConfig = STATUS_CONFIG[renewal.status];
                  const paymentCount = getPaymentCount(renewal.id);
                  
                  return (
                    <TableRow key={renewal.id}>
                      <TableCell>
                        <div className="font-medium">{renewal.name}</div>
                      </TableCell>
                      <TableCell>{renewal.clientName}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          {RENEWAL_TYPE_ICONS[renewal.type]}
                          <span>{RENEWAL_TYPE_LABELS[renewal.type]}</span>
                        </div>
                      </TableCell>
                      <TableCell>{formatAmount(renewal)}</TableCell>
                      <TableCell className="capitalize">{renewal.frequency}</TableCell>
                      <TableCell>
                        <div>
                          <div>{format(parseISO(renewal.nextRenewalDate), 'MMM d, yyyy')}</div>
                          <div className="text-xs text-muted-foreground">
                            {formatDaysUntilDue(renewal.daysUntilDue)}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        {renewal.lastPaidDate ? (
                          <div>
                            <div>{format(parseISO(renewal.lastPaidDate), 'MMM d, yyyy')}</div>
                            {paymentCount > 0 && (
                              <div className="text-xs text-muted-foreground">
                                {paymentCount} payment{paymentCount !== 1 ? 's' : ''}
                              </div>
                            )}
                          </div>
                        ) : (
                          <span className="text-muted-foreground">-</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <Badge className={`${statusConfig.color} gap-1`}>
                          {statusConfig.icon}
                          {statusConfig.label}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => setPaymentRenewal(renewal)}>
                              <DollarSign className="h-4 w-4 mr-2" />
                              Record Payment
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => setHistoryRenewal(renewal)}>
                              <History className="h-4 w-4 mr-2" />
                              Payment History
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem 
                              onClick={() => setDeletingRenewalId(renewal.id)}
                              className="text-destructive"
                            >
                              <Trash2 className="h-4 w-4 mr-2" />
                              Delete
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      {/* Modals */}
      {isAddingRenewal && (
        <AddRenewalModal
          isOpen={isAddingRenewal}
          onClose={() => setIsAddingRenewal(false)}
        />
      )}

      {paymentRenewal && (
        <RenewalPaymentModal
          isOpen={!!paymentRenewal}
          onClose={() => setPaymentRenewal(null)}
          renewal={paymentRenewal}
        />
      )}

      {historyRenewal && (
        <RenewalPaymentHistoryModal
          isOpen={!!historyRenewal}
          onClose={() => setHistoryRenewal(null)}
          renewal={historyRenewal}
        />
      )}

      {/* Delete Confirmation */}
      <AlertDialog open={!!deletingRenewalId} onOpenChange={() => setDeletingRenewalId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Renewal</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this renewal? This will also delete all associated payment history. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteRenewal} className="bg-destructive text-destructive-foreground">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};
