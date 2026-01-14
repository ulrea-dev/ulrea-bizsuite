// Main application entry with routing and providers
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { BusinessProvider, useBusiness } from "./contexts/BusinessContext";
import { GoogleDriveProvider, useGoogleDrive } from "./contexts/GoogleDriveContext";
import { ProtectedRoute } from "./components/ProtectedRoute";
import { DashboardLayout } from "./layouts/DashboardLayout";
import { BusinessManagementLayout } from "./layouts/BusinessManagementLayout";
import { GoogleReconnectModal } from "./components/GoogleReconnectModal";
import { SyncRequiredOverlay } from "./components/SyncRequiredOverlay";
import NotFound from "./pages/NotFound";
import LoginPage from "./pages/LoginPage";
import DashboardPage from "./pages/DashboardPage";
import ProjectsPage from "./pages/ProjectsPage";
import QuickTasksPage from "./pages/QuickTasksPage";
import RetainersPage from "./pages/RetainersPage";
import RenewalsDashboardPage from "./pages/RenewalsDashboardPage";
import ProjectDetailPage from "./pages/ProjectDetailPage";
import RetainerDetailPage from "./pages/RetainerDetailPage";
import TeamPage from "./pages/TeamPage";
import ClientsPage from "./pages/ClientsPage";
import RevenuePage from "./pages/RevenuePage";
import PaymentsPage from "./pages/PaymentsPage";
import ExpensesPage from "./pages/ExpensesPage";
import SalariesPage from "./pages/SalariesPage";
import TaskPaymentsPage from "./pages/TaskPaymentsPage";
import AnalyticsPage from "./pages/AnalyticsPage";
import SettingsPage from "./pages/SettingsPage";
import { AdminOverview } from "./components/admin/AdminOverview";
import { BusinessesPage } from "./components/admin/BusinessesPage";
import { BankAccountsPage } from "./components/admin/BankAccountsPage";
import { PartnersPage as AdminPartnersPage } from "./components/admin/PartnersPage";
import { PartnerAllocationsPage } from "./components/admin/PartnerAllocationsPage";
import { PayablesPage } from "./components/admin/PayablesPage";
import { ReceivablesPage } from "./components/admin/ReceivablesPage";

// Component to handle Google Drive modals and overlays
const GoogleDriveOverlays = () => {
  const { 
    showReconnectModal, 
    isReconnecting, 
    handleReconnect, 
    remoteChange, 
    isRefreshingFromRemote, 
    refreshFromRemote 
  } = useGoogleDrive();
  const { dispatch } = useBusiness();

  const handleRefreshFromRemote = async () => {
    const data = await refreshFromRemote();
    if (data) {
      dispatch({ type: 'LOAD_DATA', payload: data });
    }
  };

  return (
    <>
      <GoogleReconnectModal
        open={showReconnectModal}
        isReconnecting={isReconnecting}
        onReconnect={handleReconnect}
      />
      {remoteChange && (
        <SyncRequiredOverlay
          modifiedBy={remoteChange.modifiedBy}
          modifiedAt={remoteChange.modifiedAt}
          isRefreshing={isRefreshingFromRemote}
          onRefresh={handleRefreshFromRemote}
        />
      )}
    </>
  );
};

const App = () => (
  <BrowserRouter>
    <BusinessProvider>
      <GoogleDriveProvider>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route element={<ProtectedRoute />}>
            <Route element={<DashboardLayout />}>
              <Route path="/" element={<Navigate to="/dashboard" replace />} />
              <Route path="/dashboard" element={<DashboardPage />} />
              
              {/* Works Section */}
              <Route path="/works" element={<Navigate to="/works/projects" replace />} />
              <Route path="/works/projects" element={<ProjectsPage />} />
              <Route path="/works/projects/:projectId" element={<ProjectDetailPage />} />
              <Route path="/works/quick-tasks" element={<QuickTasksPage />} />
              <Route path="/works/retainers" element={<RetainersPage />} />
              <Route path="/works/retainers/:retainerId" element={<RetainerDetailPage />} />
              <Route path="/works/renewals" element={<RenewalsDashboardPage />} />
              
              {/* Financials Section */}
              <Route path="/financials" element={<Navigate to="/financials/revenue" replace />} />
              <Route path="/financials/revenue" element={<RevenuePage />} />
              <Route path="/financials/payments" element={<PaymentsPage />} />
              <Route path="/financials/expenses" element={<ExpensesPage />} />
              <Route path="/financials/salaries" element={<SalariesPage />} />
              <Route path="/financials/tasks" element={<TaskPaymentsPage />} />
              
              {/* Backwards compatibility redirects */}
              <Route path="/projects" element={<Navigate to="/works/projects" replace />} />
              <Route path="/projects/:projectId" element={<Navigate to="/works/projects" replace />} />
              
              <Route path="/team" element={<TeamPage />} />
              <Route path="/clients" element={<ClientsPage />} />
              <Route path="/analytics" element={<AnalyticsPage />} />
              <Route path="/settings" element={<SettingsPage />} />
            </Route>
            <Route element={<BusinessManagementLayout />}>
              <Route path="/business-management" element={<AdminOverview />} />
              <Route path="/business-management/businesses" element={<BusinessesPage />} />
              <Route path="/business-management/bank-accounts" element={<BankAccountsPage />} />
              <Route path="/business-management/partners" element={<AdminPartnersPage />} />
              <Route path="/business-management/partner-allocations" element={<PartnerAllocationsPage />} />
              <Route path="/business-management/payables" element={<PayablesPage />} />
              <Route path="/business-management/receivables" element={<ReceivablesPage />} />
            </Route>
          </Route>
          <Route path="*" element={<NotFound />} />
        </Routes>
        <GoogleDriveOverlays />
        <Toaster />
        <Sonner />
      </GoogleDriveProvider>
    </BusinessProvider>
  </BrowserRouter>
);

export default App;
