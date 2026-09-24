import { useEffect, useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { ChevronLeft, MapPin, Monitor, FileText, CalendarClock, Cpu } from 'lucide-react';
import { apiFetch, DAYS } from '../lib/api';
import type { Lab, PcSpec, Schedule } from '../lib/api';
import { Spinner, ErrorBanner, EmptyState, PcStatusBadge, thCls, tdCls } from '../components/ui';

export default function LabDetail() {
  const { id } = useParams();
  const [lab, setLab] = useState<Lab | null>(null);
  const [specs, setSpecs] = useState<PcSpec[]>([]);
  const [schedules, setSchedules] = useState<Schedule[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const load = async () => {
    setLoading(true);
    setError('');
    try {
      const [labData, specsData, schedData] = await Promise.all([
        apiFetch<Lab | null>(`/api/labs?id=${id}`),
        apiFetch<PcSpec[]>(`/api/specs?lab_id=${id}`),
        apiFetch<Schedule[]>(`/api/schedules?lab_id=${id}`),
      ]);
      setLab(labData);
      setSpecs(specsData);
      setSchedules(schedData);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Gagal memuat data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const byDay = useMemo(() => {
    const map: Record<string, Schedule[]> = {};
    schedules.forEach((s) => {
      if (!map[s.day]) map[s.day] = [];
      map[s.day].push(s);
    });
    Object.values(map).forEach((arr) => arr.sort((a, b) => a.start_time.localeCompare(b.start_time)));
    return DAYS.map((day) => ({ day, items: map[day] || [] })).filter((g) => g.items.length > 0);
  }, [schedules]);

  if (loading) {
    return (
      <div className="mx-auto max-w-6xl px-4 py-10">
        <Spinner label="Memuat detail lab..." />
      </div>
    );
  }
  if (error) {
    return (
      <div className="mx-auto max-w-6xl px-4 py-10">
        <ErrorBanner message={error} onRetry={load} />
      </div>
    );
  }
  if (!lab) {
    return (
      <div className="mx-auto max-w-6xl px-4 py-10">
        <EmptyState title="Lab tidak ditemukan" desc="ID laboratorium tidak valid." />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      <Link to="/" className="inline-flex items-center gap-1 text-sm font-medium text-zinc-600 hover:text-zinc-900">
        <ChevronLeft size={16} /> Kembali ke Daftar Lab
      </Link>

      <div className="mt-4 rounded-lg border border-zinc-200 bg-white p-6 shadow-sm">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <span className="rounded-md bg-blue-50 px-2 py-1 font-mono text-xs font-bold text-blue-700">
              {lab.code}
            </span>
            <h1 className="mt-2 text-2xl font-bold text-zinc-900">{lab.name}</h1>
            <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-sm text-zinc-500">
              <span className="inline-flex items-center gap-1.5">
                <MapPin size={15} /> {lab.floor || '-'}
              </span>
              <span className="inline-flex items-center gap-1.5">
                <Monitor size={15} /> <span className="font-mono font-semibold text-zinc-700">{lab.total_pc} unit PC</span>
              </span>
            </div>
            {lab.description && <p className="mt-3 max-w-3xl text-sm text-zinc-600">{lab.description}</p>}
          </div>
          <Link
            to={`/lapor?lab=${lab.id}`}
            className="inline-flex shrink-0 items-center justify-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700"
          >
            <FileText size={16} /> Lapor Kerusakan di Lab Ini
          </Link>
        </div>
      </div>

      {/* Specs */}
      <div className="mt-6 rounded-lg border border-zinc-200 bg-white shadow-sm">
        <div className="flex items-center gap-2 border-b border-zinc-200 px-5 py-4">
          <Cpu size={18} className="text-blue-600" />
          <h2 className="text-base font-bold text-zinc-900">Spesifikasi Perangkat</h2>
        </div>
        {specs.length === 0 ? (
          <div className="p-5">
            <EmptyState title="Belum ada data spesifikasi" desc="Data hardware lab ini belum diinput admin." />
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[900px] border-collapse">
              <thead>
                <tr className="border-b border-zinc-200 bg-zinc-50">
                  <th className={thCls}>Unit</th>
                  <th className={thCls}>Processor</th>
                  <th className={thCls}>RAM</th>
                  <th className={thCls}>Storage</th>
                  <th className={thCls}>GPU</th>
                  <th className={thCls}>Monitor</th>
                  <th className={thCls}>OS</th>
                  <th className={thCls}>Kondisi</th>
                </tr>
              </thead>
              <tbody>
                {specs.map((s) => (
                  <tr key={s.id} className="border-b border-zinc-100 font-mono text-xs last:border-0">
                    <td className="px-4 py-3 font-bold text-zinc-900">{s.pc_id}</td>
                    <td className={tdCls}>{s.processor || '-'}</td>
                    <td className={tdCls}>{s.ram || '-'}</td>
                    <td className={tdCls}>{s.storage || '-'}</td>
                    <td className={tdCls}>{s.gpu || '-'}</td>
                    <td className={tdCls}>{s.monitor || '-'}</td>
                    <td className={tdCls}>{s.os || '-'}</td>
                    <td className="px-4 py-3">
                      <PcStatusBadge status={s.status} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Schedules */}
      <div className="mt-6 rounded-lg border border-zinc-200 bg-white shadow-sm">
        <div className="flex items-center gap-2 border-b border-zinc-200 px-5 py-4">
          <CalendarClock size={18} className="text-blue-600" />
          <h2 className="text-base font-bold text-zinc-900">Jadwal Praktikum</h2>
        </div>
        {byDay.length === 0 ? (
          <div className="p-5">
            <EmptyState title="Belum ada jadwal" desc="Jadwal praktikum lab ini belum diinput admin." />
          </div>
        ) : (
          <div className="grid gap-4 p-5 md:grid-cols-2">
            {byDay.map((g) => (
              <div key={g.day} className="rounded-lg border border-zinc-200">
                <p className="border-b border-zinc-200 bg-zinc-50 px-4 py-2.5 text-sm font-bold text-zinc-900">
                  {g.day}
                </p>
                <ul className="divide-y divide-zinc-100">
                  {g.items.map((s) => (
                    <li key={s.id} className="px-4 py-3">
                      <p className="text-sm font-semibold text-zinc-900">{s.course_name}</p>
                      <p className="mt-0.5 text-xs text-zinc-500">{s.lecturer_name || '-'}</p>
                      <p className="mt-1 font-mono text-xs font-semibold text-blue-700">
                        {s.start_time} - {s.end_time} WIB
                        {s.semester ? ` • ${s.semester}` : ''}
                      </p>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
