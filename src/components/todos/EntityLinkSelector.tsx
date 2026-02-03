import React, { useMemo } from 'react';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useBusiness } from '@/contexts/BusinessContext';
import { ToDoLinkType } from '@/types/business';

interface EntityLinkSelectorProps {
  linkType: ToDoLinkType;
  linkedEntityId?: string;
  businessId?: string;
  onSelect: (type: ToDoLinkType, id?: string, name?: string) => void;
}

export const EntityLinkSelector: React.FC<EntityLinkSelectorProps> = ({
  linkType,
  linkedEntityId,
  businessId,
  onSelect,
}) => {
  const { data, currentBusiness } = useBusiness();
  const businessModel = currentBusiness?.businessModel || 'service';

  // Get entities filtered by business
  const entities = useMemo(() => {
    const filterByBusiness = <T extends { businessId: string }>(items: T[]) => {
      if (!businessId) return items;
      return items.filter(item => item.businessId === businessId);
    };

    return {
      projects: filterByBusiness(data.projects),
      quickTasks: filterByBusiness(data.quickTasks),
      retainers: filterByBusiness(data.retainers),
      clients: data.clients, // Clients don't have businessId
      products: filterByBusiness(data.products),
      salesOrders: filterByBusiness(data.salesOrders),
      customers: filterByBusiness(data.customers),
      expenses: filterByBusiness(data.expenses),
      renewals: filterByBusiness(data.renewals),
    };
  }, [data, businessId]);

  // Available link types based on business model
  const availableLinkTypes = useMemo(() => {
    const serviceTypes: { value: ToDoLinkType; label: string }[] = [
      { value: 'general', label: 'None (General Task)' },
      { value: 'project', label: 'Project' },
      { value: 'quick-task', label: 'Quick Task' },
      { value: 'retainer', label: 'Retainer' },
      { value: 'client', label: 'Client' },
      { value: 'renewal', label: 'Renewal' },
      { value: 'expense', label: 'Expense' },
    ];

    const productTypes: { value: ToDoLinkType; label: string }[] = [
      { value: 'general', label: 'None (General Task)' },
      { value: 'product', label: 'Product' },
      { value: 'sales-order', label: 'Sales Order' },
      { value: 'expense', label: 'Expense' },
    ];

    if (businessModel === 'service') return serviceTypes;
    if (businessModel === 'product') return productTypes;
    // Hybrid - show all
    return [
      { value: 'general', label: 'None (General Task)' },
      { value: 'project', label: 'Project' },
      { value: 'quick-task', label: 'Quick Task' },
      { value: 'retainer', label: 'Retainer' },
      { value: 'client', label: 'Client' },
      { value: 'product', label: 'Product' },
      { value: 'sales-order', label: 'Sales Order' },
      { value: 'renewal', label: 'Renewal' },
      { value: 'expense', label: 'Expense' },
    ];
  }, [businessModel]);

  const handleTypeChange = (type: ToDoLinkType) => {
    onSelect(type, '', '');
  };

  const handleEntitySelect = (entityId: string) => {
    let name = '';
    
    switch (linkType) {
      case 'project':
        name = entities.projects.find(p => p.id === entityId)?.name || '';
        break;
      case 'quick-task':
        name = entities.quickTasks.find(t => t.id === entityId)?.title || '';
        break;
      case 'retainer':
        name = entities.retainers.find(r => r.id === entityId)?.name || '';
        break;
      case 'client':
        name = entities.clients.find(c => c.id === entityId)?.name || '';
        break;
      case 'product':
        name = entities.products.find(p => p.id === entityId)?.name || '';
        break;
      case 'sales-order':
        name = entities.salesOrders.find(o => o.id === entityId)?.orderNumber || '';
        break;
      case 'expense':
        name = entities.expenses.find(e => e.id === entityId)?.name || '';
        break;
      case 'renewal':
        name = entities.renewals.find(r => r.id === entityId)?.name || '';
        break;
    }

    onSelect(linkType, entityId, name);
  };

  const getEntityOptions = () => {
    switch (linkType) {
      case 'project':
        return entities.projects.map(p => ({ id: p.id, label: p.name }));
      case 'quick-task':
        return entities.quickTasks.map(t => ({ id: t.id, label: t.title }));
      case 'retainer':
        return entities.retainers.map(r => ({ id: r.id, label: r.name }));
      case 'client':
        return entities.clients.map(c => ({ id: c.id, label: `${c.name} - ${c.company}` }));
      case 'product':
        return entities.products.map(p => ({ id: p.id, label: `${p.name} (${p.sku})` }));
      case 'sales-order':
        return entities.salesOrders.map(o => ({ id: o.id, label: o.orderNumber }));
      case 'expense':
        return entities.expenses.map(e => ({ id: e.id, label: e.name }));
      case 'renewal':
        return entities.renewals.map(r => ({ id: r.id, label: r.name }));
      default:
        return [];
    }
  };

  const entityOptions = getEntityOptions();

  return (
    <div className="space-y-3">
      <Label>Link To</Label>
      
      <Select value={linkType} onValueChange={(v) => handleTypeChange(v as ToDoLinkType)}>
        <SelectTrigger>
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {availableLinkTypes.map((type) => (
            <SelectItem key={type.value} value={type.value}>
              {type.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      {linkType !== 'general' && entityOptions.length > 0 && (
        <Select value={linkedEntityId || ''} onValueChange={handleEntitySelect}>
          <SelectTrigger>
            <SelectValue placeholder={`Select ${linkType.replace('-', ' ')}`} />
          </SelectTrigger>
          <SelectContent>
            {entityOptions.map((option) => (
              <SelectItem key={option.id} value={option.id}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      )}

      {linkType !== 'general' && entityOptions.length === 0 && (
        <p className="text-sm text-muted-foreground">
          No {linkType.replace('-', ' ')}s found{businessId ? ' for this business' : ''}.
        </p>
      )}
    </div>
  );
};
