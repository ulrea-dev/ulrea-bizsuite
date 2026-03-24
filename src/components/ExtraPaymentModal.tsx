import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useBusiness } from '@/contexts/BusinessContext';
import { generateId } from '@/utils/storage';
import { useToast } from '@/hooks/use-toast';
import { ExtraPayment, ExtraPaymentType, SUPPORTED_CURRENCIES } from '@/types/business';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { CalendarIcon } from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';

interface ExtraPaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  existingPayment?: ExtraPayment | null;
  defaultTeamMemberId?: string;
  defaultPeriod?: string;
}

const EXTRA_PAYMENT_TYPES: { value: ExtraPaymentType; label: string }[] = [
  { value: 'bonus', label: 'Bonus' },
  { value: 'commission', label: 'Commission' },
  { value: 'overtime', label: 'Overtime' },
  { value: 'allowance', label: 'Allowance' },
  { value: 'reimbursement', label: 'Reimbursement' },
  { value: 'other', label: 'Other' },
];

export const ExtraPaymentModal: React.FC<ExtraPaymentModalProps> = ({
  isOpen,
  onClose,
  existingPayment,
  defaultTeamMemberId,
  defaultPeriod,
}) => {
  const { data, currentBusiness, dispatch } = useBusiness();
  const { toast } = useToast();

  const currentPeriod = defaultPeriod || `${new Date().getFullYear()}-${(new Date().getMonth() + 1).toString().padStart(2, '0')}`;

  const [formData, setFormData] = useState({
    teamMemberId: defaultTeamMemberId || '',
    amount: '',
    currency: currentBusiness?.currency.code || 'USD',
    period: currentPeriod,
    type: 'bonus' as ExtraPaymentType,
    name: '',
    description: '',
    status: 'paid' as 'pending' | 'paid',
  });
  const [paymentDate, setPaymentDate] = useState<Date | undefined>(new Date());

  useEffect(() => {
    if (existingPayment) {
      setFormData({
        teamMemberId: existingPayment.teamMemberId,
        amount: existingPayment.amount.toString(),
        currency: existingPayment.currency,
        period: existingPayment.period,
        type: existingPayment.type,
        name: existingPayment.name,
        description: existingPayment.description || '',
        status: existingPayment.status,
      });
      setPaymentDate(new Date(existingPayment.paymentDate + 'T00:00:00'));
    } else {
      setFormData({
        teamMemberId: defaultTeamMemberId || '',
        amount: '',
        currency: currentBusiness?.currency.code || 'USD',
        period: currentPeriod,
        type: 'bonus',
        name: '',
        description: '',
        status: 'paid',
      });
      setPaymentDate(new Date());
    }
  }, [existingPayment, defaultTeamMemberId, currentPeriod, currentBusiness?.currency.code]);

  if (!currentBusiness) return null;

  // Get team members for this business - check both businessIds array AND salary records
  const businessSalaryRecords = (data.salaryRecords || []).filter(
    record => record.businessId === currentBusiness.id
  );
  const teamMemberIdsFromSalary = new Set(businessSalaryRecords.map(r => r.teamMemberId));
  
  const businessTeamMembers = data.teamMembers.filter(member =>
    member.businessIds?.includes(currentBusiness.id) || teamMemberIdsFromSalary.has(member.id)
  );

  const allCurrencies = [...SUPPORTED_CURRENCIES, ...(data.customCurrencies || [])];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.teamMemberId || !formData.amount || !formData.name) {
      toast({
        title: 'Validation Error',
        description: 'Please fill in all required fields',
        variant: 'destructive',
      });
      return;
    }

    const amount = parseFloat(formData.amount);
    if (isNaN(amount) || amount <= 0) {
      toast({
        title: 'Validation Error',
        description: 'Please enter a valid amount',
        variant: 'destructive',
      });
      return;
    }

    if (existingPayment) {
      dispatch({
        type: 'UPDATE_EXTRA_PAYMENT',
        payload: {
          id: existingPayment.id,
          updates: {
            teamMemberId: formData.teamMemberId,
            amount,
            currency: formData.currency,
            period: formData.period,
            paymentDate: paymentDate ? paymentDate.toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
            type: formData.type,
            name: formData.name,
            description: formData.description || undefined,
            status: formData.status,
          },
        },
      });
      toast({
        title: 'Extra Payment Updated',
        description: `${formData.name} has been updated`,
      });
    } else {
      const newPayment: ExtraPayment = {
        id: generateId(),
        businessId: currentBusiness.id,
        teamMemberId: formData.teamMemberId,
        amount,
        currency: formData.currency,
        period: formData.period,
        paymentDate: formData.paymentDate,
        type: formData.type,
        name: formData.name,
        description: formData.description || undefined,
        status: formData.status,
        createdAt: new Date().toISOString(),
      };

      dispatch({ type: 'ADD_EXTRA_PAYMENT', payload: newPayment });
      toast({
        title: 'Extra Payment Added',
        description: `${formData.name} has been recorded`,
      });
    }

    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>{existingPayment ? 'Edit' : 'Add'} Extra Payment</DialogTitle>
          <DialogDescription>
            Record a bonus, commission, or other extra payment for an employee.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="teamMember">Team Member *</Label>
            <Select
              value={formData.teamMemberId}
              onValueChange={(value) => setFormData({ ...formData, teamMemberId: value })}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select team member" />
              </SelectTrigger>
              <SelectContent className="bg-background z-50">
                {businessTeamMembers.length === 0 ? (
                  <SelectItem value="_empty" disabled>
                    No team members found
                  </SelectItem>
                ) : (
                  businessTeamMembers.map((member) => (
                    <SelectItem key={member.id} value={member.id}>
                      {member.name}
                    </SelectItem>
                  ))
                )}
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="type">Payment Type *</Label>
              <Select
                value={formData.type}
                onValueChange={(value) => setFormData({ ...formData, type: value as ExtraPaymentType })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {EXTRA_PAYMENT_TYPES.map((type) => (
                    <SelectItem key={type.value} value={type.value}>
                      {type.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="name">Payment Name *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="e.g., Holiday Bonus"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="amount">Amount *</Label>
              <Input
                id="amount"
                type="number"
                step="0.01"
                min="0"
                value={formData.amount}
                onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                placeholder="0.00"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="currency">Currency</Label>
              <Select
                value={formData.currency}
                onValueChange={(value) => setFormData({ ...formData, currency: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {allCurrencies.map((currency) => (
                    <SelectItem key={currency.code} value={currency.code}>
                      {currency.code} ({currency.symbol})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="period">Period (Month)</Label>
              <Input
                id="period"
                type="month"
                value={formData.period}
                onChange={(e) => setFormData({ ...formData, period: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label>Payment Date</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-left font-normal",
                      !paymentDate && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {paymentDate ? format(paymentDate, "PP") : "Pick a date"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={paymentDate}
                    onSelect={(d) => d && setPaymentDate(d)}
                    initialFocus
                    className="pointer-events-auto"
                  />
                </PopoverContent>
              </Popover>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="status">Status</Label>
            <Select
              value={formData.status}
              onValueChange={(value) => setFormData({ ...formData, status: value as 'pending' | 'paid' })}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="paid">Paid</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description (Optional)</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Additional notes about this payment..."
              rows={2}
            />
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit">
              {existingPayment ? 'Update' : 'Add'} Payment
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};