import React, { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { StatsCards } from '@/components/superadmin/StatsCards';
import { WorkspaceTable } from '@/components/superadmin/WorkspaceTable';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Search, RefreshCw, Loader2 } from 'lucide-react';

interface WorkspaceMember {
  id: string;
  member_email: string | null;
  member_display_name: string | null;
  role: string | null;
  last_seen_at: string | null;
}

interface Workspace {
  id: string;
  folder_id: string;
  workspace_name: string;
  owner_email: string | null;
  owner_display_name: string | null;
  last_sync_at: string | null;
  created_at: string | null;
  workspace_members: WorkspaceMember[];
}

const SuperAdminDashboard: React.FC = () => {
  const [workspaces, setWorkspaces] = useState<Workspace[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  const fetchData = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('workspace_registry')
        .select(`
          id,
          folder_id,
          workspace_name,
          owner_email,
          owner_display_name,
          last_sync_at,
          created_at,
          workspace_members (
            id,
            member_email,
            member_display_name,
            role,
            last_seen_at
          )
        `)
        .order('last_sync_at', { ascending: false });

      if (error) throw error;
      setWorkspaces((data as Workspace[]) || []);
    } catch (err) {
      console.error('Failed to load workspaces:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Compute stats
  const totalWorkspaces = workspaces.length;
  const totalMembers = workspaces.reduce((sum, ws) => sum + ws.workspace_members.length, 0);
  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
  const activeRecently = workspaces.filter(
    (ws) => ws.last_sync_at && ws.last_sync_at > thirtyDaysAgo
  ).length;
  const latestSync = workspaces.length > 0 ? workspaces[0].last_sync_at : null;

  return (
    <div className="p-6 lg:p-8 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-white text-2xl font-bold">Overview</h1>
          <p className="text-gray-500 text-sm mt-0.5">All registered workspaces across WorkOS</p>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={fetchData}
          disabled={isLoading}
          className="border-gray-700 text-gray-300 hover:bg-gray-800 hover:text-white"
        >
          {isLoading ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <RefreshCw className="w-4 h-4" />
          )}
          <span className="ml-2">Refresh</span>
        </Button>
      </div>

      {/* Stats */}
      <StatsCards
        totalWorkspaces={totalWorkspaces}
        totalMembers={totalMembers}
        activeRecently={activeRecently}
        latestSync={latestSync}
      />

      {/* Workspace table */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-white text-lg font-semibold">Workspaces</h2>
          <div className="relative w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
            <Input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search workspaces…"
              className="pl-9 bg-gray-800 border-gray-700 text-white placeholder:text-gray-500 focus-visible:ring-indigo-500"
            />
          </div>
        </div>

        {isLoading ? (
          <div className="bg-gray-900 border border-gray-800 rounded-xl p-12 flex items-center justify-center">
            <Loader2 className="w-6 h-6 text-indigo-400 animate-spin" />
          </div>
        ) : (
          <WorkspaceTable workspaces={workspaces} searchQuery={searchQuery} />
        )}
      </div>
    </div>
  );
};

export default SuperAdminDashboard;
