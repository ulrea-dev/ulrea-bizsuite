import { useState, useMemo } from 'react';
import { useBusiness } from '@/contexts/BusinessContext';
import { getAllRenewals, getRenewalSummary } from '@/utils/renewalUtils';

export const useRenewalReminders = () => {
  const { data, currentBusiness } = useBusiness();
  const [dismissed, setDismissed] = useState(false);

  const businessRenewals = useMemo(() => {
    if (!currentBusiness) return [];
    return data.renewals?.filter((r) => r.businessId === currentBusiness.id) || [];
  }, [data.renewals, currentBusiness]);

  const allRenewals = useMemo(() => {
    return getAllRenewals(businessRenewals, data.clients, data.retainers);
  }, [businessRenewals, data.clients, data.retainers]);

  const upcomingRenewals = useMemo(() => {
    return allRenewals.filter((r) => r.daysUntilDue <= 30);
  }, [allRenewals]);

  const summary = useMemo(() => {
    return getRenewalSummary(upcomingRenewals);
  }, [upcomingRenewals]);

  const shouldShowReminder = upcomingRenewals.length > 0 && !dismissed;

  return {
    allRenewals,
    upcomingRenewals,
    overdueCount: summary.overdue,
    urgentCount: summary.urgent,
    warningCount: summary.warning,
    totalDueSoon: summary.overdue + summary.urgent + summary.warning,
    shouldShowReminder,
    dismissReminder: () => setDismissed(true),
  };
};
