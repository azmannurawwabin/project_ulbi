import { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { AlertTriangle, Camera, Check, Copy, Search, StickyNote, User } from 'lucide-react';
import { api, formatDateTime } from '../lib/api';
import type { Ticket } from '../lib/api';
import { Button, Card, PageHeader, TicketPipeline, TicketStatusBadge } from '../components/ui';

type Phase = 'idle' | 'loading' | 'found' | 'notfound' | 'error';

export default function TrackTicket() {
  const [params] = useSearchParams();
  const [q, setQ] = useState(params.get('tiket') || '');
  const [phase, setPhase] = useState<Phase>('idle');
  const [ticket, setTicket] = useState<Ticket | null>(null);
  const [copied, setCopied] = useState(false);

  const search = async (ticketNo: string) => {
    const no = ticketNo.trim();
    if (!no) return;
    setPhase('loading');
    setTicket(null);
    try {
      const row = await api.tickets.getByNo(no);
      if (row) {
        setTicket(row);
        setPhase('found');
      } else {
        setPhase('notfound');
      }
    } catch {
      setPhase('error');
    }
  };

  useEffect(() => {
    document.title = 'Lacak Tiket — SIMLAB-TIK';
    const preset = params.get('tiket');
    if (preset) search(preset);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const copyNo = async () => {
    if (!ticket) return;
    try {
      await navigator.clipboard.writeText(ticket.ticket_no);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      /* abaikan */
    }
  };

  return (
    <div className="mx-auto max-w-3xl">
      <PageHeader title="Lacak Status Laporan" description="Masukkan nomor tiket yang Anda terima saat melapor untuk melihat progres penanganan." />

      <Card className="p-5 sm:p-6">
        <form
          onSubmit={(e) => { e.preventDefault(); search(q); }}
          className="flex flex-col gap-2 sm:flex-row"
        >
          <div className="relative flex-1">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              value={q}
              onChange={(e) => setQ(e.target.value.toUpperCase())}
              placeholder="cth: TIK-260915-K7Q2"
              className="block h-10 w-full rounded-md border border-slate-300 bg-white pl-9 pr-3 font-mono text-sm tracking-wide text-slate-900 placeholder:font-sans placeholder:text-slate-400 focus:border-blue-600 focus:outline-none focus:ring-1 focus:ring-blue-600"
            />
          </div>
          <Button type="submit" variant="primary" loading={phase === 'loading'} className="h-10">Lacak Tiket</Button>
        </form>
        <p className="mt-2 text-xs text-slate-500">Nomor tiket tercantum pada halaman konfirmasi setelah laporan dikirim.</p>
      </Card>

      <div className="mt-5">
        {phase === 'idle' && (
          <Card className="border-dashed p-8 text-center">
            <Search className="mx-auto h-6 w-6 text-slate-300" />
            <p className="mt-2 text-sm text-slate-500">Belum ada pencarian. Masukkan nomor tiket pada kolom di atas.</p>
          </Card>
        )}

        {phase === 'loading' && (
          <Card className="p-8 text-center text-sm text-slate-500">Mencari tiket...</Card>
        )}

        {phase === 'notfound' && (
          <div className="rounded-md border border-amber-200 bg-white p-6 text-center">
            <AlertTriangle className="mx-auto h-6 w-6 text-amber-500" />
            <p className="mt-2 text-sm font-semibold text-slate-900">Tiket tidak ditemukan</p>
            <p className="mx-auto mt-1 max-w-md text-sm text-slate-500">
              Periksa kembali nomor tiket yang Anda masukkan. Format yang benar diawali <span className="font-mono text-[13px]">TIK-</span> diikuti tanggal dan kode unik.
            </p>
          </div>
        )}

        {phase === 'error' && (
          <div className="rounded-md border border-red-200 bg-white p-6 text-center">
            <AlertTriangle className="mx-auto h-6 w-6 text-red-500" />
            <p className="mt-2 text-sm font-semibold text-slate-900">Terjadi kesalahan</p>
            <p className="mt-1 text-sm text-slate-500">Gagal menghubungi server. Silakan coba beberapa saat lagi.</p>
          </div>
        )}

        {phase === 'found' && ticket && (
          <Card className="overflow-hidden">
            <div className="border-b border-slate-200 bg-slate-50 px-5 py-4 sm:px-6">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <div className="flex items-center gap-2">
                    <p className="font-mono text-lg font-semibold tracking-tight text-slate-900">{ticket.ticket_no}</p>
                    <button onClick={copyNo} className="rounded p-1 text-slate-400 hover:bg-slate-200 hover:text-slate-700" title="Salin nomor tiket">
                      {copied ? <Check className="h-4 w-4 text-emerald-600" /> : <Copy className="h-4 w-4" />}
                    </button>
                  </div>
                  <p className="mt-0.5 text-xs text-slate-500">Dilaporkan {formatDateTime(ticket.created_at)} • Diperbarui {formatDateTime(ticket.updated_at)}</p>
                </div>
                <TicketStatusBadge status={ticket.status} />
              </div>
              <div className="mt-4 rounded-md border border-slate-200 bg-white px-4 py-3">
                <TicketPipeline status={ticket.status} />
              </div>
            </div>
            <div className="px-5 py-5 sm:px-6">
              <div className="grid gap-4 text-sm sm:grid-cols-2">
                <div className="rounded-md border border-slate-200 p-3.5">
                  <p className="flex items-center gap-1.5 text-xs font-medium uppercase tracking-wider text-slate-400"><User className="h-3.5 w-3.5" /> Pelapor</p>
                  <p className="mt-1.5 font-medium text-slate-900">{ticket.reporter_name}</p>
                  <p className="font-mono text-[13px] text-slate-500">{ticket.reporter_nim}</p>
                </div>
                <div className="rounded-md border border-slate-200 p-3.5">
                  <p className="text-xs font-medium uppercase tracking-wider text-slate-400">Lokasi & Kategori</p>
                  <p className="mt-1.5 font-medium text-slate-900">{ticket.labs?.name || 'Lab dihapus'} <span className="font-mono text-[13px] font-normal text-slate-500">• {ticket.pc_number}</span></p>
                  <p className="text-[13px] text-slate-500">{ticket.category}</p>
                </div>
              </div>
              <div className="mt-4">
                <p className="text-xs font-medium uppercase tracking-wider text-slate-400">Deskripsi Kerusakan</p>
                <p className="mt-1.5 whitespace-pre-wrap rounded-md border border-slate-200 bg-slate-50 px-3.5 py-3 text-sm leading-6 text-slate-700">{ticket.description}</p>
              </div>
              {ticket.photo_url && (
                <div className="mt-4">
                  <p className="flex items-center gap-1.5 text-xs font-medium uppercase tracking-wider text-slate-400"><Camera className="h-3.5 w-3.5" /> Foto Lampiran</p>
                  <a href={ticket.photo_url} target="_blank" rel="noreferrer" className="mt-2 inline-block">
                    <img src={ticket.photo_url} alt="Foto kerusakan" className="max-h-64 rounded-md border border-slate-200 object-contain" />
                  </a>
                </div>
              )}
              <div className="mt-4">
                <p className="flex items-center gap-1.5 text-xs font-medium uppercase tracking-wider text-slate-400"><StickyNote className="h-3.5 w-3.5" /> Catatan Teknisi</p>
                {ticket.technician_note ? (
                  <div className="mt-1.5 rounded-md border border-blue-200 bg-blue-50 px-3.5 py-3 text-sm leading-6 text-slate-700">
                    {ticket.technician_note}
                    {ticket.handled_by && <p className="mt-1.5 text-[13px] text-slate-500">Ditangani oleh: <span className="font-medium text-slate-700">{ticket.handled_by}</span></p>}
                  </div>
                ) : (
                  <p className="mt-1.5 rounded-md border border-dashed border-slate-300 px-3.5 py-3 text-sm text-slate-400">Belum ada catatan dari teknisi.</p>
                )}
              </div>
              <div className="mt-5 flex flex-col gap-2 border-t border-slate-100 pt-4 sm:flex-row">
                <Button onClick={() => { setQ(''); setTicket(null); setPhase('idle'); }}>Lacak Tiket Lain</Button>
                <Link to="/lapor" className="inline-flex h-9 items-center justify-center rounded-md px-4 text-sm font-medium text-slate-600 hover:bg-slate-100">Buat Laporan Baru</Link>
              </div>
            </div>
          </Card>
        )}
      </div>
    </div>
  );
}
