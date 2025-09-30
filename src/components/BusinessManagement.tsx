import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { CurrencyInput } from '@/components/ui/currency-input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Building2, Edit, Trash2, Plus, DollarSign, Calendar, TrendingUp } from 'lucide-react';
import { useBusiness } from '@/contexts/BusinessContext';
import { formatCurrency } from '@/utils/storage';
import { Business, SUPPORTED_CURRENCIES } from '@/types/business';

interface BusinessManagementProps {
  onCreateBusiness: () => void;
}

export const BusinessManagement: React.FC<BusinessManagementProps> = ({ onCreateBusiness }) => {
  const { data, currentBusiness, switchBusiness, dispatch } = useBusiness();
  const [editingBusiness, setEditingBusiness] = useState<Business | null>(null);
  const [editForm, setEditForm] = useState({
    name: '',
    type: '',
    currentBalance: 0,
    minimumBalance: 0,
    currency: SUPPORTED_CURRENCIES[0]
  });

  const getBusinessMetrics = (business: Business) => {
    const businessProjects = data.projects.filter(p => p.businessId === business.id);
    const activeProjects = businessProjects.filter(p => p.status === 'active');
    const totalProjectValue = businessProjects.reduce((sum, p) => sum + p.totalValue, 0);
    const totalAllocated = businessProjects.reduce((sum, p) => 
      sum + p.teamAllocations.reduce((allocSum, alloc) => allocSum + alloc.totalAllocated, 0), 0
    );

    return {
      activeProjects: activeProjects.length,
      totalProjects: businessProjects.length,
      totalProjectValue,
      netMargin: totalProjectValue - totalAllocated,
      healthScore: business.currentBalance > business.minimumBalance ? 'healthy' : 'warning'
    };
  };

  const handleEditBusiness = (business: Business) => {
    setEditingBusiness(business);
    setEditForm({
      name: business.name,
      type: business.type,
      currentBalance: business.currentBalance,
      minimumBalance: business.minimumBalance,
      currency: business.currency
    });
  };

  const handleSaveEdit = () => {
    if (!editingBusiness) return;
    
    dispatch({
      type: 'UPDATE_BUSINESS',
      payload: {
        id: editingBusiness.id,
        updates: {
          ...editForm,
          updatedAt: new Date().toISOString()
        }
      }
    });
    setEditingBusiness(null);
  };

  const handleDeleteBusiness = (businessId: string) => {
    // Switch to another business if deleting current one
    if (currentBusiness?.id === businessId && data.businesses.length > 1) {
      const otherBusiness = data.businesses.find(b => b.id !== businessId);
      if (otherBusiness) {
        switchBusiness(otherBusiness.id);
      }
    }
    
    dispatch({ type: 'DELETE_BUSINESS', payload: businessId });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold dashboard-text-primary">Business Management</h2>
          <p className="dashboard-text-secondary">Manage your business portfolio</p>
        </div>
        <Button onClick={onCreateBusiness} className="flex items-center gap-2">
          <Plus className="h-4 w-4" />
          Add Business
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {data.businesses.map(business => {
          const metrics = getBusinessMetrics(business);
          const isCurrentBusiness = currentBusiness?.id === business.id;

          return (
            <Card key={business.id} className={isCurrentBusiness ? 'ring-2 ring-primary' : ''}>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Building2 className="h-5 w-5 dashboard-text-secondary" />
                    <div>
                      <CardTitle className="flex items-center gap-2">
                        {business.name}
                        {isCurrentBusiness && (
                          <Badge variant="default" className="text-xs">Current</Badge>
                        )}
                      </CardTitle>
                      <CardDescription>{business.type}</CardDescription>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Dialog>
                      <DialogTrigger asChild>
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => handleEditBusiness(business)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                      </DialogTrigger>
                      <DialogContent>
                        <DialogHeader>
                          <DialogTitle>Edit Business</DialogTitle>
                          <DialogDescription>Update your business information</DialogDescription>
                        </DialogHeader>
                        <div className="space-y-4">
                          <div>
                            <Label htmlFor="name">Business Name</Label>
                            <Input
                              id="name"
                              value={editForm.name}
                              onChange={(e) => setEditForm(prev => ({ ...prev, name: e.target.value }))}
                            />
                          </div>
                          <div>
                            <Label htmlFor="type">Business Type</Label>
                            <Input
                              id="type"
                              value={editForm.type}
                              onChange={(e) => setEditForm(prev => ({ ...prev, type: e.target.value }))}
                            />
                          </div>
                          <div className="grid grid-cols-2 gap-4">
                            <div>
                              <Label htmlFor="currentBalance">Current Balance</Label>
                              <CurrencyInput
                                id="currentBalance"
                                value={editForm.currentBalance.toString()}
                                onChange={(value) => setEditForm(prev => ({ ...prev, currentBalance: parseFloat(value) || 0 }))}
                                allowDecimals={true}
                                maxDecimals={2}
                              />
                            </div>
                            <div>
                              <Label htmlFor="minimumBalance">Minimum Balance</Label>
                              <CurrencyInput
                                id="minimumBalance"
                                value={editForm.minimumBalance.toString()}
                                onChange={(value) => setEditForm(prev => ({ ...prev, minimumBalance: parseFloat(value) || 0 }))}
                                allowDecimals={true}
                                maxDecimals={2}
                              />
                            </div>
                          </div>
                          <div>
                            <Label htmlFor="currency">Currency</Label>
                            <Select
                              value={editForm.currency.code}
                              onValueChange={(value) => {
                                const currency = SUPPORTED_CURRENCIES.find(c => c.code === value);
                                if (currency) {
                                  setEditForm(prev => ({ ...prev, currency }));
                                }
                              }}
                            >
                              <SelectTrigger>
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                {SUPPORTED_CURRENCIES.map(currency => (
                                  <SelectItem key={currency.code} value={currency.code}>
                                    {currency.symbol} {currency.name}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                          <div className="flex gap-2 pt-4">
                            <Button onClick={handleSaveEdit} className="flex-1">
                              Save Changes
                            </Button>
                            <Button 
                              variant="outline" 
                              onClick={() => setEditingBusiness(null)}
                              className="flex-1"
                            >
                              Cancel
                            </Button>
                          </div>
                        </div>
                      </DialogContent>
                    </Dialog>
                    
                    {data.businesses.length > 1 && (
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button variant="outline" size="sm">
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Delete Business</AlertDialogTitle>
                            <AlertDialogDescription>
                              Are you sure you want to delete "{business.name}"? This action cannot be undone and will remove all associated projects, team members, and clients.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction
                              onClick={() => handleDeleteBusiness(business.id)}
                              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                            >
                              Delete Business
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    )}
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <DollarSign className="h-4 w-4 dashboard-text-secondary" />
                      <span className="text-sm dashboard-text-secondary">Balance</span>
                    </div>
                    <div className="text-lg font-semibold">
                      {formatCurrency(business.currentBalance, business.currency)}
                    </div>
                    <div className="text-xs dashboard-text-secondary">
                      Min: {formatCurrency(business.minimumBalance, business.currency)}
                    </div>
                  </div>
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <TrendingUp className="h-4 w-4 dashboard-text-secondary" />
                      <span className="text-sm dashboard-text-secondary">Net Margin</span>
                    </div>
                    <div className={`text-lg font-semibold ${metrics.netMargin >= 0 ? 'status-positive' : 'status-negative'}`}>
                      {formatCurrency(metrics.netMargin, business.currency)}
                    </div>
                    <div className="text-xs dashboard-text-secondary">
                      From {metrics.totalProjects} projects
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-2 border-t dashboard-border">
                  <div className="flex gap-4 text-sm dashboard-text-secondary">
                    <span>{metrics.activeProjects} active projects</span>
                    <span>Created {new Date(business.createdAt).toLocaleDateString()}</span>
                  </div>
                  <div className="flex gap-2">
                    <Badge 
                      variant={metrics.healthScore === 'healthy' ? 'default' : 'destructive'}
                      className="text-xs"
                    >
                      {metrics.healthScore === 'healthy' ? 'Healthy' : 'Low Balance'}
                    </Badge>
                    {!isCurrentBusiness && (
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => switchBusiness(business.id)}
                      >
                        Switch To
                      </Button>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {data.businesses.length === 0 && (
        <Card>
          <CardContent className="text-center py-12">
            <Building2 className="h-12 w-12 dashboard-text-secondary mx-auto mb-4" />
            <h3 className="text-lg font-semibold dashboard-text-primary mb-2">No Businesses Yet</h3>
            <p className="dashboard-text-secondary mb-4">Create your first business to get started with managing your projects and team.</p>
            <Button onClick={onCreateBusiness}>
              <Plus className="h-4 w-4 mr-2" />
              Create Your First Business
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
};