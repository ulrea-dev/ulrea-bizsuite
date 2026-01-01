import React from 'react';
import { useSearchParams } from 'react-router-dom';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { RevenuePage } from './RevenuePage';
import { PaymentsPage } from './PaymentsPage';
import { ExpensesPage } from './ExpensesPage';
import { SalariesPage } from './SalariesPage';
import { RetainersPage } from './RetainersPage';
import { QuickTaskPaymentsPage } from './QuickTaskPaymentsPage';
import { DollarSign, TrendingUp, Receipt, Users, Repeat, ListChecks } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { HelpCircle } from 'lucide-react';

const VALID_TABS = ['revenue', 'payments', 'expenses', 'salaries', 'tasks', 'retainers'] as const;
type TabValue = typeof VALID_TABS[number];

export const FinancialsPage: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const tabParam = searchParams.get('tab');
  const activeTab: TabValue = VALID_TABS.includes(tabParam as TabValue) ? (tabParam as TabValue) : 'revenue';

  const handleTabChange = (value: string) => {
    setSearchParams({ tab: value });
  };

  return (
    <div className="space-y-4 sm:space-y-6">
      <div>
        <h1 className="text-xl sm:text-2xl md:text-3xl font-bold tracking-tight">Financials</h1>
        <p className="text-sm sm:text-base text-muted-foreground">
          Manage revenue, payments, expenses, and payroll
        </p>
      </div>

      <Tabs value={activeTab} onValueChange={handleTabChange} className="space-y-6">
        <div className="overflow-x-auto -mx-3 px-3 sm:mx-0 sm:px-0">
          <TabsList className="inline-flex w-max sm:w-auto sm:grid sm:grid-cols-6">
            <TabsTrigger value="revenue" className="gap-1.5 text-xs sm:text-sm">
              <TrendingUp className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
              <span>Revenue</span>
            </TabsTrigger>
            <TabsTrigger value="payments" className="gap-1.5 text-xs sm:text-sm">
              <DollarSign className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
              <span>Payments</span>
            </TabsTrigger>
            <TabsTrigger value="expenses" className="gap-1.5 text-xs sm:text-sm">
              <Receipt className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
              <span>Expenses</span>
            </TabsTrigger>
            <TabsTrigger value="salaries" className="gap-1.5 text-xs sm:text-sm">
              <Users className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
              <span>Payroll</span>
            </TabsTrigger>
            <TabsTrigger value="tasks" className="gap-1.5 text-xs sm:text-sm">
              <ListChecks className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
              <span>Tasks</span>
            </TabsTrigger>
            <TabsTrigger value="retainers" className="gap-1.5 text-xs sm:text-sm items-center">
              <Repeat className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
              <span>Retainers</span>
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <HelpCircle className="h-3 w-3 text-muted-foreground hidden sm:inline" />
                  </TooltipTrigger>
                  <TooltipContent>
                    <p className="max-w-xs">Recurring subscription-based revenue from clients on monthly or annual contracts.</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </TabsTrigger>
          </TabsList>
        </div>

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

        <TabsContent value="tasks" className="space-y-6">
          <QuickTaskPaymentsPage />
        </TabsContent>

        <TabsContent value="retainers" className="space-y-6">
          <RetainersPage />
        </TabsContent>
      </Tabs>
    </div>
  );
};
