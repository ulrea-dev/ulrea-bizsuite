import { AppData } from '@/types/business';
import { format } from 'date-fns';

const SHEETS_API_BASE = 'https://sheets.googleapis.com/v4/spreadsheets';

interface SheetProperties {
  title: string;
  index: number;
}

interface SpreadsheetResponse {
  spreadsheetId: string;
  spreadsheetUrl: string;
  sheets: { properties: { sheetId: number; title: string } }[];
}

// Modern colorful palette for each sheet
const SHEET_COLORS: Record<string, { header: { red: number; green: number; blue: number }; alt: { red: number; green: number; blue: number } }> = {
  'Dashboard': { header: { red: 0.42, green: 0.27, blue: 0.76 }, alt: { red: 0.95, green: 0.93, blue: 0.98 } },       // Deep Purple
  'Businesses': { header: { red: 0.05, green: 0.58, blue: 0.53 }, alt: { red: 0.91, green: 0.97, blue: 0.96 } },      // Teal
  'Projects': { header: { red: 0.15, green: 0.39, blue: 0.92 }, alt: { red: 0.93, green: 0.95, blue: 0.99 } },        // Blue
  'Quick Tasks': { header: { red: 0.85, green: 0.46, blue: 0.02 }, alt: { red: 0.99, green: 0.96, blue: 0.91 } },     // Amber
  'Retainers': { header: { red: 0.02, green: 0.59, blue: 0.41 }, alt: { red: 0.91, green: 0.98, blue: 0.95 } },       // Emerald
  'Renewals': { header: { red: 0.86, green: 0.15, blue: 0.47 }, alt: { red: 0.99, green: 0.93, blue: 0.96 } },        // Pink
  'Renewal Payments': { header: { red: 0.88, green: 0.11, blue: 0.28 }, alt: { red: 0.99, green: 0.93, blue: 0.94 } }, // Rose
  'Clients': { header: { red: 0.31, green: 0.27, blue: 0.90 }, alt: { red: 0.94, green: 0.94, blue: 0.99 } },         // Indigo
  'Team Members': { header: { red: 0.03, green: 0.57, blue: 0.70 }, alt: { red: 0.91, green: 0.97, blue: 0.98 } },    // Cyan
  'Partners': { header: { red: 0.92, green: 0.35, blue: 0.05 }, alt: { red: 0.99, green: 0.95, blue: 0.92 } },        // Orange
  'Payments': { header: { red: 0.09, green: 0.64, blue: 0.29 }, alt: { red: 0.92, green: 0.98, blue: 0.94 } },        // Green
  'Expenses': { header: { red: 0.86, green: 0.15, blue: 0.15 }, alt: { red: 0.99, green: 0.93, blue: 0.93 } },        // Red
  'Salary Records': { header: { red: 0.49, green: 0.24, blue: 0.93 }, alt: { red: 0.96, green: 0.93, blue: 0.99 } },  // Violet
  'Bank Accounts': { header: { red: 0.28, green: 0.33, blue: 0.41 }, alt: { red: 0.95, green: 0.96, blue: 0.97 } },   // Slate
  'Payables': { header: { red: 0.79, green: 0.54, blue: 0.02 }, alt: { red: 0.99, green: 0.97, blue: 0.91 } },        // Yellow
  'Receivables': { header: { red: 0.40, green: 0.64, blue: 0.05 }, alt: { red: 0.96, green: 0.98, blue: 0.92 } },     // Lime
};

// Column indices that contain amounts (for number formatting)
const AMOUNT_COLUMNS: Record<string, number[]> = {
  'Businesses': [3, 4],           // Current Balance, Minimum Balance
  'Projects': [3, 7],             // Total Value, Client Payments
  'Quick Tasks': [2],             // Amount
  'Retainers': [3, 8],            // Amount, Total Received
  'Renewals': [5, 10],            // Amount, Total Paid
  'Renewal Payments': [2],        // Amount
  'Clients': [3],                 // Total Value
  'Payments': [0],                // Amount
  'Expenses': [3],                // Amount
  'Salary Records': [3],          // Amount
  'Bank Accounts': [3],           // Balance
  'Payables': [2, 3],             // Amount, Paid
  'Receivables': [3, 4],          // Amount, Received
};

