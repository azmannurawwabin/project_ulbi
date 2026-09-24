import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import PublicLayout from './components/PublicLayout';
import AdminLayout from './components/AdminLayout';
import Home from './pages/Home';
import LabDetail from './pages/LabDetail';
import ReportForm from './pages/ReportForm';
import TrackTicket from './pages/TrackTicket';
import Login from './pages/Login';
import Dashboard from './pages/admin/Dashboard';
import Reports from './pages/admin/Reports';
import Labs from './pages/admin/Labs';
import Hardware from './pages/admin/Hardware';
import Schedules from './pages/admin/Schedules';

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route element={<PublicLayout />}>
            <Route path="/" element={<Home />} />
            <Route path="/lab/:id" element={<LabDetail />} />
            <Route path="/lapor" element={<ReportForm />} />
            <Route path="/lacak" element={<TrackTicket />} />
          </Route>
          <Route path="/login" element={<Login />} />
          <Route
            path="/admin"
            element={
              <ProtectedRoute>
                <AdminLayout />
              </ProtectedRoute>
            }
          >
            <Route index element={<Dashboard />} />
            <Route path="laporan" element={<Reports />} />
            <Route path="lab" element={<Labs />} />
            <Route path="hardware" element={<Hardware />} />
            <Route path="jadwal" element={<Schedules />} />
          </Route>
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
