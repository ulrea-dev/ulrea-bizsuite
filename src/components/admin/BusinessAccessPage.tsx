import React, { useState, useMemo } from 'react';
import { useBusiness } from '@/contexts/BusinessContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Users, Shield, Eye, Pencil, Trash2, Building2, Mail, UserPlus, Copy, RefreshCw, Check, Clock, AlertCircle } from 'lucide-react';
import { UserBusinessAccess, UserBusinessRole } from '@/types/business';
import { assignUserBusinessAccess, removeUserBusinessAccess } from '@/utils/filterDataForUser';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

const SUPABASE_PROJECT_ID = import.meta.env.VITE_SUPABASE_PROJECT_ID;

function generateTempPassword() {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789!@#$';
  return Array.from({ length: 12 }, () => chars[Math.floor(Math.random() * chars.length)]).join('');
}

function getInitials(email: string, displayName?: string) {
  if (displayName) {
    const parts = displayName.split(' ');
    return parts.length >= 2
      ? (parts[0][0] + parts[1][0]).toUpperCase()
      : displayName.slice(0, 2).toUpperCase();
  }
  return email.slice(0, 2).toUpperCase();
}

const AVATAR_COLORS = [
  'bg-blue-500', 'bg-violet-500', 'bg-emerald-500', 'bg-amber-500',
  'bg-rose-500', 'bg-cyan-500', 'bg-indigo-500', 'bg-teal-500',
];
function avatarColor(str: string) {
  let hash = 0;
  for (let i = 0; i < str.length; i++) hash = str.charCodeAt(i) + ((hash << 5) - hash);
  return AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length];
}

const RoleSelect: React.FC<{ value: UserBusinessRole; onChange: (v: UserBusinessRole) => void }> = ({ value, onChange }) => (
  <Select value={value} onValueChange={(v) => onChange(v as UserBusinessRole)}>
    <SelectTrigger>
      <SelectValue />
    </SelectTrigger>
    <SelectContent>
      <SelectItem value="viewer">
        <div className="flex items-center gap-2"><Eye className="h-4 w-4 text-muted-foreground" /> Viewer — View only</div>
      </SelectItem>
      <SelectItem value="admin">
        <div className="flex items-center gap-2"><Pencil className="h-4 w-4 text-muted-foreground" /> Admin — Can edit data</div>
      </SelectItem>
      <SelectItem value="owner">
        <div className="flex items-center gap-2"><Shield className="h-4 w-4 text-muted-foreground" /> Owner — Full access</div>
      </SelectItem>
    </SelectContent>
  </Select>
);

const BusinessCheckboxList: React.FC<{
  businesses: { id: string; name: string; type: string }[];
  selected: string[];
  onToggle: (id: string) => void;
}> = ({ businesses, selected, onToggle }) => (
  <ScrollArea className="h-48 rounded-md border p-2">
    <div className="space-y-1">
      {businesses.length === 0 && (
        <p className="text-sm text-muted-foreground text-center py-4">No businesses found</p>
      )}
      {businesses.map((b) => (
        <div
          key={b.id}
          className="flex items-center gap-2 p-2 rounded hover:bg-accent cursor-pointer"
          onClick={() => onToggle(b.id)}
        >
          <Checkbox checked={selected.includes(b.id)} onCheckedChange={() => onToggle(b.id)} />
          <Building2 className="h-4 w-4 text-muted-foreground shrink-0" />
          <span className="text-sm flex-1 truncate">{b.name}</span>
          <Badge variant="outline" className="text-xs">{b.type}</Badge>
        </div>
      ))}
    </div>
  </ScrollArea>
);

