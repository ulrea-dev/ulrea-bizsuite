import React, { useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Building2, Wallet } from 'lucide-react';
import { BusinessManagement } from './BusinessManagement';
import { AccountsPage } from './AccountsPage';
import { BusinessSetup } from './BusinessSetup';


const VALID_TABS = ['businesses', 'accounts'] as const;
type TabValue = typeof VALID_TABS[number];

export const BusinessManagementPage: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const tabParam = searchParams.get('tab');
  const activeTab: TabValue = VALID_TABS.includes(tabParam as TabValue) ? (tabParam as TabValue) : 'businesses';
  
  const [showBusinessSetup, setShowBusinessSetup] = useState(false);

  const handleTabChange = (value: string) => {
    setSearchParams({ tab: value });
  };

  const handleCreateBusiness = () => {
    setShowBusinessSetup(true);
  };

  const handleBusinessSetupComplete = () => {
    setShowBusinessSetup(false);
  };

  if (showBusinessSetup) {
    return (
      <div className="space-y-6">
        <BusinessSetup onComplete={handleBusinessSetupComplete} />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold">Business Management</h1>
        <p className="text-muted-foreground text-sm sm:text-base">
          Manage your businesses, accounts, and financial tracking
        </p>
      </div>

      <Tabs value={activeTab} onValueChange={handleTabChange} className="space-y-6">
        <TabsList className="grid w-full grid-cols-2 max-w-md">
          <TabsTrigger value="businesses" className="gap-1.5">
            <Building2 className="h-4 w-4" />
            Businesses
          </TabsTrigger>
          <TabsTrigger value="accounts" className="gap-1.5">
            <Wallet className="h-4 w-4" />
            Accounts
          </TabsTrigger>
        </TabsList>

        <TabsContent value="businesses">
          <BusinessManagement onCreateBusiness={handleCreateBusiness} />
        </TabsContent>

        <TabsContent value="accounts">
          <AccountsPage />
        </TabsContent>
      </Tabs>
    </div>
  );
};
