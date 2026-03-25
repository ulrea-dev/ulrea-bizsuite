import React from 'react';
import { Outlet, NavLink } from 'react-router-dom';
import { Shield, LayoutDashboard, Building2, Users, LogOut } from 'lucide-react';
import { useSuperAdmin } from '@/hooks/useSuperAdmin';
import { Loader2 } from 'lucide-react';

const navItems = [
  { to: '/super-admin/dashboard', icon: LayoutDashboard, label: 'Overview' },
  { to: '/super-admin/workspaces', icon: Building2, label: 'Workspaces' },
  { to: '/super-admin/users', icon: Users, label: 'Users' },
];

export const SuperAdminLayout: React.FC = () => {
  const { user, isAuthorized, isLoading, signOut } = useSuperAdmin();

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-950 flex items-center justify-center">
        <Loader2 className="w-6 h-6 text-indigo-400 animate-spin" />
      </div>
    );
  }

  if (!isAuthorized) return null;

  return (
    <div className="min-h-screen bg-gray-950 flex">
      {/* Sidebar */}
      <aside className="w-60 shrink-0 bg-gray-900 border-r border-gray-800 flex flex-col">
        {/* Logo */}
        <div className="flex items-center gap-3 px-5 py-5 border-b border-gray-800">
          <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center shrink-0">
            <Shield className="w-4 h-4 text-white" />
          </div>
          <div>
            <p className="text-white text-sm font-semibold leading-none">WorkOS</p>
            <p className="text-indigo-400 text-xs mt-0.5">Super Admin</p>
          </div>
        </div>

        {/* Nav */}
        <nav className="flex-1 px-3 py-4 space-y-1">
          {navItems.map(({ to, icon: Icon, label }) => (
            <NavLink
              key={to}
              to={to}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-colors ${
                  isActive
                    ? 'bg-indigo-600/20 text-indigo-300 font-medium'
                    : 'text-gray-400 hover:text-gray-200 hover:bg-gray-800'
                }`
              }
            >
              <Icon className="w-4 h-4 shrink-0" />
              {label}
            </NavLink>
          ))}
        </nav>

        {/* Footer */}
        <div className="px-3 py-4 border-t border-gray-800 space-y-1">
          <div className="px-3 py-2">
            <p className="text-gray-500 text-xs truncate">{user?.email}</p>
          </div>
          <button
            onClick={signOut}
            className="flex items-center gap-3 w-full px-3 py-2.5 rounded-lg text-sm text-gray-400 hover:text-red-400 hover:bg-red-950/30 transition-colors"
          >
            <LogOut className="w-4 h-4 shrink-0" />
            Sign Out
          </button>
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1 overflow-y-auto">
        <Outlet />
      </main>
    </div>
  );
};
