import { Retainer, RetainerRenewal, Client, RenewalPayment } from '@/types/business';
import { differenceInDays, parseISO, isValid, addMonths, addYears, format } from 'date-fns';

export type RenewalStatus = 'overdue' | 'urgent' | 'warning' | 'upcoming';

export interface EnrichedRenewal extends RetainerRenewal {
  retainerId: string;
  retainerName: string;
  clientId: string;
  clientName: string;
  daysUntilDue: number;
  status: RenewalStatus;
}

/**
 * Calculate days until due date (negative = overdue)
 */
export const getDaysUntilDue = (nextRenewalDate: string): number => {
  const dueDate = parseISO(nextRenewalDate);
  if (!isValid(dueDate)) return 0;
  return differenceInDays(dueDate, new Date());
};

/**
 * Get renewal status based on days until due
 */
export const getRenewalStatus = (daysUntilDue: number): RenewalStatus => {
  if (daysUntilDue < 0) return 'overdue';
  if (daysUntilDue <= 7) return 'urgent';
  if (daysUntilDue <= 30) return 'warning';
  return 'upcoming';
};

/**
 * Get all renewals across all retainers, enriched with retainer/client info
 */
export const getAllRenewals = (
  retainers: Retainer[],
  clients: Client[]
): EnrichedRenewal[] => {
  const renewals: EnrichedRenewal[] = [];

  retainers.forEach((retainer) => {
    if (!retainer.renewals || retainer.renewals.length === 0) return;

    const client = clients.find((c) => c.id === retainer.clientId);

    retainer.renewals.forEach((renewal) => {
      const daysUntilDue = getDaysUntilDue(renewal.nextRenewalDate);
      renewals.push({
        ...renewal,
        retainerId: retainer.id,
        retainerName: retainer.name,
        clientId: retainer.clientId,
        clientName: client?.name || 'Unknown Client',
        daysUntilDue,
        status: getRenewalStatus(daysUntilDue),
      });
    });
  });

  // Sort by days until due (overdue first, then soonest)
  return renewals.sort((a, b) => a.daysUntilDue - b.daysUntilDue);
};

/**
 * Get renewals due within a certain number of days
 */
export const getUpcomingRenewals = (
  retainers: Retainer[],
  clients: Client[],
  daysAhead: number = 30
): EnrichedRenewal[] => {
  const allRenewals = getAllRenewals(retainers, clients);
  return allRenewals.filter((r) => r.daysUntilDue <= daysAhead);
};

/**
 * Get only overdue renewals
 */
export const getOverdueRenewals = (
  retainers: Retainer[],
  clients: Client[]
): EnrichedRenewal[] => {
  const allRenewals = getAllRenewals(retainers, clients);
  return allRenewals.filter((r) => r.status === 'overdue');
};

/**
 * Get renewal summary counts
 */
export const getRenewalSummary = (renewals: EnrichedRenewal[]) => {
  return {
    total: renewals.length,
    overdue: renewals.filter((r) => r.status === 'overdue').length,
    urgent: renewals.filter((r) => r.status === 'urgent').length,
    warning: renewals.filter((r) => r.status === 'warning').length,
    upcoming: renewals.filter((r) => r.status === 'upcoming').length,
  };
};

/**
 * Calculate next renewal date after payment based on frequency
 */
export const getNextRenewalDate = (
  currentDate: string,
  frequency: 'monthly' | 'quarterly' | 'yearly'
): string => {
  const date = parseISO(currentDate);
  switch (frequency) {
    case 'monthly':
      return format(addMonths(date, 1), 'yyyy-MM-dd');
    case 'quarterly':
      return format(addMonths(date, 3), 'yyyy-MM-dd');
    case 'yearly':
      return format(addYears(date, 1), 'yyyy-MM-dd');
    default:
      return format(addYears(date, 1), 'yyyy-MM-dd');
  }
};

/**
 * Get all payments for a specific renewal
 */
export const getRenewalPayments = (
  renewalId: string,
  payments: RenewalPayment[]
): RenewalPayment[] => {
  return payments
    .filter((p) => p.renewalId === renewalId)
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
};

/**
 * Get renewal payment summary
 */
export const getRenewalPaymentSummary = (
  renewalId: string,
  payments: RenewalPayment[]
): { totalPaid: number; paymentCount: number; lastPaidDate: string | null } => {
  const renewalPayments = getRenewalPayments(renewalId, payments);
  const completedPayments = renewalPayments.filter((p) => p.status === 'completed');
  
  return {
    totalPaid: completedPayments.reduce((sum, p) => sum + p.amount, 0),
    paymentCount: renewalPayments.length,
    lastPaidDate: renewalPayments.length > 0 ? renewalPayments[0].date : null,
  };
};
