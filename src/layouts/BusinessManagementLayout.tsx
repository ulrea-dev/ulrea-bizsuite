import React from 'react';
import { Outlet, useNavigate } from 'react-router-dom';
import { AdminSidebar } from '@/components/AdminSidebar';
import { SidebarProvider, SidebarInset } from '@/components/ui/sidebar';
import { ThemeProvider } from '@/hooks/useTheme';
import { useAppearance } from '@/hooks/useAppearance';
import { MobileHeader } from '@/components/MobileHeader';
import { BottomTabBar } from '@/components/BottomTabBar';
import { MobileSubNav } from '@/components/MobileSubNav';

const backOfficeSubNav = [
  { label: 'Overview', path: '/business-management' },
  { label: 'Businesses', path: '/business-management/businesses' },
  { label: 'Access', path: '/business-management/business-access' },
  { label: 'Team', path: '/business-management/team-members' },
  { label: 'Bank Accounts', path: '/business-management/bank-accounts' },
  { label: 'Partners', path: '/business-management/partners' },
  { label: 'Allocations', path: '/business-management/partner-allocations' },
  { label: 'Payables', path: '/business-management/payables' },
  { label: 'Receivables', path: '/business-management/receivables' },
];

const LayoutContent: React.FC = () => {
  const navigate = useNavigate();
  
  useAppearance();

  const handleBackToApp = () => {
    navigate('/dashboard');
  };

  return (
    <SidebarProvider>
      <div className="flex min-h-screen w-full bg-background">
        <AdminSidebar onBackToApp={handleBackToApp} />
        <SidebarInset>
          <MobileHeader title="Back Office" />
          <MobileSubNav items={backOfficeSubNav} />
          <div className="flex-1 p-3 sm:p-4 md:p-6 overflow-y-auto pb-20 md:pb-6">
            <Outlet />
          </div>
        </SidebarInset>
      </div>
      <BottomTabBar />
    </SidebarProvider>
  );
};

export const BusinessManagementLayout: React.FC = () => {
  return (
    <ThemeProvider>
      <LayoutContent />
    </ThemeProvider>
  );
};
