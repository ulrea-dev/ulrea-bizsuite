import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { UserPlus, Mail, Eye, Edit, Handshake, Building2, Search, Trash2, FileSpreadsheet } from 'lucide-react';
import { useBusiness } from '@/contexts/BusinessContext';
import { useGoogleDrive } from '@/contexts/GoogleDriveContext';
import { PartnerModal } from '@/components/PartnerModal';
import { PartnerSheetModal } from '@/components/PartnerSheetModal';
import { Partner } from '@/types/business';
import { formatCurrency } from '@/utils/storage';
import { useIsMobile } from '@/hooks/use-mobile';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useToast } from '@/hooks/use-toast';

export const PartnersPage: React.FC = () => {
  const { data, currentBusiness, dispatch } = useBusiness();
  const { isConnected: isGoogleConnected } = useGoogleDrive();
  const { toast } = useToast();
  const isMobile = useIsMobile();
  
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedPartner, setSelectedPartner] = useState<Partner | null>(null);
  const [modalMode, setModalMode] = useState<'create' | 'edit' | 'view'>('create');
  const [searchQuery, setSearchQuery] = useState('');
  const [filterBusiness, setFilterBusiness] = useState<string>('all');
  const [filterType, setFilterType] = useState<string>('all');
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [partnerToDelete, setPartnerToDelete] = useState<Partner | null>(null);
  const [sheetModalOpen, setSheetModalOpen] = useState(false);

  const allPartners = data.partners || [];
  const businesses = data.businesses || [];
  const projects = data.projects || [];

  // Filter partners
  const filteredPartners = allPartners.filter(partner => {
    const matchesSearch = partner.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          partner.email.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesBusiness = filterBusiness === 'all' || 
                            partner.businessIds?.includes(filterBusiness) ||
                            (!partner.businessIds?.length && filterBusiness === 'all');
    const matchesType = filterType === 'all' || partner.type === filterType;
    return matchesSearch && matchesBusiness && matchesType;
  });

  const openModal = (mode: 'create' | 'edit' | 'view', partner?: Partner) => {
    setModalMode(mode);
    setSelectedPartner(partner || null);
    setModalOpen(true);
  };

  const handleDeleteClick = (partner: Partner) => {
    setPartnerToDelete(partner);
    setDeleteDialogOpen(true);
  };

  const openSheetModal = () => {
    setSheetModalOpen(true);
  };

  const handleConfirmDelete = () => {
    if (partnerToDelete) {
      dispatch({ type: 'DELETE_PARTNER', payload: partnerToDelete.id });
      toast({
        title: "Partner deleted",
        description: `${partnerToDelete.name} has been removed.`,
      });
      setDeleteDialogOpen(false);
      setPartnerToDelete(null);
    }
  };


  const getPartnerProjects = (partnerId: string) => {
    return projects.filter(project => 
      project.allocationPartnerAllocations?.some(allocation => allocation.partnerId === partnerId) ||
      project.partnerAllocations?.some(allocation => allocation.partnerId === partnerId)
    );
  };

  const getPartnerTotalEarnings = (partnerId: string) => {
    return projects.reduce((total, project) => {
      const phaseAllocation = project.allocationPartnerAllocations?.filter(a => a.partnerId === partnerId) || [];
      const legacyAllocation = project.partnerAllocations?.filter(a => a.partnerId === partnerId) || [];
      const phasePaid = phaseAllocation.reduce((sum, a) => sum + (a.paidAmount || 0), 0);
      const legacyPaid = legacyAllocation.reduce((sum, a) => sum + (a.paidAmount || 0), 0);
      return total + phasePaid + legacyPaid;
    }, 0);
  };

  const getPartnerOutstanding = (partnerId: string) => {
    return projects.reduce((total, project) => {
      const phaseAllocation = project.allocationPartnerAllocations?.filter(a => a.partnerId === partnerId) || [];
      const legacyAllocation = project.partnerAllocations?.filter(a => a.partnerId === partnerId) || [];
      const phaseOutstanding = phaseAllocation.reduce((sum, a) => sum + (a.outstanding || 0), 0);
      const legacyOutstanding = legacyAllocation.reduce((sum, a) => sum + (a.outstanding || 0), 0);
      return total + phaseOutstanding + legacyOutstanding;
    }, 0);
  };

  const getPartnerTotalAllocated = (partnerId: string) => {
    return projects.reduce((total, project) => {
      const phaseAllocation = project.allocationPartnerAllocations?.filter(a => a.partnerId === partnerId) || [];
      const legacyAllocation = project.partnerAllocations?.filter(a => a.partnerId === partnerId) || [];
      const phaseTotal = phaseAllocation.reduce((sum, a) => sum + (a.totalAllocated || 0), 0);
      const legacyTotal = legacyAllocation.reduce((sum, a) => sum + (a.totalAllocated || 0), 0);
      return total + phaseTotal + legacyTotal;
    }, 0);
  };

  const getPartnerBusinessNames = (partner: Partner) => {
    if (!partner.businessIds || partner.businessIds.length === 0) {
      return 'All businesses';
    }
    return partner.businessIds
      .map(id => businesses.find(b => b.id === id)?.name)
      .filter(Boolean)
      .join(', ');
  };

  // Calculate totals
  const totalPartners = filteredPartners.length;
  const totalAllocated = filteredPartners.reduce((sum, p) => sum + getPartnerTotalAllocated(p.id), 0);
  const totalPaid = filteredPartners.reduce((sum, p) => sum + getPartnerTotalEarnings(p.id), 0);
  const totalOutstanding = filteredPartners.reduce((sum, p) => sum + getPartnerOutstanding(p.id), 0);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-lg sm:text-xl md:text-2xl font-bold dashboard-text-primary">Partners Management</h1>
          <p className="text-xs sm:text-sm dashboard-text-secondary">Manage all business partners and their allocations</p>
        </div>
        <Button onClick={() => openModal('create')} className="w-full sm:w-auto">
          <UserPlus className="h-4 w-4 mr-2" />
          Add Partner
        </Button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-xs sm:text-sm dashboard-text-secondary">Total Partners</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-xl sm:text-2xl font-bold dashboard-text-primary">{totalPartners}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-xs sm:text-sm dashboard-text-secondary">Total Allocated</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-xl sm:text-2xl font-bold dashboard-text-primary">
              {currentBusiness ? formatCurrency(totalAllocated, currentBusiness.currency) : `$${totalAllocated.toLocaleString()}`}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-xs sm:text-sm dashboard-text-secondary">Total Paid</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-xl sm:text-2xl font-bold text-green-600">
              {currentBusiness ? formatCurrency(totalPaid, currentBusiness.currency) : `$${totalPaid.toLocaleString()}`}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-xs sm:text-sm dashboard-text-secondary">Outstanding</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-xl sm:text-2xl font-bold text-orange-600">
              {currentBusiness ? formatCurrency(totalOutstanding, currentBusiness.currency) : `$${totalOutstanding.toLocaleString()}`}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search partners..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
        <Select value={filterBusiness} onValueChange={setFilterBusiness}>
          <SelectTrigger className="w-full sm:w-[180px]">
            <SelectValue placeholder="All Businesses" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Businesses</SelectItem>
            {businesses.map(business => (
              <SelectItem key={business.id} value={business.id}>{business.name}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={filterType} onValueChange={setFilterType}>
          <SelectTrigger className="w-full sm:w-[150px]">
            <SelectValue placeholder="All Types" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Types</SelectItem>
            <SelectItem value="sales">Sales</SelectItem>
            <SelectItem value="managing">Managing</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Partners List */}
      {filteredPartners.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Handshake className="h-12 w-12 dashboard-text-secondary mb-4" />
            <h3 className="text-lg font-semibold dashboard-text-primary mb-2">No partners found</h3>
            <p className="dashboard-text-secondary text-center mb-4">
              {searchQuery || filterBusiness !== 'all' || filterType !== 'all'
                ? 'Try adjusting your filters'
                : 'Add your first business partner to start tracking their allocations.'}
            </p>
            {!searchQuery && filterBusiness === 'all' && filterType === 'all' && (
              <Button onClick={() => openModal('create')}>
                <UserPlus className="h-4 w-4 mr-2" />
                Add Partner
              </Button>
            )}
          </CardContent>
        </Card>
      ) : isMobile ? (
        // Mobile Card View
        <div className="space-y-3">
          {filteredPartners.map((partner) => {
            const partnerProjects = getPartnerProjects(partner.id);
            const totalEarnings = getPartnerTotalEarnings(partner.id);
            const outstanding = getPartnerOutstanding(partner.id);
            const totalAllocatedAmount = getPartnerTotalAllocated(partner.id);
            const businessNames = getPartnerBusinessNames(partner);

            return (
              <Card key={partner.id} className="dashboard-surface-elevated">
                <CardContent className="p-4">
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <h4 className="font-medium dashboard-text-primary">{partner.name}</h4>
                      <p className="text-sm dashboard-text-secondary flex items-center gap-1">
                        <Mail className="h-3 w-3" />
                        {partner.email}
                      </p>
                    </div>
                    <Badge variant={partner.type === 'sales' ? 'default' : 'secondary'}>
                      {partner.type === 'sales' ? 'Sales' : 'Managing'}
                    </Badge>
                  </div>
                  
                  <div className="flex items-center gap-2 text-xs dashboard-text-secondary mb-3">
                    <Building2 className="h-3 w-3" />
                    <span className="line-clamp-1">{businessNames}</span>
                  </div>

                  <div className="grid grid-cols-3 gap-2 text-sm mb-3">
                    <div>
                      <div className="text-xs dashboard-text-secondary">Allocated</div>
                      <div className="font-medium">
                        {currentBusiness ? formatCurrency(totalAllocatedAmount, currentBusiness.currency) : `$${totalAllocatedAmount}`}
                      </div>
                    </div>
                    <div>
                      <div className="text-xs dashboard-text-secondary">Paid</div>
                      <div className="font-medium text-green-600">
                        {currentBusiness ? formatCurrency(totalEarnings, currentBusiness.currency) : `$${totalEarnings}`}
                      </div>
                    </div>
                    <div>
                      <div className="text-xs dashboard-text-secondary">Outstanding</div>
                      <div className="font-medium text-orange-600">
                        {currentBusiness ? formatCurrency(outstanding, currentBusiness.currency) : `$${outstanding}`}
                      </div>
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" className="flex-1" onClick={() => openModal('view', partner)}>
                      <Eye className="h-3 w-3 mr-1" />
                      View
                    </Button>
                    <Button variant="outline" size="sm" className="flex-1" onClick={() => openModal('edit', partner)}>
                      <Edit className="h-3 w-3 mr-1" />
                      Edit
                    </Button>
                    {isGoogleConnected && (
                      <Button variant="outline" size="sm" onClick={openSheetModal}>
                        <FileSpreadsheet className="h-3 w-3" />
                      </Button>
                    )}
                    <Button variant="outline" size="sm" onClick={() => handleDeleteClick(partner)}>
                      <Trash2 className="h-3 w-3 text-destructive" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      ) : (
        // Desktop Table View
        <Card>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Businesses</TableHead>
                <TableHead>Projects</TableHead>
                <TableHead className="text-right">Total Allocated</TableHead>
                <TableHead className="text-right">Paid</TableHead>
                <TableHead className="text-right">Outstanding</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredPartners.map((partner) => {
                const partnerProjects = getPartnerProjects(partner.id);
                const totalEarnings = getPartnerTotalEarnings(partner.id);
                const outstanding = getPartnerOutstanding(partner.id);
                const totalAllocatedAmount = getPartnerTotalAllocated(partner.id);
                const businessNames = getPartnerBusinessNames(partner);

                return (
                  <TableRow key={partner.id}>
                    <TableCell className="font-medium">{partner.name}</TableCell>
                    <TableCell className="text-muted-foreground">{partner.email}</TableCell>
                    <TableCell>
                      <Badge variant={partner.type === 'sales' ? 'default' : 'secondary'}>
                        {partner.type === 'sales' ? 'Sales' : 'Managing'}
                      </Badge>
                    </TableCell>
                    <TableCell className="max-w-[150px] truncate text-muted-foreground">
                      {businessNames}
                    </TableCell>
                    <TableCell>{partnerProjects.length}</TableCell>
                    <TableCell className="text-right">
                      {currentBusiness ? formatCurrency(totalAllocatedAmount, currentBusiness.currency) : `$${totalAllocatedAmount}`}
                    </TableCell>
                    <TableCell className="text-right text-green-600">
                      {currentBusiness ? formatCurrency(totalEarnings, currentBusiness.currency) : `$${totalEarnings}`}
                    </TableCell>
                    <TableCell className="text-right text-orange-600">
                      {currentBusiness ? formatCurrency(outstanding, currentBusiness.currency) : `$${outstanding}`}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-1">
                        <Button variant="ghost" size="sm" onClick={() => openModal('view', partner)}>
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="sm" onClick={() => openModal('edit', partner)}>
                          <Edit className="h-4 w-4" />
                        </Button>
                        {isGoogleConnected && (
                          <Button variant="ghost" size="sm" onClick={openSheetModal}>
                            <FileSpreadsheet className="h-4 w-4" />
                          </Button>
                        )}
                        <Button variant="ghost" size="sm" onClick={() => handleDeleteClick(partner)}>
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </Card>
      )}

      {/* Partner Modal */}
      <PartnerModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        partner={selectedPartner}
        mode={modalMode}
      />

      {/* Partner Sheet Modal */}
      <PartnerSheetModal
        isOpen={sheetModalOpen}
        onClose={() => setSheetModalOpen(false)}
      />

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Partner</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete {partnerToDelete?.name}? This action cannot be undone.
              Any existing allocations to this partner will remain in project records.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleConfirmDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};
