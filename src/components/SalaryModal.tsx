import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { CurrencyInput } from '@/components/ui/currency-input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { useBusiness } from '@/contexts/BusinessContext';
import { generateId, formatCurrency } from '@/utils/storage';
import { convertCurrency } from '@/utils/currencyConversion';
import { useToast } from '@/hooks/use-toast';
import { SUPPORTED_CURRENCIES, SalaryRecord } from '@/types/business';
import { CalendarIcon, Plus, Trash2, ChevronDown, ChevronRight } from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';

interface SalaryModalProps {
  isOpen: boolean;
  onClose: () => void;
  teamMemberId?: string | null;
}

interface SecondarySalaryForm {
  id?: string; // Existing record ID for updates
  position: string;
  amount: string;
  currency: string;
  frequency: string;
  startDate: Date | undefined;
  projectId: string;
  contractDuration: string;
  isExpanded: boolean;
}

const createEmptySecondarySalary = (defaultCurrency: string): SecondarySalaryForm => ({
  position: '',
  amount: '',
  currency: defaultCurrency,
  frequency: 'monthly',
  startDate: undefined,
  projectId: 'no-project',
  contractDuration: '',
  isExpanded: true,
});

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

  // Primary salary form
  const [primaryPosition, setPrimaryPosition] = useState('');
  const [primaryAmount, setPrimaryAmount] = useState('');
  const [primaryCurrency, setPrimaryCurrency] = useState('');
  const [primaryFrequency, setPrimaryFrequency] = useState('');
  const [primaryStartDate, setPrimaryStartDate] = useState<Date | undefined>();
  const [primaryProjectId, setPrimaryProjectId] = useState('');

  // Multiple secondary salaries
  const [secondarySalaries, setSecondarySalaries] = useState<SecondarySalaryForm[]>([]);

  // Get available data - prevent duplicate team members
  const businessSalaryRecords = data.salaryRecords.filter(record => record.businessId === currentBusiness?.id);
  
  // Filter out team members who already have salary records, unless we're editing an existing one
  const existingTeamMemberIds = businessSalaryRecords.map(record => record.teamMemberId);
  const businessTeamMembers = data.teamMembers.filter(member => 
    !existingTeamMemberIds.includes(member.id) || (teamMemberId && member.id === teamMemberId)
  );
  
  const businessProjects = data.projects.filter(project => project.businessId === currentBusiness?.id);
  const allCurrencies = [...SUPPORTED_CURRENCIES, ...(data.customCurrencies || [])];

  // Load existing salary data when editing
  useEffect(() => {
    if (!isOpen || !currentBusiness) return;

    if (teamMemberId) {
      // Find existing salary records for this team member
      const memberSalaryRecords = businessSalaryRecords.filter(record => record.teamMemberId === teamMemberId);
      const primaryRecord = memberSalaryRecords.find(r => (r as any).salaryType === 'primary' || !(r as any).salaryType);
      const secondaryRecords = memberSalaryRecords.filter(r => (r as any).salaryType === 'secondary');

      setSelectedTeamMemberId(teamMemberId);

      // Load primary salary data
      if (primaryRecord) {
        setPrimaryEnabled(true);
        setPrimaryPosition(primaryRecord.position);
        setPrimaryAmount(primaryRecord.amount.toString());
        setPrimaryCurrency(primaryRecord.currency);
        setPrimaryFrequency(primaryRecord.frequency);
        setPrimaryStartDate(new Date(primaryRecord.startDate));
        setPrimaryProjectId(primaryRecord.projectId || 'no-project');
      } else {
        setPrimaryEnabled(false);
        setPrimaryPosition('');
        setPrimaryAmount('');
        setPrimaryCurrency(currentBusiness.currency.code);
        setPrimaryFrequency('monthly');
        setPrimaryStartDate(undefined);
        setPrimaryProjectId('no-project');
      }

      // Load all secondary salary records
      if (secondaryRecords.length > 0) {
        setSecondarySalaries(secondaryRecords.map((record, index) => ({
          id: record.id,
          position: record.position,
          amount: record.amount.toString(),
          currency: record.currency,
          frequency: record.frequency,
          startDate: new Date(record.startDate),
          projectId: record.projectId || 'no-project',
          contractDuration: (record as any).contractDuration?.toString() || '',
          isExpanded: index === 0, // Only first one expanded by default
        })));
      } else {
        setSecondarySalaries([]);
      }
    } else {
      // Reset all form data for new salary
      setSelectedTeamMemberId('');
      setPrimaryEnabled(false);
      
      // Reset primary form
      setPrimaryPosition('');
      setPrimaryAmount('');
      setPrimaryCurrency(currentBusiness?.currency.code || 'USD');
      setPrimaryFrequency('monthly');
      setPrimaryStartDate(undefined);
      setPrimaryProjectId('no-project');
      
      // Reset secondary salaries
      setSecondarySalaries([]);
    }
  }, [isOpen, teamMemberId, currentBusiness?.id]);

  // Helper function to calculate individual converted amounts
  const calculateConvertedAmount = (amount: string, currency: string, frequency: string) => {
    if (!amount || !currency) return null;
    
    const sourceCurrency = allCurrencies.find(c => c.code === currency) || data.userSettings.defaultCurrency;
    const defaultCurrency = data.userSettings.defaultCurrency;
    
    // Don't show conversion if same currency
    if (sourceCurrency.code === defaultCurrency.code) return null;
    
    let monthlyAmount = parseFloat(amount);
    
    // Convert to monthly equivalent
    switch (frequency) {
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

    const converted = convertCurrency(monthlyAmount, sourceCurrency, defaultCurrency, data.exchangeRates || []);
    return {
      amount: converted,
      currency: defaultCurrency,
      isMonthlyEquivalent: frequency !== 'monthly'
    };
  };

  // Convert amount to monthly in default currency
  const convertToMonthly = (amount: string, currency: string, frequency: string) => {
    if (!amount) return 0;
    
    const curr = allCurrencies.find(c => c.code === currency) || data.userSettings.defaultCurrency;
    let monthlyAmount = parseFloat(amount);
    
    switch (frequency) {
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

    return convertCurrency(monthlyAmount, curr, data.userSettings.defaultCurrency, data.exchangeRates || []);
  };

  // Calculate total salary in default currency
  const calculateTotal = () => {
    let total = 0;

    if (primaryEnabled && primaryAmount) {
      total += convertToMonthly(primaryAmount, primaryCurrency, primaryFrequency);
    }

    secondarySalaries.forEach(secondary => {
      if (secondary.amount) {
        total += convertToMonthly(secondary.amount, secondary.currency, secondary.frequency);
      }
    });

    return total;
  };

  // Add new secondary salary
  const handleAddSecondarySalary = () => {
    setSecondarySalaries(prev => [
      ...prev.map(s => ({ ...s, isExpanded: false })), // Collapse others
      createEmptySecondarySalary(currentBusiness?.currency.code || 'USD')
    ]);
  };

  // Remove secondary salary
  const handleRemoveSecondarySalary = (index: number) => {
    setSecondarySalaries(prev => prev.filter((_, i) => i !== index));
  };

  // Update secondary salary field
  const updateSecondarySalary = (index: number, updates: Partial<SecondarySalaryForm>) => {
    setSecondarySalaries(prev => prev.map((s, i) => i === index ? { ...s, ...updates } : s));
  };

  // Toggle secondary salary expansion
  const toggleSecondarySalaryExpansion = (index: number) => {
    setSecondarySalaries(prev => prev.map((s, i) => ({ ...s, isExpanded: i === index ? !s.isExpanded : false })));
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

    // Check if at least one salary is configured
    const hasValidSecondary = secondarySalaries.some(s => s.position && s.amount && s.startDate);
    if (!primaryEnabled && !hasValidSecondary) {
      toast({
        title: "Error", 
        description: "Please configure at least one salary",
        variant: "destructive",
      });
      return;
    }

    try {
      const now = new Date().toISOString();

      // Find existing records to update or delete
      const existingRecords = businessSalaryRecords.filter(record => record.teamMemberId === selectedTeamMemberId);
      const existingPrimary = existingRecords.find(r => (r as any).salaryType === 'primary' || !(r as any).salaryType);
      const existingSecondaries = existingRecords.filter(r => (r as any).salaryType === 'secondary');
      const existingSecondaryIds = new Set(existingSecondaries.map(r => r.id));

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
          startDate: primaryStartDate.toISOString().split('T')[0],
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

      // Handle secondary salaries
      const processedSecondaryIds = new Set<string>();
      
      for (const secondary of secondarySalaries) {
        // Skip incomplete entries
        if (!secondary.position || !secondary.amount || !secondary.startDate) {
          continue;
        }

        const secondarySalary: SalaryRecord = {
          id: secondary.id || generateId(),
          businessId: currentBusiness.id,
          teamMemberId: selectedTeamMemberId,
          position: secondary.position,
          amount: parseFloat(secondary.amount),
          currency: secondary.currency,
          frequency: secondary.frequency as any,
          startDate: secondary.startDate.toISOString().split('T')[0],
          projectId: secondary.projectId === 'no-project' ? undefined : secondary.projectId,
          createdAt: secondary.id ? existingSecondaries.find(r => r.id === secondary.id)?.createdAt || now : now,
          updatedAt: now,
          salaryType: 'secondary' as any,
          contractDuration: secondary.contractDuration ? parseInt(secondary.contractDuration) : undefined,
        } as any;

        if (secondary.id && existingSecondaryIds.has(secondary.id)) {
          dispatch({ type: 'UPDATE_SALARY_RECORD', payload: { id: secondary.id, updates: secondarySalary } });
          processedSecondaryIds.add(secondary.id);
        } else {
          dispatch({ type: 'ADD_SALARY_RECORD', payload: secondarySalary });
          if (secondary.id) processedSecondaryIds.add(secondary.id);
        }
      }

      // Delete removed secondary salaries
      for (const existingId of existingSecondaryIds) {
        if (!processedSecondaryIds.has(existingId)) {
          dispatch({ type: 'DELETE_SALARY_RECORD', payload: existingId });
        }
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
  const activeSecondaryCount = secondarySalaries.filter(s => s.position && s.amount).length;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Manage Team Member Salary</DialogTitle>
          <p className="text-sm text-muted-foreground">
            Configure primary and multiple secondary salaries for a team member. Track salary increases or project-based compensation.
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
          {(primaryEnabled || activeSecondaryCount > 0) && (
            <Card className="bg-muted/50">
              <CardContent className="pt-6">
                <div className="text-center">
                  <div className="text-sm text-muted-foreground">Total Monthly Salary</div>
                  <div className="text-2xl font-bold">
                    {formatCurrency(calculateTotal(), data.userSettings.defaultCurrency)}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {primaryEnabled && activeSecondaryCount > 0 
                      ? `Primary + ${activeSecondaryCount} secondary (monthly equivalent)`
                      : primaryEnabled 
                        ? 'Primary salary (monthly equivalent)'
                        : `${activeSecondaryCount} secondary (monthly equivalent)`
                    }
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
                    <CurrencyInput
                      id="primaryAmount"
                      value={primaryAmount}
                      onChange={setPrimaryAmount}
                      placeholder="50000"
                      allowDecimals={true}
                      maxDecimals={2}
                    />
                    {/* Currency conversion display */}
                    {(() => {
                      const conversion = calculateConvertedAmount(primaryAmount, primaryCurrency, primaryFrequency);
                      if (conversion) {
                        return (
                          <div className="text-xs text-muted-foreground mt-1 p-2 bg-muted/50 rounded">
                            = {formatCurrency(conversion.amount, conversion.currency)}
                            {conversion.isMonthlyEquivalent && ' (monthly equivalent)'}
                          </div>
                        );
                      }
                      return null;
                    })()}
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
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className={cn(
                          "w-full justify-start text-left font-normal",
                          !primaryStartDate && "text-muted-foreground"
                        )}
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {primaryStartDate ? format(primaryStartDate, "MMM dd, yyyy") : "Pick a date"}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={primaryStartDate}
                        onSelect={setPrimaryStartDate}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                </div>
              </CardContent>
            )}
          </Card>

          {/* Secondary Salaries Section */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    Secondary/Contract Salaries
                    {activeSecondaryCount > 0 && (
                      <Badge variant="secondary">{activeSecondaryCount} active</Badge>
                    )}
                  </CardTitle>
                  <p className="text-sm text-muted-foreground">
                    Additional project-based or contract salaries. Track salary increases or bonuses.
                  </p>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleAddSecondarySalary}
                >
                  <Plus className="mr-2 h-4 w-4" />
                  Add New
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              {secondarySalaries.length === 0 ? (
                <div className="text-center py-6 text-muted-foreground border border-dashed rounded-lg">
                  <p>No secondary salaries configured</p>
                  <p className="text-sm">Click "Add New" to add a secondary salary</p>
                </div>
              ) : (
                secondarySalaries.map((secondary, index) => (
                  <Collapsible
                    key={index}
                    open={secondary.isExpanded}
                    onOpenChange={() => toggleSecondarySalaryExpansion(index)}
                  >
                    <Card className={secondary.isExpanded ? 'border-primary/50' : ''}>
                      <CollapsibleTrigger asChild>
                        <CardHeader className="cursor-pointer hover:bg-muted/50 transition-colors py-3">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              {secondary.isExpanded ? (
                                <ChevronDown className="h-4 w-4" />
                              ) : (
                                <ChevronRight className="h-4 w-4" />
                              )}
                              <div>
                                <span className="font-medium">
                                  {secondary.position || `Secondary Salary ${index + 1}`}
                                </span>
                                {secondary.amount && (
                                  <span className="text-muted-foreground ml-2">
                                    • {formatCurrency(parseFloat(secondary.amount), allCurrencies.find(c => c.code === secondary.currency) || data.userSettings.defaultCurrency)}
                                    /{secondary.frequency}
                                  </span>
                                )}
                                {secondary.projectId && secondary.projectId !== 'no-project' && (
                                  <span className="text-muted-foreground ml-2">
                                    • {businessProjects.find(p => p.id === secondary.projectId)?.name}
                                  </span>
                                )}
                              </div>
                            </div>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleRemoveSecondarySalary(index);
                              }}
                              className="text-destructive hover:text-destructive"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </CardHeader>
                      </CollapsibleTrigger>
                      <CollapsibleContent>
                        <CardContent className="space-y-4 pt-0">
                          <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                              <Label>Position *</Label>
                              <Input
                                value={secondary.position}
                                onChange={(e) => updateSecondarySalary(index, { position: e.target.value })}
                                placeholder="e.g., Technical Lead"
                              />
                            </div>
                            <div className="space-y-2">
                              <Label>Project</Label>
                              <Select 
                                value={secondary.projectId} 
                                onValueChange={(value) => updateSecondarySalary(index, { projectId: value })}
                              >
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
                              <Label>Amount *</Label>
                              <CurrencyInput
                                value={secondary.amount}
                                onChange={(value) => updateSecondarySalary(index, { amount: value })}
                                placeholder="30000"
                                allowDecimals={true}
                                maxDecimals={2}
                              />
                              {/* Currency conversion display */}
                              {(() => {
                                const conversion = calculateConvertedAmount(secondary.amount, secondary.currency, secondary.frequency);
                                if (conversion) {
                                  return (
                                    <div className="text-xs text-muted-foreground mt-1 p-2 bg-muted/50 rounded">
                                      = {formatCurrency(conversion.amount, conversion.currency)}
                                      {conversion.isMonthlyEquivalent && ' (monthly)'}
                                    </div>
                                  );
                                }
                                return null;
                              })()}
                            </div>
                            <div className="space-y-2">
                              <Label>Currency</Label>
                              <Select 
                                value={secondary.currency} 
                                onValueChange={(value) => updateSecondarySalary(index, { currency: value })}
                              >
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
                              <Label>Frequency</Label>
                              <Select 
                                value={secondary.frequency} 
                                onValueChange={(value) => updateSecondarySalary(index, { frequency: value })}
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
                            <div className="space-y-2">
                              <Label>Duration (months)</Label>
                              <Input
                                type="number"
                                value={secondary.contractDuration}
                                onChange={(e) => updateSecondarySalary(index, { contractDuration: e.target.value })}
                                placeholder="12"
                              />
                            </div>
                          </div>

                          <div className="space-y-2">
                            <Label>Start Date *</Label>
                            <Popover>
                              <PopoverTrigger asChild>
                                <Button
                                  variant="outline"
                                  className={cn(
                                    "w-full justify-start text-left font-normal",
                                    !secondary.startDate && "text-muted-foreground"
                                  )}
                                >
                                  <CalendarIcon className="mr-2 h-4 w-4" />
                                  {secondary.startDate ? format(secondary.startDate, "MMM dd, yyyy") : "Pick a date"}
                                </Button>
                              </PopoverTrigger>
                              <PopoverContent className="w-auto p-0" align="start">
                                <Calendar
                                  mode="single"
                                  selected={secondary.startDate}
                                  onSelect={(date) => updateSecondarySalary(index, { startDate: date })}
                                  initialFocus
                                />
                              </PopoverContent>
                            </Popover>
                          </div>
                        </CardContent>
                      </CollapsibleContent>
                    </Card>
                  </Collapsible>
                ))
              )}
            </CardContent>
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
