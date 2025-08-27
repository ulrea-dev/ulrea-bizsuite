import React, { useState, useMemo } from 'react';
import { Calendar, Users, CheckCircle, AlertCircle, Clock, DollarSign, FileText, Download, History } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useBusiness } from '@/contexts/BusinessContext';
import { formatCurrency, generateId } from '@/utils/storage';
import { convertCurrency } from '@/utils/currencyConversion';
import { useToast } from '@/hooks/use-toast';
import { PayrollPeriod, SalaryRecord, SalaryPayment } from '@/types/business';
import { SUPPORTED_CURRENCIES } from '@/types/business';
import { PaymentHistoryModal } from './PaymentHistoryModal';

interface PayrollEmployee {
  id: string;
  teamMemberId: string;
  employeeName: string;
  position: string;
  amount: number;
  currency: string;
  frequency: string;
  status: 'pending' | 'paid' | 'overdue';
  lastPayment?: string;
  salaryRecord: SalaryRecord;
}

export const PayrollDashboard: React.FC = () => {
  const { data, currentBusiness, dispatch } = useBusiness();
  const { toast } = useToast();
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1);
  const [processingPayroll, setProcessingPayroll] = useState(false);
  const [paymentHistoryOpen, setPaymentHistoryOpen] = useState(false);
  const [selectedEmployeeForHistory, setSelectedEmployeeForHistory] = useState<string | undefined>();

  if (!currentBusiness) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-muted-foreground">Please select a business to manage payroll.</p>
      </div>
    );
  }

  const businessSalaryRecords = (data.salaryRecords || []).filter(
    record => record.businessId === currentBusiness.id
  );

  const businessSalaryPayments = (data.salaryPayments || []).filter(payment =>
    businessSalaryRecords.some(record => record.id === payment.salaryRecordId)
  );

  // Get all currencies
  const allCurrencies = [
    ...SUPPORTED_CURRENCIES,
    ...(data.customCurrencies || [])
  ];

  // Get team member name helper
  const getTeamMemberName = (memberId: string) => {
    const member = data.teamMembers.find(m => m.id === memberId);
    return member ? member.name : 'Unknown Member';
  };

  // Calculate payroll employees for the selected period
  const payrollEmployees: PayrollEmployee[] = useMemo(() => {
    const processedTeamMembers = new Set<string>();
    const employees: PayrollEmployee[] = [];

    businessSalaryRecords.forEach(record => {
      if (processedTeamMembers.has(record.teamMemberId)) {
        return;
      }
      processedTeamMembers.add(record.teamMemberId);

      // Get all salary records for this team member
      const memberRecords = businessSalaryRecords.filter(r => r.teamMemberId === record.teamMemberId);
      const primaryRecord = memberRecords.find(r => r.salaryType === 'primary' || !r.salaryType);
      const secondaryRecord = memberRecords.find(r => r.salaryType === 'secondary');

      // Calculate total monthly amount in default currency
      let totalAmount = 0;
      let currency = data.userSettings.defaultCurrency.code;

      if (primaryRecord) {
        const primaryCurrency = allCurrencies.find(c => c.code === primaryRecord.currency) || data.userSettings.defaultCurrency;
        let monthlyAmount = primaryRecord.amount;
        
        // Convert to monthly equivalent
        switch (primaryRecord.frequency) {
          case 'weekly':
            monthlyAmount = primaryRecord.amount * 4.33;
            break;
          case 'bi-weekly':
            monthlyAmount = primaryRecord.amount * 2.17;
            break;
          case 'quarterly':
            monthlyAmount = primaryRecord.amount / 3;
            break;
          case 'annually':
            monthlyAmount = primaryRecord.amount / 12;
            break;
        }

        const converted = convertCurrency(
          monthlyAmount,
          primaryCurrency,
          data.userSettings.defaultCurrency,
          data.exchangeRates || []
        );
        totalAmount += converted;
      }

      if (secondaryRecord) {
        const secondaryCurrency = allCurrencies.find(c => c.code === secondaryRecord.currency) || data.userSettings.defaultCurrency;
        let monthlyAmount = secondaryRecord.amount;
        
        // Convert to monthly equivalent
        switch (secondaryRecord.frequency) {
          case 'weekly':
            monthlyAmount = secondaryRecord.amount * 4.33;
            break;
          case 'bi-weekly':
            monthlyAmount = secondaryRecord.amount * 2.17;
            break;
          case 'quarterly':
            monthlyAmount = secondaryRecord.amount / 3;
            break;
          case 'annually':
            monthlyAmount = secondaryRecord.amount / 12;
            break;
        }

        const converted = convertCurrency(
          monthlyAmount,
          secondaryCurrency,
          data.userSettings.defaultCurrency,
          data.exchangeRates || []
        );
        totalAmount += converted;
      }

      // Check payment status for current period
      const periodStart = new Date(selectedYear, selectedMonth - 1, 1);
      const periodEnd = new Date(selectedYear, selectedMonth, 0);
      
      const paymentsInPeriod = businessSalaryPayments.filter(payment => {
        const paymentDate = new Date(payment.paymentDate);
        const salaryRecord = businessSalaryRecords.find(r => r.id === payment.salaryRecordId);
        return salaryRecord?.teamMemberId === record.teamMemberId &&
               paymentDate >= periodStart && paymentDate <= periodEnd;
      });

      let status: 'pending' | 'paid' | 'overdue' = 'pending';
      let lastPayment: string | undefined;

      if (paymentsInPeriod.length > 0) {
        status = 'paid';
        lastPayment = paymentsInPeriod[paymentsInPeriod.length - 1].paymentDate;
      } else {
        const now = new Date();
        // Only mark as overdue if:
        // 1. The selected period is in the past
        // 2. The employee's salary started before or during the selected period
        const salaryStartDate = new Date(record.startDate);
        const isOverdue = now > periodEnd && salaryStartDate <= periodEnd;
        status = isOverdue ? 'overdue' : 'pending';
      }

      const positions = [];
      if (primaryRecord) positions.push(primaryRecord.position);
      if (secondaryRecord) positions.push(secondaryRecord.position);

      employees.push({
        id: primaryRecord?.id || secondaryRecord?.id || record.id,
        teamMemberId: record.teamMemberId,
        employeeName: getTeamMemberName(record.teamMemberId),
        position: positions.join(' + '),
        amount: totalAmount,
        currency,
        frequency: 'monthly',
        status,
        lastPayment,
        salaryRecord: primaryRecord || secondaryRecord || record,
      });
    });

    return employees;
  }, [businessSalaryRecords, businessSalaryPayments, selectedYear, selectedMonth, allCurrencies, data.userSettings.defaultCurrency, data.exchangeRates]);

  // Calculate statistics
  const stats = useMemo(() => {
    const totalEmployees = payrollEmployees.length;
    const paidEmployees = payrollEmployees.filter(emp => emp.status === 'paid').length;
    const pendingEmployees = payrollEmployees.filter(emp => emp.status === 'pending').length;
    const overdueEmployees = payrollEmployees.filter(emp => emp.status === 'overdue').length;
    const totalAmount = payrollEmployees.reduce((sum, emp) => sum + emp.amount, 0);
    const paidAmount = payrollEmployees
      .filter(emp => emp.status === 'paid')
      .reduce((sum, emp) => sum + emp.amount, 0);

    return {
      totalEmployees,
      paidEmployees,
      pendingEmployees,
      overdueEmployees,
      totalAmount,
      paidAmount,
      pendingAmount: totalAmount - paidAmount,
    };
  }, [payrollEmployees]);

  // Handle bulk payment marking
  const handleBulkMarkAsPaid = async () => {
    setProcessingPayroll(true);
    try {
      const pendingEmployees = payrollEmployees.filter(emp => emp.status === 'pending');
      
      for (const employee of pendingEmployees) {
        const payment: SalaryPayment = {
          id: generateId(),
          salaryRecordId: employee.salaryRecord.id,
          amount: employee.amount,
          paymentDate: new Date().toISOString().split('T')[0],
          period: `${selectedYear}-${selectedMonth.toString().padStart(2, '0')}`,
          method: 'Bulk Payment',
          description: `Payroll payment for ${selectedYear}-${selectedMonth.toString().padStart(2, '0')}`,
          status: 'paid',
          createdAt: new Date().toISOString(),
        };
        
        dispatch({ type: 'ADD_SALARY_PAYMENT', payload: payment });
      }

      toast({
        title: "Success",
        description: `Marked ${pendingEmployees.length} employees as paid for ${selectedYear}-${selectedMonth.toString().padStart(2, '0')}`,
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to process bulk payments",
        variant: "destructive",
      });
    } finally {
      setProcessingPayroll(false);
    }
  };

  // Handle individual payment marking
  const handleMarkAsPaid = (employee: PayrollEmployee) => {
    const payment: SalaryPayment = {
      id: generateId(),
      salaryRecordId: employee.salaryRecord.id,
      amount: employee.amount,
      paymentDate: new Date().toISOString().split('T')[0],
      period: `${selectedYear}-${selectedMonth.toString().padStart(2, '0')}`,
      method: 'Manual Payment',
      description: `Individual payment for ${selectedYear}-${selectedMonth.toString().padStart(2, '0')}`,
      status: 'paid',
      createdAt: new Date().toISOString(),
    };
    
    dispatch({ type: 'ADD_SALARY_PAYMENT', payload: payment });

    toast({
      title: "Success",
      description: `Marked ${employee.employeeName} as paid`,
    });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Payroll Dashboard</h1>
          <p className="text-muted-foreground">
            Manage monthly payroll for {currentBusiness.name}
          </p>
        </div>
        <div className="flex items-center gap-4">
          {/* Period Selector */}
          <div className="flex items-center gap-2">
            <Select 
              value={selectedMonth.toString()} 
              onValueChange={(value) => setSelectedMonth(parseInt(value))}
            >
              <SelectTrigger className="w-[120px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {Array.from({ length: 12 }, (_, i) => (
                  <SelectItem key={i + 1} value={(i + 1).toString()}>
                    {new Date(2024, i).toLocaleDateString('en-US', { month: 'long' })}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select 
              value={selectedYear.toString()} 
              onValueChange={(value) => setSelectedYear(parseInt(value))}
            >
              <SelectTrigger className="w-[100px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {Array.from({ length: 5 }, (_, i) => {
                  const year = new Date().getFullYear() - 2 + i;
                  return (
                    <SelectItem key={year} value={year.toString()}>
                      {year}
                    </SelectItem>
                  );
                })}
              </SelectContent>
            </Select>
          </div>
            <Button
              variant="outline"
              onClick={() => {
                setSelectedEmployeeForHistory(undefined);
                setPaymentHistoryOpen(true);
              }}
              className="gap-2"
            >
              <History className="h-4 w-4" />
              Payment History
            </Button>
            <Button 
              onClick={handleBulkMarkAsPaid}
              disabled={processingPayroll || stats.pendingEmployees === 0}
              className="gap-2"
            >
              <CheckCircle className="h-4 w-4" />
              Pay All Pending
            </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Employees</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalEmployees}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Paid This Month</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{stats.paidEmployees}</div>
            <p className="text-xs text-muted-foreground">
              {formatCurrency(stats.paidAmount, data.userSettings.defaultCurrency)}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending Payments</CardTitle>
            <Clock className="h-4 w-4 text-yellow-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">{stats.pendingEmployees}</div>
            <p className="text-xs text-muted-foreground">
              {formatCurrency(stats.pendingAmount, data.userSettings.defaultCurrency)}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Overdue Payments</CardTitle>
            <AlertCircle className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{stats.overdueEmployees}</div>
          </CardContent>
        </Card>
      </div>

      {/* Payroll Calendar/List */}
      <Card>
        <CardHeader>
          <CardTitle>Payroll for {new Date(selectedYear, selectedMonth - 1).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}</CardTitle>
          <CardDescription>
            Employee payment status and management
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {payrollEmployees.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                No employees found for this period.
              </div>
            ) : (
              payrollEmployees.map((employee) => (
                <div
                  key={employee.id}
                  className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors"
                >
                  <div className="flex items-center gap-4">
                    <div>
                      <h3 className="font-medium">{employee.employeeName}</h3>
                      <p className="text-sm text-muted-foreground">{employee.position}</p>
                    </div>
                    <Badge variant={
                      employee.status === 'paid' ? 'default' :
                      employee.status === 'overdue' ? 'destructive' : 'secondary'
                    }>
                      {employee.status.charAt(0).toUpperCase() + employee.status.slice(1)}
                    </Badge>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="text-right">
                      <div className="font-medium">
                        {formatCurrency(employee.amount, data.userSettings.defaultCurrency)}
                      </div>
                      {employee.lastPayment && (
                        <div className="text-xs text-muted-foreground">
                          Paid: {new Date(employee.lastPayment).toLocaleDateString()}
                        </div>
                      )}
                    </div>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setSelectedEmployeeForHistory(employee.teamMemberId);
                          setPaymentHistoryOpen(true);
                        }}
                        className="gap-2"
                      >
                        <History className="h-3 w-3" />
                        History
                      </Button>
                      {employee.status !== 'paid' && (
                        <Button
                          size="sm"
                          onClick={() => handleMarkAsPaid(employee)}
                          className="gap-2"
                        >
                          <DollarSign className="h-3 w-3" />
                          Mark Paid
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>

      {/* Payment History Modal */}
      <PaymentHistoryModal
        isOpen={paymentHistoryOpen}
        onClose={() => {
          setPaymentHistoryOpen(false);
          setSelectedEmployeeForHistory(undefined);
        }}
        teamMemberId={selectedEmployeeForHistory}
      />
    </div>
  );
};