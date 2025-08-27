
import React from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { MoreHorizontal, Eye, Edit, DollarSign, Building } from 'lucide-react';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { SalaryRecord } from '@/types/business';
import { formatCurrency } from '@/utils/storage';
import { SUPPORTED_CURRENCIES } from '@/types/business';

interface SalaryRecordColumnsProps {
  onView: (record: SalaryRecord) => void;
  onEdit: (record: SalaryRecord) => void;
  onRecordPayment: (record: SalaryRecord) => void;
  getTeamMemberName: (memberId: string) => string;
  getProjectName: (projectId: string) => string;
  getClientName: (clientId: string) => string;
  allCurrencies: Array<{ code: string; symbol: string; name: string; isCustom?: boolean }>;
}

export const createSalaryRecordColumns = ({ 
  onView, 
  onEdit, 
  onRecordPayment, 
  getTeamMemberName,
  getProjectName,
  getClientName,
  allCurrencies
}: SalaryRecordColumnsProps) => [
  {
    header: 'Employee',
    cell: (record: SalaryRecord) => (
      <div>
        <div className="font-medium">{getTeamMemberName(record.teamMemberId)}</div>
        {record.isProjectBased && record.projectId && (
          <div className="text-xs text-muted-foreground flex items-center gap-1">
            <Building className="h-3 w-3" />
            {getProjectName(record.projectId)}
          </div>
        )}
      </div>
    ),
  },
  {
    header: 'Position',
    accessorKey: 'position' as keyof SalaryRecord,
  },
  {
    header: 'Amount',
    cell: (record: SalaryRecord) => {
      const currency = allCurrencies.find(c => c.code === record.currency) || SUPPORTED_CURRENCIES[0];
      return (
        <div>
          <div>{formatCurrency(record.amount, currency)}</div>
          {record.isProjectBased && (
            <Badge variant="secondary" className="text-xs">
              Project-based
            </Badge>
          )}
        </div>
      );
    },
  },
  {
    header: 'Frequency',
    cell: (record: SalaryRecord) => (
      <Badge variant="outline">
        {record.frequency.charAt(0).toUpperCase() + record.frequency.slice(1)}
      </Badge>
    ),
  },
  {
    header: 'Start Date',
    cell: (record: SalaryRecord) => new Date(record.startDate).toLocaleDateString(),
  },
  {
    header: 'Actions',
    cell: (record: SalaryRecord) => (
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
