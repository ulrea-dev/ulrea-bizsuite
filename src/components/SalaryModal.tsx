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
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

interface SalaryModalProps {
  isOpen: boolean;
  onClose: () => void;
  teamMemberId?: string | null;
}

interface SalaryFormData {
  position: string;
  amount: string;
  currency: string;
  frequency: 'weekly' | 'bi-weekly' | 'monthly' | 'quarterly' | 'annually';
  startDate: string;
  endDate: string;
  description: string;
  contractDuration: string;
  isProjectBased: boolean;
  projectId: string;
  clientId: string;
}

export const SalaryModal: React.FC<SalaryModalProps> = ({
  isOpen,
  onClose,
  teamMemberId,
}) => {
  const { data, currentBusiness, dispatch } = useBusiness();
  const { toast } = useToast();
  
  const [selectedTeamMemberId, setSelectedTeamMemberId] = useState(teamMemberId || '');
  const [hasPrimarySalary, setHasPrimarySalary] = useState(false);
  const [hasSecondarySalary, setHasSecondarySalary] = useState(false);
  
  const [primarySalary, setPrimarySalary] = useState<SalaryFormData>({
    position: '',
    amount: '',
    currency: data.userSettings.defaultCurrency.code,
    frequency: 'monthly',
    startDate: new Date().toISOString().split('T')[0],
    endDate: '',
    description: '',
    contractDuration: '',
    isProjectBased: false,
    projectId: '',
    clientId: '',
  });

  const [secondarySalary, setSecondarySalary] = useState<SalaryFormData>({
    position: '',
    amount: '',
    currency: data.userSettings.defaultCurrency.code,
    frequency: 'monthly',
    startDate: new Date().toISOString().split('T')[0],
    endDate: '',
    description: '',
    contractDuration: '6',
    isProjectBased: false,
    projectId: '',
    clientId: '',
  });

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

  const currentBusinessTeamMembers = data.teamMembers.filter(
    member => !currentBusiness || member.id
  );

  // Load existing salary records for the selected team member
  useEffect(() => {
    if (selectedTeamMemberId) {
      const existingRecords = (data.salaryRecords || []).filter(
        record => record.teamMemberId === selectedTeamMemberId && 
        (!currentBusiness || record.businessId === currentBusiness.id)
      );

      const primaryRecord = existingRecords.find(r => (r as any).salaryType === 'primary' || !(r as any).salaryType);
      const secondaryRecord = existingRecords.find(r => (r as any).salaryType === 'secondary');

      if (primaryRecord) {
        setHasPrimarySalary(true);
        setPrimarySalary({
          position: primaryRecord.position,
          amount: primaryRecord.amount.toString(),
          currency: primaryRecord.currency,
          frequency: primaryRecord.frequency,
          startDate: primaryRecord.startDate.split('T')[0],
          endDate: primaryRecord.endDate ? primaryRecord.endDate.split('T')[0] : '',
          description: primaryRecord.description || '',
          contractDuration: '',
          isProjectBased: !!(primaryRecord as any).projectId,
          projectId: (primaryRecord as any).projectId || '',
          clientId: (primaryRecord as any).clientId || '',
        });
      } else {
        setHasPrimarySalary(false);
        setPrimarySalary({
          position: '',
          amount: '',
          currency: data.userSettings.defaultCurrency.code,
          frequency: 'monthly',
          startDate: new Date().toISOString().split('T')[0],
          endDate: '',
          description: '',
          contractDuration: '',
          isProjectBased: false,
          projectId: '',
          clientId: '',
        });
      }

      if (secondaryRecord) {
        setHasSecondarySalary(true);
        setSecondarySalary({
          position: secondaryRecord.position,
          amount: secondaryRecord.amount.toString(),
          currency: secondaryRecord.currency,
          frequency: secondaryRecord.frequency,
          startDate: secondaryRecord.startDate.split('T')[0],
          endDate: secondaryRecord.endDate ? secondaryRecord.endDate.split('T')[0] : '',
          description: secondaryRecord.description || '',
          contractDuration: (secondaryRecord as any).contractDuration?.toString() || '6',
          isProjectBased: !!(secondaryRecord as any).projectId,
          projectId: (secondaryRecord as any).projectId || '',
          clientId: (secondaryRecord as any).clientId || '',
        });
      } else {
        setHasSecondarySalary(false);
        setSecondarySalary({
          position: '',
          amount: '',
          currency: data.userSettings.defaultCurrency.code,
          frequency: 'monthly',
          startDate: new Date().toISOString().split('T')[0],
          endDate: '',
          description: '',
          contractDuration: '6',
          isProjectBased: false,
          projectId: '',
          clientId: '',
        });
      }
    }
  }, [selectedTeamMemberId, data.salaryRecords, data.userSettings.defaultCurrency.code, currentBusiness]);

  // Auto-calculate end date for secondary salary
  useEffect(() => {
    if (hasSecondarySalary && secondarySalary.contractDuration && secondarySalary.startDate) {
      const startDate = new Date(secondarySalary.startDate);
      const endDate = new Date(startDate);
      endDate.setMonth(endDate.getMonth() + parseInt(secondarySalary.contractDuration));
      setSecondarySalary(prev => ({
        ...prev,
        endDate: endDate.toISOString().split('T')[0]
      }));
    }
  }, [hasSecondarySalary, secondarySalary.contractDuration, secondarySalary.startDate]);

  // Calculate total salary in default currency
  const calculateTotalSalary = () => {
    let total = 0;

    if (hasPrimarySalary && primarySalary.amount) {
      const amount = parseFloat(primarySalary.amount);
      if (!isNaN(amount)) {
        const currency = allCurrencies.find(c => c.code === primarySalary.currency);
        if (currency) {
          const convertedAmount = convertCurrency(
            amount,
            currency,
            data.userSettings.defaultCurrency,
            data.exchangeRates || []
          );
          // Convert to monthly equivalent
          let monthlyAmount = convertedAmount;
          switch (primarySalary.frequency) {
            case 'weekly':
              monthlyAmount = convertedAmount * 4.33;
              break;
            case 'bi-weekly':
              monthlyAmount = convertedAmount * 2.17;
              break;
            case 'quarterly':
              monthlyAmount = convertedAmount / 3;
              break;
            case 'annually':
              monthlyAmount = convertedAmount / 12;
              break;
          }
          total += monthlyAmount;
        }
      }
    }

    if (hasSecondarySalary && secondarySalary.amount) {
      const amount = parseFloat(secondarySalary.amount);
      if (!isNaN(amount)) {
        const currency = allCurrencies.find(c => c.code === secondarySalary.currency);
        if (currency) {
          const convertedAmount = convertCurrency(
            amount,
            currency,
            data.userSettings.defaultCurrency,
            data.exchangeRates || []
          );
          // Convert to monthly equivalent
          let monthlyAmount = convertedAmount;
          switch (secondarySalary.frequency) {
            case 'weekly':
              monthlyAmount = convertedAmount * 4.33;
              break;
            case 'bi-weekly':
              monthlyAmount = convertedAmount * 2.17;
              break;
            case 'quarterly':
              monthlyAmount = convertedAmount / 3;
              break;
            case 'annually':
              monthlyAmount = convertedAmount / 12;
              break;
          }
          total += monthlyAmount;
        }
      }
    }

    return total;
  };

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

    if (!selectedTeamMemberId) {
      toast({
        title: "Error",
        description: "Please select a team member.",
        variant: "destructive",
      });
      return;
    }

    if (!hasPrimarySalary && !hasSecondarySalary) {
      toast({
        title: "Error",
        description: "Please enable at least one salary type.",
        variant: "destructive",
      });
      return;
    }

    // Validate primary salary
    if (hasPrimarySalary) {
      if (!primarySalary.position || !primarySalary.amount) {
        toast({
          title: "Error",
          description: "Please fill in all required primary salary fields.",
          variant: "destructive",
        });
        return;
      }

      const amount = parseFloat(primarySalary.amount);
      if (isNaN(amount) || amount <= 0) {
        toast({
          title: "Error",
          description: "Please enter a valid primary salary amount.",
          variant: "destructive",
        });
        return;
      }

      if (primarySalary.isProjectBased && !primarySalary.projectId) {
        toast({
          title: "Error",
          description: "Please select a project for project-based primary salary.",
          variant: "destructive",
        });
        return;
      }
    }

    // Validate secondary salary
    if (hasSecondarySalary) {
      if (!secondarySalary.position || !secondarySalary.amount || !secondarySalary.contractDuration) {
        toast({
          title: "Error",
          description: "Please fill in all required secondary salary fields.",
          variant: "destructive",
        });
        return;
      }

      const amount = parseFloat(secondarySalary.amount);
      if (isNaN(amount) || amount <= 0) {
        toast({
          title: "Error",
          description: "Please enter a valid secondary salary amount.",
          variant: "destructive",
        });
        return;
      }

      if (secondarySalary.isProjectBased && !secondarySalary.projectId) {
        toast({
          title: "Error",
          description: "Please select a project for project-based secondary salary.",
          variant: "destructive",
        });
        return;
      }
    }

    // Get existing records to update or create new ones
    const existingRecords = (data.salaryRecords || []).filter(
      record => record.teamMemberId === selectedTeamMemberId && 
      (!currentBusiness || record.businessId === currentBusiness.id)
    );

    const existingPrimary = existingRecords.find(r => (r as any).salaryType === 'primary' || !(r as any).salaryType);
    const existingSecondary = existingRecords.find(r => (r as any).salaryType === 'secondary');

    // Handle primary salary
    if (hasPrimarySalary) {
      const salaryRecord = {
        id: existingPrimary?.id || generateId(),
        businessId: currentBusiness.id,
        teamMemberId: selectedTeamMemberId,
        position: primarySalary.position,
        amount: parseFloat(primarySalary.amount),
        currency: primarySalary.currency,
        frequency: primarySalary.frequency,
        startDate: new Date(primarySalary.startDate).toISOString(),
        endDate: primarySalary.endDate ? new Date(primarySalary.endDate).toISOString() : undefined,
        description: primarySalary.description,
        projectId: primarySalary.isProjectBased ? primarySalary.projectId : undefined,
        clientId: primarySalary.isProjectBased ? primarySalary.clientId : undefined,
        isProjectBased: primarySalary.isProjectBased,
        salaryType: 'primary' as 'primary',
        createdAt: existingPrimary?.createdAt || new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      if (existingPrimary) {
        dispatch({
          type: 'UPDATE_SALARY_RECORD',
          payload: { id: existingPrimary.id, updates: salaryRecord },
        });
      } else {
        dispatch({
          type: 'ADD_SALARY_RECORD',
          payload: salaryRecord,
        });
      }
    } else if (existingPrimary) {
      // Remove primary salary if disabled
      dispatch({
        type: 'DELETE_SALARY_RECORD',
        payload: existingPrimary.id,
      });
    }

    // Handle secondary salary
    if (hasSecondarySalary) {
      const salaryRecord = {
        id: existingSecondary?.id || generateId(),
        businessId: currentBusiness.id,
        teamMemberId: selectedTeamMemberId,
        position: secondarySalary.position,
        amount: parseFloat(secondarySalary.amount),
        currency: secondarySalary.currency,
        frequency: secondarySalary.frequency,
        startDate: new Date(secondarySalary.startDate).toISOString(),
        endDate: secondarySalary.endDate ? new Date(secondarySalary.endDate).toISOString() : undefined,
        description: secondarySalary.description,
        projectId: secondarySalary.isProjectBased ? secondarySalary.projectId : undefined,
        clientId: secondarySalary.isProjectBased ? secondarySalary.clientId : undefined,
        isProjectBased: secondarySalary.isProjectBased,
        salaryType: 'secondary' as 'secondary',
        contractDuration: parseInt(secondarySalary.contractDuration),
        createdAt: existingSecondary?.createdAt || new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      if (existingSecondary) {
        dispatch({
          type: 'UPDATE_SALARY_RECORD',
          payload: { id: existingSecondary.id, updates: salaryRecord },
        });
      } else {
        dispatch({
          type: 'ADD_SALARY_RECORD',
          payload: salaryRecord,
        });
      }
    } else if (existingSecondary) {
      // Remove secondary salary if disabled
      dispatch({
        type: 'DELETE_SALARY_RECORD',
        payload: existingSecondary.id,
      });
    }

    toast({
      title: "Success",
      description: "Salary information updated successfully.",
    });

    onClose();
  };

  const totalSalary = calculateTotalSalary();

  const renderSalarySection = (
    title: string,
    description: string,
    isEnabled: boolean,
    onToggle: (enabled: boolean) => void,
    salaryData: SalaryFormData,
    setSalaryData: React.Dispatch<React.SetStateAction<SalaryFormData>>,
    isSecondary = false
  ) => {
    const convertedAmount = salaryData.amount && salaryData.currency !== data.userSettings.defaultCurrency.code
      ? (() => {
          const amount = parseFloat(salaryData.amount);
          if (!isNaN(amount)) {
            const currency = allCurrencies.find(c => c.code === salaryData.currency);
            if (currency) {
              return convertCurrency(
                amount,
                currency,
                data.userSettings.defaultCurrency,
                data.exchangeRates || []
              );
            }
          }
          return null;
        })()
      : null;

    const selectedProject = currentBusinessProjects.find(p => p.id === salaryData.projectId);

    return (
      <Card className="space-y-4">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>{title}</CardTitle>
              <CardDescription>{description}</CardDescription>
            </div>
            <Switch
              checked={isEnabled}
              onCheckedChange={onToggle}
            />
          </div>
        </CardHeader>
        
        {isEnabled && (
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor={`${isSecondary ? 'secondary' : 'primary'}-position`}>Position *</Label>
              <Input
                id={`${isSecondary ? 'secondary' : 'primary'}-position`}
                value={salaryData.position}
                onChange={(e) => setSalaryData({ ...salaryData, position: e.target.value })}
                placeholder="e.g., Senior Developer"
                required
              />
            </div>

            {isSecondary && (
              <div>
                <Label htmlFor="secondary-duration">Contract Duration (months) *</Label>
                <Input
                  id="secondary-duration"
                  type="number"
                  min="1"
                  max="60"
                  value={salaryData.contractDuration}
                  onChange={(e) => setSalaryData({ ...salaryData, contractDuration: e.target.value })}
                  placeholder="e.g., 6 for 6 months"
                  required
                />
              </div>
            )}

            <div className="flex items-center space-x-2">
              <Switch
                id={`${isSecondary ? 'secondary' : 'primary'}-project-based`}
                checked={salaryData.isProjectBased}
                onCheckedChange={(checked) => setSalaryData({ 
                  ...salaryData, 
                  isProjectBased: checked,
                  projectId: checked ? salaryData.projectId : '',
                  clientId: checked ? salaryData.clientId : '',
                })}
              />
              <Label htmlFor={`${isSecondary ? 'secondary' : 'primary'}-project-based`}>Project-based salary</Label>
            </div>

            {salaryData.isProjectBased && (
              <>
                <div>
                  <Label htmlFor={`${isSecondary ? 'secondary' : 'primary'}-project`}>Project *</Label>
                  <Select
                    value={salaryData.projectId}
                    onValueChange={(value) => {
                      const project = currentBusinessProjects.find(p => p.id === value);
                      setSalaryData({ 
                        ...salaryData, 
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
                    <Label htmlFor={`${isSecondary ? 'secondary' : 'primary'}-client`}>Client</Label>
                    <Select
                      value={salaryData.clientId}
                      onValueChange={(value) => setSalaryData({ ...salaryData, clientId: value })}
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
                <Label htmlFor={`${isSecondary ? 'secondary' : 'primary'}-amount`}>Amount *</Label>
                <CurrencyInput
                  id={`${isSecondary ? 'secondary' : 'primary'}-amount`}
                  value={salaryData.amount}
                  onChange={(value) => setSalaryData({ ...salaryData, amount: value })}
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
                <Label htmlFor={`${isSecondary ? 'secondary' : 'primary'}-currency`}>Currency</Label>
                <Select
                  value={salaryData.currency}
                  onValueChange={(value) => setSalaryData({ ...salaryData, currency: value })}
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
                <Label htmlFor={`${isSecondary ? 'secondary' : 'primary'}-frequency`}>Frequency</Label>
                <Select
                  value={salaryData.frequency}
                  onValueChange={(value: any) => setSalaryData({ ...salaryData, frequency: value })}
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
                <Label htmlFor={`${isSecondary ? 'secondary' : 'primary'}-startDate`}>Start Date</Label>
                <Input
                  id={`${isSecondary ? 'secondary' : 'primary'}-startDate`}
                  type="date"
                  value={salaryData.startDate}
                  onChange={(e) => setSalaryData({ ...salaryData, startDate: e.target.value })}
                />
              </div>
            </div>

            {isSecondary && (
              <div>
                <Label htmlFor="secondary-endDate">Contract End Date</Label>
                <Input
                  id="secondary-endDate"
                  type="date"
                  value={salaryData.endDate}
                  onChange={(e) => setSalaryData({ ...salaryData, endDate: e.target.value })}
                  readOnly
                  className="bg-muted"
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Auto-calculated based on contract duration
                </p>
              </div>
            )}

            <div>
              <Label htmlFor={`${isSecondary ? 'secondary' : 'primary'}-description`}>Description</Label>
              <Textarea
                id={`${isSecondary ? 'secondary' : 'primary'}-description`}
                value={salaryData.description}
                onChange={(e) => setSalaryData({ ...salaryData, description: e.target.value })}
                placeholder={isSecondary 
                  ? "Details about the contract work, specific project, or additional responsibilities"
                  : "Additional notes about this salary record (optional)"
                }
                rows={3}
              />
            </div>
          </CardContent>
        )}
      </Card>
    );
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Manage Team Member Salary</DialogTitle>
          <DialogDescription>
            Configure primary and secondary salaries for a team member. You can enable both types or just one.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <Label htmlFor="teamMember">Team Member *</Label>
            <Select
              value={selectedTeamMemberId}
              onValueChange={setSelectedTeamMemberId}
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

          {(hasPrimarySalary || hasSecondarySalary) && (
            <Card className="bg-primary/5 border-primary/20">
              <CardHeader>
                <CardTitle className="text-lg">Total Monthly Salary</CardTitle>
                <CardDescription>Combined primary and secondary salaries (converted to {data.userSettings.defaultCurrency.name})</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-primary">
                  {data.userSettings.defaultCurrency.symbol}{totalSalary.toLocaleString(undefined, { 
                    minimumFractionDigits: 2, 
                    maximumFractionDigits: 2 
                  })}
                </div>
                <div className="text-sm text-muted-foreground mt-1">
                  per month (all frequencies converted to monthly equivalent)
                </div>
              </CardContent>
            </Card>
          )}

          {renderSalarySection(
            "Primary Salary",
            "Regular ongoing salary for this team member",
            hasPrimarySalary,
            setHasPrimarySalary,
            primarySalary,
            setPrimarySalary
          )}

          {renderSalarySection(
            "Secondary/Contract Salary",
            "Additional contract-based salary with fixed duration",
            hasSecondarySalary,
            setHasSecondarySalary,
            secondarySalary,
            setSecondarySalary,
            true
          )}

          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit">
              Save Salary Information
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};