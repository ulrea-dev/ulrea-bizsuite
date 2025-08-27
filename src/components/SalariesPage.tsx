import React, { useState } from 'react';
import { useBusiness } from '@/contexts/BusinessContext';
import { generateId, formatCurrency } from '@/utils/storage';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Calendar } from '@/components/ui/calendar';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { CalendarIcon, DollarSign, Plus } from 'lucide-react';
import { cn } from "@/lib/utils";
import { format } from 'date-fns';
import { Expense, SalaryRecord } from '@/types/business';
import { DataTable } from './ui/data-table';
import { salaryRecordColumns } from './SalaryRecordColumns';
import { ExchangeRateModal } from './ExchangeRateModal';

interface PaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  salaryRecordId: string | null;
}

const PaymentModal: React.FC<PaymentModalProps> = ({ isOpen, onClose, salaryRecordId }) => {
  const { data, dispatch } = useBusiness();
  const [amount, setAmount] = useState('');
  const [paymentDate, setPaymentDate] = useState<Date | undefined>(new Date());
  const [period, setPeriod] = useState('');
  const [method, setMethod] = useState('');
  const [description, setDescription] = useState('');

  if (!salaryRecordId) return null;

  const salaryRecord = data.salaryRecords.find(s => s.id === salaryRecordId);

  if (!salaryRecord) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!amount || !paymentDate || !period) {
      alert('Please fill in all fields.');
      return;
    }

    const payment = {
      id: generateId(),
      salaryRecordId: salaryRecordId,
      amount: parseFloat(amount),
      paymentDate: paymentDate.toISOString(),
      period: period,
      method: method,
      description: description,
      createdAt: new Date().toISOString(),
    };

    dispatch({
      type: 'ADD_SALARY_PAYMENT',
      payload: payment,
    });

    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Record Salary Payment</DialogTitle>
          <DialogDescription>
            Record a payment for {salaryRecord.position} - {salaryRecord.amount} {salaryRecord.currency}
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="amount" className="text-right">
              Amount
            </Label>
            <Input id="amount" value={amount} onChange={(e) => setAmount(e.target.value)} className="col-span-3" />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="paymentDate" className="text-right">
              Payment Date
            </Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant={"outline"}
                  className={cn(
                    "w-[240px] justify-start text-left font-normal",
                    !paymentDate && "text-muted-foreground"
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {paymentDate ? format(paymentDate, "PPP") : <span>Pick a date</span>}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={paymentDate}
                  onSelect={setPaymentDate}
                  disabled={(date) =>
                    date > new Date()
                  }
                  initialFocus
                />
              </PopoverContent>
            </Popover>
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="period" className="text-right">
              Period
            </Label>
            <Input id="period" value={period} onChange={(e) => setPeriod(e.target.value)} className="col-span-3" />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="method" className="text-right">
              Method
            </Label>
            <Input id="method" value={method} onChange={(e) => setMethod(e.target.value)} className="col-span-3" />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="description" className="text-right">
              Description
            </Label>
            <Input id="description" value={description} onChange={(e) => setDescription(e.target.value)} className="col-span-3" />
          </div>
        </div>
        <DialogFooter>
          <Button type="submit" onClick={handleSubmit}>Record Payment</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

interface SalaryModalProps {
  isOpen: boolean;
  onClose: () => void;
  salary?: SalaryRecord | null;
}

const SalaryModal: React.FC<SalaryModalProps> = ({ isOpen, onClose, salary }) => {
  const { data, currentBusiness, dispatch } = useBusiness();
  const [teamMemberId, setTeamMemberId] = useState(salary?.teamMemberId || '');
  const [position, setPosition] = useState(salary?.position || '');
  const [amount, setAmount] = useState(salary?.amount?.toString() || '');
  const [currency, setCurrency] = useState(salary?.currency || currentBusiness?.currency.code || 'USD');
  const [frequency, setFrequency] = useState(salary?.frequency || 'monthly');
  const [startDate, setStartDate] = useState<Date | undefined>(salary ? new Date(salary.startDate) : new Date());
  const [description, setDescription] = useState(salary?.description || '');

  if (!currentBusiness) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!teamMemberId || !position || !amount || !currency || !frequency || !startDate) {
      alert('Please fill in all fields.');
      return;
    }

    const salaryRecord = {
      id: salary?.id || generateId(),
      businessId: currentBusiness.id,
      teamMemberId: teamMemberId,
      position: position,
      amount: parseFloat(amount),
      currency: currency,
      frequency: frequency,
      startDate: startDate.toISOString(),
      description: description,
      createdAt: salary?.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    dispatch({
      type: salary ? 'UPDATE_SALARY_RECORD' : 'ADD_SALARY_RECORD',
      payload: salaryRecord,
    });

    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>{salary ? 'Edit' : 'Add'} Salary Record</DialogTitle>
          <DialogDescription>
            {salary ? 'Edit' : 'Create'} a new salary record for a team member.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="teamMember" className="text-right">
              Team Member
            </Label>
            <Select value={teamMemberId} onValueChange={setTeamMemberId}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Select member" />
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
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="position" className="text-right">
              Position
            </Label>
            <Input id="position" value={position} onChange={(e) => setPosition(e.target.value)} className="col-span-3" />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="amount" className="text-right">
              Amount
            </Label>
            <Input id="amount" value={amount} onChange={(e) => setAmount(e.target.value)} className="col-span-3" />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="currency" className="text-right">
              Currency
            </Label>
            <Select value={currency} onValueChange={setCurrency}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Select currency" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={currentBusiness.currency.code}>
                  {currentBusiness.currency.code}
                </SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="frequency" className="text-right">
              Frequency
            </Label>
            <Select value={frequency} onValueChange={setFrequency}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Select frequency" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="weekly">Weekly</SelectItem>
                <SelectItem value="bi-weekly">Bi-Weekly</SelectItem>
                <SelectItem value="monthly">Monthly</SelectItem>
                <SelectItem value="quarterly">Quarterly</SelectItem>
                <SelectItem value="annually">Annually</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="startDate" className="text-right">
              Start Date
            </Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant={"outline"}
                  className={cn(
                    "w-[240px] justify-start text-left font-normal",
                    !startDate && "text-muted-foreground"
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {startDate ? format(startDate, "PPP") : <span>Pick a date</span>}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={startDate}
                  onSelect={setStartDate}
                  disabled={(date) =>
                    date > new Date()
                  }
                  initialFocus
                />
              </PopoverContent>
            </Popover>
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="description" className="text-right">
              Description
            </Label>
            <Input id="description" value={description} onChange={(e) => setDescription(e.target.value)} className="col-span-3" />
          </div>
        </div>
        <DialogFooter>
          <Button type="submit" onClick={handleSubmit}>{salary ? 'Update' : 'Create'}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export const SalariesPage: React.FC = () => {
  const { data, currentBusiness, dispatch } = useBusiness();
  const [showSalaryModal, setShowSalaryModal] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [showExchangeRateModal, setShowExchangeRateModal] = useState(false);
  const [selectedSalary, setSelectedSalary] = useState<SalaryRecord | null>(null);

  if (!currentBusiness) {
    return (
      <div className="p-6">
        <div className="text-center py-12">
          <h2 className="text-2xl font-bold dashboard-text-primary mb-2">No Business Selected</h2>
          <p className="dashboard-text-secondary">Please select a business to manage salaries.</p>
        </div>
      </div>
    );
  }

  const businessSalaries = data.salaryRecords.filter(s => s.businessId === currentBusiness.id);
  const defaultCurrency = data.userSettings.defaultCurrency;

  const onSalaryEdit = (salary: SalaryRecord) => {
    setSelectedSalary(salary);
    setShowSalaryModal(true);
  };

  const onSalaryDelete = (salaryId: string) => {
    if (confirm('Are you sure you want to delete this salary record?')) {
      dispatch({
        type: 'DELETE_SALARY_RECORD',
        payload: salaryId,
      });
    }
  };

  const onSalaryPayment = (salary: SalaryRecord) => {
    setSelectedSalary(salary);
    setShowPaymentModal(true);
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold dashboard-text-primary">Salary Management</h1>
          <p className="dashboard-text-secondary">
            Manage team member salaries for {currentBusiness.name} (Default: {defaultCurrency.symbol} {defaultCurrency.code})
          </p>
        </div>
        
        <div className="flex gap-2">
          <Button onClick={() => setShowExchangeRateModal(true)} variant="outline">
            <DollarSign className="h-4 w-4 mr-2" />
            Exchange Rates
          </Button>
          <Button onClick={() => setShowSalaryModal(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Add Salary Record
          </Button>
        </div>
      </div>

      <DataTable columns={salaryRecordColumns(onSalaryEdit, onSalaryDelete, onSalaryPayment)} data={businessSalaries} />

      <SalaryModal
        isOpen={showSalaryModal}
        onClose={() => {
          setShowSalaryModal(false);
          setSelectedSalary(null);
        }}
        salary={selectedSalary}
      />

      <PaymentModal
        isOpen={showPaymentModal}
        onClose={() => {
          setShowPaymentModal(false);
          setSelectedSalary(null);
        }}
        salaryRecordId={selectedSalary?.id || null}
      />

      <ExchangeRateModal
        isOpen={showExchangeRateModal}
        onClose={() => setShowExchangeRateModal(false)}
      />
    </div>
  );
};
