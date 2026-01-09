import { AppData, Partner } from '@/types/business';
import { format } from 'date-fns';

const SHEETS_API_BASE = 'https://sheets.googleapis.com/v4/spreadsheets';

// Status color constants for conditional formatting
const STATUS_COLORS = {
  paid: { red: 0.30, green: 0.69, blue: 0.31 }, // Green #4CAF50
  partial: { red: 1.0, green: 0.76, blue: 0.03 }, // Yellow #FFC107
  notPaid: { red: 0.96, green: 0.26, blue: 0.21 }, // Red #F44336
};

interface SheetProperties {
  title: string;
  index: number;
}

interface SpreadsheetResponse {
  spreadsheetId: string;
  spreadsheetUrl: string;
  sheets: { properties: { sheetId: number; title: string } }[];
}

// Sheet categories for navigation and tab colors
const SHEET_CATEGORIES: Record<string, { category: string; tabColor: { red: number; green: number; blue: number } }> = {
  'Dashboard': { category: 'Dashboard', tabColor: { red: 0.42, green: 0.27, blue: 0.76 } },
  'Businesses': { category: 'Admin', tabColor: { red: 0.28, green: 0.33, blue: 0.41 } },
  'Projects': { category: 'Works', tabColor: { red: 0.15, green: 0.39, blue: 0.92 } },
  'Quick Tasks': { category: 'Works', tabColor: { red: 0.15, green: 0.39, blue: 0.92 } },
  'Retainers': { category: 'Works', tabColor: { red: 0.15, green: 0.39, blue: 0.92 } },
  'Renewals': { category: 'Works', tabColor: { red: 0.15, green: 0.39, blue: 0.92 } },
  'Renewal Payments': { category: 'Works', tabColor: { red: 0.15, green: 0.39, blue: 0.92 } },
  'Clients': { category: 'People', tabColor: { red: 0.03, green: 0.57, blue: 0.70 } },
  'Team Members': { category: 'People', tabColor: { red: 0.03, green: 0.57, blue: 0.70 } },
  'Partners': { category: 'People', tabColor: { red: 0.03, green: 0.57, blue: 0.70 } },
  'Payments': { category: 'Finance', tabColor: { red: 0.09, green: 0.64, blue: 0.29 } },
  'Expenses': { category: 'Finance', tabColor: { red: 0.09, green: 0.64, blue: 0.29 } },
  'Salary Records': { category: 'Finance', tabColor: { red: 0.09, green: 0.64, blue: 0.29 } },
  'Partner Payments': { category: 'Finance', tabColor: { red: 0.92, green: 0.35, blue: 0.05 } },
  'Team Payments': { category: 'Finance', tabColor: { red: 0.03, green: 0.57, blue: 0.70 } },
  'Bank Accounts': { category: 'Admin', tabColor: { red: 0.28, green: 0.33, blue: 0.41 } },
  'Payables': { category: 'Admin', tabColor: { red: 0.28, green: 0.33, blue: 0.41 } },
  'Receivables': { category: 'Admin', tabColor: { red: 0.28, green: 0.33, blue: 0.41 } },
};

// Modern colorful palette for each sheet header
const SHEET_COLORS: Record<string, { header: { red: number; green: number; blue: number }; alt: { red: number; green: number; blue: number } }> = {
  'Dashboard': { header: { red: 0.42, green: 0.27, blue: 0.76 }, alt: { red: 0.97, green: 0.96, blue: 0.99 } },
  'Businesses': { header: { red: 0.28, green: 0.33, blue: 0.41 }, alt: { red: 0.96, green: 0.97, blue: 0.98 } },
  'Projects': { header: { red: 0.15, green: 0.39, blue: 0.92 }, alt: { red: 0.95, green: 0.97, blue: 0.99 } },
  'Quick Tasks': { header: { red: 0.85, green: 0.46, blue: 0.02 }, alt: { red: 0.99, green: 0.97, blue: 0.94 } },
  'Retainers': { header: { red: 0.02, green: 0.59, blue: 0.41 }, alt: { red: 0.94, green: 0.99, blue: 0.97 } },
  'Renewals': { header: { red: 0.86, green: 0.15, blue: 0.47 }, alt: { red: 0.99, green: 0.95, blue: 0.97 } },
  'Renewal Payments': { header: { red: 0.88, green: 0.11, blue: 0.28 }, alt: { red: 0.99, green: 0.95, blue: 0.96 } },
  'Clients': { header: { red: 0.31, green: 0.27, blue: 0.90 }, alt: { red: 0.96, green: 0.96, blue: 0.99 } },
  'Team Members': { header: { red: 0.03, green: 0.57, blue: 0.70 }, alt: { red: 0.94, green: 0.98, blue: 0.99 } },
  'Partners': { header: { red: 0.92, green: 0.35, blue: 0.05 }, alt: { red: 0.99, green: 0.96, blue: 0.94 } },
  'Payments': { header: { red: 0.09, green: 0.64, blue: 0.29 }, alt: { red: 0.94, green: 0.99, blue: 0.96 } },
  'Expenses': { header: { red: 0.86, green: 0.15, blue: 0.15 }, alt: { red: 0.99, green: 0.95, blue: 0.95 } },
  'Salary Records': { header: { red: 0.49, green: 0.24, blue: 0.93 }, alt: { red: 0.97, green: 0.95, blue: 0.99 } },
  'Partner Payments': { header: { red: 0.92, green: 0.35, blue: 0.05 }, alt: { red: 0.99, green: 0.96, blue: 0.94 } },
  'Team Payments': { header: { red: 0.03, green: 0.57, blue: 0.70 }, alt: { red: 0.94, green: 0.98, blue: 0.99 } },
  'Bank Accounts': { header: { red: 0.28, green: 0.33, blue: 0.41 }, alt: { red: 0.96, green: 0.97, blue: 0.98 } },
  'Payables': { header: { red: 0.79, green: 0.54, blue: 0.02 }, alt: { red: 0.99, green: 0.98, blue: 0.94 } },
  'Receivables': { header: { red: 0.40, green: 0.64, blue: 0.05 }, alt: { red: 0.97, green: 0.99, blue: 0.94 } },
};

