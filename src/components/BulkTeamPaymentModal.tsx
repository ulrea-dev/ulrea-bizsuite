import React, { useState, useMemo } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useBusiness } from '@/contexts/BusinessContext';
import { formatCurrency } from '@/utils/storage';
import { TeamMember, SUPPORTED_CURRENCIES } from '@/types/business';
import { convertCurrency } from '@/utils/currencyConversion';
import { format } from 'date-fns';
import { toast } from 'sonner';
import { Users, DollarSign, Briefcase, CheckCircle } from 'lucide-react';

interface BulkTeamPaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
}

interface MemberPaymentInfo {
  member: TeamMember;
  salaryOutstanding: number;
  projectOutstanding: number;
  quickTaskOutstanding: number;
  totalOutstanding: number;
  salaryRecordIds: string[];
  projectAllocations: Array<{ projectId: string; allocationId: string; memberId: string; amount: number; isLegacy: boolean }>;
  quickTaskIds: string[];
}

export const BulkTeamPaymentModal: React.FC<BulkTeamPaymentModalProps> = ({ isOpen, onClose }) => {
  const { data, currentBusiness, dispatch } = useBusiness();
  const [selectedMembers, setSelectedMembers] = useState<Set<string>>(new Set());
  const [paymentDate, setPaymentDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [notes, setNotes] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('bank_transfer');
  const [payTypes, setPayTypes] = useState({ salary: true, projects: true, quickTasks: true });
  const [isProcessing, setIsProcessing] = useState(false);

  const membersWithOutstanding = useMemo((): MemberPaymentInfo[] => {
    if (!currentBusiness) return [];
    const allCurrencies = [...SUPPORTED_CURRENCIES, ...(data.customCurrencies || [])];
    const currentDate = new Date();
    const currentMonth = currentDate.getMonth();
    const currentYear = currentDate.getFullYear();

    return data.teamMembers
      .filter(member => member.businessIds?.includes(currentBusiness.id))
      .map(member => {
        const memberSalaryRecords = data.salaryRecords.filter(r => r.teamMemberId === member.id && r.businessId === currentBusiness.id);
        let monthlySalaryAmount = 0;
        memberSalaryRecords.forEach(record => {
          const recordCurrency = allCurrencies.find(c => c.code === record.currency) || data.userSettings.defaultCurrency;
          let monthlyAmount = record.amount;
          switch (record.frequency) {
            case 'weekly': monthlyAmount = record.amount * 4.33; break;
            case 'bi-weekly': monthlyAmount = record.amount * 2.17; break;
            case 'quarterly': monthlyAmount = record.amount / 3; break;
            case 'annually': monthlyAmount = record.amount / 12; break;
          }
          monthlySalaryAmount += convertCurrency(monthlyAmount, recordCurrency, data.userSettings.defaultCurrency, data.exchangeRates || []);
        });

        const salaryRecordIds = memberSalaryRecords.map(r => r.id);
        const paidThisMonth = data.salaryPayments.some(p => {
          if (!salaryRecordIds.includes(p.salaryRecordId)) return false;
          const pDate = new Date(p.paymentDate);
          return pDate.getMonth() === currentMonth && pDate.getFullYear() === currentYear;
        });
        const salaryOutstanding = paidThisMonth ? 0 : monthlySalaryAmount;

        const projectAllocations: MemberPaymentInfo['projectAllocations'] = [];
        let projectOutstanding = 0;
        data.projects.filter(p => p.businessId === currentBusiness.id).forEach(project => {
          project.allocationTeamAllocations?.forEach(alloc => {
            if (alloc.memberId === member.id) {
              const remaining = alloc.totalAllocated - alloc.paidAmount;
              if (remaining > 0) {
                projectOutstanding += remaining;
                projectAllocations.push({ projectId: project.id, allocationId: alloc.allocationId, memberId: alloc.memberId, amount: remaining, isLegacy: false });
              }
            }
          });
          project.teamAllocations?.forEach(alloc => {
            if (alloc.memberId === member.id) {
              const remaining = alloc.totalAllocated - alloc.paidAmount;
              if (remaining > 0) {
                projectOutstanding += remaining;
                projectAllocations.push({ projectId: project.id, allocationId: '', memberId: alloc.memberId, amount: remaining, isLegacy: true });
              }
            }
          });
        });

        const unpaidTasks = data.quickTasks.filter(t => t.assignedToId === member.id && t.status === 'completed' && !t.paidAt && t.businessId === currentBusiness.id);
        const quickTaskOutstanding = unpaidTasks.reduce((sum, t) => sum + t.amount, 0);
        const quickTaskIds = unpaidTasks.map(t => t.id);

        return { member, salaryOutstanding, projectOutstanding, quickTaskOutstanding, totalOutstanding: salaryOutstanding + projectOutstanding + quickTaskOutstanding, salaryRecordIds, projectAllocations, quickTaskIds };
      })
      .filter(info => info.totalOutstanding > 0);
  }, [currentBusiness, data]);

  const toggleMember = (memberId: string) => {
    const newSelected = new Set(selectedMembers);
    if (newSelected.has(memberId)) newSelected.delete(memberId);
    else newSelected.add(memberId);
    setSelectedMembers(newSelected);
  };

  const calculateSelectedTotal = () => {
    let total = 0;
    membersWithOutstanding.forEach(info => {
      if (selectedMembers.has(info.member.id)) {
        if (payTypes.salary) total += info.salaryOutstanding;
        if (payTypes.projects) total += info.projectOutstanding;
        if (payTypes.quickTasks) total += info.quickTaskOutstanding;
      }
    });
    return total;
  };

  const handleProcessPayments = async () => {
    if (!currentBusiness || selectedMembers.size === 0) return;
    setIsProcessing(true);
    let paymentsProcessed = 0;
    try {
      for (const info of membersWithOutstanding) {
        if (!selectedMembers.has(info.member.id)) continue;
        if (payTypes.salary && info.salaryOutstanding > 0) {
          for (const salaryRecordId of info.salaryRecordIds) {
            const record = data.salaryRecords.find(r => r.id === salaryRecordId);
            if (record) {
              dispatch({ type: 'ADD_SALARY_PAYMENT', payload: { id: crypto.randomUUID(), salaryRecordId, amount: record.amount, paymentDate, period: format(new Date(), 'MMMM yyyy'), method: paymentMethod, description: notes || `Bulk payment`, status: 'paid', createdAt: new Date().toISOString() } });
              paymentsProcessed++;
            }
          }
        }
        if (payTypes.projects && info.projectOutstanding > 0) {
          for (const alloc of info.projectAllocations) {
            if (!alloc.isLegacy && alloc.allocationId) {
              const project = data.projects.find(p => p.id === alloc.projectId);
              const existingAlloc = project?.allocationTeamAllocations?.find(a => a.allocationId === alloc.allocationId && a.memberId === alloc.memberId);
              if (existingAlloc) {
                dispatch({ type: 'UPDATE_ALLOCATION_TEAM_ALLOCATION', payload: { projectId: alloc.projectId, allocationId: alloc.allocationId, memberId: alloc.memberId, updates: { paidAmount: existingAlloc.totalAllocated } } });
                paymentsProcessed++;
              }
            } else {
              const project = data.projects.find(p => p.id === alloc.projectId);
              if (project) {
                const updatedTeamAllocations = project.teamAllocations.map(ta => ta.memberId === alloc.memberId ? { ...ta, paidAmount: ta.totalAllocated } : ta);
                dispatch({ type: 'UPDATE_PROJECT', payload: { id: alloc.projectId, updates: { teamAllocations: updatedTeamAllocations } } });
                paymentsProcessed++;
              }
            }
          }
        }
        if (payTypes.quickTasks && info.quickTaskOutstanding > 0) {
          for (const taskId of info.quickTaskIds) {
            dispatch({ type: 'COMPLETE_QUICK_TASK', payload: { id: taskId, paidAt: paymentDate } });
            paymentsProcessed++;
          }
        }
      }
      toast.success(`Processed ${paymentsProcessed} payments for ${selectedMembers.size} members`);
      onClose();
      setSelectedMembers(new Set());
      setNotes('');
    } catch { toast.error('Failed to process some payments'); }
    finally { setIsProcessing(false); }
  };

  if (!currentBusiness) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl max-h-[85vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2"><Users className="h-5 w-5" />Bulk Team Payment</DialogTitle>
          <DialogDescription>Pay multiple team members at once</DialogDescription>
        </DialogHeader>
        <div className="grid grid-cols-2 gap-6 flex-1 overflow-hidden">
          <div className="flex flex-col">
            <div className="flex items-center justify-between mb-3">
              <Label className="text-sm font-medium">Select Team Members</Label>
              <div className="flex gap-2">
                <Button variant="ghost" size="sm" onClick={() => setSelectedMembers(new Set(membersWithOutstanding.map(m => m.member.id)))}>Select All</Button>
                <Button variant="ghost" size="sm" onClick={() => setSelectedMembers(new Set())}>Clear</Button>
              </div>
            </div>
            <ScrollArea className="flex-1 border rounded-lg p-2">
              {membersWithOutstanding.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-8 text-muted-foreground"><CheckCircle className="h-12 w-12 mb-4 opacity-50" /><p>No outstanding payments</p></div>
              ) : (
                <div className="space-y-2">
                  {membersWithOutstanding.map(info => (
                    <div key={info.member.id} className={`p-3 rounded-lg border cursor-pointer transition-colors ${selectedMembers.has(info.member.id) ? 'bg-primary/10 border-primary' : 'hover:bg-accent'}`} onClick={() => toggleMember(info.member.id)}>
                      <div className="flex items-start gap-3">
                        <Checkbox checked={selectedMembers.has(info.member.id)} onCheckedChange={() => toggleMember(info.member.id)} />
                        <div className="flex-1">
                          <p className="font-medium">{info.member.name}</p>
                          <p className="text-xs text-muted-foreground">{info.member.role}</p>
                          <div className="flex flex-wrap gap-1 mt-2">
                            {info.salaryOutstanding > 0 && <Badge variant="outline" className="text-xs"><DollarSign className="h-3 w-3 mr-1" />{formatCurrency(info.salaryOutstanding, currentBusiness.currency)}</Badge>}
                            {info.projectOutstanding > 0 && <Badge variant="outline" className="text-xs"><Briefcase className="h-3 w-3 mr-1" />{formatCurrency(info.projectOutstanding, currentBusiness.currency)}</Badge>}
                            {info.quickTaskOutstanding > 0 && <Badge variant="outline" className="text-xs"><CheckCircle className="h-3 w-3 mr-1" />{formatCurrency(info.quickTaskOutstanding, currentBusiness.currency)}</Badge>}
                          </div>
                        </div>
                        <p className="font-semibold text-orange-600">{formatCurrency(info.totalOutstanding, currentBusiness.currency)}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </ScrollArea>
          </div>
          <div className="space-y-4">
            <div>
              <Label className="text-sm font-medium mb-2 block">Payment Types</Label>
              <div className="space-y-2">
                <div className="flex items-center gap-2"><Checkbox id="pay-salary" checked={payTypes.salary} onCheckedChange={(c) => setPayTypes(p => ({ ...p, salary: !!c }))} /><Label htmlFor="pay-salary" className="text-sm flex items-center gap-2"><DollarSign className="h-4 w-4" />Pay Current Month Salary</Label></div>
                <div className="flex items-center gap-2"><Checkbox id="pay-projects" checked={payTypes.projects} onCheckedChange={(c) => setPayTypes(p => ({ ...p, projects: !!c }))} /><Label htmlFor="pay-projects" className="text-sm flex items-center gap-2"><Briefcase className="h-4 w-4" />Pay Project Outstanding</Label></div>
                <div className="flex items-center gap-2"><Checkbox id="pay-tasks" checked={payTypes.quickTasks} onCheckedChange={(c) => setPayTypes(p => ({ ...p, quickTasks: !!c }))} /><Label htmlFor="pay-tasks" className="text-sm flex items-center gap-2"><CheckCircle className="h-4 w-4" />Pay Quick Task Outstanding</Label></div>
              </div>
            </div>
            <div><Label htmlFor="payment-date">Payment Date</Label><Input id="payment-date" type="date" value={paymentDate} onChange={(e) => setPaymentDate(e.target.value)} /></div>
            <div><Label htmlFor="payment-method">Payment Method</Label><Select value={paymentMethod} onValueChange={setPaymentMethod}><SelectTrigger><SelectValue placeholder="Select method" /></SelectTrigger><SelectContent><SelectItem value="bank_transfer">Bank Transfer</SelectItem><SelectItem value="cash">Cash</SelectItem><SelectItem value="check">Check</SelectItem><SelectItem value="mobile_money">Mobile Money</SelectItem><SelectItem value="other">Other</SelectItem></SelectContent></Select></div>
            <div><Label htmlFor="notes">Notes (Optional)</Label><Textarea id="notes" placeholder="Add notes..." value={notes} onChange={(e) => setNotes(e.target.value)} rows={2} /></div>
            <Card className="bg-primary/5 border-primary/20"><CardContent className="p-4"><div className="flex items-center justify-between"><div><p className="text-sm text-muted-foreground">Total to Pay</p><p className="text-2xl font-bold text-primary">{formatCurrency(calculateSelectedTotal(), currentBusiness.currency)}</p></div><Badge variant="secondary" className="text-lg px-3 py-1">{selectedMembers.size} members</Badge></div></CardContent></Card>
          </div>
        </div>
        <DialogFooter className="mt-4"><Button variant="outline" onClick={onClose}>Cancel</Button><Button onClick={handleProcessPayments} disabled={selectedMembers.size === 0 || isProcessing}>{isProcessing ? 'Processing...' : `Pay ${selectedMembers.size} Members`}</Button></DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
