import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useBusiness } from '@/contexts/BusinessContext';
import { formatCurrency } from '@/utils/storage';
import { format, startOfMonth, endOfMonth, startOfQuarter, endOfQuarter, startOfYear, endOfYear } from 'date-fns';
import { TrendingUp, DollarSign, Wallet } from 'lucide-react';

export const RevenuePage: React.FC = () => {
  const { data, currentBusiness } = useBusiness();
  const [timePeriod, setTimePeriod] = useState<'month' | 'quarter' | 'year'>('month');
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth());
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());

  if (!currentBusiness) {
    return (
      <div className="p-8 text-center">
        <p className="text-muted-foreground">Please select a business to view revenue</p>
      </div>
    );
  }

  // Get all revenue sources (filtered by business)
  const allRevenue = data.payments.filter(payment => {
    if (payment.type !== 'incoming' || payment.status !== 'completed') return false;
    
    // Filter by business: check if payment is associated with current business
    const project = payment.projectId ? data.projects.find(p => p.id === payment.projectId) : null;
    const retainer = payment.retainerId ? data.retainers?.find(r => r.id === payment.retainerId) : null;
    const expense = payment.expenseId ? data.expenses?.find(e => e.id === payment.expenseId) : null;
    
    return (
      (project?.businessId === currentBusiness.id) ||
      (retainer?.businessId === currentBusiness.id) ||
      (expense?.businessId === currentBusiness.id) ||
      (!payment.projectId && !payment.retainerId && !payment.expenseId)
    );
  });

  // Calculate period dates
  const now = new Date();
  let periodStart: Date;
  let periodEnd: Date;

  switch (timePeriod) {
    case 'month':
      const selectedDate = new Date(selectedYear, selectedMonth, 1);
      periodStart = startOfMonth(selectedDate);
      periodEnd = endOfMonth(selectedDate);
      break;
    case 'quarter':
      const quarterDate = new Date(selectedYear, 0, 1);
      periodStart = startOfQuarter(quarterDate);
      periodEnd = endOfQuarter(quarterDate);
      break;
    case 'year':
      periodStart = startOfYear(new Date(selectedYear, 0, 1));
      periodEnd = endOfYear(new Date(selectedYear, 0, 1));
      break;
  }

  const periodRevenue = allRevenue.filter(payment => {
    const paymentDate = new Date(payment.date);
    return paymentDate >= periodStart && paymentDate <= periodEnd;
  });

  const totalRevenue = periodRevenue.reduce((sum, payment) => sum + payment.amount, 0);
  
  const projectRevenue = periodRevenue
    .filter(p => p.paymentSource === 'project')
    .reduce((sum, payment) => sum + payment.amount, 0);
    
  const taskRevenue = periodRevenue
    .filter(p => p.paymentSource === 'task')
    .reduce((sum, payment) => sum + payment.amount, 0);
    
  const retainerRevenue = periodRevenue
    .filter(p => p.paymentSource === 'retainer')
    .reduce((sum, payment) => sum + payment.amount, 0);

  const months = Array.from({ length: 12 }, (_, i) => ({
    value: i,
    label: format(new Date(2024, i, 1), 'MMMM')
  }));

  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: 5 }, (_, i) => currentYear - 2 + i);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-lg sm:text-xl md:text-2xl font-bold">Revenue</h1>
          <p className="text-xs sm:text-sm text-muted-foreground">Track income from all sources</p>
        </div>
      </div>

      <Tabs value={timePeriod} onValueChange={(value) => setTimePeriod(value as any)} className="w-full">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <TabsList className="w-full sm:w-auto">
            <TabsTrigger value="month">Month</TabsTrigger>
            <TabsTrigger value="quarter">Quarter</TabsTrigger>
            <TabsTrigger value="year">Year</TabsTrigger>
          </TabsList>

          <div className="flex gap-2 w-full sm:w-auto">
            {timePeriod === 'month' && (
              <Select value={selectedMonth.toString()} onValueChange={(val) => setSelectedMonth(parseInt(val))}>
                <SelectTrigger className="w-[160px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {months.map(month => (
                    <SelectItem key={month.value} value={month.value.toString()}>
                      {month.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
            
            <Select value={selectedYear.toString()} onValueChange={(val) => setSelectedYear(parseInt(val))}>
              <SelectTrigger className="w-[120px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {years.map(year => (
                  <SelectItem key={year} value={year.toString()}>
                    {year}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <TabsContent value={timePeriod} className="space-y-6 mt-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-6">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
                <DollarSign className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-lg md:text-xl font-bold">
                  {formatCurrency(totalRevenue, currentBusiness.currency)}
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  {periodRevenue.length} transactions
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Project Revenue</CardTitle>
                <TrendingUp className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-lg md:text-xl font-bold">
                  {formatCurrency(projectRevenue, currentBusiness.currency)}
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  {((projectRevenue / totalRevenue) * 100 || 0).toFixed(1)}% of total
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Task Revenue</CardTitle>
                <Wallet className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-lg md:text-xl font-bold">
                  {formatCurrency(taskRevenue, currentBusiness.currency)}
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  {((taskRevenue / totalRevenue) * 100 || 0).toFixed(1)}% of total
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Retainer Revenue</CardTitle>
                <TrendingUp className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-lg md:text-xl font-bold">
                  {formatCurrency(retainerRevenue, currentBusiness.currency)}
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  {((retainerRevenue / totalRevenue) * 100 || 0).toFixed(1)}% of total
                </p>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Revenue Details</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead className="hidden sm:table-cell">Source</TableHead>
                    <TableHead className="hidden sm:table-cell">Description</TableHead>
                    <TableHead className="text-right">Amount</TableHead>
                    <TableHead className="hidden sm:table-cell">Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {periodRevenue.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center text-muted-foreground">
                        No revenue recorded for this period
                      </TableCell>
                    </TableRow>
                  ) : (
                    periodRevenue.map(payment => (
                      <TableRow key={payment.id}>
                        <TableCell>{format(new Date(payment.date), 'PP')}</TableCell>
                        <TableCell className="hidden sm:table-cell capitalize">
                          <Badge variant="outline">{payment.paymentSource || 'project'}</Badge>
                        </TableCell>
                        <TableCell className="hidden sm:table-cell">{payment.description || '-'}</TableCell>
                        <TableCell className="text-right font-medium">
                          {formatCurrency(payment.amount, currentBusiness.currency)}
                        </TableCell>
                        <TableCell className="hidden sm:table-cell">
                          <Badge variant={payment.status === 'completed' ? 'default' : 'secondary'}>
                            {payment.status}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};
