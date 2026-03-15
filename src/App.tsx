// Main application entry with routing and providers
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { LandingPage } from "./pages/LandingPage";
import { AboutPage } from "./pages/AboutPage";
import { PrivacyPage } from "./pages/PrivacyPage";
import { TermsPage } from "./pages/TermsPage";
import { FeaturesOperationsPage } from "./pages/FeaturesOperationsPage";
import { FeaturesBackOfficePage } from "./pages/FeaturesBackOfficePage";
import { FeaturesTodoPage } from "./pages/FeaturesTodoPage";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { BusinessProvider, useBusiness, setRestoringData } from "./contexts/BusinessContext";
import { GoogleDriveProvider, useGoogleDrive } from "./contexts/GoogleDriveContext";
import { ProtectedRoute } from "./components/ProtectedRoute";
import { DashboardLayout } from "./layouts/DashboardLayout";
import { HubLayout } from "./layouts/HubLayout";
import { BusinessManagementLayout } from "./layouts/BusinessManagementLayout";
import { TodoLayout } from "./layouts/TodoLayout";
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
import { BusinessAccessPage } from "./components/admin/BusinessAccessPage";
import { TeamMembersPage } from "./components/admin/TeamMembersPage";
import { BankAccountsPage } from "./components/admin/BankAccountsPage";
import { PartnersPage as AdminPartnersPage } from "./components/admin/PartnersPage";
import { PartnerAllocationsPage } from "./components/admin/PartnerAllocationsPage";
import { PayablesPage } from "./components/admin/PayablesPage";
import { ReceivablesPage } from "./components/admin/ReceivablesPage";
import ProductsPage from "./pages/ProductsPage";
import CustomersPage from "./pages/CustomersPage";
import SalesPage from "./pages/SalesPage";
import InventoryPage from "./pages/InventoryPage";
import ProductionPage from "./pages/ProductionPage";
import ProcurementPage from "./pages/ProcurementPage";
import { TodoOverview } from "./components/todos/TodoOverview";
import { TodayPage } from "./components/todos/TodayPage";
import { WeekPage } from "./components/todos/WeekPage";
import { UpcomingPage } from "./components/todos/UpcomingPage";
import { OverduePage } from "./components/todos/OverduePage";
import { AllTodosPage } from "./components/todos/AllTodosPage";
import { ByAssigneePage } from "./components/todos/ByAssigneePage";

// Component to handle Google Drive modals and overlays
const GoogleDriveOverlays = () => {
  const { 
    showReconnectModal, 
    isReconnecting,
    reconnectSuccess,
    handleReconnect,
    closeReconnectModal,
    remoteChange, 
    isRefreshingFromRemote, 
    refreshFromRemote 
  } = useGoogleDrive();
  const { dispatch } = useBusiness();

  const handleRefreshFromRemote = async () => {
    const data = await refreshFromRemote();
    if (data) {
      // CRITICAL: Prevent auto-sync during restore to avoid infinite loop
      setRestoringData(true);
      dispatch({ type: 'LOAD_DATA', payload: data });
      // Reset after a short delay to allow the useEffect to process
      setTimeout(() => setRestoringData(false), 100);
    }
  };

  return (
    <>
      <GoogleReconnectModal
        open={showReconnectModal}
        isReconnecting={isReconnecting}
        reconnectSuccess={reconnectSuccess}
        onReconnect={handleReconnect}
        onClose={closeReconnectModal}
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
            <Route element={<HubLayout />}>
              <Route path="/" element={<Navigate to="/dashboard" replace />} />
              <Route path="/dashboard" element={<DashboardPage />} />
              <Route path="/settings" element={<SettingsPage />} />
            </Route>
            <Route element={<DashboardLayout />}>
              
              {/* Works Section */}
              <Route path="/works" element={<Navigate to="/works/projects" replace />} />
              <Route path="/works/projects" element={<ProjectsPage />} />
              <Route path="/works/projects/:projectId" element={<ProjectDetailPage />} />
              <Route path="/works/quick-tasks" element={<QuickTasksPage />} />
              <Route path="/works/retainers" element={<RetainersPage />} />
              <Route path="/works/retainers/:retainerId" element={<RetainerDetailPage />} />
              <Route path="/works/renewals" element={<RenewalsDashboardPage />} />
              
              {/* Products Section (for product/hybrid businesses) */}
              <Route path="/products" element={<ProductsPage />} />
              <Route path="/sales" element={<SalesPage />} />
              <Route path="/customers" element={<CustomersPage />} />
              <Route path="/inventory" element={<InventoryPage />} />
              <Route path="/production" element={<ProductionPage />} />
              <Route path="/procurement" element={<ProcurementPage />} />
              
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
              
              <Route path="/team" element={<Navigate to="/business-management/team-members" replace />} />
              <Route path="/clients" element={<ClientsPage />} />
              <Route path="/analytics" element={<AnalyticsPage />} />
            </Route>
            <Route element={<BusinessManagementLayout />}>
              <Route path="/business-management" element={<AdminOverview />} />
              <Route path="/business-management/businesses" element={<BusinessesPage />} />
              <Route path="/business-management/business-access" element={<BusinessAccessPage />} />
              <Route path="/business-management/team-members" element={<TeamMembersPage />} />
              <Route path="/business-management/bank-accounts" element={<BankAccountsPage />} />
              <Route path="/business-management/partners" element={<AdminPartnersPage />} />
              <Route path="/business-management/partner-allocations" element={<PartnerAllocationsPage />} />
              <Route path="/business-management/payables" element={<PayablesPage />} />
              <Route path="/business-management/receivables" element={<ReceivablesPage />} />
            </Route>
            <Route element={<TodoLayout />}>
              <Route path="/todos" element={<TodoOverview />} />
              <Route path="/todos/today" element={<TodayPage />} />
              <Route path="/todos/week" element={<WeekPage />} />
              <Route path="/todos/upcoming" element={<UpcomingPage />} />
              <Route path="/todos/overdue" element={<OverduePage />} />
              <Route path="/todos/by-assignee" element={<ByAssigneePage />} />
              <Route path="/todos/all" element={<AllTodosPage />} />
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
