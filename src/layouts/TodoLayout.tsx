import React from 'react';
import { Outlet, useNavigate } from 'react-router-dom';
import { TodoSidebar } from '@/components/TodoSidebar';
import { SidebarProvider, SidebarInset } from '@/components/ui/sidebar';
import { ThemeProvider } from '@/hooks/useTheme';
import { useAppearance } from '@/hooks/useAppearance';
import { MobileHeader } from '@/components/MobileHeader';

const LayoutContent: React.FC = () => {
  const navigate = useNavigate();
  
  useAppearance();

  const handleBackToApp = () => {
    navigate('/dashboard');
  };

  return (
    <SidebarProvider>
      <div className="flex min-h-screen w-full bg-background">
        <TodoSidebar onBackToApp={handleBackToApp} />
        <SidebarInset>
          <MobileHeader title="To-Do List" />
          <div className="flex-1 p-3 sm:p-4 md:p-6 overflow-y-auto">
            <Outlet />
          </div>
        </SidebarInset>
      </div>
    </SidebarProvider>
  );
};

export const TodoLayout: React.FC = () => {
  return (
    <ThemeProvider>
      <LayoutContent />
    </ThemeProvider>
  );
};
