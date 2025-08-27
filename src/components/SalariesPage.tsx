import React, { useState } from 'react';
import { Plus, Users, DollarSign, TrendingUp, Calendar } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useBusiness } from '@/contexts/BusinessContext';
import { SalaryPaymentModal } from '@/components/SalaryPaymentModal';
import { SalaryModal } from '@/components/SalaryModal';
import { formatCurrency } from '@/utils/storage';
import { SalaryRecord } from '@/types/business';
import { useToast } from '@/hooks/use-toast';

// Import components
import { DataTable } from './ui/data-table';
import { createSalaryRecordColumns } from './SalaryRecordColumns';

export const SalariesPage: React.FC = () => {
  const { data, currentBusiness } = useBusiness();
  const { toast } = useToast();
  const [showSalaryModal, setShowSalaryModal] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [selectedPaymentRecordId, setSelectedPaymentRecordId] = useState<string | null>(null);
  const [selectedTeamMemberId, setSelectedTeamMemberId] = useState<string | null>(null);

  if (!currentBusiness) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-muted-foreground">Please select a business to manage salaries.</p>
      </div>
    );
  }

  const businessSalaryRecords = (data.salaryRecords || []).filter(
    record => record.businessId === currentBusiness.id
  );

  const businessSalaryPayments = (data.salaryPayments || []).filter(payment =>
    businessSalaryRecords.some(record => record.id === payment.salaryRecordId)
  );

  const totalMonthlySalaries = businessSalaryRecords.reduce((total, record) => {
    let monthlyAmount = record.amount;
    
    switch (record.frequency) {
      case 'weekly':
        monthlyAmount = record.amount * 4.33; // Average weeks per month
        break;
      case 'bi-weekly':
        monthlyAmount = record.amount * 2.17; // Average bi-weeks per month
        break;
      case 'quarterly':
        monthlyAmount = record.amount / 3;
        break;
      case 'annually':
        monthlyAmount = record.amount / 12;
        break;
      // monthly is already correct
    }
    
    return total + monthlyAmount;
  }, 0);

  const currentMonthPayments = businessSalaryPayments
    .filter(payment => {
      const paymentDate = new Date(payment.paymentDate);
      const currentDate = new Date();
      return (
        paymentDate.getMonth() === currentDate.getMonth() &&
        paymentDate.getFullYear() === currentDate.getFullYear()
      );
    })
    .reduce((total, payment) => total + payment.amount, 0);

  const getTeamMemberName = (memberId: string) => {
    const member = data.teamMembers.find(m => m.id === memberId);
    return member ? member.name : 'Unknown Member';
  };

  const getProjectName = (projectId: string) => {
    const project = data.projects.find(p => p.id === projectId);
    return project ? project.name : 'Unknown Project';
  };

  const getClientName = (clientId: string) => {
    const client = data.clients.find(c => c.id === clientId);
    return client ? client.name : 'Unknown Client';
  };

  const handleCreateSalary = () => {
    setSelectedTeamMemberId(null);
    setShowSalaryModal(true);
  };

  const handleEditSalary = (record: SalaryRecord) => {
    setSelectedTeamMemberId(record.teamMemberId);
    setShowSalaryModal(true);
  };

  const handleRecordPayment = (record: SalaryRecord) => {
    setSelectedPaymentRecordId(record.id);
    setShowPaymentModal(true);
  };

  const columns = createSalaryRecordColumns({
    onView: handleEditSalary, // Use edit for view since the new modal handles both
    onEdit: handleEditSalary,
    onRecordPayment: handleRecordPayment,
    getTeamMemberName,
    getProjectName,
    getClientName,
    allCurrencies: [...data.customCurrencies || []],
  });

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Salaries</h1>
          <p className="text-muted-foreground">
            Manage employee salaries and payments for {currentBusiness.name}
          </p>
          <p className="text-sm text-muted-foreground mt-1">
            Default Currency: {data.userSettings.defaultCurrency.name} ({data.userSettings.defaultCurrency.symbol})
          </p>
        </div>
        <Button onClick={handleCreateSalary}>
          <Plus className="mr-2 h-4 w-4" />
          Add Salary Record
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Employees</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{businessSalaryRecords.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Monthly Salary Cost</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatCurrency(totalMonthlySalaries, data.userSettings.defaultCurrency)}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">This Month Paid</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatCurrency(currentMonthPayments, data.userSettings.defaultCurrency)}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Payment Records</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{businessSalaryPayments.length}</div>
          </CardContent>
        </Card>
      </div>

      {/* Salary Records Table */}
      <Card>
        <CardHeader>
          <CardTitle>Salary Records</CardTitle>
          <CardDescription>
            Manage salary information for your team members. Each team member can have both primary and secondary salaries.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <DataTable columns={columns} data={businessSalaryRecords} />
        </CardContent>
      </Card>

      {/* Enhanced Salary Modal */}
      <SalaryModal
        isOpen={showSalaryModal}
        onClose={() => setShowSalaryModal(false)}
        teamMemberId={selectedTeamMemberId}
      />

      {/* Payment Modal */}
      <SalaryPaymentModal
        isOpen={showPaymentModal}
        onClose={() => setShowPaymentModal(false)}
        salaryRecordId={selectedPaymentRecordId}
      />
    </div>
  );
};