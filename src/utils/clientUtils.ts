
import { Client, Project, Payment, Expense } from '@/types/business';

export interface ClientMetrics {
  totalProjects: number;
  activeProjects: number;
  totalValue: number;
  totalPaymentsReceived: number;
  totalAllocated: number;
  totalExpenses: number;
  netProfit: number;
  outstandingPayments: number;
  paymentProgress: number;
}

export const calculateClientMetrics = (
  client: Client,
  projects: Project[],
  payments: Payment[]
): ClientMetrics => {
  const clientProjects = projects.filter(project => project.clientId === client.id);
  const activeProjects = clientProjects.filter(project => project.status === 'active');
  
  const totalValue = clientProjects.reduce((sum, project) => sum + project.totalValue, 0);
  
  const totalPaymentsReceived = clientProjects.reduce((sum, project) => {
    return sum + (project.clientPayments || 0);
  }, 0);
  
  const totalAllocated = clientProjects.reduce((sum, project) => {
    const teamAllocated = project.teamAllocations?.reduce((teamSum, alloc) => teamSum + alloc.totalAllocated, 0) || 0;
    const partnerAllocated = project.partnerAllocations?.reduce((partnerSum, alloc) => partnerSum + alloc.totalAllocated, 0) || 0;
    const companyAllocated = project.companyAllocation?.totalAllocated || 0;
    return sum + teamAllocated + partnerAllocated + companyAllocated;
  }, 0);
  
  const totalExpenses = clientProjects.reduce((sum, project) => {
    return sum + (project.expenses?.reduce((expenseSum, expense) => expenseSum + expense.amount, 0) || 0);
  }, 0);
  
  const netProfit = totalPaymentsReceived - totalAllocated - totalExpenses;
  const outstandingPayments = totalValue - totalPaymentsReceived;
  const paymentProgress = totalValue > 0 ? (totalPaymentsReceived / totalValue) * 100 : 0;
  
  return {
    totalProjects: clientProjects.length,
    activeProjects: activeProjects.length,
    totalValue,
    totalPaymentsReceived,
    totalAllocated,
    totalExpenses,
    netProfit,
    outstandingPayments,
    paymentProgress
  };
};

export const getClientProjectsWithMetrics = (
  client: Client,
  projects: Project[],
  payments: Payment[]
) => {
  return projects
    .filter(project => project.clientId === client.id)
    .map(project => {
      const projectPayments = project.clientPayments || 0;
      const teamAllocated = project.teamAllocations?.reduce((sum, alloc) => sum + alloc.totalAllocated, 0) || 0;
      const partnerAllocated = project.partnerAllocations?.reduce((sum, alloc) => sum + alloc.totalAllocated, 0) || 0;
      const companyAllocated = project.companyAllocation?.totalAllocated || 0;
      const totalAllocated = teamAllocated + partnerAllocated + companyAllocated;
      const totalExpenses = project.expenses?.reduce((sum, expense) => sum + expense.amount, 0) || 0;
      const netProfit = projectPayments - totalAllocated - totalExpenses;
      const paymentProgress = project.totalValue > 0 ? (projectPayments / project.totalValue) * 100 : 0;
      
      return {
        ...project,
        projectPayments,
        totalAllocated,
        totalExpenses,
        netProfit,
        paymentProgress,
        outstandingPayments: project.totalValue - projectPayments
      };
    });
};