export const BusinessAccessPage: React.FC = () => {
  const { data, dispatch } = useBusiness();
  const { toast } = useToast();

  const [showAddDialog, setShowAddDialog] = useState(false);
  const [editingAccess, setEditingAccess] = useState<UserBusinessAccess | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<UserBusinessAccess | null>(null);
  const [deleteFromAuth, setDeleteFromAuth] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [copiedPassword, setCopiedPassword] = useState(false);

  // Add dialog state
  const [addTab, setAddTab] = useState<'invite' | 'create'>('invite');
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState<UserBusinessRole>('viewer');
  const [inviteBusinessIds, setInviteBusinessIds] = useState<string[]>([]);
  const [createEmail, setCreateEmail] = useState('');
  const [createDisplayName, setCreateDisplayName] = useState('');
  const [createRole, setCreateRole] = useState<UserBusinessRole>('viewer');
  const [createBusinessIds, setCreateBusinessIds] = useState<string[]>([]);
  const [tempPassword, setTempPassword] = useState(() => generateTempPassword());

  // Edit dialog state
  const [editRole, setEditRole] = useState<UserBusinessRole>('viewer');
  const [editBusinessIds, setEditBusinessIds] = useState<string[]>([]);

  const currentUserId = data.userSettings.userId;
  const accessList = data.userBusinessAccess || [];

  const currentUserAccess = useMemo(() => accessList.find(a => a.userId === currentUserId), [accessList, currentUserId]);
  const isOwner = useMemo(() => {
    if (accessList.length === 0) return true;
    return currentUserAccess?.role === 'owner';
  }, [accessList, currentUserAccess]);

  const getRoleBadgeVariant = (role: UserBusinessRole) => {
    switch (role) {
      case 'owner': return 'default' as const;
      case 'admin': return 'secondary' as const;
      case 'viewer': return 'outline' as const;
    }
  };

  const getBusinessNames = (ids: string[]) =>
    ids.map(id => data.businesses.find(b => b.id === id)?.name).filter(Boolean).join(', ');

  const invokeEdgeFunction = async (body: Record<string, unknown>) => {
    const { data: sessionData } = await supabase.auth.getSession();
    const token = sessionData.session?.access_token;
    const url = `https://${SUPABASE_PROJECT_ID}.supabase.co/functions/v1/manage-workspace-users`;
    const res = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
        apikey: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
      },
      body: JSON.stringify(body),
    });
    const json = await res.json();
    if (!res.ok || json.error) throw new Error(json.error || 'Edge function error');
    return json as { userId: string; email: string };
  };

  const handleSendInvite = async () => {
    if (!inviteEmail.trim() || inviteBusinessIds.length === 0) {
      toast({ title: 'Fill in email and select at least one business.', variant: 'destructive' });
      return;
    }
    setIsSaving(true);
    try {
      const result = await invokeEdgeFunction({
        action: 'invite',
        email: inviteEmail.trim(),
        workspaceId: currentUserId,
        workspaceName: data.userSettings.accountName,
      });
      const userId = result.userId ?? crypto.randomUUID();
      const updated = assignUserBusinessAccess(data, userId, inviteBusinessIds, inviteRole, inviteEmail.trim());
      // Attach inviteStatus + displayName
      const withStatus = updated.map(a =>
        a.userId === userId ? { ...a, inviteStatus: 'pending' as const } : a
      );
      dispatch({ type: 'UPDATE_USER_BUSINESS_ACCESS', payload: withStatus });
      toast({ title: 'Invitation sent!', description: `${inviteEmail} will receive an email with a sign-in link.` });
      setShowAddDialog(false);
      resetAddForm();
    } catch (err) {
      toast({ title: 'Failed to send invitation', description: err instanceof Error ? err.message : 'Unknown error', variant: 'destructive' });
    } finally {
      setIsSaving(false);
    }
  };

  const handleCreateAccount = async () => {
    if (!createEmail.trim() || createBusinessIds.length === 0) {
      toast({ title: 'Fill in email and select at least one business.', variant: 'destructive' });
      return;
    }
    setIsSaving(true);
    try {
      const result = await invokeEdgeFunction({
        action: 'create',
        email: createEmail.trim(),
        password: tempPassword,
        displayName: createDisplayName.trim(),
        workspaceId: currentUserId,
      });
      const userId = result.userId ?? crypto.randomUUID();
      const updated = assignUserBusinessAccess(data, userId, createBusinessIds, createRole, createEmail.trim());
      const withStatus = updated.map(a =>
        a.userId === userId
          ? { ...a, inviteStatus: 'pending' as const, displayName: createDisplayName.trim() || undefined }
          : a
      );
      dispatch({ type: 'UPDATE_USER_BUSINESS_ACCESS', payload: withStatus });
      toast({ title: 'Account created!', description: `Share the temporary password with ${createEmail}.` });
      setShowAddDialog(false);
      resetAddForm();
    } catch (err) {
      toast({ title: 'Failed to create account', description: err instanceof Error ? err.message : 'Unknown error', variant: 'destructive' });
    } finally {
      setIsSaving(false);
    }
  };

  const handleUpdateAccess = () => {
    if (!editingAccess) return;
    const updated = assignUserBusinessAccess(data, editingAccess.userId, editBusinessIds, editRole, editingAccess.email);
    const withExtras = updated.map(a =>
      a.userId === editingAccess.userId
        ? { ...a, inviteStatus: editingAccess.inviteStatus, displayName: editingAccess.displayName }
        : a
    );
    dispatch({ type: 'UPDATE_USER_BUSINESS_ACCESS', payload: withExtras });
    toast({ title: 'Access updated.' });
    setEditingAccess(null);
  };

  const handleRemoveAccess = async () => {
    if (!deleteTarget) return;
    setIsDeleting(true);
    try {
      if (deleteFromAuth && deleteTarget.userId) {
        await invokeEdgeFunction({ action: 'remove', userId: deleteTarget.userId, deleteFromAuth: true });
      }
      const updated = removeUserBusinessAccess(data, deleteTarget.userId);
      dispatch({ type: 'UPDATE_USER_BUSINESS_ACCESS', payload: updated });
      toast({ title: 'Access removed.' });
      setDeleteTarget(null);
      setDeleteFromAuth(false);
    } catch (err) {
      toast({ title: 'Failed to remove access', description: err instanceof Error ? err.message : 'Unknown error', variant: 'destructive' });
    } finally {
      setIsDeleting(false);
    }
  };

  const openEditDialog = (access: UserBusinessAccess) => {
    setEditingAccess(access);
    setEditRole(access.role);
    setEditBusinessIds(access.businessIds);
  };

  const resetAddForm = () => {
    setInviteEmail('');
    setInviteRole('viewer');
    setInviteBusinessIds([]);
    setCreateEmail('');
    setCreateDisplayName('');
    setCreateRole('viewer');
    setCreateBusinessIds([]);
    setTempPassword(generateTempPassword());
    setCopiedPassword(false);
  };

  const copyPassword = () => {
    navigator.clipboard.writeText(tempPassword).then(() => {
      setCopiedPassword(true);
      setTimeout(() => setCopiedPassword(false), 2000);
    });
  };

  const sharedUsers = accessList.filter(a => a.userId !== currentUserId);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold dashboard-text-primary">Business Access</h1>
          <p className="text-sm dashboard-text-secondary mt-1">Manage who can access your workspace and businesses</p>
        </div>
        {isOwner && (
          <Button onClick={() => { setShowAddDialog(true); resetAddForm(); }}>
            <UserPlus className="h-4 w-4 mr-2" />
            Add User
          </Button>
        )}
      </div>

      {/* Current User */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Shield className="h-4 w-4" />
            Your Access
          </CardTitle>
          <CardDescription>You are logged in as {data.userSettings.username || data.userSettings.userId}</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-3">
            <div className={`h-10 w-10 rounded-full flex items-center justify-center text-white text-sm font-bold ${avatarColor(currentUserId)}`}>
              {getInitials(data.userSettings.username || 'Me')}
            </div>
            <div>
              <Badge variant={getRoleBadgeVariant(currentUserAccess?.role || 'owner')} className="capitalize">
                {currentUserAccess?.role || 'Owner'}
              </Badge>
              <p className="text-xs dashboard-text-secondary mt-1">
                {currentUserAccess?.businessIds
                  ? `Access to: ${getBusinessNames(currentUserAccess.businessIds)}`
                  : `Full access to all ${data.businesses.length} business${data.businesses.length !== 1 ? 'es' : ''}`}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Shared Users */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Users className="h-4 w-4" />
            Users with Access
            {sharedUsers.length > 0 && (
              <Badge variant="secondary" className="ml-auto">{sharedUsers.length}</Badge>
            )}
          </CardTitle>
          <CardDescription>People who have been granted access to your businesses</CardDescription>
        </CardHeader>
        <CardContent>
          {sharedUsers.length === 0 ? (
            <div className="text-center py-10 text-muted-foreground">
              <Users className="h-12 w-12 mx-auto mb-3 opacity-30" />
              <p className="font-medium">No users added yet</p>
              <p className="text-sm mt-1">Use "Add User" to invite or create accounts for your team</p>
            </div>
          ) : (
            <div className="space-y-3">
              {sharedUsers.map((access) => {
                const initials = getInitials(access.email || 'U', access.displayName);
                const color = avatarColor(access.email || access.userId);
                const businesses = getBusinessNames(access.businessIds);
                const isPending = access.inviteStatus === 'pending' || !access.inviteStatus;

                return (
                  <div key={access.userId} className="flex items-center justify-between p-4 rounded-lg border dashboard-border gap-3">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className={`h-10 w-10 rounded-full flex items-center justify-center text-white text-sm font-bold shrink-0 ${color}`}>
                        {initials}
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <p className="font-medium text-sm truncate">{access.displayName || access.email || 'Unknown'}</p>
                          <Badge
                            variant={isPending ? 'outline' : 'secondary'}
                            className={`text-xs flex items-center gap-1 ${isPending ? 'text-muted-foreground' : 'text-primary'}`}
                          >
                            {isPending ? <Clock className="h-3 w-3" /> : <Check className="h-3 w-3" />}
                            {isPending ? 'Pending' : 'Active'}
                          </Badge>
                        </div>
                        {access.displayName && (
                          <p className="text-xs text-muted-foreground truncate">{access.email}</p>
                        )}
                        <p className="text-xs dashboard-text-secondary mt-0.5 truncate">
                          {businesses || 'No businesses assigned'}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <Badge variant={getRoleBadgeVariant(access.role)} className="capitalize hidden sm:flex">
                        {access.role}
                      </Badge>
                      {isOwner && (
                        <>
                          <Button variant="ghost" size="icon" onClick={() => openEditDialog(access)}>
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="icon" onClick={() => { setDeleteTarget(access); setDeleteFromAuth(false); }}>
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        </>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Add User Dialog */}
      <Dialog open={showAddDialog} onOpenChange={(open) => { setShowAddDialog(open); if (!open) resetAddForm(); }}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Add User</DialogTitle>
            <DialogDescription>Invite someone or create an account with a temporary password.</DialogDescription>
          </DialogHeader>

          <Tabs value={addTab} onValueChange={(v) => setAddTab(v as 'invite' | 'create')}>
            <TabsList className="w-full">
              <TabsTrigger value="invite" className="flex-1">
                <Mail className="h-4 w-4 mr-2" />
                Send Invite Email
              </TabsTrigger>
              <TabsTrigger value="create" className="flex-1">
                <UserPlus className="h-4 w-4 mr-2" />
                Create Account
              </TabsTrigger>
            </TabsList>

            {/* Invite by Email */}
            <TabsContent value="invite" className="space-y-4 pt-2">
              <p className="text-xs text-muted-foreground">
                The user will receive an email with a link to set their password and join your workspace.
              </p>
              <div className="space-y-2">
                <Label>Email Address</Label>
                <Input type="email" placeholder="user@example.com" value={inviteEmail} onChange={(e) => setInviteEmail(e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label>Role</Label>
                <RoleSelect value={inviteRole} onChange={setInviteRole} />
              </div>
              <div className="space-y-2">
                <Label>Businesses</Label>
                <BusinessCheckboxList
                  businesses={data.businesses}
                  selected={inviteBusinessIds}
                  onToggle={(id) => setInviteBusinessIds(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id])}
                />
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setShowAddDialog(false)}>Cancel</Button>
                <Button onClick={handleSendInvite} disabled={isSaving || !inviteEmail.trim() || inviteBusinessIds.length === 0}>
                  {isSaving ? 'Sending…' : 'Send Invitation'}
                </Button>
              </DialogFooter>
            </TabsContent>

            {/* Create with Temp Password */}
            <TabsContent value="create" className="space-y-4 pt-2">
              <div className="flex items-start gap-2 p-3 rounded-lg bg-muted border border-border">
                <AlertCircle className="h-4 w-4 text-muted-foreground shrink-0 mt-0.5" />
                <p className="text-xs text-muted-foreground">
                  The user will be required to change this password on their first sign-in.
                </p>
              </div>
              <div className="space-y-2">
                <Label>Email Address</Label>
                <Input type="email" placeholder="user@example.com" value={createEmail} onChange={(e) => setCreateEmail(e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label>Display Name <span className="text-muted-foreground">(optional)</span></Label>
                <Input placeholder="John Doe" value={createDisplayName} onChange={(e) => setCreateDisplayName(e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label>Temporary Password</Label>
                <div className="flex gap-2">
                  <Input value={tempPassword} readOnly className="font-mono text-sm" />
                  <Button type="button" variant="outline" size="icon" onClick={copyPassword}>
                    {copiedPassword ? <Check className="h-4 w-4 text-emerald-500" /> : <Copy className="h-4 w-4" />}
                  </Button>
                  <Button type="button" variant="outline" size="icon" onClick={() => setTempPassword(generateTempPassword())}>
                    <RefreshCw className="h-4 w-4" />
                  </Button>
                </div>
              </div>
              <div className="space-y-2">
                <Label>Role</Label>
                <RoleSelect value={createRole} onChange={setCreateRole} />
              </div>
              <div className="space-y-2">
                <Label>Businesses</Label>
                <BusinessCheckboxList
                  businesses={data.businesses}
                  selected={createBusinessIds}
                  onToggle={(id) => setCreateBusinessIds(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id])}
                />
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setShowAddDialog(false)}>Cancel</Button>
                <Button onClick={handleCreateAccount} disabled={isSaving || !createEmail.trim() || createBusinessIds.length === 0}>
                  {isSaving ? 'Creating…' : 'Create Account'}
                </Button>
              </DialogFooter>
            </TabsContent>
          </Tabs>
        </DialogContent>
      </Dialog>

      {/* Edit Dialog */}
      <Dialog open={!!editingAccess} onOpenChange={(open) => !open && setEditingAccess(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Edit Access</DialogTitle>
            <DialogDescription>Update role and business access for {editingAccess?.displayName || editingAccess?.email}</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label>Role</Label>
              <RoleSelect value={editRole} onChange={setEditRole} />
            </div>
            <div className="space-y-2">
              <Label>Businesses</Label>
              <BusinessCheckboxList
                businesses={data.businesses}
                selected={editBusinessIds}
                onToggle={(id) => setEditBusinessIds(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id])}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditingAccess(null)}>Cancel</Button>
            <Button onClick={handleUpdateAccess} disabled={editBusinessIds.length === 0}>Save Changes</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={!!deleteTarget} onOpenChange={(open) => !open && setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remove User Access?</AlertDialogTitle>
            <AlertDialogDescription>
              This will revoke <strong>{deleteTarget?.displayName || deleteTarget?.email}</strong>'s access to all assigned businesses.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="flex items-center gap-2 px-1 py-2">
            <Checkbox
              id="delete-from-auth"
              checked={deleteFromAuth}
              onCheckedChange={(v) => setDeleteFromAuth(v === true)}
            />
            <Label htmlFor="delete-from-auth" className="text-sm cursor-pointer">
              Also delete this user's account from the system
            </Label>
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleRemoveAccess}
              disabled={isDeleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isDeleting ? 'Removing…' : 'Remove Access'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};
