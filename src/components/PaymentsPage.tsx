import React, { useState } from 'react';
import { AllPaymentsView } from './AllPaymentsView';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useBusiness } from '@/contexts/BusinessContext';
import { formatCurrency } from '@/utils/storage';
import { DollarSign, TrendingDown, TrendingUp, Calendar } from 'lucide-react';
import { startOfMonth, startOfQuarter, startOfYear, endOfMonth, endOfQuarter, endOfYear, isWithinInterval } from 'date-fns';

export const PaymentsPage: React.FC = () => {
  const { data, currentBusiness } = useBusiness();
  const [timePeriod, setTimePeriod] = useState<'month' | 'quarter' | 'year'>('month');

  if (!currentBusiness) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-muted-foreground">Please select a business to view payments.</p>
      </div>
    );
  }

  // Get all payments for the current business
  const allPayments = [
    ...data.payments.filter(payment => {
      const project = payment.projectId ? data.projects.find(p => p.id === payment.projectId) : null;
      return (project?.businessId === currentBusiness.id || !payment.projectId) && payment.type === 'outgoing';
    }),
    ...data.salaryPayments.filter(salaryPayment => {
      const salaryRecord = data.salaryRecords.find(r => r.id === salaryPayment.salaryRecordId);
      return salaryRecord?.businessId === currentBusiness.id;
    }).map(sp => ({
      id: sp.id,
      amount: sp.amount,
      date: sp.paymentDate,
      type: 'outgoing' as const,
      status: sp.status === 'paid' ? 'completed' as const : 'pending' as const,
    })),
  ];

  // Calculate time period analytics
  const now = new Date();
  let periodStart: Date, periodEnd: Date;

  switch (timePeriod) {
    case 'month':
      periodStart = startOfMonth(now);
      periodEnd = endOfMonth(now);
      break;
    case 'quarter':
      periodStart = startOfQuarter(now);
      periodEnd = endOfQuarter(now);
      break;
    case 'year':
      periodStart = startOfYear(now);
      periodEnd = endOfYear(now);
      break;
  }

  const periodPayments = allPayments.filter(payment => 
    isWithinInterval(new Date(payment.date), { start: periodStart, end: periodEnd })
  );

  const periodTotal = periodPayments.reduce((sum, payment) => sum + payment.amount, 0);
  const periodCompleted = periodPayments.filter(p => p.status === 'completed').reduce((sum, p) => sum + p.amount, 0);
  const periodPending = periodPayments.filter(p => p.status === 'pending').reduce((sum, p) => sum + p.amount, 0);

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Payments</h1>
        <p className="text-muted-foreground">
          Comprehensive payment management and analytics
        </p>
      </div>

      {/* Time Period Analytics */}
      <Tabs value={timePeriod} onValueChange={(value) => setTimePeriod(value as 'month' | 'quarter' | 'year')}>
        <TabsList>
          <TabsTrigger value="month">This Month</TabsTrigger>
          <TabsTrigger value="quarter">This Quarter</TabsTrigger>
          <TabsTrigger value="year">This Year</TabsTrigger>
        </TabsList>

        <TabsContent value={timePeriod} className="space-y-4 mt-4">
          <div className="grid grid-cols-3 gap-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  <DollarSign className="h-4 w-4" />
                  Total Payments
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {formatCurrency(periodTotal, currentBusiness.currency)}
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  {periodPayments.length} transactions
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  <TrendingUp className="h-4 w-4 text-green-600" />
                  Completed
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-600">
                  {formatCurrency(periodCompleted, currentBusiness.currency)}
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  {periodPayments.filter(p => p.status === 'completed').length} paid
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  <TrendingDown className="h-4 w-4 text-orange-600" />
                  Pending
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-orange-600">
                  {formatCurrency(periodPending, currentBusiness.currency)}
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  {periodPayments.filter(p => p.status === 'pending').length} pending
                </p>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>

      {/* All Payments View */}
      <AllPaymentsView />
    </div>
  );
};
