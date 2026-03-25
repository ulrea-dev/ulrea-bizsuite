/**
 * SupabaseDBRepository
 *
 * Implements IDataRepository using Supabase relational tables.
 * - load(): queries all 28+ tables, assembles AppData
 * - save(data): upserts all records per entity type
 * - Includes one-time migration from Storage JSON on first load
 * - localStorage is used as a fast in-memory cache (write-through)
 */

import { AppData, Business, Project, Client, TeamMember, Partner, Payment, Expense,
  BankAccount, SalaryRecord, SalaryPayment, PayrollPeriod, Payslip, ExtraPayment,
  QuickTask, Retainer, Renewal, RenewalPayment, Payable, Receivable, ToDo,
  ServiceType, ExchangeRate, Currency, Product, Customer, SalesOrder,
  ProductionBatch, PurchaseOrder, UserBusinessAccess, SUPPORTED_CURRENCIES,
  DEFAULT_SERVICE_TYPES } from '@/types/business';
import { IDataRepository, ExportedData, BackupMetadata, validateBackupCompleteness } from './IDataRepository';
import { LocalStorageRepository } from './LocalStorageRepository';
import { supabase } from '@/integrations/supabase/client';
import { getDefaultFont, getDefaultColorPalette } from '@/utils/appearance';

const APP_VERSION = '2.0.0';
const BACKUP_VERSION = '2.0.0';
const BUCKET = 'workspace-data';
const FILE_NAME = 'data.json';
const DB_MIGRATED_KEY = 'bizsuite-db-migrated-v2';

// ─── Camel↔Snake helpers ──────────────────────────────────────────────────────

function snakeToCamel(str: string): string {
  return str.replace(/_([a-z])/g, (_, c) => c.toUpperCase());
}

function camelToSnake(str: string): string {
  return str.replace(/([A-Z])/g, '_$1').toLowerCase();
}

/** Convert a DB row (snake_case) → camelCase object */
function rowToCamel<T>(row: Record<string, unknown>): T {
  const out: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(row)) {
    out[snakeToCamel(k)] = v;
  }
  return out as T;
}

/** Convert a camelCase object → snake_case DB row */
function camelToRow(obj: Record<string, unknown>): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(obj)) {
    out[camelToSnake(k)] = v;
  }
  return out;
}

// ─── Normalisation helpers ─────────────────────────────────────────────────────

function toNum(v: unknown): number {
  return v == null ? 0 : Number(v);
}
function toStr(v: unknown, def = ''): string {
  return v == null ? def : String(v);
}
function toBool(v: unknown): boolean {
  return v === true || v === 'true';
}
function toArr<T>(v: unknown): T[] {
  if (Array.isArray(v)) return v as T[];
  return [];
}
function toJson<T>(v: unknown, def: T): T {
  if (v == null) return def;
  if (typeof v === 'object') return v as T;
  try { return JSON.parse(v as string); } catch { return def; }
}

// ─── Row → Entity mappers ──────────────────────────────────────────────────────

function rowToBusiness(r: Record<string, unknown>): Business {
  return {
    id: toStr(r.id),
    name: toStr(r.name),
    type: toStr(r.type),
    businessModel: (r.business_model as Business['businessModel']) || 'service',
    currency: toJson(r.currency, SUPPORTED_CURRENCIES[0]),
    currentBalance: toNum(r.current_balance),
    minimumBalance: toNum(r.minimum_balance),
    createdAt: toStr(r.created_at),
    updatedAt: toStr(r.updated_at),
  };
}

function rowToProject(r: Record<string, unknown>): Project {
  return {
    id: toStr(r.id),
    businessId: toStr(r.business_id),
    name: toStr(r.name),
    description: toStr(r.description),
    totalValue: toNum(r.total_value),
    status: (r.status as Project['status']) || 'active',
    startDate: toStr(r.start_date),
    endDate: r.end_date ? toStr(r.end_date) : undefined,
    clientId: r.client_id ? toStr(r.client_id) : undefined,
    isMultiPhase: toBool(r.is_multi_phase),
    clientPayments: toNum(r.client_payments),
    allocations: toArr(toJson(r.allocations, [])),
    teamAllocations: toArr(toJson(r.team_allocations, [])),
    partnerAllocations: toArr(toJson(r.partner_allocations, [])),
    companyAllocation: r.company_allocation ? toJson(r.company_allocation, undefined) : undefined,
    allocationTeamAllocations: toArr(toJson(r.allocation_team_allocations, [])),
    allocationPartnerAllocations: toArr(toJson(r.allocation_partner_allocations, [])),
    allocationCompanyAllocations: toArr(toJson(r.allocation_company_allocations, [])),
    expenses: toArr(toJson(r.expenses, [])),
    createdAt: toStr(r.created_at),
    updatedAt: toStr(r.updated_at),
  };
}

function rowToClient(r: Record<string, unknown>): Client {
  return {
    id: toStr(r.id),
    name: toStr(r.name),
    email: toStr(r.email),
    company: toStr(r.company),
    projects: toArr<string>(r.projects),
    totalValue: toNum(r.total_value),
    createdAt: toStr(r.created_at),
  };
}

function rowToTeamMember(r: Record<string, unknown>): TeamMember {
  return {
    id: toStr(r.id),
    name: toStr(r.name),
    email: toStr(r.email),
    role: toStr(r.role),
    memberType: (r.member_type as TeamMember['memberType']) || 'employee',
    businessIds: toArr<string>(r.business_ids),
    paymentHistory: toArr(toJson(r.payment_history, [])),
    createdAt: toStr(r.created_at),
  };
}

function rowToPartner(r: Record<string, unknown>): Partner {
  return {
    id: toStr(r.id),
    name: toStr(r.name),
    email: toStr(r.email),
    type: (r.type as Partner['type']) || 'sales',
    businessIds: toArr<string>(r.business_ids),
    paymentHistory: toArr(toJson(r.payment_history, [])),
    createdAt: toStr(r.created_at),
  };
}

