
import React from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { MoreHorizontal, Eye, Edit, DollarSign, Building } from 'lucide-react';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { formatCurrency } from '@/utils/storage';
import { Currency } from '@/types/business';

// Combined salary record interface for display
interface CombinedSalaryRecord {
  id: string;
  teamMemberId: string;
  employeeName: string;
  position: string;
  totalAmount: number; // Combined amount in default currency
  totalAmountOriginal: number;
  currency: string;
  primarySalary?: any;
  secondarySalary?: any;
  frequency: string;
  startDate: string;
  projectInfo?: string;
}

interface SalaryRecordColumnsProps {
  onView: (record: CombinedSalaryRecord) => void;
  onEdit: (record: CombinedSalaryRecord) => void;
  onRecordPayment: (record: CombinedSalaryRecord) => void;
  getTeamMemberName: (memberId: string) => string;
  getProjectName: (projectId: string) => string;
  getClientName: (clientId: string) => string;
  allCurrencies: Currency[];
  defaultCurrency: Currency;
}

export const createSalaryRecordColumns = ({ 
  onView, 
  onEdit, 
  onRecordPayment, 
  getTeamMemberName,
  getProjectName,
  getClientName,
  allCurrencies,
  defaultCurrency
}: SalaryRecordColumnsProps) => [
  {
    header: 'Employee',
    cell: (record: CombinedSalaryRecord) => (
      <div>
        <div className="font-medium">{record.employeeName}</div>
        {record.projectInfo && (
          <div className="text-xs text-muted-foreground flex items-center gap-1">
            <Building className="h-3 w-3" />
            {record.projectInfo}
          </div>
        )}
        <div className="flex gap-1 mt-1">
          {record.primarySalary && (
            <Badge variant="secondary" className="text-xs">
              Primary
            </Badge>
          )}
          {record.secondarySalary && (
            <Badge variant="outline" className="text-xs">
              Secondary
            </Badge>
          )}
        </div>
      </div>
    ),
  },
  {
    header: 'Position',
    cell: (record: CombinedSalaryRecord) => (
      <div>
        <div className="font-medium">{record.position}</div>
        {record.secondarySalary && (record.secondarySalary as any).contractDuration && (
          <div className="text-xs text-muted-foreground">
            Contract: {(record.secondarySalary as any).contractDuration} months
          </div>
        )}
      </div>
    ),
  },
  {
    header: 'Total Amount',
    cell: (record: CombinedSalaryRecord) => (
      <div>
        <div className="font-medium">
          {formatCurrency(record.totalAmount, defaultCurrency)}
        </div>
        <div className="text-xs text-muted-foreground">
          Combined monthly equivalent
        </div>
        {record.primarySalary && record.secondarySalary && (
          <div className="text-xs text-muted-foreground mt-1">
            <div>Primary: {formatCurrency(
              record.primarySalary.amount, 
              allCurrencies.find(c => c.code === record.primarySalary.currency) || defaultCurrency
            )} ({record.primarySalary.frequency})</div>
            <div>Secondary: {formatCurrency(
              record.secondarySalary.amount, 
              allCurrencies.find(c => c.code === record.secondarySalary.currency) || defaultCurrency
            )} ({record.secondarySalary.frequency})</div>
          </div>
        )}
      </div>
    ),
  },
  {
    header: 'Frequency',
    cell: (record: CombinedSalaryRecord) => (
      <div className="space-y-1">
        {record.frequency.split(', ').map((freq, index) => (
          <Badge key={index} variant="outline" className="text-xs block w-fit">
            {freq}
          </Badge>
        ))}
      </div>
    ),
  },
  {
    header: 'Start Date',
    cell: (record: CombinedSalaryRecord) => new Date(record.startDate).toLocaleDateString(),
  },
  {
    header: 'Actions',
    cell: (record: CombinedSalaryRecord) => (
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" className="h-8 w-8 p-0">
            <MoreHorizontal className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem onClick={() => onView(record)}>
            <Eye className="mr-2 h-4 w-4" />
            View
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => onEdit(record)}>
            <Edit className="mr-2 h-4 w-4" />
            Edit
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => onRecordPayment(record)}>
            <DollarSign className="mr-2 h-4 w-4" />
            Record Payment
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    ),
  },
];
