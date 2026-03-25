import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useBusiness } from '@/contexts/BusinessContext';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { Loader2 } from 'lucide-react';

interface ProfileSetupModalProps {
  isOpen: boolean;
  userEmail: string;
  /** True when user is joining someone else's workspace (not creating their own) */
  isInvitedUser?: boolean;
}

export const ProfileSetupModal: React.FC<ProfileSetupModalProps> = ({ isOpen, userEmail, isInvitedUser = false }) => {
  const { dispatch, data } = useBusiness();
  const { toast } = useToast();
  const [displayName, setDisplayName] = useState('');
  const [workspaceName, setWorkspaceName] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [hasExistingWorkspace, setHasExistingWorkspace] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // Check if user already has a workspace record and pre-fill data
  useEffect(() => {
    if (!isOpen) return;
    setIsLoading(true);

    supabase.auth.getUser().then(async ({ data: authData }) => {
      const user = authData.user;
      if (!user) { setIsLoading(false); return; }

      // Pre-fill display name from Google/auth metadata
      const meta = user.user_metadata;
      if (meta?.full_name && !displayName) setDisplayName(meta.full_name);
      else if (meta?.name && !displayName) setDisplayName(meta.name);

      // Check if workspace already exists for this user
      const { data: workspaces } = await supabase
        .from('workspaces')
        .select('id, workspace_name, account_name')
        .eq('owner_user_id', user.id)
        .limit(1);

      if (workspaces && workspaces.length > 0) {
        // Existing user — workspace already created, just need display name
        setHasExistingWorkspace(true);
        // Pre-fill workspace name if available
        if (workspaces[0].workspace_name) {
          setWorkspaceName(workspaces[0].workspace_name);
        } else if (workspaces[0].account_name) {
          setWorkspaceName(workspaces[0].account_name);
        }
      } else {
        // New user — no workspace yet, will need to create one
        setHasExistingWorkspace(false);
        // Pre-fill workspace name from account_name in settings if available
        if (data.userSettings.accountName) {
          setWorkspaceName(data.userSettings.accountName);
        }
      }

      setIsLoading(false);
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    const nameOk = displayName.trim();
    const workspaceOk = isInvitedUser || hasExistingWorkspace || workspaceName.trim();
    if (!nameOk || !workspaceOk) return;

    setIsSaving(true);
    try {
      const { data: authData } = await supabase.auth.getUser();
      const user = authData.user;
      if (!user) return;

      // Update Supabase auth metadata
      const updatePayload: Record<string, string> = { display_name: displayName.trim() };
      if (!isInvitedUser && !hasExistingWorkspace) {
        updatePayload.account_name = workspaceName.trim();
      }
      await supabase.auth.updateUser({ data: updatePayload });

      // If brand-new user (no workspace record), create the workspace in DB
      if (!isInvitedUser && !hasExistingWorkspace && workspaceName.trim()) {
        const workspaceId = user.id; // Use user ID as workspace ID for owner
        await supabase.from('workspaces').upsert({
          id: workspaceId,
          owner_user_id: user.id,
          account_name: workspaceName.trim().toLowerCase().replace(/\s+/g, '-'),
          workspace_name: workspaceName.trim(),
        });

        // Also upsert user_settings with the account_name
        await supabase.from('user_settings').upsert({
          user_id: user.id,
          username: displayName.trim(),
          account_name: workspaceName.trim(),
          updated_at: new Date().toISOString(),
        });

        dispatch({ type: 'SET_ACCOUNT_NAME', payload: workspaceName.trim() });
      } else {
        // Existing user — just update username in user_settings
        await supabase.from('user_settings').upsert({
          user_id: user.id,
          username: displayName.trim(),
          updated_at: new Date().toISOString(),
        });
      }

      dispatch({ type: 'SET_USERNAME', payload: displayName.trim() });

      toast({
        title: 'Profile saved',
        description: isInvitedUser
          ? 'Welcome to your workspace!'
          : hasExistingWorkspace
            ? 'Display name updated!'
            : 'Welcome to WorkOS!',
      });
    } catch (error) {
      console.error('Profile setup error:', error);
      toast({ title: 'Error saving profile', variant: 'destructive' });
    } finally {
      setIsSaving(false);
    }
  };

  // Needs workspace name only if: not invited AND no existing workspace
  const needsWorkspaceName = !isInvitedUser && !hasExistingWorkspace;
  const isFormValid = displayName.trim() && (!needsWorkspaceName || workspaceName.trim());

  if (isLoading) {
    return (
      <Dialog open={isOpen} onOpenChange={() => {}}>
        <DialogContent
          className="sm:max-w-md"
          onPointerDownOutside={(e) => e.preventDefault()}
          onEscapeKeyDown={(e) => e.preventDefault()}
        >
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin text-primary" />
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={isOpen} onOpenChange={() => { /* non-dismissible */ }}>
      <DialogContent
        className="sm:max-w-md"
        onPointerDownOutside={(e) => e.preventDefault()}
        onEscapeKeyDown={(e) => e.preventDefault()}
      >
        <DialogHeader>
          <div className="flex items-center justify-center w-12 h-12 rounded-xl bg-primary mx-auto mb-2">
            <span className="text-primary-foreground font-bold text-xl">W</span>
          </div>
          <DialogTitle className="text-center">Set Up Your Profile</DialogTitle>
          <DialogDescription className="text-center">
            {isInvitedUser
              ? 'Set your display name so your teammates can identify you.'
              : hasExistingWorkspace
                ? 'Set your display name to personalise your experience.'
                : 'Tell us a bit about yourself and your venture to get started.'}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSave} className="space-y-4 mt-2">
          <div className="space-y-2">
            <Label htmlFor="profile-email">Email</Label>
            <Input
              id="profile-email"
              type="email"
              value={userEmail}
              disabled
              className="bg-muted text-muted-foreground"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="display-name">Display Name</Label>
            <p className="text-xs text-muted-foreground">Your name, shown to teammates in this workspace.</p>
            <Input
              id="display-name"
              placeholder="e.g. Jane Doe"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              autoFocus
              required
            />
          </div>

          {/* Venture name only for brand-new users without an existing workspace */}
          {needsWorkspaceName && (
            <div className="space-y-2">
              <Label htmlFor="workspace-name">Venture Name</Label>
              <p className="text-xs text-muted-foreground">Name of your venture or organisation.</p>
              <Input
                id="workspace-name"
                placeholder="e.g. Acme Corp"
                value={workspaceName}
                onChange={(e) => setWorkspaceName(e.target.value)}
                required
              />
            </div>
          )}

          <Button
            type="submit"
            className="w-full h-11"
            disabled={isSaving || !isFormValid}
          >
            {isSaving ? (
              <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Saving...</>
            ) : (
              isInvitedUser ? 'Join Workspace' : 'Continue to WorkOS'
            )}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
};
