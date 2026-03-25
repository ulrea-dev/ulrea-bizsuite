
-- =====================================================
-- BizSuite: Full Database Migration
-- All workspace data tables with RLS
-- =====================================================

-- Helper function: get_updated_at trigger
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- =====================================================
-- RLS HELPER: Get the user's workspace_id from JWT
-- Owners: their own userId; Invited users: owner's userId
-- =====================================================
CREATE OR REPLACE FUNCTION public.get_user_workspace_id()
RETURNS text
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT COALESCE(
    (auth.jwt() -> 'user_metadata' ->> 'workspace_id'),
    auth.uid()::text
  )
$$;

-- =====================================================
-- 1. WORKSPACES (one per account/owner)
-- =====================================================
CREATE TABLE IF NOT EXISTS public.workspaces (
  id            text PRIMARY KEY,   -- = accountName slug or userId
  owner_user_id uuid NOT NULL,
  account_name  text NOT NULL,
  workspace_name text,
  created_at    timestamptz NOT NULL DEFAULT now(),
  updated_at    timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.workspaces ENABLE ROW LEVEL SECURITY;

CREATE POLICY "workspace_owner_all" ON public.workspaces
  USING (owner_user_id = auth.uid());

CREATE POLICY "workspace_invited_select" ON public.workspaces
  FOR SELECT USING (id = public.get_user_workspace_id());

CREATE TRIGGER workspaces_updated_at
  BEFORE UPDATE ON public.workspaces
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- =====================================================
-- 2. USER_SETTINGS (per auth user, holds preferences)
-- =====================================================
CREATE TABLE IF NOT EXISTS public.user_settings (
  user_id          uuid PRIMARY KEY,
  username         text NOT NULL DEFAULT '',
  account_name     text NOT NULL DEFAULT '',
  theme            text NOT NULL DEFAULT 'light',
  default_currency jsonb,
  font_family      jsonb,
  color_palette    jsonb,
  created_at       timestamptz NOT NULL DEFAULT now(),
  updated_at       timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.user_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "user_settings_own" ON public.user_settings
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

CREATE TRIGGER user_settings_updated_at
  BEFORE UPDATE ON public.user_settings
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- =====================================================
-- 3. WORKSPACE_USERS (access control)
-- =====================================================
CREATE TABLE IF NOT EXISTS public.workspace_users (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id  text NOT NULL,
  user_id       text NOT NULL,
  email         text,
  display_name  text,
  role          text NOT NULL DEFAULT 'viewer',
  business_ids  text[] NOT NULL DEFAULT '{}',
  invite_status text NOT NULL DEFAULT 'pending',
  created_at    timestamptz NOT NULL DEFAULT now(),
  updated_at    timestamptz NOT NULL DEFAULT now(),
  UNIQUE(workspace_id, user_id)
);
ALTER TABLE public.workspace_users ENABLE ROW LEVEL SECURITY;

CREATE POLICY "workspace_users_owner_all" ON public.workspace_users
  USING (workspace_id = public.get_user_workspace_id());

CREATE POLICY "workspace_users_member_select" ON public.workspace_users
  FOR SELECT USING (user_id = auth.uid()::text);

CREATE TRIGGER workspace_users_updated_at
  BEFORE UPDATE ON public.workspace_users
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- =====================================================
-- 4. BUSINESSES
-- =====================================================
CREATE TABLE IF NOT EXISTS public.businesses (
  id             text PRIMARY KEY,
  workspace_id   text NOT NULL,
  name           text NOT NULL,
  type           text NOT NULL DEFAULT '',
  business_model text NOT NULL DEFAULT 'service',
  currency       jsonb NOT NULL DEFAULT '{}',
  current_balance numeric NOT NULL DEFAULT 0,
  minimum_balance numeric NOT NULL DEFAULT 0,
  created_at     timestamptz NOT NULL DEFAULT now(),
  updated_at     timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.businesses ENABLE ROW LEVEL SECURITY;

CREATE POLICY "businesses_workspace" ON public.businesses
  USING (workspace_id = public.get_user_workspace_id());

CREATE TRIGGER businesses_updated_at
  BEFORE UPDATE ON public.businesses
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- =====================================================
-- 5. PROJECTS
-- =====================================================
CREATE TABLE IF NOT EXISTS public.projects (
  id                              text PRIMARY KEY,
  workspace_id                    text NOT NULL,
  business_id                     text NOT NULL,
  name                            text NOT NULL,
  description                     text NOT NULL DEFAULT '',
  total_value                     numeric NOT NULL DEFAULT 0,
  status                          text NOT NULL DEFAULT 'active',
  start_date                      text NOT NULL DEFAULT '',
  end_date                        text,
  client_id                       text,
  is_multi_phase                  boolean DEFAULT false,
  client_payments                 numeric NOT NULL DEFAULT 0,
  allocations                     jsonb NOT NULL DEFAULT '[]',
  team_allocations                jsonb NOT NULL DEFAULT '[]',
  partner_allocations             jsonb NOT NULL DEFAULT '[]',
  company_allocation              jsonb,
  allocation_team_allocations     jsonb NOT NULL DEFAULT '[]',
  allocation_partner_allocations  jsonb NOT NULL DEFAULT '[]',
  allocation_company_allocations  jsonb NOT NULL DEFAULT '[]',
  expenses                        jsonb NOT NULL DEFAULT '[]',
  created_at                      timestamptz NOT NULL DEFAULT now(),
  updated_at                      timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;

CREATE POLICY "projects_workspace" ON public.projects
  USING (workspace_id = public.get_user_workspace_id());

CREATE TRIGGER projects_updated_at
  BEFORE UPDATE ON public.projects
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- =====================================================
-- 6. CLIENTS
-- =====================================================
CREATE TABLE IF NOT EXISTS public.clients (
  id           text PRIMARY KEY,
  workspace_id text NOT NULL,
  name         text NOT NULL,
  email        text NOT NULL DEFAULT '',
  company      text NOT NULL DEFAULT '',
  projects     text[] NOT NULL DEFAULT '{}',
  total_value  numeric NOT NULL DEFAULT 0,
  created_at   timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.clients ENABLE ROW LEVEL SECURITY;

CREATE POLICY "clients_workspace" ON public.clients
  USING (workspace_id = public.get_user_workspace_id());

-- =====================================================
-- 7. TEAM_MEMBERS
-- =====================================================
CREATE TABLE IF NOT EXISTS public.team_members (
  id              text PRIMARY KEY,
  workspace_id    text NOT NULL,
  name            text NOT NULL,
  email           text NOT NULL DEFAULT '',
  role            text NOT NULL DEFAULT '',
  member_type     text NOT NULL DEFAULT 'employee',
  business_ids    text[] NOT NULL DEFAULT '{}',
  payment_history jsonb NOT NULL DEFAULT '[]',
  created_at      timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.team_members ENABLE ROW LEVEL SECURITY;

CREATE POLICY "team_members_workspace" ON public.team_members
  USING (workspace_id = public.get_user_workspace_id());

-- =====================================================
-- 8. PARTNERS
-- =====================================================
CREATE TABLE IF NOT EXISTS public.partners (
  id              text PRIMARY KEY,
  workspace_id    text NOT NULL,
  name            text NOT NULL,
  email           text NOT NULL DEFAULT '',
  type            text NOT NULL DEFAULT 'sales',
  business_ids    text[] NOT NULL DEFAULT '{}',
  payment_history jsonb NOT NULL DEFAULT '[]',
  created_at      timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.partners ENABLE ROW LEVEL SECURITY;

CREATE POLICY "partners_workspace" ON public.partners
  USING (workspace_id = public.get_user_workspace_id());

-- =====================================================
-- 9. PAYMENTS
-- =====================================================
CREATE TABLE IF NOT EXISTS public.payments (
  id               text PRIMARY KEY,
  workspace_id     text NOT NULL,
  amount           numeric NOT NULL DEFAULT 0,
  date             text NOT NULL DEFAULT '',
  project_id       text,
  allocation_id    text,
  member_id        text,
  partner_id       text,
  client_id        text,
  retainer_id      text,
  expense_id       text,
  type             text NOT NULL DEFAULT 'incoming',
  recipient_type   text,
  status           text NOT NULL DEFAULT 'pending',
  method           text,
  description      text,
  payment_source   text,
  task_description text,
  task_type        text,
  task_id          text,
  created_at       timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "payments_workspace" ON public.payments
  USING (workspace_id = public.get_user_workspace_id());

-- =====================================================
-- 10. EXPENSES
-- =====================================================
CREATE TABLE IF NOT EXISTS public.expenses (
  id                  text PRIMARY KEY,
  workspace_id        text NOT NULL,
  business_id         text NOT NULL,
  project_id          text,
  retainer_id         text,
  allocation_id       text,
  member_id           text,
  partner_id          text,
  task_id             text,
  name                text NOT NULL,
  category            text NOT NULL DEFAULT 'other',
  amount              numeric NOT NULL DEFAULT 0,
  date                text NOT NULL DEFAULT '',
  description         text,
  status              text NOT NULL DEFAULT 'pending',
  receipt             text,
  is_recurring        boolean DEFAULT false,
  recurring_frequency text,
  recurring_end_date  text,
  parent_expense_id   text,
  created_at          timestamptz NOT NULL DEFAULT now(),
  updated_at          timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.expenses ENABLE ROW LEVEL SECURITY;

CREATE POLICY "expenses_workspace" ON public.expenses
  USING (workspace_id = public.get_user_workspace_id());

CREATE TRIGGER expenses_updated_at
  BEFORE UPDATE ON public.expenses
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- =====================================================
-- 11. BANK_ACCOUNTS
-- =====================================================
CREATE TABLE IF NOT EXISTS public.bank_accounts (
  id             text PRIMARY KEY,
  workspace_id   text NOT NULL,
  business_id    text NOT NULL,
  name           text NOT NULL,
  type           text NOT NULL DEFAULT 'bank',
  balance        numeric NOT NULL DEFAULT 0,
  currency       text NOT NULL DEFAULT 'USD',
  account_number text,
  description    text,
  is_default     boolean NOT NULL DEFAULT false,
  created_at     timestamptz NOT NULL DEFAULT now(),
  updated_at     timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.bank_accounts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "bank_accounts_workspace" ON public.bank_accounts
  USING (workspace_id = public.get_user_workspace_id());

CREATE TRIGGER bank_accounts_updated_at
  BEFORE UPDATE ON public.bank_accounts
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- =====================================================
-- 12. SALARY_RECORDS
-- =====================================================
CREATE TABLE IF NOT EXISTS public.salary_records (
  id                text PRIMARY KEY,
  workspace_id      text NOT NULL,
  business_id       text NOT NULL,
  team_member_id    text NOT NULL,
  position          text NOT NULL DEFAULT '',
  amount            numeric NOT NULL DEFAULT 0,
  currency          text NOT NULL DEFAULT 'USD',
  frequency         text NOT NULL DEFAULT 'monthly',
  start_date        text NOT NULL DEFAULT '',
  end_date          text,
  description       text,
  project_id        text,
  client_id         text,
  is_project_based  boolean DEFAULT false,
  salary_type       text NOT NULL DEFAULT 'primary',
  contract_duration integer,
  created_at        timestamptz NOT NULL DEFAULT now(),
  updated_at        timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.salary_records ENABLE ROW LEVEL SECURITY;

CREATE POLICY "salary_records_workspace" ON public.salary_records
  USING (workspace_id = public.get_user_workspace_id());

CREATE TRIGGER salary_records_updated_at
  BEFORE UPDATE ON public.salary_records
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- =====================================================
-- 13. SALARY_PAYMENTS
-- =====================================================
CREATE TABLE IF NOT EXISTS public.salary_payments (
  id               text PRIMARY KEY,
  workspace_id     text NOT NULL,
  salary_record_id text NOT NULL,
  amount           numeric NOT NULL DEFAULT 0,
  payment_date     text NOT NULL DEFAULT '',
  period           text NOT NULL DEFAULT '',
  method           text,
  description      text,
  status           text NOT NULL DEFAULT 'pending',
  created_at       timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.salary_payments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "salary_payments_workspace" ON public.salary_payments
  USING (workspace_id = public.get_user_workspace_id());

-- =====================================================
-- 14. PAYROLL_PERIODS
-- =====================================================
CREATE TABLE IF NOT EXISTS public.payroll_periods (
  id                 text PRIMARY KEY,
  workspace_id       text NOT NULL,
  business_id        text NOT NULL,
  year               integer NOT NULL,
  month              integer NOT NULL,
  status             text NOT NULL DEFAULT 'open',
  total_employees    integer NOT NULL DEFAULT 0,
  total_amount       numeric NOT NULL DEFAULT 0,
  paid_employees     integer NOT NULL DEFAULT 0,
  pending_employees  integer NOT NULL DEFAULT 0,
  overdue_employees  integer NOT NULL DEFAULT 0,
  created_at         timestamptz NOT NULL DEFAULT now(),
  updated_at         timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.payroll_periods ENABLE ROW LEVEL SECURITY;

CREATE POLICY "payroll_periods_workspace" ON public.payroll_periods
  USING (workspace_id = public.get_user_workspace_id());

CREATE TRIGGER payroll_periods_updated_at
  BEFORE UPDATE ON public.payroll_periods
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- =====================================================
-- 15. PAYSLIPS
-- =====================================================
CREATE TABLE IF NOT EXISTS public.payslips (
  id                text PRIMARY KEY,
  workspace_id      text NOT NULL,
  business_id       text NOT NULL,
  team_member_id    text NOT NULL,
  salary_record_id  text NOT NULL,
  payroll_period_id text NOT NULL,
  gross_salary      numeric NOT NULL DEFAULT 0,
  deductions        jsonb NOT NULL DEFAULT '[]',
  bonuses           jsonb NOT NULL DEFAULT '[]',
  net_salary        numeric NOT NULL DEFAULT 0,
  currency          text NOT NULL DEFAULT 'USD',
  generated_at      timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.payslips ENABLE ROW LEVEL SECURITY;

CREATE POLICY "payslips_workspace" ON public.payslips
  USING (workspace_id = public.get_user_workspace_id());

-- =====================================================
-- 16. EXTRA_PAYMENTS
-- =====================================================
CREATE TABLE IF NOT EXISTS public.extra_payments (
  id              text PRIMARY KEY,
  workspace_id    text NOT NULL,
  business_id     text NOT NULL,
  team_member_id  text NOT NULL,
  amount          numeric NOT NULL DEFAULT 0,
  currency        text NOT NULL DEFAULT 'USD',
  period          text NOT NULL DEFAULT '',
  payment_date    text NOT NULL DEFAULT '',
  type            text NOT NULL DEFAULT 'bonus',
  name            text NOT NULL DEFAULT '',
  description     text,
  status          text NOT NULL DEFAULT 'pending',
  created_at      timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.extra_payments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "extra_payments_workspace" ON public.extra_payments
  USING (workspace_id = public.get_user_workspace_id());

-- =====================================================
-- 17. QUICK_TASKS
-- =====================================================
CREATE TABLE IF NOT EXISTS public.quick_tasks (
  id            text PRIMARY KEY,
  workspace_id  text NOT NULL,
  business_id   text NOT NULL,
  title         text NOT NULL,
  amount        numeric NOT NULL DEFAULT 0,
  currency_code text NOT NULL DEFAULT 'USD',
  assigned_to_id text NOT NULL DEFAULT '',
  due_date      text,
  status        text NOT NULL DEFAULT 'pending',
  task_type     text,
  description   text,
  paid_at       text,
  created_at    timestamptz NOT NULL DEFAULT now(),
  updated_at    timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.quick_tasks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "quick_tasks_workspace" ON public.quick_tasks
  USING (workspace_id = public.get_user_workspace_id());

CREATE TRIGGER quick_tasks_updated_at
  BEFORE UPDATE ON public.quick_tasks
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- =====================================================
-- 18. RETAINERS
-- =====================================================
CREATE TABLE IF NOT EXISTS public.retainers (
  id               text PRIMARY KEY,
  workspace_id     text NOT NULL,
  business_id      text NOT NULL,
  client_id        text NOT NULL,
  name             text NOT NULL,
  amount           numeric NOT NULL DEFAULT 0,
  currency         text NOT NULL DEFAULT 'USD',
  frequency        text NOT NULL DEFAULT 'monthly',
  start_date       text NOT NULL DEFAULT '',
  end_date         text,
  status           text NOT NULL DEFAULT 'active',
  service_type_id  text,
  description      text,
  next_billing_date text NOT NULL DEFAULT '',
  total_received   numeric NOT NULL DEFAULT 0,
  created_at       timestamptz NOT NULL DEFAULT now(),
  updated_at       timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.retainers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "retainers_workspace" ON public.retainers
  USING (workspace_id = public.get_user_workspace_id());

CREATE TRIGGER retainers_updated_at
  BEFORE UPDATE ON public.retainers
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- =====================================================
-- 19. RENEWALS
-- =====================================================
CREATE TABLE IF NOT EXISTS public.renewals (
  id                  text PRIMARY KEY,
  workspace_id        text NOT NULL,
  business_id         text NOT NULL,
  client_id           text NOT NULL,
  retainer_id         text,
  name                text NOT NULL,
  service_type_id     text,
  amount              numeric NOT NULL DEFAULT 0,
  currency            text NOT NULL DEFAULT 'USD',
  frequency           text NOT NULL DEFAULT 'yearly',
  next_renewal_date   text NOT NULL DEFAULT '',
  description         text,
  last_paid_date      text,
  total_paid          numeric DEFAULT 0,
  created_at          timestamptz NOT NULL DEFAULT now(),
  updated_at          timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.renewals ENABLE ROW LEVEL SECURITY;

CREATE POLICY "renewals_workspace" ON public.renewals
  USING (workspace_id = public.get_user_workspace_id());

CREATE TRIGGER renewals_updated_at
  BEFORE UPDATE ON public.renewals
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- =====================================================
-- 20. RENEWAL_PAYMENTS
-- =====================================================
CREATE TABLE IF NOT EXISTS public.renewal_payments (
  id                  text PRIMARY KEY,
  workspace_id        text NOT NULL,
  renewal_id          text NOT NULL,
  amount              numeric NOT NULL DEFAULT 0,
  currency            text NOT NULL DEFAULT 'USD',
  date                text NOT NULL DEFAULT '',
  invoice_url         text,
  invoice_file_name   text,
  notes               text,
  status              text NOT NULL DEFAULT 'pending',
  created_at          timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.renewal_payments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "renewal_payments_workspace" ON public.renewal_payments
  USING (workspace_id = public.get_user_workspace_id());

-- =====================================================
-- 21. PAYABLES
-- =====================================================
CREATE TABLE IF NOT EXISTS public.payables (
  id          text PRIMARY KEY,
  workspace_id text NOT NULL,
  business_id text NOT NULL,
  account_id  text,
  vendor_name text NOT NULL,
  amount      numeric NOT NULL DEFAULT 0,
  paid_amount numeric NOT NULL DEFAULT 0,
  currency    text NOT NULL DEFAULT 'USD',
  due_date    text NOT NULL DEFAULT '',
  status      text NOT NULL DEFAULT 'pending',
  category    text,
  description text,
  invoice_ref text,
  created_at  timestamptz NOT NULL DEFAULT now(),
  updated_at  timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.payables ENABLE ROW LEVEL SECURITY;

CREATE POLICY "payables_workspace" ON public.payables
  USING (workspace_id = public.get_user_workspace_id());

CREATE TRIGGER payables_updated_at
  BEFORE UPDATE ON public.payables
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- =====================================================
-- 22. RECEIVABLES
-- =====================================================
CREATE TABLE IF NOT EXISTS public.receivables (
  id               text PRIMARY KEY,
  workspace_id     text NOT NULL,
  business_id      text NOT NULL,
  account_id       text,
  client_id        text,
  project_id       text,
  retainer_id      text,
  source_name      text NOT NULL,
  amount           numeric NOT NULL DEFAULT 0,
  received_amount  numeric NOT NULL DEFAULT 0,
  currency         text NOT NULL DEFAULT 'USD',
  due_date         text NOT NULL DEFAULT '',
  status           text NOT NULL DEFAULT 'pending',
  description      text,
  invoice_ref      text,
  payment_records  jsonb NOT NULL DEFAULT '[]',
  is_project_synced boolean DEFAULT false,
  created_at       timestamptz NOT NULL DEFAULT now(),
  updated_at       timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.receivables ENABLE ROW LEVEL SECURITY;

CREATE POLICY "receivables_workspace" ON public.receivables
  USING (workspace_id = public.get_user_workspace_id());

CREATE TRIGGER receivables_updated_at
  BEFORE UPDATE ON public.receivables
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- =====================================================
-- 23. TODOS
-- =====================================================
CREATE TABLE IF NOT EXISTS public.todos (
  id                   text PRIMARY KEY,
  workspace_id         text NOT NULL,
  business_id          text,
  title                text NOT NULL,
  description          text,
  due_date             text NOT NULL DEFAULT '',
  original_due_date    text,
  is_recurring         boolean DEFAULT false,
  recurring_pattern    text,
  recurring_end_date   text,
  parent_recurring_id  text,
  last_generated_date  text,
  status               text NOT NULL DEFAULT 'pending',
  completed_at         text,
  completed_by         text,
  completed_by_name    text,
  priority             text NOT NULL DEFAULT 'medium',
  assignees            jsonb NOT NULL DEFAULT '[]',
  assignee_type        text,
  assignee_id          text,
  assignee_name        text,
  created_by           text NOT NULL DEFAULT '',
  created_by_name      text,
  link_type            text NOT NULL DEFAULT 'general',
  linked_entity_id     text,
  linked_entity_name   text,
  tags                 text[],
  notes                text,
  created_at           timestamptz NOT NULL DEFAULT now(),
  updated_at           timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.todos ENABLE ROW LEVEL SECURITY;

CREATE POLICY "todos_workspace" ON public.todos
  USING (workspace_id = public.get_user_workspace_id());

CREATE TRIGGER todos_updated_at
  BEFORE UPDATE ON public.todos
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- =====================================================
-- 24. SERVICE_TYPES
-- =====================================================
CREATE TABLE IF NOT EXISTS public.service_types (
  id           text PRIMARY KEY,
  workspace_id text NOT NULL,
  name         text NOT NULL,
  icon         text,
  created_at   timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.service_types ENABLE ROW LEVEL SECURITY;

CREATE POLICY "service_types_workspace" ON public.service_types
  USING (workspace_id = public.get_user_workspace_id());

-- =====================================================
-- 25. EXCHANGE_RATES
-- =====================================================
CREATE TABLE IF NOT EXISTS public.exchange_rates (
  id            text PRIMARY KEY,
  workspace_id  text NOT NULL,
  from_currency text NOT NULL,
  to_currency   text NOT NULL,
  rate          numeric NOT NULL DEFAULT 1,
  created_at    timestamptz NOT NULL DEFAULT now(),
  updated_at    timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.exchange_rates ENABLE ROW LEVEL SECURITY;

CREATE POLICY "exchange_rates_workspace" ON public.exchange_rates
  USING (workspace_id = public.get_user_workspace_id());

CREATE TRIGGER exchange_rates_updated_at
  BEFORE UPDATE ON public.exchange_rates
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- =====================================================
-- 26. CUSTOM_CURRENCIES
-- =====================================================
CREATE TABLE IF NOT EXISTS public.custom_currencies (
  id           text PRIMARY KEY,
  workspace_id text NOT NULL,
  code         text NOT NULL,
  symbol       text NOT NULL,
  name         text NOT NULL,
  is_custom    boolean NOT NULL DEFAULT true,
  created_at   timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.custom_currencies ENABLE ROW LEVEL SECURITY;

CREATE POLICY "custom_currencies_workspace" ON public.custom_currencies
  USING (workspace_id = public.get_user_workspace_id());

-- =====================================================
-- 27. PRODUCTS
-- =====================================================
CREATE TABLE IF NOT EXISTS public.products (
  id            text PRIMARY KEY,
  workspace_id  text NOT NULL,
  business_id   text NOT NULL,
  name          text NOT NULL,
  sku           text NOT NULL DEFAULT '',
  description   text,
  category      text,
  unit_price    numeric NOT NULL DEFAULT 0,
  cost_price    numeric NOT NULL DEFAULT 0,
  currency      text NOT NULL DEFAULT 'USD',
  unit          text NOT NULL DEFAULT 'pcs',
  current_stock numeric NOT NULL DEFAULT 0,
  minimum_stock numeric NOT NULL DEFAULT 0,
  status        text NOT NULL DEFAULT 'active',
  image_url     text,
  created_at    timestamptz NOT NULL DEFAULT now(),
  updated_at    timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;

CREATE POLICY "products_workspace" ON public.products
  USING (workspace_id = public.get_user_workspace_id());

CREATE TRIGGER products_updated_at
  BEFORE UPDATE ON public.products
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- =====================================================
-- 28. CUSTOMERS
-- =====================================================
CREATE TABLE IF NOT EXISTS public.customers (
  id                 text PRIMARY KEY,
  workspace_id       text NOT NULL,
  business_id        text NOT NULL,
  name               text NOT NULL,
  email              text,
  phone              text,
  company            text,
  type               text NOT NULL DEFAULT 'retail',
  address            text,
  total_purchases    numeric NOT NULL DEFAULT 0,
  outstanding_balance numeric NOT NULL DEFAULT 0,
  created_at         timestamptz NOT NULL DEFAULT now(),
  updated_at         timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.customers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "customers_workspace" ON public.customers
  USING (workspace_id = public.get_user_workspace_id());

CREATE TRIGGER customers_updated_at
  BEFORE UPDATE ON public.customers
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- =====================================================
-- 29. SALES_ORDERS
-- =====================================================
CREATE TABLE IF NOT EXISTS public.sales_orders (
  id             text PRIMARY KEY,
  workspace_id   text NOT NULL,
  business_id    text NOT NULL,
  customer_id    text NOT NULL,
  order_number   text NOT NULL DEFAULT '',
  items          jsonb NOT NULL DEFAULT '[]',
  subtotal       numeric NOT NULL DEFAULT 0,
  discount       numeric NOT NULL DEFAULT 0,
  tax            numeric NOT NULL DEFAULT 0,
  total          numeric NOT NULL DEFAULT 0,
  currency       text NOT NULL DEFAULT 'USD',
  status         text NOT NULL DEFAULT 'draft',
  payment_status text NOT NULL DEFAULT 'pending',
  paid_amount    numeric NOT NULL DEFAULT 0,
  order_date     text NOT NULL DEFAULT '',
  delivery_date  text,
  notes          text,
  created_at     timestamptz NOT NULL DEFAULT now(),
  updated_at     timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.sales_orders ENABLE ROW LEVEL SECURITY;

CREATE POLICY "sales_orders_workspace" ON public.sales_orders
  USING (workspace_id = public.get_user_workspace_id());

CREATE TRIGGER sales_orders_updated_at
  BEFORE UPDATE ON public.sales_orders
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- =====================================================
-- 30. PRODUCTION_BATCHES
-- =====================================================
CREATE TABLE IF NOT EXISTS public.production_batches (
  id              text PRIMARY KEY,
  workspace_id    text NOT NULL,
  business_id     text NOT NULL,
  product_id      text NOT NULL,
  batch_number    text NOT NULL DEFAULT '',
  quantity        numeric NOT NULL DEFAULT 0,
  status          text NOT NULL DEFAULT 'planned',
  start_date      text NOT NULL DEFAULT '',
  completion_date text,
  production_cost numeric NOT NULL DEFAULT 0,
  notes           text,
  created_at      timestamptz NOT NULL DEFAULT now(),
  updated_at      timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.production_batches ENABLE ROW LEVEL SECURITY;

CREATE POLICY "production_batches_workspace" ON public.production_batches
  USING (workspace_id = public.get_user_workspace_id());

CREATE TRIGGER production_batches_updated_at
  BEFORE UPDATE ON public.production_batches
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- =====================================================
-- 31. PURCHASE_ORDERS
-- =====================================================
CREATE TABLE IF NOT EXISTS public.purchase_orders (
  id            text PRIMARY KEY,
  workspace_id  text NOT NULL,
  business_id   text NOT NULL,
  supplier_name text NOT NULL,
  order_number  text NOT NULL DEFAULT '',
  items         jsonb NOT NULL DEFAULT '[]',
  total         numeric NOT NULL DEFAULT 0,
  currency      text NOT NULL DEFAULT 'USD',
  status        text NOT NULL DEFAULT 'draft',
  order_date    text NOT NULL DEFAULT '',
  expected_date text,
  received_date text,
  notes         text,
  created_at    timestamptz NOT NULL DEFAULT now(),
  updated_at    timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.purchase_orders ENABLE ROW LEVEL SECURITY;

CREATE POLICY "purchase_orders_workspace" ON public.purchase_orders
  USING (workspace_id = public.get_user_workspace_id());

CREATE TRIGGER purchase_orders_updated_at
  BEFORE UPDATE ON public.purchase_orders
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Indexes for common lookups
CREATE INDEX IF NOT EXISTS idx_businesses_workspace ON public.businesses(workspace_id);
CREATE INDEX IF NOT EXISTS idx_projects_workspace ON public.projects(workspace_id);
CREATE INDEX IF NOT EXISTS idx_projects_business ON public.projects(business_id);
CREATE INDEX IF NOT EXISTS idx_payments_workspace ON public.payments(workspace_id);
CREATE INDEX IF NOT EXISTS idx_expenses_workspace ON public.expenses(workspace_id);
CREATE INDEX IF NOT EXISTS idx_todos_workspace ON public.todos(workspace_id);
CREATE INDEX IF NOT EXISTS idx_workspace_users_workspace ON public.workspace_users(workspace_id);
CREATE INDEX IF NOT EXISTS idx_workspace_users_user ON public.workspace_users(user_id);
