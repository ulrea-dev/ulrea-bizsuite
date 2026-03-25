/**
 * LegacyOnboardingFlow
 *
 * Shown when a logged-in user has no ventures in the DB yet.
 * Steps:
 *   1. Silently check Supabase Storage for a legacy JSON backup (by userId path)
 *   2a. If backup found with multiple businesses → show LegacyImportBusinessPickerModal
 *   2b. If backup found with single business → auto-import it
 *   3. If no backup → show VentureSetup (create a new venture from scratch)
 *
 * This ensures existing users never lose their data on the new DB-backed architecture.
 */

import React, { useEffect, useState, useCallback } from 'react';
import { Loader2, Database, CloudOff } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useBusiness } from '@/contexts/BusinessContext';
import { useSupabaseStorage } from '@/contexts/SupabaseStorageContext';
import { AppData } from '@/types/business';
import { LegacyImportBusinessPickerModal } from './LegacyImportBusinessPickerModal';
import { VentureSetup } from './VentureSetup';
import { Button } from '@/components/ui/button';

type FlowState =
  | 'checking'        // scanning storage for legacy backup
  | 'picker'          // found multiple businesses → user picks one
  | 'importing'       // importing the chosen business
  | 'new_venture'     // no backup found → create new
  | 'idle';           // done / hidden

interface LegacyOnboardingFlowProps {
  /** Called when the flow is complete (either imported or created) */
  onComplete: () => void;
}

export const LegacyOnboardingFlow: React.FC<LegacyOnboardingFlowProps> = ({ onComplete }) => {
  const { importData, data } = useBusiness();
  const { downloadCloud, uploadNow } = useSupabaseStorage();

  const [flowState, setFlowState] = useState<FlowState>('checking');
  const [legacyData, setLegacyData] = useState<AppData | null>(null);
  const [scanError, setScanError] = useState<string | null>(null);

  /** Scan storage for a backup JSON under the user's own userId path */
  const scanForLegacyBackup = useCallback(async () => {
    setFlowState('checking');
    setScanError(null);
    try {
      const { data: authData } = await supabase.auth.getUser();
      const user = authData.user;
      if (!user) {
        setFlowState('new_venture');
        return;
      }

      // Try multiple path variants the user might have stored under:
      // 1. Their userId directly
      // 2. Their account_name slug (if set in metadata)
      const pathsToTry: string[] = [user.id];
      const meta = user.user_metadata;
      if (meta?.account_name) {
        const slug = String(meta.account_name).toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
        if (slug && slug !== user.id) pathsToTry.push(slug);
      }

      let found: AppData | null = null;
      for (const pathKey of pathsToTry) {
        const result = await downloadCloud(pathKey);
        if (result?.data?.businesses?.length) {
          found = result.data;
          break;
        }
      }

      if (!found) {
        // No legacy backup — start fresh
        setFlowState('new_venture');
        return;
      }

      if (found.businesses.length === 1) {
        // Single business — auto-import without asking
        setFlowState('importing');
        await _applyImport(found);
        return;
      }

      // Multiple businesses — let user pick
      setLegacyData(found);
      setFlowState('picker');
    } catch (err) {
      console.error('[LegacyOnboarding] scan failed:', err);
      setScanError('Could not scan for existing data. You can create a new venture or retry.');
      setFlowState('new_venture');
    }
  }, [downloadCloud]);

  useEffect(() => {
    scanForLegacyBackup();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const _applyImport = async (appData: AppData) => {
    setFlowState('importing');
    try {
      importData(JSON.stringify(appData));
      // Also push to Supabase Storage so it's backed up under new path
      await uploadNow(appData);
    } catch (err) {
      console.error('[LegacyOnboarding] import error:', err);
    } finally {
      onComplete();
    }
  };

  // ── Render states ────────────────────────────────────────────────────────────

  if (flowState === 'checking' || flowState === 'importing') {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
        <div className="p-4 rounded-full bg-primary/10">
          {flowState === 'checking'
            ? <Database className="h-8 w-8 text-primary animate-pulse" />
            : <Loader2 className="h-8 w-8 text-primary animate-spin" />
          }
        </div>
        <div className="text-center">
          <p className="text-base font-medium text-foreground">
            {flowState === 'checking' ? 'Checking for existing data…' : 'Importing your venture…'}
          </p>
          <p className="text-sm text-muted-foreground mt-1">
            {flowState === 'checking'
              ? 'Looking for any previous backup of your workspace'
              : 'Restoring your data, this will only take a moment'
            }
          </p>
        </div>
      </div>
    );
  }

  if (flowState === 'picker' && legacyData) {
    return (
      <LegacyImportBusinessPickerModal
        isOpen
        onClose={() => {
          // User dismissed picker — fall through to new venture setup
          setFlowState('new_venture');
        }}
        backupData={legacyData}
        onConfirm={_applyImport}
        isImporting={false}
      />
    );
  }

  // flowState === 'new_venture'
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] px-4">
      {scanError && (
        <div className="flex items-center gap-2 mb-6 p-3 rounded-lg bg-muted text-sm text-muted-foreground max-w-md w-full">
          <CloudOff className="h-4 w-4 shrink-0" />
          {scanError}
          <Button variant="ghost" size="sm" onClick={scanForLegacyBackup} className="ml-auto shrink-0">
            Retry
          </Button>
        </div>
      )}
      <VentureSetup onComplete={onComplete} />
    </div>
  );
};
