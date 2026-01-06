import { useState, useMemo } from 'react';
import { useBusiness } from '@/contexts/BusinessContext';
import { getAllRenewals, getRenewalSummary, EnrichedRenewal } from '@/utils/renewalUtils';

export const useRenewalReminders = () => {
  const { data, currentBusiness } = useBusiness();
  const [dismissed, setDismissed] = useState(false);

  const businessRetainers = useMemo(() => {
    if (!currentBusiness) return [];
    return data.retainers?.filter((r) => r.businessId === currentBusiness.id) || [];
  }, [data.retainers, currentBusiness]);

  const allRenewals = useMemo(() => {
    return getAllRenewals(businessRetainers, data.clients);
  }, [businessRetainers, data.clients]);

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
