
import React, { useState } from 'react';
import { Plus, Users, DollarSign, TrendingUp, Calendar } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { CurrencyInput } from '@/components/ui/currency-input';
import { useBusiness } from '@/contexts/BusinessContext';
import { SalaryPaymentModal } from '@/components/SalaryPaymentModal';
import { generateId, formatCurrency } from '@/utils/storage';
import { SalaryRecord, SUPPORTED_CURRENCIES } from '@/types/business';
import { useToast } from '@/hooks/use-toast';

// Import components
import { DataTable } from './ui/data-table';
import { createSalaryRecordColumns } from './SalaryRecordColumns';

export const SalariesPage: React.FC = () => {
  const { data, currentBusiness, dispatch } = useBusiness();
  const { toast } = useToast();
  const [showSalaryModal, setShowSalaryModal] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [selectedSalaryRecord, setSelectedSalaryRecord] = useState<SalaryRecord | null>(null);
  const [selectedPaymentRecordId, setSelectedPaymentRecordId] = useState<string | null>(null);
  const [modalMode, setModalMode] = useState<'create' | 'edit' | 'view'>('create');

  // Form state
  const [formData, setFormData] = useState({
    teamMemberId: '',
    position: '',
    amount: '',
    currency: data.userSettings.defaultCurrency.code,
    frequency: 'monthly' as SalaryRecord['frequency'],
    startDate: new Date().toISOString().split('T')[0],
    description: '',
  });

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

  const handleCreateSalary = () => {
    setSelectedSalaryRecord(null);
    setModalMode('create');
    setFormData({
      teamMemberId: '',
      position: '',
      amount: '',
      currency: data.userSettings.defaultCurrency.code,
      frequency: 'monthly',
      startDate: new Date().toISOString().split('T')[0],
      description: '',
    });
    setShowSalaryModal(true);
  };

  const handleViewSalary = (record: SalaryRecord) => {
    setSelectedSalaryRecord(record);
    setModalMode('view');
    setFormData({
      teamMemberId: record.teamMemberId,
      position: record.position,
      amount: record.amount.toString(),
      currency: record.currency,
      frequency: record.frequency,
      startDate: record.startDate,
      description: record.description || '',
    });
    setShowSalaryModal(true);
  };

  const handleEditSalary = (record: SalaryRecord) => {
    setSelectedSalaryRecord(record);
    setModalMode('edit');
    setFormData({
      teamMemberId: record.teamMemberId,
      position: record.position,
      amount: record.amount.toString(),
      currency: record.currency,
      frequency: record.frequency,
      startDate: record.startDate,
      description: record.description || '',
    });
    setShowSalaryModal(true);
  };

  const handleRecordPayment = (record: SalaryRecord) => {
    setSelectedPaymentRecordId(record.id);
    setShowPaymentModal(true);
  };

  const handleSalarySubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.teamMemberId || !formData.position || !formData.amount) {
      toast({
        title: "Error",
        description: "Please fill in all required fields.",
        variant: "destructive",
      });
      return;
    }

    const amount = parseFloat(formData.amount);
    if (isNaN(amount) || amount <= 0) {
      toast({
        title: "Error",
        description: "Please enter a valid amount.",
        variant: "destructive",
      });
      return;
    }

    const now = new Date().toISOString();

    if (modalMode === 'create') {
      const salaryRecord: SalaryRecord = {
        id: generateId(),
        businessId: currentBusiness.id,
        teamMemberId: formData.teamMemberId,
        position: formData.position,
        amount,
        currency: formData.currency,
        frequency: formData.frequency,
        startDate: formData.startDate,
        description: formData.description,
        createdAt: now,
        updatedAt: now,
      };

      dispatch({
        type: 'ADD_SALARY_RECORD',
        payload: salaryRecord,
      });

      toast({
        title: "Success",
        description: "Salary record created successfully.",
      });
    } else if (modalMode === 'edit' && selectedSalaryRecord) {
      dispatch({
        type: 'UPDATE_SALARY_RECORD',
        payload: {
          id: selectedSalaryRecord.id,
          updates: {
            teamMemberId: formData.teamMemberId,
            position: formData.position,
            amount,
            currency: formData.currency,
            frequency: formData.frequency,
            startDate: formData.startDate,
            description: formData.description,
            updatedAt: now,
          },
        },
      });

      toast({
        title: "Success",
        description: "Salary record updated successfully.",
      });
    }

    setShowSalaryModal(false);
  };

  const handleDeleteSalary = () => {
    if (selectedSalaryRecord) {
      dispatch({
        type: 'DELETE_SALARY_RECORD',
        payload: selectedSalaryRecord.id,
      });

      toast({
        title: "Success",
        description: "Salary record deleted successfully.",
      });

      setShowSalaryModal(false);
    }
  };

  const columns = createSalaryRecordColumns({
    onView: handleViewSalary,
    onEdit: handleEditSalary,
    onRecordPayment: handleRecordPayment,
    getTeamMemberName,
  });

  const isReadOnly = modalMode === 'view';

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
            Manage salary information for your team members
          </CardDescription>
        </CardHeader>
        <CardContent>
          <DataTable columns={columns} data={businessSalaryRecords} />
        </CardContent>
      </Card>

      {/* Salary Modal */}
      <Dialog open={showSalaryModal} onOpenChange={setShowSalaryModal}>
        <DialogContent className="sm:max-w-[525px]">
          <DialogHeader>
            <DialogTitle>
              {modalMode === 'create' && 'Add Salary Record'}
              {modalMode === 'edit' && 'Edit Salary Record'}
              {modalMode === 'view' && 'Salary Record Details'}
            </DialogTitle>
            <DialogDescription>
              {modalMode === 'create' && 'Create a new salary record for a team member'}
              {modalMode === 'edit' && 'Update salary record information'}
              {modalMode === 'view' && 'View salary record information'}
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSalarySubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="teamMember">Team Member *</Label>
                <Select
                  value={formData.teamMemberId}
                  onValueChange={(value) => setFormData({ ...formData, teamMemberId: value })}
                  disabled={isReadOnly}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select team member" />
                  </SelectTrigger>
                  <SelectContent>
                    {data.teamMembers.map(member => (
                      <SelectItem key={member.id} value={member.id}>
                        {member.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="position">Position *</Label>
                <Input
                  id="position"
                  value={formData.position}
                  onChange={(e) => setFormData({ ...formData, position: e.target.value })}
                  placeholder="e.g., Senior Developer"
                  disabled={isReadOnly}
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div>
                <Label htmlFor="amount">Amount *</Label>
                <CurrencyInput
                  id="amount"
                  value={formData.amount}
                  onChange={(value) => setFormData({ ...formData, amount: value })}
                  placeholder="0.00"
                  disabled={isReadOnly}
                  required
                />
              </div>

              <div>
                <Label htmlFor="currency">Currency</Label>
                <Select
                  value={formData.currency}
                  onValueChange={(value) => setFormData({ ...formData, currency: value })}
                  disabled={isReadOnly}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {SUPPORTED_CURRENCIES.concat(data.customCurrencies || []).map(currency => (
                      <SelectItem key={currency.code} value={currency.code}>
                        {currency.symbol} {currency.code}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="frequency">Frequency *</Label>
                <Select
                  value={formData.frequency}
                  onValueChange={(value: SalaryRecord['frequency']) => setFormData({ ...formData, frequency: value })}
                  disabled={isReadOnly}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="weekly">Weekly</SelectItem>
                    <SelectItem value="bi-weekly">Bi-weekly</SelectItem>
                    <SelectItem value="monthly">Monthly</SelectItem>
                    <SelectItem value="quarterly">Quarterly</SelectItem>
                    <SelectItem value="annually">Annually</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div>
              <Label htmlFor="startDate">Start Date *</Label>
              <Input
                id="startDate"
                type="date"
                value={formData.startDate}
                onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                disabled={isReadOnly}
                required
              />
            </div>

            <div>
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Additional notes about this salary record (optional)"
                disabled={isReadOnly}
                rows={3}
              />
            </div>

            <DialogFooter className="flex justify-between">
              <div>
                {modalMode === 'view' && selectedSalaryRecord && (
                  <Button 
                    type="button" 
                    variant="destructive" 
                    onClick={handleDeleteSalary}
                  >
                    Delete Record
                  </Button>
                )}
              </div>
              <div className="flex gap-2">
                <Button type="button" variant="outline" onClick={() => setShowSalaryModal(false)}>
                  {isReadOnly ? 'Close' : 'Cancel'}
                </Button>
                {!isReadOnly && (
                  <Button type="submit">
                    {modalMode === 'create' ? 'Create Record' : 'Update Record'}
                  </Button>
                )}
              </div>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Payment Modal */}
      <SalaryPaymentModal
        isOpen={showPaymentModal}
        onClose={() => setShowPaymentModal(false)}
        salaryRecordId={selectedPaymentRecordId}
      />
    </div>
  );
};
