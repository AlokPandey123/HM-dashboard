import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useAuthStore } from './store/authStore';
import { DashboardLayout } from './components/layout/DashboardLayout';
import { Login } from './pages/Login';
import { Dashboard } from './pages/Dashboard';
import { Cities } from './pages/Cities';
import { AdminUsers } from './pages/AdminUsers';
import { Patients } from './pages/Patients';
import { OPD } from './pages/OPD';
import { Pathology } from './pages/Pathology';
import { Medicine } from './pages/Medicine';
import { Billing } from './pages/Billing';
import { Reports } from './pages/Reports';
import { Returns } from './pages/Returns';

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  return isAuthenticated() ? <>{children}</> : <Navigate to="/login" replace />;
}

function PublicRoute({ children }: { children: React.ReactNode }) {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  return isAuthenticated() ? <Navigate to="/dashboard" replace /> : <>{children}</>;
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<PublicRoute><Login /></PublicRoute>} />
        <Route path="/" element={<ProtectedRoute><DashboardLayout /></ProtectedRoute>}>
          <Route index element={<Navigate to="/dashboard" replace />} />
          <Route path="dashboard" element={<Dashboard />} />
          <Route path="cities" element={<Cities />} />
          <Route path="users" element={<AdminUsers />} />
          <Route path="patients" element={<Patients />} />
          <Route path="opd" element={<OPD />} />
          <Route path="pathology" element={<Pathology />} />
          <Route path="medicine" element={<Medicine />} />
          <Route path="billing" element={<Billing />} />
          <Route path="reports" element={<Reports />} />
          <Route path="returns" element={<Returns />} />
        </Route>
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
