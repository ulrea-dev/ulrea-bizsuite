import React from 'react';
import { Outlet, useNavigate } from 'react-router-dom';
import { AppSidebar } from '@/components/AppSidebar';
import { SidebarProvider, SidebarInset } from '@/components/ui/sidebar';
import { ThemeProvider } from '@/hooks/useTheme';
import { useAppearance } from '@/hooks/useAppearance';
import { useBusiness } from '@/contexts/BusinessContext';

const LayoutContent: React.FC = () => {
  const navigate = useNavigate();
  const { dispatch } = useBusiness();
  
  useAppearance();

  const handleLogout = () => {
    navigate('/login');
  };

  const handleCreateBusiness = () => {
    console.log('Create business triggered');
  };

  return (
    <SidebarProvider>
      <div className="flex min-h-screen w-full bg-background">
        <AppSidebar 
          onLogout={handleLogout}
          onCreateBusiness={handleCreateBusiness}
        />
        <SidebarInset>
          <div className="p-3 sm:p-4 md:p-6 overflow-y-auto">
            <Outlet />
          </div>
        </SidebarInset>
      </div>
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