function rowToPayment(r: Record<string, unknown>): Payment {
  return {
    id: toStr(r.id),
    amount: toNum(r.amount),
    date: toStr(r.date),
    projectId: r.project_id ? toStr(r.project_id) : undefined,
    allocationId: r.allocation_id ? toStr(r.allocation_id) : undefined,
    memberId: r.member_id ? toStr(r.member_id) : undefined,
    partnerId: r.partner_id ? toStr(r.partner_id) : undefined,
    clientId: r.client_id ? toStr(r.client_id) : undefined,
    retainerId: r.retainer_id ? toStr(r.retainer_id) : undefined,
    expenseId: r.expense_id ? toStr(r.expense_id) : undefined,
    type: (r.type as Payment['type']) || 'incoming',
    recipientType: r.recipient_type ? (r.recipient_type as Payment['recipientType']) : undefined,
    status: (r.status as Payment['status']) || 'pending',
    method: r.method ? toStr(r.method) : undefined,
    description: r.description ? toStr(r.description) : undefined,
    paymentSource: r.payment_source ? (r.payment_source as Payment['paymentSource']) : undefined,
    taskDescription: r.task_description ? toStr(r.task_description) : undefined,
    taskType: r.task_type ? toStr(r.task_type) : undefined,
    taskId: r.task_id ? toStr(r.task_id) : undefined,
  };
}

function rowToExpense(r: Record<string, unknown>): Expense {
  return {
    id: toStr(r.id),
    businessId: toStr(r.business_id),
    projectId: r.project_id ? toStr(r.project_id) : undefined,
    retainerId: r.retainer_id ? toStr(r.retainer_id) : undefined,
    allocationId: r.allocation_id ? toStr(r.allocation_id) : undefined,
    memberId: r.member_id ? toStr(r.member_id) : undefined,
    partnerId: r.partner_id ? toStr(r.partner_id) : undefined,
    taskId: r.task_id ? toStr(r.task_id) : undefined,
    name: toStr(r.name),
    category: (r.category as Expense['category']) || 'other',
    amount: toNum(r.amount),
    date: toStr(r.date),
    description: r.description ? toStr(r.description) : undefined,
    status: (r.status as Expense['status']) || 'pending',
    receipt: r.receipt ? toStr(r.receipt) : undefined,
    isRecurring: toBool(r.is_recurring),
    recurringFrequency: r.recurring_frequency ? (r.recurring_frequency as Expense['recurringFrequency']) : undefined,
    recurringEndDate: r.recurring_end_date ? toStr(r.recurring_end_date) : undefined,
    parentExpenseId: r.parent_expense_id ? toStr(r.parent_expense_id) : undefined,
    createdAt: toStr(r.created_at),
    updatedAt: toStr(r.updated_at),
  };
}

function rowToBankAccount(r: Record<string, unknown>): BankAccount {
  return {
    id: toStr(r.id),
    businessId: toStr(r.business_id),
    name: toStr(r.name),
    type: (r.type as BankAccount['type']) || 'bank',
    balance: toNum(r.balance),
    currency: toStr(r.currency, 'USD'),
    accountNumber: r.account_number ? toStr(r.account_number) : undefined,
    description: r.description ? toStr(r.description) : undefined,
    isDefault: toBool(r.is_default),
    createdAt: toStr(r.created_at),
    updatedAt: toStr(r.updated_at),
  };
}

function rowToSalaryRecord(r: Record<string, unknown>): SalaryRecord {
  return {
    id: toStr(r.id),
    businessId: toStr(r.business_id),
    teamMemberId: toStr(r.team_member_id),
    position: toStr(r.position),
    amount: toNum(r.amount),
    currency: toStr(r.currency, 'USD'),
    frequency: (r.frequency as SalaryRecord['frequency']) || 'monthly',
    startDate: toStr(r.start_date),
    endDate: r.end_date ? toStr(r.end_date) : undefined,
    description: r.description ? toStr(r.description) : undefined,
    projectId: r.project_id ? toStr(r.project_id) : undefined,
    clientId: r.client_id ? toStr(r.client_id) : undefined,
    isProjectBased: toBool(r.is_project_based),
    salaryType: (r.salary_type as SalaryRecord['salaryType']) || 'primary',
    contractDuration: r.contract_duration ? toNum(r.contract_duration) : undefined,
    createdAt: toStr(r.created_at),
    updatedAt: toStr(r.updated_at),
  };
}

function rowToSalaryPayment(r: Record<string, unknown>): SalaryPayment {
  return {
    id: toStr(r.id),
    salaryRecordId: toStr(r.salary_record_id),
    amount: toNum(r.amount),
    paymentDate: toStr(r.payment_date),
    period: toStr(r.period),
    method: r.method ? toStr(r.method) : undefined,
    description: r.description ? toStr(r.description) : undefined,
    status: (r.status as SalaryPayment['status']) || 'pending',
    createdAt: toStr(r.created_at),
  };
}

function rowToPayrollPeriod(r: Record<string, unknown>): PayrollPeriod {
  return {
    id: toStr(r.id),
    businessId: toStr(r.business_id),
    year: toNum(r.year),
    month: toNum(r.month),
    status: (r.status as PayrollPeriod['status']) || 'open',
    totalEmployees: toNum(r.total_employees),
    totalAmount: toNum(r.total_amount),
    paidEmployees: toNum(r.paid_employees),
    pendingEmployees: toNum(r.pending_employees),
    overdueEmployees: toNum(r.overdue_employees),
    createdAt: toStr(r.created_at),
    updatedAt: toStr(r.updated_at),
  };
}

function rowToPayslip(r: Record<string, unknown>): Payslip {
  return {
    id: toStr(r.id),
    businessId: toStr(r.business_id),
    teamMemberId: toStr(r.team_member_id),
    salaryRecordId: toStr(r.salary_record_id),
    payrollPeriodId: toStr(r.payroll_period_id),
    grossSalary: toNum(r.gross_salary),
    deductions: toArr(toJson(r.deductions, [])),
    bonuses: toArr(toJson(r.bonuses, [])),
    netSalary: toNum(r.net_salary),
    currency: toStr(r.currency, 'USD'),
    generatedAt: toStr(r.generated_at),
  };
}

function rowToExtraPayment(r: Record<string, unknown>): ExtraPayment {
  return {
    id: toStr(r.id),
    businessId: toStr(r.business_id),
    teamMemberId: toStr(r.team_member_id),
    amount: toNum(r.amount),
    currency: toStr(r.currency, 'USD'),
    period: toStr(r.period),
    paymentDate: toStr(r.payment_date),
    type: (r.type as ExtraPayment['type']) || 'bonus',
    name: toStr(r.name),
    description: r.description ? toStr(r.description) : undefined,
    status: (r.status as ExtraPayment['status']) || 'pending',
    createdAt: toStr(r.created_at),
  };
}

