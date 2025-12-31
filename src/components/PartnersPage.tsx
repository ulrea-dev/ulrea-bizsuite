import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { UserPlus, Mail, Eye, Edit, Handshake } from 'lucide-react';
import { useBusiness } from '@/contexts/BusinessContext';
import { PartnerModal } from './PartnerModal';
import { Partner } from '@/types/business';
import { formatCurrency } from '@/utils/storage';

interface PartnersPageProps {
  onNavigateToPage?: (page: string, itemId?: string) => void;
}

export const PartnersPage: React.FC<PartnersPageProps> = ({ onNavigateToPage }) => {
  const { data, currentBusiness } = useBusiness();
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedPartner, setSelectedPartner] = useState<Partner | null>(null);
  const [modalMode, setModalMode] = useState<'create' | 'edit' | 'view'>('create');

  const partners = data.partners || [];
  const projects = data.projects.filter(p => p.businessId === currentBusiness?.id);

  const openModal = (mode: 'create' | 'edit' | 'view', partner?: Partner) => {
    setModalMode(mode);
    setSelectedPartner(partner || null);
    setModalOpen(true);
  };

  const getPartnerProjects = (partnerId: string) => {
    return projects.filter(project => 
      project.allocationPartnerAllocations?.some(allocation => allocation.partnerId === partnerId) ||
      project.partnerAllocations?.some(allocation => allocation.partnerId === partnerId)
    );
  };

  const getPartnerTotalEarnings = (partnerId: string) => {
    return projects.reduce((total, project) => {
      const phaseAllocation = project.allocationPartnerAllocations?.find(a => a.partnerId === partnerId);
      const legacyAllocation = project.partnerAllocations?.find(a => a.partnerId === partnerId);
      return total + (phaseAllocation?.paidAmount || legacyAllocation?.paidAmount || 0);
    }, 0);
  };

  const getPartnerOutstanding = (partnerId: string) => {
    return projects.reduce((total, project) => {
      const phaseAllocation = project.allocationPartnerAllocations?.find(a => a.partnerId === partnerId);
      const legacyAllocation = project.partnerAllocations?.find(a => a.partnerId === partnerId);
      return total + (phaseAllocation?.outstanding || legacyAllocation?.outstanding || 0);
    }, 0);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-lg sm:text-xl md:text-2xl font-bold dashboard-text-primary">Partners</h1>
          <p className="text-xs sm:text-sm dashboard-text-secondary">Manage your business partners and their allocations</p>
        </div>
        <Button onClick={() => openModal('create')} className="flex items-center gap-2">
          <UserPlus className="h-4 w-4" />
          Add Partner
        </Button>
      </div>

      {partners.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Handshake className="h-12 w-12 dashboard-text-secondary mb-4" />
            <h3 className="text-lg font-semibold dashboard-text-primary mb-2">No partners yet</h3>
            <p className="dashboard-text-secondary text-center mb-4">
              Add your first business partner to start tracking their allocations and payments.
            </p>
            <Button onClick={() => openModal('create')}>
              <UserPlus className="h-4 w-4 mr-2" />
              Add Partner
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {partners.map((partner) => {
            const partnerProjects = getPartnerProjects(partner.id);
            const totalEarnings = getPartnerTotalEarnings(partner.id);
            const outstanding = getPartnerOutstanding(partner.id);

            return (
              <Card key={partner.id} className="dashboard-surface-elevated">
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div className="space-y-1">
                      <CardTitle className="text-lg dashboard-text-primary">{partner.name}</CardTitle>
                      <CardDescription className="flex items-center gap-2">
                        <Mail className="h-3 w-3" />
                        {partner.email}
                      </CardDescription>
                    </div>
                    <Badge variant={partner.type === 'sales' ? 'default' : 'secondary'}>
                      {partner.type === 'sales' ? 'Sales' : 'Managing'}
                    </Badge>
                  </div>
                </CardHeader>
                
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="dashboard-text-secondary">Projects:</span>
                      <div className="font-semibold dashboard-text-primary">{partnerProjects.length}</div>
                    </div>
                    <div>
                      <span className="dashboard-text-secondary">Total Earned:</span>
                      <div className="font-semibold dashboard-text-primary">
                        {currentBusiness ? formatCurrency(totalEarnings, currentBusiness.currency) : '$0.00'}
                      </div>
                    </div>
                  </div>

                  {outstanding > 0 && (
                    <div className="p-3 dashboard-surface rounded-lg">
                      <div className="text-sm dashboard-text-secondary">Outstanding Payment:</div>
                      <div className="font-semibold text-orange-600">
                        {currentBusiness ? formatCurrency(outstanding, currentBusiness.currency) : '$0.00'}
                      </div>
                    </div>
                  )}

                  {partnerProjects.length > 0 && (
                    <div className="space-y-2">
                      <div className="text-sm font-medium dashboard-text-primary">Active Projects:</div>
                      <div className="space-y-1">
                        {partnerProjects.slice(0, 3).map((project) => (
                          <button
                            key={project.id}
                            onClick={() => onNavigateToPage?.('projects', project.id)}
                            className="text-xs dashboard-text-secondary hover:dashboard-text-primary transition-colors block truncate w-full text-left"
                          >
                            • {project.name}
                          </button>
                        ))}
                        {partnerProjects.length > 3 && (
                          <div className="text-xs dashboard-text-secondary">
                            +{partnerProjects.length - 3} more
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  <div className="flex gap-2 pt-2">
                    <Button variant="outline" size="sm" onClick={() => openModal('view', partner)}>
                      <Eye className="h-3 w-3" />
                    </Button>
                    <Button variant="outline" size="sm" onClick={() => openModal('edit', partner)}>
                      <Edit className="h-3 w-3" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      <PartnerModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        partner={selectedPartner}
        mode={modalMode}
      />
    </div>
  );
};