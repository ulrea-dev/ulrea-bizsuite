// Utility to filter AppData based on user's business access
import { AppData, UserBusinessAccess } from '@/types/business';

/**
 * Get the list of business IDs a user can access
 * If no access entries exist for the user, they get access to all businesses (backward compatibility)
 */
export const getUserAccessibleBusinessIds = (data: AppData, userId: string): string[] => {
  // Find user's access entry
  const userAccess = data.userBusinessAccess?.find(access => access.userId === userId);
  
  // If user has explicit access defined, use that
  if (userAccess && userAccess.businessIds.length > 0) {
    return userAccess.businessIds;
  }
  
  // Backward compatibility: if no access list or user not in list, 
  // check if this is the original owner (first user)
  // Give full access to all businesses
  return data.businesses.map(b => b.id);
};

/**
 * Check if a user can access a specific business
 */
export const canUserAccessBusiness = (data: AppData, userId: string, businessId: string): boolean => {
  const accessibleIds = getUserAccessibleBusinessIds(data, userId);
  return accessibleIds.includes(businessId);
};

/**
 * Get the user's role for a specific business
 */
export const getUserRoleForBusiness = (data: AppData, userId: string, businessId: string): 'owner' | 'admin' | 'viewer' | null => {
  const userAccess = data.userBusinessAccess?.find(access => access.userId === userId);
  if (!userAccess || !userAccess.businessIds.includes(businessId)) {
    // Backward compatibility: if no access defined, treat as owner
    if (!data.userBusinessAccess || data.userBusinessAccess.length === 0) {
      return 'owner';
    }
    return null;
  }
  return userAccess.role;
};

/**
 * Filter AppData to only include data for businesses the user can access
 * This is used for backups, exports, and sheets
 */