function rowToQuickTask(r: Record<string, unknown>): QuickTask {
  return {
    id: toStr(r.id),
    businessId: toStr(r.business_id),
    title: toStr(r.title),
    amount: toNum(r.amount),
    currencyCode: toStr(r.currency_code, 'USD'),
    assignedToId: toStr(r.assigned_to_id),
    dueDate: r.due_date ? toStr(r.due_date) : undefined,
    status: (r.status as QuickTask['status']) || 'pending',
    taskType: r.task_type ? toStr(r.task_type) : undefined,
    description: r.description ? toStr(r.description) : undefined,
    paidAt: r.paid_at ? toStr(r.paid_at) : undefined,
    createdAt: toStr(r.created_at),
    updatedAt: toStr(r.updated_at),
  };
}

function rowToRetainer(r: Record<string, unknown>): Retainer {
  return {
    id: toStr(r.id),
    businessId: toStr(r.business_id),
    clientId: toStr(r.client_id),
    name: toStr(r.name),
    amount: toNum(r.amount),
    currency: toStr(r.currency, 'USD'),
    frequency: (r.frequency as Retainer['frequency']) || 'monthly',
    startDate: toStr(r.start_date),
    endDate: r.end_date ? toStr(r.end_date) : undefined,
    status: (r.status as Retainer['status']) || 'active',
    serviceTypeId: r.service_type_id ? toStr(r.service_type_id) : undefined,
    description: r.description ? toStr(r.description) : undefined,
    nextBillingDate: toStr(r.next_billing_date),
    totalReceived: toNum(r.total_received),
    createdAt: toStr(r.created_at),
    updatedAt: toStr(r.updated_at),
  };
}

function rowToRenewal(r: Record<string, unknown>): Renewal {
  return {
    id: toStr(r.id),
    businessId: toStr(r.business_id),
    clientId: toStr(r.client_id),
    retainerId: r.retainer_id ? toStr(r.retainer_id) : undefined,
    name: toStr(r.name),
    serviceTypeId: r.service_type_id ? toStr(r.service_type_id) : undefined,
    amount: toNum(r.amount),
    currency: toStr(r.currency, 'USD'),
    frequency: (r.frequency as Renewal['frequency']) || 'yearly',
    nextRenewalDate: toStr(r.next_renewal_date),
    description: r.description ? toStr(r.description) : undefined,
    lastPaidDate: r.last_paid_date ? toStr(r.last_paid_date) : undefined,
    totalPaid: r.total_paid ? toNum(r.total_paid) : undefined,
    createdAt: toStr(r.created_at),
    updatedAt: toStr(r.updated_at),
  };
}

function rowToRenewalPayment(r: Record<string, unknown>): RenewalPayment {
  return {
    id: toStr(r.id),
    renewalId: toStr(r.renewal_id),
    amount: toNum(r.amount),
    currency: toStr(r.currency, 'USD'),
    date: toStr(r.date),
    invoiceUrl: r.invoice_url ? toStr(r.invoice_url) : undefined,
    invoiceFileName: r.invoice_file_name ? toStr(r.invoice_file_name) : undefined,
    notes: r.notes ? toStr(r.notes) : undefined,
    status: (r.status as RenewalPayment['status']) || 'pending',
    createdAt: toStr(r.created_at),
  };
}

function rowToPayable(r: Record<string, unknown>): Payable {
  return {
    id: toStr(r.id),
    businessId: toStr(r.business_id),
    accountId: r.account_id ? toStr(r.account_id) : undefined,
    vendorName: toStr(r.vendor_name),
    amount: toNum(r.amount),
    paidAmount: toNum(r.paid_amount),
    currency: toStr(r.currency, 'USD'),
    dueDate: toStr(r.due_date),
    status: (r.status as Payable['status']) || 'pending',
    category: r.category ? toStr(r.category) : undefined,
    description: r.description ? toStr(r.description) : undefined,
    invoiceRef: r.invoice_ref ? toStr(r.invoice_ref) : undefined,
    createdAt: toStr(r.created_at),
    updatedAt: toStr(r.updated_at),
  };
}

function rowToReceivable(r: Record<string, unknown>): Receivable {
  return {
    id: toStr(r.id),
    businessId: toStr(r.business_id),
    accountId: r.account_id ? toStr(r.account_id) : undefined,
    clientId: r.client_id ? toStr(r.client_id) : undefined,
    projectId: r.project_id ? toStr(r.project_id) : undefined,
    retainerId: r.retainer_id ? toStr(r.retainer_id) : undefined,
    sourceName: toStr(r.source_name),
    amount: toNum(r.amount),
    receivedAmount: toNum(r.received_amount),
    currency: toStr(r.currency, 'USD'),
    dueDate: toStr(r.due_date),
    status: (r.status as Receivable['status']) || 'pending',
    description: r.description ? toStr(r.description) : undefined,
    invoiceRef: r.invoice_ref ? toStr(r.invoice_ref) : undefined,
    paymentRecords: toArr(toJson(r.payment_records, [])),
    isProjectSynced: toBool(r.is_project_synced),
    createdAt: toStr(r.created_at),
    updatedAt: toStr(r.updated_at),
  };
}

function rowToTodo(r: Record<string, unknown>): ToDo {
  return {
    id: toStr(r.id),
    businessId: r.business_id ? toStr(r.business_id) : undefined,
    title: toStr(r.title),
    description: r.description ? toStr(r.description) : undefined,
    dueDate: toStr(r.due_date),
    originalDueDate: r.original_due_date ? toStr(r.original_due_date) : undefined,
    isRecurring: toBool(r.is_recurring),
    recurringPattern: r.recurring_pattern ? (r.recurring_pattern as ToDo['recurringPattern']) : undefined,
    recurringEndDate: r.recurring_end_date ? toStr(r.recurring_end_date) : undefined,
    parentRecurringId: r.parent_recurring_id ? toStr(r.parent_recurring_id) : undefined,
    lastGeneratedDate: r.last_generated_date ? toStr(r.last_generated_date) : undefined,
    status: (r.status as ToDo['status']) || 'pending',
    completedAt: r.completed_at ? toStr(r.completed_at) : undefined,
    completedBy: r.completed_by ? toStr(r.completed_by) : undefined,
    completedByName: r.completed_by_name ? toStr(r.completed_by_name) : undefined,
    priority: (r.priority as ToDo['priority']) || 'medium',
    assignees: toArr(toJson(r.assignees, [])),
    assigneeType: r.assignee_type ? (r.assignee_type as ToDo['assigneeType']) : undefined,
    assigneeId: r.assignee_id ? toStr(r.assignee_id) : undefined,
    assigneeName: r.assignee_name ? toStr(r.assignee_name) : undefined,
    createdBy: toStr(r.created_by),
    createdByName: r.created_by_name ? toStr(r.created_by_name) : undefined,
    linkType: (r.link_type as ToDo['linkType']) || 'general',
    linkedEntityId: r.linked_entity_id ? toStr(r.linked_entity_id) : undefined,
    linkedEntityName: r.linked_entity_name ? toStr(r.linked_entity_name) : undefined,
    tags: r.tags ? toArr<string>(r.tags) : undefined,
    notes: r.notes ? toStr(r.notes) : undefined,
    createdAt: toStr(r.created_at),
    updatedAt: toStr(r.updated_at),
  };
}

