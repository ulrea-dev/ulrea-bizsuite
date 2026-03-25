export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.4"
  }
  public: {
    Tables: {
      bank_accounts: {
        Row: {
          account_number: string | null
          balance: number
          business_id: string
          created_at: string
          currency: string
          description: string | null
          id: string
          is_default: boolean
          name: string
          type: string
          updated_at: string
          workspace_id: string
        }
        Insert: {
          account_number?: string | null
          balance?: number
          business_id: string
          created_at?: string
          currency?: string
          description?: string | null
          id: string
          is_default?: boolean
          name: string
          type?: string
          updated_at?: string
          workspace_id: string
        }
        Update: {
          account_number?: string | null
          balance?: number
          business_id?: string
          created_at?: string
          currency?: string
          description?: string | null
          id?: string
          is_default?: boolean
          name?: string
          type?: string
          updated_at?: string
          workspace_id?: string
        }
        Relationships: []
      }
      businesses: {
        Row: {
          business_model: string
          created_at: string
          currency: Json
          current_balance: number
          id: string
          minimum_balance: number
          name: string
          type: string
          updated_at: string
          workspace_id: string
        }
        Insert: {
          business_model?: string
          created_at?: string
          currency?: Json
          current_balance?: number
          id: string
          minimum_balance?: number
          name: string
          type?: string
          updated_at?: string
          workspace_id: string
        }
        Update: {
          business_model?: string
          created_at?: string
          currency?: Json
          current_balance?: number
          id?: string
          minimum_balance?: number
          name?: string
          type?: string
          updated_at?: string
          workspace_id?: string
        }
        Relationships: []
      }
      clients: {
        Row: {
          company: string
          created_at: string
          email: string
          id: string
          name: string
          projects: string[]
          total_value: number
          workspace_id: string
        }
        Insert: {
          company?: string
          created_at?: string
          email?: string
          id: string
          name: string
          projects?: string[]
          total_value?: number
          workspace_id: string
        }
        Update: {
          company?: string
          created_at?: string
          email?: string
          id?: string
          name?: string
          projects?: string[]
          total_value?: number
          workspace_id?: string
        }
        Relationships: []
      }
      custom_currencies: {
        Row: {
          code: string
          created_at: string
          id: string
          is_custom: boolean
          name: string
          symbol: string
          workspace_id: string
        }
        Insert: {
          code: string
          created_at?: string
          id: string
          is_custom?: boolean
          name: string
          symbol: string
          workspace_id: string
        }
        Update: {
          code?: string
          created_at?: string
          id?: string
          is_custom?: boolean
          name?: string
          symbol?: string
          workspace_id?: string
        }
        Relationships: []
      }
      customers: {
        Row: {
          address: string | null
          business_id: string
          company: string | null
          created_at: string
          email: string | null
          id: string
          name: string
          outstanding_balance: number
          phone: string | null
          total_purchases: number
          type: string
          updated_at: string
          workspace_id: string
        }
        Insert: {
          address?: string | null
          business_id: string
          company?: string | null
          created_at?: string
          email?: string | null
          id: string
          name: string
          outstanding_balance?: number
          phone?: string | null
          total_purchases?: number
          type?: string
          updated_at?: string
          workspace_id: string
        }
        Update: {
          address?: string | null
          business_id?: string
          company?: string | null
          created_at?: string
          email?: string | null
          id?: string
          name?: string
          outstanding_balance?: number
          phone?: string | null
          total_purchases?: number
          type?: string
          updated_at?: string
          workspace_id?: string
        }
        Relationships: []
      }
      exchange_rates: {
        Row: {
          created_at: string
          from_currency: string
          id: string
          rate: number
          to_currency: string
          updated_at: string
          workspace_id: string
        }
        Insert: {
          created_at?: string
          from_currency: string
          id: string
          rate?: number
          to_currency: string
          updated_at?: string
          workspace_id: string
        }
        Update: {
          created_at?: string
          from_currency?: string
          id?: string
          rate?: number
          to_currency?: string
          updated_at?: string
          workspace_id?: string
        }
        Relationships: []
      }
      expenses: {
        Row: {
          allocation_id: string | null
          amount: number
          business_id: string
          category: string
          created_at: string
          date: string
          description: string | null
          id: string
          is_recurring: boolean | null
          member_id: string | null
          name: string
          parent_expense_id: string | null
          partner_id: string | null
          project_id: string | null
          receipt: string | null
          recurring_end_date: string | null
          recurring_frequency: string | null
          retainer_id: string | null
          status: string
          task_id: string | null
          updated_at: string
          workspace_id: string
        }
        Insert: {
          allocation_id?: string | null
          amount?: number
          business_id: string
          category?: string
          created_at?: string
          date?: string
          description?: string | null
          id: string
          is_recurring?: boolean | null
          member_id?: string | null
          name: string
          parent_expense_id?: string | null
          partner_id?: string | null
          project_id?: string | null
          receipt?: string | null
          recurring_end_date?: string | null
          recurring_frequency?: string | null
          retainer_id?: string | null
          status?: string
          task_id?: string | null
          updated_at?: string
          workspace_id: string
        }
        Update: {
          allocation_id?: string | null
          amount?: number
          business_id?: string
          category?: string
          created_at?: string
          date?: string
          description?: string | null
          id?: string
          is_recurring?: boolean | null
          member_id?: string | null
          name?: string
          parent_expense_id?: string | null
          partner_id?: string | null
          project_id?: string | null
          receipt?: string | null
          recurring_end_date?: string | null
          recurring_frequency?: string | null
          retainer_id?: string | null
          status?: string
          task_id?: string | null
          updated_at?: string
          workspace_id?: string
        }
        Relationships: []
      }
      extra_payments: {
        Row: {
          amount: number
          business_id: string
          created_at: string
          currency: string
          description: string | null
          id: string
          name: string
          payment_date: string
          period: string
          status: string
          team_member_id: string
          type: string
          workspace_id: string
        }
        Insert: {
          amount?: number
          business_id: string
          created_at?: string
          currency?: string
          description?: string | null
          id: string
          name?: string
          payment_date?: string
          period?: string
          status?: string
          team_member_id: string
          type?: string
          workspace_id: string
        }
        Update: {
          amount?: number
          business_id?: string
          created_at?: string
          currency?: string
          description?: string | null
          id?: string
          name?: string
          payment_date?: string
          period?: string
          status?: string
          team_member_id?: string
          type?: string
          workspace_id?: string
        }
        Relationships: []
      }
      partners: {
        Row: {
          business_ids: string[]
          created_at: string
          email: string
          id: string
          name: string
          payment_history: Json
          type: string
          workspace_id: string
        }
        Insert: {
          business_ids?: string[]
          created_at?: string
          email?: string
          id: string
          name: string
          payment_history?: Json
          type?: string
          workspace_id: string
        }
        Update: {
          business_ids?: string[]
          created_at?: string
          email?: string
          id?: string
          name?: string
          payment_history?: Json
          type?: string
          workspace_id?: string
        }
        Relationships: []
      }
      payables: {
        Row: {
          account_id: string | null
          amount: number
          business_id: string
          category: string | null
          created_at: string
          currency: string
          description: string | null
          due_date: string
          id: string
          invoice_ref: string | null
          paid_amount: number
          status: string
          updated_at: string
          vendor_name: string
          workspace_id: string
        }
        Insert: {
          account_id?: string | null
          amount?: number
          business_id: string
          category?: string | null
          created_at?: string
          currency?: string
          description?: string | null
          due_date?: string
          id: string
          invoice_ref?: string | null
          paid_amount?: number
          status?: string
          updated_at?: string
          vendor_name: string
          workspace_id: string
        }
        Update: {
          account_id?: string | null
          amount?: number
          business_id?: string
          category?: string | null
          created_at?: string
          currency?: string
          description?: string | null
          due_date?: string
          id?: string
          invoice_ref?: string | null
          paid_amount?: number
          status?: string
          updated_at?: string
          vendor_name?: string
          workspace_id?: string
        }
        Relationships: []
      }
      payments: {
        Row: {
          allocation_id: string | null
          amount: number
          client_id: string | null
          created_at: string
          date: string
          description: string | null
          expense_id: string | null
          id: string
          member_id: string | null
          method: string | null
          partner_id: string | null
          payment_source: string | null
          project_id: string | null
          recipient_type: string | null
          retainer_id: string | null
          status: string
          task_description: string | null
          task_id: string | null
          task_type: string | null
          type: string
          workspace_id: string
        }
        Insert: {
          allocation_id?: string | null
          amount?: number
          client_id?: string | null
          created_at?: string
          date?: string
          description?: string | null
          expense_id?: string | null
          id: string
          member_id?: string | null
          method?: string | null
          partner_id?: string | null
          payment_source?: string | null
          project_id?: string | null
          recipient_type?: string | null
          retainer_id?: string | null
          status?: string
          task_description?: string | null
          task_id?: string | null
          task_type?: string | null
          type?: string
          workspace_id: string
        }
        Update: {
          allocation_id?: string | null
          amount?: number
          client_id?: string | null
          created_at?: string
          date?: string
          description?: string | null
          expense_id?: string | null
          id?: string
          member_id?: string | null
          method?: string | null
          partner_id?: string | null
          payment_source?: string | null
          project_id?: string | null
          recipient_type?: string | null
          retainer_id?: string | null
          status?: string
          task_description?: string | null
          task_id?: string | null
          task_type?: string | null
          type?: string
          workspace_id?: string
        }
        Relationships: []
      }
      payroll_periods: {
        Row: {
          business_id: string
          created_at: string
          id: string
          month: number
          overdue_employees: number
          paid_employees: number
          pending_employees: number
          status: string
          total_amount: number
          total_employees: number
          updated_at: string
          workspace_id: string
          year: number
        }
        Insert: {
          business_id: string
          created_at?: string
          id: string
          month: number
          overdue_employees?: number
          paid_employees?: number
          pending_employees?: number
          status?: string
          total_amount?: number
          total_employees?: number
          updated_at?: string
          workspace_id: string
          year: number
        }
        Update: {
          business_id?: string
          created_at?: string
          id?: string
          month?: number
          overdue_employees?: number
          paid_employees?: number
          pending_employees?: number
          status?: string
          total_amount?: number
          total_employees?: number
          updated_at?: string
          workspace_id?: string
          year?: number
        }
        Relationships: []
      }
      payslips: {
        Row: {
          bonuses: Json
          business_id: string
          currency: string
          deductions: Json
          generated_at: string
          gross_salary: number
          id: string
          net_salary: number
          payroll_period_id: string
          salary_record_id: string
          team_member_id: string
          workspace_id: string
        }
        Insert: {
          bonuses?: Json
          business_id: string
          currency?: string
          deductions?: Json
          generated_at?: string
          gross_salary?: number
          id: string
          net_salary?: number
          payroll_period_id: string
          salary_record_id: string
          team_member_id: string
          workspace_id: string
        }
        Update: {
          bonuses?: Json
          business_id?: string
          currency?: string
          deductions?: Json
          generated_at?: string
          gross_salary?: number
          id?: string
          net_salary?: number
          payroll_period_id?: string
          salary_record_id?: string
          team_member_id?: string
          workspace_id?: string
        }
        Relationships: []
      }
      production_batches: {
        Row: {
          batch_number: string
          business_id: string
          completion_date: string | null
          created_at: string
          id: string
          notes: string | null
          product_id: string
          production_cost: number
          quantity: number
          start_date: string
          status: string
          updated_at: string
          workspace_id: string
        }
        Insert: {
          batch_number?: string
          business_id: string
          completion_date?: string | null
          created_at?: string
          id: string
          notes?: string | null
          product_id: string
          production_cost?: number
          quantity?: number
          start_date?: string
          status?: string
          updated_at?: string
          workspace_id: string
        }
        Update: {
          batch_number?: string
          business_id?: string
          completion_date?: string | null
          created_at?: string
          id?: string
          notes?: string | null
          product_id?: string
          production_cost?: number
          quantity?: number
          start_date?: string
          status?: string
          updated_at?: string
          workspace_id?: string
        }
        Relationships: []
      }
      products: {
        Row: {
          business_id: string
          category: string | null
          cost_price: number
          created_at: string
          currency: string
          current_stock: number
          description: string | null
          id: string
          image_url: string | null
          minimum_stock: number
          name: string
          sku: string
          status: string
          unit: string
          unit_price: number
          updated_at: string
          workspace_id: string
        }
        Insert: {
          business_id: string
          category?: string | null
          cost_price?: number
          created_at?: string
          currency?: string
          current_stock?: number
          description?: string | null
          id: string
          image_url?: string | null
          minimum_stock?: number
          name: string
          sku?: string
          status?: string
          unit?: string
          unit_price?: number
          updated_at?: string
          workspace_id: string
        }
        Update: {
          business_id?: string
          category?: string | null
          cost_price?: number
          created_at?: string
          currency?: string
          current_stock?: number
          description?: string | null
          id?: string
          image_url?: string | null
          minimum_stock?: number
          name?: string
          sku?: string
          status?: string
          unit?: string
          unit_price?: number
          updated_at?: string
          workspace_id?: string
        }
        Relationships: []
      }
      projects: {
        Row: {
          allocation_company_allocations: Json
          allocation_partner_allocations: Json
          allocation_team_allocations: Json
          allocations: Json
          business_id: string
          client_id: string | null
          client_payments: number
          company_allocation: Json | null
          created_at: string
          description: string
          end_date: string | null
          expenses: Json
          id: string
          is_multi_phase: boolean | null
          name: string
          partner_allocations: Json
          start_date: string
          status: string
          team_allocations: Json
          total_value: number
          updated_at: string
          workspace_id: string
        }
        Insert: {
          allocation_company_allocations?: Json
          allocation_partner_allocations?: Json
          allocation_team_allocations?: Json
          allocations?: Json
          business_id: string
          client_id?: string | null
          client_payments?: number
          company_allocation?: Json | null
          created_at?: string
          description?: string
          end_date?: string | null
          expenses?: Json
          id: string
          is_multi_phase?: boolean | null
          name: string
          partner_allocations?: Json
          start_date?: string
          status?: string
          team_allocations?: Json
          total_value?: number
          updated_at?: string
          workspace_id: string
        }
        Update: {
          allocation_company_allocations?: Json
          allocation_partner_allocations?: Json
          allocation_team_allocations?: Json
          allocations?: Json
          business_id?: string
          client_id?: string | null
          client_payments?: number
          company_allocation?: Json | null
          created_at?: string
          description?: string
          end_date?: string | null
          expenses?: Json
          id?: string
          is_multi_phase?: boolean | null
          name?: string
          partner_allocations?: Json
          start_date?: string
          status?: string
          team_allocations?: Json
          total_value?: number
          updated_at?: string
          workspace_id?: string
        }
        Relationships: []
      }
      purchase_orders: {
        Row: {
          business_id: string
          created_at: string
          currency: string
          expected_date: string | null
          id: string
          items: Json
          notes: string | null
          order_date: string
          order_number: string
          received_date: string | null
          status: string
          supplier_name: string
          total: number
          updated_at: string
          workspace_id: string
        }
        Insert: {
          business_id: string
          created_at?: string
          currency?: string
          expected_date?: string | null
          id: string
          items?: Json
          notes?: string | null
          order_date?: string
          order_number?: string
          received_date?: string | null
          status?: string
          supplier_name: string
          total?: number
          updated_at?: string
          workspace_id: string
        }
        Update: {
          business_id?: string
          created_at?: string
          currency?: string
          expected_date?: string | null
          id?: string
          items?: Json
          notes?: string | null
          order_date?: string
          order_number?: string
          received_date?: string | null
          status?: string
          supplier_name?: string
          total?: number
          updated_at?: string
          workspace_id?: string
        }
        Relationships: []
      }
      quick_tasks: {
        Row: {
          amount: number
          assigned_to_id: string
          business_id: string
          created_at: string
          currency_code: string
          description: string | null
          due_date: string | null
          id: string
          paid_at: string | null
          status: string
          task_type: string | null
          title: string
          updated_at: string
          workspace_id: string
        }
        Insert: {
          amount?: number
          assigned_to_id?: string
          business_id: string
          created_at?: string
          currency_code?: string
          description?: string | null
          due_date?: string | null
          id: string
          paid_at?: string | null
          status?: string
          task_type?: string | null
          title: string
          updated_at?: string
          workspace_id: string
        }
        Update: {
          amount?: number
          assigned_to_id?: string
          business_id?: string
          created_at?: string
          currency_code?: string
          description?: string | null
          due_date?: string | null
          id?: string
          paid_at?: string | null
          status?: string
          task_type?: string | null
          title?: string
          updated_at?: string
          workspace_id?: string
        }
        Relationships: []
      }
      receivables: {
        Row: {
          account_id: string | null
          amount: number
          business_id: string
          client_id: string | null
          created_at: string
          currency: string
          description: string | null
          due_date: string
          id: string
          invoice_ref: string | null
          is_project_synced: boolean | null
          payment_records: Json
          project_id: string | null
          received_amount: number
          retainer_id: string | null
          source_name: string
          status: string
          updated_at: string
          workspace_id: string
        }
        Insert: {
          account_id?: string | null
          amount?: number
          business_id: string
          client_id?: string | null
          created_at?: string
          currency?: string
          description?: string | null
          due_date?: string
          id: string
          invoice_ref?: string | null
          is_project_synced?: boolean | null
          payment_records?: Json
          project_id?: string | null
          received_amount?: number
          retainer_id?: string | null
          source_name: string
          status?: string
          updated_at?: string
          workspace_id: string
        }
        Update: {
          account_id?: string | null
          amount?: number
          business_id?: string
          client_id?: string | null
          created_at?: string
          currency?: string
          description?: string | null
          due_date?: string
          id?: string
          invoice_ref?: string | null
          is_project_synced?: boolean | null
          payment_records?: Json
          project_id?: string | null
          received_amount?: number
          retainer_id?: string | null
          source_name?: string
          status?: string
          updated_at?: string
          workspace_id?: string
        }
        Relationships: []
      }
      renewal_payments: {
        Row: {
          amount: number
          created_at: string
          currency: string
          date: string
          id: string
          invoice_file_name: string | null
          invoice_url: string | null
          notes: string | null
          renewal_id: string
          status: string
          workspace_id: string
        }
        Insert: {
          amount?: number
          created_at?: string
          currency?: string
          date?: string
          id: string
          invoice_file_name?: string | null
          invoice_url?: string | null
          notes?: string | null
          renewal_id: string
          status?: string
          workspace_id: string
        }
        Update: {
          amount?: number
          created_at?: string
          currency?: string
          date?: string
          id?: string
          invoice_file_name?: string | null
          invoice_url?: string | null
          notes?: string | null
          renewal_id?: string
          status?: string
          workspace_id?: string
        }
        Relationships: []
      }
      renewals: {
        Row: {
          amount: number
          business_id: string
          client_id: string
          created_at: string
          currency: string
          description: string | null
          frequency: string
          id: string
          last_paid_date: string | null
          name: string
          next_renewal_date: string
          retainer_id: string | null
          service_type_id: string | null
          total_paid: number | null
          updated_at: string
          workspace_id: string
        }
        Insert: {
          amount?: number
          business_id: string
          client_id: string
          created_at?: string
          currency?: string
          description?: string | null
          frequency?: string
          id: string
          last_paid_date?: string | null
          name: string
          next_renewal_date?: string
          retainer_id?: string | null
          service_type_id?: string | null
          total_paid?: number | null
          updated_at?: string
          workspace_id: string
        }
        Update: {
          amount?: number
          business_id?: string
          client_id?: string
          created_at?: string
          currency?: string
          description?: string | null
          frequency?: string
          id?: string
          last_paid_date?: string | null
          name?: string
          next_renewal_date?: string
          retainer_id?: string | null
          service_type_id?: string | null
          total_paid?: number | null
          updated_at?: string
          workspace_id?: string
        }
        Relationships: []
      }
      retainers: {
        Row: {
          amount: number
          business_id: string
          client_id: string
          created_at: string
          currency: string
          description: string | null
          end_date: string | null
          frequency: string
          id: string
          name: string
          next_billing_date: string
          service_type_id: string | null
          start_date: string
          status: string
          total_received: number
          updated_at: string
          workspace_id: string
        }
        Insert: {
          amount?: number
          business_id: string
          client_id: string
          created_at?: string
          currency?: string
          description?: string | null
          end_date?: string | null
          frequency?: string
          id: string
          name: string
          next_billing_date?: string
          service_type_id?: string | null
          start_date?: string
          status?: string
          total_received?: number
          updated_at?: string
          workspace_id: string
        }
        Update: {
          amount?: number
          business_id?: string
          client_id?: string
          created_at?: string
          currency?: string
          description?: string | null
          end_date?: string | null
          frequency?: string
          id?: string
          name?: string
          next_billing_date?: string
          service_type_id?: string | null
          start_date?: string
          status?: string
          total_received?: number
          updated_at?: string
          workspace_id?: string
        }
        Relationships: []
      }
      salary_payments: {
        Row: {
          amount: number
          created_at: string
          description: string | null
          id: string
          method: string | null
          payment_date: string
          period: string
          salary_record_id: string
          status: string
          workspace_id: string
        }
        Insert: {
          amount?: number
          created_at?: string
          description?: string | null
          id: string
          method?: string | null
          payment_date?: string
          period?: string
          salary_record_id: string
          status?: string
          workspace_id: string
        }
        Update: {
          amount?: number
          created_at?: string
          description?: string | null
          id?: string
          method?: string | null
          payment_date?: string
          period?: string
          salary_record_id?: string
          status?: string
          workspace_id?: string
        }
        Relationships: []
      }
      salary_records: {
        Row: {
          amount: number
          business_id: string
          client_id: string | null
          contract_duration: number | null
          created_at: string
          currency: string
          description: string | null
          end_date: string | null
          frequency: string
          id: string
          is_project_based: boolean | null
          position: string
          project_id: string | null
          salary_type: string
          start_date: string
          team_member_id: string
          updated_at: string
          workspace_id: string
        }
        Insert: {
          amount?: number
          business_id: string
          client_id?: string | null
          contract_duration?: number | null
          created_at?: string
          currency?: string
          description?: string | null
          end_date?: string | null
          frequency?: string
          id: string
          is_project_based?: boolean | null
          position?: string
          project_id?: string | null
          salary_type?: string
          start_date?: string
          team_member_id: string
          updated_at?: string
          workspace_id: string
        }
        Update: {
          amount?: number
          business_id?: string
          client_id?: string | null
          contract_duration?: number | null
          created_at?: string
          currency?: string
          description?: string | null
          end_date?: string | null
          frequency?: string
          id?: string
          is_project_based?: boolean | null
          position?: string
          project_id?: string | null
          salary_type?: string
          start_date?: string
          team_member_id?: string
          updated_at?: string
          workspace_id?: string
        }
        Relationships: []
      }
      sales_orders: {
        Row: {
          business_id: string
          created_at: string
          currency: string
          customer_id: string
          delivery_date: string | null
          discount: number
          id: string
          items: Json
          notes: string | null
          order_date: string
          order_number: string
          paid_amount: number
          payment_status: string
          status: string
          subtotal: number
          tax: number
          total: number
          updated_at: string
          workspace_id: string
        }
        Insert: {
          business_id: string
          created_at?: string
          currency?: string
          customer_id: string
          delivery_date?: string | null
          discount?: number
          id: string
          items?: Json
          notes?: string | null
          order_date?: string
          order_number?: string
          paid_amount?: number
          payment_status?: string
          status?: string
          subtotal?: number
          tax?: number
          total?: number
          updated_at?: string
          workspace_id: string
        }
        Update: {
          business_id?: string
          created_at?: string
          currency?: string
          customer_id?: string
          delivery_date?: string | null
          discount?: number
          id?: string
          items?: Json
          notes?: string | null
          order_date?: string
          order_number?: string
          paid_amount?: number
          payment_status?: string
          status?: string
          subtotal?: number
          tax?: number
          total?: number
          updated_at?: string
          workspace_id?: string
        }
        Relationships: []
      }
      service_types: {
        Row: {
          created_at: string
          icon: string | null
          id: string
          name: string
          workspace_id: string
        }
        Insert: {
          created_at?: string
          icon?: string | null
          id: string
          name: string
          workspace_id: string
        }
        Update: {
          created_at?: string
          icon?: string | null
          id?: string
          name?: string
          workspace_id?: string
        }
        Relationships: []
      }
      super_admins: {
        Row: {
          created_at: string | null
          email: string
          id: string
          user_id: string
        }
        Insert: {
          created_at?: string | null
          email: string
          id?: string
          user_id: string
        }
        Update: {
          created_at?: string | null
          email?: string
          id?: string
          user_id?: string
        }
        Relationships: []
      }
      team_members: {
        Row: {
          business_ids: string[]
          created_at: string
          email: string
          id: string
          member_type: string
          name: string
          payment_history: Json
          role: string
          workspace_id: string
        }
        Insert: {
          business_ids?: string[]
          created_at?: string
          email?: string
          id: string
          member_type?: string
          name: string
          payment_history?: Json
          role?: string
          workspace_id: string
        }
        Update: {
          business_ids?: string[]
          created_at?: string
          email?: string
          id?: string
          member_type?: string
          name?: string
          payment_history?: Json
          role?: string
          workspace_id?: string
        }
        Relationships: []
      }
      todos: {
        Row: {
          assignee_id: string | null
          assignee_name: string | null
          assignee_type: string | null
          assignees: Json
          business_id: string | null
          completed_at: string | null
          completed_by: string | null
          completed_by_name: string | null
          created_at: string
          created_by: string
          created_by_name: string | null
          description: string | null
          due_date: string
          id: string
          is_recurring: boolean | null
          last_generated_date: string | null
          link_type: string
          linked_entity_id: string | null
          linked_entity_name: string | null
          notes: string | null
          original_due_date: string | null
          parent_recurring_id: string | null
          priority: string
          recurring_end_date: string | null
          recurring_pattern: string | null
          status: string
          tags: string[] | null
          title: string
          updated_at: string
          workspace_id: string
        }
        Insert: {
          assignee_id?: string | null
          assignee_name?: string | null
          assignee_type?: string | null
          assignees?: Json
          business_id?: string | null
          completed_at?: string | null
          completed_by?: string | null
          completed_by_name?: string | null
          created_at?: string
          created_by?: string
          created_by_name?: string | null
          description?: string | null
          due_date?: string
          id: string
          is_recurring?: boolean | null
          last_generated_date?: string | null
          link_type?: string
          linked_entity_id?: string | null
          linked_entity_name?: string | null
          notes?: string | null
          original_due_date?: string | null
          parent_recurring_id?: string | null
          priority?: string
          recurring_end_date?: string | null
          recurring_pattern?: string | null
          status?: string
          tags?: string[] | null
          title: string
          updated_at?: string
          workspace_id: string
        }
        Update: {
          assignee_id?: string | null
          assignee_name?: string | null
          assignee_type?: string | null
          assignees?: Json
          business_id?: string | null
          completed_at?: string | null
          completed_by?: string | null
          completed_by_name?: string | null
          created_at?: string
          created_by?: string
          created_by_name?: string | null
          description?: string | null
          due_date?: string
          id?: string
          is_recurring?: boolean | null
          last_generated_date?: string | null
          link_type?: string
          linked_entity_id?: string | null
          linked_entity_name?: string | null
          notes?: string | null
          original_due_date?: string | null
          parent_recurring_id?: string | null
          priority?: string
          recurring_end_date?: string | null
          recurring_pattern?: string | null
          status?: string
          tags?: string[] | null
          title?: string
          updated_at?: string
          workspace_id?: string
        }
        Relationships: []
      }
      user_settings: {
        Row: {
          account_name: string
          color_palette: Json | null
          created_at: string
          default_currency: Json | null
          font_family: Json | null
          theme: string
          updated_at: string
          user_id: string
          username: string
        }
        Insert: {
          account_name?: string
          color_palette?: Json | null
          created_at?: string
          default_currency?: Json | null
          font_family?: Json | null
          theme?: string
          updated_at?: string
          user_id: string
          username?: string
        }
        Update: {
          account_name?: string
          color_palette?: Json | null
          created_at?: string
          default_currency?: Json | null
          font_family?: Json | null
          theme?: string
          updated_at?: string
          user_id?: string
          username?: string
        }
        Relationships: []
      }
      workspace_members: {
        Row: {
          id: string
          last_seen_at: string | null
          member_display_name: string | null
          member_email: string | null
          role: string | null
          workspace_folder_id: string
        }
        Insert: {
          id?: string
          last_seen_at?: string | null
          member_display_name?: string | null
          member_email?: string | null
          role?: string | null
          workspace_folder_id: string
        }
        Update: {
          id?: string
          last_seen_at?: string | null
          member_display_name?: string | null
          member_email?: string | null
          role?: string | null
          workspace_folder_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "workspace_members_workspace_folder_id_fkey"
            columns: ["workspace_folder_id"]
            isOneToOne: false
            referencedRelation: "workspace_registry"
            referencedColumns: ["folder_id"]
          },
        ]
      }
      workspace_registry: {
        Row: {
          created_at: string | null
          folder_id: string
          id: string
          last_sync_at: string | null
          owner_display_name: string | null
          owner_email: string | null
          workspace_name: string
        }
        Insert: {
          created_at?: string | null
          folder_id: string
          id?: string
          last_sync_at?: string | null
          owner_display_name?: string | null
          owner_email?: string | null
          workspace_name: string
        }
        Update: {
          created_at?: string | null
          folder_id?: string
          id?: string
          last_sync_at?: string | null
          owner_display_name?: string | null
          owner_email?: string | null
          workspace_name?: string
        }
        Relationships: []
      }
      workspace_users: {
        Row: {
          business_ids: string[]
          created_at: string
          display_name: string | null
          email: string | null
          id: string
          invite_status: string
          role: string
          updated_at: string
          user_id: string
          workspace_id: string
        }
        Insert: {
          business_ids?: string[]
          created_at?: string
          display_name?: string | null
          email?: string | null
          id?: string
          invite_status?: string
          role?: string
          updated_at?: string
          user_id: string
          workspace_id: string
        }
        Update: {
          business_ids?: string[]
          created_at?: string
          display_name?: string | null
          email?: string | null
          id?: string
          invite_status?: string
          role?: string
          updated_at?: string
          user_id?: string
          workspace_id?: string
        }
        Relationships: []
      }
      workspaces: {
        Row: {
          account_name: string
          created_at: string
          id: string
          owner_user_id: string
          updated_at: string
          workspace_name: string | null
        }
        Insert: {
          account_name: string
          created_at?: string
          id: string
          owner_user_id: string
          updated_at?: string
          workspace_name?: string | null
        }
        Update: {
          account_name?: string
          created_at?: string
          id?: string
          owner_user_id?: string
          updated_at?: string
          workspace_name?: string | null
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      get_user_workspace_id: { Args: never; Returns: string }
      is_super_admin: { Args: { _user_id: string }; Returns: boolean }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {},
  },
} as const
