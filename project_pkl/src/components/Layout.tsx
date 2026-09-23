import { useState } from 'react';
import { Link, NavLink, Outlet } from 'react-router-dom';
import { Clock, Mail, MapPin, Menu, Monitor, Plus, ShieldCheck, X } from 'lucide-react';
import { cn } from './ui';

const NAV = [
  { to: '/', label: 'Laboratorium', end: true },
  { to: '/lapor', label: 'Lapor Kerusakan', end: false },
  { to: '/lacak', label: 'Lacak Tiket', end: false },
];

function Header() {
  const [open, setOpen] = useState(false);
  return (
    <header className="sticky top-0 z-40 border-b border-slate-200 bg-white">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-4 px-4 sm:px-6">
        <Link to="/" className="flex items-center gap-3">
          <span className="flex h-9 w-9 items-center justify-center rounded-md bg-slate-900">
            <Monitor className="h-5 w-5 text-white" strokeWidth={2} />
          </span>
          <span className="leading-tight">
            <span className="block text-[15px] font-semibold tracking-tight text-slate-900">SIMLAB-TIK</span>
            <span className="block text-xs text-slate-500">Sistem Manajemen Lab Komputer</span>
          </span>
        </Link>
        <nav className="hidden items-center gap-1 md:flex">
          {NAV.map((n) => (
            <NavLink
              key={n.to}
              to={n.to}
              end={n.end}
              className={({ isActive }) =>
                cn('rounded-md px-3 py-2 text-sm font-medium transition-colors', isActive ? 'bg-slate-100 text-slate-900' : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900')
              }
            >
              {n.label}
            </NavLink>
          ))}
        </nav>
        <div className="hidden items-center gap-2 md:flex">
          <Link to="/admin/login" className="inline-flex h-9 items-center gap-2 rounded-md px-3 text-sm font-medium text-slate-600 hover:bg-slate-100 hover:text-slate-900">
            <ShieldCheck className="h-4 w-4" /> Admin
          </Link>
          <Link to="/lapor" className="inline-flex h-9 items-center gap-2 rounded-md bg-blue-600 px-4 text-sm font-medium text-white hover:bg-blue-700">
            <Plus className="h-4 w-4" /> Lapor Kerusakan
          </Link>
        </div>
        <button className="rounded-md p-2 text-slate-600 hover:bg-slate-100 md:hidden" onClick={() => setOpen(!open)} aria-label="Menu navigasi">
          {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </div>
      {open && (
        <nav className="border-t border-slate-200 bg-white px-4 py-3 md:hidden">
          {NAV.map((n) => (
            <NavLink
              key={n.to}
              to={n.to}
              end={n.end}
              onClick={() => setOpen(false)}
              className={({ isActive }) => cn('block rounded-md px-3 py-2.5 text-sm font-medium', isActive ? 'bg-slate-100 text-slate-900' : 'text-slate-600 hover:bg-slate-50')}
            >
              {n.label}
            </NavLink>
          ))}
          <div className="mt-2 flex gap-2 border-t border-slate-100 pt-3">
            <Link to="/admin/login" onClick={() => setOpen(false)} className="inline-flex h-9 flex-1 items-center justify-center gap-2 rounded-md border border-slate-300 text-sm font-medium text-slate-700">
              <ShieldCheck className="h-4 w-4" /> Admin
            </Link>
            <Link to="/lapor" onClick={() => setOpen(false)} className="inline-flex h-9 flex-1 items-center justify-center gap-2 rounded-md bg-blue-600 text-sm font-medium text-white">
              <Plus className="h-4 w-4" /> Lapor
            </Link>
          </div>
        </nav>
      )}
    </header>
  );
}

function Footer() {
  return (
    <footer className="border-t border-slate-200 bg-white">
      <div className="mx-auto grid max-w-7xl gap-8 px-4 py-10 sm:px-6 md:grid-cols-3">
        <div>
          <div className="flex items-center gap-2.5">
            <span className="flex h-8 w-8 items-center justify-center rounded bg-slate-900">
              <Monitor className="h-4 w-4 text-white" />
            </span>
            <span className="text-sm font-semibold text-slate-900">SIMLAB-TIK</span>
          </div>
          <p className="mt-3 max-w-xs text-[13px] leading-5 text-slate-500">
            Sistem informasi terpadu untuk monitoring laboratorium komputer, inventarisasi perangkat, penjadwalan kuliah, dan pelaporan kerusakan.
          </p>
        </div>
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">Navigasi</p>
          <ul className="mt-3 space-y-2 text-sm">
            <li><Link className="text-slate-600 hover:text-blue-700" to="/">Overview Laboratorium</Link></li>
            <li><Link className="text-slate-600 hover:text-blue-700" to="/lapor">Form Laporan Kerusakan</Link></li>
            <li><Link className="text-slate-600 hover:text-blue-700" to="/lacak">Lacak Status Tiket</Link></li>
            <li><Link className="text-slate-600 hover:text-blue-700" to="/admin/login">Login Admin TIK</Link></li>
          </ul>
        </div>
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">Kontak Bagian TIK</p>
          <ul className="mt-3 space-y-2.5 text-sm text-slate-600">
            <li className="flex items-start gap-2"><MapPin className="mt-0.5 h-4 w-4 shrink-0 text-slate-400" /> Gedung ICT, Lantai 2 — Ruang Teknisi</li>
            <li className="flex items-start gap-2"><Mail className="mt-0.5 h-4 w-4 shrink-0 text-slate-400" /> <span className="font-mono text-[13px]">tik@kampus.ac.id</span></li>
            <li className="flex items-start gap-2"><Clock className="mt-0.5 h-4 w-4 shrink-0 text-slate-400" /> Senin-Jumat, 08.00-16.00 WIB</li>
          </ul>
        </div>
      </div>
      <div className="border-t border-slate-100">
        <div className="mx-auto flex max-w-7xl flex-col gap-1 px-4 py-4 text-xs text-slate-400 sm:flex-row sm:items-center sm:justify-between sm:px-6">
          <span>© 2026 Bagian Teknologi Informasi & Komunikasi. Dikelola oleh Admin TIK.</span>
          <span className="font-mono">SIMLAB-TIK v1.0</span>
        </div>
      </div>
    </footer>
  );
}

export default function PublicLayout() {
  return (
    <div className="flex min-h-screen flex-col bg-slate-50">
      <Header />
      <main className="mx-auto w-full max-w-7xl flex-1 px-4 py-6 sm:px-6 sm:py-8">
        <Outlet />
      </main>
      <Footer />
    </div>
  );
}
