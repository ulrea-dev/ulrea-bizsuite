import { Retainer, RetainerRenewal, Client } from '@/types/business';
import { differenceInDays, parseISO, isValid } from 'date-fns';

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
