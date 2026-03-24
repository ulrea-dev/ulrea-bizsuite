import React, { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useBusiness } from '@/contexts/BusinessContext';
import { formatCurrency } from '@/utils/storage';
import { format, parseISO } from 'date-fns';
import { ServiceType } from '@/types/business';
import { useToast } from '@/hooks/use-toast';
import {
  Plus, Pencil, Trash2, Tags,
  Repeat, RefreshCw,
} from 'lucide-react';
import { getServiceTypeIcon, SERVICE_TYPE_ICON_NAMES, SERVICE_TYPE_ICONS } from '@/utils/serviceTypeIcons';

const renderIcon = (iconName?: string, size = 'h-5 w-5') => {
  const Icon = getServiceTypeIcon(iconName);
  return <Icon className={size} />;
};

const toMonthly = (amount: number, freq: string): number => {
  if (freq === 'quarterly') return amount / 3;
  if (freq === 'yearly') return amount / 12;
  return amount;
};

export const ServiceTypesPage: React.FC = () => {
  const { data, currentBusiness, dispatch } = useBusiness();
  const { toast } = useToast();
  const [modalOpen, setModalOpen] = useState(false);
  const [editingType, setEditingType] = useState<ServiceType | null>(null);
  const [typeName, setTypeName] = useState('');
  const [typeIcon, setTypeIcon] = useState('MoreHorizontal');

  const serviceTypeStats = useMemo(() => {
    if (!currentBusiness) return [];
    const bizId = currentBusiness.id;
    const bizRetainers = (data.retainers || []).filter(r => r.businessId === bizId);
    const bizRenewals = (data.renewals || []).filter(r => r.businessId === bizId);

    return (data.serviceTypes || []).map(st => {
      const activeRetainers = bizRetainers.filter(
        r => r.status === 'active' && r.serviceTypeId === st.id
      );
      const mrr = activeRetainers.reduce(
        (sum, r) => sum + toMonthly(r.amount, r.frequency), 0
      );
      const matchingRenewals = bizRenewals.filter(r => r.serviceTypeId === st.id);
      const sorted = [...matchingRenewals].sort((a, b) =>
        a.nextRenewalDate.localeCompare(b.nextRenewalDate)
      );
      const nextRenewalDate = sorted[0]?.nextRenewalDate ?? null;
      const totalMonthlyCostExposure = matchingRenewals.reduce(
        (sum, r) => sum + toMonthly(r.amount, r.frequency), 0
      );
      return { serviceType: st, activeRetainerCount: activeRetainers.length, mrr, renewalCount: matchingRenewals.length, nextRenewalDate, totalMonthlyCostExposure };
    });
  }, [data.serviceTypes, data.retainers, data.renewals, currentBusiness]);

  const handleAdd = () => {
    setEditingType(null);
    setTypeName('');
    setTypeIcon('MoreHorizontal');
    setModalOpen(true);
  };

  const handleEdit = (st: ServiceType) => {
    setEditingType(st);
    setTypeName(st.name);
    setTypeIcon(st.icon || 'MoreHorizontal');
    setModalOpen(true);
  };

  const handleSave = () => {
    const trimmed = typeName.trim();
    if (!trimmed) return;
    if (editingType) {
      dispatch({ type: 'UPDATE_SERVICE_TYPE', payload: { id: editingType.id, updates: { name: trimmed, icon: typeIcon } } });
      toast({ title: 'Updated', description: `Service type "${trimmed}" updated.` });
    } else {
      const id = trimmed.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
      if ((data.serviceTypes || []).find(st => st.id === id)) {
        toast({ title: 'Error', description: 'A service type with this ID already exists.', variant: 'destructive' });
        return;
      }
      dispatch({ type: 'ADD_SERVICE_TYPE', payload: { id, name: trimmed, icon: typeIcon } });
      toast({ title: 'Added', description: `Service type "${trimmed}" created.` });
    }
    setModalOpen(false);
  };

  const handleDelete = (st: ServiceType) => {
    dispatch({ type: 'DELETE_SERVICE_TYPE', payload: st.id });
    toast({ title: 'Deleted', description: `Service type "${st.name}" removed.` });
  };

  const serviceTypes = data.serviceTypes || [];

  return (
    <div className="p-4 sm:p-6 md:p-8 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Tags className="h-7 w-7 text-muted-foreground" />
          <div>
            <h1 className="text-xl sm:text-2xl md:text-3xl font-bold">Service Types</h1>
            <p className="text-sm text-muted-foreground">Categorise retainers and renewals by service type</p>
          </div>
        </div>
        <Button onClick={handleAdd}>
          <Plus className="h-4 w-4 mr-2" />
          Add Service Type
        </Button>
      </div>

      {serviceTypes.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16 gap-3">
            <Tags className="h-10 w-10 text-muted-foreground" />
            <p className="text-lg font-medium">No service types yet</p>
            <p className="text-sm text-muted-foreground text-center max-w-sm">
              Add service types to categorise your retainers and renewals (e.g. Domain, Hosting, Software).
            </p>
            <Button onClick={handleAdd} className="mt-2">
              <Plus className="h-4 w-4 mr-2" />
              Add Service Type
            </Button>
          </CardContent>
        </Card>
      ) : (
        <>
          {/* Overview grid */}
          <div>
            <h2 className="text-base font-semibold mb-3 text-muted-foreground uppercase tracking-wide text-xs">Overview</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
              {serviceTypeStats.map(stats => (
                <Card key={stats.serviceType.id}>
                  <CardHeader className="pb-3">
                    <div className="flex items-center gap-2">
                      <span className="text-muted-foreground">{renderIcon(stats.serviceType.icon)}</span>
                      <CardTitle className="text-base">{stats.serviceType.name}</CardTitle>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-2 text-sm">
                    <div className="flex items-center justify-between">
                      <span className="flex items-center gap-1.5 text-muted-foreground">
                        <Repeat className="h-3.5 w-3.5" />
                        Retainers
                      </span>
                      <span>
                        {stats.activeRetainerCount > 0 ? (
                          <span className="font-medium">
                            {stats.activeRetainerCount} active
                            {currentBusiness && stats.mrr > 0 && (
                              <span className="text-green-600 ml-1">
                                · {formatCurrency(stats.mrr, currentBusiness.currency)}/mo
                              </span>
                            )}
                          </span>
                        ) : (
                          <span className="text-muted-foreground">None</span>
                        )}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="flex items-center gap-1.5 text-muted-foreground">
                        <RefreshCw className="h-3.5 w-3.5" />
                        Renewals
                      </span>
                      <span>
                        {stats.renewalCount > 0 ? (
                          <span className="font-medium">
                            {stats.renewalCount}
                            {stats.nextRenewalDate && (
                              <span className="text-muted-foreground font-normal ml-1">
                                · next {format(parseISO(stats.nextRenewalDate), 'd MMM yyyy')}
                              </span>
                            )}
                          </span>
                        ) : (
                          <span className="text-muted-foreground">None</span>
                        )}
                      </span>
                    </div>
                    {currentBusiness && stats.totalMonthlyCostExposure > 0 && (
                      <div className="flex items-center justify-between pt-1 border-t">
                        <span className="text-muted-foreground">Monthly cost exposure</span>
                        <span className="font-medium text-orange-600">
                          {formatCurrency(stats.totalMonthlyCostExposure, currentBusiness.currency)}/mo
                        </span>
                      </div>
                    )}
                    {stats.activeRetainerCount === 0 && stats.renewalCount === 0 && (
                      <p className="text-muted-foreground italic">No retainers or renewals assigned</p>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>

          {/* Management list */}
          <Card>
            <CardHeader>
              <CardTitle>Manage Service Types</CardTitle>
              <CardDescription>Add, rename, or remove service type categories.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-2">
              {serviceTypes.map(st => (
                <div key={st.id} className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex items-center gap-3">
                    <span className="text-muted-foreground">{renderIcon(st.icon)}</span>
                    <div>
                      <span className="font-medium">{st.name}</span>
                      <span className="text-xs text-muted-foreground ml-2">({st.id})</span>
                    </div>
                  </div>
                  <div className="flex gap-1">
                    <Button variant="ghost" size="sm" onClick={() => handleEdit(st)}>
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="sm" onClick={() => handleDelete(st)}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </>
      )}

      {/* Add/Edit Dialog */}
      <Dialog open={modalOpen} onOpenChange={setModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingType ? 'Edit Service Type' : 'Add Service Type'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="serviceTypeName">Name</Label>
              <Input
                id="serviceTypeName"
                value={typeName}
                onChange={e => setTypeName(e.target.value)}
                placeholder="e.g. Domain, Hosting, SSL"
                onKeyDown={e => e.key === 'Enter' && handleSave()}
                autoFocus
              />
            </div>
            <div className="space-y-2">
              <Label>Icon</Label>
              <ScrollArea className="h-48 rounded-md border p-3">
                <div className="grid grid-cols-7 gap-1.5">
                  {SERVICE_TYPE_ICON_NAMES.map(name => {
                    const IconComp = SERVICE_TYPE_ICONS[name];
                    const selected = typeIcon === name;
                    return (
                      <button
                        key={name}
                        type="button"
                        onClick={() => setTypeIcon(name)}
                        title={name}
                        className={`flex items-center justify-center rounded-md p-2 transition-colors ${
                          selected
                            ? 'bg-primary text-primary-foreground'
                            : 'hover:bg-muted text-muted-foreground hover:text-foreground'
                        }`}
                      >
                        <IconComp className="h-4 w-4" />
                      </button>
                    );
                  })}
                </div>
              </ScrollArea>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setModalOpen(false)}>Cancel</Button>
            <Button onClick={handleSave} disabled={!typeName.trim()}>
              {editingType ? 'Update' : 'Add'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};
