/**
 * LegacyOnboardingFlow
 *
 * Full-screen Dialog shown on first login when a user has no ventures in the DB.
 * Tabs:
 *   - Cloud: silently scan Supabase Storage for a legacy JSON backup
 *   - File:  upload a local JSON backup file
 *
 * After finding data (either way), shows a business picker if multiple ventures exist.
 */

import React, { useEffect, useState, useCallback, useRef } from 'react';
import {
  Loader2, Database, CloudOff, Building2, Package, Layers,
  Check, ArrowRight, Plus, Upload, Cloud, FileJson,
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useBusiness } from '@/contexts/BusinessContext';
import { useSupabaseStorage } from '@/contexts/SupabaseStorageContext';
import { AppData, Business } from '@/types/business';
import { VentureSetup } from './VentureSetup';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { cn } from '@/lib/utils';

type FlowState =
  | 'checking'      // scanning cloud storage
  | 'found'         // single venture found — confirm screen
  | 'picker'        // multiple ventures — choose one
  | 'importing'     // import in progress
  | 'new_venture'   // no backup → create new
  | 'idle';

interface LegacyOnboardingFlowProps {
  isOpen: boolean;
  onComplete: () => void;
}

const MODEL_ICON: Record<string, React.ReactNode> = {
  service: <Building2 className="w-4 h-4" />,
  product: <Package className="w-4 h-4" />,
  hybrid: <Layers className="w-4 h-4" />,
};

// ── Filter helpers ─────────────────────────────────────────────────────────────

