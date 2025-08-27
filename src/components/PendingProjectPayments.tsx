import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useBusiness } from '@/contexts/BusinessContext';
import { formatCurrency } from '@/utils/storage';
import { PaymentModal } from '@/components/PaymentModal';
import { User, Briefcase, DollarSign } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

interface PendingPaymentInfo {
  teamMemberId: string;
  memberName: string;
  projectId: string;
  projectName: string;
  allocationId: string;
  allocationTitle: string;
  outstandingAmount: number;
  totalAllocated: number;
  paidAmount: number;
}

export const PendingProjectPayments: React.FC = () => {
  const { data, currentBusiness } = useBusiness();
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [selectedPayment, setSelectedPayment] = useState<PendingPaymentInfo | null>(null);

  if (!currentBusiness) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-muted-foreground">Please select a business to view pending payments.</p>
      </div>
    );
  }

  // Get all projects for the current business
  const businessProjects = data.projects.filter(p => p.businessId === currentBusiness.id);

  // Collect all pending payments from project allocations
  const pendingPayments: PendingPaymentInfo[] = [];

  businessProjects.forEach(project => {
    // Check team allocations
    project.allocationTeamAllocations?.forEach(teamAlloc => {
      const member = data.teamMembers.find(m => m.id === teamAlloc.memberId);
      const allocation = project.allocations?.find(a => a.id === teamAlloc.allocationId);
      
      if (member && allocation) {
        // Calculate actual paid amount from payments data to ensure accuracy
        const allocationPayments = data.payments.filter(payment => 
          payment.projectId === project.id && 
          payment.memberId === teamAlloc.memberId && 
          payment.allocationId === teamAlloc.allocationId &&
          payment.status === 'completed'
        );
        
        const actualPaidAmount = allocationPayments.reduce((sum, payment) => sum + payment.amount, 0);
        const actualOutstanding = Math.max(0, teamAlloc.totalAllocated - actualPaidAmount);
        
        // Only include if there's actually an outstanding amount
        if (actualOutstanding > 0) {
          pendingPayments.push({
            teamMemberId: teamAlloc.memberId,
            memberName: member.name,
            projectId: project.id,
            projectName: project.name,
            allocationId: teamAlloc.allocationId,
            allocationTitle: allocation.title,
            outstandingAmount: actualOutstanding,
            totalAllocated: teamAlloc.totalAllocated,
            paidAmount: actualPaidAmount,
          });
        }
      }
    });
  });

  // Group by team member
  const paymentsByMember = pendingPayments.reduce((acc, payment) => {
    if (!acc[payment.teamMemberId]) {
      acc[payment.teamMemberId] = {
        memberName: payment.memberName,
        payments: [],
        totalOutstanding: 0,
      };
    }
    acc[payment.teamMemberId].payments.push(payment);
    acc[payment.teamMemberId].totalOutstanding += payment.outstandingAmount;
    return acc;
  }, {} as Record<string, { memberName: string; payments: PendingPaymentInfo[]; totalOutstanding: number }>);

  const handleRecordPayment = (payment: PendingPaymentInfo) => {
    setSelectedPayment(payment);
    setShowPaymentModal(true);
  };

  const totalPendingAmount = pendingPayments.reduce((sum, payment) => sum + payment.outstandingAmount, 0);

  return (
    <div className="space-y-6">
      {/* Summary Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <DollarSign className="h-5 w-5" />
            Pending Project Payments Summary
          </CardTitle>
          <CardDescription>
            Outstanding payments from project allocations across all active projects
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-3 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold">
                {Object.keys(paymentsByMember).length}
              </div>
              <div className="text-sm text-muted-foreground">Team Members</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold">
                {pendingPayments.length}
              </div>
              <div className="text-sm text-muted-foreground">Pending Payments</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-orange-600">
                {formatCurrency(totalPendingAmount, currentBusiness.currency)}
              </div>
              <div className="text-sm text-muted-foreground">Total Outstanding</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Pending Payments by Member */}
      {Object.keys(paymentsByMember).length === 0 ? (
        <Card>
          <CardContent className="flex items-center justify-center h-32">
            <p className="text-muted-foreground">No pending project payments found.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {Object.entries(paymentsByMember).map(([memberId, memberData]) => (
            <Card key={memberId}>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <User className="h-5 w-5" />
                    {memberData.memberName}
                  </div>
                  <Badge variant="outline" className="text-orange-600 border-orange-200">
                    {formatCurrency(memberData.totalOutstanding, currentBusiness.currency)} outstanding
                  </Badge>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {memberData.payments.map((payment, index) => (
                    <div
                      key={`${payment.projectId}-${payment.allocationId}`}
                      className="flex items-center justify-between p-3 border rounded-lg"
                    >
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <Briefcase className="h-4 w-4 text-muted-foreground" />
                          <span className="font-medium">{payment.projectName}</span>
                          <span className="text-muted-foreground">•</span>
                          <span className="text-sm text-muted-foreground">{payment.allocationTitle}</span>
                        </div>
                        <div className="text-sm text-muted-foreground">
                          Paid: {formatCurrency(payment.paidAmount, currentBusiness.currency)} of{' '}
                          {formatCurrency(payment.totalAllocated, currentBusiness.currency)}
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="text-right">
                          <div className="font-medium text-orange-600">
                            {formatCurrency(payment.outstandingAmount, currentBusiness.currency)}
                          </div>
                          <div className="text-xs text-muted-foreground">Outstanding</div>
                        </div>
                        <Button
                          size="sm"
                          onClick={() => handleRecordPayment(payment)}
                        >
                          Record Payment
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Payment Modal */}
      {selectedPayment && (
        <PaymentModal
          isOpen={showPaymentModal}
          onClose={() => {
            setShowPaymentModal(false);
            setSelectedPayment(null);
          }}
          projectId={selectedPayment.projectId}
          recipientType="team"
          recipientId={selectedPayment.teamMemberId}
          recipientName={selectedPayment.memberName}
          mode="create"
          allocationId={selectedPayment.allocationId}
        />
      )}
    </div>
  );
};