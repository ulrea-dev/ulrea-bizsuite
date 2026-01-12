import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Progress } from '@/components/ui/progress';
import { Search, Users, DollarSign, Layers, ChevronDown, ChevronUp, ExternalLink, Edit, Plus } from 'lucide-react';
import { useBusiness } from '@/contexts/BusinessContext';
import { formatCurrency } from '@/utils/storage';
import { useIsMobile } from '@/hooks/use-mobile';
import { useNavigate } from 'react-router-dom';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { PartnerAllocationManager } from './PartnerAllocationManager';
import { Project, ProjectAllocation } from '@/types/business';
export const PartnerAllocationsPage: React.FC = () => {
  const { data, currentBusiness } = useBusiness();
  const navigate = useNavigate();
  const isMobile = useIsMobile();
  
  const [searchQuery, setSearchQuery] = useState('');
  const [filterBusiness, setFilterBusiness] = useState<string>('all');
  const [expandedProjects, setExpandedProjects] = useState<Set<string>>(new Set());
  const [managingAllocation, setManagingAllocation] = useState<{ project: Project; allocation: ProjectAllocation } | null>(null);

  const projects = data.projects || [];
  const partners = data.partners || [];
  const businesses = data.businesses || [];

  // Get projects that have partner allocations (either phase-based or total)
  const projectsWithPartnerAllocations = projects.filter(project => {
    // Check phase-based allocations
    const hasPhasePartnerAllocations = project.allocationPartnerAllocations?.length > 0;
    // Check legacy allocations
    const hasLegacyPartnerAllocations = project.partnerAllocations?.length > 0;
    
    return hasPhasePartnerAllocations || hasLegacyPartnerAllocations;
  }).filter(project => {
    const matchesSearch = project.name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesBusiness = filterBusiness === 'all' || project.businessId === filterBusiness;
    return matchesSearch && matchesBusiness;
  });

  const toggleProject = (projectId: string) => {
    const newExpanded = new Set(expandedProjects);
    if (newExpanded.has(projectId)) {
      newExpanded.delete(projectId);
    } else {
      newExpanded.add(projectId);
    }
    setExpandedProjects(newExpanded);
  };

  const getProjectPartnerSummary = (projectId: string) => {
    const project = projects.find(p => p.id === projectId);
    if (!project) return { total: 0, paid: 0, outstanding: 0, partnerCount: 0 };

    const phaseAllocations = project.allocationPartnerAllocations || [];
    const legacyAllocations = project.partnerAllocations || [];

    const total = 
      phaseAllocations.reduce((sum, a) => sum + (a.totalAllocated || 0), 0) +
      legacyAllocations.reduce((sum, a) => sum + (a.totalAllocated || 0), 0);
    
    const paid = 
      phaseAllocations.reduce((sum, a) => sum + (a.paidAmount || 0), 0) +
      legacyAllocations.reduce((sum, a) => sum + (a.paidAmount || 0), 0);

    // Get unique partner IDs
    const partnerIds = new Set([
      ...phaseAllocations.map(a => a.partnerId),
      ...legacyAllocations.map(a => a.partnerId)
    ]);

    return {
      total,
      paid,
      outstanding: total - paid,
      partnerCount: partnerIds.size
    };
  };

  const getProjectPartnerDetails = (projectId: string) => {
    const project = projects.find(p => p.id === projectId);
    if (!project) return [];

    const phaseAllocations = project.allocationPartnerAllocations || [];
    const legacyAllocations = project.partnerAllocations || [];

    // Group by partner
    const partnerMap = new Map<string, {
      partnerId: string;
      partnerName: string;
      allocations: Array<{
        allocationId?: string;
        allocationName?: string;
        total: number;
        paid: number;
        outstanding: number;
        type: string;
        value: number;
      }>;
      total: number;
      paid: number;
      outstanding: number;
    }>();

    // Add phase-based allocations
    phaseAllocations.forEach(alloc => {
      const existing = partnerMap.get(alloc.partnerId);
      const allocation = {
        allocationId: alloc.allocationId,
        allocationName: alloc.allocationName,
        total: alloc.totalAllocated || 0,
        paid: alloc.paidAmount || 0,
        outstanding: alloc.outstanding || 0,
        type: alloc.allocationType,
        value: alloc.allocationValue
      };

      if (existing) {
        existing.allocations.push(allocation);
        existing.total += allocation.total;
        existing.paid += allocation.paid;
        existing.outstanding += allocation.outstanding;
      } else {
        partnerMap.set(alloc.partnerId, {
          partnerId: alloc.partnerId,
          partnerName: alloc.partnerName,
          allocations: [allocation],
          total: allocation.total,
          paid: allocation.paid,
          outstanding: allocation.outstanding
        });
      }
    });

    // Add legacy allocations
    legacyAllocations.forEach(alloc => {
      const existing = partnerMap.get(alloc.partnerId);
      const allocation = {
        allocationId: undefined,
        allocationName: 'Project-level',
        total: alloc.totalAllocated || 0,
        paid: alloc.paidAmount || 0,
        outstanding: alloc.outstanding || 0,
        type: alloc.allocationType,
        value: alloc.allocationValue
      };

      if (existing) {
        existing.allocations.push(allocation);
        existing.total += allocation.total;
        existing.paid += allocation.paid;
        existing.outstanding += allocation.outstanding;
      } else {
        partnerMap.set(alloc.partnerId, {
          partnerId: alloc.partnerId,
          partnerName: alloc.partnerName,
          allocations: [allocation],
          total: allocation.total,
          paid: allocation.paid,
          outstanding: allocation.outstanding
        });
      }
    });

    return Array.from(partnerMap.values());
  };

  // Calculate totals
  const totals = projectsWithPartnerAllocations.reduce((acc, project) => {
    const summary = getProjectPartnerSummary(project.id);
    return {
      total: acc.total + summary.total,
      paid: acc.paid + summary.paid,
      outstanding: acc.outstanding + summary.outstanding
    };
  }, { total: 0, paid: 0, outstanding: 0 });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-lg sm:text-xl md:text-2xl font-bold dashboard-text-primary">Partner Allocations</h1>
        <p className="text-xs sm:text-sm dashboard-text-secondary">View and track partner allocations across all projects</p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-xs sm:text-sm dashboard-text-secondary">Projects with Partners</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-xl sm:text-2xl font-bold dashboard-text-primary">{projectsWithPartnerAllocations.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-xs sm:text-sm dashboard-text-secondary">Total Allocated</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-xl sm:text-2xl font-bold dashboard-text-primary">
              {currentBusiness ? formatCurrency(totals.total, currentBusiness.currency) : `$${totals.total.toLocaleString()}`}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-xs sm:text-sm dashboard-text-secondary">Total Paid</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-xl sm:text-2xl font-bold text-green-600">
              {currentBusiness ? formatCurrency(totals.paid, currentBusiness.currency) : `$${totals.paid.toLocaleString()}`}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-xs sm:text-sm dashboard-text-secondary">Outstanding</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-xl sm:text-2xl font-bold text-orange-600">
              {currentBusiness ? formatCurrency(totals.outstanding, currentBusiness.currency) : `$${totals.outstanding.toLocaleString()}`}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search projects..."
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
      </div>

      {/* Projects List */}
      {projectsWithPartnerAllocations.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Layers className="h-12 w-12 dashboard-text-secondary mb-4" />
            <h3 className="text-lg font-semibold dashboard-text-primary mb-2">No partner allocations found</h3>
            <p className="dashboard-text-secondary text-center">
              {searchQuery || filterBusiness !== 'all'
                ? 'Try adjusting your filters'
                : 'Partner allocations will appear here when projects have partner assignments.'}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {projectsWithPartnerAllocations.map((project) => {
            const summary = getProjectPartnerSummary(project.id);
            const partnerDetails = getProjectPartnerDetails(project.id);
            const isExpanded = expandedProjects.has(project.id);
            const business = businesses.find(b => b.id === project.businessId);
            const progressPercent = summary.total > 0 ? (summary.paid / summary.total) * 100 : 0;

            return (
              <Card key={project.id}>
                <Collapsible open={isExpanded} onOpenChange={() => toggleProject(project.id)}>
                  <CollapsibleTrigger asChild>
                    <CardHeader className="cursor-pointer hover:bg-muted/50 transition-colors">
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <CardTitle className="text-base sm:text-lg">{project.name}</CardTitle>
                            <Badge variant={project.status === 'active' ? 'default' : 'secondary'}>
                              {project.status}
                            </Badge>
                          </div>
                          {business && (
                            <p className="text-xs sm:text-sm text-muted-foreground mt-1">{business.name}</p>
                          )}
                        </div>
                        
                        <div className="flex items-center gap-4">
                          <div className="hidden sm:flex items-center gap-6 text-sm">
                            <div className="text-center">
                              <div className="text-muted-foreground">Partners</div>
                              <div className="font-semibold flex items-center gap-1">
                                <Users className="h-4 w-4" />
                                {summary.partnerCount}
                              </div>
                            </div>
                            <div className="text-center">
                              <div className="text-muted-foreground">Total</div>
                              <div className="font-semibold">
                                {currentBusiness ? formatCurrency(summary.total, currentBusiness.currency) : `$${summary.total}`}
                              </div>
                            </div>
                            <div className="text-center">
                              <div className="text-muted-foreground">Outstanding</div>
                              <div className="font-semibold text-orange-600">
                                {currentBusiness ? formatCurrency(summary.outstanding, currentBusiness.currency) : `$${summary.outstanding}`}
                              </div>
                            </div>
                          </div>
                          {isExpanded ? <ChevronUp className="h-5 w-5" /> : <ChevronDown className="h-5 w-5" />}
                        </div>
                      </div>
                      
                      {/* Mobile summary */}
                      <div className="sm:hidden grid grid-cols-3 gap-2 mt-3 text-sm">
                        <div>
                          <div className="text-xs text-muted-foreground">Partners</div>
                          <div className="font-medium">{summary.partnerCount}</div>
                        </div>
                        <div>
                          <div className="text-xs text-muted-foreground">Total</div>
                          <div className="font-medium">
                            {currentBusiness ? formatCurrency(summary.total, currentBusiness.currency) : `$${summary.total}`}
                          </div>
                        </div>
                        <div>
                          <div className="text-xs text-muted-foreground">Outstanding</div>
                          <div className="font-medium text-orange-600">
                            {currentBusiness ? formatCurrency(summary.outstanding, currentBusiness.currency) : `$${summary.outstanding}`}
                          </div>
                        </div>
                      </div>

                      <div className="mt-3">
                        <div className="flex justify-between text-xs mb-1">
                          <span className="text-muted-foreground">Payment Progress</span>
                          <span>{progressPercent.toFixed(0)}%</span>
                        </div>
                        <Progress value={progressPercent} className="h-2" />
                      </div>
                    </CardHeader>
                  </CollapsibleTrigger>

                  <CollapsibleContent>
                    <CardContent className="pt-0">
                      <div className="border-t pt-4">
                        <div className="flex items-center justify-between mb-3">
                          <h4 className="text-sm font-semibold">Partner Breakdown</h4>
                          <div className="flex gap-2">
                            <Button 
                              variant="outline" 
                              size="sm"
                              onClick={() => navigate(`/works/projects/${project.id}`)}
                            >
                              <ExternalLink className="h-3 w-3 mr-1" />
                              View Project
                            </Button>
                          </div>
                        </div>

                        {/* Phase-level management buttons */}
                        {project.allocations && project.allocations.length > 0 && (
                          <div className="mb-4 space-y-2">
                            <Label className="text-xs text-muted-foreground">Manage Partner Allocations by Phase:</Label>
                            <div className="flex flex-wrap gap-2">
                              {project.allocations.map(allocation => (
                                <Button
                                  key={allocation.id}
                                  variant="outline"
                                  size="sm"
                                  onClick={() => setManagingAllocation({ project, allocation })}
                                >
                                  <Edit className="h-3 w-3 mr-1" />
                                  {allocation.title}
                                </Button>
                              ))}
                            </div>
                          </div>
                        )}

                        {isMobile ? (
                          // Mobile view
                          <div className="space-y-3">
                            {partnerDetails.map((partner) => (
                              <div key={partner.partnerId} className="p-3 bg-muted/30 rounded-lg">
                                <div className="flex justify-between items-start mb-2">
                                  <div className="font-medium">{partner.partnerName}</div>
                                  <Badge variant="outline">{partner.allocations.length} allocation(s)</Badge>
                                </div>
                                <div className="grid grid-cols-3 gap-2 text-sm">
                                  <div>
                                    <div className="text-xs text-muted-foreground">Total</div>
                                    <div className="font-medium">
                                      {currentBusiness ? formatCurrency(partner.total, currentBusiness.currency) : `$${partner.total}`}
                                    </div>
                                  </div>
                                  <div>
                                    <div className="text-xs text-muted-foreground">Paid</div>
                                    <div className="font-medium text-green-600">
                                      {currentBusiness ? formatCurrency(partner.paid, currentBusiness.currency) : `$${partner.paid}`}
                                    </div>
                                  </div>
                                  <div>
                                    <div className="text-xs text-muted-foreground">Outstanding</div>
                                    <div className="font-medium text-orange-600">
                                      {currentBusiness ? formatCurrency(partner.outstanding, currentBusiness.currency) : `$${partner.outstanding}`}
                                    </div>
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        ) : (
                          // Desktop table
                          <Table>
                            <TableHeader>
                              <TableRow>
                                <TableHead>Partner</TableHead>
                                <TableHead>Allocations</TableHead>
                                <TableHead className="text-right">Total</TableHead>
                                <TableHead className="text-right">Paid</TableHead>
                                <TableHead className="text-right">Outstanding</TableHead>
                                <TableHead className="text-right">Progress</TableHead>
                              </TableRow>
                            </TableHeader>
                            <TableBody>
                              {partnerDetails.map((partner) => {
                                const partnerProgress = partner.total > 0 ? (partner.paid / partner.total) * 100 : 0;
                                return (
                                  <TableRow key={partner.partnerId}>
                                    <TableCell className="font-medium">{partner.partnerName}</TableCell>
                                    <TableCell>
                                      <div className="flex flex-wrap gap-1">
                                        {partner.allocations.map((alloc, idx) => (
                                          <Badge key={idx} variant="outline" className="text-xs">
                                            {alloc.allocationName || 'Project'}
                                          </Badge>
                                        ))}
                                      </div>
                                    </TableCell>
                                    <TableCell className="text-right">
                                      {currentBusiness ? formatCurrency(partner.total, currentBusiness.currency) : `$${partner.total}`}
                                    </TableCell>
                                    <TableCell className="text-right text-green-600">
                                      {currentBusiness ? formatCurrency(partner.paid, currentBusiness.currency) : `$${partner.paid}`}
                                    </TableCell>
                                    <TableCell className="text-right text-orange-600">
                                      {currentBusiness ? formatCurrency(partner.outstanding, currentBusiness.currency) : `$${partner.outstanding}`}
                                    </TableCell>
                                    <TableCell className="text-right">
                                      <div className="w-20 ml-auto">
                                        <Progress value={partnerProgress} className="h-2" />
                                        <div className="text-xs text-muted-foreground mt-1">{partnerProgress.toFixed(0)}%</div>
                                      </div>
                                    </TableCell>
                                  </TableRow>
                                );
                              })}
                            </TableBody>
                          </Table>
                        )}
                      </div>
                    </CardContent>
                  </CollapsibleContent>
                </Collapsible>
              </Card>
            );
          })}
        </div>
      )}

      {/* Partner Allocation Manager Modal */}
      {managingAllocation && (
        <PartnerAllocationManager
          open={!!managingAllocation}
          onOpenChange={(open) => !open && setManagingAllocation(null)}
          project={managingAllocation.project}
          allocation={managingAllocation.allocation}
        />
      )}
    </div>
  );
};
