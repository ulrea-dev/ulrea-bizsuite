import React, { useMemo, useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { useBusiness } from '@/contexts/BusinessContext';
import { Renewal, RenewalPayment } from '@/types/business';
import { format, parseISO } from 'date-fns';
import { getCurrencySymbol } from '@/utils/currencyConversion';
import { ExternalLink, Pencil, Trash2, Receipt, DollarSign } from 'lucide-react';
import { RenewalPaymentModal } from './RenewalPaymentModal';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';

interface RenewalPaymentHistoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  renewal: Renewal;
}

export const RenewalPaymentHistoryModal: React.FC<RenewalPaymentHistoryModalProps> = ({
  isOpen,
  onClose,
  renewal,
}) => {
  const { data, dispatch } = useBusiness();
  const [editingPayment, setEditingPayment] = useState<RenewalPayment | null>(null);
  const [deletingPaymentId, setDeletingPaymentId] = useState<string | null>(null);

  const payments = useMemo(() => {
    return (data.renewalPayments || [])
      .filter((p) => p.renewalId === renewal.id)
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [data.renewalPayments, renewal.id]);

  const summary = useMemo(() => {
    const totalPaid = payments
      .filter((p) => p.status === 'completed')
      .reduce((sum, p) => sum + p.amount, 0);
    return {
      totalPaid,
      paymentCount: payments.length,
      lastPaidDate: payments.length > 0 ? payments[0].date : null,
    };
  }, [payments]);

  const handleDeletePayment = () => {
    if (!deletingPaymentId) return;

    const paymentToDelete = payments.find((p) => p.id === deletingPaymentId);
    if (paymentToDelete && paymentToDelete.status === 'completed') {
      // Update the renewal's totalPaid
      const newTotalPaid = (renewal.totalPaid || 0) - paymentToDelete.amount;
      dispatch({
        type: 'UPDATE_RENEWAL',
        payload: {
          id: renewal.id,
          updates: { totalPaid: Math.max(0, newTotalPaid) },
        },
      });
    }

    dispatch({
      type: 'DELETE_RENEWAL_PAYMENT',
      payload: deletingPaymentId,
    });

    setDeletingPaymentId(null);
  };

  return (
    <>
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="sm:max-w-[600px] max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Payment History - {renewal.name}</DialogTitle>
          </DialogHeader>

          {/* Summary */}
          <div className="grid grid-cols-3 gap-4 mb-4">
            <Card>
              <CardContent className="pt-4 pb-4">
                <p className="text-sm text-muted-foreground">Total Paid</p>
                <p className="text-xl font-bold">
                  {getCurrencySymbol(renewal.currency)}{summary.totalPaid.toLocaleString()}
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-4 pb-4">
                <p className="text-sm text-muted-foreground">Payments</p>
                <p className="text-xl font-bold">{summary.paymentCount}</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-4 pb-4">
                <p className="text-sm text-muted-foreground">Last Paid</p>
                <p className="text-xl font-bold">
                  {summary.lastPaidDate
                    ? format(parseISO(summary.lastPaidDate), 'MMM d, yyyy')
                    : '-'}
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Payment List */}
          <div className="space-y-3">
            {payments.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <Receipt className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>No payments recorded yet.</p>
              </div>
            ) : (
              payments.map((payment) => (
                <div
                  key={payment.id}
                  className="flex items-center justify-between p-4 border rounded-lg"
                >
                  <div className="flex items-center gap-4">
                    <DollarSign className="h-5 w-5 text-green-600" />
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-medium">
                          {getCurrencySymbol(payment.currency)}{payment.amount.toLocaleString()}
                        </span>
                        <Badge variant={payment.status === 'completed' ? 'default' : 'secondary'}>
                          {payment.status}
                        </Badge>
                      </div>
                      <div className="text-sm text-muted-foreground">
                        {format(parseISO(payment.date), 'MMMM d, yyyy')}
                      </div>
                      {payment.notes && (
                        <div className="text-sm text-muted-foreground mt-1">{payment.notes}</div>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {payment.invoiceUrl && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => window.open(payment.invoiceUrl, '_blank')}
                        title={payment.invoiceFileName || 'View Invoice'}
                      >
                        <ExternalLink className="h-4 w-4" />
                      </Button>
                    )}
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setEditingPayment(payment)}
                    >
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setDeletingPaymentId(payment.id)}
                    >
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </div>
                </div>
              ))
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Edit Payment Modal */}
      {editingPayment && (
        <RenewalPaymentModal
          isOpen={!!editingPayment}
          onClose={() => setEditingPayment(null)}
          renewal={renewal}
          existingPayment={editingPayment}
        />
      )}

      {/* Delete Confirmation */}
      <AlertDialog open={!!deletingPaymentId} onOpenChange={() => setDeletingPaymentId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Payment</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this payment? This action cannot be undone and will update the renewal's total paid amount.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeletePayment} className="bg-destructive text-destructive-foreground">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};
