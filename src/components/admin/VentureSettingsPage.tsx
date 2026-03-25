import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { CurrencyInput } from '@/components/ui/currency-input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Briefcase, DollarSign, TrendingUp, Edit2, CheckCircle } from 'lucide-react';
import { useBusiness } from '@/contexts/BusinessContext';
import { formatCurrency } from '@/utils/storage';
import { SUPPORTED_CURRENCIES } from '@/types/business';
import { useToast } from '@/hooks/use-toast';

export const VentureSettingsPage: React.FC = () => {
  const { data, currentBusiness, dispatch } = useBusiness();
  const { toast } = useToast();
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState({
    name: '',
    type: '',
    currentBalance: '0',
    minimumBalance: '0',
    currencyCode: 'USD',
  });

  const venture = currentBusiness || data.businesses[0];

  if (!venture) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center space-y-4">
        <Briefcase className="h-12 w-12 text-muted-foreground opacity-40" />
        <h2 className="text-lg font-semibold">No Venture Found</h2>
        <p className="text-sm text-muted-foreground">Create a venture to get started.</p>
      </div>
    );
  }

  const activeProjects = data.projects.filter(p => p.businessId === venture.id && p.status === 'active').length;
  const totalProjectValue = data.projects
    .filter(p => p.businessId === venture.id)
    .reduce((sum, p) => sum + p.totalValue, 0);
  const isHealthy = venture.currentBalance >= venture.minimumBalance;

  const openEdit = () => {
    setEditForm({
      name: venture.name,
      type: venture.type,
      currentBalance: venture.currentBalance.toString(),
      minimumBalance: venture.minimumBalance.toString(),
      currencyCode: venture.currency.code,
    });
    setIsEditing(true);
  };

  const handleSave = () => {
    const currency = SUPPORTED_CURRENCIES.find(c => c.code === editForm.currencyCode) || venture.currency;
    dispatch({
      type: 'UPDATE_BUSINESS',
      payload: {
        id: venture.id,
        updates: {
          name: editForm.name.trim(),
          type: editForm.type.trim(),
          currentBalance: parseFloat(editForm.currentBalance) || 0,
          minimumBalance: parseFloat(editForm.minimumBalance) || 0,
          currency,
          updatedAt: new Date().toISOString(),
        },
      },
    });
    setIsEditing(false);
    toast({ title: 'Venture updated successfully.' });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold dashboard-text-primary">Venture Settings</h1>
          <p className="text-sm dashboard-text-secondary mt-1">Manage your venture's core settings</p>
        </div>
        {!isEditing && (
          <Button onClick={openEdit} variant="outline">
            <Edit2 className="h-4 w-4 mr-2" />
            Edit Venture
          </Button>
        )}
      </div>

      {/* Venture Card */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-xl bg-primary/10">
              <Briefcase className="h-6 w-6 text-primary" />
            </div>
            <div className="flex-1">
              <CardTitle className="flex items-center gap-2">
                {venture.name}
                <Badge variant={isHealthy ? 'default' : 'destructive'} className="text-xs">
                  {isHealthy ? 'Healthy' : 'Low Balance'}
                </Badge>
              </CardTitle>
              <CardDescription>{venture.type}</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          {isEditing ? (
            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Venture Name</Label>
                  <Input
                    value={editForm.name}
                    onChange={(e) => setEditForm(prev => ({ ...prev, name: e.target.value }))}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Category</Label>
                  <Input
                    value={editForm.type}
                    onChange={(e) => setEditForm(prev => ({ ...prev, type: e.target.value }))}
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label>Currency</Label>
                <Select value={editForm.currencyCode} onValueChange={(v) => setEditForm(prev => ({ ...prev, currencyCode: v }))}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {SUPPORTED_CURRENCIES.map(c => (
                      <SelectItem key={c.code} value={c.code}>
                        {c.symbol} {c.code} — {c.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Current Balance</Label>
                  <CurrencyInput
                    value={editForm.currentBalance}
                    onChange={(v) => setEditForm(prev => ({ ...prev, currentBalance: v }))}
                    allowDecimals maxDecimals={2}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Minimum Balance Alert</Label>
                  <CurrencyInput
                    value={editForm.minimumBalance}
                    onChange={(v) => setEditForm(prev => ({ ...prev, minimumBalance: v }))}
                    allowDecimals maxDecimals={2}
                  />
                </div>
              </div>
              <div className="flex gap-2 pt-2">
                <Button onClick={handleSave}>
                  <CheckCircle className="h-4 w-4 mr-2" />
                  Save Changes
                </Button>
                <Button variant="outline" onClick={() => setIsEditing(false)}>Cancel</Button>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
              <div className="space-y-1">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <DollarSign className="h-4 w-4" />
                  Balance
                </div>
                <div className="text-2xl font-bold">
                  {formatCurrency(venture.currentBalance, venture.currency)}
                </div>
                <div className="text-xs text-muted-foreground">
                  Min: {formatCurrency(venture.minimumBalance, venture.currency)}
                </div>
              </div>
              <div className="space-y-1">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <TrendingUp className="h-4 w-4" />
                  Active Projects
                </div>
                <div className="text-2xl font-bold">{activeProjects}</div>
                <div className="text-xs text-muted-foreground">
                  Total value: {formatCurrency(totalProjectValue, venture.currency)}
                </div>
              </div>
              <div className="space-y-1">
                <div className="text-sm text-muted-foreground mb-1">Model</div>
                <Badge variant="secondary" className="capitalize text-sm">
                  {venture.businessModel}
                </Badge>
                <div className="text-xs text-muted-foreground mt-1">
                  Created {new Date(venture.createdAt).toLocaleDateString()}
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};
