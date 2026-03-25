import React, { useEffect } from 'react';
import { Outlet, useNavigate } from 'react-router-dom';
import { HubSidebar } from '@/components/HubSidebar';
import { SidebarProvider, SidebarInset } from '@/components/ui/sidebar';
import { ThemeProvider } from '@/hooks/useTheme';
import { useAppearance } from '@/hooks/useAppearance';
import { useBusiness } from '@/contexts/BusinessContext';
import { useGoogleDrive } from '@/contexts/GoogleDriveContext';
import { MobileHeader } from '@/components/MobileHeader';
import { BottomTabBar } from '@/components/BottomTabBar';
import { AccountSelectionModal } from '@/components/AccountSelectionModal';

const LayoutContent: React.FC = () => {
  const navigate = useNavigate();
  const { dispatch } = useBusiness();
  const {
    disconnect,
    isConnected,
    currentAccount,
    availableAccounts,
    legacyFolders,
    showAccountSelection,
    isDiscoveringAccounts,
    discoverAccounts,
    selectAccount,
    createAccount,
    migrateAccount,
    closeAccountSelection,
  } = useGoogleDrive();

  useAppearance();

  // After login, if connected to Google but no workspace selected, prompt for workspace
  useEffect(() => {
    if (isConnected && !currentAccount) {
      discoverAccounts();
    }
  }, [isConnected, currentAccount, discoverAccounts]);

  const handleLogout = () => {
    if (isConnected) {
      disconnect();
    }
    navigate('/login');
  };

  return (
    <SidebarProvider>
      <div className="flex min-h-screen w-full bg-background overflow-x-hidden">
        <HubSidebar
          onLogout={handleLogout}
        />
        <SidebarInset>
          <MobileHeader title="Work OS" onLogout={handleLogout} />
          <div className="flex-1 p-3 sm:p-4 md:p-6 overflow-y-auto pb-20 md:pb-6">
            <Outlet />
          </div>
        </SidebarInset>
      </div>
      <BottomTabBar />

      {/* Workspace selection - shown after login when connected but no workspace */}
      <AccountSelectionModal
        isOpen={showAccountSelection}
        onClose={closeAccountSelection}
        accounts={availableAccounts}
        legacyFolders={legacyFolders}
        onSelectAccount={selectAccount}
        onCreateAccount={async (name) => { await createAccount(name); }}
        onMigrateLegacy={async (folderId, name) => { await migrateAccount(folderId, name); }}
        isLoading={isDiscoveringAccounts}
        connectedEmail={null}
      />
    </SidebarProvider>
  );
};

export const HubLayout: React.FC = () => {
  return (
    <ThemeProvider>
      <LayoutContent />
    </ThemeProvider>
  );
};
