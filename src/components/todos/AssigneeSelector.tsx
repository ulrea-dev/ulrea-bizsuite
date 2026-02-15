import React, { useMemo, useState, useEffect } from 'react';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { X, Users, Check, Filter } from 'lucide-react';
import { useBusiness } from '@/contexts/BusinessContext';
import { useGoogleDrive } from '@/contexts/GoogleDriveContext';
import { ToDoAssignee, ToDoAssigneeType } from '@/types/business';
import { cn } from '@/lib/utils';
import { Checkbox } from '@/components/ui/checkbox';
import { SharedUser } from '@/types/googleDrive';

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
  const [filterByBusiness, setFilterByBusiness] = useState(false);
  const { data } = useBusiness();
  const { isConnected, getSharedUsers, settings } = useGoogleDrive();
  const [driveUsers, setDriveUsers] = useState<SharedUser[]>([]);

  // Fetch Google Drive shared users
  useEffect(() => {
    if (isConnected) {
      getSharedUsers().then(users => setDriveUsers(users)).catch(() => {});
    }
  }, [isConnected, getSharedUsers]);

  // Build operators from Google Drive shared users (writers/owners)
  const operators = useMemo(() => {
    const operatorList: PersonOption[] = [];
    const currentEmail = settings.connectedEmail;

    // Add current user (self) as first operator using their Google account name
    operatorList.push({
      id: data.userSettings.userId || 'current-user',
      name: data.userSettings.username || currentEmail || 'Me',
      type: 'operator' as ToDoAssigneeType,
      subtitle: currentEmail ? `${currentEmail} · Owner` : 'Owner',
    });

    // Add Google Drive shared users (writers/owners only, exclude current user)
    driveUsers
      .filter(u => (u.role === 'writer' || u.role === 'owner') && u.email !== currentEmail)
      .forEach(user => {
        operatorList.push({
          id: user.email, // Use email as stable ID
          name: user.displayName || user.email,
          type: 'operator' as ToDoAssigneeType,
          subtitle: `${user.email} · ${user.role === 'owner' ? 'Owner' : 'Editor'}`,
        });
      });

    return operatorList;
  }, [driveUsers, settings.connectedEmail, data.userSettings]);

  // Get team members (optionally filtered by business)
  const teamMembers = useMemo(() => {
    let members = data.teamMembers || [];
    if (filterByBusiness && businessId) {
      members = members.filter(m => m.businessIds?.includes(businessId));
    }
    return members.map(m => ({
      id: m.id,
      name: m.name,
      type: 'team-member' as ToDoAssigneeType,
      subtitle: m.role,
    }));
  }, [data.teamMembers, filterByBusiness, businessId]);

  // Get partners (optionally filtered by business)
  const partners = useMemo(() => {
    let partnerList = data.partners || [];
    if (filterByBusiness && businessId) {
      partnerList = partnerList.filter(p => p.businessIds?.includes(businessId));
    }
    return partnerList.map(p => ({
      id: p.id,
      name: p.name,
      type: 'partner' as ToDoAssigneeType,
      subtitle: p.type,
    }));
  }, [data.partners, filterByBusiness, businessId]);

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
    <div className="space-y-2">
      <Label className="flex items-center gap-2">
        <Users className="h-4 w-4" />
        Assign To
        {assignees.length > 0 && (
          <Badge variant="secondary" className="text-xs ml-1">
            {assignees.length}
          </Badge>
        )}
      </Label>

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
      <div className="border rounded-lg max-h-[200px] overflow-y-auto">
        {/* Filter toggle inside the list */}
        {businessId && (
          <div className="sticky top-0 z-10 bg-background border-b px-3 py-1.5 flex items-center gap-1.5">
            <label className="flex items-center gap-1.5 text-xs text-muted-foreground cursor-pointer">
              <Checkbox
                checked={filterByBusiness}
                onCheckedChange={(checked) => setFilterByBusiness(checked === true)}
                className="h-3 w-3"
              />
              <Filter className="h-3 w-3" />
              <span>Show only this business</span>
            </label>
          </div>
        )}

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
          <div className="p-2 border-t">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide px-2 pb-1">
              Team Members
            </p>
            {teamMembers.map(renderCheckbox)}
          </div>
        )}

        {/* Partners */}
        {partners.length > 0 && (
          <div className="p-2 border-t">
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
