import { useEffect, useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { AlertTriangle, ArrowLeft, BookOpen, MapPin, Monitor, Plus, Users } from 'lucide-react';
import { api, DAY_ORDER, formatDateTime } from '../lib/api';
import type { Lab, PcUnit, Schedule } from '../lib/api';
import { Badge, Button, Card, EmptyState, LabStatusBadge, Modal, SectionTitle, Spinner, TableWrap, tdCls, thCls, UnitStatusBadge, cn } from '../components/ui';

function unitCellTone(status: string): string {
  if (status === 'Rusak') return 'border-red-200 bg-red-50 hover:border-red-400';
  if (status === 'Perbaikan') return 'border-amber-200 bg-amber-50 hover:border-amber-400';
  if (status === 'Nonaktif') return 'border-slate-200 bg-slate-50 hover:border-slate-400';
  return 'border-slate-200 bg-white hover:border-blue-400';
}

function unitDot(status: string): string {
  if (status === 'Aktif') return 'bg-emerald-500';
  if (status === 'Perbaikan') return 'bg-amber-500';
  if (status === 'Rusak') return 'bg-red-500';
  return 'bg-slate-300';
}

export default function LabDetail() {
  const { id } = useParams<{ id: string }>();
  const [lab, setLab] = useState<Lab | null>(null);
  const [units, setUnits] = useState<PcUnit[]>([]);
  const [schedules, setSchedules] = useState<Schedule[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selected, setSelected] = useState<PcUnit | null>(null);

  const load = async () => {
    if (!id) return;
    setLoading(true);
    setError(null);
    try {
      const [labRow, unitRows, schedRows] = await Promise.all([
        api.labs.get(id),
        api.units.list(id),
        api.schedules.list(id),
      ]);
      setLab(labRow);
      setUnits(unitRows);
      setSchedules(schedRows);
      document.title = `${labRow.name} — SIMLAB-TIK`;
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Gagal memuat data lab.');
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
    for (const s of schedules) {
      if (!map[s.day]) map[s.day] = [];
      map[s.day].push(s);
    }
    for (const d of Object.keys(map)) map[d].sort((a, b) => a.start_time.localeCompare(b.start_time));
    return map;
  }, [schedules]);

  if (loading) {
    return (
      <div className="rounded-md border border-slate-200 bg-white">
        <Spinner label="Memuat detail laboratorium..." />
      </div>
    );
  }

  if (error || !lab) {
    return (
      <div className="rounded-md border border-red-200 bg-white p-8 text-center">
        <AlertTriangle className="mx-auto h-6 w-6 text-red-500" />
        <p className="mt-2 text-sm font-semibold text-slate-900">Data lab tidak ditemukan</p>
        <p className="mt-1 text-sm text-slate-500">{error || 'Lab yang Anda cari tidak tersedia.'}</p>
        <Link to="/" className="mt-4 inline-flex h-9 items-center gap-2 rounded-md border border-slate-300 px-4 text-sm font-medium text-slate-700 hover:bg-slate-50">
          <ArrowLeft className="h-4 w-4" /> Kembali
        </Link>
      </div>
    );
  }

  const rep = units[0];

  return (
    <div>
      <Link to="/" className="inline-flex items-center gap-1.5 text-[13px] font-medium text-slate-500 hover:text-slate-900">
        <ArrowLeft className="h-4 w-4" /> Laboratorium <span className="text-slate-300">/</span> <span className="text-slate-900">{lab.name}</span>
      </Link>

      <Card className="mt-3 p-5 sm:p-6">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-xl font-semibold tracking-tight text-slate-900 sm:text-2xl">{lab.name}</h1>
              <span className="rounded border border-slate-200 bg-slate-50 px-1.5 py-0.5 font-mono text-xs font-medium text-slate-600">{lab.code}</span>
              <LabStatusBadge status={lab.status} />
            </div>
            <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-[13px] text-slate-500">
              <span className="inline-flex items-center gap-1.5"><MapPin className="h-3.5 w-3.5 text-slate-400" />{lab.location || '-'}</span>
              <span className="inline-flex items-center gap-1.5"><Users className="h-3.5 w-3.5 text-slate-400" />Kapasitas {lab.capacity ?? '-'} kursi</span>
              <span className="inline-flex items-center gap-1.5"><Monitor className="h-3.5 w-3.5 text-slate-400" /><span className="font-mono">{lab.pc_total}</span> unit PC</span>
            </div>
            <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-600">{lab.description || 'Belum ada deskripsi untuk laboratorium ini.'}</p>
            {rep && (
              <p className="mt-3 font-mono text-xs leading-5 text-slate-500">
                {rep.processor} &nbsp;•&nbsp; {rep.ram} &nbsp;•&nbsp; {rep.storage} &nbsp;•&nbsp; {rep.gpu} &nbsp;•&nbsp; {rep.os}
              </p>
            )}
          </div>
          <div className="grid shrink-0 grid-cols-2 gap-3 lg:w-72">
            <div className="rounded-md border border-slate-200 bg-slate-50 p-3">
              <p className="text-xs text-slate-500">PC Aktif</p>
              <p className="mt-0.5 font-mono text-xl font-semibold text-slate-900">{lab.pc_active}<span className="text-sm font-normal text-slate-400">/{lab.pc_total}</span></p>
            </div>
            <div className="rounded-md border border-slate-200 bg-slate-50 p-3">
              <p className="text-xs text-slate-500">Perlu Perhatian</p>
              <p className="mt-0.5 font-mono text-xl font-semibold text-slate-900">{lab.pc_damaged}<span className="text-sm font-normal text-slate-400"> unit</span></p>
            </div>
            <div className="rounded-md border border-slate-200 bg-slate-50 p-3">
              <p className="text-xs text-slate-500">Laporan Terbuka</p>
              <p className="mt-0.5 font-mono text-xl font-semibold text-slate-900">{lab.tickets_open}<span className="text-sm font-normal text-slate-400"> tiket</span></p>
            </div>
            <div className="rounded-md border border-slate-200 bg-slate-50 p-3">
              <p className="text-xs text-slate-500">Jadwal/Minggu</p>
              <p className="mt-0.5 font-mono text-xl font-semibold text-slate-900">{schedules.length}<span className="text-sm font-normal text-slate-400"> sesi</span></p>
            </div>
            <Link to={`/lapor?lab=${lab.id}`} className="col-span-2 inline-flex h-9 items-center justify-center gap-2 rounded-md bg-blue-600 px-4 text-sm font-medium text-white hover:bg-blue-700">
              <Plus className="h-4 w-4" /> Laporkan Kerusakan di {lab.name}
            </Link>
          </div>
        </div>
      </Card>

      <div className="mt-8">
        <SectionTitle
          title="Peta Status Unit PC"
          description="Klik salah satu unit untuk melihat spesifikasi lengkap. Warna menunjukkan kondisi terkini perangkat."
        />
        {units.length === 0 ? (
          <EmptyState title="Belum ada data unit PC" description="Admin TIK belum mendaftarkan unit komputer pada lab ini." />
        ) : (
          <>
            <div className="grid grid-cols-3 gap-2 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8">
              {units.map((u) => (
                <button key={u.id} onClick={() => setSelected(u)} className={cn('flex items-center gap-2 rounded border px-2.5 py-2 text-left transition-colors', unitCellTone(u.status))} title={`${u.pc_number} — ${u.status}`}>
                  <span className={cn('h-2 w-2 shrink-0 rounded-full', unitDot(u.status))} />
                  <span className="min-w-0">
                    <span className="block truncate font-mono text-[13px] font-semibold text-slate-900">{u.pc_number}</span>
                    <span className="block truncate text-[11px] text-slate-500">{u.status}</span>
                  </span>
                </button>
              ))}
            </div>
            <div className="mt-3 flex flex-wrap items-center gap-4 text-xs text-slate-500">
              {['Aktif', 'Perbaikan', 'Rusak', 'Nonaktif'].map((s) => (
                <span key={s} className="inline-flex items-center gap-1.5">
                  <span className={cn('h-2 w-2 rounded-full', unitDot(s))} /> {s}
                </span>
              ))}
            </div>
          </>
        )}
      </div>

      <div className="mt-8">
        <SectionTitle title="Spesifikasi Teknis" description={`Rincian perangkat keras dan sistem operasi seluruh ${units.length} unit komputer.`} />
        {units.length === 0 ? (
          <EmptyState title="Spesifikasi belum tersedia" />
        ) : (
          <TableWrap minWidth={900}>
            <thead>
              <tr>
                <th className={thCls}>Unit</th>
                <th className={thCls}>Processor</th>
                <th className={thCls}>RAM</th>
                <th className={thCls}>Storage</th>
                <th className={thCls}>GPU</th>
                <th className={thCls}>Monitor</th>
                <th className={thCls}>OS</th>
                <th className={thCls}>Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 bg-white">
              {units.map((u) => (
                <tr key={u.id} className="transition-colors hover:bg-slate-50">
                  <td className={tdCls}><button onClick={() => setSelected(u)} className="font-mono text-[13px] font-semibold text-blue-700 hover:underline">{u.pc_number}</button></td>
                  <td className={cn(tdCls, 'font-mono text-[13px]')}>{u.processor}</td>
                  <td className={cn(tdCls, 'font-mono text-[13px]')}>{u.ram}</td>
                  <td className={cn(tdCls, 'font-mono text-[13px]')}>{u.storage}</td>
                  <td className={cn(tdCls, 'font-mono text-[13px]')}>{u.gpu}</td>
                  <td className={cn(tdCls, 'font-mono text-[13px]')}>{u.monitor}</td>
                  <td className={cn(tdCls, 'text-[13px]')}>{u.os}</td>
                  <td className={tdCls}><UnitStatusBadge status={u.status} /></td>
                </tr>
              ))}
            </tbody>
          </TableWrap>
        )}
      </div>

      <div className="mt-8">
        <SectionTitle title="Jadwal Penggunaan Lab" description="Mata kuliah, dosen pengampu, dan kelas yang terjadwal menggunakan laboratorium ini." />
        {schedules.length === 0 ? (
          <EmptyState title="Belum ada jadwal" description="Belum ada mata kuliah yang terjadwal pada lab ini untuk semester berjalan." />
        ) : (
          <div className="space-y-4">
            {DAY_ORDER.map((day) => {
              const rows = byDay[day];
              if (!rows || rows.length === 0) return null;
              return (
                <div key={day} className="overflow-hidden rounded-md border border-slate-200 bg-white">
                  <div className="flex items-center gap-2 border-b border-slate-200 bg-slate-50 px-4 py-2.5">
                    <BookOpen className="h-4 w-4 text-slate-400" />
                    <span className="text-[13px] font-semibold text-slate-900">{day}</span>
                    <Badge tone="slate">{rows.length} sesi</Badge>
                  </div>
                  <div className="scroll-thin overflow-x-auto">
                    <table className="w-full min-w-[720px] border-collapse text-left">
                      <thead>
                        <tr>
                          <th className={thCls}>Jam</th>
                          <th className={thCls}>Kode</th>
                          <th className={thCls}>Mata Kuliah</th>
                          <th className={thCls}>Dosen</th>
                          <th className={thCls}>Kelas</th>
                          <th className={thCls}>Semester</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {rows.map((s) => (
                          <tr key={s.id} className="transition-colors hover:bg-slate-50">
                            <td className={cn(tdCls, 'whitespace-nowrap font-mono text-[13px]')}>{s.start_time.slice(0, 5)} - {s.end_time.slice(0, 5)}</td>
                            <td className={cn(tdCls, 'font-mono text-[13px]')}>{s.course_code || '-'}</td>
                            <td className={cn(tdCls, 'font-medium text-slate-900')}>{s.course_name}</td>
                            <td className={tdCls}>{s.lecturer || '-'}</td>
                            <td className={cn(tdCls, 'font-mono text-[13px]')}>{s.class_group || '-'}</td>
                            <td className={cn(tdCls, 'whitespace-nowrap text-[13px] text-slate-500')}>{s.semester || '-'}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <Modal open={!!selected} onClose={() => setSelected(null)} title={selected ? `Spesifikasi ${selected.pc_number}` : ''} subtitle={selected ? `${lab.name} • Terdaftar ${formatDateTime(selected.created_at)}` : ''}>
        {selected && (
          <div>
            <div className="mb-4"><UnitStatusBadge status={selected.status} /></div>
            <dl className="divide-y divide-slate-100 rounded-md border border-slate-200">
              {[
                ['Processor', selected.processor],
                ['RAM', selected.ram],
                ['Storage', selected.storage],
                ['GPU', selected.gpu],
                ['Monitor', selected.monitor],
                ['Sistem Operasi', selected.os],
              ].map(([k, v]) => (
                <div key={k} className="grid grid-cols-3 gap-3 px-4 py-2.5 text-sm">
                  <dt className="text-slate-500">{k}</dt>
                  <dd className="col-span-2 font-mono text-[13px] text-slate-900">{v}</dd>
                </div>
              ))}
              {selected.notes && (
                <div className="grid grid-cols-3 gap-3 bg-amber-50 px-4 py-2.5 text-sm">
                  <dt className="text-amber-700">Catatan</dt>
                  <dd className="col-span-2 text-[13px] text-amber-800">{selected.notes}</dd>
                </div>
              )}
            </dl>
            <div className="mt-4 flex justify-end gap-2">
              <Button onClick={() => setSelected(null)}>Tutup</Button>
              <Link to={`/lapor?lab=${lab.id}&pc=${encodeURIComponent(selected.pc_number)}`}>
                <Button variant="primary">Laporkan Unit Ini</Button>
              </Link>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
