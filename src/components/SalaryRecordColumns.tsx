
import React from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { MoreHorizontal, Eye, Edit, DollarSign } from 'lucide-react';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { SalaryRecord } from '@/types/business';
import { formatCurrency } from '@/utils/storage';
import { SUPPORTED_CURRENCIES } from '@/types/business';

interface SalaryRecordColumnsProps {
  onView: (record: SalaryRecord) => void;
  onEdit: (record: SalaryRecord) => void;
  onRecordPayment: (record: SalaryRecord) => void;
  getTeamMemberName: (memberId: string) => string;
}

export const createSalaryRecordColumns = ({ 
  onView, 
  onEdit, 
  onRecordPayment, 
  getTeamMemberName 
}: SalaryRecordColumnsProps) => [
  {
    header: 'Employee',
    cell: (record: SalaryRecord) => getTeamMemberName(record.teamMemberId),
  },
  {
    header: 'Position',
    accessorKey: 'position' as keyof SalaryRecord,
  },
  {
    header: 'Amount',
    cell: (record: SalaryRecord) => {
      const currency = SUPPORTED_CURRENCIES.find(c => c.code === record.currency) || SUPPORTED_CURRENCIES[0];
      return formatCurrency(record.amount, currency);
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
