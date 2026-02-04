import React, { useMemo } from 'react';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { X, Users, Check } from 'lucide-react';
import { useBusiness } from '@/contexts/BusinessContext';
import { ToDoAssignee, ToDoAssigneeType } from '@/types/business';
import { cn } from '@/lib/utils';

interface AssigneeSelectorProps {
  assignees: ToDoAssignee[];
  businessId?: string;
  onChange: (assignees: ToDoAssignee[]) => void;
}

interface PersonOption {
  id: string;
  name: string;
  type: ToDoAssigneeType;
  subtitle?: string;
}

export const AssigneeSelector: React.FC<AssigneeSelectorProps> = ({
  assignees,
  businessId,
  onChange,
}) => {
  const { data } = useBusiness();

  // Build Self option
  const selfOption: PersonOption = useMemo(() => ({
    id: data.userSettings.userId || 'self',
    name: data.userSettings.username || 'Self',
    type: 'self',
  }), [data.userSettings]);

  // Get operators (users with owner/admin roles)
  const operators = useMemo(() => {
    const accessList = data.userBusinessAccess || [];
    const operatorList: PersonOption[] = [];
    
    // Add current user as operator (always has access)
    const currentUserId = data.userSettings.userId;
    const currentUserInList = accessList.find(a => a.userId === currentUserId);
    
    if (!currentUserInList || currentUserInList.role === 'owner' || currentUserInList.role === 'admin') {
      operatorList.push({
        id: currentUserId || 'current-user',
        name: data.userSettings.username || 'Me',
        type: 'operator' as ToDoAssigneeType,
        subtitle: currentUserInList?.role || 'owner',
      });
    }
    
    // Add other operators from access list (exclude current user to avoid duplicates)
    accessList
      .filter(access => 
        (access.role === 'owner' || access.role === 'admin') && 
        access.userId !== currentUserId
      )
      .forEach(access => {
        operatorList.push({
          id: access.userId,
          name: access.email || `User ${access.userId.slice(0, 8)}`,
          type: 'operator' as ToDoAssigneeType,
          subtitle: access.role,
        });
      });
    
    return operatorList;
  }, [data.userBusinessAccess, data.userSettings]);

  // Get team members (filtered by business if provided)
  const teamMembers = useMemo(() => {
    let members = data.teamMembers || [];
    console.log('[AssigneeSelector] All team members:', members, 'businessId:', businessId);
    if (businessId) {
      members = members.filter(m => m.businessIds?.includes(businessId));
      console.log('[AssigneeSelector] Filtered team members:', members);
    }
    return members.map(m => ({
      id: m.id,
      name: m.name,
      type: 'team-member' as ToDoAssigneeType,
      subtitle: m.role,
    }));
  }, [data.teamMembers, businessId]);

  // Get partners (filtered by business if provided)
  const partners = useMemo(() => {
    let partnerList = data.partners || [];
    console.log('[AssigneeSelector] All partners:', partnerList, 'businessId:', businessId);
    if (businessId) {
      partnerList = partnerList.filter(p => p.businessIds?.includes(businessId));
      console.log('[AssigneeSelector] Filtered partners:', partnerList);
    }
    return partnerList.map(p => ({
      id: p.id,
      name: p.name,
      type: 'partner' as ToDoAssigneeType,
      subtitle: p.type,
    }));
  }, [data.partners, businessId]);

  const isSelected = (option: PersonOption) => {
    return assignees.some(a => a.id === option.id && a.type === option.type);
  };

  const toggleAssignee = (option: PersonOption) => {
    if (isSelected(option)) {
      onChange(assignees.filter(a => !(a.id === option.id && a.type === option.type)));
    } else {
      onChange([...assignees, { type: option.type, id: option.id, name: option.name }]);
    }
  };

  const removeAssignee = (assignee: ToDoAssignee) => {
    onChange(assignees.filter(a => !(a.id === assignee.id && a.type === assignee.type)));
  };

  const renderCheckbox = (option: PersonOption) => {
    const selected = isSelected(option);
    return (
      <div
        key={`${option.type}-${option.id}`}
        className="flex items-center gap-3 py-2 px-2 rounded hover:bg-muted/50 cursor-pointer"
        onClick={() => toggleAssignee(option)}
      >
        <div
          className={cn(
            "h-4 w-4 shrink-0 rounded-sm border border-primary flex items-center justify-center",
            selected && "bg-primary text-primary-foreground"
          )}
        >
          {selected && <Check className="h-3 w-3" strokeWidth={3} />}
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium truncate">{option.name}</p>
          {option.subtitle && (
            <p className="text-xs text-muted-foreground truncate">{option.subtitle}</p>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <Label className="flex items-center gap-2">
          <Users className="h-4 w-4" />
          Assign To
        </Label>
        {assignees.length > 0 && (
          <Badge variant="secondary" className="text-xs">
            {assignees.length} selected
          </Badge>
        )}
      </div>

      {/* Selected Assignees Chips */}
      {assignees.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {assignees.map((assignee) => (
            <Badge
              key={`${assignee.type}-${assignee.id}`}
              variant="outline"
              className="pr-1 flex items-center gap-1"
            >
              <span className="text-xs">{assignee.name}</span>
              <button
                type="button"
                onClick={() => removeAssignee(assignee)}
                className="ml-0.5 hover:bg-muted rounded-full p-0.5"
              >
                <X className="h-3 w-3" />
              </button>
            </Badge>
          ))}
        </div>
      )}

      {/* Assignee Options */}
      <div className="border rounded-lg divide-y max-h-[280px] overflow-y-auto">
        {/* Self */}
        <div className="p-2">
          {renderCheckbox(selfOption)}
        </div>

        {/* Operators */}
        {operators.length > 0 && (
          <div className="p-2">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide px-2 pb-1">
              Operators
            </p>
            {operators.map(renderCheckbox)}
          </div>
        )}

        {/* Team Members */}
        {teamMembers.length > 0 && (
          <div className="p-2">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide px-2 pb-1">
              Team Members
            </p>
            {teamMembers.map(renderCheckbox)}
          </div>
        )}

        {/* Partners */}
        {partners.length > 0 && (
          <div className="p-2">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide px-2 pb-1">
              Partners
            </p>
            {partners.map(renderCheckbox)}
          </div>
        )}

        {/* Empty State */}
        {operators.length === 0 && teamMembers.length === 0 && partners.length === 0 && (
          <div className="p-4 text-center text-sm text-muted-foreground">
            No team members or partners available.
            {businessId && ' Try selecting a different business.'}
          </div>
        )}
      </div>
    </div>
  );
};