function filterDataForBusiness(data: AppData, businessId: string): AppData {
  const business = data.businesses.find(b => b.id === businessId)!;

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

  const bizPayments = (data.payments || []).filter(p => {
    if (p.projectId && bizProjectIds.has(p.projectId)) return true;
    if ((p as any).retainerId && bizRetainerIds.has((p as any).retainerId)) return true;
    if ((p as any).taskId && bizQuickTaskIds.has((p as any).taskId)) return true;
    if (!p.projectId && !(p as any).retainerId) return true;
    return false;
  });

  const bizSalaryPayments = (data.salaryPayments || []).filter(sp =>
    bizSalaryRecordIds.has(sp.salaryRecordId)
  );

  const bizPayrollPeriods = (data.payrollPeriods || []).filter(p => p.businessId === businessId);
  const bizPayrollPeriodIds = new Set(bizPayrollPeriods.map(p => p.id));
  const bizPayslips = (data.payslips || []).filter(ps =>
    ps.businessId === businessId || bizPayrollPeriodIds.has(ps.payrollPeriodId)
  );

  const bizRenewalPayments = (data.renewalPayments || []).filter(rp =>
    bizRenewalIds.has(rp.renewalId)
  );

  const bizExtraPayments = (data.extraPayments || []).filter(ep => ep.businessId === businessId);

  const bizTodos = (data.todos || []).filter(t => {
    if (t.businessId === businessId) return true;
    if (t.linkedEntityId && (bizProjectIds.has(t.linkedEntityId) || bizRetainerIds.has(t.linkedEntityId))) return true;
    return false;
  });

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

/** Unwrap both wrapped { metadata, data } and raw AppData formats */
function unwrapBackup(raw: unknown): AppData | null {
  if (!raw || typeof raw !== 'object') return null;
  const r = raw as Record<string, unknown>;
  if (r.metadata && r.data && typeof r.data === 'object') {
    return r.data as AppData;
  }
  if (Array.isArray((r as AppData).businesses)) {
    return r as AppData;
  }
  return null;
}

/** Count entities for a specific business in a dataset */
function countForBusiness(data: AppData, b: Business) {
  const bizProjectIds = new Set(data.projects.filter(p => p.businessId === b.id).map(p => p.id));
  const bizRetainerIds = new Set((data.retainers || []).filter(r => r.businessId === b.id).map(r => r.id));
  const bizRenewalIds = new Set((data.renewals || []).filter(r => r.businessId === b.id).map(r => r.id));
  const bizSalaryIds = new Set((data.salaryRecords || []).filter(s => s.businessId === b.id).map(s => s.id));
  const bizQuickTaskIds = new Set((data.quickTasks || []).filter(t => t.businessId === b.id).map(t => t.id));

  const paymentCount = (data.payments || []).filter(p =>
    (p.projectId && bizProjectIds.has(p.projectId)) ||
    ((p as any).retainerId && bizRetainerIds.has((p as any).retainerId)) ||
    (!p.projectId && !(p as any).retainerId)
  ).length;

  const todoCount = (data.todos || []).filter(t =>
    t.businessId === b.id ||
    (t.linkedEntityId && (bizProjectIds.has(t.linkedEntityId) || bizRetainerIds.has(t.linkedEntityId)))
  ).length;

  return {
    projects: bizProjectIds.size,
    retainers: bizRetainerIds.size,
    renewals: bizRenewalIds.size,
    payments: paymentCount,
    todos: todoCount,
    salaries: bizSalaryIds.size,
    quickTasks: bizQuickTaskIds.size,
  };
}

// ── Component ──────────────────────────────────────────────────────────────────

export const LegacyOnboardingFlow: React.FC<LegacyOnboardingFlowProps> = ({ isOpen, onComplete }) => {
  const { importData } = useBusiness();
  const { downloadCloud } = useSupabaseStorage();

  const [flowState, setFlowState] = useState<FlowState>('checking');
  const [legacyData, setLegacyData] = useState<AppData | null>(null);
  const [selectedBusiness, setSelectedBusiness] = useState<Business | null>(null);
  const [scanError, setScanError] = useState<string | null>(null);
  const [importedIds, setImportedIds] = useState<string[]>([]);
  const [fileError, setFileError] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // ── Cloud scan ───────────────────────────────────────────────────────────────

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
        if (result?.data) {
          const unwrapped = unwrapBackup(result.data);
          if (unwrapped?.businesses?.length) { found = unwrapped; break; }
        }
      }

      if (!found) { setFlowState('new_venture'); return; }
      _handleFoundData(found);
    } catch (err) {
      console.error('[LegacyOnboarding] scan failed:', err);
      setScanError('Could not scan for existing data. Upload a JSON backup below or create a new venture.');
      setFlowState('new_venture');
    }
  }, [downloadCloud]);

  useEffect(() => {
    if (isOpen) scanForLegacyBackup();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen]);

  // ── File upload ──────────────────────────────────────────────────────────────

  const parseFileData = useCallback((text: string) => {
    try {
      const raw = JSON.parse(text);
      const appData = unwrapBackup(raw);
      if (!appData || !appData.businesses?.length) {
        setFileError('No venture data found in this file. Please check the file and try again.');
        return;
      }
      setFileError(null);
      _handleFoundData(appData);
    } catch {
      setFileError('Could not parse this file. Make sure it is a valid BizSuite JSON backup.');
    }
  }, []);

  const handleFileSelected = useCallback((file: File) => {
    if (!file.name.endsWith('.json')) {
      setFileError('Please select a .json backup file.');
      return;
    }
    const reader = new FileReader();
    reader.onload = (e) => parseFileData(e.target?.result as string);
    reader.readAsText(file);
  }, [parseFileData]);

  const handleFileDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) handleFileSelected(file);
  }, [handleFileSelected]);

  // ── Shared logic ─────────────────────────────────────────────────────────────

  function _handleFoundData(data: AppData) {
    setLegacyData(data);
    setImportedIds([]);
    setSelectedBusiness(null);
    if (data.businesses.length === 1) {
      setSelectedBusiness(data.businesses[0]);
      setFlowState('found');
    } else {
      setFlowState('picker');
    }
  }

  const _applyImport = async (appData: AppData, businessId?: string) => {
    setFlowState('importing');
    try {
      const { data: authData } = await supabase.auth.getUser();
      const user = authData.user;

      // CRITICAL: patch accountName to the CURRENT user's workspace_id
      // so _deriveWorkspaceId in SupabaseDBRepository uses the correct RLS workspace
      const workspaceId =
        user?.user_metadata?.workspace_id ||
        user?.user_metadata?.account_name ||
        user?.id || '';

      const patchedData: AppData = {
        ...appData,
        userSettings: {
          ...appData.userSettings,
          userId: user?.id || appData.userSettings?.userId || '',
          // Override accountName so data lands under the correct workspace_id
          accountName: workspaceId,
        },
      };

      // Clear migration flag so SupabaseDBRepository.import() writes all tables
      localStorage.removeItem('bizsuite-db-migrated-v2');

      // importData → repository.import() → _saveAsync() → writes ALL DB tables
      importData(JSON.stringify(patchedData));

      // Re-set the flag after import
      localStorage.setItem('bizsuite-db-migrated-v2', 'true');

      if (businessId) setImportedIds(prev => [...prev, businessId]);

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
    const counts = countForBusiness(legacyData, b);

    return (
      <div className="space-y-6">
        <div className="text-center">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-full bg-primary/10 mb-3">
            <Database className="w-7 h-7 text-primary" />
          </div>
          <h2 className="text-xl font-semibold text-foreground">We found your backup!</h2>
          <p className="text-sm text-muted-foreground mt-1">Your previous data is ready to restore.</p>
        </div>

        <div className="rounded-xl border border-border bg-muted/40 p-4 space-y-3">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center shrink-0 text-primary">
              {MODEL_ICON[b.businessModel] || <Building2 className="w-4 h-4" />}
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-semibold text-foreground truncate">{b.name}</p>
              <p className="text-xs text-muted-foreground capitalize">{b.businessModel} venture</p>
            </div>
            <Badge variant="secondary" className="text-xs shrink-0">{b.currency?.code || 'USD'}</Badge>
          </div>
          <div className="grid grid-cols-3 gap-2 pt-2 border-t border-border/50">
            {[
              { label: 'Projects', value: counts.projects },
              { label: 'Retainers', value: counts.retainers },
              { label: 'Renewals', value: counts.renewals },
              { label: 'Payments', value: counts.payments },
              { label: 'To-dos', value: counts.todos },
              { label: 'Salaries', value: counts.salaries },
            ].map(stat => (
              <div key={stat.label} className="text-center">
                <p className="text-base font-bold text-foreground">{stat.value}</p>
                <p className="text-xs text-muted-foreground">{stat.label}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="flex gap-3">
          <Button variant="outline" className="flex-1" onClick={() => setFlowState('new_venture')}>
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
      <div className="space-y-5">
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
              : `Found ${legacyData.businesses.length} ventures. Select each one to import into its own workspace.`}
          </p>
        </div>

        <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
          {legacyData.businesses.map(b => {
            const counts = countForBusiness(legacyData, b);
            const isSelected = selectedBusiness?.id === b.id;
            const isImported = importedIds.includes(b.id);
            return (
              <button
                key={b.id}
                onClick={() => !isImported && setSelectedBusiness(b)}
                disabled={isImported}
                className={cn(
                  'w-full p-3 rounded-xl border text-left flex items-start gap-3 transition-all',
                  isImported
                    ? 'border-border/40 bg-muted/20 opacity-60 cursor-default'
                    : isSelected
                    ? 'border-primary bg-primary/5 ring-1 ring-primary/30'
                    : 'border-border bg-card hover:border-primary/40 hover:bg-muted/40'
                )}
              >
                <div className={cn(
                  'w-9 h-9 rounded-lg flex items-center justify-center shrink-0 mt-0.5',
                  isImported ? 'bg-primary/10 text-primary' : 'bg-primary/10 text-primary'
                )}>
                  {isImported
                    ? <Check className="w-4 h-4" />
                    : (MODEL_ICON[b.businessModel] || <Building2 className="w-4 h-4" />)}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <p className="font-medium text-foreground truncate">{b.name}</p>
                    <Badge variant="secondary" className="text-xs shrink-0 capitalize">{b.businessModel}</Badge>
                    <span className="text-xs text-muted-foreground shrink-0">{b.currency?.code || 'USD'}</span>
                  </div>
                  <div className="flex flex-wrap gap-x-3 gap-y-0.5 text-xs text-muted-foreground">
                    <span>{counts.projects} project{counts.projects !== 1 ? 's' : ''}</span>
                    <span>{counts.retainers} retainer{counts.retainers !== 1 ? 's' : ''}</span>
                    <span>{counts.renewals} renewal{counts.renewals !== 1 ? 's' : ''}</span>
                    <span>{counts.payments} payment{counts.payments !== 1 ? 's' : ''}</span>
                    <span>{counts.salaries} salary record{counts.salaries !== 1 ? 's' : ''}</span>
                    {counts.todos > 0 && <span>{counts.todos} to-do{counts.todos !== 1 ? 's' : ''}</span>}
                  </div>
                </div>
                <div className="shrink-0 mt-1">
                  {isImported
                    ? <Badge variant="secondary" className="text-xs">Imported</Badge>
                    : isSelected && <Check className="w-4 h-4 text-primary" />}
                </div>
              </button>
            );
          })}
        </div>

        <div className="flex gap-3">
          {allDone ? (
            <Button className="flex-1 gap-2" onClick={onComplete}>
              <Check className="w-4 h-4" /> Done
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

  const renderFileUpload = () => (
    <div className="space-y-4">
      <div className="text-center pb-1">
        <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-primary/10 mb-2">
          <FileJson className="w-6 h-6 text-primary" />
        </div>
        <h3 className="text-base font-semibold text-foreground">Upload a backup file</h3>
        <p className="text-xs text-muted-foreground mt-0.5">Select a BizSuite JSON backup to import your ventures</p>
      </div>

      <div
        onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={handleFileDrop}
        onClick={() => fileInputRef.current?.click()}
        className={cn(
          'border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-colors',
          isDragging
            ? 'border-primary bg-primary/5'
            : 'border-border hover:border-primary/50 hover:bg-muted/30'
        )}
      >
        <Upload className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
        <p className="text-sm font-medium text-foreground">Drop your JSON file here</p>
        <p className="text-xs text-muted-foreground mt-1">or click to browse</p>
        <input
          ref={fileInputRef}
          type="file"
          accept=".json"
          className="hidden"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) handleFileSelected(file);
            e.target.value = '';
          }}
        />
      </div>

      {fileError && (
        <div className="flex items-start gap-2 p-3 rounded-lg bg-destructive/10 text-destructive text-sm">
          <CloudOff className="h-4 w-4 shrink-0 mt-0.5" />
          <span>{fileError}</span>
        </div>
      )}

      <div className="pt-1">
        <Button variant="outline" className="w-full" onClick={() => setFlowState('new_venture')}>
          Skip — Create New Venture Instead
        </Button>
      </div>
    </div>
  );

  const renderNewVenture = () => (
    <div className="space-y-4">
      {scanError && (
        <div className="flex items-center gap-2 p-3 rounded-lg bg-muted text-sm text-muted-foreground">
          <CloudOff className="h-4 w-4 shrink-0" />
          <span className="flex-1">{scanError}</span>
          <Button variant="ghost" size="sm" onClick={scanForLegacyBackup} className="shrink-0">Retry</Button>
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

  // Top-level tabs shown only during new_venture state (when no data found)
  const showTabs = flowState === 'new_venture';

  return (
    <Dialog open={isOpen} onOpenChange={() => { /* prevent accidental close */ }}>
      <DialogContent
        className="sm:max-w-md w-full max-h-[90vh] overflow-y-auto"
        onInteractOutside={e => e.preventDefault()}
        onEscapeKeyDown={e => e.preventDefault()}
      >
        {flowState === 'checking' && renderChecking()}
        {flowState === 'importing' && renderImporting()}
        {flowState === 'found' && renderFound()}
        {flowState === 'picker' && renderPicker()}

        {showTabs && (
          <Tabs defaultValue="new">
            <TabsList className="w-full mb-4">
              <TabsTrigger value="new" className="flex-1 gap-1.5">
                <Plus className="w-3.5 h-3.5" />
                New Venture
              </TabsTrigger>
              <TabsTrigger value="cloud" className="flex-1 gap-1.5">
                <Cloud className="w-3.5 h-3.5" />
                Cloud Scan
              </TabsTrigger>
              <TabsTrigger value="file" className="flex-1 gap-1.5">
                <Upload className="w-3.5 h-3.5" />
                Upload File
              </TabsTrigger>
            </TabsList>
            <TabsContent value="new">
              {renderNewVenture()}
            </TabsContent>
            <TabsContent value="cloud">
              <div className="space-y-4">
                <div className="text-center pb-1">
                  <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-primary/10 mb-2">
                    <Cloud className="w-6 h-6 text-primary" />
                  </div>
                  <h3 className="text-base font-semibold text-foreground">Scan cloud backup</h3>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Re-scan your Supabase Storage for a legacy backup
                  </p>
                </div>
                {scanError && (
                  <div className="flex items-start gap-2 p-3 rounded-lg bg-destructive/10 text-destructive text-sm">
                    <CloudOff className="h-4 w-4 shrink-0 mt-0.5" />
                    <span>{scanError}</span>
                  </div>
                )}
                <Button className="w-full gap-2" onClick={scanForLegacyBackup}>
                  <Database className="w-4 h-4" />
                  Scan for Backup
                </Button>
              </div>
            </TabsContent>
            <TabsContent value="file">
              {renderFileUpload()}
            </TabsContent>
          </Tabs>
        )}
      </DialogContent>
    </Dialog>
  );
};
