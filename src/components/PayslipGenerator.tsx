import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Download, FileText, Printer } from 'lucide-react';
import { useBusiness } from '@/contexts/BusinessContext';
import { formatCurrency, generateId } from '@/utils/storage';
import { convertCurrency } from '@/utils/currencyConversion';
import { Payslip, PayrollDeduction, PayrollBonus, SalaryRecord } from '@/types/business';

interface PayslipGeneratorProps {
  isOpen: boolean;
  onClose: () => void;
  salaryRecord: SalaryRecord;
  paymentAmount: number;
  paymentDate: string;
  period: string;
}

export const PayslipGenerator: React.FC<PayslipGeneratorProps> = ({
  isOpen,
  onClose,
  salaryRecord,
  paymentAmount,
  paymentDate,
  period,
}) => {
  const { data, currentBusiness, dispatch } = useBusiness();
  const [deductions, setDeductions] = useState<PayrollDeduction[]>([]);
  const [bonuses, setBonuses] = useState<PayrollBonus[]>([]);

  if (!currentBusiness) return null;

  const teamMember = data.teamMembers.find(m => m.id === salaryRecord.teamMemberId);
  const project = salaryRecord.projectId ? data.projects.find(p => p.id === salaryRecord.projectId) : null;

  // Calculate payslip details
  const grossSalary = paymentAmount;
  const totalDeductions = deductions.reduce((sum, d) => {
    return sum + (d.isPercentage ? (grossSalary * d.amount / 100) : d.amount);
  }, 0);
  const totalBonuses = bonuses.reduce((sum, b) => sum + b.amount, 0);
  const netSalary = grossSalary + totalBonuses - totalDeductions;

  const handleGeneratePayslip = () => {
    const payslip: Payslip = {
      id: generateId(),
      businessId: currentBusiness.id,
      teamMemberId: salaryRecord.teamMemberId,
      salaryRecordId: salaryRecord.id,
      payrollPeriodId: period,
      grossSalary,
      deductions,
      bonuses,
      netSalary,
      currency: data.userSettings.defaultCurrency.code,
      generatedAt: new Date().toISOString(),
    };

    dispatch({ type: 'ADD_PAYSLIP', payload: payslip });
    onClose();
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Payslip Generator
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Payslip Preview */}
          <Card className="payslip-preview">
            <CardHeader className="text-center border-b">
              <div className="space-y-2">
                <h2 className="text-2xl font-bold">{currentBusiness.name}</h2>
                <h3 className="text-lg font-semibold">PAYSLIP</h3>
                <p className="text-sm text-muted-foreground">
                  Pay Period: {period} | Payment Date: {new Date(paymentDate).toLocaleDateString()}
                </p>
              </div>
            </CardHeader>
            
            <CardContent className="space-y-6 p-6">
              {/* Employee Information */}
              <div className="grid grid-cols-2 gap-6">
                <div>
                  <h4 className="font-semibold mb-2">Employee Details</h4>
                  <div className="space-y-1 text-sm">
                    <p><span className="font-medium">Name:</span> {teamMember?.name || 'Unknown'}</p>
                    <p><span className="font-medium">Email:</span> {teamMember?.email || 'N/A'}</p>
                    <p><span className="font-medium">Position:</span> {salaryRecord.position}</p>
                    {project && <p><span className="font-medium">Project:</span> {project.name}</p>}
                  </div>
                </div>
                <div>
                  <h4 className="font-semibold mb-2">Payment Details</h4>
                  <div className="space-y-1 text-sm">
                    <p><span className="font-medium">Frequency:</span> {salaryRecord.frequency}</p>
                    <p><span className="font-medium">Currency:</span> {salaryRecord.currency}</p>
                    <p><span className="font-medium">Base Amount:</span> {formatCurrency(salaryRecord.amount, data.userSettings.defaultCurrency)}</p>
                  </div>
                </div>
              </div>

              <Separator />

              {/* Earnings */}
              <div>
                <h4 className="font-semibold mb-3">Earnings</h4>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span>Gross Salary</span>
                    <span>{formatCurrency(grossSalary, data.userSettings.defaultCurrency)}</span>
                  </div>
                  {bonuses.map((bonus, index) => (
                    <div key={index} className="flex justify-between text-sm">
                      <span>{bonus.name} ({bonus.type})</span>
                      <span className="text-green-600">+{formatCurrency(bonus.amount, data.userSettings.defaultCurrency)}</span>
                    </div>
                  ))}
                  <div className="flex justify-between font-medium border-t pt-2">
                    <span>Total Earnings</span>
                    <span>{formatCurrency(grossSalary + totalBonuses, data.userSettings.defaultCurrency)}</span>
                  </div>
                </div>
              </div>

              <Separator />

              {/* Deductions */}
              <div>
                <h4 className="font-semibold mb-3">Deductions</h4>
                <div className="space-y-2">
                  {deductions.length === 0 ? (
                    <p className="text-sm text-muted-foreground">No deductions applied</p>
                  ) : (
                    deductions.map((deduction, index) => {
                      const amount = deduction.isPercentage 
                        ? (grossSalary * deduction.amount / 100) 
                        : deduction.amount;
                      return (
                        <div key={index} className="flex justify-between text-sm">
                          <span>
                            {deduction.name} ({deduction.type})
                            {deduction.isPercentage && ` (${deduction.amount}%)`}
                          </span>
                          <span className="text-red-600">-{formatCurrency(amount, data.userSettings.defaultCurrency)}</span>
                        </div>
                      );
                    })
                  )}
                  <div className="flex justify-between font-medium border-t pt-2">
                    <span>Total Deductions</span>
                    <span className="text-red-600">-{formatCurrency(totalDeductions, data.userSettings.defaultCurrency)}</span>
                  </div>
                </div>
              </div>

              <Separator />

              {/* Net Pay */}
              <div className="bg-muted p-4 rounded-lg">
                <div className="flex justify-between items-center">
                  <span className="text-lg font-semibold">Net Pay</span>
                  <span className="text-2xl font-bold text-primary">
                    {formatCurrency(netSalary, data.userSettings.defaultCurrency)}
                  </span>
                </div>
              </div>

              {/* Footer */}
              <div className="text-center text-xs text-muted-foreground border-t pt-4">
                <p>This is a computer generated payslip and does not require signature.</p>
                <p>Generated on: {new Date().toLocaleDateString()} at {new Date().toLocaleTimeString()}</p>
              </div>
            </CardContent>
          </Card>

          {/* Actions */}
          <div className="flex justify-between">
            <Button variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <div className="flex gap-2">
              <Button variant="outline" onClick={handlePrint} className="gap-2">
                <Printer className="h-4 w-4" />
                Print
              </Button>
              <Button onClick={handleGeneratePayslip} className="gap-2">
                <Download className="h-4 w-4" />
                Generate & Save
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};