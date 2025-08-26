import React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Badge } from '@/components/ui/badge';
import { Building2, ChevronDown, Plus, Settings } from 'lucide-react';
import { useBusiness } from '@/contexts/BusinessContext';
import { formatCurrency } from '@/utils/storage';

interface BusinessSwitcherProps {
  onCreateBusiness: () => void;
  onManageBusinesses: () => void;
}

export const BusinessSwitcher: React.FC<BusinessSwitcherProps> = ({ 
  onCreateBusiness, 
  onManageBusinesses 
}) => {
  const { data, currentBusiness, switchBusiness } = useBusiness();
  
  if (!currentBusiness && data.businesses.length === 0) {
    return (
      <Button 
        onClick={onCreateBusiness}
        variant="outline" 
        className="w-full justify-start gap-2 text-left"
      >
        <Building2 className="h-4 w-4" />
        Create Your First Business
      </Button>
    );
  }

  if (!currentBusiness) {
    return (
      <Card>
        <CardContent className="p-4">
          <p className="text-sm dashboard-text-secondary mb-3">Select a business to continue</p>
          <div className="space-y-2">
            {data.businesses.map(business => (
              <Button
                key={business.id}
                variant="outline"
                className="w-full justify-start"
                onClick={() => switchBusiness(business.id)}
              >
                <Building2 className="h-4 w-4 mr-2" />
                {business.name}
              </Button>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" className="w-full justify-between">
          <div className="flex items-center gap-2">
            <Building2 className="h-4 w-4" />
            <div className="text-left">
              <div className="font-medium">{currentBusiness.name}</div>
              <div className="text-xs dashboard-text-secondary">
                {formatCurrency(currentBusiness.currentBalance, currentBusiness.currency)}
              </div>
            </div>
          </div>
          <ChevronDown className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-80" align="start">
        <div className="p-2">
          <div className="text-xs dashboard-text-secondary mb-2">CURRENT BUSINESS</div>
          <div className="p-3 dashboard-surface-elevated rounded-lg border dashboard-border">
            <div className="flex items-center justify-between mb-2">
              <div className="font-medium">{currentBusiness.name}</div>
              <Badge variant="outline">{currentBusiness.type}</Badge>
            </div>
            <div className="text-sm dashboard-text-secondary">
              Balance: {formatCurrency(currentBusiness.currentBalance, currentBusiness.currency)}
            </div>
          </div>
        </div>
        
        {data.businesses.length > 1 && (
          <>
            <DropdownMenuSeparator />
            <div className="p-2">
              <div className="text-xs dashboard-text-secondary mb-2">SWITCH TO</div>
              {data.businesses
                .filter(b => b.id !== currentBusiness.id)
                .map(business => (
                  <DropdownMenuItem
                    key={business.id}
                    onClick={() => switchBusiness(business.id)}
                    className="flex items-center justify-between p-3 cursor-pointer"
                  >
                    <div>
                      <div className="font-medium">{business.name}</div>
                      <div className="text-xs dashboard-text-secondary">
                        {formatCurrency(business.currentBalance, business.currency)}
                      </div>
                    </div>
                    <Badge variant="secondary" className="text-xs">{business.type}</Badge>
                  </DropdownMenuItem>
                ))}
            </div>
          </>
        )}
        
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={onCreateBusiness} className="flex items-center gap-2">
          <Plus className="h-4 w-4" />
          Create New Business
        </DropdownMenuItem>
        <DropdownMenuItem onClick={onManageBusinesses} className="flex items-center gap-2">
          <Settings className="h-4 w-4" />
          Manage Businesses
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};