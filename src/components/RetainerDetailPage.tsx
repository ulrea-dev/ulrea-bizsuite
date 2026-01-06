import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useBusiness } from '@/contexts/BusinessContext';
import { formatCurrency } from '@/utils/storage';
import { format } from 'date-fns';
import { ArrowLeft, Plus, DollarSign, Receipt, Edit, Pause, Play, RefreshCw, AlertTriangle, ArrowRightLeft } from 'lucide-react';
import { ExpenseModal } from './ExpenseModal';
import { RetainerModal } from './RetainerModal';
import { RetainerRenewalItem } from './RetainerRenewalItem';
import { getExchangeRate, getCurrencySymbol } from '@/utils/currencyConversion';

interface RetainerDetailPageProps {
  retainerId: string;
  onBack: () => void;
}

export const RetainerDetailPage: React.FC<RetainerDetailPageProps> = ({ retainerId, onBack }) => {
  const { data, currentBusiness, dispatch } = useBusiness();
  const [isAddingExpense, setIsAddingExpense] = useState(false);
  const [isEditingRetainer, setIsEditingRetainer] = useState(false);

  const retainer = data.retainers.find(r => r.id === retainerId);
  const client = retainer ? data.clients.find(c => c.id === retainer.clientId) : null;

  if (!retainer || !currentBusiness) {
    return (
      <div className="p-8 text-center">
        <p className="text-muted-foreground">Retainer not found</p>
        <Button onClick={onBack} className="mt-4">
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Retainers
        </Button>
      </div>
    );
  }

  // Get all expenses for this retainer
  const retainerExpenses = data.expenses?.filter(e => e.retainerId === retainerId) || [];
  
  // Get all payments for this retainer
  const retainerPayments = data.payments?.filter(p => p.retainerId === retainerId) || [];

  // Calculate totals
  const totalExpenses = retainerExpenses.reduce((sum, e) => sum + e.amount, 0);
  const paidExpenses = retainerExpenses.filter(e => e.status === 'paid').reduce((sum, e) => sum + e.amount, 0);
  const pendingExpenses = retainerExpenses.filter(e => e.status === 'pending').reduce((sum, e) => sum + e.amount, 0);
  
  const totalReceived = retainerPayments.filter(p => p.status === 'completed').reduce((sum, p) => sum + p.amount, 0);
  
  // Calculate renewals total (converted to retainer currency)
  const renewals = retainer.renewals || [];
  const renewalsTotalConverted = renewals.reduce((sum, renewal) => {
    let amount = renewal.amount;
    if (renewal.currency !== retainer.currency) {
      const rate = getExchangeRate(renewal.currency, retainer.currency, data.exchangeRates || []);
      if (rate) {
        amount = renewal.amount * rate;
      }
    }
    // Convert to monthly for comparison
    if (renewal.frequency === 'quarterly') amount = amount / 3;
    if (renewal.frequency === 'yearly') amount = amount / 12;
    return sum + amount;
  }, 0);

  const netProfit = totalReceived - totalExpenses;

  const handleToggleStatus = () => {
    dispatch({
      type: 'UPDATE_RETAINER',
      payload: {
        id: retainer.id,
        updates: { status: retainer.status === 'active' ? 'paused' : 'active' }
      }
    });
  };

  return (
    <div className="p-8 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" onClick={onBack}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
          <div>
            <h1 className="text-3xl font-bold">{retainer.name}</h1>
            <p className="text-muted-foreground">{client?.name || 'Unknown Client'}</p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => setIsEditingRetainer(true)}>
            <Edit className="h-4 w-4 mr-2" />
            Edit
          </Button>
          <Button variant="outline" onClick={handleToggleStatus}>
            {retainer.status === 'active' ? (
              <>
                <Pause className="h-4 w-4 mr-2" />
                Pause
              </>
            ) : (
              <>
                <Play className="h-4 w-4 mr-2" />
                Resume
              </>
            )}
          </Button>
        </div>
      </div>

      {/* Retainer Info Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Status</CardTitle>
          </CardHeader>
          <CardContent>
            <Badge variant={retainer.status === 'active' ? 'default' : 'secondary'} className="text-lg">
              {retainer.status}
            </Badge>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Retainer Amount</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(retainer.amount, { symbol: currentBusiness.currency.symbol, code: retainer.currency })}</div>
            <p className="text-xs text-muted-foreground mt-1 capitalize">{retainer.frequency}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Received</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{formatCurrency(totalReceived, currentBusiness.currency)}</div>
            <p className="text-xs text-muted-foreground mt-1">{retainerPayments.length} payments</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Net Profit</CardTitle>
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${netProfit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              {formatCurrency(netProfit, currentBusiness.currency)}
            </div>
            <p className="text-xs text-muted-foreground mt-1">Revenue - Expenses</p>
          </CardContent>
        </Card>
      </div>

      {/* Billing Information */}
      <Card>
        <CardHeader>
          <CardTitle>Billing Information</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-muted-foreground">Start Date</p>
              <p className="font-medium">{format(new Date(retainer.startDate), 'PPP')}</p>
            </div>
            {retainer.endDate && (
              <div>
                <p className="text-sm text-muted-foreground">End Date</p>
                <p className="font-medium">{format(new Date(retainer.endDate), 'PPP')}</p>
              </div>
            )}
            <div>
              <p className="text-sm text-muted-foreground">Next Billing Date</p>
              <p className="font-medium">{format(new Date(retainer.nextBillingDate), 'PPP')}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Frequency</p>
              <p className="font-medium capitalize">{retainer.frequency}</p>
            </div>
          </div>
          {retainer.description && (
            <div>
              <p className="text-sm text-muted-foreground">Description</p>
              <p className="font-medium">{retainer.description}</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Renewals Section */}
      {renewals.length > 0 && (
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <RefreshCw className="h-5 w-5 text-muted-foreground" />
              <CardTitle>Renewals</CardTitle>
              <Badge variant="secondary">{renewals.length}</Badge>
            </div>
            <p className="text-sm text-muted-foreground mt-1">
              Third-party services included in this retainer (domains, hosting, software)
            </p>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Renewals Summary */}
            <div className="p-4 bg-muted/50 rounded-lg">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Monthly Renewals Total (converted)</span>
                <span className="font-medium">
                  {currentBusiness.currency.symbol}{renewalsTotalConverted.toLocaleString(undefined, { maximumFractionDigits: 2 })} / month
                </span>
              </div>
            </div>

            {/* Individual Renewals */}
            <div className="space-y-3">
              {renewals.map(renewal => (
                <RetainerRenewalItem
                  key={renewal.id}
                  renewal={renewal}
                  retainerCurrency={retainer.currency}
                  exchangeRates={data.exchangeRates || []}
                  isReadOnly={true}
                />
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Expenses Section */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Associated Expenses</CardTitle>
              <p className="text-sm text-muted-foreground mt-1">
                Track expenses related to this retainer (hosting, domain, tools, etc.)
              </p>
            </div>
            <Button onClick={() => setIsAddingExpense(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Add Expense
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-3 gap-4 mb-6">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Total Expenses</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{formatCurrency(totalExpenses, currentBusiness.currency)}</div>
                <p className="text-xs text-muted-foreground mt-1">{retainerExpenses.length} expenses</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Paid</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-600">{formatCurrency(paidExpenses, currentBusiness.currency)}</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Pending</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-orange-600">{formatCurrency(pendingExpenses, currentBusiness.currency)}</div>
              </CardContent>
            </Card>
          </div>

          <div className="space-y-3">
            {retainerExpenses.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                No expenses yet. Add expenses to track costs associated with this retainer.
              </div>
            ) : (
              retainerExpenses.map(expense => (
                <div key={expense.id} className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex items-center gap-4">
                    <Receipt className="h-5 w-5 text-muted-foreground" />
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-medium">{expense.name}</span>
                        <Badge variant="outline" className="capitalize">{expense.category}</Badge>
                        {expense.isRecurring && (
                          <Badge variant="secondary">Recurring</Badge>
                        )}
                      </div>
                      {expense.description && (
                        <p className="text-sm text-muted-foreground">{expense.description}</p>
                      )}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-semibold">{formatCurrency(expense.amount, currentBusiness.currency)}</div>
                    <div className="text-sm text-muted-foreground">{format(new Date(expense.date), 'MMM dd, yyyy')}</div>
                    <Badge variant={expense.status === 'paid' ? 'default' : 'secondary'} className="mt-1">
                      {expense.status}
                    </Badge>
                  </div>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>

      {/* Revenue History */}
      <Card>
        <CardHeader>
          <CardTitle>Revenue History</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {retainerPayments.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                No payments received yet.
              </div>
            ) : (
              retainerPayments.map(payment => (
                <div key={payment.id} className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex items-center gap-4">
                    <DollarSign className="h-5 w-5 text-green-600" />
                    <div>
                      <div className="font-medium">Payment Received</div>
                      {payment.description && (
                        <p className="text-sm text-muted-foreground">{payment.description}</p>
                      )}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-semibold text-green-600">{formatCurrency(payment.amount, currentBusiness.currency)}</div>
                    <div className="text-sm text-muted-foreground">{format(new Date(payment.date), 'MMM dd, yyyy')}</div>
                    <Badge variant={payment.status === 'completed' ? 'default' : 'secondary'} className="mt-1">
                      {payment.status}
                    </Badge>
                  </div>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>

      {/* Modals */}
      {isAddingExpense && (
        <ExpenseModal
          isOpen={isAddingExpense}
          onClose={() => setIsAddingExpense(false)}
          projectId=""
          retainerId={retainerId}
          mode="create"
        />
      )}

      {isEditingRetainer && (
        <RetainerModal
          isOpen={isEditingRetainer}
          onClose={() => setIsEditingRetainer(false)}
          retainer={retainer}
          mode="edit"
        />
      )}
    </div>
  );
};
