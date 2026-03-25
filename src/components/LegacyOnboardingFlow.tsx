/**
 * LegacyOnboardingFlow
 *
 * A full-screen Dialog shown on first login when a user has no ventures in the DB.
 * Steps:
 *   1. Silently check Supabase Storage for a legacy JSON backup
 *   2a. Backup found with multiple businesses → show business picker
 *   2b. Backup found with single business → confirm + auto-import
 *   3. No backup found → VentureSetup (create new)
 *
 * Mounted globally in HubLayout so it appears on any route.
 */

import React, { useEffect, useState, useCallback } from 'react';
import { Loader2, Database, CloudOff, Building2, Package, Layers, Check, ArrowRight, Plus } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useBusiness } from '@/contexts/BusinessContext';
import { useSupabaseStorage } from '@/contexts/SupabaseStorageContext';
import { AppData, Business } from '@/types/business';
import { VentureSetup } from './VentureSetup';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { cn } from '@/lib/utils';

type FlowState =
  | 'checking'     // scanning storage for legacy backup
  | 'found'        // backup found — show what was found before importing
  | 'picker'       // multiple businesses — user must choose
  | 'importing'    // importing in progress
  | 'new_venture'  // no backup → create new
  | 'idle';        // done / hidden

interface LegacyOnboardingFlowProps {
  isOpen: boolean;
  onComplete: () => void;
}

const MODEL_ICON: Record<string, React.ReactNode> = {
  service: <Building2 className="w-4 h-4" />,
  product: <Package className="w-4 h-4" />,
  hybrid: <Layers className="w-4 h-4" />,
};

/** Filter all workspace data down to a single selected business, keeping ALL related entities */
function filterDataForBusiness(data: AppData, businessId: string): AppData {
  const business = data.businesses.find(b => b.id === businessId)!;

  // Collect IDs scoped to this business so we can follow relations
  const bizProjects = data.projects.filter(p => p.businessId === businessId);
  const bizProjectIds = new Set(bizProjects.map(p => p.id));

  const bizRetainers = (data.retainers || []).filter(r => r.businessId === businessId);
  const bizRetainerIds = new Set(bizRetainers.map(r => r.id));

  const bizRenewals = (data.renewals || []).filter(r => r.businessId === businessId);
  const bizRenewalIds = new Set(bizRenewals.map(r => r.id));

  const bizSalaryRecords = (data.salaryRecords || []).filter(s => s.businessId === businessId);
  const bizSalaryRecordIds = new Set(bizSalaryRecords.map(s => s.id));

  const bizQuickTasks = (data.quickTasks || []).filter(t => t.businessId === businessId);
  const bizQuickTaskIds = new Set(bizQuickTasks.map(t => t.id));

  // Payments: include any payment that relates to this business via project, retainer, quick task,
  // salary record, or is a direct outgoing payment (team/partner) with no business link
  const bizPayments = (data.payments || []).filter(p => {
    if (p.projectId && bizProjectIds.has(p.projectId)) return true;
    if (p.retainerId && bizRetainerIds.has(p.retainerId)) return true;
    if (p.taskId && bizQuickTaskIds.has(p.taskId)) return true;
    // Salary / team / partner payments without a business FK — include if no project/retainer link
    if (!p.projectId && !p.retainerId) return true;
    return false;
  });

  // Salary payments: follow salary records
  const bizSalaryPayments = (data.salaryPayments || []).filter(sp =>
    bizSalaryRecordIds.has(sp.salaryRecordId)
  );

  // Payroll periods & payslips
  const bizPayrollPeriods = (data.payrollPeriods || []).filter(p => p.businessId === businessId);
  const bizPayrollPeriodIds = new Set(bizPayrollPeriods.map(p => p.id));
  const bizPayslips = (data.payslips || []).filter(ps =>
    ps.businessId === businessId || bizPayrollPeriodIds.has(ps.payrollPeriodId)
  );

  // Renewal payments: follow renewals
  const bizRenewalPayments = (data.renewalPayments || []).filter(rp =>
    bizRenewalIds.has(rp.renewalId)
  );

  // Extra payments
  const bizExtraPayments = (data.extraPayments || []).filter(ep => ep.businessId === businessId);

  // Todos: include todos linked to this business's projects/retainers, or general ones
  const bizTodos = (data.todos || []).filter(t => {
    if (t.businessId === businessId) return true;
    if (t.linkedEntityId && (bizProjectIds.has(t.linkedEntityId) || bizRetainerIds.has(t.linkedEntityId))) return true;
    return false;
  });

  // Clients: keep all (workspace-wide), they reference projects via array
  // Team members: keep all (workspace-wide)
  // Partners: keep all (workspace-wide)

  return {
    ...data,
    businesses: [business],
    currentBusinessId: businessId,
    projects: bizProjects,
    retainers: bizRetainers,
    renewals: bizRenewals,
    renewalPayments: bizRenewalPayments,
    payments: bizPayments,
    salaryRecords: bizSalaryRecords,
    salaryPayments: bizSalaryPayments,
    payrollPeriods: bizPayrollPeriods,
    payslips: bizPayslips,
    quickTasks: bizQuickTasks,
    extraPayments: bizExtraPayments,
    expenses: (data.expenses || []).filter(e => e.businessId === businessId),
    bankAccounts: (data.bankAccounts || []).filter(b => b.businessId === businessId),
    payables: (data.payables || []).filter(p => p.businessId === businessId),
    receivables: (data.receivables || []).filter(r => r.businessId === businessId),
    todos: bizTodos,
    // Workspace-wide (keep all — they span ventures)
    clients: data.clients || [],
    teamMembers: data.teamMembers || [],
    partners: data.partners || [],
    products: (data.products || []).filter(p => p.businessId === businessId),
    customers: (data.customers || []).filter(c => c.businessId === businessId),
    salesOrders: (data.salesOrders || []).filter(s => s.businessId === businessId),
    productionBatches: (data.productionBatches || []).filter(pb => pb.businessId === businessId),
    purchaseOrders: (data.purchaseOrders || []).filter(po => po.businessId === businessId),
    serviceTypes: data.serviceTypes || [],
    exchangeRates: data.exchangeRates || [],
    customCurrencies: data.customCurrencies || [],
  };
}

