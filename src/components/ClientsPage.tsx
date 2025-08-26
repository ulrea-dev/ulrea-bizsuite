
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Plus, Search, Eye, Edit, Mail, Building } from 'lucide-react';
import { useBusiness } from '@/contexts/BusinessContext';
import { ClientModal } from './ClientModal';
import { formatCurrency } from '@/utils/storage';
import { Client } from '@/types/business';

interface ClientsPageProps {
  onNavigateToPage?: (page: string) => void;
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

  // Get client projects and calculate total value
  const getClientProjects = (clientId: string) => {
    return data.projects.filter(project => project.clientId === clientId);
  };

  if (!currentBusiness) {
    return (
      <div className="p-6">
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <h3 className="text-lg font-medium mb-2">No Business Selected</h3>
            <p className="text-muted-foreground">Please select a business to manage clients</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold dashboard-text-primary">Clients</h1>
          <p className="dashboard-text-secondary">Manage your clients for {currentBusiness.name}</p>
        </div>
        <Button onClick={handleCreateClient}>
          <Plus className="h-4 w-4 mr-2" />
          Add Client
        </Button>
      </div>

      <div className="flex gap-4 items-center">
        <div className="relative flex-1 max-w-md">
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
            <h3 className="text-lg font-medium mb-2">No Clients Found</h3>
            <p className="text-muted-foreground text-center mb-6">
              {searchTerm 
                ? 'No clients match your search'
                : 'Add your first client to get started'
              }
            </p>
            <Button onClick={handleCreateClient}>
              <Plus className="h-4 w-4 mr-2" />
              Add Client
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
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredClients.map(client => {
                  const clientProjects = getClientProjects(client.id)
                    .filter(project => project.businessId === currentBusiness?.id);
                  const totalValue = clientProjects.reduce((sum, project) => sum + project.totalValue, 0);
                  
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
                          <Badge variant="outline">{clientProjects.length} projects</Badge>
                          {clientProjects.length > 0 && (
                            <div className="flex flex-wrap gap-1">
                              {clientProjects.slice(0, 2).map(project => (
                                <Button
                                  key={project.id}
                                  variant="ghost"
                                  size="sm"
                                  className="h-auto p-1 text-xs hover:text-primary"
                                  onClick={() => onNavigateToPage?.('projects')}
                                >
                                  {project.name}
                                </Button>
                              ))}
                              {clientProjects.length > 2 && (
                                <span className="text-xs dashboard-text-secondary">
                                  +{clientProjects.length - 2} more
                                </span>
                              )}
                            </div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        {formatCurrency(totalValue, currentBusiness.currency)}
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-1">
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
