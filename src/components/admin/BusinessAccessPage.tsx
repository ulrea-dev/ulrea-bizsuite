import React, { useState, useMemo } from 'react';
import { useBusiness } from '@/contexts/BusinessContext';
import { useGoogleDrive } from '@/contexts/GoogleDriveContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Users, Plus, Shield, Eye, Pencil, Trash2, Building2, Mail, UserPlus } from 'lucide-react';
import { UserBusinessAccess, UserBusinessRole, Business } from '@/types/business';
import { assignUserBusinessAccess, removeUserBusinessAccess } from '@/utils/filterDataForUser';
import { useToast } from '@/hooks/use-toast';

export const BusinessAccessPage: React.FC = () => {
  const { data, dispatch } = useBusiness();
  const { settings: googleSettings, shareWithUser } = useGoogleDrive();
  const { toast } = useToast();
  
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [editingAccess, setEditingAccess] = useState<UserBusinessAccess | null>(null);
  const [newEmail, setNewEmail] = useState('');
  const [newRole, setNewRole] = useState<UserBusinessRole>('viewer');
  const [selectedBusinessIds, setSelectedBusinessIds] = useState<string[]>([]);
  const [isSaving, setIsSaving] = useState(false);

  const currentUserId = data.userSettings.userId;
  const accessList = data.userBusinessAccess || [];

  // Get current user's accessible businesses
  const currentUserAccess = useMemo(() => {
    return accessList.find(a => a.userId === currentUserId);
  }, [accessList, currentUserId]);

  // Determine if current user is an owner (can manage access)
  const isOwner = useMemo(() => {
    // If no access list exists, current user is owner
    if (accessList.length === 0) return true;
    // Otherwise check role
    return currentUserAccess?.role === 'owner';
  }, [accessList, currentUserAccess]);

  const getRoleBadgeVariant = (role: UserBusinessRole) => {
    switch (role) {
      case 'owner': return 'default';
      case 'admin': return 'secondary';
      case 'viewer': return 'outline';
    }
  };

  const getRoleIcon = (role: UserBusinessRole) => {
    switch (role) {
      case 'owner': return <Shield className="h-3 w-3" />;
      case 'admin': return <Pencil className="h-3 w-3" />;
      case 'viewer': return <Eye className="h-3 w-3" />;
    }
  };

  const getBusinessNames = (businessIds: string[]) => {
    return businessIds
      .map(id => data.businesses.find(b => b.id === id)?.name)
      .filter(Boolean)
      .join(', ');
  };

  const handleAddAccess = async () => {
    if (!newEmail.trim() || selectedBusinessIds.length === 0) {
      toast({
        title: 'Invalid Input',
        description: 'Please enter an email and select at least one business.',
        variant: 'destructive',
      });
      return;
    }

    setIsSaving(true);
    try {
      // Generate a new userId for the invited user
      const newUserId = crypto.randomUUID();
      
      // Add to access list
      const updatedAccess = assignUserBusinessAccess(
        data,
        newUserId,
        selectedBusinessIds,
        newRole,
        newEmail.trim()
      );

      dispatch({
        type: 'UPDATE_USER_BUSINESS_ACCESS',
        payload: updatedAccess,
      });

      // If connected to Google Drive, share the folder with this user
      if (googleSettings.accessToken) {
        const driveRole = newRole === 'viewer' ? 'reader' : 'writer';
        await shareWithUser(newEmail.trim(), driveRole, ['folder']);
      }

      toast({
        title: 'Access Granted',
        description: `${newEmail} can now access the selected businesses.`,
      });

      setShowAddDialog(false);
      setNewEmail('');
      setNewRole('viewer');
      setSelectedBusinessIds([]);
    } catch (error) {
      toast({
        title: 'Failed to Grant Access',
        description: error instanceof Error ? error.message : 'An error occurred.',
        variant: 'destructive',
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleUpdateAccess = () => {
    if (!editingAccess) return;

    const updatedAccess = assignUserBusinessAccess(
      data,
      editingAccess.userId,
      selectedBusinessIds,
      newRole,
      editingAccess.email
    );

    dispatch({
      type: 'UPDATE_USER_BUSINESS_ACCESS',
      payload: updatedAccess,
    });

    toast({
      title: 'Access Updated',
      description: 'User access has been updated.',
    });

    setEditingAccess(null);
    setNewRole('viewer');
    setSelectedBusinessIds([]);
  };

  const handleRemoveAccess = (userId: string) => {
    const updatedAccess = removeUserBusinessAccess(data, userId);
    dispatch({
      type: 'UPDATE_USER_BUSINESS_ACCESS',
      payload: updatedAccess,
    });

    toast({
      title: 'Access Removed',
      description: 'User access has been revoked.',
    });
  };

  const handleEditClick = (access: UserBusinessAccess) => {
    setEditingAccess(access);
    setNewRole(access.role);
    setSelectedBusinessIds(access.businessIds);
  };

  const toggleBusinessSelection = (businessId: string) => {
    setSelectedBusinessIds(prev => 
      prev.includes(businessId)
        ? prev.filter(id => id !== businessId)
        : [...prev, businessId]
    );
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold dashboard-text-primary">Business Access</h1>
          <p className="text-sm dashboard-text-secondary mt-1">
            Manage who can access your businesses
          </p>
        </div>
        {isOwner && (
          <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
            <DialogTrigger asChild>
              <Button>
                <UserPlus className="h-4 w-4 mr-2" />
                Grant Access
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md">
              <DialogHeader>
                <DialogTitle>Grant Business Access</DialogTitle>
                <DialogDescription>
                  Invite someone to access selected businesses. They'll receive access when they connect via Google Drive.
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="email">Email Address</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="user@example.com"
                    value={newEmail}
                    onChange={(e) => setNewEmail(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Role</Label>
                  <Select value={newRole} onValueChange={(v) => setNewRole(v as UserBusinessRole)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="viewer">
                        <div className="flex items-center gap-2">
                          <Eye className="h-4 w-4" />
                          Viewer - Can only view data
                        </div>
                      </SelectItem>
                      <SelectItem value="admin">
                        <div className="flex items-center gap-2">
                          <Pencil className="h-4 w-4" />
                          Admin - Can edit data
                        </div>
                      </SelectItem>
                      <SelectItem value="owner">
                        <div className="flex items-center gap-2">
                          <Shield className="h-4 w-4" />
                          Owner - Full access
                        </div>
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Businesses</Label>
                  <ScrollArea className="h-48 rounded-md border p-2">
                    <div className="space-y-2">
                      {data.businesses.map((business) => (
                        <div
                          key={business.id}
                          className="flex items-center space-x-2 p-2 rounded hover:bg-accent cursor-pointer"
                          onClick={() => toggleBusinessSelection(business.id)}
                        >
                          <Checkbox
                            checked={selectedBusinessIds.includes(business.id)}
                            onCheckedChange={() => toggleBusinessSelection(business.id)}
                          />
                          <div className="flex items-center gap-2 flex-1">
                            <Building2 className="h-4 w-4 text-muted-foreground" />
                            <span className="text-sm">{business.name}</span>
                          </div>
                          <Badge variant="outline" className="text-xs">{business.type}</Badge>
                        </div>
                      ))}
                    </div>
                  </ScrollArea>
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setShowAddDialog(false)}>
                  Cancel
                </Button>
                <Button onClick={handleAddAccess} disabled={isSaving}>
                  {isSaving ? 'Saving...' : 'Grant Access'}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        )}
      </div>

      {/* Current User Card */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Your Access
          </CardTitle>
          <CardDescription>
            You are logged in as {data.userSettings.username}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-center gap-2">
                <Badge variant={getRoleBadgeVariant(currentUserAccess?.role || 'owner')}>
                  {getRoleIcon(currentUserAccess?.role || 'owner')}
                  <span className="ml-1 capitalize">{currentUserAccess?.role || 'Owner'}</span>
                </Badge>
              </div>
              <p className="text-sm dashboard-text-secondary mt-2">
                {currentUserAccess?.businessIds
                  ? `Access to: ${getBusinessNames(currentUserAccess.businessIds)}`
                  : `Full access to all ${data.businesses.length} businesses`}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Access List */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Users className="h-5 w-5" />
            Shared Access
          </CardTitle>
          <CardDescription>
            Users who have access to your businesses
          </CardDescription>
        </CardHeader>
        <CardContent>
          {accessList.filter(a => a.userId !== currentUserId).length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Users className="h-12 w-12 mx-auto mb-3 opacity-50" />
              <p>No shared access configured</p>
              <p className="text-sm mt-1">Grant access to share businesses with team members</p>
            </div>
          ) : (
            <div className="space-y-3">
              {accessList
                .filter(a => a.userId !== currentUserId)
                .map((access) => (
                  <div
                    key={access.userId}
                    className="flex items-center justify-between p-4 rounded-lg border dashboard-border"
                  >
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                        <Mail className="h-5 w-5 text-primary" />
                      </div>
                      <div>
                        <p className="font-medium">{access.email || 'Unknown User'}</p>
                        <p className="text-xs dashboard-text-secondary">
                          {access.businessIds.length} business{access.businessIds.length !== 1 ? 'es' : ''}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant={getRoleBadgeVariant(access.role)}>
                        {getRoleIcon(access.role)}
                        <span className="ml-1 capitalize">{access.role}</span>
                      </Badge>
                      {isOwner && (
                        <>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleEditClick(access)}
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button variant="ghost" size="icon">
                                <Trash2 className="h-4 w-4 text-destructive" />
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>Remove Access?</AlertDialogTitle>
                                <AlertDialogDescription>
                                  This will revoke {access.email}'s access to all assigned businesses.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Cancel</AlertDialogCancel>
                                <AlertDialogAction
                                  onClick={() => handleRemoveAccess(access.userId)}
                                  className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                >
                                  Remove Access
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        </>
                      )}
                    </div>
                  </div>
                ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Edit Dialog */}
      <Dialog open={!!editingAccess} onOpenChange={(open) => !open && setEditingAccess(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Edit Access</DialogTitle>
            <DialogDescription>
              Update access for {editingAccess?.email}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Role</Label>
              <Select value={newRole} onValueChange={(v) => setNewRole(v as UserBusinessRole)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="viewer">Viewer</SelectItem>
                  <SelectItem value="admin">Admin</SelectItem>
                  <SelectItem value="owner">Owner</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Businesses</Label>
              <ScrollArea className="h-48 rounded-md border p-2">
                <div className="space-y-2">
                  {data.businesses.map((business) => (
                    <div
                      key={business.id}
                      className="flex items-center space-x-2 p-2 rounded hover:bg-accent cursor-pointer"
                      onClick={() => toggleBusinessSelection(business.id)}
                    >
                      <Checkbox
                        checked={selectedBusinessIds.includes(business.id)}
                        onCheckedChange={() => toggleBusinessSelection(business.id)}
                      />
                      <span className="text-sm">{business.name}</span>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditingAccess(null)}>
              Cancel
            </Button>
            <Button onClick={handleUpdateAccess}>
              Save Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};
