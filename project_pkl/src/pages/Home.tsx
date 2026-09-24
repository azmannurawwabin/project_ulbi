import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  Monitor,
  FileText,
  Search,
  MapPin,
  Clock,
  ChevronRight,
  Building2,
  CheckCircle2,
  ClipboardList,
  Ticket,
} from 'lucide-react';
import { apiFetch, todayDayName } from '../lib/api';
import type { Lab, Schedule, Stats } from '../lib/api';
import { Spinner, ErrorBanner } from '../components/ui';

function currentClassToday(items: Schedule[]): Schedule | null {
  const now = new Date();
  const t = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
  const day = todayDayName();
  return items.find((s) => s.day === day && s.start_time <= t && t < s.end_time) || null;
}

export default function Home() {
  const [labs, setLabs] = useState<Lab[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [schedules, setSchedules] = useState<Schedule[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const load = async () => {
    setLoading(true);
    setError('');
    try {
      const [labsData, statsData, schedData] = await Promise.all([
        apiFetch<Lab[]>('/api/labs'),
        apiFetch<Stats>('/api/stats'),
        apiFetch<Schedule[]>('/api/schedules'),
      ]);
      setLabs(labsData);
      setStats(statsData);
      setSchedules(schedData);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Gagal memuat data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const openCount = (stats?.byStatus.diterima || 0) + (stats?.byStatus.diproses || 0);
  const doneRate = useMemo(() => {
    if (!stats || stats.totalReports === 0) return 0;
    return Math.round((stats.byStatus.selesai / stats.totalReports) * 100);
  }, [stats]);

  return (
    <div>
      {/* Hero */}
      <section className="border-b border-zinc-200 bg-white">
        <div className="mx-auto max-w-6xl px-4 py-10 sm:py-14">
          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>
            <p className="font-mono text-xs font-semibold uppercase tracking-widest text-blue-600">
              UPT Teknologi Informasi &amp; Komunikasi
            </p>
            <h1 className="mt-2 max-w-2xl text-3xl font-bold tracking-tight text-zinc-900 sm:text-4xl">
              Sistem Manajemen &amp; Pelaporan Lab Komputer
            </h1>
            <p className="mt-3 max-w-2xl text-sm text-zinc-600 sm:text-base">
              Lihat informasi 7 laboratorium komputer, spesifikasi perangkat, jadwal praktikum, dan laporkan
              kerusakan perangkat langsung dari halaman ini — tanpa perlu login.
            </p>
            <div className="mt-6 flex flex-col gap-2 sm:flex-row">
              <Link
                to="/lapor"
                className="inline-flex items-center justify-center gap-2 rounded-lg bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-blue-700"
              >
                <FileText size={17} /> Lapor Kerusakan
              </Link>
              <Link
                to="/lacak"
                className="inline-flex items-center justify-center gap-2 rounded-lg border border-zinc-300 bg-white px-5 py-2.5 text-sm font-semibold text-zinc-700 hover:bg-zinc-50"
              >
                <Search size={17} /> Lacak Status Tiket
              </Link>
            </div>
          </motion.div>
          {/* Stat strip */}
          <div className="mt-8 grid grid-cols-2 gap-3 sm:grid-cols-4">
            {[
              { icon: Building2, label: 'Laboratorium', value: String(stats?.totalLabs ?? labs.length) },
              { icon: Monitor, label: 'Total Unit PC', value: String(stats?.totalPc ?? 0) },
              { icon: Ticket, label: 'Laporan Terbuka', value: String(openCount) },
              { icon: CheckCircle2, label: 'Tingkat Selesai', value: `${doneRate}%` },
            ].map((s, i) => (
              <motion.div
                key={s.label}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.35, delay: 0.1 + i * 0.06 }}
                className="flex items-center gap-3 rounded-lg border border-zinc-200 bg-zinc-50 px-4 py-3"
              >
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-white text-blue-600 shadow-sm">
                  <s.icon size={18} />
                </span>
                <span>
                  <span className="block font-mono text-lg font-bold leading-tight text-zinc-900">{s.value}</span>
                  <span className="block text-xs text-zinc-500">{s.label}</span>
                </span>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Lab grid */}
      <section className="mx-auto max-w-6xl px-4 py-10">
        <div className="mb-5 flex items-end justify-between">
          <div>
            <h2 className="text-xl font-bold text-zinc-900">Daftar Laboratorium</h2>
            <p className="text-sm text-zinc-500">
              {todayDayName() === 'Minggu'
                ? 'Jadwal praktikum Senin - Sabtu'
                : `Jadwal hari ini: ${todayDayName()}`}
            </p>
          </div>
        </div>
        {loading ? (
          <Spinner label="Memuat data laboratorium..." />
        ) : error ? (
          <ErrorBanner message={error} onRetry={load} />
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {labs.map((lab, i) => {
              const labSched = schedules.filter((s) => s.lab_id === lab.id);
              const ongoing = currentClassToday(labSched);
              const perLab = stats?.perLab.find((p) => p.lab_id === lab.id);
              const open = perLab?.open || 0;
              return (
                <motion.div
                  key={lab.id}
                  initial={{ opacity: 0, y: 14 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.35, delay: i * 0.05 }}
                >
                  <Link
                    to={`/lab/${lab.id}`}
                    className="group flex h-full flex-col rounded-lg border border-zinc-200 bg-white p-5 shadow-sm transition-colors hover:border-blue-300"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <span className="rounded-md bg-blue-50 px-2 py-1 font-mono text-xs font-bold text-blue-700">
                        {lab.code}
                      </span>
                      {open > 0 ? (
                        <span className="rounded-md border border-yellow-200 bg-yellow-50 px-2 py-1 text-xs font-semibold text-yellow-700">
                          {open} laporan terbuka
                        </span>
                      ) : (
                        <span className="rounded-md border border-green-200 bg-green-50 px-2 py-1 text-xs font-semibold text-green-700">
                          Semua terpantau baik
                        </span>
                      )}
                    </div>
                    <h3 className="mt-3 text-base font-bold text-zinc-900 group-hover:text-blue-700">
                      {lab.name}
                    </h3>
                    <div className="mt-2 space-y-1.5 text-xs text-zinc-500">
                      <p className="flex items-center gap-1.5">
                        <MapPin size={14} /> {lab.floor || '-'}
                      </p>
                      <p className="flex items-center gap-1.5">
                        <Monitor size={14} />
                        <span className="font-mono font-semibold text-zinc-700">{lab.total_pc} unit PC</span>
                      </p>
                      {ongoing ? (
                        <p className="flex items-center gap-1.5 text-blue-700">
                          <Clock size={14} />
                          <span className="font-medium">
                            Berlangsung: {ongoing.course_name} ({ongoing.start_time}-{ongoing.end_time})
                          </span>
                        </p>
                      ) : (
                        <p className="flex items-center gap-1.5">
                          <Clock size={14} /> {labSched.length} jadwal praktikum terdaftar
                        </p>
                      )}
                    </div>
                    <span className="mt-4 inline-flex items-center gap-1 text-sm font-semibold text-blue-600">
                      Lihat Detail <ChevronRight size={16} />
                    </span>
                  </Link>
                </motion.div>
              );
            })}
          </div>
        )}
      </section>

      {/* Steps */}
      <section className="border-t border-zinc-200 bg-white">
        <div className="mx-auto max-w-6xl px-4 py-10">
          <h2 className="text-xl font-bold text-zinc-900">Alur Pelaporan Kerusakan</h2>
          <p className="mt-1 text-sm text-zinc-500">Tiga langkah mudah untuk melaporkan kerusakan perangkat lab.</p>
          <div className="mt-5 grid gap-4 sm:grid-cols-3">
            {[
              {
                icon: ClipboardList,
                step: 'Langkah 1',
                title: 'Isi Formulir Laporan',
                desc: 'Isi nama, NIM, lab, nomor PC, dan deskripsi kerusakan sedetail mungkin.',
              },
              {
                icon: Ticket,
                step: 'Langkah 2',
                title: 'Terima Nomor Tiket',
                desc: 'Sistem menerbitkan nomor tiket unik (TIK-XXXXXX) sebagai bukti laporan Anda.',
              },
              {
                icon: Search,
                step: 'Langkah 3',
                title: 'Pantau Status',
                desc: 'Lacak progres penanganan: Diterima → Diproses → Selesai, lengkap dengan catatan teknisi.',
              },
            ].map((s) => (
              <div key={s.title} className="rounded-lg border border-zinc-200 bg-zinc-50 p-5">
                <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-600 text-white">
                  <s.icon size={20} />
                </span>
                <p className="mt-3 font-mono text-xs font-semibold uppercase tracking-widest text-blue-600">
                  {s.step}
                </p>
                <h3 className="mt-1 text-sm font-bold text-zinc-900">{s.title}</h3>
                <p className="mt-1 text-sm text-zinc-600">{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
