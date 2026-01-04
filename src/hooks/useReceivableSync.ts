import { useMemo, useCallback } from 'react';
import { useBusiness } from '@/contexts/BusinessContext';
import { Receivable, ReceivablePaymentRecord, Payment, Project } from '@/types/business';

/**
 * Hook to sync receivables with projects and client payments
 * - Expected amount = project total value
 * - Received amount = sum of client payments
 * - Payment records = individual client payments with dates
 */
export const useReceivableSync = () => {
  const { data, currentBusiness, dispatch } = useBusiness();

  // Get or create a receivable for a project
  const getProjectReceivable = useCallback((projectId: string): Receivable | undefined => {
    return data.receivables.find(r => r.projectId === projectId && r.isProjectSynced);
  }, [data.receivables]);

  // Sync a project's receivable with its current state
  const syncProjectReceivable = useCallback((project: Project) => {
    if (!currentBusiness) return;

    const existingReceivable = getProjectReceivable(project.id);
    const client = project.clientId ? data.clients.find(c => c.id === project.clientId) : null;
    
    // Get all incoming client payments for this project
    const clientPayments = data.payments.filter(
      p => p.projectId === project.id && p.type === 'incoming' && p.clientId
    );

    // Calculate total project value (from allocations if multi-phase, otherwise totalValue)
    const totalProjectValue = project.isMultiPhase && project.allocations?.length
      ? project.allocations.reduce((sum, allocation) => sum + allocation.budget, 0)
      : project.totalValue;

    // Calculate received amount from payments
    const receivedAmount = clientPayments.reduce((sum, p) => sum + p.amount, 0);

    // Create payment records from client payments
    const paymentRecords: ReceivablePaymentRecord[] = clientPayments.map(payment => ({
      id: payment.id,
      amount: payment.amount,
      date: payment.date,
      paymentId: payment.id,
      description: payment.description,
    }));

    // Determine status
    let status: Receivable['status'] = 'pending';
    if (receivedAmount >= totalProjectValue) {
      status = 'paid';
    } else if (receivedAmount > 0) {
      status = 'partial';
    } else if (project.endDate && new Date(project.endDate) < new Date()) {
      status = 'overdue';
    }

    const now = new Date().toISOString();
    const sourceName = client ? `${project.name} - ${client.name}` : project.name;

    if (existingReceivable) {
      // Update existing receivable
      dispatch({
        type: 'UPDATE_RECEIVABLE',
        payload: {
          id: existingReceivable.id,
          updates: {
            sourceName,
            amount: totalProjectValue,
            receivedAmount,
            status,
            paymentRecords,
            clientId: project.clientId,
            dueDate: project.endDate || existingReceivable.dueDate,
          },
        },
      });
    } else if (totalProjectValue > 0) {
      // Create new receivable for this project
      const newReceivable: Receivable = {
        id: crypto.randomUUID(),
        businessId: currentBusiness.id,
        projectId: project.id,
        clientId: project.clientId,
        sourceName,
        amount: totalProjectValue,
        receivedAmount,
        currency: currentBusiness.currency.code,
        dueDate: project.endDate || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        status,
        paymentRecords,
        isProjectSynced: true,
        createdAt: now,
        updatedAt: now,
      };
      dispatch({ type: 'ADD_RECEIVABLE', payload: newReceivable });
    }
  }, [currentBusiness, data.clients, data.payments, dispatch, getProjectReceivable]);

  // Get computed receivables that merge project data with receivables
  const projectReceivables = useMemo(() => {
    if (!currentBusiness) return [];

    const businessProjects = data.projects.filter(p => p.businessId === currentBusiness.id);
    
    return businessProjects.map(project => {
      const existingReceivable = getProjectReceivable(project.id);
      const client = project.clientId ? data.clients.find(c => c.id === project.clientId) : null;
      
      // Get all incoming client payments for this project
      const clientPayments = data.payments.filter(
        p => p.projectId === project.id && p.type === 'incoming'
      );

      const totalProjectValue = project.isMultiPhase && project.allocations?.length
        ? project.allocations.reduce((sum, allocation) => sum + allocation.budget, 0)
        : project.totalValue;

      const receivedAmount = clientPayments.reduce((sum, p) => sum + p.amount, 0);

      const paymentRecords: ReceivablePaymentRecord[] = clientPayments.map(payment => ({
        id: payment.id,
        amount: payment.amount,
        date: payment.date,
        paymentId: payment.id,
        description: payment.description,
      }));

      let status: Receivable['status'] = 'pending';
      if (receivedAmount >= totalProjectValue) {
        status = 'paid';
      } else if (receivedAmount > 0) {
        status = 'partial';
      } else if (project.endDate && new Date(project.endDate) < new Date()) {
        status = 'overdue';
      }

      return {
        project,
        client,
        receivable: existingReceivable,
        totalValue: totalProjectValue,
        receivedAmount,
        outstanding: Math.max(0, totalProjectValue - receivedAmount),
        paymentRecords,
        status,
        currency: currentBusiness.currency.code,
      };
    });
  }, [currentBusiness, data.projects, data.clients, data.payments, getProjectReceivable]);

  return {
    getProjectReceivable,
    syncProjectReceivable,
    projectReceivables,
  };
};