function rowToProduct(r: Record<string, unknown>): Product {
  return {
    id: toStr(r.id),
    businessId: toStr(r.business_id),
    name: toStr(r.name),
    sku: toStr(r.sku),
    description: r.description ? toStr(r.description) : undefined,
    category: r.category ? toStr(r.category) : undefined,
    unitPrice: toNum(r.unit_price),
    costPrice: toNum(r.cost_price),
    currency: toStr(r.currency, 'USD'),
    unit: toStr(r.unit, 'pcs'),
    currentStock: toNum(r.current_stock),
    minimumStock: toNum(r.minimum_stock),
    status: (r.status as Product['status']) || 'active',
    imageUrl: r.image_url ? toStr(r.image_url) : undefined,
    createdAt: toStr(r.created_at),
    updatedAt: toStr(r.updated_at),
  };
}

function rowToCustomer(r: Record<string, unknown>): Customer {
  return {
    id: toStr(r.id),
    businessId: toStr(r.business_id),
    name: toStr(r.name),
    email: r.email ? toStr(r.email) : undefined,
    phone: r.phone ? toStr(r.phone) : undefined,
    company: r.company ? toStr(r.company) : undefined,
    type: (r.type as Customer['type']) || 'retail',
    address: r.address ? toStr(r.address) : undefined,
    totalPurchases: toNum(r.total_purchases),
    outstandingBalance: toNum(r.outstanding_balance),
    createdAt: toStr(r.created_at),
    updatedAt: toStr(r.updated_at),
  };
}

function rowToSalesOrder(r: Record<string, unknown>): SalesOrder {
  return {
    id: toStr(r.id),
    businessId: toStr(r.business_id),
    customerId: toStr(r.customer_id),
    orderNumber: toStr(r.order_number),
    items: toArr(toJson(r.items, [])),
    subtotal: toNum(r.subtotal),
    discount: toNum(r.discount),
    tax: toNum(r.tax),
    total: toNum(r.total),
    currency: toStr(r.currency, 'USD'),
    status: (r.status as SalesOrder['status']) || 'draft',
    paymentStatus: (r.payment_status as SalesOrder['paymentStatus']) || 'pending',
    paidAmount: toNum(r.paid_amount),
    orderDate: toStr(r.order_date),
    deliveryDate: r.delivery_date ? toStr(r.delivery_date) : undefined,
    notes: r.notes ? toStr(r.notes) : undefined,
    createdAt: toStr(r.created_at),
    updatedAt: toStr(r.updated_at),
  };
}

function rowToProductionBatch(r: Record<string, unknown>): ProductionBatch {
  return {
    id: toStr(r.id),
    businessId: toStr(r.business_id),
    productId: toStr(r.product_id),
    batchNumber: toStr(r.batch_number),
    quantity: toNum(r.quantity),
    status: (r.status as ProductionBatch['status']) || 'planned',
    startDate: toStr(r.start_date),
    completionDate: r.completion_date ? toStr(r.completion_date) : undefined,
    productionCost: toNum(r.production_cost),
    notes: r.notes ? toStr(r.notes) : undefined,
    createdAt: toStr(r.created_at),
    updatedAt: toStr(r.updated_at),
  };
}

function rowToPurchaseOrder(r: Record<string, unknown>): PurchaseOrder {
  return {
    id: toStr(r.id),
    businessId: toStr(r.business_id),
    supplierName: toStr(r.supplier_name),
    orderNumber: toStr(r.order_number),
    items: toArr(toJson(r.items, [])),
    total: toNum(r.total),
    currency: toStr(r.currency, 'USD'),
    status: (r.status as PurchaseOrder['status']) || 'draft',
    orderDate: toStr(r.order_date),
    expectedDate: r.expected_date ? toStr(r.expected_date) : undefined,
    receivedDate: r.received_date ? toStr(r.received_date) : undefined,
    notes: r.notes ? toStr(r.notes) : undefined,
    createdAt: toStr(r.created_at),
    updatedAt: toStr(r.updated_at),
  };
}

function rowToWorkspaceUser(r: Record<string, unknown>): UserBusinessAccess {
  return {
    userId: toStr(r.user_id),
    email: r.email ? toStr(r.email) : undefined,
    displayName: r.display_name ? toStr(r.display_name) : undefined,
    businessIds: toArr<string>(r.business_ids),
    role: (r.role as UserBusinessAccess['role']) || 'viewer',
    inviteStatus: (r.invite_status as UserBusinessAccess['inviteStatus']) || 'pending',
  };
}

// ─── Entity → DB row mappers ──────────────────────────────────────────────────

function businessToRow(b: Business, workspaceId: string): Record<string, unknown> {
  return {
    id: b.id,
    workspace_id: workspaceId,
    name: b.name,
    type: b.type,
    business_model: b.businessModel,
    currency: b.currency,
    current_balance: b.currentBalance,
    minimum_balance: b.minimumBalance,
    created_at: b.createdAt,
    updated_at: b.updatedAt,
  };
}

function projectToRow(p: Project, workspaceId: string): Record<string, unknown> {
  return {
    id: p.id,
    workspace_id: workspaceId,
    business_id: p.businessId,
    name: p.name,
    description: p.description,
    total_value: p.totalValue,
    status: p.status,
    start_date: p.startDate,
    end_date: p.endDate ?? null,
    client_id: p.clientId ?? null,
    is_multi_phase: p.isMultiPhase ?? false,
    client_payments: p.clientPayments ?? 0,
    allocations: JSON.stringify(p.allocations),
    team_allocations: JSON.stringify(p.teamAllocations),
    partner_allocations: JSON.stringify(p.partnerAllocations),
    company_allocation: p.companyAllocation ? JSON.stringify(p.companyAllocation) : null,
    allocation_team_allocations: JSON.stringify(p.allocationTeamAllocations),
    allocation_partner_allocations: JSON.stringify(p.allocationPartnerAllocations),
    allocation_company_allocations: JSON.stringify(p.allocationCompanyAllocations),
    expenses: JSON.stringify(p.expenses),
    created_at: p.createdAt,
    updated_at: p.updatedAt,
  };
}

