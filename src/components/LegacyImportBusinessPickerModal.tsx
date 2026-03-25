import React, { useState } from 'react';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Briefcase, Package, Layers, Check, AlertTriangle } from 'lucide-react';
import { Business, AppData } from '@/types/business';
import { cn } from '@/lib/utils';

interface LegacyImportBusinessPickerModalProps {
  isOpen: boolean;
  onClose: () => void;
  backupData: AppData;
  onConfirm: (filteredData: AppData) => void;
  isImporting: boolean;
}

const MODEL_ICON = {
  service: <Briefcase className="w-4 h-4" />,
  product: <Package className="w-4 h-4" />,
  hybrid: <Layers className="w-4 h-4" />,
};

const MODEL_LABEL = {
  service: 'Service',
  product: 'Product',
  hybrid: 'Hybrid',
};

/** Filter all workspace data down to a single selected business */
function filterDataForBusiness(data: AppData, businessId: string): AppData {
  const business = data.businesses.find(b => b.id === businessId)!;
  return {
    ...data,
    businesses: [business],
    currentBusinessId: businessId,
    projects: data.projects.filter(p => p.businessId === businessId),
    expenses: data.expenses.filter(e => e.businessId === businessId),
    bankAccounts: data.bankAccounts.filter(b => b.businessId === businessId),
    salaryRecords: data.salaryRecords.filter(s => s.businessId === businessId),
    payrollPeriods: data.payrollPeriods.filter(p => p.businessId === businessId),
    payslips: data.payslips.filter(p => p.businessId === businessId),
    extraPayments: data.extraPayments.filter(e => e.businessId === businessId),
    quickTasks: data.quickTasks.filter(q => q.businessId === businessId),
    retainers: data.retainers.filter(r => r.businessId === businessId),
    renewals: data.renewals.filter(r => r.businessId === businessId),
    payables: data.payables.filter(p => p.businessId === businessId),
    receivables: data.receivables.filter(r => r.businessId === businessId),
    products: data.products.filter(p => p.businessId === businessId),
    customers: data.customers.filter(c => c.businessId === businessId),
    salesOrders: data.salesOrders.filter(s => s.businessId === businessId),
    productionBatches: data.productionBatches.filter(pb => pb.businessId === businessId),
    purchaseOrders: data.purchaseOrders.filter(po => po.businessId === businessId),
    // Payments are linked via projectId/retainerId etc — filter by projectIds of this business
    payments: data.payments.filter(p => {
      const projectIds = data.projects.filter(pr => pr.businessId === businessId).map(pr => pr.id);
      if (p.projectId && projectIds.includes(p.projectId)) return true;
      const retainerIds = data.retainers.filter(r => r.businessId === businessId).map(r => r.id);
      if (p.retainerId && retainerIds.includes(p.retainerId)) return true;
      // Salary/team payments — keep them (they're workspace-global)
      if (p.type === 'outgoing' && (p.recipientType === 'team' || p.recipientType === 'partner')) return true;
      // Unlinked or client payments — default keep
      if (!p.projectId && !p.retainerId) return true;
      return false;
    }),
    // Clients and team members are workspace-wide — keep all
    clients: data.clients,
    teamMembers: data.teamMembers,
    partners: data.partners,
  };
}

export const LegacyImportBusinessPickerModal: React.FC<LegacyImportBusinessPickerModalProps> = ({
  isOpen, onClose, backupData, onConfirm, isImporting,
}) => {
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const handleConfirm = () => {
    if (!selectedId) return;
    const filtered = filterDataForBusiness(backupData, selectedId);
    onConfirm(filtered);
  };

  const countFor = (b: Business) => ({
    projects: backupData.projects.filter(p => p.businessId === b.id).length,
    clients: backupData.clients.length,
    payments: backupData.payments.length,
  });

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-amber-500" />
            Multiple Ventures Found
          </DialogTitle>
          <DialogDescription>
            This backup contains <strong>{backupData.businesses.length} ventures</strong>. Since each workspace now holds one venture, select which one to import into this workspace.
          </DialogDescription>
        </DialogHeader>

        <ScrollArea className="max-h-[360px] pr-1">
          <div className="space-y-2 py-1">
            {backupData.businesses.map((b) => {
              const counts = countFor(b);
              const isSelected = selectedId === b.id;
              return (
                <button
                  key={b.id}
                  onClick={() => setSelectedId(b.id)}
                  className={cn(
                    'w-full text-left p-4 rounded-lg border transition-all',
                    'flex items-start gap-3 group',
                    isSelected
                      ? 'border-primary bg-primary/5 ring-1 ring-primary/20'
                      : 'border-border bg-card hover:border-primary/40 hover:bg-accent/30'
                  )}
                >
                  <div className={cn(
                    'p-2 rounded-md shrink-0 mt-0.5',
                    isSelected ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'
                  )}>
                    {MODEL_ICON[b.businessModel] ?? <Briefcase className="w-4 h-4" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <p className="font-medium text-foreground truncate">{b.name}</p>
                      <Badge variant="secondary" className="text-xs shrink-0">
                        {MODEL_LABEL[b.businessModel] ?? b.businessModel}
                      </Badge>
                    </div>
                    <p className="text-xs text-muted-foreground truncate">{b.type}</p>
                    <div className="flex gap-3 mt-1.5 text-xs text-muted-foreground">
                      <span>{counts.projects} project{counts.projects !== 1 ? 's' : ''}</span>
                      <span>{b.currency?.code ?? 'USD'}</span>
                    </div>
                  </div>
                  <div className="shrink-0 mt-1 w-4 h-4">
                    {isSelected && <Check className="w-4 h-4 text-primary" />}
                  </div>
                </button>
              );
            })}
          </div>
        </ScrollArea>

        <div className="flex gap-3 pt-2">
          <Button variant="outline" onClick={onClose} className="flex-1" disabled={isImporting}>
            Cancel
          </Button>
          <Button
            onClick={handleConfirm}
            className="flex-1"
            disabled={!selectedId || isImporting}
          >
            {isImporting ? 'Importing…' : 'Import Selected Venture'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
