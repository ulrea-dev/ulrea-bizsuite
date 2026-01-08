import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useGoogleDrive } from '@/contexts/GoogleDriveContext';
import { useToast } from '@/hooks/use-toast';
import { SharedUser } from '@/types/googleDrive';
import { 
  Loader2, 
  UserPlus, 
  Trash2, 
  Mail, 
  FolderOpen, 
  FileSpreadsheet,
  Users,
  Crown
} from 'lucide-react';

interface ShareAccessModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ShareAccessModal: React.FC<ShareAccessModalProps> = ({ isOpen, onClose }) => {
  const { 
    settings, 
    shareWithUser, 
    getSharedUsers, 
    removeSharedUser,
    updateUserPermission,
    isSharing 
  } = useGoogleDrive();
  const { toast } = useToast();
  
  const [email, setEmail] = useState('');
  const [role, setRole] = useState<'reader' | 'writer' | 'commenter'>('reader');
  const [shareFolder, setShareFolder] = useState(true);
  const [shareSheet, setShareSheet] = useState(true);
  const [sendNotification, setSendNotification] = useState(true);
  const [sharedUsers, setSharedUsers] = useState<SharedUser[]>([]);
  const [isLoadingUsers, setIsLoadingUsers] = useState(false);
  const [isRemoving, setIsRemoving] = useState<string | null>(null);
  const [editingUserId, setEditingUserId] = useState<string | null>(null);
  const [isUpdatingPermission, setIsUpdatingPermission] = useState<string | null>(null);

  const hasConnectedSheet = !!settings.connectedSheet;

  useEffect(() => {
    if (isOpen) {
      loadSharedUsers();
    }
  }, [isOpen]);