class GoogleSheetsService {
  private accessToken: string | null = null;

  setAccessToken(token: string | null) {
    this.accessToken = token;
  }

  private async request<T>(url: string, options: RequestInit = {}): Promise<T> {
    if (!this.accessToken) {
      throw new Error('Not authenticated with Google');
    }

    const response = await fetch(url, {
      ...options,
      headers: {
        Authorization: `Bearer ${this.accessToken}`,
        'Content-Type': 'application/json',
        ...options.headers,
      },
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      throw new Error(error.error?.message || `API request failed: ${response.status}`);
    }

    return response.json();
  }

  async createSpreadsheet(title: string, sheetNames: string[]): Promise<SpreadsheetResponse> {
    const sheets: { properties: SheetProperties }[] = sheetNames.map((name, index) => ({
      properties: { title: name, index },
    }));

    return this.request<SpreadsheetResponse>(SHEETS_API_BASE, {
      method: 'POST',
      body: JSON.stringify({
        properties: { title },
        sheets,
      }),
    });
  }

  async batchUpdate(spreadsheetId: string, requests: any[]): Promise<void> {
    await this.request(`${SHEETS_API_BASE}/${spreadsheetId}:batchUpdate`, {
      method: 'POST',
      body: JSON.stringify({ requests }),
    });
  }

  async setValues(spreadsheetId: string, range: string, values: any[][]): Promise<void> {
    const encodedRange = encodeURIComponent(range);
    await this.request(
      `${SHEETS_API_BASE}/${spreadsheetId}/values/${encodedRange}?valueInputOption=USER_ENTERED`,
      {
        method: 'PUT',
        body: JSON.stringify({ values }),
      }
    );
  }

  private getSheetNames(): string[] {
    return [
      'Dashboard',
      'Businesses',
      'Projects',
      'Quick Tasks',
      'Retainers',
      'Renewals',
      'Renewal Payments',
      'Clients',
      'Team Members',
      'Partners',
      'Payments',
      'Expenses',
      'Salary Records',
      'Bank Accounts',
      'Payables',
      'Receivables',
    ];
  }

  async exportAppData(data: AppData): Promise<{ spreadsheetId: string; spreadsheetUrl: string }> {
    const dateStr = format(new Date(), 'yyyy-MM-dd');
    const title = `BizSuite Export - ${dateStr}`;

    const sheetNames = this.getSheetNames();

    // Create the spreadsheet
    const spreadsheet = await this.createSpreadsheet(title, sheetNames);
    const { spreadsheetId, sheets, spreadsheetUrl } = spreadsheet;

    // Prepare all sheet data
    const sheetData = this.prepareSheetData(data);

    // Write data to each sheet
    for (const [sheetName, rows] of Object.entries(sheetData)) {
      if (rows.length > 0) {
        await this.setValues(spreadsheetId, `'${sheetName}'!A1`, rows);
      }
    }

    // Apply formatting
    const formatRequests = this.getFormatRequests(sheets, sheetData);
    if (formatRequests.length > 0) {
      await this.batchUpdate(spreadsheetId, formatRequests);
    }

    return { spreadsheetId, spreadsheetUrl };
  }

  async getSpreadsheet(spreadsheetId: string): Promise<SpreadsheetResponse> {
    return this.request<SpreadsheetResponse>(`${SHEETS_API_BASE}/${spreadsheetId}`);
  }

  async clearSheet(spreadsheetId: string, sheetName: string): Promise<void> {
    const encodedRange = encodeURIComponent(`'${sheetName}'`);
    await this.request(
      `${SHEETS_API_BASE}/${spreadsheetId}/values/${encodedRange}:clear`,
      { method: 'POST', body: JSON.stringify({}) }
    );
  }

  async updateSpreadsheet(spreadsheetId: string, data: AppData): Promise<void> {
    // Get existing spreadsheet info
    const spreadsheet = await this.getSpreadsheet(spreadsheetId);
    const sheetData = this.prepareSheetData(data);

    // Clear and rewrite each sheet
    for (const sheet of spreadsheet.sheets) {
      const sheetName = sheet.properties.title;
      const rows = sheetData[sheetName];
      
      if (rows && rows.length > 0) {
        // Clear existing data
        await this.clearSheet(spreadsheetId, sheetName);
        // Write new data
        await this.setValues(spreadsheetId, `'${sheetName}'!A1`, rows);
      }
    }

    // Reapply formatting
    const formatRequests = this.getFormatRequests(spreadsheet.sheets, sheetData);
    if (formatRequests.length > 0) {
      await this.batchUpdate(spreadsheetId, formatRequests);
    }
  }

  private prepareSheetData(data: AppData): Record<string, any[][]> {
    const formatDate = (dateStr?: string) => 
      dateStr ? format(new Date(dateStr), 'MMM dd, yyyy') : '';

    // Ensure all arrays exist with defaults
    const safeBusinesses = data.businesses || [];
    const safeProjects = data.projects || [];
    const safeQuickTasks = data.quickTasks || [];
    const safeRetainers = data.retainers || [];
    const safeRenewals = data.renewals || [];
    const safeRenewalPayments = data.renewalPayments || [];
    const safeClients = data.clients || [];
    const safeTeamMembers = data.teamMembers || [];
    const safePartners = data.partners || [];
    const safePayments = data.payments || [];
    const safeExpenses = data.expenses || [];
    const safeSalaryRecords = data.salaryRecords || [];
    const safeBankAccounts = data.bankAccounts || [];
    const safePayables = data.payables || [];
    const safeReceivables = data.receivables || [];

    // Dashboard
    const activeProjects = safeProjects.filter(p => p.status === 'active').length;
    const activeTasks = safeQuickTasks.filter(t => t.status === 'active' || t.status === 'pending').length;
    const activeRetainers = safeRetainers.filter(r => r.status === 'active');
    const totalMRR = activeRetainers.reduce((sum, r) => {
      const multiplier = r.frequency === 'yearly' ? 1/12 : r.frequency === 'quarterly' ? 1/3 : 1;
      return sum + (r.amount * multiplier);
    }, 0);

    const totalRevenue = safePayments
      .filter(p => p.type === 'incoming' && p.status === 'completed')
      .reduce((sum, p) => sum + p.amount, 0);

    const totalExpenses = safeExpenses
      .filter(e => e.status === 'paid')
      .reduce((sum, e) => sum + e.amount, 0);

    const pendingReceivables = safeReceivables
      .filter(r => r.status !== 'paid')
      .reduce((sum, r) => sum + (r.amount - r.receivedAmount), 0);

    const pendingPayables = safePayables
      .filter(p => p.status !== 'paid')
      .reduce((sum, p) => sum + (p.amount - p.paidAmount), 0);

    const totalBankBalance = safeBankAccounts.reduce((sum, a) => sum + a.balance, 0);

    const totalRenewals = safeRenewals.length;
    const upcomingRenewals = safeRenewals.filter(r => {
      const nextDate = new Date(r.nextRenewalDate);
      const thirtyDaysFromNow = new Date();
      thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30);
      return nextDate <= thirtyDaysFromNow;
    }).length;

    const dashboard: any[][] = [
      ['📊 BizSuite Data Export', '', format(new Date(), 'MMMM dd, yyyy')],
      [],
      ['📈 OVERVIEW'],
      ['Metric', 'Value'],
      ['Total Businesses', safeBusinesses.length],
      ['Active Projects', activeProjects],
      ['Active Quick Tasks', activeTasks],
      ['Active Retainers', activeRetainers.length],
      ['Total Renewals', totalRenewals],
      ['Upcoming Renewals (30 days)', upcomingRenewals],
      ['Team Members', safeTeamMembers.length],
      ['Partners', safePartners.length],
      ['Clients', safeClients.length],
      [],
      ['💰 FINANCIAL SUMMARY'],
      ['Metric', 'Value'],
      ['Monthly Recurring Revenue (MRR)', totalMRR],
      ['Total Revenue (Completed)', totalRevenue],
      ['Total Expenses (Paid)', totalExpenses],
      ['Pending Receivables', pendingReceivables],
      ['Pending Payables', pendingPayables],
      ['Total Bank Balance', totalBankBalance],
    ];

    // Businesses
    const businessesSheet: any[][] = [
      ['Name', 'Type', 'Currency', 'Current Balance', 'Minimum Balance', 'Created'],
      ...safeBusinesses.map(b => [
        b.name,
        b.type,
        b.currency?.code || '',
        b.currentBalance,
        b.minimumBalance,
        formatDate(b.createdAt),
      ]),
    ];

    // Projects
    const projectsSheet: any[][] = [
      ['Name', 'Business', 'Client', 'Total Value', 'Status', 'Start Date', 'End Date', 'Client Payments', 'Created'],
      ...safeProjects.map(p => {
        const business = safeBusinesses.find(b => b.id === p.businessId);
        const client = safeClients.find(c => c.id === p.clientId);
        return [
          p.name,
          business?.name || '',
          client?.name || '',
          p.totalValue,
          p.status,
          formatDate(p.startDate),
          formatDate(p.endDate),
          p.clientPayments,
          formatDate(p.createdAt),
        ];
      }),
    ];

    // Quick Tasks
    const quickTasksSheet: any[][] = [
      ['Title', 'Business', 'Amount', 'Currency', 'Assigned To', 'Status', 'Due Date', 'Created', 'Paid At'],
      ...safeQuickTasks.map(t => {
        const business = safeBusinesses.find(b => b.id === t.businessId);
        const assignee = safeTeamMembers.find(m => m.id === t.assignedToId);
        return [
          t.title,
          business?.name || '',
          t.amount,
          t.currencyCode,
          assignee?.name || '',
          t.status,
          formatDate(t.dueDate),
          formatDate(t.createdAt),
          formatDate(t.paidAt),
        ];
      }),
    ];

    // Retainers
    const retainersSheet: any[][] = [
      ['Name', 'Business', 'Client', 'Amount', 'Currency', 'Frequency', 'Status', 'Next Billing', 'Total Received', 'Start Date'],
      ...safeRetainers.map(r => {
        const business = safeBusinesses.find(b => b.id === r.businessId);
        const client = safeClients.find(c => c.id === r.clientId);
        return [
          r.name,
          business?.name || '',
          client?.name || '',
          r.amount,
          r.currency,
          r.frequency,
          r.status,
          formatDate(r.nextBillingDate),
          r.totalReceived,
          formatDate(r.startDate),
        ];
      }),
    ];

    // Renewals (NEW)
    const renewalsSheet: any[][] = [
      ['Name', 'Business', 'Client', 'Linked Retainer', 'Type', 'Amount', 'Currency', 'Frequency', 'Next Renewal', 'Last Paid', 'Total Paid', 'Description'],
      ...safeRenewals.map(r => {
        const business = safeBusinesses.find(b => b.id === r.businessId);
        const client = safeClients.find(c => c.id === r.clientId);
        const retainer = safeRetainers.find(ret => ret.id === r.retainerId);
        return [
          r.name,
          business?.name || '',
          client?.name || '',
          retainer?.name || '',
          r.type,
          r.amount,
          r.currency,
          r.frequency,
          formatDate(r.nextRenewalDate),
          formatDate(r.lastPaidDate),
          r.totalPaid || 0,
          r.description || '',
        ];
      }),
    ];

    // Renewal Payments (NEW)
    const renewalPaymentsSheet: any[][] = [
      ['Renewal Name', 'Client', 'Amount', 'Currency', 'Date', 'Status', 'Invoice', 'Notes'],
      ...safeRenewalPayments.map(p => {
        const renewal = safeRenewals.find(r => r.id === p.renewalId);
        const client = renewal ? safeClients.find(c => c.id === renewal.clientId) : null;
        return [
          renewal?.name || '',
          client?.name || '',
          p.amount,
          p.currency,
          formatDate(p.date),
          p.status,
          p.invoiceFileName || '',
          p.notes || '',
        ];
      }),
    ];

    // Clients
    const clientsSheet: any[][] = [
      ['Name', 'Email', 'Company', 'Total Value', 'Projects', 'Created'],
      ...safeClients.map(c => [
        c.name,
        c.email,
        c.company,
        c.totalValue,
        c.projects?.length || 0,
        formatDate(c.createdAt),
      ]),
    ];

    // Team Members
    const teamMembersSheet: any[][] = [
      ['Name', 'Email', 'Role', 'Type', 'Businesses', 'Created'],
      ...safeTeamMembers.map(m => {
        const businessNames = (m.businessIds || [])
          .map(id => safeBusinesses.find(b => b.id === id)?.name)
          .filter(Boolean)
          .join(', ');
        return [
          m.name,
          m.email,
          m.role,
          m.memberType,
          businessNames,
          formatDate(m.createdAt),
        ];
      }),
    ];

    // Partners
    const partnersSheet: any[][] = [
      ['Name', 'Email', 'Type', 'Created'],
      ...safePartners.map(p => [
        p.name,
        p.email,
        p.type,
        formatDate(p.createdAt),
      ]),
    ];

    // Payments
    const paymentsSheet: any[][] = [
      ['Amount', 'Type', 'Status', 'Date', 'Source', 'Method', 'Description'],
      ...safePayments.map(p => [
        p.amount,
        p.type,
        p.status,
        formatDate(p.date),
        p.paymentSource || '',
        p.method || '',
        p.description || '',
      ]),
    ];

    // Expenses
    const expensesSheet: any[][] = [
      ['Name', 'Business', 'Category', 'Amount', 'Status', 'Date', 'Recurring', 'Description'],
      ...safeExpenses.map(e => {
        const business = safeBusinesses.find(b => b.id === e.businessId);
        return [
          e.name,
          business?.name || '',
          e.category,
          e.amount,
          e.status,
          formatDate(e.date),
          e.isRecurring ? `Yes (${e.recurringFrequency})` : 'No',
          e.description || '',
        ];
      }),
    ];

    // Salary Records
    const salaryRecordsSheet: any[][] = [
      ['Team Member', 'Business', 'Position', 'Amount', 'Currency', 'Frequency', 'Type', 'Start Date', 'End Date'],
      ...safeSalaryRecords.map(s => {
        const member = safeTeamMembers.find(m => m.id === s.teamMemberId);
        const business = safeBusinesses.find(b => b.id === s.businessId);
        return [
          member?.name || '',
          business?.name || '',
          s.position,
          s.amount,
          s.currency,
          s.frequency,
          s.salaryType,
          formatDate(s.startDate),
          formatDate(s.endDate),
        ];
      }),
    ];

    // Bank Accounts
    const bankAccountsSheet: any[][] = [
      ['Name', 'Business', 'Type', 'Balance', 'Currency', 'Account Number', 'Default', 'Description'],
      ...safeBankAccounts.map(a => {
        const business = safeBusinesses.find(b => b.id === a.businessId);
        return [
          a.name,
          business?.name || '',
          a.type,
          a.balance,
          a.currency,
          a.accountNumber || '',
          a.isDefault ? 'Yes' : 'No',
          a.description || '',
        ];
      }),
    ];

    // Payables
    const payablesSheet: any[][] = [
      ['Vendor', 'Business', 'Amount', 'Paid', 'Currency', 'Due Date', 'Status', 'Category', 'Invoice Ref'],
      ...safePayables.map(p => {
        const business = safeBusinesses.find(b => b.id === p.businessId);
        return [
          p.vendorName,
          business?.name || '',
          p.amount,
          p.paidAmount,
          p.currency,
          formatDate(p.dueDate),
          p.status,
          p.category || '',
          p.invoiceRef || '',
        ];
      }),
    ];

    // Receivables
    const receivablesSheet: any[][] = [
      ['Source', 'Business', 'Client', 'Amount', 'Received', 'Currency', 'Due Date', 'Status', 'Invoice Ref'],
      ...safeReceivables.map(r => {
        const business = safeBusinesses.find(b => b.id === r.businessId);
        const client = safeClients.find(c => c.id === r.clientId);
        return [
          r.sourceName,
          business?.name || '',
          client?.name || '',
          r.amount,
          r.receivedAmount,
          r.currency,
          formatDate(r.dueDate),
          r.status,
          r.invoiceRef || '',
        ];
      }),
    ];

    return {
      'Dashboard': dashboard,
      'Businesses': businessesSheet,
      'Projects': projectsSheet,
      'Quick Tasks': quickTasksSheet,
      'Retainers': retainersSheet,
      'Renewals': renewalsSheet,
      'Renewal Payments': renewalPaymentsSheet,
      'Clients': clientsSheet,
      'Team Members': teamMembersSheet,
      'Partners': partnersSheet,
      'Payments': paymentsSheet,
      'Expenses': expensesSheet,
      'Salary Records': salaryRecordsSheet,
      'Bank Accounts': bankAccountsSheet,
      'Payables': payablesSheet,
      'Receivables': receivablesSheet,
    };
  }

