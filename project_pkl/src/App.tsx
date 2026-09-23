import { useEffect } from 'react';
import { BrowserRouter, Link, Route, Routes, useLocation } from 'react-router-dom';
import { Monitor } from 'lucide-react';
import { AuthProvider } from './contexts/AuthContext';
import { handleGoogleRedirect } from './lib/googleAuth';
import PublicLayout from './components/Layout';
import ProtectedRoute from './components/ProtectedRoute';
import PublicHome from './pages/PublicHome';
import LabDetail from './pages/LabDetail';
import ReportForm from './pages/ReportForm';
import TrackTicket from './pages/TrackTicket';
import AdminLogin from './pages/AdminLogin';
import AdminLayout from './pages/admin/AdminLayout';
import AdminDashboard from './pages/admin/AdminDashboard';
import AdminTickets from './pages/admin/AdminTickets';
import AdminLabs from './pages/admin/AdminLabs';
import AdminUnits from './pages/admin/AdminUnits';
import AdminSchedules from './pages/admin/AdminSchedules';

handleGoogleRedirect();

function ScrollToTop() {
  const { pathname } = useLocation();
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);
  return null;
}

function NotFound() {
  useEffect(() => {
    document.title = 'Halaman Tidak Ditemukan — SIMLAB-TIK';
  }, []);
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-slate-50 px-4">
      <span className="flex h-11 w-11 items-center justify-center rounded-md bg-slate-900">
        <Monitor className="h-6 w-6 text-white" />
      </span>
      <p className="mt-4 font-mono text-sm text-slate-400">404</p>
      <h1 className="mt-1 text-xl font-semibold text-slate-900">Halaman tidak ditemukan</h1>
      <p className="mt-1 text-sm text-slate-500">Alamat yang Anda tuju tidak tersedia atau telah dipindahkan.</p>
      <Link to="/" className="mt-5 inline-flex h-9 items-center rounded-md bg-blue-600 px-4 text-sm font-medium text-white hover:bg-blue-700">
        Kembali ke Beranda
      </Link>
    </div>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <ScrollToTop />
        <Routes>
          <Route element={<PublicLayout />}>
            <Route index element={<PublicHome />} />
            <Route path="lab/:id" element={<LabDetail />} />
            <Route path="lapor" element={<ReportForm />} />
            <Route path="lacak" element={<TrackTicket />} />
          </Route>
          <Route path="/admin/login" element={<AdminLogin />} />
          <Route path="/admin" element={<ProtectedRoute><AdminLayout /></ProtectedRoute>}>
            <Route index element={<AdminDashboard />} />
            <Route path="laporan" element={<AdminTickets />} />
            <Route path="lab" element={<AdminLabs />} />
            <Route path="unit" element={<AdminUnits />} />
            <Route path="jadwal" element={<AdminSchedules />} />
          </Route>
          <Route path="*" element={<NotFound />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}
