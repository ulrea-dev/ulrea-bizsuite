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
  const { dispatch } = useBusiness();
  const { toast } = useToast();
  const [displayName, setDisplayName] = useState('');
  const [workspaceName, setWorkspaceName] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  // Pre-fill display name from Google metadata if available
  useEffect(() => {
    if (!isOpen) return;
    supabase.auth.getUser().then(({ data }) => {
      const meta = data.user?.user_metadata;
      if (meta?.full_name && !displayName) {
        setDisplayName(meta.full_name);
      } else if (meta?.name && !displayName) {
        setDisplayName(meta.name);
      }
    });
  }, [isOpen]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    const nameOk = displayName.trim();
    const workspaceOk = isInvitedUser || workspaceName.trim();
    if (!nameOk || !workspaceOk) return;

    setIsLoading(true);
    try {
      const updatePayload: Record<string, string> = { display_name: displayName.trim() };
      if (!isInvitedUser) updatePayload.account_name = workspaceName.trim();

      await supabase.auth.updateUser({ data: updatePayload });

      dispatch({ type: 'SET_USERNAME', payload: displayName.trim() });
      if (!isInvitedUser) dispatch({ type: 'SET_ACCOUNT_NAME', payload: workspaceName.trim() });

      toast({
        title: 'Profile saved',
        description: isInvitedUser ? 'Welcome to your workspace!' : 'Welcome to WorkOS!',
      });
    } catch (error) {
      console.error('Profile setup error:', error);
      toast({ title: 'Error saving profile', variant: 'destructive' });
    } finally {
      setIsLoading(false);
    }
  };

  const isFormValid = displayName.trim() && (isInvitedUser || workspaceName.trim());

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
          <DialogTitle className="text-center">
            {isInvitedUser ? 'Set Up Your Profile' : 'Set Up Your Profile'}
          </DialogTitle>
          <DialogDescription className="text-center">
            {isInvitedUser
              ? 'Set your display name so your teammates can identify you.'
              : 'Tell us a bit about yourself and your workspace to get started.'}
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

          {/* Workspace name only shown to workspace owners, not invited users */}
          {!isInvitedUser && (
            <div className="space-y-2">
              <Label htmlFor="workspace-name">Workspace Name</Label>
              <p className="text-xs text-muted-foreground">Name of your organisation or team workspace.</p>
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
            disabled={isLoading || !isFormValid}
          >
            {isLoading ? (
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
