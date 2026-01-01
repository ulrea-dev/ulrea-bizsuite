import React, { useState } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Building2, Wallet, ArrowLeft, Shield } from 'lucide-react';
import { BusinessManagement } from './BusinessManagement';
import { AccountsPage } from './AccountsPage';
import { BusinessSetup } from './BusinessSetup';
import { Button } from '@/components/ui/button';

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
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-6">
        <div className="max-w-4xl mx-auto">
          <BusinessSetup onComplete={handleBusinessSetupComplete} />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-[calc(100vh-2rem)] -m-4 sm:-m-6 md:-m-8">
      {/* Admin Header Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 border-b border-slate-700">
        <div className="px-4 sm:px-6 md:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button 
                variant="ghost" 
                size="sm" 
                asChild
                className="text-slate-300 hover:text-white hover:bg-slate-700"
              >
                <Link to="/dashboard">
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Back to Dashboard
                </Link>
              </Button>
              <div className="hidden sm:block h-6 w-px bg-slate-600" />
              <div className="hidden sm:flex items-center gap-2">
                <div className="p-1.5 rounded-md bg-amber-500/20 border border-amber-500/30">
                  <Shield className="h-4 w-4 text-amber-400" />
                </div>
                <span className="text-xs font-medium text-amber-400 uppercase tracking-wider">Admin Area</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 min-h-[calc(100vh-8rem)]">
        <div className="px-4 sm:px-6 md:px-8 py-6">
          {/* Page Header */}
          <div className="mb-8">
            <h1 className="text-2xl sm:text-3xl font-bold text-white">Business Management</h1>
            <p className="text-slate-400 text-sm sm:text-base mt-1">
              Manage your businesses, accounts, and financial tracking
            </p>
          </div>

          {/* Admin Tabs */}
          <Tabs value={activeTab} onValueChange={handleTabChange} className="space-y-6">
            <TabsList className="bg-slate-800/50 border border-slate-700 p-1 grid w-full grid-cols-2 max-w-md">
              <TabsTrigger 
                value="businesses" 
                className="gap-1.5 data-[state=active]:bg-slate-700 data-[state=active]:text-white text-slate-400"
              >
                <Building2 className="h-4 w-4" />
                Businesses
              </TabsTrigger>
              <TabsTrigger 
                value="accounts" 
                className="gap-1.5 data-[state=active]:bg-slate-700 data-[state=active]:text-white text-slate-400"
              >
                <Wallet className="h-4 w-4" />
                Accounts
              </TabsTrigger>
            </TabsList>

            <div className="bg-slate-800/30 border border-slate-700/50 rounded-xl p-4 sm:p-6">
              <TabsContent value="businesses" className="mt-0">
                <div className="[&_.dashboard-text-primary]:text-white [&_.dashboard-text-secondary]:text-slate-400 [&_.dashboard-surface]:bg-slate-800/50 [&_.dashboard-border]:border-slate-700 [&_.dashboard-surface-elevated]:bg-slate-700/50">
                  <BusinessManagement onCreateBusiness={handleCreateBusiness} />
                </div>
              </TabsContent>

              <TabsContent value="accounts" className="mt-0">
                <div className="[&_h1]:text-white [&_h2]:text-white [&_.text-muted-foreground]:text-slate-400 [&_[class*='Card']]:bg-slate-800/50 [&_[class*='Card']]:border-slate-700">
                  <AccountsPage />
                </div>
              </TabsContent>
            </div>
          </Tabs>
        </div>
      </div>
    </div>
  );
};
