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

  async exportAppData(data: AppData): Promise<string> {
    const dateStr = format(new Date(), 'yyyy-MM-dd');
    const title = `BizSuite Export - ${dateStr}`;

    const sheetNames = [
      'Dashboard',
      'Businesses',
      'Projects',
      'Quick Tasks',
      'Retainers',
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

    // Create the spreadsheet
    const spreadsheet = await this.createSpreadsheet(title, sheetNames);
    const { spreadsheetId, sheets } = spreadsheet;

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

    return spreadsheet.spreadsheetUrl;
  }

  private prepareSheetData(data: AppData): Record<string, any[][]> {
    const formatCurrency = (amount: number, currency?: string) => 
      currency ? `${currency} ${amount.toLocaleString()}` : amount.toLocaleString();

    const formatDate = (dateStr?: string) => 
      dateStr ? format(new Date(dateStr), 'MMM dd, yyyy') : '';

    // Dashboard
    const activeProjects = data.projects.filter(p => p.status === 'active').length;
    const activeTasks = data.quickTasks.filter(t => t.status === 'active' || t.status === 'pending').length;
    const activeRetainers = data.retainers.filter(r => r.status === 'active');
    const totalMRR = activeRetainers.reduce((sum, r) => {
      const multiplier = r.frequency === 'yearly' ? 1/12 : r.frequency === 'quarterly' ? 1/3 : 1;
      return sum + (r.amount * multiplier);
    }, 0);

    const totalRevenue = data.payments
      .filter(p => p.type === 'incoming' && p.status === 'completed')
      .reduce((sum, p) => sum + p.amount, 0);

    const totalExpenses = data.expenses
      .filter(e => e.status === 'paid')
      .reduce((sum, e) => sum + e.amount, 0);

    const pendingReceivables = data.receivables
      .filter(r => r.status !== 'paid')
      .reduce((sum, r) => sum + (r.amount - r.receivedAmount), 0);

    const pendingPayables = data.payables
      .filter(p => p.status !== 'paid')
      .reduce((sum, p) => sum + (p.amount - p.paidAmount), 0);

    const totalBankBalance = data.bankAccounts.reduce((sum, a) => sum + a.balance, 0);

    const dashboard: any[][] = [
      ['BizSuite Data Export', '', format(new Date(), 'MMMM dd, yyyy')],
      [],
      ['OVERVIEW'],
      ['Metric', 'Value'],
      ['Total Businesses', data.businesses.length],
      ['Active Projects', activeProjects],
      ['Active Quick Tasks', activeTasks],
      ['Active Retainers', activeRetainers.length],
      ['Team Members', data.teamMembers.length],
      ['Partners', data.partners.length],
      ['Clients', data.clients.length],
      [],
      ['FINANCIAL SUMMARY'],
      ['Metric', 'Value'],
      ['Monthly Recurring Revenue (MRR)', formatCurrency(totalMRR)],
      ['Total Revenue (Completed)', formatCurrency(totalRevenue)],
      ['Total Expenses (Paid)', formatCurrency(totalExpenses)],
      ['Pending Receivables', formatCurrency(pendingReceivables)],
      ['Pending Payables', formatCurrency(pendingPayables)],
      ['Total Bank Balance', formatCurrency(totalBankBalance)],
    ];

    // Businesses
    const businesses: any[][] = [
      ['Name', 'Type', 'Currency', 'Current Balance', 'Minimum Balance', 'Created'],
      ...data.businesses.map(b => [
        b.name,
        b.type,
        b.currency.code,
        b.currentBalance,
        b.minimumBalance,
        formatDate(b.createdAt),
      ]),
    ];

    // Projects
    const projects: any[][] = [
      ['Name', 'Business', 'Client', 'Total Value', 'Status', 'Start Date', 'End Date', 'Client Payments', 'Created'],
      ...data.projects.map(p => {
        const business = data.businesses.find(b => b.id === p.businessId);
        const client = data.clients.find(c => c.id === p.clientId);
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
    const quickTasks: any[][] = [
      ['Title', 'Business', 'Amount', 'Currency', 'Assigned To', 'Status', 'Due Date', 'Created', 'Paid At'],
      ...data.quickTasks.map(t => {
        const business = data.businesses.find(b => b.id === t.businessId);
        const assignee = data.teamMembers.find(m => m.id === t.assignedToId);
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
    const retainers: any[][] = [
      ['Name', 'Business', 'Client', 'Amount', 'Currency', 'Frequency', 'Status', 'Next Billing', 'Total Received', 'Start Date'],
      ...data.retainers.map(r => {
        const business = data.businesses.find(b => b.id === r.businessId);
        const client = data.clients.find(c => c.id === r.clientId);
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

    // Clients
    const clients: any[][] = [
      ['Name', 'Email', 'Company', 'Total Value', 'Projects', 'Created'],
      ...data.clients.map(c => [
        c.name,
        c.email,
        c.company,
        c.totalValue,
        c.projects.length,
        formatDate(c.createdAt),
      ]),
    ];

    // Team Members
    const teamMembers: any[][] = [
      ['Name', 'Email', 'Role', 'Type', 'Businesses', 'Created'],
      ...data.teamMembers.map(m => {
        const businessNames = m.businessIds
          .map(id => data.businesses.find(b => b.id === id)?.name)
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
    const partners: any[][] = [
      ['Name', 'Email', 'Type', 'Created'],
      ...data.partners.map(p => [
        p.name,
        p.email,
        p.type,
        formatDate(p.createdAt),
      ]),
    ];

    // Payments
    const payments: any[][] = [
      ['Amount', 'Type', 'Status', 'Date', 'Source', 'Method', 'Description'],
      ...data.payments.map(p => [
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
    const expenses: any[][] = [
      ['Name', 'Business', 'Category', 'Amount', 'Status', 'Date', 'Recurring', 'Description'],
      ...data.expenses.map(e => {
        const business = data.businesses.find(b => b.id === e.businessId);
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
    const salaryRecords: any[][] = [
      ['Team Member', 'Business', 'Position', 'Amount', 'Currency', 'Frequency', 'Type', 'Start Date', 'End Date'],
      ...data.salaryRecords.map(s => {
        const member = data.teamMembers.find(m => m.id === s.teamMemberId);
        const business = data.businesses.find(b => b.id === s.businessId);
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
    const bankAccounts: any[][] = [
      ['Name', 'Business', 'Type', 'Balance', 'Currency', 'Account Number', 'Default', 'Description'],
      ...data.bankAccounts.map(a => {
        const business = data.businesses.find(b => b.id === a.businessId);
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
    const payables: any[][] = [
      ['Vendor', 'Business', 'Amount', 'Paid', 'Currency', 'Due Date', 'Status', 'Category', 'Invoice Ref'],
      ...data.payables.map(p => {
        const business = data.businesses.find(b => b.id === p.businessId);
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
    const receivables: any[][] = [
      ['Source', 'Business', 'Client', 'Amount', 'Received', 'Currency', 'Due Date', 'Status', 'Invoice Ref'],
      ...data.receivables.map(r => {
        const business = data.businesses.find(b => b.id === r.businessId);
        const client = data.clients.find(c => c.id === r.clientId);
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
      'Businesses': businesses,
      'Projects': projects,
      'Quick Tasks': quickTasks,
      'Retainers': retainers,
      'Clients': clients,
      'Team Members': teamMembers,
      'Partners': partners,
      'Payments': payments,
      'Expenses': expenses,
      'Salary Records': salaryRecords,
      'Bank Accounts': bankAccounts,
      'Payables': payables,
      'Receivables': receivables,
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

      // Header formatting (bold, background color)
      if (title === 'Dashboard') {
        // Title formatting
        requests.push({
          repeatCell: {
            range: { sheetId, startRowIndex: 0, endRowIndex: 1, startColumnIndex: 0, endColumnIndex: 3 },
            cell: {
              userEnteredFormat: {
                textFormat: { bold: true, fontSize: 16 },
              },
            },
            fields: 'userEnteredFormat.textFormat',
          },
        });
        // Section headers
        requests.push({
          repeatCell: {
            range: { sheetId, startRowIndex: 2, endRowIndex: 3, startColumnIndex: 0, endColumnIndex: 2 },
            cell: {
              userEnteredFormat: {
                textFormat: { bold: true, fontSize: 12 },
                backgroundColor: { red: 0.9, green: 0.9, blue: 0.9 },
              },
            },
            fields: 'userEnteredFormat(textFormat,backgroundColor)',
          },
        });
        requests.push({
          repeatCell: {
            range: { sheetId, startRowIndex: 12, endRowIndex: 13, startColumnIndex: 0, endColumnIndex: 2 },
            cell: {
              userEnteredFormat: {
                textFormat: { bold: true, fontSize: 12 },
                backgroundColor: { red: 0.9, green: 0.9, blue: 0.9 },
              },
            },
            fields: 'userEnteredFormat(textFormat,backgroundColor)',
          },
        });
      } else {
        // Standard table header
        requests.push({
          repeatCell: {
            range: { sheetId, startRowIndex: 0, endRowIndex: 1, startColumnIndex: 0, endColumnIndex: columnCount },
            cell: {
              userEnteredFormat: {
                textFormat: { bold: true },
                backgroundColor: { red: 0.2, green: 0.4, blue: 0.6 },
                horizontalAlignment: 'CENTER',
              },
            },
            fields: 'userEnteredFormat(textFormat,backgroundColor,horizontalAlignment)',
          },
        });
        // White text for header
        requests.push({
          repeatCell: {
            range: { sheetId, startRowIndex: 0, endRowIndex: 1, startColumnIndex: 0, endColumnIndex: columnCount },
            cell: {
              userEnteredFormat: {
                textFormat: { bold: true, foregroundColor: { red: 1, green: 1, blue: 1 } },
              },
            },
            fields: 'userEnteredFormat.textFormat',
          },
        });
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
    }

    return requests;
  }
}

export const googleSheetsService = new GoogleSheetsService();
