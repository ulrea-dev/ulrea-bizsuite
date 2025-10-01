import React, { useState } from 'react';
import { AllExpensesView } from './AllExpensesView';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useBusiness } from '@/contexts/BusinessContext';
import { formatCurrency } from '@/utils/storage';
import { Receipt, TrendingDown, TrendingUp, PieChart } from 'lucide-react';
import { startOfMonth, startOfQuarter, startOfYear, endOfMonth, endOfQuarter, endOfYear, isWithinInterval } from 'date-fns';

export const ExpensesPage: React.FC = () => {
  const { data, currentBusiness } = useBusiness();
  const [timePeriod, setTimePeriod] = useState<'month' | 'quarter' | 'year'>('month');
  const [selectedMonth, setSelectedMonth] = useState<number>(new Date().getMonth());
  const [selectedYear, setSelectedYear] = useState<number>(new Date().getFullYear());

  if (!currentBusiness) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-muted-foreground">Please select a business to view expenses.</p>
      </div>
    );
  }

  // Get all expenses for the current business
  const allExpenses = data.projects
    .filter(project => project.businessId === currentBusiness.id)
    .flatMap(project => project.expenses);

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

  const periodExpenses = allExpenses.filter(expense => 
    isWithinInterval(new Date(expense.date), { start: periodStart, end: periodEnd })
  );

  const periodTotal = periodExpenses.reduce((sum, expense) => sum + expense.amount, 0);
  const periodPaid = periodExpenses.filter(e => e.status === 'paid').reduce((sum, e) => sum + e.amount, 0);
  const periodPending = periodExpenses.filter(e => e.status === 'pending').reduce((sum, e) => sum + e.amount, 0);

  // Calculate category breakdown
  const categoryBreakdown = periodExpenses.reduce((acc, expense) => {
    if (!acc[expense.category]) {
      acc[expense.category] = 0;
    }
    acc[expense.category] += expense.amount;
    return acc;
  }, {} as Record<string, number>);

  const topCategories = Object.entries(categoryBreakdown)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 3);

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
        <h1 className="text-3xl font-bold tracking-tight">Expenses</h1>
        <p className="text-muted-foreground">
          Track and manage all business expenses
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
          <div className="grid grid-cols-4 gap-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  <Receipt className="h-4 w-4" />
                  Total Expenses
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {formatCurrency(periodTotal, currentBusiness.currency)}
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  {periodExpenses.length} transactions
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  <TrendingUp className="h-4 w-4 text-green-600" />
                  Paid
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-600">
                  {formatCurrency(periodPaid, currentBusiness.currency)}
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  {periodExpenses.filter(e => e.status === 'paid').length} paid
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
                  {periodExpenses.filter(e => e.status === 'pending').length} pending
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  <PieChart className="h-4 w-4" />
                  Top Category
                </CardTitle>
              </CardHeader>
              <CardContent>
                {topCategories.length > 0 ? (
                  <>
                    <div className="text-xl font-bold capitalize">
                      {topCategories[0][0]}
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">
                      {formatCurrency(topCategories[0][1], currentBusiness.currency)}
                    </p>
                  </>
                ) : (
                  <div className="text-sm text-muted-foreground">No expenses yet</div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Category Breakdown */}
          {topCategories.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Top Spending Categories</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {topCategories.map(([category, amount]) => (
                    <div key={category} className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full bg-primary" />
                        <span className="text-sm font-medium capitalize">{category}</span>
                      </div>
                      <span className="text-sm font-semibold">
                        {formatCurrency(amount, currentBusiness.currency)}
                      </span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>

      {/* All Expenses View */}
      <AllExpensesView />
    </div>
  );
};
