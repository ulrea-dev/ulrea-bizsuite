import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Trash2, Calendar, DollarSign, CreditCard, FileText } from 'lucide-react';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { useBusiness } from '@/contexts/BusinessContext';
import { formatCurrency } from '@/utils/storage';
import { useToast } from '@/hooks/use-toast';
import { SalaryPayment } from '@/types/business';

interface PaymentHistoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  teamMemberId?: string;
}

export const PaymentHistoryModal: React.FC<PaymentHistoryModalProps> = ({
  isOpen,
  onClose,
  teamMemberId,
}) => {
  const { data, currentBusiness, dispatch } = useBusiness();
  const { toast } = useToast();
  const [paymentToDelete, setPaymentToDelete] = useState<string | null>(null);

  if (!currentBusiness) return null;

  // Get relevant salary records and payments
  const businessSalaryRecords = data.salaryRecords.filter(
    record => record.businessId === currentBusiness.id
  );

  const relevantSalaryRecords = teamMemberId 
    ? businessSalaryRecords.filter(record => record.teamMemberId === teamMemberId)
    : businessSalaryRecords;

  const payments = data.salaryPayments
    .filter(payment => 
      relevantSalaryRecords.some(record => record.id === payment.salaryRecordId)
    )
    .sort((a, b) => new Date(b.paymentDate).getTime() - new Date(a.paymentDate).getTime());

  // Get team member name
  const getTeamMemberName = (memberId: string) => {
    const member = data.teamMembers.find(m => m.id === memberId);
    return member ? member.name : 'Unknown Member';
  };

  // Get payment details
  const getPaymentDetails = (payment: SalaryPayment) => {
    const salaryRecord = businessSalaryRecords.find(r => r.id === payment.salaryRecordId);
    if (!salaryRecord) return null;

    return {
      employeeName: getTeamMemberName(salaryRecord.teamMemberId),
      position: salaryRecord.position,
      salaryRecord,
    };
  };

  const handleDeletePayment = (paymentId: string) => {
    dispatch({ type: 'DELETE_SALARY_PAYMENT', payload: paymentId });
    setPaymentToDelete(null);
    
    toast({
      title: "Success",
      description: "Payment deleted successfully",
    });
  };

  const totalPaid = payments.reduce((sum, payment) => sum + payment.amount, 0);

  return (
    <>
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Payment History
              {teamMemberId && (
                <span className="text-muted-foreground">
                  - {getTeamMemberName(teamMemberId)}
                </span>
              )}
            </DialogTitle>
            <div className="flex items-center gap-4 text-sm text-muted-foreground">
              <span>{payments.length} payments</span>
              <span>Total: {formatCurrency(totalPaid, data.userSettings.defaultCurrency)}</span>
            </div>
          </DialogHeader>

          <div className="space-y-4">
            {payments.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>No payment history found</p>
              </div>
            ) : (
              payments.map((payment) => {
                const details = getPaymentDetails(payment);
                if (!details) return null;

                return (
                  <Card key={payment.id} className="hover:shadow-md transition-shadow">
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                          <div className="flex flex-col">
                            <div className="flex items-center gap-2">
                              <DollarSign className="h-4 w-4 text-green-600" />
                              <span className="font-medium text-lg">
                                {formatCurrency(payment.amount, data.userSettings.defaultCurrency)}
                              </span>
                              <Badge variant="outline" className="text-green-600 border-green-600">
                                {payment.status}
                              </Badge>
                            </div>
                            <div className="text-sm text-muted-foreground mt-1">
                              {!teamMemberId && (
                                <span className="font-medium">{details.employeeName} - </span>
                              )}
                              {details.position}
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center gap-4">
                          <div className="text-right">
                            <div className="flex items-center gap-2 text-sm">
                              <Calendar className="h-4 w-4" />
                              {new Date(payment.paymentDate).toLocaleDateString()}
                            </div>
                            {payment.method && (
                              <div className="flex items-center gap-2 text-sm text-muted-foreground mt-1">
                                <CreditCard className="h-4 w-4" />
                                {payment.method}
                              </div>
                            )}
                          </div>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setPaymentToDelete(payment.id)}
                            className="text-destructive hover:text-destructive hover:bg-destructive/10"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>

                      {payment.description && (
                        <div className="mt-3 pt-3 border-t">
                          <p className="text-sm text-muted-foreground">
                            <strong>Notes:</strong> {payment.description}
                          </p>
                        </div>
                      )}

                      {payment.period && (
                        <div className="mt-2">
                          <Badge variant="secondary" className="text-xs">
                            {payment.period}
                          </Badge>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                );
              })
            )}
          </div>

          <div className="flex justify-end pt-4">
            <Button onClick={onClose}>Close</Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={!!paymentToDelete} onOpenChange={() => setPaymentToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Payment</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this payment? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => paymentToDelete && handleDeletePayment(paymentToDelete)}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};