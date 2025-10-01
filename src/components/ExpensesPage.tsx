import React, { useState } from 'react';
import { AllExpensesView } from './AllExpensesView';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useBusiness } from '@/contexts/BusinessContext';
import { formatCurrency } from '@/utils/storage';
import { Receipt, TrendingDown, TrendingUp, PieChart } from 'lucide-react';
import { startOfMonth, startOfQuarter, startOfYear, endOfMonth, endOfQuarter, endOfYear, isWithinInterval } from 'date-fns';

export const ExpensesPage: React.FC = () => {
  const { data, currentBusiness } = useBusiness();
  const [timePeriod, setTimePeriod] = useState<'month' | 'quarter' | 'year'>('month');

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

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Expenses</h1>
        <p className="text-muted-foreground">
          Track and manage all business expenses
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
        </TabsContent>
      </Tabs>

      {/* All Expenses View */}
      <AllExpensesView />
    </div>
  );
};
