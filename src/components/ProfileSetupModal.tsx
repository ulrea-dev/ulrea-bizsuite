import React, { useState } from 'react';
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
}

export const ProfileSetupModal: React.FC<ProfileSetupModalProps> = ({ isOpen, userEmail }) => {
  const { dispatch } = useBusiness();
  const { toast } = useToast();
  const [displayName, setDisplayName] = useState('');
  const [workspaceName, setWorkspaceName] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!displayName.trim() || !workspaceName.trim()) return;

    setIsLoading(true);
    try {
      // Update Supabase auth user metadata
      await supabase.auth.updateUser({
        data: {
          display_name: displayName.trim(),
          account_name: workspaceName.trim(),
        },
      });

      // Update app state
      dispatch({ type: 'SET_USERNAME', payload: displayName.trim() });
      dispatch({ type: 'SET_ACCOUNT_NAME', payload: workspaceName.trim() });

      toast({ title: 'Profile saved', description: 'Welcome to WorkOS!' });
    } catch (error) {
      console.error('Profile setup error:', error);
      toast({ title: 'Error saving profile', variant: 'destructive' });
    } finally {
      setIsLoading(false);
    }
  };

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
            Tell us a bit about yourself and your workspace to get started.
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

          <Button
            type="submit"
            className="w-full h-11"
            disabled={isLoading || !displayName.trim() || !workspaceName.trim()}
          >
            {isLoading ? (
              <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Saving...</>
            ) : (
              'Continue to WorkOS'
            )}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
};
