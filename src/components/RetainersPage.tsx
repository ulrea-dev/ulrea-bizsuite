import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { useBusiness } from '@/contexts/BusinessContext';
import { formatCurrency } from '@/utils/storage';
import { format } from 'date-fns';
import { Plus, Eye, Edit, Pause, Play, X } from 'lucide-react';
import { RetainerModal } from './RetainerModal';

export const RetainersPage: React.FC = () => {
  const { data, currentBusiness, dispatch } = useBusiness();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedRetainer, setSelectedRetainer] = useState<any>(null);
  const [modalMode, setModalMode] = useState<'create' | 'edit' | 'view'>('create');

  if (!currentBusiness) {
    return (
      <div className="p-8 text-center">
        <p className="text-muted-foreground">Please select a business to view retainers</p>
      </div>
    );
  }

  const retainers = (data.retainers || []).filter(r => r.businessId === currentBusiness.id);
  const activeRetainers = retainers.filter(r => r.status === 'active');
  
  // Calculate MRR (Monthly Recurring Revenue)
  const mrr = activeRetainers.reduce((sum, r) => {
    let monthlyAmount = r.amount;
    if (r.frequency === 'quarterly') monthlyAmount = r.amount / 3;
    if (r.frequency === 'yearly') monthlyAmount = r.amount / 12;
    return sum + monthlyAmount;
  }, 0);

  const handleCreate = () => {
    setSelectedRetainer(null);
    setModalMode('create');
    setIsModalOpen(true);
  };

  const handleEdit = (retainer: any) => {
    setSelectedRetainer(retainer);
    setModalMode('edit');
    setIsModalOpen(true);
  };

  const handleView = (retainer: any) => {
    setSelectedRetainer(retainer);
    setModalMode('view');
    setIsModalOpen(true);
  };

  const handleToggleStatus = (retainer: any) => {
    dispatch({
      type: 'UPDATE_RETAINER',
      payload: {
        id: retainer.id,
        updates: { status: retainer.status === 'active' ? 'paused' : 'active' }
      }
    });
  };

  return (
    <div className="p-8 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Retainers</h1>
          <p className="text-muted-foreground">Manage subscription-based revenue</p>
        </div>
        <Button onClick={handleCreate}>
          <Plus className="h-4 w-4 mr-2" />
          Add Retainer
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Retainers</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{activeRetainers.length}</div>
            <p className="text-xs text-muted-foreground mt-1">of {retainers.length} total</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Monthly Recurring Revenue</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(mrr, currentBusiness.currency)}</div>
            <p className="text-xs text-muted-foreground mt-1">Per month</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Quarterly Revenue</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(mrr * 3, currentBusiness.currency)}</div>
            <p className="text-xs text-muted-foreground mt-1">Per quarter</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Annual Revenue</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(mrr * 12, currentBusiness.currency)}</div>
            <p className="text-xs text-muted-foreground mt-1">Per year</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>All Retainers</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Client</TableHead>
                <TableHead>Retainer Name</TableHead>
                <TableHead>Amount</TableHead>
                <TableHead>Frequency</TableHead>
                <TableHead>Next Billing</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {retainers.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center text-muted-foreground">
                    No retainers yet. Add your first retainer to get started.
                  </TableCell>
                </TableRow>
              ) : (
                retainers.map(retainer => {
                  const client = data.clients.find(c => c.id === retainer.clientId);
                  return (
                    <TableRow key={retainer.id}>
                      <TableCell>{client?.name || 'Unknown Client'}</TableCell>
                      <TableCell className="font-medium">{retainer.name}</TableCell>
                      <TableCell>{formatCurrency(retainer.amount, { symbol: retainer.currency === currentBusiness.currency.code ? currentBusiness.currency.symbol : '$', code: retainer.currency })}</TableCell>
                      <TableCell className="capitalize">{retainer.frequency}</TableCell>
                      <TableCell>{format(new Date(retainer.nextBillingDate), 'PP')}</TableCell>
                      <TableCell>
                        <Badge variant={
                          retainer.status === 'active' ? 'default' : 
                          retainer.status === 'paused' ? 'secondary' : 
                          'outline'
                        }>
                          {retainer.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button size="sm" variant="ghost" onClick={() => handleView(retainer)}>
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button size="sm" variant="ghost" onClick={() => handleEdit(retainer)}>
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button 
                            size="sm" 
                            variant="ghost" 
                            onClick={() => handleToggleStatus(retainer)}
                          >
                            {retainer.status === 'active' ? (
                              <Pause className="h-4 w-4" />
                            ) : (
                              <Play className="h-4 w-4" />
                            )}
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <RetainerModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        retainer={selectedRetainer}
        mode={modalMode}
      />
    </div>
  );
};
