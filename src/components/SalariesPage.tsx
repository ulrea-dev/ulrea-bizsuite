
import React, { useState, useMemo } from 'react';
import { Plus, DollarSign, Calendar, Users, TrendingUp } from 'lucide-react';
import { useBusiness } from '@/contexts/BusinessContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { SalaryModal } from './SalaryModal';
import { SalaryPaymentModal } from './SalaryPaymentModal';
import { ExchangeRateModal } from './ExchangeRateModal';
import { formatCurrency } from '@/utils/storage';
import { convertCurrency } from '@/utils/currencyConversion';
import { SUPPORTED_CURRENCIES } from '@/types/business';

export const SalariesPage: React.FC = () => {
  const { data, currentBusiness } = useBusiness();
  const [showSalaryModal, setShowSalaryModal] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [showExchangeRateModal, setShowExchangeRateModal] = useState(false);
  const [selectedSalaryRecord, setSelectedSalaryRecord] = useState<string | null>(null);

  const currentBusinessSalaries = useMemo(() => {
    if (!currentBusiness) return [];
    return (data.salaryRecords || []).filter(record => record.businessId === currentBusiness.id);
  }, [data.salaryRecords, currentBusiness]);

  const monthlyTotalInDefaultCurrency = useMemo(() => {
    if (!currentBusiness) return 0;
    
    return currentBusinessSalaries.reduce((total, record) => {
      const currency = SUPPORTED_CURRENCIES.find(c => c.code === record.currency) || data.userSettings.defaultCurrency;
      const convertedAmount = convertCurrency(
        record.amount,
        currency,
        data.userSettings.defaultCurrency,
        data.exchangeRates || []
      );
      return total + convertedAmount;
    }, 0);
  }, [currentBusinessSalaries, data.userSettings.defaultCurrency, data.exchangeRates, currentBusiness]);

  const handleEditSalary = (salaryId: string) => {
    setSelectedSalaryRecord(salaryId);
    setShowSalaryModal(true);
  };

  const handleAddPayment = (salaryId: string) => {
    setSelectedSalaryRecord(salaryId);
    setShowPaymentModal(true);
  };

  if (!currentBusiness) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-muted-foreground">Please select a business to manage salaries.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Salary Management</h1>
          <p className="text-muted-foreground">
            Manage team member salaries and track monthly expenses
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => setShowExchangeRateModal(true)}>
            Exchange Rates
          </Button>
          <Button onClick={() => setShowSalaryModal(true)}>
            <Plus className="mr-2 h-4 w-4" />
            Add Salary Record
          </Button>
        </div>
      </div>

      {/* Monthly Overview Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Monthly Expense</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatCurrency(monthlyTotalInDefaultCurrency, data.userSettings.defaultCurrency)}
            </div>
            <p className="text-xs text-muted-foreground">
              In {data.userSettings.defaultCurrency.name}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Salaries</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{currentBusinessSalaries.length}</div>
            <p className="text-xs text-muted-foreground">
              Team members on payroll
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">This Month Paid</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {(data.salaryPayments || []).filter(payment => {
                const paymentDate = new Date(payment.paymentDate);
                const now = new Date();
                return paymentDate.getMonth() === now.getMonth() && 
                       paymentDate.getFullYear() === now.getFullYear();
              }).length}
            </div>
            <p className="text-xs text-muted-foreground">
              Payments made this month
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Exchange Rates</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{(data.exchangeRates || []).length}</div>
            <p className="text-xs text-muted-foreground">
              Currency pairs configured
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Salary Records */}
      <Card>
        <CardHeader>
          <CardTitle>Salary Records</CardTitle>
          <CardDescription>
            Manage individual salary records for your team members
          </CardDescription>
        </CardHeader>
        <CardContent>
          {currentBusinessSalaries.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-muted-foreground mb-4">No salary records found.</p>
              <Button onClick={() => setShowSalaryModal(true)}>
                <Plus className="mr-2 h-4 w-4" />
                Add Your First Salary Record
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              {currentBusinessSalaries.map((record) => {
                const teamMember = data.teamMembers.find(m => m.id === record.teamMemberId);
                const currency = SUPPORTED_CURRENCIES.find(c => c.code === record.currency) || data.userSettings.defaultCurrency;
                const recentPayments = (data.salaryPayments || [])
                  .filter(p => p.salaryRecordId === record.id)
                  .sort((a, b) => new Date(b.paymentDate).getTime() - new Date(a.paymentDate).getTime())
                  .slice(0, 3);

                return (
                  <div key={record.id} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <h3 className="font-semibold">{teamMember?.name || 'Unknown Member'}</h3>
                        <Badge variant="secondary">{record.frequency}</Badge>
                      </div>
                      <p className="text-sm text-muted-foreground mb-1">
                        {record.position} • {formatCurrency(record.amount, currency)}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        Last payment: {recentPayments[0] ? new Date(recentPayments[0].paymentDate).toLocaleDateString() : 'None'}
                      </p>
                    </div>
                    <div className="flex gap-2">
                      <Button variant="outline" size="sm" onClick={() => handleAddPayment(record.id)}>
                        Record Payment
                      </Button>
                      <Button variant="outline" size="sm" onClick={() => handleEditSalary(record.id)}>
                        Edit
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Modals */}
      <SalaryModal
        isOpen={showSalaryModal}
        onClose={() => {
          setShowSalaryModal(false);
          setSelectedSalaryRecord(null);
        }}
        salaryRecordId={selectedSalaryRecord}
      />

      <SalaryPaymentModal
        isOpen={showPaymentModal}
        onClose={() => {
          setShowPaymentModal(false);
          setSelectedSalaryRecord(null);
        }}
        salaryRecordId={selectedSalaryRecord}
      />

      <ExchangeRateModal
        isOpen={showExchangeRateModal}
        onClose={() => setShowExchangeRateModal(false)}
      />
    </div>
  );
};
