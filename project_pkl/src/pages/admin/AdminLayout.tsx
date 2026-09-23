import { useEffect, useState } from 'react';
import { Link, NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { Building2, CalendarDays, ExternalLink, Inbox, LayoutDashboard, LogOut, Menu, Monitor, X } from 'lucide-react';
import supabase from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';
import { api } from '../../lib/api';
import { cn } from '../../components/ui';

export default function AdminLayout() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [openCount, setOpenCount] = useState(0);

  useEffect(() => {
    setMobileOpen(false);
    let alive = true;
    api.tickets.list().then((rows) => {
      if (alive) setOpenCount(rows.filter((t) => t.status !== 'Selesai').length);
    }).catch(() => {});
    return () => { alive = false; };
  }, [location.pathname]);

  const signOut = async () => {
    await supabase.auth.signOut();
    navigate('/', { replace: true });
  };

  const NAV = [
    { to: '/admin', label: 'Dashboard', icon: LayoutDashboard, end: true, badge: 0 },
    { to: '/admin/laporan', label: 'Laporan', icon: Inbox, end: false, badge: openCount },
    { to: '/admin/lab', label: 'Laboratorium', icon: Building2, end: false, badge: 0 },
    { to: '/admin/unit', label: 'Unit PC', icon: Monitor, end: false, badge: 0 },
    { to: '/admin/jadwal', label: 'Jadwal Kuliah', icon: CalendarDays, end: false, badge: 0 },
  ];

  const todayStr = new Intl.DateTimeFormat('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }).format(new Date());
  const initial = (user?.email || 'A')[0].toUpperCase();

  const sidebar = (
    <div className="flex h-full flex-col bg-slate-900">
      <Link to="/admin" className="flex items-center gap-3 border-b border-white/10 px-5 py-4">
        <span className="flex h-9 w-9 items-center justify-center rounded-md bg-white">
          <Monitor className="h-5 w-5 text-slate-900" />
        </span>
        <span className="leading-tight">
          <span className="block text-[15px] font-semibold tracking-tight text-white">SIMLAB-TIK</span>
          <span className="block text-xs text-slate-400">Panel Admin</span>
        </span>
      </Link>
      <nav className="flex-1 space-y-1 overflow-y-auto px-3 py-4">
        <p className="px-2 pb-2 text-[11px] font-semibold uppercase tracking-wider text-slate-500">Menu Utama</p>
        {NAV.map((n) => (
          <NavLink
            key={n.to}
            to={n.to}
            end={n.end}
            className={({ isActive }) =>
              cn('flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors', isActive ? 'bg-white/10 text-white' : 'text-slate-400 hover:bg-white/5 hover:text-white')
            }
          >
            <n.icon className="h-4 w-4 shrink-0" />
            <span className="flex-1">{n.label}</span>
            {n.badge > 0 && <span className="rounded bg-blue-600 px-1.5 py-0.5 font-mono text-[11px] font-semibold text-white">{n.badge}</span>}
          </NavLink>
        ))}
      </nav>
      <div className="border-t border-white/10 p-4">
        <div className="flex items-center gap-3">
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-white/10 text-sm font-semibold text-white">{initial}</span>
          <div className="min-w-0 flex-1">
            <p className="truncate text-[13px] font-medium text-white">{user?.email}</p>
            <p className="text-xs text-slate-400">Admin TIK</p>
          </div>
        </div>
        <div className="mt-3 flex gap-2">
          <Link to="/" className="inline-flex h-8 flex-1 items-center justify-center gap-1.5 rounded-md border border-white/15 text-[13px] font-medium text-slate-300 hover:bg-white/5 hover:text-white">
            <ExternalLink className="h-3.5 w-3.5" /> Situs
          </Link>
          <button onClick={signOut} className="inline-flex h-8 flex-1 items-center justify-center gap-1.5 rounded-md border border-white/15 text-[13px] font-medium text-slate-300 hover:bg-white/5 hover:text-white">
            <LogOut className="h-3.5 w-3.5" /> Keluar
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-slate-50">
      <aside className="fixed inset-y-0 left-0 z-40 hidden w-64 lg:block">{sidebar}</aside>
      {mobileOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div className="absolute inset-0 bg-slate-900/50" onClick={() => setMobileOpen(false)} />
          <aside className="absolute inset-y-0 left-0 w-72 max-w-[85vw]">
            <button onClick={() => setMobileOpen(false)} className="absolute right-3 top-4 rounded p-1.5 text-slate-400 hover:bg-white/10 hover:text-white" aria-label="Tutup menu">
              <X className="h-5 w-5" />
            </button>
            {sidebar}
          </aside>
        </div>
      )}
      <div className="lg:pl-64">
        <div className="sticky top-0 z-30 border-b border-slate-200 bg-white">
          <div className="mx-auto flex h-14 max-w-7xl items-center justify-between gap-3 px-4 sm:px-6">
            <div className="flex items-center gap-2">
              <button onClick={() => setMobileOpen(true)} className="rounded-md p-2 text-slate-600 hover:bg-slate-100 lg:hidden" aria-label="Buka menu">
                <Menu className="h-5 w-5" />
              </button>
              <p className="text-sm font-semibold text-slate-900">Panel Admin TIK</p>
            </div>
            <p className="truncate text-[13px] text-slate-500">{todayStr}</p>
          </div>
        </div>
        <main className="mx-auto max-w-7xl p-4 sm:p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
