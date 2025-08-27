import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { useBusiness } from '@/contexts/BusinessContext';
import { formatCurrency } from '@/utils/storage';
import { Payment } from '@/types/business';
import { Search, Calendar, User, Briefcase, CheckCircle, Clock, DollarSign, Trash2, MoreHorizontal } from 'lucide-react';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';

export const AllPaymentsView: React.FC = () => {
  const { data, currentBusiness, dispatch } = useBusiness();
  const { toast } = useToast();
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<string>('all');
  const [filterStatus, setFilterStatus] = useState<string>('all');

  if (!currentBusiness) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-muted-foreground">Please select a business to view payments.</p>
      </div>
    );
  }

  // Get all payments (including salary payments as regular payments) - excluding incoming payments
  const allPayments: (Payment & { displayName?: string; source?: string })[] = [
    // Regular payments (outgoing only)
    ...data.payments.filter(payment => {
      // Filter by business through projects or direct business relationship
      const project = payment.projectId ? data.projects.find(p => p.id === payment.projectId) : null;
      const isBusinessRelated = project?.businessId === currentBusiness.id || !payment.projectId;
      // Only include outgoing payments
      return isBusinessRelated && payment.type === 'outgoing';
    }).map(payment => {
      const member = payment.memberId ? data.teamMembers.find(m => m.id === payment.memberId) : null;
      const partner = payment.partnerId ? data.partners.find(p => p.id === payment.partnerId) : null;
      const project = payment.projectId ? data.projects.find(p => p.id === payment.projectId) : null;
      
      return {
        ...payment,
        displayName: member?.name || partner?.name || 'Unknown',
        source: payment.paymentSource || 'project',
      };
    }),
    
    // Salary payments converted to Payment format
    ...data.salaryPayments.filter(salaryPayment => {
      const salaryRecord = data.salaryRecords.find(r => r.id === salaryPayment.salaryRecordId);
      return salaryRecord?.businessId === currentBusiness.id;
    }).map(salaryPayment => {
      const salaryRecord = data.salaryRecords.find(r => r.id === salaryPayment.salaryRecordId);
      const member = salaryRecord ? data.teamMembers.find(m => m.id === salaryRecord.teamMemberId) : null;
      
      return {
        id: salaryPayment.id,
        amount: salaryPayment.amount,
        date: salaryPayment.paymentDate,
        type: 'outgoing' as const,
        recipientType: 'team' as const,
        status: salaryPayment.status === 'paid' ? 'completed' as const : 'pending' as const,
        memberId: salaryRecord?.teamMemberId,
        description: salaryPayment.description || `Salary payment - ${salaryPayment.period}`,
        paymentSource: 'salary' as const,
        displayName: member?.name || 'Unknown',
        source: 'salary',
      };
    }),
  ];

  // Apply filters
  const filteredPayments = allPayments.filter(payment => {
    const matchesSearch = searchTerm === '' || 
      payment.displayName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      payment.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      payment.taskDescription?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesType = filterType === 'all' || payment.source === filterType;
    const matchesStatus = filterStatus === 'all' || payment.status === filterStatus;
    
    return matchesSearch && matchesType && matchesStatus;
  });

  // Sort by date (newest first)
  const sortedPayments = filteredPayments.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  // Calculate totals
  const totalAmount = filteredPayments.reduce((sum, payment) => sum + payment.amount, 0);
  const completedAmount = filteredPayments.filter(p => p.status === 'completed').reduce((sum, payment) => sum + payment.amount, 0);
  const pendingAmount = filteredPayments.filter(p => p.status === 'pending').reduce((sum, payment) => sum + payment.amount, 0);

  const getPaymentTypeColor = (source: string) => {
    switch (source) {
      case 'salary': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'project': return 'bg-green-100 text-green-800 border-green-200';
      case 'task': return 'bg-purple-100 text-purple-800 border-purple-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getPaymentTypeIcon = (source: string) => {
    switch (source) {
      case 'salary': return <User className="h-3 w-3" />;
      case 'project': return <Briefcase className="h-3 w-3" />;
      case 'task': return <CheckCircle className="h-3 w-3" />;
      default: return <DollarSign className="h-3 w-3" />;
    }
  };

  const handleDeletePayment = (payment: Payment & { displayName?: string; source?: string }) => {
    if (payment.source === 'salary') {
      // For salary payments, delete the salary payment record
      dispatch({
        type: 'DELETE_SALARY_PAYMENT',
        payload: payment.id
      });
      toast({
        title: "Payment Deleted",
        description: `Salary payment for ${payment.displayName} has been deleted.`,
      });
    } else {
      // For regular payments, delete the payment record
      dispatch({
        type: 'DELETE_PAYMENT',
        payload: payment.id
      });
      toast({
        title: "Payment Deleted",
        description: `Payment for ${payment.displayName} has been deleted.`,
      });
    }
  };

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total Payments</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{filteredPayments.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total Amount</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatCurrency(totalAmount, currentBusiness.currency)}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Completed</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {formatCurrency(completedAmount, currentBusiness.currency)}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Pending</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">
              {formatCurrency(pendingAmount, currentBusiness.currency)}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle>Payment History & Management</CardTitle>
          <CardDescription>
            View and filter all payments including salaries, project payments, and task payments
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4 mb-6">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                <Input
                  placeholder="Search payments, recipients, or descriptions..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <Select value={filterType} onValueChange={setFilterType}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Filter by type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                <SelectItem value="salary">Salary Payments</SelectItem>
                <SelectItem value="project">Project Payments</SelectItem>
                <SelectItem value="task">Task Payments</SelectItem>
              </SelectContent>
            </Select>
            <Select value={filterStatus} onValueChange={setFilterStatus}>
              <SelectTrigger className="w-32">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="completed">Completed</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Payments List */}
          <div className="space-y-3">
            {sortedPayments.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                No payments found matching your criteria.
              </div>
            ) : (
              sortedPayments.map((payment) => (
                <div
                  key={payment.id}
                  className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors"
                >
                  <div className="flex items-center gap-4 flex-1">
                    <div className="flex items-center gap-2">
                      {getPaymentTypeIcon(payment.source || 'project')}
                      <Badge variant="outline" className={getPaymentTypeColor(payment.source || 'project')}>
                        {payment.source || 'project'}
                      </Badge>
                    </div>
                    
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-medium">{payment.displayName}</span>
                        <Badge variant={payment.status === 'completed' ? 'default' : 'secondary'}>
                          {payment.status === 'completed' ? (
                            <>
                              <CheckCircle className="h-3 w-3 mr-1" />
                              Paid
                            </>
                          ) : (
                            <>
                              <Clock className="h-3 w-3 mr-1" />
                              Pending
                            </>
                          )}
                        </Badge>
                      </div>
                      
                      <div className="text-sm text-muted-foreground">
                        {payment.taskDescription && (
                          <div className="mb-1">
                            <span className="font-medium">Task:</span> {payment.taskDescription}
                            {payment.taskType && (
                              <span className="ml-2 text-xs bg-muted px-2 py-1 rounded">
                                {payment.taskType}
                              </span>
                            )}
                          </div>
                        )}
                        {payment.description && (
                          <div>{payment.description}</div>
                        )}
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-4">
                    <div className="text-right">
                      <div className="font-semibold">
                        {formatCurrency(payment.amount, currentBusiness.currency)}
                      </div>
                      <div className="text-sm text-muted-foreground flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        {format(new Date(payment.date), 'MMM dd, yyyy')}
                      </div>
                    </div>
                    
                    {/* Actions Menu */}
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="sm">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <DropdownMenuItem onSelect={(e) => e.preventDefault()} className="text-destructive cursor-pointer">
                              <Trash2 className="h-4 w-4 mr-2" />
                              Delete Payment
                            </DropdownMenuItem>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Delete Payment</AlertDialogTitle>
                              <AlertDialogDescription>
                                Are you sure you want to delete this payment for {payment.displayName}? 
                                This action cannot be undone.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancel</AlertDialogCancel>
                              <AlertDialogAction
                                onClick={() => handleDeletePayment(payment)}
                                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                              >
                                Delete
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};