// ─── Main Repository Class ─────────────────────────────────────────────────────

export class SupabaseDBRepository implements IDataRepository {
  private local: LocalStorageRepository;

  constructor() {
    this.local = new LocalStorageRepository();
  }

  // ── Load ────────────────────────────────────────────────────────────────────

  load(): AppData {
    // Return cached local data immediately (synchronous contract)
    return this.local.load();
  }

  /**
   * Async load: queries Supabase tables, caches result in localStorage, returns AppData.
   * Call this after authentication is confirmed.
   */
  async loadAsync(): Promise<AppData> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return this.local.load();

      // Check if we need to run one-time migration from Storage JSON
      const migrated = localStorage.getItem(DB_MIGRATED_KEY);
      if (!migrated) {
        await this._runOneTimeMigration(user.id);
      }

      // Fetch all tables in parallel
      const [
        businessesRes, projectsRes, clientsRes, teamMembersRes, partnersRes,
        paymentsRes, expensesRes, bankAccountsRes, salaryRecordsRes,
        salaryPaymentsRes, payrollPeriodsRes, payslipsRes, extraPaymentsRes,
        quickTasksRes, retainersRes, renewalsRes, renewalPaymentsRes,
        payablesRes, receivablesRes, todosRes, serviceTypesRes,
        exchangeRatesRes, customCurrenciesRes, productsRes, customersRes,
        salesOrdersRes, productionBatchesRes, purchaseOrdersRes,
        workspaceUsersRes, userSettingsRes,
      ] = await Promise.all([
        supabase.from('businesses').select('*').order('created_at'),
        supabase.from('projects').select('*').order('created_at'),
        supabase.from('clients').select('*').order('created_at'),
        supabase.from('team_members').select('*').order('created_at'),
        supabase.from('partners').select('*').order('created_at'),
        supabase.from('payments').select('*').order('created_at'),
        supabase.from('expenses').select('*').order('created_at'),
        supabase.from('bank_accounts').select('*').order('created_at'),
        supabase.from('salary_records').select('*').order('created_at'),
        supabase.from('salary_payments').select('*').order('created_at'),
        supabase.from('payroll_periods').select('*').order('created_at'),
        supabase.from('payslips').select('*').order('generated_at'),
        supabase.from('extra_payments').select('*').order('created_at'),
        supabase.from('quick_tasks').select('*').order('created_at'),
        supabase.from('retainers').select('*').order('created_at'),
        supabase.from('renewals').select('*').order('created_at'),
        supabase.from('renewal_payments').select('*').order('created_at'),
        supabase.from('payables').select('*').order('created_at'),
        supabase.from('receivables').select('*').order('created_at'),
        supabase.from('todos').select('*').order('due_date'),
        supabase.from('service_types').select('*').order('created_at'),
        supabase.from('exchange_rates').select('*').order('created_at'),
        supabase.from('custom_currencies').select('*').order('created_at'),
        supabase.from('products').select('*').order('created_at'),
        supabase.from('customers').select('*').order('created_at'),
        supabase.from('sales_orders').select('*').order('created_at'),
        supabase.from('production_batches').select('*').order('created_at'),
        supabase.from('purchase_orders').select('*').order('created_at'),
        supabase.from('workspace_users').select('*').order('created_at'),
        supabase.from('user_settings').select('*').eq('user_id', user.id).maybeSingle(),
      ]);

      const localData = this.local.load();
      const us = userSettingsRes.data;

      const assembled: AppData = {
        businesses: (businessesRes.data || []).map(rowToBusiness),
        projects: (projectsRes.data || []).map(rowToProject),
        clients: (clientsRes.data || []).map(rowToClient),
        teamMembers: (teamMembersRes.data || []).map(rowToTeamMember),
        partners: (partnersRes.data || []).map(rowToPartner),
        payments: (paymentsRes.data || []).map(rowToPayment),
        expenses: (expensesRes.data || []).map(rowToExpense),
        bankAccounts: (bankAccountsRes.data || []).map(rowToBankAccount),
        salaryRecords: (salaryRecordsRes.data || []).map(rowToSalaryRecord),
        salaryPayments: (salaryPaymentsRes.data || []).map(rowToSalaryPayment),
        payrollPeriods: (payrollPeriodsRes.data || []).map(rowToPayrollPeriod),
        payslips: (payslipsRes.data || []).map(rowToPayslip),
        extraPayments: (extraPaymentsRes.data || []).map(rowToExtraPayment),
        quickTasks: (quickTasksRes.data || []).map(rowToQuickTask),
        retainers: (retainersRes.data || []).map(rowToRetainer),
        renewals: (renewalsRes.data || []).map(rowToRenewal),
        renewalPayments: (renewalPaymentsRes.data || []).map(rowToRenewalPayment),
        payables: (payablesRes.data || []).map(rowToPayable),
        receivables: (receivablesRes.data || []).map(rowToReceivable),
        todos: (todosRes.data || []).map(rowToTodo),
        serviceTypes: (serviceTypesRes.data || []).length > 0
          ? (serviceTypesRes.data || []).map(r => ({
              id: toStr(r.id), name: toStr(r.name), icon: r.icon ? toStr(r.icon) : undefined,
            }))
          : [...DEFAULT_SERVICE_TYPES],
        exchangeRates: (exchangeRatesRes.data || []).map(r => ({
          id: toStr(r.id),
          fromCurrency: toStr(r.from_currency),
          toCurrency: toStr(r.to_currency),
          rate: toNum(r.rate),
          createdAt: toStr(r.created_at),
          updatedAt: toStr(r.updated_at),
        })),
        customCurrencies: (customCurrenciesRes.data || []).map(r => ({
          code: toStr(r.code), symbol: toStr(r.symbol), name: toStr(r.name), isCustom: true,
        })),
        products: (productsRes.data || []).map(rowToProduct),
        customers: (customersRes.data || []).map(rowToCustomer),
        salesOrders: (salesOrdersRes.data || []).map(rowToSalesOrder),
        productionBatches: (productionBatchesRes.data || []).map(rowToProductionBatch),
        purchaseOrders: (purchaseOrdersRes.data || []).map(rowToPurchaseOrder),
        userBusinessAccess: (workspaceUsersRes.data || []).map(rowToWorkspaceUser),
        currentBusinessId: localData.currentBusinessId,
        userSettings: {
          username: us ? toStr(us.username) : (localData.userSettings?.username || ''),
          accountName: us ? toStr(us.account_name) : (localData.userSettings?.accountName || ''),
          userId: user.id,
          theme: us ? (us.theme as 'light' | 'dark') : (localData.userSettings?.theme || 'light'),
          defaultCurrency: us?.default_currency
            ? toJson(us.default_currency, SUPPORTED_CURRENCIES[0])
            : (localData.userSettings?.defaultCurrency || SUPPORTED_CURRENCIES[0]),
          fontFamily: us?.font_family
            ? toJson(us.font_family, getDefaultFont())
            : (localData.userSettings?.fontFamily || getDefaultFont()),
          colorPalette: us?.color_palette
            ? toJson(us.color_palette, getDefaultColorPalette())
            : (localData.userSettings?.colorPalette || getDefaultColorPalette()),
        },
      };

