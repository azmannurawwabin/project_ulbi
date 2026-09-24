import { useState } from 'react';
import { Link, NavLink, Outlet, useNavigate } from 'react-router-dom';
import {
  Monitor,
  LayoutDashboard,
  Inbox,
  Building2,
  Cpu,
  CalendarClock,
  Globe,
  LogOut,
  Menu,
  X,
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

const links = [
  { to: '/admin', end: true, label: 'Dashboard', icon: LayoutDashboard },
  { to: '/admin/laporan', label: 'Laporan', icon: Inbox },
  { to: '/admin/lab', label: 'Data Lab', icon: Building2 },
  { to: '/admin/hardware', label: 'Hardware', icon: Cpu },
  { to: '/admin/jadwal', label: 'Jadwal', icon: CalendarClock },
];

function linkCls({ isActive }: { isActive: boolean }) {
  return `flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors ${
    isActive ? 'bg-blue-600 text-white' : 'text-zinc-600 hover:bg-zinc-100 hover:text-zinc-900'
  }`;
}

export default function AdminLayout() {
  const [open, setOpen] = useState(false);
  const { user, signOut } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await signOut();
    navigate('/login');
  };

  const sidebar = (
    <div className="flex h-full flex-col">
      <div className="flex items-center gap-2.5 border-b border-zinc-200 px-5 py-4">
        <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-blue-600 text-white">
          <Monitor size={20} />
        </span>
        <span>
          <span className="block text-sm font-bold leading-tight text-zinc-900">SIM-LAB TIK</span>
          <span className="block text-xs leading-tight text-zinc-500">Panel Admin</span>
        </span>
      </div>
      <nav className="flex-1 space-y-1 overflow-y-auto px-3 py-4">
        {links.map((l) => (
          <NavLink key={l.to} to={l.to} end={(l as { end?: boolean }).end} className={linkCls} onClick={() => setOpen(false)}>
            <l.icon size={18} />
            {l.label}
          </NavLink>
        ))}
      </nav>
      <div className="border-t border-zinc-200 px-3 py-4">
        <Link
          to="/"
          className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-zinc-600 hover:bg-zinc-100 hover:text-zinc-900"
        >
          <Globe size={18} /> Kembali ke Situs
        </Link>
        <div className="mt-2 rounded-lg bg-zinc-50 px-3 py-2.5">
          <p className="truncate text-xs font-semibold text-zinc-900">{user?.email}</p>
          <p className="text-xs text-zinc-500">Admin TIK</p>
        </div>
        <button
          onClick={handleLogout}
          className="mt-2 flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-red-600 hover:bg-red-50"
        >
          <LogOut size={18} /> Keluar
        </button>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-zinc-50 font-sans">
      <div className="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-zinc-200 bg-white px-4 lg:hidden">
        <span className="flex items-center gap-2">
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-600 text-white">
            <Monitor size={18} />
          </span>
          <span className="text-sm font-bold text-zinc-900">SIM-LAB TIK Admin</span>
        </span>
        <button
          onClick={() => setOpen(!open)}
          className="rounded-lg border border-zinc-300 p-2 text-zinc-700"
          aria-label="Menu"
        >
          {open ? <X size={18} /> : <Menu size={18} />}
        </button>
      </div>
      {open && <div className="fixed inset-0 z-30 bg-zinc-950/50 lg:hidden" onClick={() => setOpen(false)} />}
      <aside
        className={`fixed inset-y-0 left-0 z-40 w-64 border-r border-zinc-200 bg-white transition-transform lg:translate-x-0 ${
          open ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {sidebar}
      </aside>
      <div className="lg:pl-64">
        <main className="mx-auto max-w-6xl px-4 py-6 sm:px-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
