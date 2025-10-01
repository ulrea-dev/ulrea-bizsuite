import React, { useState } from 'react';
import { AllPaymentsView } from './AllPaymentsView';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useBusiness } from '@/contexts/BusinessContext';
import { formatCurrency } from '@/utils/storage';
import { DollarSign, TrendingDown, TrendingUp, Calendar } from 'lucide-react';
import { startOfMonth, startOfQuarter, startOfYear, endOfMonth, endOfQuarter, endOfYear, isWithinInterval } from 'date-fns';

export const PaymentsPage: React.FC = () => {
  const { data, currentBusiness } = useBusiness();
  const [timePeriod, setTimePeriod] = useState<'month' | 'quarter' | 'year'>('month');
  const [selectedMonth, setSelectedMonth] = useState<number>(new Date().getMonth());
  const [selectedYear, setSelectedYear] = useState<number>(new Date().getFullYear());

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
      const selectedDate = new Date(selectedYear, selectedMonth, 1);
      periodStart = startOfMonth(selectedDate);
      periodEnd = endOfMonth(selectedDate);
      break;
    case 'quarter':
      periodStart = startOfQuarter(now);
      periodEnd = endOfQuarter(now);
      break;
    case 'year':
      periodStart = startOfYear(new Date(selectedYear, 0, 1));
      periodEnd = endOfYear(new Date(selectedYear, 11, 31));
      break;
  }

  const periodPayments = allPayments.filter(payment => 
    isWithinInterval(new Date(payment.date), { start: periodStart, end: periodEnd })
  );

  const periodTotal = periodPayments.reduce((sum, payment) => sum + payment.amount, 0);
  const periodCompleted = periodPayments.filter(p => p.status === 'completed').reduce((sum, p) => sum + p.amount, 0);
  const periodPending = periodPayments.filter(p => p.status === 'pending').reduce((sum, p) => sum + p.amount, 0);

  const months = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: 10 }, (_, i) => currentYear - 5 + i);

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Payments</h1>
        <p className="text-muted-foreground">
          Comprehensive payment management and analytics
        </p>
      </div>

      {/* Time Period Selection */}
      <div className="flex flex-wrap items-center gap-4">
        <Tabs value={timePeriod} onValueChange={(value) => setTimePeriod(value as 'month' | 'quarter' | 'year')}>
          <TabsList>
            <TabsTrigger value="month">Month</TabsTrigger>
            <TabsTrigger value="quarter">Quarter</TabsTrigger>
            <TabsTrigger value="year">Year</TabsTrigger>
          </TabsList>
        </Tabs>

        {timePeriod === 'month' && (
          <>
            <Select value={selectedMonth.toString()} onValueChange={(value) => setSelectedMonth(parseInt(value))}>
              <SelectTrigger className="w-[150px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {months.map((month, index) => (
                  <SelectItem key={index} value={index.toString()}>
                    {month}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={selectedYear.toString()} onValueChange={(value) => setSelectedYear(parseInt(value))}>
              <SelectTrigger className="w-[120px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {years.map((year) => (
                  <SelectItem key={year} value={year.toString()}>
                    {year}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </>
        )}

        {timePeriod === 'year' && (
          <Select value={selectedYear.toString()} onValueChange={(value) => setSelectedYear(parseInt(value))}>
            <SelectTrigger className="w-[120px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {years.map((year) => (
                <SelectItem key={year} value={year.toString()}>
                  {year}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}
      </div>

      {/* Time Period Analytics */}
      <div className="space-y-4">

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
        </div>

      {/* All Payments View */}
      <AllPaymentsView />
    </div>
  );
};
