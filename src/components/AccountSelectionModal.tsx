import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { BizSuiteAccount } from '@/types/googleDrive';
import { Folder, Users, Plus, Loader2, ArrowRight, Check } from 'lucide-react';
import { cn } from '@/lib/utils';

interface AccountSelectionModalProps {
  isOpen: boolean;
  onClose: () => void;
  accounts: BizSuiteAccount[];
  legacyFolders: Array<{ id: string; name: string; ownedByMe: boolean }>;
  onSelectAccount: (account: BizSuiteAccount) => void;
  onCreateAccount: (name: string) => Promise<void>;
  onMigrateLegacy: (folderId: string, name: string) => Promise<void>;
  isLoading: boolean;
  connectedEmail: string | null;
}

export const AccountSelectionModal: React.FC<AccountSelectionModalProps> = ({
  isOpen,
  onClose,
  accounts,
  onSelectAccount,
  onCreateAccount,
  isLoading,
  connectedEmail,
}) => {
  const [view, setView] = useState<'select' | 'create'>('select');
  const [newAccountName, setNewAccountName] = useState('');
  const [isCreating, setIsCreating] = useState(false);

  const hasExistingAccounts = accounts.length > 0;

  const handleCreate = async () => {
    if (!newAccountName.trim()) return;
    setIsCreating(true);
    try {
      await onCreateAccount(newAccountName.trim());
    } finally {
      setIsCreating(false);
    }
  };

  const renderSelectView = () => (
    <div className="space-y-6">
      {/* Modern accounts */}
      {accounts.length > 0 && (
        <div className="space-y-3">
          <h3 className="text-sm font-medium text-foreground">Your Workspaces</h3>
          <div className="space-y-2">
            {accounts.map((account) => (
              <button
                key={account.id}
                onClick={() => onSelectAccount(account)}
                disabled={isLoading}
                className={cn(
                  "w-full p-4 rounded-lg border border-border bg-card hover:border-primary/50 hover:bg-accent/50",
                  "transition-all text-left group flex items-center gap-4"
                )}
              >
                <div className="flex-shrink-0 w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                  {account.ownedByMe ? (
                    <Folder className="w-5 h-5 text-primary" />
                  ) : (
                    <Users className="w-5 h-5 text-primary" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-foreground truncate">{account.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {account.ownedByMe ? 'Owned by you' : `Shared by ${account.sharedBy}`}
                  </p>
                </div>
                <ArrowRight className="w-4 h-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Create new workspace button */}
      <div className={cn(hasExistingAccounts && "pt-4 border-t border-border")}>
        <Button
          onClick={() => setView('create')}
          variant={hasExistingAccounts ? "outline" : "default"}
          className="w-full gap-2"
          disabled={isLoading}
        >
          <Plus className="w-4 h-4" />
          {hasExistingAccounts ? 'Create New Workspace' : 'Create Your First Workspace'}
        </Button>
      </div>
    </div>
  );

  const renderCreateView = () => (
    <div className="space-y-6">
      <div className="text-center">
        <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-primary/10 mb-3">
          <Plus className="w-6 h-6 text-primary" />
        </div>
        <h3 className="text-lg font-semibold text-foreground">Create Workspace</h3>
        <p className="text-sm text-muted-foreground mt-1">
          Give your workspace a name to identify it
        </p>
      </div>

      <Input
        type="text"
        placeholder="e.g., My Business, Team Alpha"
        value={newAccountName}
        onChange={(e) => setNewAccountName(e.target.value)}
        className="h-11 text-center"
        autoFocus
        onKeyDown={(e) => e.key === 'Enter' && handleCreate()}
      />

      <div className="flex gap-3">
        {hasExistingAccounts && (
          <Button
            variant="outline"
            onClick={() => {
              setView('select');
              setNewAccountName('');
            }}
            className="flex-1"
            disabled={isCreating}
          >
            Back
          </Button>
        )}
        <Button
          onClick={handleCreate}
          className="flex-1 gap-2"
          disabled={!newAccountName.trim() || isCreating}
        >
          {isCreating ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              Creating...
            </>
          ) : (
            <>
              <Check className="w-4 h-4" />
              Create
            </>
          )}
        </Button>
      </div>
    </div>
  );

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>
            {view === 'select' ? 'Select Workspace' : 'New Workspace'}
          </DialogTitle>
          <DialogDescription>
            {view === 'select'
              ? connectedEmail
                ? `Signed in as ${connectedEmail}`
                : 'Choose a workspace to continue'
              : 'Your backups will be stored in this workspace'
            }
          </DialogDescription>
        </DialogHeader>

        {isLoading && view === 'select' ? (
          <div className="flex flex-col items-center justify-center py-8 gap-3">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
            <p className="text-sm text-muted-foreground">Setting up your workspace...</p>
          </div>
        ) : (
          <>
            {view === 'select' && renderSelectView()}
            {view === 'create' && renderCreateView()}
          </>
        )}
      </DialogContent>
    </Dialog>
  );
};
