import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Building2,
  Monitor,
  Inbox,
  CheckCircle2,
  ArrowRight,
  Clock,
  Wrench,
  AlertTriangle,
} from 'lucide-react';
import { apiFetch, formatDateTime } from '../../lib/api';
import type { Lab, Stats } from '../../lib/api';
import { Spinner, ErrorBanner, StatusBadge, EmptyState } from '../../components/ui';

export default function Dashboard() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [labs, setLabs] = useState<Lab[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const load = async () => {
    setLoading(true);
    setError('');
    try {
      const [s, l] = await Promise.all([apiFetch<Stats>('/api/stats'), apiFetch<Lab[]>('/api/labs')]);
      setStats(s);
      setLabs(l);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Gagal memuat data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  if (loading) return <Spinner label="Memuat dashboard..." />;
  if (error) return <ErrorBanner message={error} onRetry={load} />;
  if (!stats) return <EmptyState title="Tidak ada data" />;

  const openCount = stats.byStatus.diterima + stats.byStatus.diproses;
  const doneRate = stats.totalReports === 0 ? 0 : Math.round((stats.byStatus.selesai / stats.totalReports) * 100);
  const maxOpen = Math.max(1, ...stats.perLab.map((p) => p.open));

  const metrics = [
    { icon: Building2, label: 'Total Lab', value: String(stats.totalLabs), sub: 'laboratorium komputer' },
    { icon: Monitor, label: 'Total Unit PC', value: String(stats.totalPc), sub: 'unit terdaftar' },
    { icon: Inbox, label: 'Laporan Terbuka', value: String(openCount), sub: 'perlu penanganan' },
    { icon: CheckCircle2, label: 'Tingkat Selesai', value: `${doneRate}%`, sub: `${stats.byStatus.selesai} dari ${stats.totalReports} laporan` },
  ];

  return (
    <div>
      <h1 className="text-xl font-bold text-zinc-900">Dashboard</h1>
      <p className="mt-0.5 text-sm text-zinc-500">Ringkasan kondisi laboratorium dan antrean laporan kerusakan.</p>

      <div className="mt-5 grid grid-cols-2 gap-3 lg:grid-cols-4">
        {metrics.map((m) => (
          <div key={m.label} className="rounded-lg border border-zinc-200 bg-white p-4 shadow-sm">
            <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-blue-50 text-blue-600">
              <m.icon size={18} />
            </span>
            <p className="mt-3 font-mono text-2xl font-bold text-zinc-900">{m.value}</p>
            <p className="text-sm font-medium text-zinc-700">{m.label}</p>
            <p className="text-xs text-zinc-500">{m.sub}</p>
          </div>
        ))}
      </div>

      {/* Pipeline */}
      <div className="mt-5 grid gap-3 sm:grid-cols-3">
        {[
          { icon: Clock, status: 'diterima', label: 'Diterima', count: stats.byStatus.diterima, cls: 'border-yellow-200 bg-yellow-50 text-yellow-700' },
          { icon: Wrench, status: 'diproses', label: 'Diproses', count: stats.byStatus.diproses, cls: 'border-blue-200 bg-blue-50 text-blue-700' },
          { icon: CheckCircle2, status: 'selesai', label: 'Selesai', count: stats.byStatus.selesai, cls: 'border-green-200 bg-green-50 text-green-700' },
        ].map((p) => (
          <Link
            key={p.status}
            to={`/admin/laporan?status=${p.status}`}
            className="group flex items-center justify-between rounded-lg border border-zinc-200 bg-white p-4 shadow-sm hover:border-blue-300"
          >
            <div className="flex items-center gap-3">
              <span className={`flex h-10 w-10 items-center justify-center rounded-lg border ${p.cls}`}>
                <p.icon size={19} />
              </span>
              <div>
                <p className="font-mono text-xl font-bold text-zinc-900">{p.count}</p>
                <p className="text-sm font-medium text-zinc-600">{p.label}</p>
              </div>
            </div>
            <ArrowRight size={18} className="text-zinc-300 group-hover:text-blue-600" />
          </Link>
        ))}
      </div>

      <div className="mt-5 grid gap-4 lg:grid-cols-2">
        {/* Recent reports */}
        <div className="rounded-lg border border-zinc-200 bg-white shadow-sm">
          <div className="flex items-center justify-between border-b border-zinc-200 px-5 py-4">
            <h2 className="text-sm font-bold text-zinc-900">Laporan Terbaru</h2>
            <Link to="/admin/laporan" className="inline-flex items-center gap-1 text-xs font-semibold text-blue-600 hover:text-blue-700">
              Kelola Semua <ArrowRight size={14} />
            </Link>
          </div>
          {stats.recent.length === 0 ? (
            <div className="p-5">
              <EmptyState title="Belum ada laporan" />
            </div>
          ) : (
            <ul className="divide-y divide-zinc-100">
              {stats.recent.map((r) => (
                <li key={r.id} className="flex items-center justify-between gap-3 px-5 py-3">
                  <div className="min-w-0">
                    <p className="truncate font-mono text-sm font-bold text-zinc-900">{r.ticket_no}</p>
                    <p className="truncate text-xs text-zinc-500">
                      {r.labs?.code} • {r.pc_id} • {r.student_name} • {formatDateTime(r.created_at)}
                    </p>
                  </div>
                  <StatusBadge status={r.status} />
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="space-y-4">
          {/* Per lab open */}
          <div className="rounded-lg border border-zinc-200 bg-white p-5 shadow-sm">
            <h2 className="text-sm font-bold text-zinc-900">Laporan Terbuka per Lab</h2>
            <div className="mt-3 space-y-2.5">
              {stats.perLab.map((p) => {
                const lab = labs.find((l) => l.id === p.lab_id);
                return (
                  <div key={p.lab_id}>
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-mono font-semibold text-zinc-700">{lab?.code || `Lab ${p.lab_id}`}</span>
                      <span className="text-zinc-500">
                        <span className="font-mono font-bold text-zinc-900">{p.open}</span> terbuka / {p.total} total
                      </span>
                    </div>
                    <div className="mt-1 h-2 overflow-hidden rounded-full bg-zinc-100">
                      <div
                        className={`h-full rounded-full ${p.open > 0 ? 'bg-yellow-500' : 'bg-green-500'}`}
                        style={{ width: `${p.open === 0 ? 100 : Math.max(8, (p.open / maxOpen) * 100)}%`, opacity: p.open === 0 ? 0.35 : 1 }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
          {/* PC health */}
          <div className="rounded-lg border border-zinc-200 bg-white p-5 shadow-sm">
            <h2 className="text-sm font-bold text-zinc-900">Kondisi Unit Terdata</h2>
            <div className="mt-3 grid grid-cols-3 gap-2 text-center">
              <div className="rounded-lg border border-green-200 bg-green-50 px-2 py-3">
                <CheckCircle2 size={18} className="mx-auto text-green-600" />
                <p className="mt-1 font-mono text-lg font-bold text-green-700">{stats.pcHealth.baik}</p>
                <p className="text-xs font-medium text-green-700">Baik</p>
              </div>
              <div className="rounded-lg border border-yellow-200 bg-yellow-50 px-2 py-3">
                <Wrench size={18} className="mx-auto text-yellow-600" />
                <p className="mt-1 font-mono text-lg font-bold text-yellow-700">{stats.pcHealth.perawatan}</p>
                <p className="text-xs font-medium text-yellow-700">Perawatan</p>
              </div>
              <div className="rounded-lg border border-red-200 bg-red-50 px-2 py-3">
                <AlertTriangle size={18} className="mx-auto text-red-600" />
                <p className="mt-1 font-mono text-lg font-bold text-red-700">{stats.pcHealth.rusak}</p>
                <p className="text-xs font-medium text-red-700">Rusak</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
