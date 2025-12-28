import React, { useState, useMemo } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useBusiness } from '@/contexts/BusinessContext';
import { formatCurrency } from '@/utils/storage';
import { TeamMember, SUPPORTED_CURRENCIES } from '@/types/business';
import { format } from 'date-fns';
import { DollarSign, Briefcase, CheckCircle, Calendar, Clock } from 'lucide-react';

interface TeamMemberPaymentHistoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  member: TeamMember | null;
}

interface PaymentHistoryItem {
  id: string;
  type: 'salary' | 'project' | 'quicktask';
  date: Date;
  amount: number;
  currency: string;
  description: string;
  details?: string;
}

export const TeamMemberPaymentHistoryModal: React.FC<TeamMemberPaymentHistoryModalProps> = ({
  isOpen,
  onClose,
  member,
}) => {
  const { data, currentBusiness } = useBusiness();
  const [activeTab, setActiveTab] = useState('all');

  const paymentHistory = useMemo(() => {
    if (!member || !currentBusiness) return [];

    const allCurrencies = [...SUPPORTED_CURRENCIES, ...(data.customCurrencies || [])];
    const items: PaymentHistoryItem[] = [];

    // 1. Salary payments
    const memberSalaryRecords = data.salaryRecords.filter(
      r => r.teamMemberId === member.id && r.businessId === currentBusiness.id
    );
    const salaryRecordIds = memberSalaryRecords.map(r => r.id);
    
    data.salaryPayments
      .filter(p => salaryRecordIds.includes(p.salaryRecordId))
      .forEach(payment => {
        const record = memberSalaryRecords.find(r => r.id === payment.salaryRecordId);
        const currency = allCurrencies.find(c => c.code === record?.currency) || currentBusiness.currency;
        items.push({
          id: payment.id,
          type: 'salary',
          date: new Date(payment.paymentDate),
          amount: payment.amount,
          currency: currency.code,
          description: `Salary Payment`,
          details: record ? `${record.frequency} salary` : undefined,
        });
      });

    // 2. Project payments (from allocationTeamAllocations that have been paid)
    data.projects
      .filter(p => p.businessId === currentBusiness.id)
      .forEach(project => {
        // Check allocation team allocations with paid amounts
        project.allocationTeamAllocations?.forEach((alloc, index) => {
          if (alloc.memberId === member.id && alloc.paidAmount > 0) {
            items.push({
              id: `${project.id}-alloc-${index}`,
              type: 'project',
              date: new Date(project.updatedAt || project.createdAt),
              amount: alloc.paidAmount,
              currency: currentBusiness.currency.code,
              description: `${project.name}`,
              details: alloc.allocationName || 'Project allocation',
            });
          }
        });

        // Check legacy team allocations
        project.teamAllocations?.forEach((alloc, index) => {
          if (alloc.memberId === member.id && alloc.paidAmount > 0) {
            items.push({
              id: `${project.id}-legacy-${index}`,
              type: 'project',
              date: new Date(project.updatedAt || project.createdAt),
              amount: alloc.paidAmount,
              currency: currentBusiness.currency.code,
              description: `${project.name}`,
              details: 'Legacy allocation',
            });
          }
        });
      });

    // 3. Quick task payments (completed and paid)
    data.quickTasks
      .filter(t => t.assignedToId === member.id && t.businessId === currentBusiness.id && t.paidAt)
      .forEach(task => {
        const currency = allCurrencies.find(c => c.code === task.currencyCode) || currentBusiness.currency;
        items.push({
          id: task.id,
          type: 'quicktask',
          date: new Date(task.paidAt!),
          amount: task.amount,
          currency: currency.code,
          description: task.title,
          details: task.taskType,
        });
      });

    // Sort by date descending
    return items.sort((a, b) => b.date.getTime() - a.date.getTime());
  }, [member, currentBusiness, data]);

  const filteredHistory = useMemo(() => {
    if (activeTab === 'all') return paymentHistory;
    return paymentHistory.filter(item => item.type === activeTab);
  }, [paymentHistory, activeTab]);

  const totals = useMemo(() => {
    const salary = paymentHistory.filter(p => p.type === 'salary').reduce((sum, p) => sum + p.amount, 0);
    const project = paymentHistory.filter(p => p.type === 'project').reduce((sum, p) => sum + p.amount, 0);
    const quicktask = paymentHistory.filter(p => p.type === 'quicktask').reduce((sum, p) => sum + p.amount, 0);
    return { salary, project, quicktask, total: salary + project + quicktask };
  }, [paymentHistory]);

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'salary': return <DollarSign className="h-4 w-4" />;
      case 'project': return <Briefcase className="h-4 w-4" />;
      case 'quicktask': return <CheckCircle className="h-4 w-4" />;
      default: return <Clock className="h-4 w-4" />;
    }
  };

  const getTypeBadgeVariant = (type: string) => {
    switch (type) {
      case 'salary': return 'default';
      case 'project': return 'secondary';
      case 'quicktask': return 'outline';
      default: return 'outline';
    }
  };

  if (!member || !currentBusiness) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[85vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>Payment History - {member.name}</DialogTitle>
          <DialogDescription>
            All salary, project, and quick task payments
          </DialogDescription>
        </DialogHeader>

        {/* Summary Cards */}
        <div className="grid grid-cols-4 gap-3 mb-4">
          <Card>
            <CardContent className="p-3 text-center">
              <p className="text-xs text-muted-foreground">Total Paid</p>
              <p className="text-lg font-bold text-primary">
                {formatCurrency(totals.total, currentBusiness.currency)}
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-3 text-center">
              <p className="text-xs text-muted-foreground">Salary</p>
              <p className="text-sm font-semibold">
                {formatCurrency(totals.salary, currentBusiness.currency)}
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-3 text-center">
              <p className="text-xs text-muted-foreground">Projects</p>
              <p className="text-sm font-semibold">
                {formatCurrency(totals.project, currentBusiness.currency)}
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-3 text-center">
              <p className="text-xs text-muted-foreground">Tasks</p>
              <p className="text-sm font-semibold">
                {formatCurrency(totals.quicktask, currentBusiness.currency)}
              </p>
            </CardContent>
          </Card>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="all">All ({paymentHistory.length})</TabsTrigger>
            <TabsTrigger value="salary">Salary ({paymentHistory.filter(p => p.type === 'salary').length})</TabsTrigger>
            <TabsTrigger value="project">Projects ({paymentHistory.filter(p => p.type === 'project').length})</TabsTrigger>
            <TabsTrigger value="quicktask">Tasks ({paymentHistory.filter(p => p.type === 'quicktask').length})</TabsTrigger>
          </TabsList>

          <TabsContent value={activeTab} className="mt-4 flex-1">
            <ScrollArea className="h-[350px] pr-4">
              {filteredHistory.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
                  <Calendar className="h-12 w-12 mb-4 opacity-50" />
                  <p>No payment history found</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {filteredHistory.map(item => (
                    <div
                      key={item.id}
                      className="flex items-center justify-between p-3 rounded-lg border bg-card hover:bg-accent/50 transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <div className="p-2 rounded-full bg-muted">
                          {getTypeIcon(item.type)}
                        </div>
                        <div>
                          <p className="font-medium">{item.description}</p>
                          <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <Badge variant={getTypeBadgeVariant(item.type) as any} className="text-xs">
                              {item.type === 'quicktask' ? 'Task' : item.type.charAt(0).toUpperCase() + item.type.slice(1)}
                            </Badge>
                            {item.details && <span>• {item.details}</span>}
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-semibold text-green-600">
                          +{formatCurrency(item.amount, currentBusiness.currency)}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {format(item.date, 'MMM d, yyyy')}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </ScrollArea>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
};