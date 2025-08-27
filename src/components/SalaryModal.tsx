
import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useBusiness } from '@/contexts/BusinessContext';
import { generateId, formatCurrency } from '@/utils/storage';
import { convertCurrency } from '@/utils/currencyConversion';
import { useToast } from '@/hooks/use-toast';
import { SUPPORTED_CURRENCIES, SalaryRecord } from '@/types/business';

interface SalaryModalProps {
  isOpen: boolean;
  onClose: () => void;
  teamMemberId?: string | null;
}

export const SalaryModal: React.FC<SalaryModalProps> = ({
  isOpen,
  onClose,
  teamMemberId,
}) => {
  const { data, currentBusiness, dispatch } = useBusiness();
  const { toast } = useToast();

  // Form states
  const [selectedTeamMemberId, setSelectedTeamMemberId] = useState('');
  const [primaryEnabled, setPrimaryEnabled] = useState(false);
  const [secondaryEnabled, setSecondaryEnabled] = useState(false);

  // Primary salary form
  const [primaryPosition, setPrimaryPosition] = useState('');
  const [primaryAmount, setPrimaryAmount] = useState('');
  const [primaryCurrency, setPrimaryCurrency] = useState('');
  const [primaryFrequency, setPrimaryFrequency] = useState('');
  const [primaryStartDate, setPrimaryStartDate] = useState('');
  const [primaryProjectId, setPrimaryProjectId] = useState('');

  // Secondary salary form
  const [secondaryPosition, setSecondaryPosition] = useState('');
  const [secondaryAmount, setSecondaryAmount] = useState('');
  const [secondaryCurrency, setSecondaryCurrency] = useState('');
  const [secondaryFrequency, setSecondaryFrequency] = useState('');
  const [secondaryStartDate, setSecondaryStartDate] = useState('');
  const [secondaryProjectId, setSecondaryProjectId] = useState('');
  const [contractDuration, setContractDuration] = useState('');

  // Get available data - filter team members by current business through salary records
  const businessSalaryRecords = data.salaryRecords.filter(record => record.businessId === currentBusiness?.id);
  const businessTeamMemberIds = [...new Set(businessSalaryRecords.map(record => record.teamMemberId))];
  const businessTeamMembers = data.teamMembers.filter(member => 
    businessTeamMemberIds.includes(member.id) || !businessTeamMemberIds.length
  );
  
  const businessProjects = data.projects.filter(project => project.businessId === currentBusiness?.id);
  const allCurrencies = [...SUPPORTED_CURRENCIES, ...(data.customCurrencies || [])];

  // Load existing salary data when editing
  useEffect(() => {
    if (isOpen && teamMemberId && currentBusiness) {
      // Find existing salary records for this team member
      const memberSalaryRecords = businessSalaryRecords.filter(record => record.teamMemberId === teamMemberId);
      const primaryRecord = memberSalaryRecords.find(r => (r as any).salaryType === 'primary' || !(r as any).salaryType);
      const secondaryRecord = memberSalaryRecords.find(r => (r as any).salaryType === 'secondary');

      setSelectedTeamMemberId(teamMemberId);

      // Load primary salary data
      if (primaryRecord) {
        setPrimaryEnabled(true);
        setPrimaryPosition(primaryRecord.position);
        setPrimaryAmount(primaryRecord.amount.toString());
        setPrimaryCurrency(primaryRecord.currency);
        setPrimaryFrequency(primaryRecord.frequency);
        setPrimaryStartDate(primaryRecord.startDate);
        setPrimaryProjectId(primaryRecord.projectId || 'no-project');
      } else {
        setPrimaryEnabled(false);
        // Reset primary form
        setPrimaryPosition('');
        setPrimaryAmount('');
        setPrimaryCurrency(currentBusiness.currency.code);
        setPrimaryFrequency('monthly');
        setPrimaryStartDate('');
        setPrimaryProjectId('no-project');
      }

      // Load secondary salary data
      if (secondaryRecord) {
        setSecondaryEnabled(true);
        setSecondaryPosition(secondaryRecord.position);
        setSecondaryAmount(secondaryRecord.amount.toString());
        setSecondaryCurrency(secondaryRecord.currency);
        setSecondaryFrequency(secondaryRecord.frequency);
        setSecondaryStartDate(secondaryRecord.startDate);
        setSecondaryProjectId(secondaryRecord.projectId || 'no-project');
        setContractDuration((secondaryRecord as any).contractDuration?.toString() || '');
      } else {
        setSecondaryEnabled(false);
        // Reset secondary form
        setSecondaryPosition('');
        setSecondaryAmount('');
        setSecondaryCurrency(currentBusiness.currency.code);
        setSecondaryFrequency('monthly');
        setSecondaryStartDate('');
        setSecondaryProjectId('no-project');
        setContractDuration('');
      }
    } else if (isOpen && !teamMemberId) {
      // Reset all form data for new salary
      setSelectedTeamMemberId('');
      setPrimaryEnabled(false);
      setSecondaryEnabled(false);
      
      // Reset primary form
      setPrimaryPosition('');
      setPrimaryAmount('');
      setPrimaryCurrency(currentBusiness?.currency.code || 'USD');
      setPrimaryFrequency('monthly');
      setPrimaryStartDate('');
      setPrimaryProjectId('no-project');
      
      // Reset secondary form
      setSecondaryPosition('');
      setSecondaryAmount('');
      setSecondaryCurrency(currentBusiness?.currency.code || 'USD');
      setSecondaryFrequency('monthly');
      setSecondaryStartDate('');
      setSecondaryProjectId('no-project');
      setContractDuration('');
    }
  }, [isOpen, teamMemberId, currentBusiness, businessSalaryRecords]);

  // Calculate total salary in default currency
  const calculateTotal = () => {
    let total = 0;

    if (primaryEnabled && primaryAmount) {
      const primaryCurr = allCurrencies.find(c => c.code === primaryCurrency) || data.userSettings.defaultCurrency;
      let monthlyAmount = parseFloat(primaryAmount);
      
      // Convert to monthly equivalent
      switch (primaryFrequency) {
        case 'weekly':
          monthlyAmount = monthlyAmount * 4.33;
          break;
        case 'bi-weekly':
          monthlyAmount = monthlyAmount * 2.17;
          break;
        case 'quarterly':
          monthlyAmount = monthlyAmount / 3;
          break;
        case 'annually':
          monthlyAmount = monthlyAmount / 12;
          break;
      }

      const converted = convertCurrency(monthlyAmount, primaryCurr, data.userSettings.defaultCurrency, data.exchangeRates || []);
      total += converted;
    }

    if (secondaryEnabled && secondaryAmount) {
      const secondaryCurr = allCurrencies.find(c => c.code === secondaryCurrency) || data.userSettings.defaultCurrency;
      let monthlyAmount = parseFloat(secondaryAmount);
      
      // Convert to monthly equivalent
      switch (secondaryFrequency) {
        case 'weekly':
          monthlyAmount = monthlyAmount * 4.33;
          break;
        case 'bi-weekly':
          monthlyAmount = monthlyAmount * 2.17;
          break;
        case 'quarterly':
          monthlyAmount = monthlyAmount / 3;
          break;
        case 'annually':
          monthlyAmount = monthlyAmount / 12;
          break;
      }

      const converted = convertCurrency(monthlyAmount, secondaryCurr, data.userSettings.defaultCurrency, data.exchangeRates || []);
      total += converted;
    }

    return total;
  };

  const handleSave = () => {
    if (!currentBusiness || !selectedTeamMemberId) {
      toast({
        title: "Error",
        description: "Please select a team member",
        variant: "destructive",
      });
      return;
    }

    if (!primaryEnabled && !secondaryEnabled) {
      toast({
        title: "Error", 
        description: "Please enable at least one salary type",
        variant: "destructive",
      });
      return;
    }

    try {
      const now = new Date().toISOString();

      // Find existing records to update or delete
      const existingRecords = businessSalaryRecords.filter(record => record.teamMemberId === selectedTeamMemberId);
      const existingPrimary = existingRecords.find(r => (r as any).salaryType === 'primary' || !(r as any).salaryType);
      const existingSecondary = existingRecords.find(r => (r as any).salaryType === 'secondary');

      // Handle primary salary
      if (primaryEnabled) {
        if (!primaryPosition || !primaryAmount || !primaryStartDate) {
          toast({
            title: "Error",
            description: "Please fill in all required primary salary fields",
            variant: "destructive",
          });
          return;
        }

        const primarySalary: SalaryRecord = {
          id: existingPrimary?.id || generateId(),
          businessId: currentBusiness.id,
          teamMemberId: selectedTeamMemberId,
          position: primaryPosition,
          amount: parseFloat(primaryAmount),
          currency: primaryCurrency,
          frequency: primaryFrequency as any,
          startDate: primaryStartDate,
          projectId: primaryProjectId === 'no-project' ? undefined : primaryProjectId,
          createdAt: existingPrimary?.createdAt || now,
          updatedAt: now,
          salaryType: 'primary' as any,
        };

        if (existingPrimary) {
          dispatch({ type: 'UPDATE_SALARY_RECORD', payload: { id: existingPrimary.id, updates: primarySalary } });
        } else {
          dispatch({ type: 'ADD_SALARY_RECORD', payload: primarySalary });
        }
      } else if (existingPrimary) {
        // Delete existing primary if disabled
        dispatch({ type: 'DELETE_SALARY_RECORD', payload: existingPrimary.id });
      }

      // Handle secondary salary
      if (secondaryEnabled) {
        if (!secondaryPosition || !secondaryAmount || !secondaryStartDate) {
          toast({
            title: "Error",
            description: "Please fill in all required secondary salary fields",
            variant: "destructive",
          });
          return;
        }

        const secondarySalary: SalaryRecord = {
          id: existingSecondary?.id || generateId(),
          businessId: currentBusiness.id,
          teamMemberId: selectedTeamMemberId,
          position: secondaryPosition,
          amount: parseFloat(secondaryAmount),
          currency: secondaryCurrency,
          frequency: secondaryFrequency as any,
          startDate: secondaryStartDate,
          projectId: secondaryProjectId === 'no-project' ? undefined : secondaryProjectId,
          createdAt: existingSecondary?.createdAt || now,
          updatedAt: now,
          salaryType: 'secondary' as any,
          contractDuration: contractDuration ? parseInt(contractDuration) : undefined,
        } as any;

        if (existingSecondary) {
          dispatch({ type: 'UPDATE_SALARY_RECORD', payload: { id: existingSecondary.id, updates: secondarySalary } });
        } else {
          dispatch({ type: 'ADD_SALARY_RECORD', payload: secondarySalary });
        }
      } else if (existingSecondary) {
        // Delete existing secondary if disabled
        dispatch({ type: 'DELETE_SALARY_RECORD', payload: existingSecondary.id });
      }

      toast({
        title: "Success",
        description: "Salary information saved successfully",
      });

      onClose();
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to save salary information",
        variant: "destructive",
      });
    }
  };

  const selectedMemberName = businessTeamMembers.find(m => m.id === selectedTeamMemberId)?.name || '';

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Manage Team Member Salary</DialogTitle>
          <p className="text-sm text-muted-foreground">
            Configure primary and secondary salaries for a team member. You can enable both types or just one.
          </p>
        </DialogHeader>

        <div className="space-y-6">
          {/* Team Member Selection */}
          <div className="space-y-2">
            <Label htmlFor="teamMember">Team Member *</Label>
            <Select
              value={selectedTeamMemberId}
              onValueChange={setSelectedTeamMemberId}
              disabled={!!teamMemberId} // Disable if editing existing
            >
              <SelectTrigger>
                <SelectValue placeholder="Select team member" />
              </SelectTrigger>
              <SelectContent>
                {businessTeamMembers.map((member) => (
                  <SelectItem key={member.id} value={member.id}>
                    {member.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Total Salary Display */}
          {(primaryEnabled || secondaryEnabled) && (
            <Card className="bg-muted/50">
              <CardContent className="pt-6">
                <div className="text-center">
                  <div className="text-sm text-muted-foreground">Total Monthly Salary</div>
                  <div className="text-2xl font-bold">
                    {formatCurrency(calculateTotal(), data.userSettings.defaultCurrency)}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    Combined primary + secondary (monthly equivalent)
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Primary Salary Section */}
          <Card className={primaryEnabled ? 'border-primary' : ''}>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    Primary Salary
                    {primaryEnabled && <Badge variant="default">Enabled</Badge>}
                  </CardTitle>
                  <p className="text-sm text-muted-foreground">
                    Regular ongoing salary for this team member
                  </p>
                </div>
                <Switch
                  checked={primaryEnabled}
                  onCheckedChange={setPrimaryEnabled}
                />
              </div>
            </CardHeader>
            {primaryEnabled && (
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="primaryPosition">Position *</Label>
                    <Input
                      id="primaryPosition"
                      value={primaryPosition}
                      onChange={(e) => setPrimaryPosition(e.target.value)}
                      placeholder="e.g., Senior Developer"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="primaryProject">Project</Label>
                    <Select value={primaryProjectId} onValueChange={setPrimaryProjectId}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select project (optional)" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="no-project">No specific project</SelectItem>
                        {businessProjects.map((project) => (
                          <SelectItem key={project.id} value={project.id}>
                            {project.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="primaryAmount">Amount *</Label>
                    <Input
                      id="primaryAmount"
                      type="number"
                      value={primaryAmount}
                      onChange={(e) => setPrimaryAmount(e.target.value)}
                      placeholder="50000"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="primaryCurrency">Currency</Label>
                    <Select value={primaryCurrency} onValueChange={setPrimaryCurrency}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {allCurrencies.map((currency) => (
                          <SelectItem key={currency.code} value={currency.code}>
                            {currency.name} ({currency.symbol})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="primaryFrequency">Frequency</Label>
                    <Select value={primaryFrequency} onValueChange={setPrimaryFrequency}>
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

                <div className="space-y-2">
                  <Label htmlFor="primaryStartDate">Start Date *</Label>
                  <Input
                    id="primaryStartDate"
                    type="date"
                    value={primaryStartDate}
                    onChange={(e) => setPrimaryStartDate(e.target.value)}
                  />
                </div>
              </CardContent>
            )}
          </Card>

          {/* Secondary Salary Section */}
          <Card className={secondaryEnabled ? 'border-primary' : ''}>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    Secondary/Contract Salary
                    {secondaryEnabled && <Badge variant="secondary">Enabled</Badge>}
                  </CardTitle>
                  <p className="text-sm text-muted-foreground">
                    Additional contract-based salary with fixed duration
                  </p>
                </div>
                <Switch
                  checked={secondaryEnabled}
                  onCheckedChange={setSecondaryEnabled}
                />
              </div>
            </CardHeader>
            {secondaryEnabled && (
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="secondaryPosition">Position *</Label>
                    <Input
                      id="secondaryPosition"
                      value={secondaryPosition}
                      onChange={(e) => setSecondaryPosition(e.target.value)}
                      placeholder="e.g., Technical Lead"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="secondaryProject">Project</Label>
                    <Select value={secondaryProjectId} onValueChange={setSecondaryProjectId}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select project (optional)" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="no-project">No specific project</SelectItem>
                        {businessProjects.map((project) => (
                          <SelectItem key={project.id} value={project.id}>
                            {project.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="grid grid-cols-4 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="secondaryAmount">Amount *</Label>
                    <Input
                      id="secondaryAmount"
                      type="number"
                      value={secondaryAmount}
                      onChange={(e) => setSecondaryAmount(e.target.value)}
                      placeholder="30000"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="secondaryCurrency">Currency</Label>
                    <Select value={secondaryCurrency} onValueChange={setSecondaryCurrency}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {allCurrencies.map((currency) => (
                          <SelectItem key={currency.code} value={currency.code}>
                            {currency.name} ({currency.symbol})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="secondaryFrequency">Frequency</Label>
                    <Select value={secondaryFrequency} onValueChange={setSecondaryFrequency}>
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
                  <div className="space-y-2">
                    <Label htmlFor="contractDuration">Duration (months)</Label>
                    <Input
                      id="contractDuration"
                      type="number"
                      value={contractDuration}
                      onChange={(e) => setContractDuration(e.target.value)}
                      placeholder="12"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="secondaryStartDate">Start Date *</Label>
                  <Input
                    id="secondaryStartDate"
                    type="date"
                    value={secondaryStartDate}
                    onChange={(e) => setSecondaryStartDate(e.target.value)}
                  />
                </div>
              </CardContent>
            )}
          </Card>
        </div>

        <div className="flex justify-end space-x-2 pt-4">
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={handleSave}>
            Save Salary Information
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