export const LegacyOnboardingFlow: React.FC<LegacyOnboardingFlowProps> = ({ isOpen, onComplete }) => {
  const { importData } = useBusiness();
  const { downloadCloud, uploadNow } = useSupabaseStorage();

  const [flowState, setFlowState] = useState<FlowState>('checking');
  const [legacyData, setLegacyData] = useState<AppData | null>(null);
  const [selectedBusiness, setSelectedBusiness] = useState<Business | null>(null);
  const [scanError, setScanError] = useState<string | null>(null);
  const [importedIds, setImportedIds] = useState<string[]>([]);

  const scanForLegacyBackup = useCallback(async () => {
    setFlowState('checking');
    setScanError(null);
    try {
      const { data: authData } = await supabase.auth.getUser();
      const user = authData.user;
      if (!user) { setFlowState('new_venture'); return; }

      const pathsToTry: string[] = [user.id];
      const meta = user.user_metadata;
      if (meta?.workspace_id && meta.workspace_id !== user.id) pathsToTry.push(meta.workspace_id);
      if (meta?.account_name) {
        const slug = String(meta.account_name).toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
        if (slug && !pathsToTry.includes(slug)) pathsToTry.push(slug);
      }

      let found: AppData | null = null;
      for (const pathKey of pathsToTry) {
        const result = await downloadCloud(pathKey);
        if (result?.data?.businesses?.length) { found = result.data; break; }
      }

      if (!found) { setFlowState('new_venture'); return; }

      setLegacyData(found);
      if (found.businesses.length === 1) {
        setSelectedBusiness(found.businesses[0]);
        setFlowState('found');
      } else {
        setFlowState('picker');
      }
    } catch (err) {
      console.error('[LegacyOnboarding] scan failed:', err);
      setScanError('Could not scan for existing data. You can create a new venture or retry.');
      setFlowState('new_venture');
    }
  }, [downloadCloud]);

  useEffect(() => {
    if (isOpen) scanForLegacyBackup();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen]);

  const _applyImport = async (appData: AppData, businessId?: string) => {
    setFlowState('importing');
    try {
      const { data: authData } = await supabase.auth.getUser();
      const user = authData.user;
      const workspaceId =
        user?.user_metadata?.workspace_id ||
        user?.user_metadata?.account_name ||
        user?.id ||
        appData.userSettings.accountName || '';

      const patchedData: AppData = {
        ...appData,
        userSettings: {
          ...appData.userSettings,
          userId: user?.id || appData.userSettings.userId,
          accountName: workspaceId,
        },
      };

      localStorage.removeItem('bizsuite-db-migrated-v2');
      importData(JSON.stringify(patchedData));
      await uploadNow(patchedData);
      localStorage.setItem('bizsuite-db-migrated-v2', 'true');

      // Track this business as imported and loop back to picker if multi-venture
      if (businessId) {
        setImportedIds(prev => [...prev, businessId]);
      }

      const isMulti = legacyData && legacyData.businesses.length > 1;
      if (isMulti) {
        setSelectedBusiness(null);
        setFlowState('picker');
      } else {
        onComplete();
      }
    } catch (err) {
      console.error('[LegacyOnboarding] import error:', err);
      onComplete();
    }
  };

  const handleConfirmImport = () => {
    if (!legacyData || !selectedBusiness) return;
    const filtered = legacyData.businesses.length === 1
      ? legacyData
      : filterDataForBusiness(legacyData, selectedBusiness.id);
    _applyImport(filtered, selectedBusiness.id);
  };

  // ── Render helpers ────────────────────────────────────────────────────────────

  const renderChecking = () => (
    <div className="flex flex-col items-center justify-center py-12 gap-4">
      <div className="p-4 rounded-full bg-primary/10">
        <Database className="h-10 w-10 text-primary animate-pulse" />
      </div>
      <div className="text-center">
        <p className="text-lg font-semibold text-foreground">Looking for your data…</p>
        <p className="text-sm text-muted-foreground mt-1">Scanning your cloud backup, this only takes a moment</p>
      </div>
    </div>
  );

  const renderImporting = () => (
    <div className="flex flex-col items-center justify-center py-12 gap-4">
      <div className="p-4 rounded-full bg-primary/10">
        <Loader2 className="h-10 w-10 text-primary animate-spin" />
      </div>
      <div className="text-center">
        <p className="text-lg font-semibold text-foreground">Importing your venture…</p>
        <p className="text-sm text-muted-foreground mt-1">Restoring your data, this will only take a moment</p>
      </div>
    </div>
  );

  const renderFound = () => {
    if (!legacyData || !selectedBusiness) return null;
    const b = selectedBusiness;
    const projectCount = legacyData.projects.filter(p => p.businessId === b.id).length;
    const clientCount = legacyData.clients?.length || 0;
    const todoCount = legacyData.todos?.length || 0;
    const paymentCount = legacyData.payments?.length || 0;

    return (
      <div className="space-y-6">
        <div className="text-center">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-full bg-primary/10 mb-3">
            <Database className="w-7 h-7 text-primary" />
          </div>
          <h2 className="text-xl font-semibold text-foreground">We found your backup!</h2>
          <p className="text-sm text-muted-foreground mt-1">
            Your previous data is ready to restore.
          </p>
        </div>

        <div className="rounded-xl border border-border bg-muted/40 p-4 space-y-3">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
              {MODEL_ICON[b.businessModel] || <Building2 className="w-4 h-4 text-primary" />}
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-semibold text-foreground truncate">{b.name}</p>
              <p className="text-xs text-muted-foreground capitalize">{b.businessModel} venture</p>
            </div>
            <Badge variant="secondary" className="text-xs shrink-0">{b.currency?.code || 'USD'}</Badge>
          </div>
          <div className="grid grid-cols-4 gap-2 pt-2 border-t border-border/50">
            {[
              { label: 'Projects', value: projectCount },
              { label: 'Clients', value: clientCount },
              { label: 'To-dos', value: todoCount },
              { label: 'Payments', value: paymentCount },
            ].map(stat => (
              <div key={stat.label} className="text-center">
                <p className="text-base font-bold text-foreground">{stat.value}</p>
                <p className="text-xs text-muted-foreground">{stat.label}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="flex gap-3">
          <Button
            variant="outline"
            className="flex-1"
            onClick={() => setFlowState('new_venture')}
          >
            Skip — Start Fresh
          </Button>
          <Button className="flex-1 gap-2" onClick={handleConfirmImport}>
            <Check className="w-4 h-4" />
            Import This Venture
          </Button>
        </div>
      </div>
    );
  };

  const renderPicker = () => {
    if (!legacyData) return null;
    const remaining = legacyData.businesses.filter(b => !importedIds.includes(b.id));
    const allDone = remaining.length === 0;

    return (
      <div className="space-y-6">
        <div className="text-center">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-full bg-primary/10 mb-3">
            <Database className="w-7 h-7 text-primary" />
          </div>
          <h2 className="text-xl font-semibold text-foreground">
            {allDone ? 'All ventures imported!' : 'Choose ventures to import'}
          </h2>
          <p className="text-sm text-muted-foreground mt-1">
            {allDone
              ? 'You can switch between ventures from the venture switcher.'
              : `We found ${legacyData.businesses.length} ventures in your backup. Select each one to import.`}
          </p>
        </div>

        <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
          {legacyData.businesses.map(b => {
            const projectCount = legacyData.projects.filter(p => p.businessId === b.id).length;
            const clientCount = legacyData.clients?.length || 0;
            const paymentCount = legacyData.payments?.filter(p =>
              legacyData.projects.some(pr => pr.id === p.projectId && pr.businessId === b.id)
            ).length || 0;
            const isSelected = selectedBusiness?.id === b.id;
            const isImported = importedIds.includes(b.id);
            return (
              <button
                key={b.id}
                onClick={() => !isImported && setSelectedBusiness(b)}
                disabled={isImported}
                className={cn(
                  'w-full p-3 rounded-xl border text-left flex items-center gap-3 transition-all',
                  isImported
                    ? 'border-border/40 bg-muted/20 opacity-60 cursor-default'
                    : isSelected
                    ? 'border-primary bg-primary/5 ring-1 ring-primary/30'
                    : 'border-border bg-card hover:border-primary/40 hover:bg-muted/40'
                )}
              >
                <div className={cn(
                  'w-9 h-9 rounded-lg flex items-center justify-center shrink-0',
                  isImported ? 'bg-success/10' : 'bg-primary/10'
                )}>
                  {isImported
                    ? <Check className="w-4 h-4 text-primary" />
                    : (MODEL_ICON[b.businessModel] || <Building2 className="w-4 h-4 text-primary" />)}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-foreground truncate">{b.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {projectCount} project{projectCount !== 1 ? 's' : ''} · {clientCount} client{clientCount !== 1 ? 's' : ''} · {paymentCount} payment{paymentCount !== 1 ? 's' : ''} · {b.businessModel}
                  </p>
                </div>
                {isImported && <Badge variant="secondary" className="text-xs shrink-0">Imported</Badge>}
                {isSelected && !isImported && <Check className="w-4 h-4 text-primary shrink-0" />}
              </button>
            );
          })}
        </div>

        <div className="flex gap-3">
          {allDone ? (
            <Button className="flex-1 gap-2" onClick={onComplete}>
              <Check className="w-4 h-4" />
              Done
            </Button>
          ) : (
            <>
              <Button
                variant="outline"
                className="flex-1"
                onClick={() => importedIds.length > 0 ? onComplete() : setFlowState('new_venture')}
              >
                {importedIds.length > 0 ? 'Done for now' : 'Skip — Start Fresh'}
              </Button>
              <Button
                className="flex-1 gap-2"
                disabled={!selectedBusiness || importedIds.includes(selectedBusiness?.id || '')}
                onClick={handleConfirmImport}
              >
                <ArrowRight className="w-4 h-4" />
                Import Selected
              </Button>
            </>
          )}
        </div>
      </div>
    );
  };

  const renderNewVenture = () => (
    <div className="space-y-4">
      {scanError && (
        <div className="flex items-center gap-2 p-3 rounded-lg bg-muted text-sm text-muted-foreground">
          <CloudOff className="h-4 w-4 shrink-0" />
          <span className="flex-1">{scanError}</span>
          <Button variant="ghost" size="sm" onClick={scanForLegacyBackup} className="shrink-0">
            Retry
          </Button>
        </div>
      )}
      {!scanError && (
        <div className="text-center pb-2">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-full bg-primary/10 mb-3">
            <Plus className="w-7 h-7 text-primary" />
          </div>
          <h2 className="text-xl font-semibold text-foreground">Create your first venture</h2>
          <p className="text-sm text-muted-foreground mt-1">No existing backup found — let's set up your workspace.</p>
        </div>
      )}
      <VentureSetup onComplete={onComplete} />
    </div>
  );

  return (
    <Dialog open={isOpen} onOpenChange={() => { /* prevent accidental close */ }}>
      <DialogContent
        className="sm:max-w-md w-full"
        // Remove the default close (X) button — user must complete the flow
        onInteractOutside={e => e.preventDefault()}
        onEscapeKeyDown={e => e.preventDefault()}
      >
        {flowState === 'checking' && renderChecking()}
        {flowState === 'importing' && renderImporting()}
        {flowState === 'found' && renderFound()}
        {flowState === 'picker' && renderPicker()}
        {flowState === 'new_venture' && renderNewVenture()}
      </DialogContent>
    </Dialog>
  );
};
