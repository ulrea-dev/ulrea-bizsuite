import React, { useEffect, useState, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Badge } from '@/components/ui/badge';
import { Briefcase, ChevronDown, Plus, Loader2, Check } from 'lucide-react';
import { useBusiness } from '@/contexts/BusinessContext';
import { supabase } from '@/integrations/supabase/client';

interface VentureWorkspace {
  id: string;
  account_name: string;
  workspace_name: string | null;
}

interface VentureSwitcherProps {
  onCreateVenture: () => void;
}

export const VentureSwitcher: React.FC<VentureSwitcherProps> = ({ onCreateVenture }) => {
  const { currentBusiness, switchVenture, isLoadingFromDB } = useBusiness();
  const [ventures, setVentures] = useState<VentureWorkspace[]>([]);
  const [isSwitching, setIsSwitching] = useState(false);
  const [currentWorkspaceId, setCurrentWorkspaceId] = useState<string | null>(null);

  const loadVentures = useCallback(async () => {
    const { data: authData } = await supabase.auth.getUser();
    if (!authData.user) return;
    const meta = authData.user.user_metadata;
    setCurrentWorkspaceId(meta?.workspace_id || authData.user.id);

    const { data } = await supabase
      .from('workspaces')
      .select('id, account_name, workspace_name')
      .eq('owner_user_id', authData.user.id)
      .order('created_at');
    if (data) setVentures(data);
  }, []);

  useEffect(() => { loadVentures(); }, [loadVentures]);

  const handleSwitch = async (venture: VentureWorkspace) => {
    if (venture.id === currentWorkspaceId || isSwitching) return;
    setIsSwitching(true);
    try {
      await switchVenture(venture.id);
      setCurrentWorkspaceId(venture.id);
    } finally {
      setIsSwitching(false);
    }
  };

  const ventureName = currentBusiness?.name || ventures.find(v => v.id === currentWorkspaceId)?.workspace_name || 'My Venture';

  if (isLoadingFromDB || isSwitching) {
    return (
      <Button variant="outline" className="w-full justify-start gap-2" disabled>
        <Loader2 className="h-4 w-4 animate-spin" />
        <span className="truncate">{isSwitching ? 'Switching…' : 'Loading…'}</span>
      </Button>
    );
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" className="w-full justify-between gap-2">
          <div className="flex items-center gap-2 min-w-0">
            <Briefcase className="h-4 w-4 shrink-0" />
            <span className="truncate font-medium text-left">{ventureName}</span>
          </div>
          <ChevronDown className="h-4 w-4 shrink-0 text-muted-foreground" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-72" align="start">
        {ventures.length > 0 && (
          <>
            <div className="px-2 py-1.5 text-xs font-medium text-muted-foreground uppercase tracking-wider">
              Your Ventures
            </div>
            {ventures.map((venture) => {
              const isCurrent = venture.id === currentWorkspaceId;
              return (
                <DropdownMenuItem
                  key={venture.id}
                  onClick={() => handleSwitch(venture)}
                  className="flex items-center justify-between gap-2 cursor-pointer"
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <Briefcase className="h-4 w-4 shrink-0 text-muted-foreground" />
                    <span className="truncate">{venture.workspace_name || venture.account_name}</span>
                  </div>
                  {isCurrent && <Check className="h-4 w-4 text-primary shrink-0" />}
                  {!isCurrent && <Badge variant="outline" className="text-xs shrink-0">Switch</Badge>}
                </DropdownMenuItem>
              );
            })}
            <DropdownMenuSeparator />
          </>
        )}
        <DropdownMenuItem onClick={onCreateVenture} className="flex items-center gap-2 cursor-pointer">
          <Plus className="h-4 w-4" />
          Create New Venture
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};
