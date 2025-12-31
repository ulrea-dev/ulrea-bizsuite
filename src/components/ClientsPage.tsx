import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Plus, Search, Eye, Edit, Mail, Building, TrendingUp } from 'lucide-react';
import { useBusiness } from '@/contexts/BusinessContext';
import { ClientModal } from './ClientModal';
import { formatCurrency } from '@/utils/storage';
import { Client } from '@/types/business';
import { calculateClientMetrics } from '@/utils/clientUtils';

interface ClientsPageProps {
  onNavigateToPage?: (page: string, itemId?: string) => void;
}

export const ClientsPage: React.FC<ClientsPageProps> = ({ onNavigateToPage }) => {
  const { data, currentBusiness } = useBusiness();
  const [showClientModal, setShowClientModal] = useState(false);
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);
  const [modalMode, setModalMode] = useState<'create' | 'edit' | 'view'>('create');
  const [searchTerm, setSearchTerm] = useState('');

  const filteredClients = data.clients.filter(client =>
    client.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    client.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    client.company.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleCreateClient = () => {
    setSelectedClient(null);
    setModalMode('create');
    setShowClientModal(true);
  };

  const handleViewClient = (client: Client) => {
    setSelectedClient(client);
    setModalMode('view');
    setShowClientModal(true);
  };

  const handleEditClient = (client: Client) => {
    setSelectedClient(client);
    setModalMode('edit');
    setShowClientModal(true);
  };

  const handleViewClientDetails = (client: Client) => {
    onNavigateToPage?.('client-detail', client.id);
  };

  return (
    <div className="space-y-4 sm:space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
        <div>
          <h1 className="text-xl sm:text-2xl md:text-3xl font-bold dashboard-text-primary">Clients</h1>
          <p className="text-sm sm:text-base dashboard-text-secondary">Manage your clients</p>
        </div>
        <Button onClick={handleCreateClient} size="sm" className="w-full sm:w-auto">
          <Plus className="h-4 w-4 mr-2" />
          Add Client
        </Button>
      </div>

      <div className="flex gap-3 sm:gap-4 items-center">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 dashboard-text-secondary" />
          <Input
            placeholder="Search clients..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
      </div>

      {filteredClients.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <div className="p-4 dashboard-surface-elevated rounded-full mb-4">
              <Plus className="h-8 w-8 dashboard-text-secondary" />
            </div>
            <h3 className="text-lg font-medium mb-2">No Clients Yet</h3>
            <p className="text-muted-foreground text-center mb-2 max-w-md">
              {searchTerm 
                ? 'No clients match your search'
                : 'Add clients to track projects and revenue associated with them.'
              }
            </p>
            <Button onClick={handleCreateClient} className="mt-4">
              <Plus className="h-4 w-4 mr-2" />
              Add First Client
            </Button>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle>Clients ({filteredClients.length})</CardTitle>
            <CardDescription>
              Manage clients and track their project values
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Client</TableHead>
                  <TableHead>Company</TableHead>
                  <TableHead>Projects</TableHead>
                  <TableHead>Total Value</TableHead>
                  <TableHead>Net Profit</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredClients.map(client => {
                  const metrics = calculateClientMetrics(client, data.projects, data.payments);
                  
                  return (
                    <TableRow key={client.id}>
                      <TableCell>
                        <div>
                          <div className="font-medium">{client.name}</div>
                          <div className="flex items-center gap-1 text-sm dashboard-text-secondary">
                            <Mail className="h-3 w-3" />
                            {client.email}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <Building className="h-3 w-3" />
                          {client.company || 'N/A'}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="space-y-1">
                          <Badge variant="outline">{metrics.totalProjects} projects</Badge>
                          <div className="text-xs dashboard-text-secondary">
                            {metrics.activeProjects} active
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="space-y-1">
                          <div className="font-medium">
                            {currentBusiness ? formatCurrency(metrics.totalValue, currentBusiness.currency) : '-'}
                          </div>
                          <div className="text-xs dashboard-text-secondary">
                            {metrics.paymentProgress.toFixed(1)}% paid
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <TrendingUp className={`h-3 w-3 ${metrics.netProfit >= 0 ? 'text-green-600' : 'text-red-600'}`} />
                          <span className={`font-medium ${metrics.netProfit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                            {currentBusiness ? formatCurrency(metrics.netProfit, currentBusiness.currency) : '-'}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-1">
                          <Button
                            size="sm"
                            variant="default"
                            onClick={() => handleViewClientDetails(client)}
                          >
                            <Eye className="h-3 w-3 mr-1" />
                            Details
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleViewClient(client)}
                          >
                            <Eye className="h-3 w-3" />
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleEditClient(client)}
                          >
                            <Edit className="h-3 w-3" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      <ClientModal
        isOpen={showClientModal}
        onClose={() => setShowClientModal(false)}
        client={selectedClient}
        mode={modalMode}
      />
    </div>
  );
};
