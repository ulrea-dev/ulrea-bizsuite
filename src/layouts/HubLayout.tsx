import React, { useEffect, useState, useRef } from 'react';
import { Outlet, useNavigate } from 'react-router-dom';
import { HubSidebar } from '@/components/HubSidebar';
import { SidebarProvider, SidebarInset } from '@/components/ui/sidebar';
import { ThemeProvider } from '@/hooks/useTheme';
import { useAppearance } from '@/hooks/useAppearance';
import { useBusiness } from '@/contexts/BusinessContext';
import { useGoogleDrive } from '@/contexts/GoogleDriveContext';
import { useSupabaseStorage } from '@/contexts/SupabaseStorageContext';
import { MobileHeader } from '@/components/MobileHeader';
import { BottomTabBar } from '@/components/BottomTabBar';
import { AccountSelectionModal } from '@/components/AccountSelectionModal';
import { ProfileSetupModal } from '@/components/ProfileSetupModal';
import { supabase } from '@/integrations/supabase/client';
import { filterDataForUser, getUserAccessibleBusinessIds } from '@/utils/filterDataForUser';
import { deriveStoragePath } from '@/repositories/SupabaseStorageRepository';

const LayoutContent: React.FC = () => {
  const navigate = useNavigate();
  const { data, dispatch } = useBusiness();
  const { downloadCloud } = useSupabaseStorage();
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

  const [userEmail, setUserEmail] = useState('');
  // Prevent multiple workspace-load attempts
  const workspaceLoadAttempted = useRef(false);

  useAppearance();

  // Sync Supabase auth user.id into app state + handle invited-user workspace loading
  useEffect(() => {
    supabase.auth.getUser().then(async ({ data: authData }) => {
      const user = authData.user;
      if (!user) return;

      if (user.email) setUserEmail(user.email);

      // Always sync the real Supabase user.id into userSettings
      if (data.userSettings.userId !== user.id) {
        dispatch({ type: 'SET_USER_ID', payload: user.id });
      }

      // If the app already has workspace data and the current user is in the access list
      // or is the owner (no access list) → nothing to do
      const accessList = data.userBusinessAccess || [];
      const userInAccessList = accessList.find(a => a.userId === user.id);
      const isOwner = accessList.length === 0 || !userInAccessList;

      if (isOwner && data.businesses.length > 0) {
        // Workspace owner with data loaded — ensure businesses are accessible
        return;
      }

      // --- Invited user path ---
      // Check if user has workspace_id in their metadata (set when owner granted them access)
      const workspaceId: string | undefined = user.user_metadata?.workspace_id;
      if (!workspaceId || workspaceLoadAttempted.current) return;

      workspaceLoadAttempted.current = true;

      // Download the owner's workspace
      try {
        const result = await downloadCloud(workspaceId);
        if (!result) return;

        const workspaceData = result.data;

        // Confirm this user actually has access in that workspace
        const theirAccess = workspaceData.userBusinessAccess?.find(a => a.userId === user.id);
        if (!theirAccess) return;

        // Filter data down to only what they're allowed to see
        const filtered = filterDataForUser(workspaceData, user.id);

        // Preserve the invited user's own settings (name, theme etc.) if they set them up
        const mergedData = {
          ...filtered,
          userSettings: {
            ...filtered.userSettings,
            userId: user.id,
            username: data.userSettings.username || filtered.userSettings.username,
            theme: data.userSettings.theme || filtered.userSettings.theme,
            fontFamily: data.userSettings.fontFamily || filtered.userSettings.fontFamily,
            colorPalette: data.userSettings.colorPalette || filtered.userSettings.colorPalette,
          },
        };

        dispatch({ type: 'LOAD_DATA', payload: mergedData });
      } catch (err) {
        console.warn('[HubLayout] Failed to load invited user workspace:', err);
      }
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // After login, if connected to Google but no workspace selected, prompt for workspace
  useEffect(() => {
    if (isConnected && !currentAccount) {
      discoverAccounts();
    }
  }, [isConnected, currentAccount, discoverAccounts]);

  const handleLogout = async () => {
    if (isConnected) {
      disconnect();
    }
    await supabase.auth.signOut();
    navigate('/login');
  };

  // Determine if current user is invited (has a workspace_id in metadata → joining someone else's workspace)
  const isInvitedUser = !!(data.userBusinessAccess?.length &&
    data.userBusinessAccess.find(a => a.userId === data.userSettings.userId));

  // Profile setup modal: show if username is missing
  // Invited users only need to set their display name (not workspace name)
  const needsProfileSetup = !data.userSettings.username?.trim() ||
    (!isInvitedUser && !data.userSettings.accountName?.trim());

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

      {/* Profile setup - shown if profile incomplete */}
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