      // Update local cache
      this.local.save(assembled);
      return assembled;
    } catch (err) {
      console.error('[SupabaseDB] loadAsync failed, using local cache:', err);
      return this.local.load();
    }
  }

  // ── Save ────────────────────────────────────────────────────────────────────

  save(data: AppData): void {
    // Synchronous: save to local cache immediately
    this.local.save(data);
    // Async: persist to Supabase in the background
    void this._saveAsync(data);
  }

  private async _saveAsync(data: AppData): Promise<void> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const workspaceId = this._deriveWorkspaceId(data, user.id);
      await Promise.all([
        this._upsertAll('businesses', data.businesses.map(b => businessToRow(b, workspaceId))),
        this._upsertAll('projects', data.projects.map(p => projectToRow(p, workspaceId))),
        this._upsertAll('clients', data.clients.map(c => ({
          id: c.id, workspace_id: workspaceId, name: c.name, email: c.email,
          company: c.company, projects: c.projects, total_value: c.totalValue,
          created_at: c.createdAt,
        }))),
        this._upsertAll('team_members', data.teamMembers.map(tm => ({
          id: tm.id, workspace_id: workspaceId, name: tm.name, email: tm.email,
          role: tm.role, member_type: tm.memberType, business_ids: tm.businessIds,
          payment_history: JSON.stringify(tm.paymentHistory), created_at: tm.createdAt,
        }))),
        this._upsertAll('partners', data.partners.map(p => ({
          id: p.id, workspace_id: workspaceId, name: p.name, email: p.email,
          type: p.type, business_ids: p.businessIds,
          payment_history: JSON.stringify(p.paymentHistory), created_at: p.createdAt,
        }))),
        this._upsertAll('payments', data.payments.map(p => ({
          id: p.id, workspace_id: workspaceId, amount: p.amount, date: p.date,
          project_id: p.projectId ?? null, allocation_id: p.allocationId ?? null,
          member_id: p.memberId ?? null, partner_id: p.partnerId ?? null,
          client_id: p.clientId ?? null, retainer_id: p.retainerId ?? null,
          expense_id: p.expenseId ?? null, type: p.type,
          recipient_type: p.recipientType ?? null, status: p.status,
          method: p.method ?? null, description: p.description ?? null,
          payment_source: p.paymentSource ?? null,
          task_description: p.taskDescription ?? null,
          task_type: p.taskType ?? null, task_id: p.taskId ?? null,
        }))),
        this._upsertAll('expenses', data.expenses.map(e => ({
          id: e.id, workspace_id: workspaceId, business_id: e.businessId,
          project_id: e.projectId ?? null, retainer_id: e.retainerId ?? null,
          allocation_id: e.allocationId ?? null, member_id: e.memberId ?? null,
          partner_id: e.partnerId ?? null, task_id: e.taskId ?? null,
          name: e.name, category: e.category, amount: e.amount, date: e.date,
          description: e.description ?? null, status: e.status,
          receipt: e.receipt ?? null, is_recurring: e.isRecurring ?? false,
          recurring_frequency: e.recurringFrequency ?? null,
          recurring_end_date: e.recurringEndDate ?? null,
          parent_expense_id: e.parentExpenseId ?? null,
          created_at: e.createdAt, updated_at: e.updatedAt,
        }))),
        this._upsertAll('bank_accounts', data.bankAccounts.map(b => ({
          id: b.id, workspace_id: workspaceId, business_id: b.businessId,
          name: b.name, type: b.type, balance: b.balance, currency: b.currency,
          account_number: b.accountNumber ?? null, description: b.description ?? null,
          is_default: b.isDefault, created_at: b.createdAt, updated_at: b.updatedAt,
        }))),
        this._upsertAll('salary_records', data.salaryRecords.map(sr => ({
          id: sr.id, workspace_id: workspaceId, business_id: sr.businessId,
          team_member_id: sr.teamMemberId, position: sr.position, amount: sr.amount,
          currency: sr.currency, frequency: sr.frequency, start_date: sr.startDate,
          end_date: sr.endDate ?? null, description: sr.description ?? null,
          project_id: sr.projectId ?? null, client_id: sr.clientId ?? null,
          is_project_based: sr.isProjectBased ?? false, salary_type: sr.salaryType,
          contract_duration: sr.contractDuration ?? null,
          created_at: sr.createdAt, updated_at: sr.updatedAt,
        }))),
        this._upsertAll('salary_payments', data.salaryPayments.map(sp => ({
          id: sp.id, workspace_id: workspaceId, salary_record_id: sp.salaryRecordId,
          amount: sp.amount, payment_date: sp.paymentDate, period: sp.period,
          method: sp.method ?? null, description: sp.description ?? null,
          status: sp.status, created_at: sp.createdAt,
        }))),
        this._upsertAll('payroll_periods', data.payrollPeriods.map(pp => ({
          id: pp.id, workspace_id: workspaceId, business_id: pp.businessId,
          year: pp.year, month: pp.month, status: pp.status,
          total_employees: pp.totalEmployees, total_amount: pp.totalAmount,
          paid_employees: pp.paidEmployees, pending_employees: pp.pendingEmployees,
          overdue_employees: pp.overdueEmployees,
          created_at: pp.createdAt, updated_at: pp.updatedAt,
        }))),
        this._upsertAll('payslips', data.payslips.map(ps => ({
          id: ps.id, workspace_id: workspaceId, business_id: ps.businessId,
          team_member_id: ps.teamMemberId, salary_record_id: ps.salaryRecordId,
          payroll_period_id: ps.payrollPeriodId, gross_salary: ps.grossSalary,
          deductions: JSON.stringify(ps.deductions), bonuses: JSON.stringify(ps.bonuses),
          net_salary: ps.netSalary, currency: ps.currency, generated_at: ps.generatedAt,
        }))),
        this._upsertAll('extra_payments', data.extraPayments.map(ep => ({
          id: ep.id, workspace_id: workspaceId, business_id: ep.businessId,
          team_member_id: ep.teamMemberId, amount: ep.amount, currency: ep.currency,
          period: ep.period, payment_date: ep.paymentDate, type: ep.type,
          name: ep.name, description: ep.description ?? null, status: ep.status,
          created_at: ep.createdAt,
        }))),
        this._upsertAll('quick_tasks', data.quickTasks.map(qt => ({
          id: qt.id, workspace_id: workspaceId, business_id: qt.businessId,
          title: qt.title, amount: qt.amount, currency_code: qt.currencyCode,
          assigned_to_id: qt.assignedToId, due_date: qt.dueDate ?? null,
          status: qt.status, task_type: qt.taskType ?? null,
          description: qt.description ?? null, paid_at: qt.paidAt ?? null,
          created_at: qt.createdAt, updated_at: qt.updatedAt,
        }))),
        this._upsertAll('retainers', data.retainers.map(r => ({
          id: r.id, workspace_id: workspaceId, business_id: r.businessId,
          client_id: r.clientId, name: r.name, amount: r.amount, currency: r.currency,
          frequency: r.frequency, start_date: r.startDate, end_date: r.endDate ?? null,
          status: r.status, service_type_id: r.serviceTypeId ?? null,
          description: r.description ?? null, next_billing_date: r.nextBillingDate,
          total_received: r.totalReceived, created_at: r.createdAt, updated_at: r.updatedAt,
        }))),
        this._upsertAll('renewals', data.renewals.map(r => ({
          id: r.id, workspace_id: workspaceId, business_id: r.businessId,
          client_id: r.clientId, retainer_id: r.retainerId ?? null, name: r.name,
          service_type_id: r.serviceTypeId ?? null, amount: r.amount, currency: r.currency,
          frequency: r.frequency, next_renewal_date: r.nextRenewalDate,
          description: r.description ?? null, last_paid_date: r.lastPaidDate ?? null,
          total_paid: r.totalPaid ?? 0, created_at: r.createdAt, updated_at: r.updatedAt,
        }))),
        this._upsertAll('renewal_payments', data.renewalPayments.map(rp => ({
          id: rp.id, workspace_id: workspaceId, renewal_id: rp.renewalId,
          amount: rp.amount, currency: rp.currency, date: rp.date,
          invoice_url: rp.invoiceUrl ?? null, invoice_file_name: rp.invoiceFileName ?? null,
          notes: rp.notes ?? null, status: rp.status, created_at: rp.createdAt,
        }))),
        this._upsertAll('payables', data.payables.map(p => ({
          id: p.id, workspace_id: workspaceId, business_id: p.businessId,
          account_id: p.accountId ?? null, vendor_name: p.vendorName,
          amount: p.amount, paid_amount: p.paidAmount, currency: p.currency,
          due_date: p.dueDate, status: p.status, category: p.category ?? null,
          description: p.description ?? null, invoice_ref: p.invoiceRef ?? null,
          created_at: p.createdAt, updated_at: p.updatedAt,
        }))),
        this._upsertAll('receivables', data.receivables.map(r => ({
          id: r.id, workspace_id: workspaceId, business_id: r.businessId,
          account_id: r.accountId ?? null, client_id: r.clientId ?? null,
          project_id: r.projectId ?? null, retainer_id: r.retainerId ?? null,
          source_name: r.sourceName, amount: r.amount, received_amount: r.receivedAmount,
          currency: r.currency, due_date: r.dueDate, status: r.status,
          description: r.description ?? null, invoice_ref: r.invoiceRef ?? null,
          payment_records: JSON.stringify(r.paymentRecords || []),
          is_project_synced: r.isProjectSynced ?? false,
          created_at: r.createdAt, updated_at: r.updatedAt,
        }))),
        this._upsertAll('todos', data.todos.map(t => ({
          id: t.id, workspace_id: workspaceId, business_id: t.businessId ?? null,
          title: t.title, description: t.description ?? null, due_date: t.dueDate,
          original_due_date: t.originalDueDate ?? null, is_recurring: t.isRecurring ?? false,
          recurring_pattern: t.recurringPattern ?? null, recurring_end_date: t.recurringEndDate ?? null,
          parent_recurring_id: t.parentRecurringId ?? null,
          last_generated_date: t.lastGeneratedDate ?? null,
          status: t.status, completed_at: t.completedAt ?? null,
          completed_by: t.completedBy ?? null, completed_by_name: t.completedByName ?? null,
          priority: t.priority, assignees: JSON.stringify(t.assignees),
          assignee_type: t.assigneeType ?? null, assignee_id: t.assigneeId ?? null,
          assignee_name: t.assigneeName ?? null, created_by: t.createdBy,
          created_by_name: t.createdByName ?? null, link_type: t.linkType,
          linked_entity_id: t.linkedEntityId ?? null,
          linked_entity_name: t.linkedEntityName ?? null,
          tags: t.tags ?? null, notes: t.notes ?? null,
          created_at: t.createdAt, updated_at: t.updatedAt,
        }))),
        this._upsertAll('service_types', data.serviceTypes.map(st => ({
          id: st.id, workspace_id: workspaceId, name: st.name, icon: st.icon ?? null,
        }))),
        this._upsertAll('exchange_rates', data.exchangeRates.map(er => ({
          id: er.id, workspace_id: workspaceId,
          from_currency: er.fromCurrency, to_currency: er.toCurrency,
          rate: er.rate, created_at: er.createdAt, updated_at: er.updatedAt,
        }))),
        this._upsertAll('custom_currencies', data.customCurrencies.map((c, i) => ({
          id: c.code, workspace_id: workspaceId,
          code: c.code, symbol: c.symbol, name: c.name, is_custom: true,
        }))),
        this._upsertAll('products', data.products.map(p => ({
          id: p.id, workspace_id: workspaceId, business_id: p.businessId,
          name: p.name, sku: p.sku, description: p.description ?? null,
          category: p.category ?? null, unit_price: p.unitPrice, cost_price: p.costPrice,
          currency: p.currency, unit: p.unit, current_stock: p.currentStock,
          minimum_stock: p.minimumStock, status: p.status, image_url: p.imageUrl ?? null,
          created_at: p.createdAt, updated_at: p.updatedAt,
        }))),
        this._upsertAll('customers', data.customers.map(c => ({
          id: c.id, workspace_id: workspaceId, business_id: c.businessId,
          name: c.name, email: c.email ?? null, phone: c.phone ?? null,
          company: c.company ?? null, type: c.type, address: c.address ?? null,
          total_purchases: c.totalPurchases, outstanding_balance: c.outstandingBalance,
          created_at: c.createdAt, updated_at: c.updatedAt,
        }))),
        this._upsertAll('sales_orders', data.salesOrders.map(so => ({
          id: so.id, workspace_id: workspaceId, business_id: so.businessId,
          customer_id: so.customerId, order_number: so.orderNumber,
          items: JSON.stringify(so.items), subtotal: so.subtotal, discount: so.discount,
          tax: so.tax, total: so.total, currency: so.currency, status: so.status,
          payment_status: so.paymentStatus, paid_amount: so.paidAmount,
          order_date: so.orderDate, delivery_date: so.deliveryDate ?? null,
          notes: so.notes ?? null, created_at: so.createdAt, updated_at: so.updatedAt,
        }))),
        this._upsertAll('production_batches', data.productionBatches.map(pb => ({
          id: pb.id, workspace_id: workspaceId, business_id: pb.businessId,
          product_id: pb.productId, batch_number: pb.batchNumber,
          quantity: pb.quantity, status: pb.status, start_date: pb.startDate,
          completion_date: pb.completionDate ?? null, production_cost: pb.productionCost,
          notes: pb.notes ?? null, created_at: pb.createdAt, updated_at: pb.updatedAt,
        }))),
        this._upsertAll('purchase_orders', data.purchaseOrders.map(po => ({
          id: po.id, workspace_id: workspaceId, business_id: po.businessId,
          supplier_name: po.supplierName, order_number: po.orderNumber,
          items: JSON.stringify(po.items), total: po.total, currency: po.currency,
          status: po.status, order_date: po.orderDate,
          expected_date: po.expectedDate ?? null, received_date: po.receivedDate ?? null,
          notes: po.notes ?? null, created_at: po.createdAt, updated_at: po.updatedAt,
        }))),
        // Workspace users (access control)
        this._upsertAll('workspace_users', data.userBusinessAccess.map(ua => ({
          workspace_id: workspaceId, user_id: ua.userId, email: ua.email ?? null,
          display_name: ua.displayName ?? null, role: ua.role,
          business_ids: ua.businessIds, invite_status: ua.inviteStatus ?? 'active',
        }))),
        // User settings
        this._upsertUserSettings(user.id, data),
        // Workspace record
        this._upsertWorkspace(workspaceId, user.id, data),
      ]);
    } catch (err) {
      console.error('[SupabaseDB] saveAsync failed:', err);
    }
  }

  private _deriveWorkspaceId(data: AppData, userId: string): string {
    const accountName = data.userSettings?.accountName?.trim();
    if (accountName) {
      return accountName.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
    }
    return userId;
  }

  private async _upsertAll(table: string, rows: Record<string, unknown>[]): Promise<void> {
    if (!rows.length) return;
    // Batch in chunks of 200 to avoid request size limits
    const CHUNK = 200;
    for (let i = 0; i < rows.length; i += CHUNK) {
      const chunk = rows.slice(i, i + CHUNK);
      const { error } = await (supabase.from(table as any) as any)
        .upsert(chunk, { onConflict: 'id' });
      if (error) console.warn(`[SupabaseDB] upsert ${table} error:`, error.message);
    }
  }

  private async _upsertUserSettings(userId: string, data: AppData): Promise<void> {
    const us = data.userSettings;
    const { error } = await supabase.from('user_settings').upsert({
      user_id: userId,
      username: us.username,
      account_name: us.accountName,
      theme: us.theme,
      default_currency: us.defaultCurrency,
      font_family: us.fontFamily,
      color_palette: us.colorPalette,
    }, { onConflict: 'user_id' });
    if (error) console.warn('[SupabaseDB] upsert user_settings error:', error.message);
  }

  private async _upsertWorkspace(workspaceId: string, userId: string, data: AppData): Promise<void> {
    const { error } = await supabase.from('workspaces').upsert({
      id: workspaceId,
      owner_user_id: userId,
      account_name: data.userSettings.accountName || workspaceId,
      workspace_name: data.userSettings.username || '',
    }, { onConflict: 'id' });
    if (error) console.warn('[SupabaseDB] upsert workspace error:', error.message);
  }

  // ── One-time migration from Storage JSON ────────────────────────────────────

  private async _runOneTimeMigration(userId: string): Promise<void> {
    try {
      const localData = this.local.load();
      // Check if we have local data to migrate
      if (!localData.businesses.length && !localData.projects.length) {
        // Try to fetch from Storage (for users who had cloud sync)
        const accountName = localData.userSettings?.accountName;
        if (accountName || userId) {
          const slug = accountName
            ? accountName.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')
            : userId;
          const filePath = `${slug}/data.json`;
          const { data: fileData } = await supabase.storage
            .from(BUCKET)
            .download(filePath);
          if (fileData) {
            const text = await fileData.text();
            const storageData = JSON.parse(text) as AppData;
            this.local.save(storageData);
            await this._saveAsync(storageData);
          }
        }
      } else {
        // Migrate existing local data to DB
        await this._saveAsync(localData);
      }
      localStorage.setItem(DB_MIGRATED_KEY, 'true');
    } catch (err) {
      console.warn('[SupabaseDB] One-time migration failed:', err);
      localStorage.setItem(DB_MIGRATED_KEY, 'true'); // Don't retry endlessly
    }
  }

  // ── IDataRepository required methods ────────────────────────────────────────

  export(): ExportedData {
    const data = this.local.load();
    const metadata: BackupMetadata = {
      backupVersion: BACKUP_VERSION,
      backupDate: new Date().toISOString(),
      appVersion: APP_VERSION,
    };
    return { metadata, data };
  }

  import(jsonString: string): AppData {
    const local = this.local.import(jsonString);
    void this._saveAsync(local);
    return local;
  }

  clear(): void {
    this.local.clear();
  }

  generateId(): string {
    return this.local.generateId();
  }
}

export const supabaseDBRepository = new SupabaseDBRepository();
