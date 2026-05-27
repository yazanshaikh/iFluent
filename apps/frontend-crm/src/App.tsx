import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useAuthStore } from '@/stores/authStore';

import AppLayout     from '@/components/layout/AppLayout';
import LoginPage     from '@/pages/Login';
import DashboardPage from '@/pages/Dashboard';
import LeadsPage     from '@/pages/Leads';
import LeadProfilePage from '@/pages/LeadProfile';
import EmployeesPage  from '@/pages/Employees';
import OpenSeaPage    from '@/pages/OpenSea';
import NewLeadsPage    from '@/pages/NewLeads';
import StaffProfilePage   from '@/pages/StaffProfile';
import SmallTreasuryPage   from '@/pages/SmallTreasury';
import TrialBookingsPage   from '@/pages/TrialBookings';
import ProcessOrdersPage   from '@/pages/ProcessOrders';
import PaidStudentsPage    from '@/pages/PaidStudents';
import InvoicePage         from '@/pages/InvoicePage';
import MessagesPage        from '@/pages/Messages';
import NotFoundPage        from '@/pages/NotFound';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <Routes>
          {/* Public — no auth required */}
          <Route path="/login"       element={<LoginPage />} />
          <Route path="/pay/:uuid"   element={<InvoicePage />} />

          {/* Protected */}
          <Route element={<AppLayout />}>
            <Route index element={<RootRedirect />} />
            <Route path="/dashboard"    element={<DashboardPage />} />
            <Route path="/leads"        element={<LeadsPage />} />
            <Route path="/leads/:id"    element={<LeadProfilePage />} />
            <Route path="/new-leads"    element={<NewLeadsPage />} />
            <Route path="/small-treasury" element={<SmallTreasuryPage />} />
            <Route path="/open-sea"       element={<OpenSeaPage />} />
            <Route path="/employees"     element={<EmployeesPage />} />
            <Route path="/employees/:id" element={<StaffProfilePage />} />
            <Route path="/bookings"       element={<TrialBookingsPage />} />
            <Route path="/process-orders" element={<ProcessOrdersPage />} />
            <Route path="/paid-students"  element={<PaidStudentsPage />} />
            <Route path="/messages"       element={<MessagesPage />} />
            <Route path="/teachers"     element={<ComingSoon title="Teachers" />} />
            <Route path="/settings"     element={<ComingSoon title="Settings" />} />
          </Route>

          {/* 404 */}
          <Route path="*" element={<NotFoundPage />} />
        </Routes>
      </BrowserRouter>
    </QueryClientProvider>
  );
}

function RootRedirect() {
  const role = useAuthStore((s) => s.user?.role);
  return <Navigate to={role === 'super_admin' ? '/dashboard' : '/new-leads'} replace />;
}

function ComingSoon({ title }: { title: string }) {
  return (
    <div className="flex flex-col items-center justify-center h-full py-24 gap-2 text-muted-foreground">
      <p className="text-4xl">🚧</p>
      <p className="text-lg font-medium">{title} — قريباً</p>
    </div>
  );
}
