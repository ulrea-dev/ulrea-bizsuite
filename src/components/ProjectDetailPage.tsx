import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { ArrowLeft, Users, Handshake, DollarSign, Calendar, User, Edit, Plus, Eye, Building2, Trash2, Receipt, TrendingDown, Layers } from 'lucide-react';
import { useBusiness } from '@/contexts/BusinessContext';
import { Project, TeamAllocation, PartnerAllocation, CompanyAllocation, Payment, Expense, EXPENSE_CATEGORIES } from '@/types/business';
import { formatCurrency } from '@/utils/storage';
import { ProjectModal } from './ProjectModal';
import { PaymentModal } from './PaymentModal';
import { AllocationModal } from './AllocationModal';
import { ClientPaymentModal } from './ClientPaymentModal';
import { ExpenseModal } from './ExpenseModal';
import { AllocationPhaseModal } from './AllocationPhaseModal';
import { AllocationPhaseCard } from './AllocationPhaseCard';

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
  const [expenseModalOpen, setExpenseModalOpen] = useState(false);
  const [selectedExpense, setSelectedExpense] = useState<Expense | null>(null);
  const [expenseMode, setExpenseMode] = useState<'create' | 'edit' | 'view'>('create');

  const project = data.projects.find(p => p.id === projectId);
  const client = project?.clientId ? data.clients.find(c => c.id === project.clientId) : null;
  const teamMembers = data.teamMembers || [];
  const partners = data.partners || [];
  const payments = data.payments.filter(p => p.projectId === projectId);
  const expenses = project?.expenses || [];

  if (!project || !currentBusiness) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="dashboard-text-secondary">Project not found</p>
      </div>
    );
  }

  // Calculate total project value from allocations if using multiple allocations, otherwise use totalValue
  const totalProjectValue = project.isMultiPhase && project.allocations?.length 
    ? project.allocations.reduce((sum, allocation) => sum + allocation.budget, 0)
    : project.totalValue;

  // Only show allocations if project has actual allocations created
  const totalTeamAllocated = project.allocationTeamAllocations?.reduce((sum, alloc) => sum + alloc.totalAllocated, 0) || 0;
  const totalPartnerAllocated = project.allocationPartnerAllocations?.reduce((sum, alloc) => sum + alloc.totalAllocated, 0) || 0;
  const companyAllocated = project.allocationCompanyAllocations?.reduce((sum, alloc) => sum + alloc.totalAllocated, 0) || 0;
  
  const totalAllocated = totalTeamAllocated + totalPartnerAllocated + companyAllocated;
  const clientPaymentsReceived = project.clientPayments || 0;
  const totalExpenses = expenses.reduce((sum, expense) => sum + expense.amount, 0);
  const netProfit = clientPaymentsReceived - totalAllocated - totalExpenses;
  const totalPaid = payments
    .filter(payment => payment.type === 'outgoing' && payment.status === 'completed')
    .reduce((sum, payment) => sum + payment.amount, 0);
  const remainingBudget = totalProjectValue - totalAllocated - totalExpenses;
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


  const openExpenseModal = (mode: 'create' | 'edit' | 'view', expense?: Expense) => {
    setSelectedExpense(expense || null);
    setExpenseMode(mode);
    setExpenseModalOpen(true);
  };

  const expensesByCategory = expenses.reduce((acc, expense) => {
    acc[expense.category] = (acc[expense.category] || 0) + expense.amount;
    return acc;
  }, {} as Record<string, number>);

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

      {/* Project Overview - Updated to include expenses */}
      <div className="grid grid-cols-1 md:grid-cols-6 gap-6">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm dashboard-text-secondary">Total Value</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold dashboard-text-primary">
              {formatCurrency(totalProjectValue, currentBusiness.currency)}
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
            <Progress value={(totalAllocated / totalProjectValue) * 100} className="mt-2" />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm dashboard-text-secondary">Expenses</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">
              {formatCurrency(totalExpenses, currentBusiness.currency)}
            </div>
            <Progress value={(totalExpenses / totalProjectValue) * 100} className="mt-2" />
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
            <Progress value={(clientPaymentsReceived / totalProjectValue) * 100} className="mt-2" />
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

      {/* Project Details & Client - Updated budget breakdown */}
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
            <div className="flex items-center justify-between">
              <span className="dashboard-text-secondary">Expenses:</span>
              <span className="text-red-600">{formatCurrency(totalExpenses, currentBusiness.currency)}</span>
            </div>
            <div className="flex items-center justify-between border-t pt-2">
              <span className="dashboard-text-secondary">Remaining:</span>
              <span className="font-semibold dashboard-text-primary">{formatCurrency(remainingBudget, currentBusiness.currency)}</span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Project Management */}
      <Tabs defaultValue="allocations" className="space-y-6">
        <TabsList>
          <TabsTrigger value="allocations">Project Allocations</TabsTrigger>
          <TabsTrigger value="team-payments">Team Payments</TabsTrigger>
          <TabsTrigger value="expenses">Expenses</TabsTrigger>
          <TabsTrigger value="client-payments">Client Payments</TabsTrigger>
          <TabsTrigger value="payments">Payment History</TabsTrigger>
        </TabsList>


        <TabsContent value="allocations" className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold dashboard-text-primary">Project Allocations</h3>
            <AllocationPhaseModal projectId={projectId}>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Add Allocation
              </Button>
            </AllocationPhaseModal>
          </div>

          {!project.allocations || project.allocations.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <Layers className="h-12 w-12 dashboard-text-secondary mb-4" />
                <p className="dashboard-text-secondary">No allocations created yet</p>
                <p className="text-sm dashboard-text-secondary mb-4">Break down your project into manageable allocations with dedicated budgets</p>
                <AllocationPhaseModal projectId={projectId}>
                  <Button className="mt-4">
                    <Plus className="h-4 w-4 mr-2" />
                    Create First Allocation
                  </Button>
                </AllocationPhaseModal>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4">
              {project.allocations.map((allocation) => (
                <AllocationPhaseCard 
                  key={allocation.id} 
                  allocation={allocation} 
                  project={project} 
                  currentBusiness={currentBusiness} 
                />
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="team-payments" className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold dashboard-text-primary">Team Payments</h3>
          </div>

          {/* Team Payment Summary by Allocation */}
          {project.allocations && project.allocations.length > 0 ? (
            <div className="space-y-6">
              {project.allocations.map((allocation) => {
                const allocationTeamMembers = project.allocationTeamAllocations?.filter(
                  teamAlloc => teamAlloc.allocationId === allocation.id
                ) || [];
                
                const allocationPayments = payments.filter(p => 
                  p.recipientType === 'team' && 
                  p.type === 'outgoing' && 
                  p.allocationId === allocation.id
                );
                
                const totalAllocationPaid = allocationPayments
                  .filter(p => p.status === 'completed')
                  .reduce((sum, p) => sum + p.amount, 0);
                
                const totalAllocationAllocated = allocationTeamMembers
                  .reduce((sum, member) => sum + member.totalAllocated, 0);

                if (allocationTeamMembers.length === 0) return null;

                return (
                  <Card key={allocation.id}>
                    <CardHeader>
                      <div className="flex items-center justify-between">
                        <div>
                          <CardTitle className="text-lg">{allocation.title}</CardTitle>
                          <CardDescription>
                            Team allocation: {formatCurrency(totalAllocationAllocated, currentBusiness.currency)} • 
                            Paid: {formatCurrency(totalAllocationPaid, currentBusiness.currency)} • 
                            Outstanding: {formatCurrency(totalAllocationAllocated - totalAllocationPaid, currentBusiness.currency)}
                          </CardDescription>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        {allocationTeamMembers.map((teamAlloc) => {
                          const member = teamMembers.find(m => m.id === teamAlloc.memberId);
                          const memberPayments = allocationPayments.filter(p => p.memberId === teamAlloc.memberId);
                          const memberPaid = memberPayments
                            .filter(p => p.status === 'completed')
                            .reduce((sum, p) => sum + p.amount, 0);
                          const memberOutstanding = teamAlloc.totalAllocated - memberPaid;

                          if (!member) return null;

                          return (
                            <div key={teamAlloc.memberId} className="flex items-center justify-between p-4 border rounded-lg dashboard-surface">
                              <div className="flex items-center gap-4">
                                <div className="p-2 dashboard-surface rounded-lg">
                                  <Users className="h-4 w-4 dashboard-text-primary" />
                                </div>
                                <div>
                                  <div className="font-semibold dashboard-text-primary">{member.name}</div>
                                  <div className="text-sm dashboard-text-secondary">
                                    Allocated: {formatCurrency(teamAlloc.totalAllocated, currentBusiness.currency)} • 
                                    Paid: {formatCurrency(memberPaid, currentBusiness.currency)} • 
                                    Outstanding: {formatCurrency(memberOutstanding, currentBusiness.currency)}
                                  </div>
                                </div>
                              </div>
                              <div className="flex items-center gap-2">
                                {memberOutstanding > 0 && (
                                  <Button
                                    size="sm"
                                    onClick={() => {
                                      setSelectedRecipient({ type: 'team', id: member.id, name: member.name });
                                      setSelectedPayment(null);
                                      setPaymentMode('create');
                                      setPaymentModalOpen(true);
                                    }}
                                  >
                                    <Plus className="h-4 w-4 mr-2" />
                                    Pay
                                  </Button>
                                )}
                              </div>
                            </div>
                          );
                        })}

                        {/* Recent Payments for this Allocation */}
                        {allocationPayments.length > 0 && (
                          <div className="mt-4">
                            <h4 className="font-medium dashboard-text-primary mb-3">Recent Payments</h4>
                            <div className="space-y-2">
                              {allocationPayments.slice(0, 3).map((payment) => {
                                const member = teamMembers.find(m => m.id === payment.memberId);
                                return (
                                  <div key={payment.id} className="flex items-center justify-between text-sm p-2 dashboard-surface rounded">
                                    <div>
                                      <span className="dashboard-text-primary">{member?.name}</span>
                                      <span className="dashboard-text-secondary ml-2">{new Date(payment.date).toLocaleDateString()}</span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                      <span className="font-medium dashboard-text-primary">
                                        {formatCurrency(payment.amount, currentBusiness.currency)}
                                      </span>
                                      <Badge variant={payment.status === 'completed' ? 'default' : 'secondary'} className="text-xs">
                                        {payment.status}
                                      </Badge>
                                      <div className="flex gap-1">
                                        <Button 
                                          size="sm" 
                                          variant="outline"
                                          onClick={() => openPaymentViewModal(payment)}
                                        >
                                          <Eye className="h-3 w-3" />
                                        </Button>
                                        <Button 
                                          size="sm" 
                                          variant="outline"
                                          onClick={() => openPaymentEditModal(payment)}
                                        >
                                          <Edit className="h-3 w-3" />
                                        </Button>
                                      </div>
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          ) : (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <Users className="h-12 w-12 dashboard-text-secondary mb-4" />
                <p className="dashboard-text-secondary">No team allocations created yet</p>
                <p className="text-sm dashboard-text-secondary mb-4">Create project allocations with team members to start recording payments</p>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="expenses" className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold dashboard-text-primary">Project Expenses</h3>
            <Button onClick={() => openExpenseModal('create')}>
              <Plus className="h-4 w-4 mr-2" />
              Add Expense
            </Button>
          </div>

          {/* Expense Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm dashboard-text-secondary">Total Expenses</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-xl font-bold text-red-600">
                  {formatCurrency(totalExpenses, currentBusiness.currency)}
                </div>
                <Progress value={(totalExpenses / totalProjectValue) * 100} className="mt-2" />
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm dashboard-text-secondary">Paid Expenses</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-xl font-bold dashboard-text-primary">
                  {formatCurrency(expenses.filter(e => e.status === 'paid').reduce((sum, e) => sum + e.amount, 0), currentBusiness.currency)}
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm dashboard-text-secondary">Pending Expenses</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-xl font-bold text-orange-600">
                  {formatCurrency(expenses.filter(e => e.status === 'pending').reduce((sum, e) => sum + e.amount, 0), currentBusiness.currency)}
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm dashboard-text-secondary">Categories</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-xl font-bold dashboard-text-primary">
                  {Object.keys(expensesByCategory).length}
                </div>
              </CardContent>
            </Card>
          </div>

          {expenses.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <Receipt className="h-12 w-12 dashboard-text-secondary mb-4" />
                <p className="dashboard-text-secondary">No expenses recorded yet</p>
                <Button className="mt-4" onClick={() => openExpenseModal('create')}>
                  <Plus className="h-4 w-4 mr-2" />
                  Add First Expense
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-3">
              {expenses.map((expense) => {
                const category = EXPENSE_CATEGORIES.find(c => c.value === expense.category);
                return (
                  <Card key={expense.id}>
                    <CardContent className="flex items-center justify-between p-4">
                      <div className="flex items-center gap-4">
                        <div className="p-2 bg-red-100 rounded-lg">
                          <Receipt className="h-4 w-4 text-red-600" />
                        </div>
                        <div>
                          <div className="font-semibold dashboard-text-primary">{expense.name}</div>
                          <div className="text-sm dashboard-text-secondary">
                            {category?.label} • {new Date(expense.date).toLocaleDateString()}
                          </div>
                          {expense.description && (
                            <div className="text-sm dashboard-text-secondary">{expense.description}</div>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="text-right">
                          <div className="font-semibold text-red-600">
                            {formatCurrency(expense.amount, currentBusiness.currency)}
                          </div>
                          <Badge variant={expense.status === 'paid' ? 'default' : 'secondary'}>
                            {expense.status}
                          </Badge>
                        </div>
                        <div className="flex gap-1">
                          <Button 
                            size="sm" 
                            variant="outline"
                            onClick={() => openExpenseModal('view', expense)}
                          >
                            <Eye className="h-3 w-3" />
                          </Button>
                          <Button 
                            size="sm" 
                            variant="outline"
                            onClick={() => openExpenseModal('edit', expense)}
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
                  {formatCurrency(totalProjectValue, currentBusiness.currency)}
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
                <Progress value={(clientPaymentsReceived / totalProjectValue) * 100} className="mt-2" />
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm dashboard-text-secondary">Outstanding</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-xl font-bold text-orange-600">
                  {formatCurrency(Math.max(0, totalProjectValue - clientPaymentsReceived), currentBusiness.currency)}
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
          allocationId={selectedPayment?.allocationId}
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

      <ExpenseModal
        isOpen={expenseModalOpen}
        onClose={() => {
          setExpenseModalOpen(false);
          setSelectedExpense(null);
        }}
        projectId={projectId}
        expense={selectedExpense}
        mode={expenseMode}
      />
    </div>
  );
};
