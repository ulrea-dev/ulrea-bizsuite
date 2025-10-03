import { Expense } from '@/types/business';
import { generateId } from './storage';
import { addWeeks, addMonths, addQuarters, addYears, isBefore, isAfter } from 'date-fns';

/**
 * Generate upcoming recurring expense instances
 */
export function generateRecurringExpenses(
  parentExpense: Expense,
  numberOfInstances: number = 12
): Expense[] {
  if (!parentExpense.isRecurring || !parentExpense.recurringFrequency) {
    return [];
  }

  const newExpenses: Expense[] = [];
  let currentDate = new Date(parentExpense.date);
  const endDate = parentExpense.recurringEndDate ? new Date(parentExpense.recurringEndDate) : null;

  for (let i = 0; i < numberOfInstances; i++) {
    // Calculate next occurrence
    switch (parentExpense.recurringFrequency) {
      case 'weekly':
        currentDate = addWeeks(currentDate, 1);
        break;
      case 'monthly':
        currentDate = addMonths(currentDate, 1);
        break;
      case 'quarterly':
        currentDate = addQuarters(currentDate, 1);
        break;
      case 'yearly':
        currentDate = addYears(currentDate, 1);
        break;
    }

    // Stop if we've reached the end date
    if (endDate && isAfter(currentDate, endDate)) {
      break;
    }

    // Create new expense instance
    const newExpense: Expense = {
      ...parentExpense,
      id: generateId(),
      date: currentDate.toISOString(),
      parentExpenseId: parentExpense.id,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    newExpenses.push(newExpense);
  }

  return newExpenses;
}

/**
 * Check for due recurring expenses and generate new instances
 */
export function processDueRecurringExpenses(
  expenses: Expense[],
  currentDate: Date = new Date()
): Expense[] {
  const newExpenses: Expense[] = [];

  // Find all parent recurring expenses (those without parentExpenseId)
  const recurringParents = expenses.filter(
    e => e.isRecurring && !e.parentExpenseId
  );

  for (const parent of recurringParents) {
    // Find all existing instances of this recurring expense
    const existingInstances = expenses.filter(
      e => e.parentExpenseId === parent.id || e.id === parent.id
    );

    // Sort by date to find the latest instance
    const sortedInstances = existingInstances.sort(
      (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
    );

    const latestInstance = sortedInstances[0];
    const latestDate = new Date(latestInstance.date);

    // Calculate next due date
    let nextDueDate: Date;
    switch (parent.recurringFrequency) {
      case 'weekly':
        nextDueDate = addWeeks(latestDate, 1);
        break;
      case 'monthly':
        nextDueDate = addMonths(latestDate, 1);
        break;
      case 'quarterly':
        nextDueDate = addQuarters(latestDate, 1);
        break;
      case 'yearly':
        nextDueDate = addYears(latestDate, 1);
        break;
      default:
        continue;
    }

    // Check if next instance is due
    if (isBefore(nextDueDate, currentDate) || nextDueDate.toDateString() === currentDate.toDateString()) {
      // Check if we haven't exceeded the end date
      if (parent.recurringEndDate && isAfter(nextDueDate, new Date(parent.recurringEndDate))) {
        continue;
      }

      // Create new instance
      const newExpense: Expense = {
        ...parent,
        id: generateId(),
        date: nextDueDate.toISOString(),
        parentExpenseId: parent.id,
        status: 'pending', // New instances should be pending
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      newExpenses.push(newExpense);
    }
  }

  return newExpenses;
}

/**
 * Get all instances of a recurring expense
 */
export function getRecurringExpenseInstances(
  expenses: Expense[],
  parentExpenseId: string
): Expense[] {
  return expenses
    .filter(e => e.parentExpenseId === parentExpenseId || e.id === parentExpenseId)
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
}

/**
 * Calculate total cost of recurring expense series
 */
export function calculateRecurringExpenseTotal(
  expenses: Expense[],
  parentExpenseId: string
): { total: number; paid: number; pending: number } {
  const instances = getRecurringExpenseInstances(expenses, parentExpenseId);
  
  return {
    total: instances.reduce((sum, e) => sum + e.amount, 0),
    paid: instances.filter(e => e.status === 'paid').reduce((sum, e) => sum + e.amount, 0),
    pending: instances.filter(e => e.status === 'pending').reduce((sum, e) => sum + e.amount, 0),
  };
}