  private getFormatRequests(
    sheets: { properties: { sheetId: number; title: string } }[],
    sheetData: Record<string, any[][]>
  ): any[] {
    const requests: any[] = [];

    for (const sheet of sheets) {
      const { sheetId, title } = sheet.properties;
      const data = sheetData[title];
      
      if (!data || data.length === 0) continue;

      const columnCount = Math.max(...data.map(row => row.length));
      const rowCount = data.length;
      const colors = SHEET_COLORS[title] || SHEET_COLORS['Dashboard'];

      if (title === 'Dashboard') {
        // Dashboard title formatting
        requests.push({
          repeatCell: {
            range: { sheetId, startRowIndex: 0, endRowIndex: 1, startColumnIndex: 0, endColumnIndex: 3 },
            cell: {
              userEnteredFormat: {
                textFormat: { bold: true, fontSize: 18, foregroundColor: { red: 1, green: 1, blue: 1 } },
                backgroundColor: colors.header,
                horizontalAlignment: 'LEFT',
              },
            },
            fields: 'userEnteredFormat(textFormat,backgroundColor,horizontalAlignment)',
          },
        });
        
        // Overview section header
        requests.push({
          repeatCell: {
            range: { sheetId, startRowIndex: 2, endRowIndex: 3, startColumnIndex: 0, endColumnIndex: 2 },
            cell: {
              userEnteredFormat: {
                textFormat: { bold: true, fontSize: 12, foregroundColor: { red: 1, green: 1, blue: 1 } },
                backgroundColor: { red: 0.31, green: 0.27, blue: 0.90 },
              },
            },
            fields: 'userEnteredFormat(textFormat,backgroundColor)',
          },
        });
        
        // Financial summary section header
        requests.push({
          repeatCell: {
            range: { sheetId, startRowIndex: 14, endRowIndex: 15, startColumnIndex: 0, endColumnIndex: 2 },
            cell: {
              userEnteredFormat: {
                textFormat: { bold: true, fontSize: 12, foregroundColor: { red: 1, green: 1, blue: 1 } },
                backgroundColor: { red: 0.09, green: 0.64, blue: 0.29 },
              },
            },
            fields: 'userEnteredFormat(textFormat,backgroundColor)',
          },
        });

        // Metric labels bold
        requests.push({
          repeatCell: {
            range: { sheetId, startRowIndex: 3, endRowIndex: 14, startColumnIndex: 0, endColumnIndex: 1 },
            cell: {
              userEnteredFormat: {
                textFormat: { bold: true },
              },
            },
            fields: 'userEnteredFormat.textFormat',
          },
        });
        requests.push({
          repeatCell: {
            range: { sheetId, startRowIndex: 15, endRowIndex: 23, startColumnIndex: 0, endColumnIndex: 1 },
            cell: {
              userEnteredFormat: {
                textFormat: { bold: true },
              },
            },
            fields: 'userEnteredFormat.textFormat',
          },
        });

        // Number formatting for financial values
        requests.push({
          repeatCell: {
            range: { sheetId, startRowIndex: 16, endRowIndex: 23, startColumnIndex: 1, endColumnIndex: 2 },
            cell: {
              userEnteredFormat: {
                numberFormat: { type: 'NUMBER', pattern: '#,##0.00' },
              },
            },
            fields: 'userEnteredFormat.numberFormat',
          },
        });
      } else {
        // Standard table header with vibrant colors
        requests.push({
          repeatCell: {
            range: { sheetId, startRowIndex: 0, endRowIndex: 1, startColumnIndex: 0, endColumnIndex: columnCount },
            cell: {
              userEnteredFormat: {
                textFormat: { bold: true, fontSize: 11, foregroundColor: { red: 1, green: 1, blue: 1 } },
                backgroundColor: colors.header,
                horizontalAlignment: 'CENTER',
                verticalAlignment: 'MIDDLE',
              },
            },
            fields: 'userEnteredFormat(textFormat,backgroundColor,horizontalAlignment,verticalAlignment)',
          },
        });

        // Alternating row colors (zebra striping)
        if (rowCount > 1) {
          requests.push({
            addConditionalFormatRule: {
              rule: {
                ranges: [{ sheetId, startRowIndex: 1, endRowIndex: rowCount, startColumnIndex: 0, endColumnIndex: columnCount }],
                booleanRule: {
                  condition: {
                    type: 'CUSTOM_FORMULA',
                    values: [{ userEnteredValue: '=MOD(ROW(),2)=0' }],
                  },
                  format: {
                    backgroundColor: colors.alt,
                  },
                },
              },
              index: 0,
            },
          });
        }

        // Number formatting for amount columns
        const amountCols = AMOUNT_COLUMNS[title];
        if (amountCols && rowCount > 1) {
          for (const colIndex of amountCols) {
            requests.push({
              repeatCell: {
                range: { 
                  sheetId, 
                  startRowIndex: 1, 
                  endRowIndex: rowCount,
                  startColumnIndex: colIndex,
                  endColumnIndex: colIndex + 1 
                },
                cell: {
                  userEnteredFormat: {
                    numberFormat: { type: 'NUMBER', pattern: '#,##0.00' },
                  },
                },
                fields: 'userEnteredFormat.numberFormat',
              },
            });
          }
        }
      }

      // Freeze header row
      requests.push({
        updateSheetProperties: {
          properties: {
            sheetId,
            gridProperties: { frozenRowCount: 1 },
          },
          fields: 'gridProperties.frozenRowCount',
        },
      });

      // Set row height for header
      requests.push({
        updateDimensionProperties: {
          range: {
            sheetId,
            dimension: 'ROWS',
            startIndex: 0,
            endIndex: 1,
          },
          properties: {
            pixelSize: 32,
          },
          fields: 'pixelSize',
        },
      });

      // Auto-resize columns
      requests.push({
        autoResizeDimensions: {
          dimensions: {
            sheetId,
            dimension: 'COLUMNS',
            startIndex: 0,
            endIndex: columnCount,
          },
        },
      });

      // Add borders to the table
      if (title !== 'Dashboard') {
        requests.push({
          updateBorders: {
            range: { sheetId, startRowIndex: 0, endRowIndex: rowCount, startColumnIndex: 0, endColumnIndex: columnCount },
            top: { style: 'SOLID', color: { red: 0.8, green: 0.8, blue: 0.8 } },
            bottom: { style: 'SOLID', color: { red: 0.8, green: 0.8, blue: 0.8 } },
            left: { style: 'SOLID', color: { red: 0.8, green: 0.8, blue: 0.8 } },
            right: { style: 'SOLID', color: { red: 0.8, green: 0.8, blue: 0.8 } },
            innerHorizontal: { style: 'SOLID', color: { red: 0.9, green: 0.9, blue: 0.9 } },
            innerVertical: { style: 'SOLID', color: { red: 0.9, green: 0.9, blue: 0.9 } },
          },
        });
      }
    }

    return requests;
  }
}

export const googleSheetsService = new GoogleSheetsService();