export const filterDataForUser = (data: AppData, userId: string): AppData => {
  const accessibleBusinessIds = getUserAccessibleBusinessIds(data, userId);
  
  // If user has access to all businesses, return unfiltered data
  if (accessibleBusinessIds.length === data.businesses.length) {
    return data;
  }
  
  // Filter businesses
  const filteredBusinesses = data.businesses.filter(b => accessibleBusinessIds.includes(b.id));
  
  // Filter projects
  const filteredProjects = data.projects.filter(p => accessibleBusinessIds.includes(p.businessId));
  const filteredProjectIds = filteredProjects.map(p => p.id);
  
  // Filter team members (those associated with accessible businesses)
  const filteredTeamMembers = data.teamMembers.filter(tm => 
    tm.businessIds.some(bid => accessibleBusinessIds.includes(bid))
  );
  const filteredTeamMemberIds = filteredTeamMembers.map(tm => tm.id);
  
  // Filter partners
  const filteredPartners = data.partners.filter(p => 
    p.businessIds.some(bid => accessibleBusinessIds.includes(bid))
  );
  const filteredPartnerIds = filteredPartners.map(p => p.id);
  
  // Filter clients (those associated with accessible projects)
  const filteredClients = data.clients.filter(c => 
    c.projects.some(pid => filteredProjectIds.includes(pid))
  );
  const filteredClientIds = filteredClients.map(c => c.id);
  
  // Filter payments
  const filteredPayments = data.payments.filter(p => 
    (p.projectId && filteredProjectIds.includes(p.projectId)) ||
    (p.memberId && filteredTeamMemberIds.includes(p.memberId)) ||
    (p.partnerId && filteredPartnerIds.includes(p.partnerId)) ||
    (p.clientId && filteredClientIds.includes(p.clientId))
  );
  
  // Filter salary records
  const filteredSalaryRecords = data.salaryRecords.filter(sr => 
    accessibleBusinessIds.includes(sr.businessId)
  );
  const filteredSalaryRecordIds = filteredSalaryRecords.map(sr => sr.id);
  
  // Filter salary payments
  const filteredSalaryPayments = data.salaryPayments.filter(sp => 
    filteredSalaryRecordIds.includes(sp.salaryRecordId)
  );
  
  // Filter payroll periods
  const filteredPayrollPeriods = data.payrollPeriods.filter(pp => 
    accessibleBusinessIds.includes(pp.businessId)
  );
  const filteredPayrollPeriodIds = filteredPayrollPeriods.map(pp => pp.id);
  
  // Filter payslips
  const filteredPayslips = data.payslips.filter(ps => 
    accessibleBusinessIds.includes(ps.businessId)
  );
  
  // Filter quick tasks
  const filteredQuickTasks = data.quickTasks.filter(qt => 
    accessibleBusinessIds.includes(qt.businessId)
  );
  
  // Filter retainers
  const filteredRetainers = data.retainers.filter(r => 
    accessibleBusinessIds.includes(r.businessId)
  );
  const filteredRetainerIds = filteredRetainers.map(r => r.id);
  
  // Filter renewals
  const filteredRenewals = data.renewals.filter(r => 
    accessibleBusinessIds.includes(r.businessId)
  );
  const filteredRenewalIds = filteredRenewals.map(r => r.id);
  
  // Filter renewal payments
  const filteredRenewalPayments = data.renewalPayments?.filter(rp => 
    filteredRenewalIds.includes(rp.renewalId)
  ) || [];
  
  // Filter expenses
  const filteredExpenses = data.expenses.filter(e => 
    accessibleBusinessIds.includes(e.businessId)
  );
  
  // Filter extra payments
  const filteredExtraPayments = data.extraPayments.filter(ep => 
    accessibleBusinessIds.includes(ep.businessId)
  );
  
  // Filter bank accounts
  const filteredBankAccounts = data.bankAccounts.filter(ba => 
    accessibleBusinessIds.includes(ba.businessId)
  );
  
  // Filter payables
  const filteredPayables = data.payables.filter(p => 
    accessibleBusinessIds.includes(p.businessId)
  );
  
  // Filter receivables
  const filteredReceivables = data.receivables.filter(r => 
    accessibleBusinessIds.includes(r.businessId)
  );
  
  // Filter user business access to only include current user's entries
  const filteredUserBusinessAccess = data.userBusinessAccess?.filter(uba => 
    uba.userId === userId
  ) || [];
  
  return {
    ...data,
    businesses: filteredBusinesses,
    projects: filteredProjects,
    teamMembers: filteredTeamMembers,
    partners: filteredPartners,
    clients: filteredClients,
    payments: filteredPayments,
    salaryRecords: filteredSalaryRecords,
    salaryPayments: filteredSalaryPayments,
    payrollPeriods: filteredPayrollPeriods,
    payslips: filteredPayslips,
    quickTasks: filteredQuickTasks,
    retainers: filteredRetainers,
    renewals: filteredRenewals,
    renewalPayments: filteredRenewalPayments,
    expenses: filteredExpenses,
    extraPayments: filteredExtraPayments,
    bankAccounts: filteredBankAccounts,
    payables: filteredPayables,
    receivables: filteredReceivables,
    userBusinessAccess: filteredUserBusinessAccess,
    // Ensure current business is accessible, or null
    currentBusinessId: accessibleBusinessIds.includes(data.currentBusinessId || '') 
      ? data.currentBusinessId 
      : (filteredBusinesses.length > 0 ? filteredBusinesses[0].id : null),
    // Keep user settings intact
    userSettings: data.userSettings,
    // Keep exchange rates and custom currencies (global)
    exchangeRates: data.exchangeRates,
    customCurrencies: data.customCurrencies,
  };
};

/**
 * Add or update user business access
 */
export const assignUserBusinessAccess = (
  data: AppData, 
  userId: string, 
  businessIds: string[], 
  role: 'owner' | 'admin' | 'viewer',
  email?: string
): UserBusinessAccess[] => {
  const existingAccess = data.userBusinessAccess || [];
  const existingIndex = existingAccess.findIndex(a => a.userId === userId);
  
  const newAccess: UserBusinessAccess = {
    userId,
    email,
    businessIds,
    role,
  };
  
  if (existingIndex >= 0) {
    // Update existing
    return existingAccess.map((a, i) => i === existingIndex ? newAccess : a);
  } else {
    // Add new
    return [...existingAccess, newAccess];
  }
};

/**
 * Remove user business access
 */
export const removeUserBusinessAccess = (data: AppData, userId: string): UserBusinessAccess[] => {
  return (data.userBusinessAccess || []).filter(a => a.userId !== userId);
};

/**
 * Add a business to user's access
 */
export const addBusinessToUserAccess = (
  data: AppData, 
  userId: string, 
  businessId: string
): UserBusinessAccess[] => {
  const existingAccess = data.userBusinessAccess || [];
  const userAccess = existingAccess.find(a => a.userId === userId);
  
  if (userAccess) {
    if (!userAccess.businessIds.includes(businessId)) {
      return existingAccess.map(a => 
        a.userId === userId 
          ? { ...a, businessIds: [...a.businessIds, businessId] }
          : a
      );
    }
    return existingAccess;
  } else {
    // Create new access with owner role
    return [...existingAccess, { userId, businessIds: [businessId], role: 'owner' as const }];
  }
};
