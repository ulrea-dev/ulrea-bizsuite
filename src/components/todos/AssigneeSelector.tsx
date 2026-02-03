import React, { useMemo } from 'react';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useBusiness } from '@/contexts/BusinessContext';
import { ToDoAssigneeType } from '@/types/business';

interface AssigneeSelectorProps {
  assigneeType: ToDoAssigneeType;
  assigneeId?: string;
  businessId?: string;
  onSelect: (type: ToDoAssigneeType, id?: string, name?: string) => void;
}

export const AssigneeSelector: React.FC<AssigneeSelectorProps> = ({
  assigneeType,
  assigneeId,
  businessId,
  onSelect,
}) => {
  const { data } = useBusiness();

  // Get operators (users with owner/admin roles)
  const operators = useMemo(() => {
    const accessList = data.userBusinessAccess || [];
    return accessList
      .filter(access => access.role === 'owner' || access.role === 'admin')
      .map(access => ({
        id: access.userId,
        name: access.email || `User ${access.userId.slice(0, 8)}`,
        role: access.role,
      }));
  }, [data.userBusinessAccess]);

  // Get team members (filtered by business if provided)
  const teamMembers = useMemo(() => {
    let members = data.teamMembers || [];
    if (businessId) {
      members = members.filter(m => m.businessIds?.includes(businessId));
    }
    return members.map(m => ({
      id: m.id,
      name: m.name,
      role: m.role,
    }));
  }, [data.teamMembers, businessId]);

  // Get partners (filtered by business if provided)
  const partners = useMemo(() => {
    let partnerList = data.partners || [];
    if (businessId) {
      partnerList = partnerList.filter(p => p.businessIds?.includes(businessId));
    }
    return partnerList.map(p => ({
      id: p.id,
      name: p.name,
      type: p.type,
    }));
  }, [data.partners, businessId]);

  const handleTypeChange = (type: ToDoAssigneeType) => {
    if (type === 'self') {
      onSelect('self', data.userSettings.userId, data.userSettings.username || 'Self');
    } else {
      onSelect(type, '', '');
    }
  };

  const handlePersonSelect = (personId: string) => {
    if (assigneeType === 'operator') {
      const operator = operators.find(o => o.id === personId);
      onSelect('operator', personId, operator?.name);
    } else if (assigneeType === 'team-member') {
      const member = teamMembers.find(m => m.id === personId);
      onSelect('team-member', personId, member?.name);
    } else if (assigneeType === 'partner') {
      const partner = partners.find(p => p.id === personId);
      onSelect('partner', personId, partner?.name);
    }
  };

  return (
    <div className="space-y-3">
      <Label>Assign To</Label>
      
      <RadioGroup
        value={assigneeType}
        onValueChange={(v) => handleTypeChange(v as ToDoAssigneeType)}
        className="space-y-2"
      >
        <div className="flex items-center space-x-2">
          <RadioGroupItem value="self" id="self" />
          <Label htmlFor="self" className="font-normal cursor-pointer">
            Self ({data.userSettings.username || 'Me'})
          </Label>
        </div>

        {operators.length > 0 && (
          <div className="flex items-center space-x-2">
            <RadioGroupItem value="operator" id="operator" />
            <Label htmlFor="operator" className="font-normal cursor-pointer">
              Operator
            </Label>
          </div>
        )}

        {teamMembers.length > 0 && (
          <div className="flex items-center space-x-2">
            <RadioGroupItem value="team-member" id="team-member" />
            <Label htmlFor="team-member" className="font-normal cursor-pointer">
              Team Member
            </Label>
          </div>
        )}

        {partners.length > 0 && (
          <div className="flex items-center space-x-2">
            <RadioGroupItem value="partner" id="partner" />
            <Label htmlFor="partner" className="font-normal cursor-pointer">
              Partner
            </Label>
          </div>
        )}
      </RadioGroup>

      {/* Person selector dropdown */}
      {assigneeType !== 'self' && (
        <Select value={assigneeId || ''} onValueChange={handlePersonSelect}>
          <SelectTrigger>
            <SelectValue placeholder={`Select ${assigneeType.replace('-', ' ')}`} />
          </SelectTrigger>
          <SelectContent>
            {assigneeType === 'operator' && operators.map((op) => (
              <SelectItem key={op.id} value={op.id}>
                {op.name} ({op.role})
              </SelectItem>
            ))}
            {assigneeType === 'team-member' && teamMembers.map((member) => (
              <SelectItem key={member.id} value={member.id}>
                {member.name} • {member.role}
              </SelectItem>
            ))}
            {assigneeType === 'partner' && partners.map((partner) => (
              <SelectItem key={partner.id} value={partner.id}>
                {partner.name} ({partner.type})
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      )}
    </div>
  );
};
