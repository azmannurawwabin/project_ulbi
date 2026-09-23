import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Building2, CheckCircle2, Cog, Inbox, Plus } from 'lucide-react';
import { api, formatDateTime, timeAgo } from '../../lib/api';
import type { Lab, Ticket } from '../../lib/api';
import { Button, Card, EmptyState, PageHeader, SectionTitle, Spinner, StatCard, TableWrap, TicketStatusBadge, tdCls, thCls } from '../../components/ui';

export default function AdminDashboard() {
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [labs, setLabs] = useState<Lab[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    document.title = 'Dashboard Admin — SIMLAB-TIK';
    (async () => {
      try {
        const [t, l] = await Promise.all([api.tickets.list(), api.labs.list()]);
        setTickets(t);
        setLabs(l);
      } catch {
        setTickets([]);
        setLabs([]);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const hour = new Date().getHours();
  const greeting = hour < 11 ? 'Selamat pagi' : hour < 15 ? 'Selamat siang' : hour < 19 ? 'Selamat sore' : 'Selamat malam';
  const count = (s: string) => tickets.filter((t) => t.status === s).length;
  const recent = tickets.slice(0, 8);
  const attention = tickets.filter((t) => t.status === 'Diterima').slice(-5).reverse();

  if (loading) {
    return (
      <div className="rounded-md border border-slate-200 bg-white">
        <Spinner label="Memuat dashboard..." />
      </div>
    );
  }

  return (
    <div>
      <PageHeader
        title={`${greeting}, Admin`}
        description="Ringkasan kondisi laboratorium dan antrean laporan kerusakan hari ini."
        actions={
          <Link to="/admin/laporan">
            <Button variant="primary">Kelola Laporan <ArrowRight className="h-4 w-4" /></Button>
          </Link>
        }
      />

      <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
        <StatCard label="Total Laporan" value={tickets.length} sub="Seluruh tiket masuk" icon={<Inbox className="h-4 w-4 text-slate-400" />} />
        <StatCard label="Diterima" value={count('Diterima')} sub="Menunggu verifikasi" icon={<Inbox className="h-4 w-4 text-amber-500" />} />
        <StatCard label="Diproses" value={count('Diproses')} sub="Dikerjakan teknisi" icon={<Cog className="h-4 w-4 text-blue-500" />} />
        <StatCard label="Selesai" value={count('Selesai')} sub="Sudah ditangani" icon={<CheckCircle2 className="h-4 w-4 text-emerald-500" />} />
      </div>

      <div className="mt-6 grid gap-6 xl:grid-cols-3">
        <div className="xl:col-span-2">
          <SectionTitle
            title="Laporan Terbaru"
            description="Tiket yang baru masuk, diurutkan dari yang terkini."
            action={<Link to="/admin/laporan" className="inline-flex items-center gap-1 text-[13px] font-medium text-blue-700 hover:underline">Lihat semua <ArrowRight className="h-3.5 w-3.5" /></Link>}
          />
          {recent.length === 0 ? (
            <EmptyState title="Belum ada laporan" description="Laporan kerusakan dari mahasiswa akan tampil di sini." />
          ) : (
            <TableWrap minWidth={620}>
              <thead>
                <tr><th className={thCls}>Tiket</th><th className={thCls}>Pelapor</th><th className={thCls}>Lab / PC</th><th className={thCls}>Status</th><th className={thCls}>Waktu</th></tr>
              </thead>
              <tbody className="divide-y divide-slate-100 bg-white">
                {recent.map((t) => (
                  <tr key={t.id} className="transition-colors hover:bg-slate-50">
                    <td className={tdCls}><Link to={`/admin/laporan?q=${encodeURIComponent(t.ticket_no)}`} className="font-mono text-[13px] font-semibold text-blue-700 hover:underline">{t.ticket_no}</Link></td>
                    <td className={tdCls}><span className="block font-medium text-slate-900">{t.reporter_name}</span><span className="font-mono text-xs text-slate-500">{t.reporter_nim}</span></td>
                    <td className={tdCls}><span className="block text-[13px]">{t.labs?.name || '-'}</span><span className="font-mono text-xs text-slate-500">{t.pc_number}</span></td>
                    <td className={tdCls}><TicketStatusBadge status={t.status} /></td>
                    <td className={tdCls}><span className="whitespace-nowrap text-[13px] text-slate-500" title={formatDateTime(t.created_at)}>{timeAgo(t.created_at)}</span></td>
                  </tr>
                ))}
              </tbody>
            </TableWrap>
          )}
        </div>

        <div>
          <SectionTitle title="Perlu Ditindaklanjuti" description="Laporan berstatus Diterima yang belum diproses." />
          {attention.length === 0 ? (
            <Card className="p-5 text-center">
              <CheckCircle2 className="mx-auto h-6 w-6 text-emerald-500" />
              <p className="mt-2 text-sm font-medium text-slate-700">Antrean bersih</p>
              <p className="mt-0.5 text-[13px] text-slate-500">Tidak ada laporan menunggu verifikasi.</p>
            </Card>
          ) : (
            <div className="space-y-2">
              {attention.map((t) => (
                <div key={t.id} className="flex items-center gap-3 rounded-md border border-slate-200 bg-white p-3">
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-mono text-[13px] font-semibold text-slate-900">{t.ticket_no}</p>
                    <p className="truncate text-xs text-slate-500">{t.labs?.name} • {t.pc_number} • {timeAgo(t.created_at)}</p>
                  </div>
                  <Link to={`/admin/laporan?q=${encodeURIComponent(t.ticket_no)}`}>
                    <Button size="sm">Proses</Button>
                  </Link>
                </div>
              ))}
            </div>
          )}

          <div className="mt-6">
            <SectionTitle title="Aksi Cepat" />
            <div className="grid gap-2">
              <Link to="/admin/lab" className="flex items-center gap-3 rounded-md border border-slate-200 bg-white p-3 text-sm font-medium text-slate-700 hover:border-blue-300 hover:text-blue-700">
                <Building2 className="h-4 w-4 text-slate-400" /> Kelola Data Lab <Plus className="ml-auto h-4 w-4 text-slate-300" />
              </Link>
              <Link to="/admin/unit" className="flex items-center gap-3 rounded-md border border-slate-200 bg-white p-3 text-sm font-medium text-slate-700 hover:border-blue-300 hover:text-blue-700">
                <Cog className="h-4 w-4 text-slate-400" /> Kelola Unit & Spesifikasi <Plus className="ml-auto h-4 w-4 text-slate-300" />
              </Link>
              <Link to="/admin/jadwal" className="flex items-center gap-3 rounded-md border border-slate-200 bg-white p-3 text-sm font-medium text-slate-700 hover:border-blue-300 hover:text-blue-700">
                <CheckCircle2 className="h-4 w-4 text-slate-400" /> Kelola Jadwal Kuliah <Plus className="ml-auto h-4 w-4 text-slate-300" />
              </Link>
            </div>
          </div>
        </div>
      </div>

      <div className="mt-6">
        <SectionTitle title="Kesehatan Laboratorium" description="Ketersediaan unit PC dan beban laporan terbuka per lab." />
        <TableWrap minWidth={600}>
          <thead>
            <tr><th className={thCls}>Lab</th><th className={thCls}>PC Aktif</th><th className={thCls}>Rusak / Perbaikan</th><th className={thCls}>Laporan Terbuka</th></tr>
          </thead>
          <tbody className="divide-y divide-slate-100 bg-white">
            {labs.map((l) => {
              const pct = l.pc_total ? Math.round((l.pc_active / l.pc_total) * 100) : 0;
              return (
                <tr key={l.id} className="transition-colors hover:bg-slate-50">
                  <td className={tdCls}><Link to={`/lab/${l.id}`} className="font-medium text-slate-900 hover:text-blue-700 hover:underline">{l.name}</Link> <span className="font-mono text-xs text-slate-400">{l.code}</span></td>
                  <td className={tdCls}>
                    <div className="flex items-center gap-2">
                      <div className="h-1.5 w-28 overflow-hidden rounded-sm bg-slate-100"><div className="h-full rounded-sm bg-blue-600" style={{ width: `${pct}%` }} /></div>
                      <span className="font-mono text-[13px] text-slate-600">{l.pc_active}/{l.pc_total}</span>
                    </div>
                  </td>
                  <td className={tdCls}><span className="font-mono text-[13px]">{l.pc_damaged} unit</span></td>
                  <td className={tdCls}>{l.tickets_open > 0 ? <span className="font-mono text-[13px] font-semibold text-amber-700">{l.tickets_open} tiket</span> : <span className="text-[13px] text-slate-400">—</span>}</td>
                </tr>
              );
            })}
          </tbody>
        </TableWrap>
      </div>
    </div>
  );
}
