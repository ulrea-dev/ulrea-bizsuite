import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { ArrowLeft, Users, Handshake, DollarSign, Calendar, User, Edit, Plus, Eye, Building2, Trash2 } from 'lucide-react';
import { useBusiness } from '@/contexts/BusinessContext';
import { Project, TeamAllocation, PartnerAllocation, CompanyAllocation, Payment } from '@/types/business';
import { formatCurrency } from '@/utils/storage';
import { ProjectModal } from './ProjectModal';
import { PaymentModal } from './PaymentModal';
import { AllocationModal } from './AllocationModal';
import { ClientPaymentModal } from './ClientPaymentModal';

interface ProjectDetailPageProps {
  projectId: string;
  onBack: () => void;
}

export const ProjectDetailPage: React.FC<ProjectDetailPageProps> = ({ projectId, onBack }) => {
  const { data, currentBusiness, dispatch } = useBusiness();
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [paymentModalOpen, setPaymentModalOpen] = useState(false);
  const [allocationModalOpen, setAllocationModalOpen] = useState(false);
  const [selectedRecipient, setSelectedRecipient] = useState<{
    type: 'team' | 'partner';
    id: string;
    name: string;
  } | null>(null);
  const [allocationType, setAllocationType] = useState<'team' | 'partner' | 'company'>('team');
  const [clientPaymentModalOpen, setClientPaymentModalOpen] = useState(false);
  const [selectedPayment, setSelectedPayment] = useState<Payment | null>(null);
  const [paymentMode, setPaymentMode] = useState<'create' | 'edit' | 'view'>('create');

  const project = data.projects.find(p => p.id === projectId);
  const client = project?.clientId ? data.clients.find(c => c.id === project.clientId) : null;
  const teamMembers = data.teamMembers || [];
  const partners = data.partners || [];
  const payments = data.payments.filter(p => p.projectId === projectId);

  if (!project || !currentBusiness) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="dashboard-text-secondary">Project not found</p>
      </div>
    );
  }

  const totalTeamAllocated = project.teamAllocations?.reduce((sum, alloc) => sum + alloc.totalAllocated, 0) || 0;
  const totalPartnerAllocated = project.partnerAllocations?.reduce((sum, alloc) => sum + alloc.totalAllocated, 0) || 0;
  const companyAllocated = project.companyAllocation?.totalAllocated || 0;
  const totalAllocated = totalTeamAllocated + totalPartnerAllocated + companyAllocated;
  const clientPaymentsReceived = project.clientPayments || 0;
  const netProfit = clientPaymentsReceived - totalAllocated;
  const totalPaid = payments.reduce((sum, payment) => payment.status === 'completed' ? sum + payment.amount : sum, 0);
  const remainingBudget = project.totalValue - totalAllocated;
  const outstandingPayments = totalAllocated - totalPaid;

  const openPaymentModal = (type: 'team' | 'partner', id: string, name: string) => {
    setSelectedRecipient({ type, id, name });
    setSelectedPayment(null);
    setPaymentMode('create');
    setPaymentModalOpen(true);
  };

  const openPaymentEditModal = (payment: Payment) => {
    const recipient = payment.recipientType === 'team' 
      ? teamMembers.find(m => m.id === payment.memberId)
      : partners.find(p => p.id === payment.partnerId);
    
    if (recipient) {
      setSelectedRecipient({ 
        type: payment.recipientType as 'team' | 'partner', 
        id: payment.recipientType === 'team' ? payment.memberId! : payment.partnerId!, 
        name: recipient.name 
      });
      setSelectedPayment(payment);
      setPaymentMode('edit');
      setPaymentModalOpen(true);
    }
  };

  const openPaymentViewModal = (payment: Payment) => {
    const recipient = payment.recipientType === 'team' 
      ? teamMembers.find(m => m.id === payment.memberId)
      : partners.find(p => p.id === payment.partnerId);
    
    if (recipient) {
      setSelectedRecipient({ 
        type: payment.recipientType as 'team' | 'partner', 
        id: payment.recipientType === 'team' ? payment.memberId! : payment.partnerId!, 
        name: recipient.name 
      });
      setSelectedPayment(payment);
      setPaymentMode('view');
      setPaymentModalOpen(true);
    }
  };

  const openAllocationModal = (type: 'team' | 'partner' | 'company') => {
    setAllocationType(type);
    setAllocationModalOpen(true);
  };

  const [selectedClientPayment, setSelectedClientPayment] = useState<Payment | null>(null);
  const [clientPaymentMode, setClientPaymentMode] = useState<'create' | 'edit' | 'view'>('create');

  const openClientPaymentEditModal = (payment: Payment) => {
    setSelectedClientPayment(payment);
    setClientPaymentMode('edit');
    setClientPaymentModalOpen(true);
  };

  const openClientPaymentViewModal = (payment: Payment) => {
    setSelectedClientPayment(payment);
    setClientPaymentMode('view');
    setClientPaymentModalOpen(true);
  };

  const removeTeamAllocation = (memberId: string, memberName: string) => {
    if (confirm(`Are you sure you want to remove ${memberName} from this project? This will also delete all associated payments.`)) {
      dispatch({
        type: 'REMOVE_TEAM_ALLOCATION',
        payload: { projectId, memberId }
      });
    }
  };

  const removePartnerAllocation = (partnerId: string, partnerName: string) => {
    if (confirm(`Are you sure you want to remove ${partnerName} from this project? This will also delete all associated payments.`)) {
      dispatch({
        type: 'REMOVE_PARTNER_ALLOCATION',
        payload: { projectId, partnerId }
      });
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="outline" size="sm" onClick={onBack}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Projects
        </Button>
        <div className="flex-1">
          <h1 className="text-3xl font-bold dashboard-text-primary">{project.name}</h1>
          <p className="dashboard-text-secondary">{project.description}</p>
        </div>
        <Button variant="outline" onClick={() => setEditModalOpen(true)}>
          <Edit className="h-4 w-4 mr-2" />
          Edit Project
        </Button>
      </div>

      {/* Project Overview */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-6">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm dashboard-text-secondary">Total Value</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold dashboard-text-primary">
              {formatCurrency(project.totalValue, currentBusiness.currency)}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm dashboard-text-secondary">Allocated</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold dashboard-text-primary">
              {formatCurrency(totalAllocated, currentBusiness.currency)}
            </div>
            <Progress value={(totalAllocated / project.totalValue) * 100} className="mt-2" />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm dashboard-text-secondary">Paid Out</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {formatCurrency(totalPaid, currentBusiness.currency)}
            </div>
            <Progress value={totalAllocated > 0 ? (totalPaid / totalAllocated) * 100 : 0} className="mt-2" />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm dashboard-text-secondary">Client Paid</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">
              {formatCurrency(clientPaymentsReceived, currentBusiness.currency)}
            </div>
            <Progress value={(clientPaymentsReceived / project.totalValue) * 100} className="mt-2" />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm dashboard-text-secondary">Net Profit</CardTitle>
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${netProfit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              {formatCurrency(netProfit, currentBusiness.currency)}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Project Details & Client */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Project Status</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="dashboard-text-secondary">Status:</span>
              <Badge variant={project.status === 'active' ? 'default' : 'secondary'}>
                {project.status}
              </Badge>
            </div>
            <div className="flex items-center justify-between">
              <span className="dashboard-text-secondary">Start Date:</span>
              <span className="dashboard-text-primary">{new Date(project.startDate).toLocaleDateString()}</span>
            </div>
            {project.endDate && (
              <div className="flex items-center justify-between">
                <span className="dashboard-text-secondary">End Date:</span>
                <span className="dashboard-text-primary">{new Date(project.endDate).toLocaleDateString()}</span>
              </div>
            )}
          </CardContent>
        </Card>

        {client && (
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Client</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div>
                <div className="font-semibold dashboard-text-primary">{client.name}</div>
                <div className="text-sm dashboard-text-secondary">{client.company}</div>
                <div className="text-sm dashboard-text-secondary">{client.email}</div>
              </div>
            </CardContent>
          </Card>
        )}

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Budget Breakdown</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="dashboard-text-secondary">Team:</span>
              <span className="dashboard-text-primary">{formatCurrency(totalTeamAllocated, currentBusiness.currency)}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="dashboard-text-secondary">Partners:</span>
              <span className="dashboard-text-primary">{formatCurrency(totalPartnerAllocated, currentBusiness.currency)}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="dashboard-text-secondary">Company:</span>
              <span className="dashboard-text-primary">{formatCurrency(companyAllocated, currentBusiness.currency)}</span>
            </div>
            <div className="flex items-center justify-between border-t pt-2">
              <span className="dashboard-text-secondary">Remaining:</span>
              <span className="font-semibold dashboard-text-primary">{formatCurrency(remainingBudget, currentBusiness.currency)}</span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Team & Partner Management */}
      <Tabs defaultValue="team" className="space-y-6">
        <TabsList>
          <TabsTrigger value="team">Team Allocations</TabsTrigger>
          <TabsTrigger value="partners">Partner Allocations</TabsTrigger>
          <TabsTrigger value="company">Company Allocation</TabsTrigger>
          <TabsTrigger value="client-payments">Client Payments</TabsTrigger>
          <TabsTrigger value="payments">Payment History</TabsTrigger>
        </TabsList>

        <TabsContent value="team" className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold dashboard-text-primary">Team Members</h3>
            <Button onClick={() => openAllocationModal('team')}>
              <Plus className="h-4 w-4 mr-2" />
              Add Team Member
            </Button>
          </div>

          {project.teamAllocations?.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <Users className="h-12 w-12 dashboard-text-secondary mb-4" />
                <p className="dashboard-text-secondary">No team members assigned yet</p>
                <Button className="mt-4" onClick={() => openAllocationModal('team')}>
                  <Plus className="h-4 w-4 mr-2" />
                  Add Team Member
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4">
              {project.teamAllocations?.map((allocation) => (
                <Card key={allocation.memberId}>
                  <CardContent className="flex items-center justify-between p-4">
                    <div className="flex items-center gap-4">
                      <div className="p-2 dashboard-surface rounded-lg">
                        <User className="h-4 w-4 dashboard-text-primary" />
                      </div>
                      <div>
                        <div className="font-semibold dashboard-text-primary">{allocation.memberName}</div>
                        <div className="text-sm dashboard-text-secondary">
                          {allocation.allocationType === 'percentage' 
                            ? `${allocation.allocationValue}% of project` 
                            : formatCurrency(allocation.allocationValue, currentBusiness.currency)
                          }
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="text-right space-y-1">
                        <div className="font-semibold dashboard-text-primary">
                          {formatCurrency(allocation.totalAllocated, currentBusiness.currency)}
                        </div>
                        <div className="text-sm dashboard-text-secondary">
                          Paid: {formatCurrency(allocation.paidAmount, currentBusiness.currency)}
                        </div>
                        {allocation.outstanding > 0 && (
                          <div className="text-sm text-orange-600">
                            Outstanding: {formatCurrency(allocation.outstanding, currentBusiness.currency)}
                          </div>
                        )}
                      </div>
                      <div className="flex flex-col gap-1">
                        <Button 
                          size="sm" 
                          onClick={() => openPaymentModal('team', allocation.memberId, allocation.memberName)}
                          disabled={allocation.outstanding === 0}
                        >
                          <DollarSign className="h-3 w-3 mr-1" />
                          Pay
                        </Button>
                        <Button 
                          size="sm" 
                          variant="destructive"
                          onClick={() => removeTeamAllocation(allocation.memberId, allocation.memberName)}
                        >
                          <Trash2 className="h-3 w-3 mr-1" />
                          Remove
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="partners" className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold dashboard-text-primary">Partners</h3>
            <Button onClick={() => openAllocationModal('partner')}>
              <Plus className="h-4 w-4 mr-2" />
              Add Partner
            </Button>
          </div>

          {project.partnerAllocations?.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <Handshake className="h-12 w-12 dashboard-text-secondary mb-4" />
                <p className="dashboard-text-secondary">No partners assigned yet</p>
                <Button className="mt-4" onClick={() => openAllocationModal('partner')}>
                  <Plus className="h-4 w-4 mr-2" />
                  Add Partner
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4">
              {project.partnerAllocations?.map((allocation) => (
                <Card key={allocation.partnerId}>
                  <CardContent className="flex items-center justify-between p-4">
                    <div className="flex items-center gap-4">
                      <div className="p-2 dashboard-surface rounded-lg">
                        <Handshake className="h-4 w-4 dashboard-text-primary" />
                      </div>
                      <div>
                        <div className="font-semibold dashboard-text-primary">{allocation.partnerName}</div>
                        <div className="text-sm dashboard-text-secondary">
                          {allocation.allocationType === 'percentage' 
                            ? `${allocation.allocationValue}% of project` 
                            : formatCurrency(allocation.allocationValue, currentBusiness.currency)
                          }
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="text-right space-y-1">
                        <div className="font-semibold dashboard-text-primary">
                          {formatCurrency(allocation.totalAllocated, currentBusiness.currency)}
                        </div>
                        <div className="text-sm dashboard-text-secondary">
                          Paid: {formatCurrency(allocation.paidAmount, currentBusiness.currency)}
                        </div>
                        {allocation.outstanding > 0 && (
                          <div className="text-sm text-orange-600">
                            Outstanding: {formatCurrency(allocation.outstanding, currentBusiness.currency)}
                          </div>
                        )}
                      </div>
                      <div className="flex flex-col gap-1">
                        <Button 
                          size="sm" 
                          onClick={() => openPaymentModal('partner', allocation.partnerId, allocation.partnerName)}
                          disabled={allocation.outstanding === 0}
                        >
                          <DollarSign className="h-3 w-3 mr-1" />
                          Pay
                        </Button>
                        <Button 
                          size="sm" 
                          variant="destructive"
                          onClick={() => removePartnerAllocation(allocation.partnerId, allocation.partnerName)}
                        >
                          <Trash2 className="h-3 w-3 mr-1" />
                          Remove
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="company" className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold dashboard-text-primary">Company Allocation</h3>
            {!project.companyAllocation && (
              <Button onClick={() => openAllocationModal('company')}>
                <Plus className="h-4 w-4 mr-2" />
                Set Company Allocation
              </Button>
            )}
          </div>

          {!project.companyAllocation ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <Building2 className="h-12 w-12 dashboard-text-secondary mb-4" />
                <p className="dashboard-text-secondary">No company allocation set yet</p>
                <p className="text-sm dashboard-text-secondary mb-4">Set your business profit allocation for this project</p>
                <Button className="mt-4" onClick={() => openAllocationModal('company')}>
                  <Plus className="h-4 w-4 mr-2" />
                  Set Company Allocation
                </Button>
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardContent className="flex items-center justify-between p-4">
                <div className="flex items-center gap-4">
                  <div className="p-2 dashboard-surface rounded-lg">
                    <Building2 className="h-4 w-4 dashboard-text-primary" />
                  </div>
                  <div>
                    <div className="font-semibold dashboard-text-primary">{project.companyAllocation.businessName}</div>
                    <div className="text-sm dashboard-text-secondary">
                      {project.companyAllocation.allocationType === 'percentage' 
                        ? `${project.companyAllocation.allocationValue}% of project (Business Profit)` 
                        : `${formatCurrency(project.companyAllocation.allocationValue, currentBusiness.currency)} (Business Profit)`
                      }
                    </div>
                  </div>
                </div>
                <div className="text-right space-y-1">
                  <div className="font-semibold text-green-600">
                    {formatCurrency(project.companyAllocation.totalAllocated, currentBusiness.currency)}
                  </div>
                  <div className="text-sm dashboard-text-secondary">
                    Withdrawn: {formatCurrency(project.companyAllocation.paidAmount, currentBusiness.currency)}
                  </div>
                  {project.companyAllocation.outstanding > 0 && (
                    <div className="text-sm text-blue-600">
                      Available: {formatCurrency(project.companyAllocation.outstanding, currentBusiness.currency)}
                    </div>
                  )}
                  <Button 
                    size="sm" 
                    variant="outline"
                    onClick={() => openAllocationModal('company')}
                  >
                    <Edit className="h-3 w-3 mr-1" />
                    Edit
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="client-payments" className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold dashboard-text-primary">Client Payments</h3>
            <Button onClick={() => {
              setSelectedClientPayment(null);
              setClientPaymentMode('create');
              setClientPaymentModalOpen(true);
            }}>
              <Plus className="h-4 w-4 mr-2" />
              Record Payment
            </Button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm dashboard-text-secondary">Total Expected</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-xl font-bold dashboard-text-primary">
                  {formatCurrency(project.totalValue, currentBusiness.currency)}
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm dashboard-text-secondary">Amount Received</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-xl font-bold text-blue-600">
                  {formatCurrency(clientPaymentsReceived, currentBusiness.currency)}
                </div>
                <Progress value={(clientPaymentsReceived / project.totalValue) * 100} className="mt-2" />
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm dashboard-text-secondary">Outstanding</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-xl font-bold text-orange-600">
                  {formatCurrency(Math.max(0, project.totalValue - clientPaymentsReceived), currentBusiness.currency)}
                </div>
              </CardContent>
            </Card>
          </div>

          {payments.filter(p => p.type === 'incoming').length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <DollarSign className="h-12 w-12 dashboard-text-secondary mb-4" />
                <p className="dashboard-text-secondary">No client payments recorded yet</p>
                <Button className="mt-4" onClick={() => {
                  setSelectedClientPayment(null);
                  setClientPaymentMode('create');
                  setClientPaymentModalOpen(true);
                }}>
                  <Plus className="h-4 w-4 mr-2" />
                  Record First Payment
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-3">
              {payments.filter(p => p.type === 'incoming').map((payment) => (
                <Card key={payment.id}>
                  <CardContent className="flex items-center justify-between p-4">
                    <div className="flex items-center gap-4">
                      <div className="p-2 bg-green-100 rounded-lg">
                        <DollarSign className="h-4 w-4 text-green-600" />
                      </div>
                      <div>
                        <div className="font-semibold dashboard-text-primary">
                          Payment from {client?.name || 'Client'}
                        </div>
                        <div className="text-sm dashboard-text-secondary">
                          {new Date(payment.date).toLocaleDateString()}
                        </div>
                        {payment.description && (
                          <div className="text-sm dashboard-text-secondary">{payment.description}</div>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="text-right">
                        <div className="font-semibold text-green-600">
                          {formatCurrency(payment.amount, currentBusiness.currency)}
                        </div>
                        <Badge variant={payment.status === 'completed' ? 'default' : 'secondary'}>
                          {payment.status}
                        </Badge>
                      </div>
                      <div className="flex gap-1">
                        <Button 
                          size="sm" 
                          variant="outline"
                          onClick={() => openClientPaymentViewModal(payment)}
                        >
                          <Eye className="h-3 w-3" />
                        </Button>
                        <Button 
                          size="sm" 
                          variant="outline"
                          onClick={() => openClientPaymentEditModal(payment)}
                        >
                          <Edit className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="payments" className="space-y-4">
          <h3 className="text-lg font-semibold dashboard-text-primary">Payment History</h3>
          
          {payments.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <Calendar className="h-12 w-12 dashboard-text-secondary mb-4" />
                <p className="dashboard-text-secondary">No payments recorded yet</p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-3">
              {payments.map((payment) => {
                const recipient = payment.recipientType === 'team' 
                  ? teamMembers.find(m => m.id === payment.memberId)
                  : payment.recipientType === 'partner'
                  ? partners.find(p => p.id === payment.partnerId)
                  : null;
                
                return (
                  <Card key={payment.id}>
                    <CardContent className="flex items-center justify-between p-4">
                      <div className="flex items-center gap-4">
                        <div className="p-2 dashboard-surface rounded-lg">
                          {payment.type === 'incoming' ? (
                            <DollarSign className="h-4 w-4 text-green-600" />
                          ) : payment.recipientType === 'team' ? (
                            <User className="h-4 w-4 dashboard-text-primary" />
                          ) : (
                            <Handshake className="h-4 w-4 dashboard-text-primary" />
                          )}
                        </div>
                        <div>
                          <div className="font-semibold dashboard-text-primary">
                            {payment.type === 'incoming' 
                              ? `Payment from ${client?.name || 'Client'}`
                              : recipient?.name || 'Unknown Recipient'
                            }
                          </div>
                          <div className="text-sm dashboard-text-secondary">
                            {new Date(payment.date).toLocaleDateString()}
                          </div>
                          {payment.description && (
                            <div className="text-sm dashboard-text-secondary">{payment.description}</div>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="text-right">
                          <div className={`font-semibold ${payment.type === 'incoming' ? 'text-green-600' : 'dashboard-text-primary'}`}>
                            {formatCurrency(payment.amount, currentBusiness.currency)}
                          </div>
                          <Badge variant={payment.status === 'completed' ? 'default' : 'secondary'}>
                            {payment.status}
                          </Badge>
                        </div>
                        <div className="flex gap-1">
                          <Button 
                            size="sm" 
                            variant="outline"
                            onClick={() => {
                              if (payment.type === 'incoming') {
                                openClientPaymentViewModal(payment);
                              } else {
                                openPaymentViewModal(payment);
                              }
                            }}
                          >
                            <Eye className="h-3 w-3" />
                          </Button>
                          <Button 
                            size="sm" 
                            variant="outline"
                            onClick={() => {
                              if (payment.type === 'incoming') {
                                openClientPaymentEditModal(payment);
                              } else {
                                openPaymentEditModal(payment);
                              }
                            }}
                          >
                            <Edit className="h-3 w-3" />
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* Modals */}
      <ProjectModal
        isOpen={editModalOpen}
        onClose={() => setEditModalOpen(false)}
        project={project}
        mode="edit"
      />

      {selectedRecipient && (
        <PaymentModal
          isOpen={paymentModalOpen}
          onClose={() => {
            setPaymentModalOpen(false);
            setSelectedRecipient(null);
            setSelectedPayment(null);
          }}
          projectId={projectId}
          recipientType={selectedRecipient.type}
          recipientId={selectedRecipient.id}
          recipientName={selectedRecipient.name}
          payment={selectedPayment}
          mode={paymentMode}
        />
      )}

      <AllocationModal
        isOpen={allocationModalOpen}
        onClose={() => setAllocationModalOpen(false)}
        projectId={projectId}
        allocationType={allocationType}
        mode="create"
      />

      <ClientPaymentModal
        isOpen={clientPaymentModalOpen}
        onClose={() => {
          setClientPaymentModalOpen(false);
          setSelectedClientPayment(null);
        }}
        projectId={projectId}
        clientId={client?.id}
        clientName={client?.name || 'Client'}
        payment={selectedClientPayment}
        mode={clientPaymentMode}
      />
    </div>
  );
};
