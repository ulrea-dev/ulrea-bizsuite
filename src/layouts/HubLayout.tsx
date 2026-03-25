import React, { useEffect, useState } from 'react';
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
import { ProfileSetupModal } from '@/components/ProfileSetupModal';
import { supabase } from '@/integrations/supabase/client';

const LayoutContent: React.FC = () => {
  const navigate = useNavigate();
  const { data, dispatch, isLoadingFromDB } = useBusiness();
  const {
    disconnect,
    isConnected,
    currentAccount,
    availableAccounts,
    legacyFolders,
    showAccountSelection,
    isDiscoveringAccounts,
    selectAccount,
    createAccount,
    migrateAccount,
    closeAccountSelection,
  } = useGoogleDrive();

  const [userEmail, setUserEmail] = useState('');

  useAppearance();

  // Sync Supabase auth user.id into app state
  useEffect(() => {
    supabase.auth.getUser().then(({ data: authData }) => {
      const user = authData.user;
      if (!user) return;
      if (user.email) setUserEmail(user.email);
      // Ensure userId is always the real Supabase user.id
      if (data.userSettings.userId !== user.id) {
        dispatch({ type: 'SET_USER_ID', payload: user.id });
      }
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // NOTE: We intentionally do NOT auto-discover Google Drive accounts on load.
  // Google Drive is now an optional external archive only (not the primary storage).
  // The AccountSelectionModal should only appear when the user explicitly uses a
  // Drive feature, not on every page load. Auto-discovery was causing the modal
  // to pop up on /settings even when users aren't using Drive.

  const handleLogout = async () => {
    if (isConnected) {
      disconnect();
    }
    await supabase.auth.signOut();
    navigate('/login');
  };

  // Determine if current user is invited (they have an entry in userBusinessAccess)
  const isInvitedUser = !!(data.userBusinessAccess?.length &&
    data.userBusinessAccess.find(a => a.userId === data.userSettings.userId));

  // Profile setup modal: show only if username is genuinely missing (after DB load completes)
  // The modal itself will detect whether they need a workspace name or not
  const needsProfileSetup = !isLoadingFromDB && !data.userSettings.username?.trim();

  return (
    <SidebarProvider>
      <div className="flex min-h-screen w-full bg-background overflow-x-hidden">
        <HubSidebar onLogout={handleLogout} />
        <SidebarInset>
          <MobileHeader title="Work OS" onLogout={handleLogout} />
          <div className="flex-1 p-3 sm:p-4 md:p-6 overflow-y-auto pb-20 md:pb-6">
            <Outlet />
          </div>
        </SidebarInset>
      </div>
      <BottomTabBar />

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

      <ProfileSetupModal
        isOpen={needsProfileSetup}
        userEmail={userEmail}
        isInvitedUser={isInvitedUser}
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
