import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { AlertTriangle, ArrowRight, Building2, CheckCircle2, Inbox, MapPin, Monitor, Search, Wrench } from 'lucide-react';
import { api } from '../lib/api';
import type { Lab, PcUnit } from '../lib/api';
import { Button, EmptyState, LabStatusBadge, PageHeader, Spinner, StatCard } from '../components/ui';

export default function PublicHome() {
  const [labs, setLabs] = useState<Lab[]>([]);
  const [units, setUnits] = useState<PcUnit[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [q, setQ] = useState('');

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      const [labRows, unitRows] = await Promise.all([api.labs.list(), api.units.list()]);
      setLabs(labRows);
      setUnits(unitRows);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Gagal memuat data.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    document.title = 'Overview Laboratorium — SIMLAB-TIK';
    load();
  }, []);

  const specByLab = useMemo(() => {
    const map: Record<number, PcUnit> = {};
    for (const u of units) if (!map[u.lab_id]) map[u.lab_id] = u;
    return map;
  }, [units]);

  const filtered = labs.filter((l) => {
    const s = q.trim().toLowerCase();
    if (!s) return true;
    return (
      l.name.toLowerCase().includes(s) ||
      l.code.toLowerCase().includes(s) ||
      (l.location || '').toLowerCase().includes(s)
    );
  });

  const totalPC = labs.reduce((a, l) => a + l.pc_total, 0);
  const activePC = labs.reduce((a, l) => a + l.pc_active, 0);
  const openTickets = labs.reduce((a, l) => a + l.tickets_open, 0);

  if (loading) {
    return (
      <div className="rounded-md border border-slate-200 bg-white">
        <Spinner label="Memuat data laboratorium..." />
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-md border border-red-200 bg-white p-8 text-center">
        <AlertTriangle className="mx-auto h-6 w-6 text-red-500" />
        <p className="mt-2 text-sm font-semibold text-slate-900">Gagal memuat data</p>
        <p className="mt-1 text-sm text-slate-500">{error}</p>
        <Button className="mt-4" onClick={load}>Coba Lagi</Button>
      </div>
    );
  }

  return (
    <div>
      <PageHeader
        title="Overview Laboratorium Komputer"
        description="Pantauan ketersediaan unit PC, spesifikasi perangkat, jadwal penggunaan, dan layanan pelaporan kerusakan di bawah pengelolaan Bagian TIK."
        actions={
          <div className="relative w-full sm:w-64">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Cari lab / lokasi..."
              className="block h-9 w-full rounded-md border border-slate-300 bg-white pl-9 pr-3 text-sm text-slate-900 placeholder:text-slate-400 focus:border-blue-600 focus:outline-none focus:ring-1 focus:ring-blue-600"
            />
          </div>
        }
      />

      <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
        <StatCard label="Total Lab" value={labs.length} sub="Unit laboratorium terdaftar" icon={<Building2 className="h-4 w-4 text-slate-400" />} />
        <StatCard label="Total PC" value={totalPC} sub="Unit komputer terinventaris" icon={<Monitor className="h-4 w-4 text-slate-400" />} />
        <StatCard label="PC Aktif" value={activePC} sub={`${totalPC ? Math.round((activePC / totalPC) * 100) : 0}% dari total unit`} icon={<CheckCircle2 className="h-4 w-4 text-emerald-500" />} />
        <StatCard label="Laporan Terbuka" value={openTickets} sub="Menunggu penanganan teknisi" icon={<Inbox className="h-4 w-4 text-amber-500" />} />
      </div>

      <div className="mt-6">
        {filtered.length === 0 ? (
          <EmptyState title="Laboratorium tidak ditemukan" description={`Tidak ada lab yang cocok dengan pencarian "${q}".`} />
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {filtered.map((lab) => {
              const pct = lab.pc_total ? Math.round((lab.pc_active / lab.pc_total) * 100) : 0;
              const rep = specByLab[lab.id];
              const spec = rep ? `${rep.processor} • ${rep.ram} • ${rep.storage}` : 'Spesifikasi belum diisi';
              return (
                <Link key={lab.id} to={`/lab/${lab.id}`} className="group flex flex-col rounded-md border border-slate-200 bg-white p-5 transition-colors hover:border-blue-300">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <h3 className="text-[15px] font-semibold tracking-tight text-slate-900 group-hover:text-blue-700">{lab.name}</h3>
                        <span className="rounded border border-slate-200 bg-slate-50 px-1.5 py-px font-mono text-[11px] font-medium text-slate-600">{lab.code}</span>
                      </div>
                      <p className="mt-1 flex items-center gap-1 text-[13px] text-slate-500">
                        <MapPin className="h-3.5 w-3.5 shrink-0 text-slate-400" />
                        <span className="truncate">{lab.location || '-'}</span>
                      </p>
                    </div>
                    <LabStatusBadge status={lab.status} />
                  </div>
                  <p className="mt-3 line-clamp-2 min-h-[40px] text-sm leading-5 text-slate-600">{lab.description || 'Belum ada deskripsi.'}</p>
                  <p className="mt-3 truncate font-mono text-xs text-slate-500" title={spec}>{spec}</p>
                  <div className="mt-3">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-slate-500">PC Aktif</span>
                      <span className="font-mono font-medium text-slate-700">{lab.pc_active}/{lab.pc_total}</span>
                    </div>
                    <div className="mt-1.5 h-1.5 overflow-hidden rounded-sm bg-slate-100">
                      <div className="h-full rounded-sm bg-blue-600" style={{ width: `${pct}%` }} />
                    </div>
                  </div>
                  <div className="mt-4 flex items-center justify-between border-t border-slate-100 pt-3 text-[13px]">
                    {lab.tickets_open > 0 ? (
                      <span className="font-medium text-amber-700">{lab.tickets_open} laporan terbuka</span>
                    ) : (
                      <span className="text-slate-400">Tidak ada laporan terbuka</span>
                    )}
                    <span className="inline-flex items-center gap-1 font-medium text-blue-700">Detail <ArrowRight className="h-3.5 w-3.5" /></span>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </div>

      <div className="mt-8 grid gap-4 md:grid-cols-2">
        <div className="flex items-start gap-4 rounded-md border border-slate-200 bg-white p-5">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md bg-slate-900">
            <Wrench className="h-5 w-5 text-white" />
          </span>
          <div className="min-w-0 flex-1">
            <h3 className="text-[15px] font-semibold text-slate-900">Menemukan PC bermasalah?</h3>
            <p className="mt-1 text-sm leading-5 text-slate-500">Sampaikan laporan kerusakan melalui formulir resmi. Anda akan menerima nomor tiket untuk memantau status penanganan.</p>
            <Link to="/lapor" className="mt-3 inline-flex h-9 items-center gap-2 rounded-md bg-blue-600 px-4 text-sm font-medium text-white hover:bg-blue-700">
              Buat Laporan <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
        <div className="flex items-start gap-4 rounded-md border border-slate-200 bg-white p-5">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md border border-slate-200 bg-slate-50">
            <Search className="h-5 w-5 text-slate-700" />
          </span>
          <div className="min-w-0 flex-1">
            <h3 className="text-[15px] font-semibold text-slate-900">Sudah melapor sebelumnya?</h3>
            <p className="mt-1 text-sm leading-5 text-slate-500">Lacak progres penanganan laporan Anda — dari Diterima, Diproses, hingga Selesai — lengkap dengan catatan teknisi.</p>
            <Link to="/lacak" className="mt-3 inline-flex h-9 items-center gap-2 rounded-md border border-slate-300 bg-white px-4 text-sm font-medium text-slate-700 hover:bg-slate-50">
              Lacak Status Tiket <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
