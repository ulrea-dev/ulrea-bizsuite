// Dashboard layout component with sidebar and theme support
import React from 'react';
import { Outlet, useNavigate } from 'react-router-dom';
import { AppSidebar } from '@/components/AppSidebar';
import { SidebarProvider, SidebarInset } from '@/components/ui/sidebar';
import { ThemeProvider } from '@/hooks/useTheme';
import { useAppearance } from '@/hooks/useAppearance';
import { useBusiness } from '@/contexts/BusinessContext';
import { useGoogleDrive } from '@/contexts/GoogleDriveContext';
import { MobileHeader } from '@/components/MobileHeader';
import { BottomTabBar } from '@/components/BottomTabBar';

const LayoutContent: React.FC = () => {
  const navigate = useNavigate();
  const { dispatch } = useBusiness();
  const { disconnect, isConnected } = useGoogleDrive();
  
  useAppearance();

  const handleLogout = () => {
    if (isConnected) {
      disconnect();
    }
    navigate('/login');
  };

  const handleCreateBusiness = () => {
    console.log('Create business triggered');
  };

  return (
    <SidebarProvider>
      <div className="flex min-h-screen w-full bg-background overflow-x-hidden">
        <AppSidebar 
          onLogout={handleLogout}
          onCreateBusiness={handleCreateBusiness}
        />
        <SidebarInset className="overflow-x-hidden">
          <MobileHeader title="Operations" />
          <div className="flex-1 p-3 sm:p-4 md:p-6 overflow-y-auto pb-20 md:pb-6">
            <Outlet />
          </div>
        </SidebarInset>
      </div>
      <BottomTabBar />
    </SidebarProvider>
  );
};

export const DashboardLayout: React.FC = () => {
  return (
    <ThemeProvider>
      <LayoutContent />
    </ThemeProvider>
  );
};
