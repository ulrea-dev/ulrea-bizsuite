import React, { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useBusiness } from '@/contexts/BusinessContext';
import { 
  Building2, 
  Wallet, 
  ArrowUpRight, 
  ArrowDownLeft, 
  TrendingUp,
  AlertCircle,
  Clock
} from 'lucide-react';
import { SUPPORTED_CURRENCIES } from '@/types/business';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';

export const AdminOverview: React.FC = () => {
  const { data, currentBusiness } = useBusiness();

  const allCurrencies = [...SUPPORTED_CURRENCIES, ...(data.customCurrencies || [])];
  
  const getCurrencySymbol = (code: string) => {
    return allCurrencies.find((c) => c.code === code)?.symbol || code;
  };

  const formatCurrency = (amount: number, currencyCode: string) => {
    const symbol = getCurrencySymbol(currencyCode);
    return `${symbol}${amount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

  const businessCount = data.businesses.length;

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

  const totalInAccounts = useMemo(() => 
    bankAccounts.reduce((sum, a) => sum + a.balance, 0),
    [bankAccounts]
  );

  const pendingPayables = useMemo(() => 
    payables.filter((p) => p.status !== 'paid'),
    [payables]
  );

  const pendingReceivables = useMemo(() => 
    receivables.filter((r) => r.status !== 'paid'),
    [receivables]
  );

  const totalPayables = pendingPayables.reduce((sum, p) => sum + (p.amount - p.paidAmount), 0);
  const totalReceivables = pendingReceivables.reduce((sum, r) => sum + (r.amount - r.receivedAmount), 0);
  const netPosition = totalInAccounts + totalReceivables - totalPayables;

  const overduePayables = pendingPayables.filter(p => p.status === 'overdue').length;
  const overdueReceivables = pendingReceivables.filter(r => r.status === 'overdue').length;

  const currencyCode = currentBusiness?.currency.code || 'USD';

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold">Admin Overview</h1>
        <p className="text-muted-foreground text-sm sm:text-base">
          Summary of your business administration
        </p>
      </div>

      {/* Quick Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <Building2 className="h-4 w-4" />
              Total Businesses
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{businessCount}</p>
            <Link to="/business-management/businesses">
              <Button variant="link" className="px-0 h-auto text-xs">
                Manage businesses →
              </Button>
            </Link>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <Wallet className="h-4 w-4" />
              Total in Accounts
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">
              {formatCurrency(totalInAccounts, currencyCode)}
            </p>
            <Link to="/business-management/bank-accounts">
              <Button variant="link" className="px-0 h-auto text-xs">
                View accounts →
              </Button>
            </Link>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <ArrowUpRight className="h-4 w-4 text-destructive" />
              Pending Payables
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-destructive">
              {formatCurrency(totalPayables, currencyCode)}
            </p>
            <div className="flex items-center gap-2">
              <span className="text-xs text-muted-foreground">{pendingPayables.length} pending</span>
              {overduePayables > 0 && (
                <span className="text-xs text-destructive flex items-center gap-1">
                  <AlertCircle className="h-3 w-3" />
                  {overduePayables} overdue
                </span>
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <ArrowDownLeft className="h-4 w-4 text-green-600" />
              Pending Receivables
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-green-600">
              {formatCurrency(totalReceivables, currencyCode)}
            </p>
            <div className="flex items-center gap-2">
              <span className="text-xs text-muted-foreground">{pendingReceivables.length} pending</span>
              {overdueReceivables > 0 && (
                <span className="text-xs text-destructive flex items-center gap-1">
                  <AlertCircle className="h-3 w-3" />
                  {overdueReceivables} overdue
                </span>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Net Position Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            Net Financial Position
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <div>
              <p className={`text-3xl font-bold ${netPosition >= 0 ? 'text-green-600' : 'text-destructive'}`}>
                {formatCurrency(netPosition, currencyCode)}
              </p>
              <p className="text-sm text-muted-foreground mt-1">
                Accounts + Receivables - Payables
              </p>
            </div>
            <div className="text-right text-sm text-muted-foreground space-y-1">
              <p>Accounts: {formatCurrency(totalInAccounts, currencyCode)}</p>
              <p className="text-green-600">+ Receivables: {formatCurrency(totalReceivables, currencyCode)}</p>
              <p className="text-destructive">- Payables: {formatCurrency(totalPayables, currencyCode)}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5" />
            Quick Actions
          </CardTitle>
        </CardHeader>
        <CardContent className="flex flex-wrap gap-3">
          <Link to="/business-management/businesses">
            <Button variant="outline">
              <Building2 className="h-4 w-4 mr-2" />
              Manage Businesses
            </Button>
          </Link>
          <Link to="/business-management/bank-accounts">
            <Button variant="outline">
              <Wallet className="h-4 w-4 mr-2" />
              Bank Accounts
            </Button>
          </Link>
          <Link to="/business-management/payables">
            <Button variant="outline">
              <ArrowUpRight className="h-4 w-4 mr-2" />
              Payables
            </Button>
          </Link>
          <Link to="/business-management/receivables">
            <Button variant="outline">
              <ArrowDownLeft className="h-4 w-4 mr-2" />
              Receivables
            </Button>
          </Link>
        </CardContent>
      </Card>
    </div>
  );
};
