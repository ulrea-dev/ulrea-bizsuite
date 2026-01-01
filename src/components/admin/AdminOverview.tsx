import React, { useMemo, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { useBusiness } from '@/contexts/BusinessContext';
import { 
  Building2, 
  Wallet, 
  ArrowUpRight, 
  ArrowDownLeft, 
  TrendingUp,
  TrendingDown,
  AlertCircle,
  Clock,
  ChevronDown,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Minus
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { groupByCurrency, formatCurrencyAmount } from '@/utils/currencySummary';
import { CurrencyTotals } from './CurrencyTotals';

export const AdminOverview: React.FC = () => {
  const { data } = useBusiness();
  const [selectedCurrency, setSelectedCurrency] = useState<string>('all');

  const businessCount = data.businesses.length;

  // Use ALL data across ALL businesses (admin view)
  const bankAccounts = useMemo(() => data.bankAccounts, [data.bankAccounts]);
  const payables = useMemo(() => data.payables, [data.payables]);
  const receivables = useMemo(() => data.receivables, [data.receivables]);

  const pendingPayables = useMemo(() => 
    payables.filter((p) => p.status !== 'paid'),
    [payables]
  );

  const pendingReceivables = useMemo(() => 
    receivables.filter((r) => r.status !== 'paid'),
    [receivables]
  );

  // Group totals by currency
  const accountTotalsByCurrency = useMemo(() => 
    groupByCurrency(bankAccounts, (a) => a.balance, (a) => a.currency),
    [bankAccounts]
  );

  const payableTotalsByCurrency = useMemo(() => 
    groupByCurrency(pendingPayables, (p) => p.amount - p.paidAmount, (p) => p.currency),
    [pendingPayables]
  );

  const receivableTotalsByCurrency = useMemo(() => 
    groupByCurrency(pendingReceivables, (r) => r.amount - r.receivedAmount, (r) => r.currency),
    [pendingReceivables]
  );

  // Calculate net position per currency
  const netPositionByCurrency = useMemo(() => {
    const allCurrencyCodes = new Set([
      ...Object.keys(accountTotalsByCurrency),
      ...Object.keys(payableTotalsByCurrency),
      ...Object.keys(receivableTotalsByCurrency),
    ]);
    
    const result: Record<string, number> = {};
    allCurrencyCodes.forEach((currency) => {
      const accounts = accountTotalsByCurrency[currency] || 0;
      const receivable = receivableTotalsByCurrency[currency] || 0;
      const payable = payableTotalsByCurrency[currency] || 0;
      result[currency] = accounts + receivable - payable;
    });
    return result;
  }, [accountTotalsByCurrency, payableTotalsByCurrency, receivableTotalsByCurrency]);

  const overduePayables = pendingPayables.filter(p => p.status === 'overdue').length;
  const overdueReceivables = pendingReceivables.filter(r => r.status === 'overdue').length;

  // Get all active currencies for tabs
  const activeCurrencies = useMemo(() => {
    const currencies = new Set([
      ...Object.keys(accountTotalsByCurrency),
      ...Object.keys(payableTotalsByCurrency),
      ...Object.keys(receivableTotalsByCurrency),
    ]);
    return Array.from(currencies).sort();
  }, [accountTotalsByCurrency, payableTotalsByCurrency, receivableTotalsByCurrency]);

  // Calculate financial health status
  const healthAnalysis = useMemo(() => {
    const currencies = Object.entries(netPositionByCurrency);
    const positive = currencies.filter(([_, v]) => v > 0).length;
    const negative = currencies.filter(([_, v]) => v < 0).length;
    const zero = currencies.filter(([_, v]) => v === 0).length;
    const total = currencies.length;

    let status: 'healthy' | 'warning' | 'critical' = 'healthy';
    if (negative > 0 && negative < total / 2) status = 'warning';
    if (negative >= total / 2) status = 'critical';

    return { status, positive, negative, zero, total };
  }, [netPositionByCurrency]);

  // Calculate asset ratio for progress bar per currency
  const getAssetRatio = (currency: string) => {
    const accounts = accountTotalsByCurrency[currency] || 0;
    const receivable = receivableTotalsByCurrency[currency] || 0;
    const payable = payableTotalsByCurrency[currency] || 0;
    const assets = accounts + receivable;
    const total = assets + payable;
    if (total === 0) return 50;
    return Math.round((assets / total) * 100);
  };

  const getHealthBadge = () => {
    switch (healthAnalysis.status) {
      case 'healthy':
        return (
          <Badge variant="outline" className="bg-green-500/10 text-green-600 border-green-500/30">
            <CheckCircle2 className="h-3 w-3 mr-1" />
            Healthy
          </Badge>
        );
      case 'warning':
        return (
          <Badge variant="outline" className="bg-yellow-500/10 text-yellow-600 border-yellow-500/30">
            <AlertTriangle className="h-3 w-3 mr-1" />
            At Risk
          </Badge>
        );
      case 'critical':
        return (
          <Badge variant="outline" className="bg-destructive/10 text-destructive border-destructive/30">
            <XCircle className="h-3 w-3 mr-1" />
            Negative
          </Badge>
        );
    }
  };

  const getPositionIcon = (value: number) => {
    if (value > 0) return <TrendingUp className="h-4 w-4 text-green-600" />;
    if (value < 0) return <TrendingDown className="h-4 w-4 text-destructive" />;
    return <Minus className="h-4 w-4 text-muted-foreground" />;
  };

  // Filter totals based on selected currency
  const filterTotals = (totals: Record<string, number>) => {
    if (selectedCurrency === 'all') return totals;
    return { [selectedCurrency]: totals[selectedCurrency] || 0 };
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold">Admin Overview</h1>
          <p className="text-muted-foreground text-sm sm:text-base">
            Summary across all businesses
          </p>
        </div>
        
        {activeCurrencies.length > 1 && (
          <Tabs value={selectedCurrency} onValueChange={setSelectedCurrency}>
            <TabsList>
              <TabsTrigger value="all">All</TabsTrigger>
              {activeCurrencies.map(currency => (
                <TabsTrigger key={currency} value={currency}>{currency}</TabsTrigger>
              ))}
            </TabsList>
          </Tabs>
        )}
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
            <CurrencyTotals 
              totals={accountTotalsByCurrency}
              customCurrencies={data.customCurrencies || []}
              amountClassName="text-2xl"
              variant={selectedCurrency === 'all' ? 'compact' : 'list'}
              filterCurrency={selectedCurrency}
            />
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
            <CurrencyTotals 
              totals={payableTotalsByCurrency}
              customCurrencies={data.customCurrencies || []}
              amountClassName="text-2xl text-destructive"
              variant={selectedCurrency === 'all' ? 'compact' : 'list'}
              filterCurrency={selectedCurrency}
            />
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
            <CurrencyTotals 
              totals={receivableTotalsByCurrency}
              customCurrencies={data.customCurrencies || []}
              amountClassName="text-2xl text-green-600"
              variant={selectedCurrency === 'all' ? 'compact' : 'list'}
              filterCurrency={selectedCurrency}
            />
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
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              Net Financial Position
            </div>
            {healthAnalysis.total > 0 && getHealthBadge()}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {Object.keys(netPositionByCurrency).length === 0 ? (
              <p className="text-muted-foreground">No financial data yet.</p>
            ) : (
              <>
                {Object.entries(netPositionByCurrency)
                  .filter(([currency]) => selectedCurrency === 'all' || currency === selectedCurrency)
                  .map(([currency, netPosition], index, arr) => {
                    const accounts = accountTotalsByCurrency[currency] || 0;
                    const receivable = receivableTotalsByCurrency[currency] || 0;
                    const payable = payableTotalsByCurrency[currency] || 0;
                    const isExpanded = selectedCurrency !== 'all';
                    const assetRatio = getAssetRatio(currency);
                    
                    return (
                      <Collapsible key={currency} defaultOpen={isExpanded || arr.length === 1}>
                        <div className="border rounded-lg p-3">
                          <CollapsibleTrigger className="w-full">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-3">
                                <ChevronDown className="h-4 w-4 text-muted-foreground transition-transform [[data-state=open]>&]:rotate-180" />
                                <span className="font-medium text-muted-foreground">{currency}</span>
                              </div>
                              <div className="flex items-center gap-2">
                                {getPositionIcon(netPosition)}
                                <p className={`text-xl font-bold ${netPosition >= 0 ? 'text-green-600' : 'text-destructive'}`}>
                                  {formatCurrencyAmount(netPosition, currency, data.customCurrencies || [])}
                                </p>
                              </div>
                            </div>
                          </CollapsibleTrigger>
                          <CollapsibleContent>
                            <div className="pt-3 mt-3 border-t space-y-3">
                              {/* Asset/Liability Progress Bar */}
                              <div className="space-y-1">
                                <div className="flex justify-between text-xs text-muted-foreground">
                                  <span>Assets vs Liabilities</span>
                                  <span>{assetRatio}% assets</span>
                                </div>
                                <Progress 
                                  value={assetRatio} 
                                  className={`h-2 ${assetRatio >= 50 ? '[&>div]:bg-green-500' : '[&>div]:bg-destructive'}`}
                                />
                              </div>
                              
                              <div className="text-sm text-muted-foreground space-y-1">
                                <div className="flex justify-between">
                                  <span>Accounts</span>
                                  <span>{formatCurrencyAmount(accounts, currency, data.customCurrencies || [])}</span>
                                </div>
                                <div className="flex justify-between text-green-600">
                                  <span>+ Receivables</span>
                                  <span>{formatCurrencyAmount(receivable, currency, data.customCurrencies || [])}</span>
                                </div>
                                <div className="flex justify-between text-destructive">
                                  <span>- Payables</span>
                                  <span>{formatCurrencyAmount(payable, currency, data.customCurrencies || [])}</span>
                                </div>
                              </div>
                            </div>
                          </CollapsibleContent>
                        </div>
                      </Collapsible>
                    );
                  })}
                
                {/* Summary Analysis Footer */}
                <div className="pt-3 border-t text-sm text-muted-foreground">
                  {healthAnalysis.negative === 0 ? (
                    <p className="flex items-center gap-2">
                      <CheckCircle2 className="h-4 w-4 text-green-600" />
                      All {healthAnalysis.total} {healthAnalysis.total === 1 ? 'currency is' : 'currencies are'} in positive standing
                    </p>
                  ) : (
                    <p className="flex items-center gap-2">
                      <AlertTriangle className="h-4 w-4 text-yellow-600" />
                      {healthAnalysis.negative} of {healthAnalysis.total} {healthAnalysis.total === 1 ? 'currency shows' : 'currencies show'} negative net position
                    </p>
                  )}
                </div>
              </>
            )}
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
