import React, { useState, useEffect } from 'react';
import { useBusiness } from '@/contexts/BusinessContext';
import { generateId } from '@/utils/storage';
import { convertCurrency } from '@/utils/currencyConversion';
import { SUPPORTED_CURRENCIES } from '@/types/business';
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
import { CurrencyInput } from '@/components/ui/currency-input';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { Switch } from '@/components/ui/switch';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';

interface SalaryModalProps {
  isOpen: boolean;
  onClose: () => void;
  salaryRecordId?: string | null;
}

export const SalaryModal: React.FC<SalaryModalProps> = ({
  isOpen,
  onClose,
  salaryRecordId,
}) => {
  const { data, currentBusiness, dispatch } = useBusiness();
  const { toast } = useToast();
  const [formData, setFormData] = useState({
    teamMemberId: '',
    position: '',
    amount: '',
    currency: data.userSettings.defaultCurrency.code,
    frequency: 'monthly' as 'weekly' | 'bi-weekly' | 'monthly' | 'quarterly' | 'annually',
    startDate: new Date().toISOString().split('T')[0],
    endDate: '',
    description: '',
    isProjectBased: false,
    projectId: '',
    clientId: '',
    salaryType: 'primary' as 'primary' | 'secondary',
    contractDuration: '',
  });
  const [convertedAmount, setConvertedAmount] = useState<number | null>(null);

  const existingRecord = salaryRecordId 
    ? (data.salaryRecords || []).find(r => r.id === salaryRecordId)
    : null;

  // Get all available currencies (supported + custom)
  const allCurrencies = [
    ...SUPPORTED_CURRENCIES,
    ...(data.customCurrencies || [])
  ];

  // Get current business projects and clients
  const currentBusinessProjects = data.projects.filter(
    project => !currentBusiness || project.businessId === currentBusiness.id
  );

  const currentBusinessClients = data.clients.filter(
    client => !currentBusiness || client.projects.some(projectId => 
      currentBusinessProjects.some(project => project.id === projectId)
    )
  );

  useEffect(() => {
    if (existingRecord) {
      setFormData({
        teamMemberId: existingRecord.teamMemberId,
        position: existingRecord.position,
        amount: existingRecord.amount.toString(),
        currency: existingRecord.currency,
        frequency: existingRecord.frequency,
        startDate: existingRecord.startDate.split('T')[0],
        endDate: existingRecord.endDate ? existingRecord.endDate.split('T')[0] : '',
        description: existingRecord.description || '',
        isProjectBased: !!(existingRecord as any).projectId,
        projectId: (existingRecord as any).projectId || '',
        clientId: (existingRecord as any).clientId || '',
        salaryType: (existingRecord as any).salaryType || 'primary',
        contractDuration: (existingRecord as any).contractDuration?.toString() || '',
      });
    } else {
      setFormData({
        teamMemberId: '',
        position: '',
        amount: '',
        currency: data.userSettings.defaultCurrency.code,
        frequency: 'monthly',
        startDate: new Date().toISOString().split('T')[0],
        endDate: '',
        description: '',
        isProjectBased: false,
        projectId: '',
        clientId: '',
        salaryType: 'primary',
        contractDuration: '',
      });
    }
  }, [existingRecord, data.userSettings.defaultCurrency.code]);

  // Calculate end date automatically for secondary salaries
  useEffect(() => {
    if (formData.salaryType === 'secondary' && formData.contractDuration && formData.startDate) {
      const startDate = new Date(formData.startDate);
      const endDate = new Date(startDate);
      endDate.setMonth(endDate.getMonth() + parseInt(formData.contractDuration));
      setFormData(prev => ({
        ...prev,
        endDate: endDate.toISOString().split('T')[0]
      }));
    }
  }, [formData.salaryType, formData.contractDuration, formData.startDate]);

  useEffect(() => {
    // Calculate converted amount when amount or currency changes
    if (formData.amount && formData.currency !== data.userSettings.defaultCurrency.code) {
      const amount = parseFloat(formData.amount);
      if (!isNaN(amount)) {
        const fromCurrency = allCurrencies.find(c => c.code === formData.currency);
        if (fromCurrency) {
          const converted = convertCurrency(
            amount,
            fromCurrency,
            data.userSettings.defaultCurrency,
            data.exchangeRates || []
          );
          setConvertedAmount(converted);
        }
      }
    } else {
      setConvertedAmount(null);
    }
  }, [formData.amount, formData.currency, data.userSettings.defaultCurrency, data.exchangeRates, allCurrencies]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!currentBusiness) {
      toast({
        title: "Error",
        description: "Please select a business first.",
        variant: "destructive",
      });
      return;
    }

    if (!formData.teamMemberId || !formData.position || !formData.amount) {
      toast({
        title: "Error",
        description: "Please fill in all required fields.",
        variant: "destructive",
      });
      return;
    }

    if (formData.salaryType === 'secondary' && !formData.contractDuration) {
      toast({
        title: "Error",
        description: "Please specify contract duration for secondary salary.",
        variant: "destructive",
      });
      return;
    }

    if (formData.isProjectBased && !formData.projectId) {
      toast({
        title: "Error",
        description: "Please select a project for project-based salary.",
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

    const salaryRecord = {
      id: existingRecord?.id || generateId(),
      businessId: currentBusiness.id,
      teamMemberId: formData.teamMemberId,
      position: formData.position,
      amount,
      currency: formData.currency,
      frequency: formData.frequency,
      startDate: new Date(formData.startDate).toISOString(),
      endDate: formData.endDate ? new Date(formData.endDate).toISOString() : undefined,
      description: formData.description,
      projectId: formData.isProjectBased ? formData.projectId : undefined,
      clientId: formData.isProjectBased ? formData.clientId : undefined,
      isProjectBased: formData.isProjectBased,
      salaryType: formData.salaryType,
      contractDuration: formData.salaryType === 'secondary' && formData.contractDuration ? 
        parseInt(formData.contractDuration) : undefined,
      createdAt: existingRecord?.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    if (existingRecord) {
      dispatch({
        type: 'UPDATE_SALARY_RECORD',
        payload: { id: existingRecord.id, updates: salaryRecord },
      });
      toast({
        title: "Success",
        description: "Salary record updated successfully.",
      });
    } else {
      dispatch({
        type: 'ADD_SALARY_RECORD',
        payload: salaryRecord,
      });
      toast({
        title: "Success",
        description: "Salary record added successfully.",
      });
    }

    onClose();
  };

  const currentBusinessTeamMembers = data.teamMembers.filter(
    member => !currentBusiness || member.id
  );

  const selectedProject = currentBusinessProjects.find(p => p.id === formData.projectId);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {existingRecord ? 'Edit Salary Record' : 'Add Salary Record'}
          </DialogTitle>
          <DialogDescription>
            {existingRecord 
              ? 'Update the salary information for this team member.'
              : 'Create a new salary record for a team member.'
            }
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="teamMember">Team Member *</Label>
            <Select
              value={formData.teamMemberId}
              onValueChange={(value) => setFormData({ ...formData, teamMemberId: value })}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select team member" />
              </SelectTrigger>
              <SelectContent>
                {currentBusinessTeamMembers.map((member) => (
                  <SelectItem key={member.id} value={member.id}>
                    {member.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label>Salary Type *</Label>
            <RadioGroup
              value={formData.salaryType}
              onValueChange={(value: 'primary' | 'secondary') => setFormData({ ...formData, salaryType: value })}
              className="flex space-x-6 mt-2"
            >
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="primary" id="primary" />
                <Label htmlFor="primary">Primary Salary</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="secondary" id="secondary" />
                <Label htmlFor="secondary">Secondary/Contract Salary</Label>
              </div>
            </RadioGroup>
          </div>

          <div>
            <Label htmlFor="position">Position *</Label>
            <Input
              id="position"
              value={formData.position}
              onChange={(e) => setFormData({ ...formData, position: e.target.value })}
              placeholder="e.g., Senior Developer"
              required
            />
          </div>

          {formData.salaryType === 'secondary' && (
            <div>
              <Label htmlFor="contractDuration">Contract Duration (months) *</Label>
              <Input
                id="contractDuration"
                type="number"
                min="1"
                max="60"
                value={formData.contractDuration}
                onChange={(e) => setFormData({ ...formData, contractDuration: e.target.value })}
                placeholder="e.g., 6 for 6 months"
                required
              />
            </div>
          )}

          <div className="flex items-center space-x-2">
            <Switch
              id="project-based"
              checked={formData.isProjectBased}
              onCheckedChange={(checked) => setFormData({ 
                ...formData, 
                isProjectBased: checked,
                projectId: checked ? formData.projectId : '',
                clientId: checked ? formData.clientId : '',
              })}
            />
            <Label htmlFor="project-based">Project-based salary</Label>
          </div>

          {formData.isProjectBased && (
            <>
              <div>
                <Label htmlFor="project">Project *</Label>
                <Select
                  value={formData.projectId}
                  onValueChange={(value) => {
                    const project = currentBusinessProjects.find(p => p.id === value);
                    setFormData({ 
                      ...formData, 
                      projectId: value,
                      clientId: project?.clientId || '',
                    });
                  }}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select project" />
                  </SelectTrigger>
                  <SelectContent>
                    {currentBusinessProjects.map((project) => (
                      <SelectItem key={project.id} value={project.id}>
                        {project.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {selectedProject?.clientId && (
                <div>
                  <Label htmlFor="client">Client</Label>
                  <Select
                    value={formData.clientId}
                    onValueChange={(value) => setFormData({ ...formData, clientId: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select client" />
                    </SelectTrigger>
                    <SelectContent>
                      {currentBusinessClients.map((client) => (
                        <SelectItem key={client.id} value={client.id}>
                          {client.name} ({client.company})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}
            </>
          )}

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="amount">Amount *</Label>
              <CurrencyInput
                id="amount"
                value={formData.amount}
                onChange={(value) => setFormData({ ...formData, amount: value })}
                placeholder="0.00"
                required
              />
              {convertedAmount !== null && (
                <p className="text-xs text-muted-foreground mt-1">
                  ≈ {data.userSettings.defaultCurrency.symbol}{convertedAmount.toLocaleString()}
                </p>
              )}
            </div>

            <div>
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
                      {currency.symbol} {currency.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="frequency">Frequency</Label>
              <Select
                value={formData.frequency}
                onValueChange={(value: any) => setFormData({ ...formData, frequency: value })}
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

            <div>
              <Label htmlFor="startDate">Start Date</Label>
              <Input
                id="startDate"
                type="date"
                value={formData.startDate}
                onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
              />
            </div>
          </div>

          {formData.salaryType === 'secondary' && (
            <div>
              <Label htmlFor="endDate">Contract End Date</Label>
              <Input
                id="endDate"
                type="date"
                value={formData.endDate}
                onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                readOnly
                className="bg-muted"
              />
              <p className="text-xs text-muted-foreground mt-1">
                Auto-calculated based on contract duration
              </p>
            </div>
          )}

          <div>
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder={formData.salaryType === 'secondary' 
                ? "Details about the contract work, specific project, or additional responsibilities"
                : "Additional notes about this salary record (optional)"
              }
              rows={3}
            />
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit">
              {existingRecord ? 'Update' : 'Create'} Record
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};
