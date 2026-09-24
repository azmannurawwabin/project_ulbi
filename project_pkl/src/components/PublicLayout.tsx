import { Link, NavLink, Outlet } from 'react-router-dom';
import { Monitor, ShieldCheck } from 'lucide-react';

function navCls({ isActive }: { isActive: boolean }) {
  return `whitespace-nowrap rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
    isActive ? 'bg-zinc-900 text-white' : 'text-zinc-600 hover:bg-zinc-100 hover:text-zinc-900'
  }`;
}

export default function PublicLayout() {
  return (
    <div className="min-h-screen bg-zinc-50 font-sans">
      <header className="sticky top-0 z-40 border-b border-zinc-200 bg-white/95 backdrop-blur">
        <div className="mx-auto flex max-w-6xl flex-col gap-2 px-4 py-3 sm:h-16 sm:flex-row sm:items-center sm:justify-between sm:py-0">
          <div className="flex items-center justify-between">
            <Link to="/" className="flex items-center gap-2.5">
              <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-blue-600 text-white">
                <Monitor size={20} />
              </span>
              <span>
                <span className="block text-sm font-bold leading-tight text-zinc-900">SIM-LAB TIK</span>
                <span className="block text-xs leading-tight text-zinc-500">Manajemen Lab Komputer</span>
              </span>
            </Link>
            <Link
              to="/login"
              className="inline-flex items-center gap-1.5 rounded-lg border border-zinc-300 px-3 py-2 text-sm font-medium text-zinc-700 hover:bg-zinc-50 sm:hidden"
            >
              <ShieldCheck size={16} /> Admin
            </Link>
          </div>
          <nav className="flex items-center gap-1 overflow-x-auto">
            <NavLink to="/" end className={navCls}>
              Beranda
            </NavLink>
            <NavLink to="/lapor" className={navCls}>
              Lapor Kerusakan
            </NavLink>
            <NavLink to="/lacak" className={navCls}>
              Lacak Tiket
            </NavLink>
            <NavLink
              to="/login"
              className="ml-1 hidden items-center gap-1.5 whitespace-nowrap rounded-lg border border-zinc-300 px-3 py-2 text-sm font-medium text-zinc-700 hover:bg-zinc-50 sm:inline-flex"
            >
              <ShieldCheck size={16} /> Admin
            </NavLink>
          </nav>
        </div>
      </header>
      <main>
        <Outlet />
      </main>
      <footer className="border-t border-zinc-200 bg-white">
        <div className="mx-auto flex max-w-6xl flex-col gap-1 px-4 py-6 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-sm font-semibold text-zinc-900">SIM-LAB TIK</p>
          <p className="text-xs text-zinc-500">
            UPT Teknologi Informasi &amp; Komunikasi &bull; Sistem Manajemen &amp; Pelaporan Laboratorium Komputer
          </p>
        </div>
      </footer>
    </div>
  );
}
