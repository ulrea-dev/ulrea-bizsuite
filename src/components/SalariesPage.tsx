
import React, { useState } from 'react';
import { Plus, Users, DollarSign, TrendingUp, Calendar } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useBusiness } from '@/contexts/BusinessContext';
import { SalaryPaymentModal } from '@/components/SalaryPaymentModal';
import { SalaryModal } from '@/components/SalaryModal';
import { formatCurrency } from '@/utils/storage';
import { convertCurrency } from '@/utils/currencyConversion';
import { SalaryRecord } from '@/types/business';
import { useToast } from '@/hooks/use-toast';
import { SUPPORTED_CURRENCIES } from '@/types/business';

// Import components
import { DataTable } from './ui/data-table';
import { createSalaryRecordColumns } from './SalaryRecordColumns';

// Combined salary record interface for display
interface CombinedSalaryRecord {
  id: string; // Use primary salary id, or first available
  teamMemberId: string;
  employeeName: string;
  position: string;
  totalAmount: number; // Combined amount in default currency
  totalAmountOriginal: number; // Combined amount in original currencies
  currency: string; // Default currency for display
  primarySalary?: SalaryRecord;
  secondarySalary?: SalaryRecord;
  frequency: string; // Combined frequency display
  startDate: string;
  projectInfo?: string;
}

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

  // Get all available currencies (supported + custom)
  const allCurrencies = [
    ...SUPPORTED_CURRENCIES,
    ...(data.customCurrencies || [])
  ];

  // Group salary records by team member and create combined records
  const combinedSalaryRecords: CombinedSalaryRecord[] = [];
  const processedTeamMembers = new Set<string>();

  businessSalaryRecords.forEach(record => {
    if (processedTeamMembers.has(record.teamMemberId)) {
      return; // Already processed this team member
    }

    processedTeamMembers.add(record.teamMemberId);

    // Get all salary records for this team member
    const memberRecords = businessSalaryRecords.filter(r => r.teamMemberId === record.teamMemberId);
    const primaryRecord = memberRecords.find(r => (r as any).salaryType === 'primary' || !(r as any).salaryType);
    const secondaryRecord = memberRecords.find(r => (r as any).salaryType === 'secondary');

    // Calculate combined total amount in default currency
    let totalAmountInDefaultCurrency = 0;
    let totalAmountOriginal = 0;

    if (primaryRecord) {
      const primaryCurrency = allCurrencies.find(c => c.code === primaryRecord.currency) || data.userSettings.defaultCurrency;
      let primaryMonthlyAmount = primaryRecord.amount;
      
      // Convert to monthly equivalent
      switch (primaryRecord.frequency) {
        case 'weekly':
          primaryMonthlyAmount = primaryRecord.amount * 4.33;
          break;
        case 'bi-weekly':
          primaryMonthlyAmount = primaryRecord.amount * 2.17;
          break;
        case 'quarterly':
          primaryMonthlyAmount = primaryRecord.amount / 3;
          break;
        case 'annually':
          primaryMonthlyAmount = primaryRecord.amount / 12;
          break;
      }

      const convertedPrimary = convertCurrency(
        primaryMonthlyAmount,
        primaryCurrency,
        data.userSettings.defaultCurrency,
        data.exchangeRates || []
      );
      
      totalAmountInDefaultCurrency += convertedPrimary;
      totalAmountOriginal += primaryMonthlyAmount;
    }

    if (secondaryRecord) {
      const secondaryCurrency = allCurrencies.find(c => c.code === secondaryRecord.currency) || data.userSettings.defaultCurrency;
      let secondaryMonthlyAmount = secondaryRecord.amount;
      
      // Convert to monthly equivalent
      switch (secondaryRecord.frequency) {
        case 'weekly':
          secondaryMonthlyAmount = secondaryRecord.amount * 4.33;
          break;
        case 'bi-weekly':
          secondaryMonthlyAmount = secondaryRecord.amount * 2.17;
          break;
        case 'quarterly':
          secondaryMonthlyAmount = secondaryRecord.amount / 3;
          break;
        case 'annually':
          secondaryMonthlyAmount = secondaryRecord.amount / 12;
          break;
      }

      const convertedSecondary = convertCurrency(
        secondaryMonthlyAmount,
        secondaryCurrency,
        data.userSettings.defaultCurrency,
        data.exchangeRates || []
      );
      
      totalAmountInDefaultCurrency += convertedSecondary;
      totalAmountOriginal += secondaryMonthlyAmount;
    }

    // Create combined record
    const memberName = getTeamMemberName(record.teamMemberId);
    const positions = [];
    if (primaryRecord) positions.push(primaryRecord.position);
    if (secondaryRecord) positions.push(secondaryRecord.position);

    const frequencies = [];
    if (primaryRecord) frequencies.push(`Primary: ${primaryRecord.frequency}`);
    if (secondaryRecord) frequencies.push(`Secondary: ${secondaryRecord.frequency}`);

    let projectInfo = '';
    if (primaryRecord?.projectId) {
      projectInfo += `Primary: ${getProjectName(primaryRecord.projectId)}`;
    }
    if (secondaryRecord?.projectId) {
      if (projectInfo) projectInfo += ', ';
      projectInfo += `Secondary: ${getProjectName(secondaryRecord.projectId)}`;
    }

    combinedSalaryRecords.push({
      id: primaryRecord?.id || secondaryRecord?.id || record.id,
      teamMemberId: record.teamMemberId,
      employeeName: memberName,
      position: positions.join(' + '),
      totalAmount: totalAmountInDefaultCurrency,
      totalAmountOriginal: totalAmountOriginal,
      currency: data.userSettings.defaultCurrency.code,
      primarySalary: primaryRecord,
      secondarySalary: secondaryRecord,
      frequency: frequencies.join(', '),
      startDate: primaryRecord?.startDate || secondaryRecord?.startDate || record.startDate,
      projectInfo: projectInfo || undefined,
    });
  });

  // Calculate total monthly salaries using the combined records
  const totalMonthlySalaries = combinedSalaryRecords.reduce((total, record) => {
    return total + record.totalAmount;
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

  const handleEditSalary = (record: CombinedSalaryRecord) => {
    setSelectedTeamMemberId(record.teamMemberId);
    setShowSalaryModal(true);
  };

  const handleRecordPayment = (record: CombinedSalaryRecord) => {
    // Use primary salary record for payment, or secondary if no primary
    const recordId = record.primarySalary?.id || record.secondarySalary?.id;
    setSelectedPaymentRecordId(recordId || null);
    setShowPaymentModal(true);
  };

  const columns = createSalaryRecordColumns({
    onView: handleEditSalary,
    onEdit: handleEditSalary,
    onRecordPayment: handleRecordPayment,
    getTeamMemberName,
    getProjectName,
    getClientName,
    allCurrencies,
    defaultCurrency: data.userSettings.defaultCurrency,
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
            <div className="text-2xl font-bold">{combinedSalaryRecords.length}</div>
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
          <DataTable columns={columns} data={combinedSalaryRecords} />
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
