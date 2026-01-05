import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { BusinessProvider } from "./contexts/BusinessContext";
import { GoogleDriveProvider } from "./contexts/GoogleDriveContext";
import { ProtectedRoute } from "./components/ProtectedRoute";
import { DashboardLayout } from "./layouts/DashboardLayout";
import { BusinessManagementLayout } from "./layouts/BusinessManagementLayout";
import NotFound from "./pages/NotFound";
import LoginPage from "./pages/LoginPage";
import DashboardPage from "./pages/DashboardPage";
import WorksPage from "./pages/WorksPage";
import ProjectDetailPage from "./pages/ProjectDetailPage";
import TeamPage from "./pages/TeamPage";
import ClientsPage from "./pages/ClientsPage";
import FinancialsPage from "./pages/FinancialsPage";
import RetainerDetailPage from "./pages/RetainerDetailPage";
import AnalyticsPage from "./pages/AnalyticsPage";
import SettingsPage from "./pages/SettingsPage";
import { AdminOverview } from "./components/admin/AdminOverview";
import { BusinessesPage } from "./components/admin/BusinessesPage";
import { BankAccountsPage } from "./components/admin/BankAccountsPage";
import { PayablesPage } from "./components/admin/PayablesPage";
import { ReceivablesPage } from "./components/admin/ReceivablesPage";

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
              <Route path="/works" element={<WorksPage />} />
              <Route path="/works/:projectId" element={<ProjectDetailPage />} />
              <Route path="/works/retainers/:retainerId" element={<RetainerDetailPage />} />
              {/* Redirect old routes for backwards compatibility */}
              <Route path="/projects" element={<Navigate to="/works" replace />} />
              <Route path="/projects/:projectId" element={<Navigate to="/works" replace />} />
              <Route path="/financials/retainers/:retainerId" element={<Navigate to="/works?tab=retainers" replace />} />
              <Route path="/team" element={<TeamPage />} />
              <Route path="/clients" element={<ClientsPage />} />
              <Route path="/financials" element={<FinancialsPage />} />
              <Route path="/analytics" element={<AnalyticsPage />} />
              <Route path="/settings" element={<SettingsPage />} />
            </Route>
            <Route element={<BusinessManagementLayout />}>
              <Route path="/business-management" element={<AdminOverview />} />
              <Route path="/business-management/businesses" element={<BusinessesPage />} />
              <Route path="/business-management/bank-accounts" element={<BankAccountsPage />} />
              <Route path="/business-management/payables" element={<PayablesPage />} />
              <Route path="/business-management/receivables" element={<ReceivablesPage />} />
            </Route>
          </Route>
          <Route path="*" element={<NotFound />} />
        </Routes>
        <Toaster />
        <Sonner />
      </GoogleDriveProvider>
    </BusinessProvider>
  </BrowserRouter>
);

export default App;