  const loadSharedUsers = async () => {
    setIsLoadingUsers(true);
    try {
      const users = await getSharedUsers();
      setSharedUsers(users);
    } catch (error) {
      console.error('Failed to load shared users:', error);
    } finally {
      setIsLoadingUsers(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email.trim()) {
      toast({ title: 'Error', description: 'Please enter an email address.', variant: 'destructive' });
      return;
    }

    if (!shareFolder && !shareSheet) {
      toast({ title: 'Error', description: 'Please select at least one resource to share.', variant: 'destructive' });
      return;
    }

    const resources: ('folder' | 'sheet')[] = [];
    if (shareFolder) resources.push('folder');
    if (shareSheet && hasConnectedSheet) resources.push('sheet');

    const result = await shareWithUser(email.trim(), role, resources, sendNotification);

    if (result.success) {
      toast({ title: 'Invitation Sent', description: `${email} has been granted access.` });
      setEmail('');
      loadSharedUsers();
    } else {
      toast({ 
        title: 'Failed to Share', 
        description: result.errors.join(', '), 
        variant: 'destructive' 
      });
    }
  };

  const handleRemove = async (user: SharedUser) => {
    setIsRemoving(user.id);
    try {
      await removeSharedUser(user.email);
      toast({ title: 'Access Removed', description: `${user.email} no longer has access.` });
      loadSharedUsers();
    } catch (error) {
      toast({ 
        title: 'Failed to Remove', 
        description: error instanceof Error ? error.message : 'Could not remove access.', 
        variant: 'destructive' 
      });
    } finally {
      setIsRemoving(null);
    }
  };

  const handleUpdatePermission = async (user: SharedUser, newRole: 'reader' | 'writer' | 'commenter') => {
    if (user.role === 'owner') return;
    
    setIsUpdatingPermission(user.id);
    try {
      const result = await updateUserPermission(user.email, newRole);
      if (result.success) {
        toast({ title: 'Permission Updated', description: `${user.email} is now a ${getRoleLabel(newRole)}.` });
        loadSharedUsers();
      } else {
        toast({ 
          title: 'Failed to Update', 
          description: result.errors.join(', '), 
          variant: 'destructive' 
        });
      }
    } catch (error) {
      toast({ 
        title: 'Failed to Update', 
        description: error instanceof Error ? error.message : 'Could not update permission.', 
        variant: 'destructive' 
      });
    } finally {
      setIsUpdatingPermission(null);
      setEditingUserId(null);
    }
  };

  const getRoleBadgeClass = (role: string) => {
    switch (role) {
      case 'owner': return 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400';
      case 'writer': return 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400';
      case 'commenter': return 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400';
      default: return 'bg-muted text-muted-foreground';
    }
  };

  const getRoleLabel = (role: string) => {
    switch (role) {
      case 'owner': return 'Owner';
      case 'writer': return 'Editor';
      case 'commenter': return 'Commenter';
      default: return 'Viewer';
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Share BizSuite Data
          </DialogTitle>
          <DialogDescription>
            Invite collaborators to access your BizSuite data through Google Drive and Sheets.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email">Email Address</Label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                id="email"
                type="email"
                placeholder="collaborator@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="role">Permission Level</Label>
            <Select value={role} onValueChange={(v) => setRole(v as typeof role)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="reader">Viewer (read-only)</SelectItem>
                <SelectItem value="commenter">Commenter (view + comment)</SelectItem>
                <SelectItem value="writer">Editor (view + edit)</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-3">
            <Label>Share Access To</Label>
            <div className="space-y-2">
              <div className="flex items-center space-x-2">
                <Checkbox 
                  id="share-folder" 
                  checked={shareFolder}
                  onCheckedChange={(checked) => setShareFolder(!!checked)}
                />
                <Label htmlFor="share-folder" className="flex items-center gap-2 cursor-pointer font-normal">
                  <FolderOpen className="h-4 w-4 text-muted-foreground" />
                  Google Drive Backup Folder
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox 
                  id="share-sheet" 
                  checked={shareSheet && hasConnectedSheet}
                  onCheckedChange={(checked) => setShareSheet(!!checked)}
                  disabled={!hasConnectedSheet}
                />
                <Label 
                  htmlFor="share-sheet" 
                  className={`flex items-center gap-2 cursor-pointer font-normal ${!hasConnectedSheet ? 'text-muted-foreground' : ''}`}
                >
                  <FileSpreadsheet className="h-4 w-4 text-muted-foreground" />
                  Connected Google Sheet
                  {!hasConnectedSheet && <span className="text-xs">(not connected)</span>}
                </Label>
              </div>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <Checkbox 
              id="send-notification" 
              checked={sendNotification}
              onCheckedChange={(checked) => setSendNotification(!!checked)}
            />
            <Label htmlFor="send-notification" className="cursor-pointer font-normal">
              Send email notification to collaborator
            </Label>
          </div>

          <Button type="submit" className="w-full" disabled={isSharing}>
            {isSharing ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <UserPlus className="h-4 w-4 mr-2" />
            )}
            Send Invitation
          </Button>
        </form>

        {/* Currently shared users */}
        <div className="border-t pt-4 mt-4">
          <h4 className="text-sm font-medium mb-3 flex items-center gap-2">
            <Users className="h-4 w-4" />
            Currently Shared With
          </h4>
          
          {isLoadingUsers ? (
            <div className="flex items-center justify-center py-4">
              <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
            </div>
          ) : sharedUsers.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-4">
              No collaborators yet
            </p>
          ) : (
            <div className="space-y-2 max-h-[200px] overflow-y-auto">
              {sharedUsers.map((user) => (
                <div 
                  key={user.id} 
                  className="flex items-center justify-between p-2 rounded-lg bg-muted/50"
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                      {user.photoUrl ? (
                        <img 
                          src={user.photoUrl} 
                          alt="" 
                          className="w-8 h-8 rounded-full"
                        />
                      ) : (
                        <span className="text-xs font-medium text-primary">
                          {user.email.charAt(0).toUpperCase()}
                        </span>
                      )}
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-medium truncate">
                        {user.displayName || user.email}
                      </p>
                      {user.displayName && (
                        <p className="text-xs text-muted-foreground truncate">
                          {user.email}
                        </p>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    {user.role === 'owner' ? (
                      <span className={`text-xs px-2 py-0.5 rounded-full ${getRoleBadgeClass(user.role)}`}>
                        <Crown className="h-3 w-3 inline mr-1" />
                        {getRoleLabel(user.role)}
                      </span>
                    ) : editingUserId === user.id ? (
                      <Select 
                        value={user.role} 
                        onValueChange={(v) => handleUpdatePermission(user, v as 'reader' | 'writer' | 'commenter')}
                        disabled={isUpdatingPermission === user.id}
                      >
                        <SelectTrigger className="h-7 w-[110px] text-xs">
                          {isUpdatingPermission === user.id ? (
                            <Loader2 className="h-3 w-3 animate-spin" />
                          ) : (
                            <SelectValue />
                          )}
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="reader">Viewer</SelectItem>
                          <SelectItem value="commenter">Commenter</SelectItem>
                          <SelectItem value="writer">Editor</SelectItem>
                        </SelectContent>
                      </Select>
                    ) : (
                      <button
                        onClick={() => setEditingUserId(user.id)}
                        className={`text-xs px-2 py-0.5 rounded-full cursor-pointer hover:ring-2 hover:ring-primary/50 transition-all ${getRoleBadgeClass(user.role)}`}
                        title="Click to change permission"
                      >
                        {getRoleLabel(user.role)}
                      </button>
                    )}
                    {user.role !== 'owner' && (
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7 text-muted-foreground hover:text-destructive"
                        onClick={() => handleRemove(user)}
                        disabled={isRemoving === user.id}
                      >
                        {isRemoving === user.id ? (
                          <Loader2 className="h-3 w-3 animate-spin" />
                        ) : (
                          <Trash2 className="h-3 w-3" />
                        )}
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
