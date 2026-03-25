import React, { useState } from 'react';
import { ChevronDown, ChevronRight, Building2, User, Clock, Users } from 'lucide-react';

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

interface WorkspaceTableProps {
  workspaces: Workspace[];
  searchQuery: string;
}

const timeAgo = (iso: string | null): string => {
  if (!iso) return '—';
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  if (days < 30) return `${days}d ago`;
  return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
};

export const WorkspaceTable: React.FC<WorkspaceTableProps> = ({ workspaces, searchQuery }) => {
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const filtered = workspaces.filter((ws) => {
    const q = searchQuery.toLowerCase();
    return (
      ws.workspace_name.toLowerCase().includes(q) ||
      (ws.owner_email || '').toLowerCase().includes(q) ||
      (ws.owner_display_name || '').toLowerCase().includes(q)
    );
  });

  if (filtered.length === 0) {
    return (
      <div className="bg-gray-900 border border-gray-800 rounded-xl p-12 text-center">
        <Building2 className="w-10 h-10 text-gray-700 mx-auto mb-3" />
        <p className="text-gray-500 text-sm">
          {searchQuery ? 'No workspaces match your search.' : 'No workspaces registered yet.'}
        </p>
        <p className="text-gray-600 text-xs mt-1">
          Workspaces appear here when users connect Google Drive.
        </p>
      </div>
    );
  }

  return (
    <div className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden">
      {/* Table header */}
      <div className="grid grid-cols-[1fr_1fr_120px_120px_40px] gap-4 px-5 py-3 border-b border-gray-800 bg-gray-800/50">
        <p className="text-gray-500 text-xs font-medium uppercase tracking-wide">Workspace</p>
        <p className="text-gray-500 text-xs font-medium uppercase tracking-wide">Owner</p>
        <p className="text-gray-500 text-xs font-medium uppercase tracking-wide">Members</p>
        <p className="text-gray-500 text-xs font-medium uppercase tracking-wide">Last Sync</p>
        <div />
      </div>

      {/* Rows */}
      <div className="divide-y divide-gray-800">
        {filtered.map((ws) => {
          const isExpanded = expandedId === ws.id;
          const memberCount = ws.workspace_members.length;
          return (
            <div key={ws.id}>
              {/* Main row */}
              <button
                onClick={() => setExpandedId(isExpanded ? null : ws.id)}
                className="w-full grid grid-cols-[1fr_1fr_120px_120px_40px] gap-4 px-5 py-4 hover:bg-gray-800/40 transition-colors text-left"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-8 h-8 rounded-lg bg-indigo-600/20 flex items-center justify-center shrink-0">
                    <Building2 className="w-4 h-4 text-indigo-400" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-white text-sm font-medium truncate">{ws.workspace_name}</p>
                    <p className="text-gray-600 text-xs truncate font-mono">{ws.folder_id.slice(0, 16)}…</p>
                  </div>
                </div>
                <div className="flex items-center gap-2 min-w-0">
                  <div className="w-6 h-6 rounded-full bg-gray-700 flex items-center justify-center shrink-0">
                    <User className="w-3 h-3 text-gray-400" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-gray-200 text-sm truncate">{ws.owner_display_name || ws.owner_email || '—'}</p>
                    {ws.owner_display_name && ws.owner_email && (
                      <p className="text-gray-500 text-xs truncate">{ws.owner_email}</p>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Users className="w-3.5 h-3.5 text-gray-500" />
                  <span className="text-gray-300 text-sm">{memberCount}</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5 text-gray-500" />
                  <span className="text-gray-400 text-sm">{timeAgo(ws.last_sync_at)}</span>
                </div>
                <div className="flex items-center justify-center">
                  {isExpanded
                    ? <ChevronDown className="w-4 h-4 text-gray-500" />
                    : <ChevronRight className="w-4 h-4 text-gray-500" />
                  }
                </div>
              </button>

              {/* Expanded members */}
              {isExpanded && (
                <div className="px-5 pb-4 bg-gray-800/30">
                  <p className="text-gray-500 text-xs font-medium uppercase tracking-wide mb-3 pt-2">Team Members</p>
                  {memberCount === 0 ? (
                    <p className="text-gray-600 text-sm">No team members registered for this workspace.</p>
                  ) : (
                    <div className="space-y-2">
                      {ws.workspace_members.map((member) => (
                        <div key={member.id} className="flex items-center justify-between py-2 px-3 bg-gray-800 rounded-lg">
                          <div className="flex items-center gap-3">
                            <div className="w-7 h-7 rounded-full bg-gray-700 flex items-center justify-center">
                              <User className="w-3 h-3 text-gray-400" />
                            </div>
                            <div>
                              <p className="text-gray-200 text-sm">{member.member_display_name || member.member_email || '—'}</p>
                              {member.member_display_name && member.member_email && (
                                <p className="text-gray-500 text-xs">{member.member_email}</p>
                              )}
                            </div>
                          </div>
                          <div className="flex items-center gap-4">
                            <span className="text-gray-500 text-xs capitalize">{member.role || 'member'}</span>
                            <span className="text-gray-600 text-xs">{timeAgo(member.last_seen_at)}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};