// Column indices that contain amounts (for number formatting) - adjusted for navigation rows (+2)
const AMOUNT_COLUMNS: Record<string, number[]> = {
  'Businesses': [3, 4],
  'Projects': [3, 7],
  'Quick Tasks': [2],
  'Retainers': [3, 8],
  'Renewals': [5, 10],
  'Renewal Payments': [2],
  'Clients': [3],
  'Payments': [0],
  'Expenses': [3],
  'Salary Records': [3],
  'Partner Payments': [3, 4, 5],
  'Team Payments': [3, 4, 5],
  'Bank Accounts': [3],
  'Payables': [2, 3],
  'Receivables': [3, 4],
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

  private getSheetNames(data: AppData): string[] {
    const safeBusinesses = data.businesses || [];
    
    // Base sheets
    const baseSheets = [
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
      'Partner Payments',
      'Team Payments',
      'Bank Accounts',
      'Payables',
      'Receivables',
    ];
    
    // Add per-business summary sheets
    const businessSummarySheets = safeBusinesses.map(b => `${b.name} Summary`);
    
    return [...baseSheets, ...businessSummarySheets];
  }

  private getNavigationLink(targetSheet: string, sheetIdMap: Map<string, number>): string {
    const sheetId = sheetIdMap.get(targetSheet);
    if (sheetId === undefined) return targetSheet;
    return `=HYPERLINK("#gid=${sheetId}", "${targetSheet}")`;
  }

  private getBackNavigation(currentSheet: string, sheetIdMap: Map<string, number>): string[] {
    const dashboardLink = this.getNavigationLink('Dashboard', sheetIdMap);
    const category = SHEET_CATEGORIES[currentSheet]?.category;
    
    // For Works category, provide back to Dashboard
    if (category === 'Works') {
      return [`← ${dashboardLink}`, '', '← Works'];
    } else if (category === 'People') {
      return [`← ${dashboardLink}`, '', '← People'];
    } else if (category === 'Finance') {
      return [`← ${dashboardLink}`, '', '← Finance'];
    } else if (category === 'Admin') {
      return [`← ${dashboardLink}`, '', '← Admin'];
    }
    return [`← ${dashboardLink}`];
  }

  async exportAppData(data: AppData): Promise<{ spreadsheetId: string; spreadsheetUrl: string }> {
    const dateStr = format(new Date(), 'yyyy-MM-dd');
    const title = `BizSuite BI Dashboard - ${dateStr}`;

    const sheetNames = this.getSheetNames(data);

    // Create the spreadsheet
    const spreadsheet = await this.createSpreadsheet(title, sheetNames);
    const { spreadsheetId, sheets, spreadsheetUrl } = spreadsheet;

    // Build sheet ID map for navigation links
    const sheetIdMap = new Map<string, number>();
    for (const sheet of sheets) {
      sheetIdMap.set(sheet.properties.title, sheet.properties.sheetId);
    }

    // Prepare all sheet data with navigation
    const sheetData = this.prepareSheetData(data, sheetIdMap);

    // Write data to each sheet
    for (const [sheetName, rows] of Object.entries(sheetData)) {
      if (rows.length > 0) {
        await this.setValues(spreadsheetId, `'${sheetName}'!A1`, rows);
      }
    }

    // Apply formatting and charts
    const formatRequests = this.getFormatRequests(sheets, sheetData);
    const chartRequests = this.getChartRequests(sheets, sheetData, data);
    const allRequests = [...formatRequests, ...chartRequests];
    
    if (allRequests.length > 0) {
      await this.batchUpdate(spreadsheetId, allRequests);
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
    
    // Build sheet ID map for navigation links
    const sheetIdMap = new Map<string, number>();
    for (const sheet of spreadsheet.sheets) {
      sheetIdMap.set(sheet.properties.title, sheet.properties.sheetId);
    }
    
    const sheetData = this.prepareSheetData(data, sheetIdMap);

    // Clear and rewrite each sheet
    for (const sheet of spreadsheet.sheets) {
      const sheetName = sheet.properties.title;
      const rows = sheetData[sheetName];
      
      if (rows && rows.length > 0) {
        await this.clearSheet(spreadsheetId, sheetName);
        await this.setValues(spreadsheetId, `'${sheetName}'!A1`, rows);
      }
    }

    // Reapply formatting and charts
    const formatRequests = this.getFormatRequests(spreadsheet.sheets, sheetData);
    const chartRequests = this.getChartRequests(spreadsheet.sheets, sheetData, data);
    const allRequests = [...formatRequests, ...chartRequests];
    
    if (allRequests.length > 0) {
      await this.batchUpdate(spreadsheetId, allRequests);
    }
  }

  // Partner-specific export methods
  async exportPartnerData(
    partner: Partner,
    businessIds: string[],
    data: AppData
  ): Promise<{ spreadsheetId: string; spreadsheetUrl: string }> {
    const dateStr = format(new Date(), 'yyyy-MM-dd');
    const title = `${partner.name} - BizSuite Report - ${dateStr}`;

    // Get sheet names for partner's businesses
    const sheetNames = this.getPartnerSheetNames(businessIds, data);

    // Create the spreadsheet
    const spreadsheet = await this.createSpreadsheet(title, sheetNames);
    const { spreadsheetId, sheets, spreadsheetUrl } = spreadsheet;

    // Build sheet ID map for navigation links
    const sheetIdMap = new Map<string, number>();
    for (const sheet of sheets) {
      sheetIdMap.set(sheet.properties.title, sheet.properties.sheetId);
    }

    // Prepare partner-specific sheet data
    const sheetData = this.preparePartnerSheetData(partner, businessIds, data, sheetIdMap);

    // Write data to each sheet
    for (const [sheetName, rows] of Object.entries(sheetData)) {
      if (rows.length > 0) {
        await this.setValues(spreadsheetId, `'${sheetName}'!A1`, rows);
      }
    }

    // Apply formatting
    const formatRequests = this.getPartnerFormatRequests(sheets, sheetData);
    if (formatRequests.length > 0) {
      await this.batchUpdate(spreadsheetId, formatRequests);
    }

    return { spreadsheetId, spreadsheetUrl };
  }

  async updatePartnerSpreadsheet(
    spreadsheetId: string,
    partner: Partner,
    businessIds: string[],
    data: AppData
  ): Promise<void> {
    // Get existing spreadsheet info
    const spreadsheet = await this.getSpreadsheet(spreadsheetId);

    // Build sheet ID map
    const sheetIdMap = new Map<string, number>();
    for (const sheet of spreadsheet.sheets) {
      sheetIdMap.set(sheet.properties.title, sheet.properties.sheetId);
    }

    const sheetData = this.preparePartnerSheetData(partner, businessIds, data, sheetIdMap);

    // Clear and rewrite each sheet
    for (const sheet of spreadsheet.sheets) {
      const sheetName = sheet.properties.title;
      const rows = sheetData[sheetName];

      if (rows && rows.length > 0) {
        await this.clearSheet(spreadsheetId, sheetName);
        await this.setValues(spreadsheetId, `'${sheetName}'!A1`, rows);
      }
    }

    // Reapply formatting
    const formatRequests = this.getPartnerFormatRequests(spreadsheet.sheets, sheetData);
    if (formatRequests.length > 0) {
      await this.batchUpdate(spreadsheetId, formatRequests);
    }
  }

  private getPartnerSheetNames(businessIds: string[], data: AppData): string[] {
    const safeBusinesses = data.businesses || [];
    
    // Create a summary sheet for each business the partner is associated with
    const sheets = ['Overview'];
    
    for (const businessId of businessIds) {
      const business = safeBusinesses.find(b => b.id === businessId);
      if (business) {
        sheets.push(`${business.name} Summary`);
      }
    }
    
    return sheets;
  }

  private preparePartnerSheetData(
    partner: Partner,
    businessIds: string[],
    data: AppData,
    sheetIdMap: Map<string, number>
  ): Record<string, any[][]> {
    const formatDate = (dateStr?: string) =>
      dateStr ? format(new Date(dateStr), 'MMM dd, yyyy') : '';

    const safeBusinesses = data.businesses || [];
    const safeProjects = data.projects || [];
    const safeClients = data.clients || [];
    const safePartners = data.partners || [];

    const result: Record<string, any[][]> = {};

    // Overview sheet with totals across all businesses
    let grandTotalClientFee = 0;
    let grandTotalPartnerShare = 0;
    let grandTotalPaid = 0;
    let grandTotalRemaining = 0;

    // Generate per-business summary sheets
    for (const businessId of businessIds) {
      const business = safeBusinesses.find(b => b.id === businessId);
      if (!business) continue;

      const businessProjects = safeProjects.filter(p => p.businessId === businessId);
      const summaryData: any[][] = [];

      let totalClientFee = 0;
      let totalPartnerShare = 0;
      let totalExpectedPay = 0;
      let totalAmountPaid = 0;
      let totalRemaining = 0;

      businessProjects.forEach(project => {
        const client = safeClients.find(c => c.id === project.clientId);

        // Get partner's allocations only
        const allPartnerAllocations = [
          ...(project.allocationPartnerAllocations || []),
          ...(project.partnerAllocations || [])
        ].filter(a => a.partnerId === partner.id);

        if (allPartnerAllocations.length === 0) {
          // Partner has no allocation in this project, skip
          return;
        }

        allPartnerAllocations.forEach(allocation => {
          const status = allocation.outstanding <= 0 ? 'Paid' :
            allocation.paidAmount > 0 ? 'Partial' : 'Not Paid';
          const allocationDisplay = allocation.allocationType === 'percentage'
            ? `${allocation.allocationValue}%`
            : `$${allocation.allocationValue}`;

          summaryData.push([
            formatDate(project.startDate),
            project.totalValue,
            client?.name || '',
            project.name,
            status,
            allocationDisplay,
            allocation.totalAllocated,
            allocation.totalAllocated,
            allocation.paidAmount,
            allocation.outstanding,
            '',
          ]);

          totalClientFee += project.totalValue;
          totalPartnerShare += allocation.totalAllocated;
          totalExpectedPay += allocation.totalAllocated;
          totalAmountPaid += allocation.paidAmount;
          totalRemaining += allocation.outstanding;
        });
      });

      // Add totals row
      if (summaryData.length > 0) {
        summaryData.push([]); // Empty row before totals
        summaryData.push([
          'TOTALS',
          totalClientFee,
          '',
          '',
          '',
          '',
          totalPartnerShare,
          totalExpectedPay,
          totalAmountPaid,
          totalRemaining,
          '',
        ]);
      }

      const sheetName = `${business.name} Summary`;
      
      // Add navigation and header
      result[sheetName] = [
        [`← Back to Overview`, '', `Business: ${business.name}`],
        [],
        ['Date', 'Client Fee', 'Client Name', 'Description', 'Status', 'Partner %', 'Partner $', 'Expected Pay', 'Amount Paid', 'Remaining', 'Notes'],
        ...summaryData,
      ];

      // Register dynamic sheet styling
      if (!SHEET_CATEGORIES[sheetName]) {
        SHEET_CATEGORIES[sheetName] = {
          category: 'Partner Report',
          tabColor: { red: 0.92, green: 0.35, blue: 0.05 }
        };
      }
      if (!SHEET_COLORS[sheetName]) {
        SHEET_COLORS[sheetName] = {
          header: { red: 0.92, green: 0.35, blue: 0.05 },
          alt: { red: 0.99, green: 0.97, blue: 0.94 }
        };
      }

      grandTotalClientFee += totalClientFee;
      grandTotalPartnerShare += totalPartnerShare;
      grandTotalPaid += totalAmountPaid;
      grandTotalRemaining += totalRemaining;
    }

    // Overview sheet
    const businessLinks = businessIds
      .map(id => safeBusinesses.find(b => b.id === id))
      .filter(Boolean)
      .map(b => {
        const sheetId = sheetIdMap.get(`${b!.name} Summary`);
        if (sheetId !== undefined) {
          return `=HYPERLINK("#gid=${sheetId}", "${b!.name}")`;
        }
        return b!.name;
      });

    result['Overview'] = [
      [`📊 Partner Report: ${partner.name}`, '', format(new Date(), 'MMMM dd, yyyy HH:mm')],
      [],
      ['SUMMARY'],
      ['Total Client Fees', grandTotalClientFee],
      ['Your Total Allocation', grandTotalPartnerShare],
      ['Amount Paid', grandTotalPaid],
      ['Outstanding', grandTotalRemaining],
      [],
      ['BUSINESS REPORTS'],
      ...businessLinks.map(link => [link]),
    ];

    return result;
  }

  private getPartnerFormatRequests(
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

      // Apply font to entire sheet
      requests.push({
        repeatCell: {
          range: { sheetId, startRowIndex: 0, endRowIndex: Math.max(rowCount, 50), startColumnIndex: 0, endColumnIndex: Math.max(columnCount, 12) },
          cell: {
            userEnteredFormat: {
              textFormat: { fontFamily: 'Proxima Nova' },
            },
          },
          fields: 'userEnteredFormat.textFormat.fontFamily',
        },
      });

      // Set tab color
      requests.push({
        updateSheetProperties: {
          properties: {
            sheetId,
            tabColor: { red: 0.92, green: 0.35, blue: 0.05 },
          },
          fields: 'tabColor',
        },
      });

      if (title === 'Overview') {
        // Overview title formatting
        requests.push({
          repeatCell: {
            range: { sheetId, startRowIndex: 0, endRowIndex: 1, startColumnIndex: 0, endColumnIndex: 3 },
            cell: {
              userEnteredFormat: {
                textFormat: { bold: true, fontSize: 18, foregroundColor: { red: 1, green: 1, blue: 1 } },
                backgroundColor: { red: 0.92, green: 0.35, blue: 0.05 },
              },
            },
            fields: 'userEnteredFormat(textFormat,backgroundColor)',
          },
        });

        // Summary section header
        requests.push({
          repeatCell: {
            range: { sheetId, startRowIndex: 2, endRowIndex: 3, startColumnIndex: 0, endColumnIndex: 2 },
            cell: {
              userEnteredFormat: {
                textFormat: { bold: true, fontSize: 12 },
                backgroundColor: { red: 0.95, green: 0.95, blue: 0.95 },
              },
            },
            fields: 'userEnteredFormat(textFormat,backgroundColor)',
          },
        });

        // Number formatting for totals
        requests.push({
          repeatCell: {
            range: { sheetId, startRowIndex: 3, endRowIndex: 7, startColumnIndex: 1, endColumnIndex: 2 },
            cell: {
              userEnteredFormat: {
                numberFormat: { type: 'NUMBER', pattern: '#,##0.00' },
                textFormat: { bold: true },
              },
            },
            fields: 'userEnteredFormat(numberFormat,textFormat)',
          },
        });

        // Business Reports header
        requests.push({
          repeatCell: {
            range: { sheetId, startRowIndex: 8, endRowIndex: 9, startColumnIndex: 0, endColumnIndex: 2 },
            cell: {
              userEnteredFormat: {
                textFormat: { bold: true, fontSize: 12 },
                backgroundColor: { red: 0.95, green: 0.95, blue: 0.95 },
              },
            },
            fields: 'userEnteredFormat(textFormat,backgroundColor)',
          },
        });
      } else {
        // Business summary sheets
        // Navigation row styling
        requests.push({
          repeatCell: {
            range: { sheetId, startRowIndex: 0, endRowIndex: 1, startColumnIndex: 0, endColumnIndex: columnCount },
            cell: {
              userEnteredFormat: {
                textFormat: { fontSize: 10, foregroundColor: { red: 0.15, green: 0.39, blue: 0.92 } },
                backgroundColor: { red: 0.97, green: 0.97, blue: 0.99 },
              },
            },
            fields: 'userEnteredFormat(textFormat,backgroundColor)',
          },
        });

        // Header row styling
        requests.push({
          repeatCell: {
            range: { sheetId, startRowIndex: 2, endRowIndex: 3, startColumnIndex: 0, endColumnIndex: columnCount },
            cell: {
              userEnteredFormat: {
                textFormat: { bold: true, fontSize: 11, foregroundColor: { red: 1, green: 1, blue: 1 } },
                backgroundColor: { red: 0.92, green: 0.35, blue: 0.05 },
                horizontalAlignment: 'CENTER',
              },
            },
            fields: 'userEnteredFormat(textFormat,backgroundColor,horizontalAlignment)',
          },
        });

        // Alternating row colors
        if (rowCount > 3) {
          requests.push({
            addConditionalFormatRule: {
              rule: {
                ranges: [{ sheetId, startRowIndex: 3, endRowIndex: rowCount, startColumnIndex: 0, endColumnIndex: columnCount }],
                booleanRule: {
                  condition: {
                    type: 'CUSTOM_FORMULA',
                    values: [{ userEnteredValue: '=MOD(ROW(),2)=0' }],
                  },
                  format: {
                    backgroundColor: { red: 0.99, green: 0.97, blue: 0.94 },
                  },
                },
              },
              index: 0,
            },
          });
        }

        // Conditional formatting for Status column (column E = index 4)
        // Paid = Green
        requests.push({
          addConditionalFormatRule: {
            rule: {
              ranges: [{ sheetId, startRowIndex: 3, endRowIndex: rowCount, startColumnIndex: 4, endColumnIndex: 5 }],
              booleanRule: {
                condition: {
                  type: 'TEXT_EQ',
                  values: [{ userEnteredValue: 'Paid' }],
                },
                format: {
                  backgroundColor: STATUS_COLORS.paid,
                  textFormat: { foregroundColor: { red: 1, green: 1, blue: 1 }, bold: true },
                },
              },
            },
            index: 1,
          },
        });

        // Partial = Yellow
        requests.push({
          addConditionalFormatRule: {
            rule: {
              ranges: [{ sheetId, startRowIndex: 3, endRowIndex: rowCount, startColumnIndex: 4, endColumnIndex: 5 }],
              booleanRule: {
                condition: {
                  type: 'TEXT_EQ',
                  values: [{ userEnteredValue: 'Partial' }],
                },
                format: {
                  backgroundColor: STATUS_COLORS.partial,
                  textFormat: { foregroundColor: { red: 0.2, green: 0.2, blue: 0.2 }, bold: true },
                },
              },
            },
            index: 2,
          },
        });

        // Not Paid = Red
        requests.push({
          addConditionalFormatRule: {
            rule: {
              ranges: [{ sheetId, startRowIndex: 3, endRowIndex: rowCount, startColumnIndex: 4, endColumnIndex: 5 }],
              booleanRule: {
                condition: {
                  type: 'TEXT_EQ',
                  values: [{ userEnteredValue: 'Not Paid' }],
                },
                format: {
                  backgroundColor: STATUS_COLORS.notPaid,
                  textFormat: { foregroundColor: { red: 1, green: 1, blue: 1 }, bold: true },
                },
              },
            },
            index: 3,
          },
        });

        // Number formatting for amount columns
        const amountColumns = [1, 6, 7, 8, 9]; // Client Fee, Partner $, Expected Pay, Amount Paid, Remaining
        for (const colIndex of amountColumns) {
          requests.push({
            repeatCell: {
              range: { sheetId, startRowIndex: 3, endRowIndex: rowCount, startColumnIndex: colIndex, endColumnIndex: colIndex + 1 },
              cell: {
                userEnteredFormat: {
                  numberFormat: { type: 'NUMBER', pattern: '#,##0.00' },
                },
              },
              fields: 'userEnteredFormat.numberFormat',
            },
          });
        }

        // Bold TOTALS row
        const totalsRowIndex = rowCount - 1;
        if (totalsRowIndex > 3) {
          requests.push({
            repeatCell: {
              range: { sheetId, startRowIndex: totalsRowIndex, endRowIndex: totalsRowIndex + 1, startColumnIndex: 0, endColumnIndex: columnCount },
              cell: {
                userEnteredFormat: {
                  textFormat: { bold: true, fontSize: 11 },
                  backgroundColor: { red: 0.95, green: 0.95, blue: 0.95 },
                },
              },
              fields: 'userEnteredFormat(textFormat,backgroundColor)',
            },
          });
        }

        // Freeze header rows
        requests.push({
          updateSheetProperties: {
            properties: {
              sheetId,
              gridProperties: { frozenRowCount: 3 },
            },
            fields: 'gridProperties.frozenRowCount',
          },
        });
      }

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

  private prepareSheetData(data: AppData, sheetIdMap: Map<string, number>): Record<string, any[][]> {
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

    // Calculate metrics
    const activeProjects = safeProjects.filter(p => p.status === 'active').length;
    const completedProjects = safeProjects.filter(p => p.status === 'completed').length;
    const onHoldProjects = safeProjects.filter(p => p.status === 'on-hold').length;
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

    // Generate navigation links
    const navWorks = [
      this.getNavigationLink('Projects', sheetIdMap),
      this.getNavigationLink('Quick Tasks', sheetIdMap),
      this.getNavigationLink('Retainers', sheetIdMap),
      this.getNavigationLink('Renewals', sheetIdMap),
    ];
    const navPeople = [
      this.getNavigationLink('Clients', sheetIdMap),
      this.getNavigationLink('Team Members', sheetIdMap),
      this.getNavigationLink('Partners', sheetIdMap),
    ];
    const navFinance = [
      this.getNavigationLink('Payments', sheetIdMap),
      this.getNavigationLink('Expenses', sheetIdMap),
      this.getNavigationLink('Salary Records', sheetIdMap),
    ];
    const navAdmin = [
      this.getNavigationLink('Businesses', sheetIdMap),
      this.getNavigationLink('Bank Accounts', sheetIdMap),
      this.getNavigationLink('Payables', sheetIdMap),
      this.getNavigationLink('Receivables', sheetIdMap),
    ];

    // Dashboard with navigation, KPIs and chart data areas
    const dashboard: any[][] = [
      ['📊 BizSuite BI Dashboard', '', '', format(new Date(), 'MMMM dd, yyyy HH:mm')],
      [],
      ['🔗 QUICK NAVIGATION'],
      ['WORKS', 'PEOPLE', 'FINANCE', 'ADMIN'],
      [navWorks[0], navPeople[0], navFinance[0], navAdmin[0]],
      [navWorks[1], navPeople[1], navFinance[1], navAdmin[1]],
      [navWorks[2], navPeople[2], navFinance[2], navAdmin[2]],
      [navWorks[3], '', '', navAdmin[3]],
      [],
      ['📈 KEY METRICS'],
      ['', 'Businesses', 'Projects', 'Clients', 'Revenue'],
      ['Count', safeBusinesses.length, activeProjects, safeClients.length, ''],
      ['Value', '', '', '', totalRevenue],
      [],
      ['💰 FINANCIAL OVERVIEW'],
      ['Metric', 'Value', '', 'Metric', 'Value'],
      ['Monthly Recurring Revenue', totalMRR, '', 'Total Bank Balance', totalBankBalance],
      ['Pending Receivables', pendingReceivables, '', 'Pending Payables', pendingPayables],
      ['Total Revenue', totalRevenue, '', 'Total Expenses', totalExpenses],
      [],
      ['📊 PROJECTS STATUS', '', '', '📊 EXPENSE BREAKDOWN'],
      ['Status', 'Count', '', 'Category', 'Amount'],
      ['Active', activeProjects, '', 'Software', safeExpenses.filter(e => e.category === 'software').reduce((s, e) => s + e.amount, 0)],
      ['Completed', completedProjects, '', 'Marketing', safeExpenses.filter(e => e.category === 'marketing').reduce((s, e) => s + e.amount, 0)],
      ['On Hold', onHoldProjects, '', 'Hosting', safeExpenses.filter(e => e.category === 'hosting').reduce((s, e) => s + e.amount, 0)],
      ['', '', '', 'Other', safeExpenses.filter(e => !['software', 'marketing', 'hosting'].includes(e.category)).reduce((s, e) => s + e.amount, 0)],
      [],
      ['📋 QUICK STATS'],
      ['', 'Active Retainers', 'Active Tasks', 'Total Renewals', 'Upcoming (30d)'],
      ['Count', activeRetainers.length, activeTasks, totalRenewals, upcomingRenewals],
    ];

    // Helper function to add navigation rows to data sheets
    const addNavigation = (sheetName: string, headerRow: any[], dataRows: any[][]): any[][] => {
      const backNav = this.getBackNavigation(sheetName, sheetIdMap);
      const category = SHEET_CATEGORIES[sheetName]?.category || '';
      return [
        [`← Back to ${this.getNavigationLink('Dashboard', sheetIdMap)}`, '', `Category: ${category}`],
        [],
        headerRow,
        ...dataRows,
      ];
    };

    // Businesses
    const businessesData = safeBusinesses.map(b => [
      b.name,
      b.type,
      b.currency?.code || '',
      b.currentBalance,
      b.minimumBalance,
      formatDate(b.createdAt),
    ]);
    const businessesSheet = addNavigation('Businesses',
      ['Name', 'Type', 'Currency', 'Current Balance', 'Minimum Balance', 'Created'],
      businessesData
    );

    // Projects
    const projectsData = safeProjects.map(p => {
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
    });
    const projectsSheet = addNavigation('Projects',
      ['Name', 'Business', 'Client', 'Total Value', 'Status', 'Start Date', 'End Date', 'Client Payments', 'Created'],
      projectsData
    );

    // Quick Tasks
    const quickTasksData = safeQuickTasks.map(t => {
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
    });
    const quickTasksSheet = addNavigation('Quick Tasks',
      ['Title', 'Business', 'Amount', 'Currency', 'Assigned To', 'Status', 'Due Date', 'Created', 'Paid At'],
      quickTasksData
    );

    // Retainers
    const retainersData = safeRetainers.map(r => {
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
    });
    const retainersSheet = addNavigation('Retainers',
      ['Name', 'Business', 'Client', 'Amount', 'Currency', 'Frequency', 'Status', 'Next Billing', 'Total Received', 'Start Date'],
      retainersData
    );

    // Renewals
    const renewalsData = safeRenewals.map(r => {
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
    });
    const renewalsSheet = addNavigation('Renewals',
      ['Name', 'Business', 'Client', 'Linked Retainer', 'Type', 'Amount', 'Currency', 'Frequency', 'Next Renewal', 'Last Paid', 'Total Paid', 'Description'],
      renewalsData
    );

    // Renewal Payments
    const renewalPaymentsData = safeRenewalPayments.map(p => {
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
    });
    const renewalPaymentsSheet = addNavigation('Renewal Payments',
      ['Renewal Name', 'Client', 'Amount', 'Currency', 'Date', 'Status', 'Invoice', 'Notes'],
      renewalPaymentsData
    );

    // Clients
    const clientsData = safeClients.map(c => [
      c.name,
      c.email,
      c.company,
      c.totalValue,
      c.projects?.length || 0,
      formatDate(c.createdAt),
    ]);
    const clientsSheet = addNavigation('Clients',
      ['Name', 'Email', 'Company', 'Total Value', 'Projects', 'Created'],
      clientsData
    );

    // Team Members
    const teamMembersData = safeTeamMembers.map(m => {
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
    });
    const teamMembersSheet = addNavigation('Team Members',
      ['Name', 'Email', 'Role', 'Type', 'Businesses', 'Created'],
      teamMembersData
    );

    // Partners
    const partnersData = safePartners.map(p => {
      const businessNames = (p.businessIds || [])
        .map(id => safeBusinesses.find(b => b.id === id)?.name)
        .filter(Boolean)
        .join(', ') || 'All businesses';
      return [
        p.name,
        p.email,
        p.type,
        businessNames,
        formatDate(p.createdAt),
      ];
    });
    const partnersSheet = addNavigation('Partners',
      ['Name', 'Email', 'Type', 'Businesses', 'Created'],
      partnersData
    );

    // Payments
    const paymentsData = safePayments.map(p => [
      p.amount,
      p.type,
      p.status,
      formatDate(p.date),
      p.paymentSource || '',
      p.method || '',
      p.description || '',
    ]);
    const paymentsSheet = addNavigation('Payments',
      ['Amount', 'Type', 'Status', 'Date', 'Source', 'Method', 'Description'],
      paymentsData
    );

    // Expenses
    const expensesData = safeExpenses.map(e => {
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
    });
    const expensesSheet = addNavigation('Expenses',
      ['Name', 'Business', 'Category', 'Amount', 'Status', 'Date', 'Recurring', 'Description'],
      expensesData
    );

    // Salary Records
    const salaryRecordsData = safeSalaryRecords.map(s => {
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
    });
    const salaryRecordsSheet = addNavigation('Salary Records',
      ['Team Member', 'Business', 'Position', 'Amount', 'Currency', 'Frequency', 'Type', 'Start Date', 'End Date'],
      salaryRecordsData
    );

    // Partner Payments - comprehensive view of what partners received
    const partnerPaymentsData: any[][] = [];
    safeProjects.forEach(project => {
      const business = safeBusinesses.find(b => b.id === project.businessId);
      const client = safeClients.find(c => c.id === project.clientId);
      
      // Check allocation partner allocations
      (project.allocationPartnerAllocations || []).forEach(allocation => {
        const partner = safePartners.find(p => p.id === allocation.partnerId);
        const status = allocation.outstanding <= 0 ? 'Paid' : 
                       allocation.paidAmount > 0 ? 'Partial' : 'Not Paid';
        partnerPaymentsData.push([
          partner?.name || allocation.partnerName || '',
          business?.name || '',
          project.name,
          client?.name || '',
          allocation.allocationType === 'percentage' ? `${allocation.allocationValue}%` : 'Fixed',
          allocation.totalAllocated,
          allocation.paidAmount,
          allocation.outstanding,
          status,
        ]);
      });
      
      // Check legacy partner allocations
      (project.partnerAllocations || []).forEach(allocation => {
        const partner = safePartners.find(p => p.id === allocation.partnerId);
        const status = allocation.outstanding <= 0 ? 'Paid' : 
                       allocation.paidAmount > 0 ? 'Partial' : 'Not Paid';
        partnerPaymentsData.push([
          partner?.name || allocation.partnerName || '',
          business?.name || '',
          project.name,
          client?.name || '',
          allocation.allocationType === 'percentage' ? `${allocation.allocationValue}%` : 'Fixed',
          allocation.totalAllocated,
          allocation.paidAmount,
          allocation.outstanding,
          status,
        ]);
      });
    });
    const partnerPaymentsSheet = addNavigation('Partner Payments',
      ['Partner', 'Business', 'Project', 'Client', 'Allocation', 'Total Allocated', 'Amount Paid', 'Outstanding', 'Status'],
      partnerPaymentsData
    );

    // Team Payments - comprehensive view of what team members received
    const teamPaymentsData: any[][] = [];
    safeProjects.forEach(project => {
      const business = safeBusinesses.find(b => b.id === project.businessId);
      const client = safeClients.find(c => c.id === project.clientId);
      
      // Check allocation team allocations
      (project.allocationTeamAllocations || []).forEach(allocation => {
        const member = safeTeamMembers.find(m => m.id === allocation.memberId);
        const status = allocation.outstanding <= 0 ? 'Paid' : 
                       allocation.paidAmount > 0 ? 'Partial' : 'Not Paid';
        teamPaymentsData.push([
          member?.name || allocation.memberName || '',
          business?.name || '',
          project.name,
          client?.name || '',
          allocation.allocationType === 'percentage' ? `${allocation.allocationValue}%` : 'Fixed',
          allocation.totalAllocated,
          allocation.paidAmount,
          allocation.outstanding,
          status,
        ]);
      });
      
      // Check legacy team allocations
      (project.teamAllocations || []).forEach(allocation => {
        const member = safeTeamMembers.find(m => m.id === allocation.memberId);
        const status = allocation.outstanding <= 0 ? 'Paid' : 
                       allocation.paidAmount > 0 ? 'Partial' : 'Not Paid';
        teamPaymentsData.push([
          member?.name || allocation.memberName || '',
          business?.name || '',
          project.name,
          client?.name || '',
          allocation.allocationType === 'percentage' ? `${allocation.allocationValue}%` : 'Fixed',
          allocation.totalAllocated,
          allocation.paidAmount,
          allocation.outstanding,
          status,
        ]);
      });
    });
    const teamPaymentsSheet = addNavigation('Team Payments',
      ['Team Member', 'Business', 'Project', 'Client', 'Allocation', 'Total Allocated', 'Amount Paid', 'Outstanding', 'Status'],
      teamPaymentsData
    );

    // Bank Accounts
    const bankAccountsData = safeBankAccounts.map(a => {
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
    });
    const bankAccountsSheet = addNavigation('Bank Accounts',
      ['Name', 'Business', 'Type', 'Balance', 'Currency', 'Account Number', 'Default', 'Description'],
      bankAccountsData
    );

    // Payables
    const payablesData = safePayables.map(p => {
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
    });
    const payablesSheet = addNavigation('Payables',
      ['Vendor', 'Business', 'Amount', 'Paid', 'Currency', 'Due Date', 'Status', 'Category', 'Invoice Ref'],
      payablesData
    );

    // Receivables
    const receivablesData = safeReceivables.map(r => {
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
    });
    const receivablesSheet = addNavigation('Receivables',
      ['Source', 'Business', 'Client', 'Amount', 'Received', 'Currency', 'Due Date', 'Status', 'Invoice Ref'],
      receivablesData
    );

    // Per-Business Summary Sheets
    const businessSummarySheets: Record<string, any[][]> = {};
    safeBusinesses.forEach(business => {
      const businessProjects = safeProjects.filter(p => p.businessId === business.id);
      const summaryData: any[][] = [];
      
      let totalClientFee = 0;
      let totalPartnerShare = 0;
      let totalExpectedPay = 0;
      let totalAmountPaid = 0;
      let totalRemaining = 0;
      
      businessProjects.forEach(project => {
        const client = safeClients.find(c => c.id === project.clientId);
        
        // For each project, calculate partner allocations
        const allPartnerAllocations = [
          ...(project.allocationPartnerAllocations || []),
          ...(project.partnerAllocations || [])
        ];
        
        if (allPartnerAllocations.length === 0) {
          // No partner allocations - add row with 0% partner
          const status = project.clientPayments >= project.totalValue ? 'Paid' :
                         project.clientPayments > 0 ? 'Partial' : 'Not Paid';
          summaryData.push([
            formatDate(project.startDate),
            project.totalValue,
            client?.name || '',
            project.name,
            status,
            '0%',
            0,
            0,
            0,
            0,
            '',
          ]);
          totalClientFee += project.totalValue;
        } else {
          // Add row for each partner allocation
          allPartnerAllocations.forEach(allocation => {
            const partner = safePartners.find(p => p.id === allocation.partnerId);
            const status = allocation.outstanding <= 0 ? 'Paid' :
                           allocation.paidAmount > 0 ? 'Partial' : 'Not Paid';
            const allocationDisplay = allocation.allocationType === 'percentage' 
              ? `${allocation.allocationValue}%` 
              : `$${allocation.allocationValue}`;
            
            summaryData.push([
              formatDate(project.startDate),
              project.totalValue,
              client?.name || '',
              project.name,
              status,
              allocationDisplay,
              allocation.totalAllocated,
              allocation.totalAllocated,
              allocation.paidAmount,
              allocation.outstanding,
              partner?.name || allocation.partnerName || '',
            ]);
            
            totalClientFee += project.totalValue;
            totalPartnerShare += allocation.totalAllocated;
            totalExpectedPay += allocation.totalAllocated;
            totalAmountPaid += allocation.paidAmount;
            totalRemaining += allocation.outstanding;
          });
        }
      });
      
      // Add totals row
      if (summaryData.length > 0) {
        summaryData.push([]); // Empty row before totals
        summaryData.push([
          'TOTALS',
          totalClientFee,
          '',
          '',
          '',
          '',
          totalPartnerShare,
          totalExpectedPay,
          totalAmountPaid,
          totalRemaining,
          '',
        ]);
      }
      
      const sheetName = `${business.name} Summary`;
      businessSummarySheets[sheetName] = addNavigation(sheetName,
        ['Date', 'Client Fee', 'Client Name', 'Description', 'Status', 'Partner %', 'Partner $', 'Expected Pay', 'Amount Paid', 'Remaining', 'Partner'],
        summaryData
      );
      
      // Register dynamic sheet styling
      if (!SHEET_CATEGORIES[sheetName]) {
        SHEET_CATEGORIES[sheetName] = { 
          category: 'Business Reports', 
          tabColor: { red: 0.8, green: 0.5, blue: 0.2 } 
        };
      }
      if (!SHEET_COLORS[sheetName]) {
        SHEET_COLORS[sheetName] = { 
          header: { red: 0.8, green: 0.5, blue: 0.2 }, 
          alt: { red: 0.99, green: 0.97, blue: 0.94 } 
        };
      }
    });

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
      'Partner Payments': partnerPaymentsSheet,
      'Team Payments': teamPaymentsSheet,
      'Bank Accounts': bankAccountsSheet,
      'Payables': payablesSheet,
      'Receivables': receivablesSheet,
      ...businessSummarySheets,
    };
  }

  private getChartRequests(
    sheets: { properties: { sheetId: number; title: string } }[],
    sheetData: Record<string, any[][]>,
    data: AppData
  ): any[] {
    const requests: any[] = [];
    const dashboardSheet = sheets.find(s => s.properties.title === 'Dashboard');
    
    if (!dashboardSheet) return requests;
    
    const sheetId = dashboardSheet.properties.sheetId;

    // Projects Status Pie Chart (Row 21-25, columns A-B have data)
    requests.push({
      addChart: {
        chart: {
          spec: {
            title: 'Projects by Status',
            pieChart: {
              legendPosition: 'RIGHT_LEGEND',
              domain: {
                sourceRange: {
                  sources: [{ sheetId, startRowIndex: 21, endRowIndex: 25, startColumnIndex: 0, endColumnIndex: 1 }]
                }
              },
              series: {
                sourceRange: {
                  sources: [{ sheetId, startRowIndex: 21, endRowIndex: 25, startColumnIndex: 1, endColumnIndex: 2 }]
                }
              },
              pieHole: 0.4,
            },
            fontName: 'Proxima Nova',
          },
          position: {
            overlayPosition: {
              anchorCell: { sheetId, rowIndex: 30, columnIndex: 0 },
              widthPixels: 400,
              heightPixels: 280,
            }
          }
        }
      }
    });

    // Expense Breakdown Pie Chart (Row 21-26, columns D-E have data)
    requests.push({
      addChart: {
        chart: {
          spec: {
            title: 'Expense Breakdown',
            pieChart: {
              legendPosition: 'RIGHT_LEGEND',
              domain: {
                sourceRange: {
                  sources: [{ sheetId, startRowIndex: 21, endRowIndex: 26, startColumnIndex: 3, endColumnIndex: 4 }]
                }
              },
              series: {
                sourceRange: {
                  sources: [{ sheetId, startRowIndex: 21, endRowIndex: 26, startColumnIndex: 4, endColumnIndex: 5 }]
                }
              },
              pieHole: 0.4,
            },
            fontName: 'Proxima Nova',
          },
          position: {
            overlayPosition: {
              anchorCell: { sheetId, rowIndex: 30, columnIndex: 5 },
              widthPixels: 400,
              heightPixels: 280,
            }
          }
        }
      }
    });

    return requests;
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
      const categoryInfo = SHEET_CATEGORIES[title];

      // Apply Proxima Nova font to entire sheet
      requests.push({
        repeatCell: {
          range: { sheetId, startRowIndex: 0, endRowIndex: Math.max(rowCount, 50), startColumnIndex: 0, endColumnIndex: Math.max(columnCount, 10) },
          cell: {
            userEnteredFormat: {
              textFormat: { fontFamily: 'Proxima Nova' },
            },
          },
          fields: 'userEnteredFormat.textFormat.fontFamily',
        },
      });

      // Set sheet tab color
      if (categoryInfo) {
        requests.push({
          updateSheetProperties: {
            properties: {
              sheetId,
              tabColor: categoryInfo.tabColor,
            },
            fields: 'tabColor',
          },
        });
      }

      if (title === 'Dashboard') {
        // Dashboard title formatting - large and bold
        requests.push({
          repeatCell: {
            range: { sheetId, startRowIndex: 0, endRowIndex: 1, startColumnIndex: 0, endColumnIndex: 4 },
            cell: {
              userEnteredFormat: {
                textFormat: { bold: true, fontSize: 20, foregroundColor: { red: 1, green: 1, blue: 1 } },
                backgroundColor: colors.header,
                horizontalAlignment: 'LEFT',
                verticalAlignment: 'MIDDLE',
              },
            },
            fields: 'userEnteredFormat(textFormat,backgroundColor,horizontalAlignment,verticalAlignment)',
          },
        });

        // Navigation section header
        requests.push({
          repeatCell: {
            range: { sheetId, startRowIndex: 2, endRowIndex: 3, startColumnIndex: 0, endColumnIndex: 4 },
            cell: {
              userEnteredFormat: {
                textFormat: { bold: true, fontSize: 12, foregroundColor: { red: 0.2, green: 0.2, blue: 0.2 } },
                backgroundColor: { red: 0.95, green: 0.95, blue: 0.97 },
              },
            },
            fields: 'userEnteredFormat(textFormat,backgroundColor)',
          },
        });

        // Category headers (WORKS, PEOPLE, etc.)
        requests.push({
          repeatCell: {
            range: { sheetId, startRowIndex: 3, endRowIndex: 4, startColumnIndex: 0, endColumnIndex: 4 },
            cell: {
              userEnteredFormat: {
                textFormat: { bold: true, fontSize: 11, foregroundColor: { red: 1, green: 1, blue: 1 } },
                backgroundColor: { red: 0.31, green: 0.27, blue: 0.90 },
                horizontalAlignment: 'CENTER',
              },
            },
            fields: 'userEnteredFormat(textFormat,backgroundColor,horizontalAlignment)',
          },
        });

        // Navigation links styling
        for (let row = 4; row <= 7; row++) {
          requests.push({
            repeatCell: {
              range: { sheetId, startRowIndex: row, endRowIndex: row + 1, startColumnIndex: 0, endColumnIndex: 4 },
              cell: {
                userEnteredFormat: {
                  textFormat: { fontSize: 10, foregroundColor: { red: 0.15, green: 0.39, blue: 0.92 } },
                  horizontalAlignment: 'CENTER',
                },
              },
              fields: 'userEnteredFormat(textFormat,horizontalAlignment)',
            },
          });
        }

        // Key Metrics section header
        requests.push({
          repeatCell: {
            range: { sheetId, startRowIndex: 9, endRowIndex: 10, startColumnIndex: 0, endColumnIndex: 5 },
            cell: {
              userEnteredFormat: {
                textFormat: { bold: true, fontSize: 12, foregroundColor: { red: 0.2, green: 0.2, blue: 0.2 } },
                backgroundColor: { red: 0.95, green: 0.95, blue: 0.97 },
              },
            },
            fields: 'userEnteredFormat(textFormat,backgroundColor)',
          },
        });

        // Metrics labels
        requests.push({
          repeatCell: {
            range: { sheetId, startRowIndex: 10, endRowIndex: 11, startColumnIndex: 1, endColumnIndex: 5 },
            cell: {
              userEnteredFormat: {
                textFormat: { bold: true, fontSize: 10, foregroundColor: { red: 0.4, green: 0.4, blue: 0.4 } },
                backgroundColor: { red: 0.97, green: 0.97, blue: 0.98 },
                horizontalAlignment: 'CENTER',
              },
            },
            fields: 'userEnteredFormat(textFormat,backgroundColor,horizontalAlignment)',
          },
        });

        // Metrics values - large and bold
        requests.push({
          repeatCell: {
            range: { sheetId, startRowIndex: 11, endRowIndex: 13, startColumnIndex: 1, endColumnIndex: 5 },
            cell: {
              userEnteredFormat: {
                textFormat: { bold: true, fontSize: 16 },
                horizontalAlignment: 'CENTER',
                numberFormat: { type: 'NUMBER', pattern: '#,##0' },
              },
            },
            fields: 'userEnteredFormat(textFormat,horizontalAlignment,numberFormat)',
          },
        });

        // Financial Overview section header
        requests.push({
          repeatCell: {
            range: { sheetId, startRowIndex: 14, endRowIndex: 15, startColumnIndex: 0, endColumnIndex: 5 },
            cell: {
              userEnteredFormat: {
                textFormat: { bold: true, fontSize: 12, foregroundColor: { red: 0.2, green: 0.2, blue: 0.2 } },
                backgroundColor: { red: 0.94, green: 0.99, blue: 0.96 },
              },
            },
            fields: 'userEnteredFormat(textFormat,backgroundColor)',
          },
        });

        // Financial labels row
        requests.push({
          repeatCell: {
            range: { sheetId, startRowIndex: 15, endRowIndex: 16, startColumnIndex: 0, endColumnIndex: 5 },
            cell: {
              userEnteredFormat: {
                textFormat: { bold: true, fontSize: 10, foregroundColor: { red: 0.3, green: 0.3, blue: 0.3 } },
                backgroundColor: { red: 0.97, green: 0.98, blue: 0.97 },
              },
            },
            fields: 'userEnteredFormat(textFormat,backgroundColor)',
          },
        });

        // Financial values with number formatting
        requests.push({
          repeatCell: {
            range: { sheetId, startRowIndex: 16, endRowIndex: 19, startColumnIndex: 1, endColumnIndex: 2 },
            cell: {
              userEnteredFormat: {
                textFormat: { bold: true, fontSize: 11 },
                numberFormat: { type: 'NUMBER', pattern: '#,##0.00' },
              },
            },
            fields: 'userEnteredFormat(textFormat,numberFormat)',
          },
        });
        requests.push({
          repeatCell: {
            range: { sheetId, startRowIndex: 16, endRowIndex: 19, startColumnIndex: 4, endColumnIndex: 5 },
            cell: {
              userEnteredFormat: {
                textFormat: { bold: true, fontSize: 11 },
                numberFormat: { type: 'NUMBER', pattern: '#,##0.00' },
              },
            },
            fields: 'userEnteredFormat(textFormat,numberFormat)',
          },
        });

        // Projects Status & Expense Breakdown section headers
        requests.push({
          repeatCell: {
            range: { sheetId, startRowIndex: 20, endRowIndex: 21, startColumnIndex: 0, endColumnIndex: 2 },
            cell: {
              userEnteredFormat: {
                textFormat: { bold: true, fontSize: 11, foregroundColor: { red: 0.15, green: 0.39, blue: 0.92 } },
              },
            },
            fields: 'userEnteredFormat.textFormat',
          },
        });
        requests.push({
          repeatCell: {
            range: { sheetId, startRowIndex: 20, endRowIndex: 21, startColumnIndex: 3, endColumnIndex: 5 },
            cell: {
              userEnteredFormat: {
                textFormat: { bold: true, fontSize: 11, foregroundColor: { red: 0.86, green: 0.15, blue: 0.15 } },
              },
            },
            fields: 'userEnteredFormat.textFormat',
          },
        });

        // Chart data labels
        requests.push({
          repeatCell: {
            range: { sheetId, startRowIndex: 21, endRowIndex: 22, startColumnIndex: 0, endColumnIndex: 5 },
            cell: {
              userEnteredFormat: {
                textFormat: { bold: true, fontSize: 9, foregroundColor: { red: 0.5, green: 0.5, blue: 0.5 } },
                backgroundColor: { red: 0.97, green: 0.97, blue: 0.97 },
              },
            },
            fields: 'userEnteredFormat(textFormat,backgroundColor)',
          },
        });

        // Quick Stats section
        requests.push({
          repeatCell: {
            range: { sheetId, startRowIndex: 27, endRowIndex: 28, startColumnIndex: 0, endColumnIndex: 5 },
            cell: {
              userEnteredFormat: {
                textFormat: { bold: true, fontSize: 12, foregroundColor: { red: 0.2, green: 0.2, blue: 0.2 } },
                backgroundColor: { red: 0.95, green: 0.95, blue: 0.97 },
              },
            },
            fields: 'userEnteredFormat(textFormat,backgroundColor)',
          },
        });

        // Set row heights for better spacing
        requests.push({
          updateDimensionProperties: {
            range: { sheetId, dimension: 'ROWS', startIndex: 0, endIndex: 1 },
            properties: { pixelSize: 45 },
            fields: 'pixelSize',
          },
        });

        // Freeze nothing on dashboard (allow scrolling)
      } else {
        // Non-dashboard sheets: Navigation row styling
        requests.push({
          repeatCell: {
            range: { sheetId, startRowIndex: 0, endRowIndex: 1, startColumnIndex: 0, endColumnIndex: columnCount },
            cell: {
              userEnteredFormat: {
                textFormat: { fontSize: 10, foregroundColor: { red: 0.15, green: 0.39, blue: 0.92 } },
                backgroundColor: { red: 0.97, green: 0.97, blue: 0.99 },
              },
            },
            fields: 'userEnteredFormat(textFormat,backgroundColor)',
          },
        });

        // Data table header (row 3 = index 2)
        requests.push({
          repeatCell: {
            range: { sheetId, startRowIndex: 2, endRowIndex: 3, startColumnIndex: 0, endColumnIndex: columnCount },
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

        // Alternating row colors for data rows (starting from row 4 = index 3)
        if (rowCount > 3) {
          requests.push({
            addConditionalFormatRule: {
              rule: {
                ranges: [{ sheetId, startRowIndex: 3, endRowIndex: rowCount, startColumnIndex: 0, endColumnIndex: columnCount }],
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

        // Number formatting for amount columns (adjusted for navigation rows)
        const amountCols = AMOUNT_COLUMNS[title];
        if (amountCols && rowCount > 3) {
          for (const colIndex of amountCols) {
            requests.push({
              repeatCell: {
                range: { 
                  sheetId, 
                  startRowIndex: 3,  // Start after navigation + empty + header rows
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

        // Freeze header row (row 3 = index 2, so freeze 3 rows)
        requests.push({
          updateSheetProperties: {
            properties: {
              sheetId,
              gridProperties: { frozenRowCount: 3 },
            },
            fields: 'gridProperties.frozenRowCount',
          },
        });

        // Set row heights
        requests.push({
          updateDimensionProperties: {
            range: { sheetId, dimension: 'ROWS', startIndex: 0, endIndex: 1 },
            properties: { pixelSize: 28 },
            fields: 'pixelSize',
          },
        });
        requests.push({
          updateDimensionProperties: {
            range: { sheetId, dimension: 'ROWS', startIndex: 2, endIndex: 3 },
            properties: { pixelSize: 36 },
            fields: 'pixelSize',
          },
        });

        // Add borders to the data table (starting from header row)
        requests.push({
          updateBorders: {
            range: { sheetId, startRowIndex: 2, endRowIndex: rowCount, startColumnIndex: 0, endColumnIndex: columnCount },
            top: { style: 'SOLID', color: { red: 0.85, green: 0.85, blue: 0.85 } },
            bottom: { style: 'SOLID', color: { red: 0.85, green: 0.85, blue: 0.85 } },
            left: { style: 'SOLID', color: { red: 0.85, green: 0.85, blue: 0.85 } },
            right: { style: 'SOLID', color: { red: 0.85, green: 0.85, blue: 0.85 } },
            innerHorizontal: { style: 'SOLID', color: { red: 0.92, green: 0.92, blue: 0.92 } },
            innerVertical: { style: 'SOLID', color: { red: 0.92, green: 0.92, blue: 0.92 } },
          },
        });
      }

      // Auto-resize columns for all sheets
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
