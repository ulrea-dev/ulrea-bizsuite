import React from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { RevenuePage } from './RevenuePage';
import { PaymentsPage } from './PaymentsPage';
import { ExpensesPage } from './ExpensesPage';
import { SalariesPage } from './SalariesPage';
import { RetainersPage } from './RetainersPage';
import { DollarSign, TrendingUp, Receipt, Users, Repeat } from 'lucide-react';

interface FinancialsPageProps {
  onNavigate?: (page: string, itemId?: string) => void;
}

export const FinancialsPage: React.FC<FinancialsPageProps> = ({ onNavigate }) => {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Financials</h1>
        <p className="text-muted-foreground">
          Complete financial management hub for revenue, payments, expenses, and payroll
        </p>
      </div>

      <Tabs defaultValue="revenue" className="space-y-6">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="revenue" className="gap-2">
            <TrendingUp className="h-4 w-4" />
            Revenue
          </TabsTrigger>
          <TabsTrigger value="payments" className="gap-2">
            <DollarSign className="h-4 w-4" />
            Payments
          </TabsTrigger>
          <TabsTrigger value="expenses" className="gap-2">
            <Receipt className="h-4 w-4" />
            Expenses
          </TabsTrigger>
          <TabsTrigger value="salaries" className="gap-2">
            <Users className="h-4 w-4" />
            Salaries
          </TabsTrigger>
          <TabsTrigger value="retainers" className="gap-2">
            <Repeat className="h-4 w-4" />
            Retainers
          </TabsTrigger>
        </TabsList>

        <TabsContent value="revenue" className="space-y-6">
          <RevenuePage />
        </TabsContent>

        <TabsContent value="payments" className="space-y-6">
          <PaymentsPage />
        </TabsContent>

        <TabsContent value="expenses" className="space-y-6">
          <ExpensesPage />
        </TabsContent>

        <TabsContent value="salaries" className="space-y-6">
          <SalariesPage />
        </TabsContent>

        <TabsContent value="retainers" className="space-y-6">
          <RetainersPage onNavigate={onNavigate || (() => {})} />
        </TabsContent>
      </Tabs>
    </div>
  );
};