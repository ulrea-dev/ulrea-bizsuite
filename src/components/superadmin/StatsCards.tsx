import React from 'react';
import { Building2, Users, Activity, Clock } from 'lucide-react';

interface StatsCardsProps {
  totalWorkspaces: number;
  totalMembers: number;
  activeRecently: number;
  latestSync: string | null;
}

export const StatsCards: React.FC<StatsCardsProps> = ({
  totalWorkspaces,
  totalMembers,
  activeRecently,
  latestSync,
}) => {
  const stats = [
    {
      label: 'Total Workspaces',
      value: totalWorkspaces,
      icon: Building2,
      color: 'text-indigo-400',
      bg: 'bg-indigo-600/10',
    },
    {
      label: 'Workspace Members',
      value: totalMembers,
      icon: Users,
      color: 'text-emerald-400',
      bg: 'bg-emerald-600/10',
    },
    {
      label: 'Active (30 days)',
      value: activeRecently,
      icon: Activity,
      color: 'text-amber-400',
      bg: 'bg-amber-600/10',
    },
    {
      label: 'Last Sync',
      value: latestSync
        ? new Date(latestSync).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
        : '—',
      icon: Clock,
      color: 'text-sky-400',
      bg: 'bg-sky-600/10',
    },
  ];

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      {stats.map(({ label, value, icon: Icon, color, bg }) => (
        <div key={label} className="bg-gray-900 border border-gray-800 rounded-xl p-5">
          <div className={`w-9 h-9 rounded-lg ${bg} flex items-center justify-center mb-3`}>
            <Icon className={`w-4 h-4 ${color}`} />
          </div>
          <p className="text-gray-400 text-xs mb-1">{label}</p>
          <p className="text-white text-2xl font-bold">{value}</p>
        </div>
      ))}
    </div>
  );
};
