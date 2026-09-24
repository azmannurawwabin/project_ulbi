import { useEffect, useState } from 'react';
import type { FormEvent } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { Search, ChevronLeft, CheckCircle2, Circle, Wrench, MapPin, Monitor, User, CalendarClock } from 'lucide-react';
import { apiFetch, formatDateTime, STATUS_LABEL } from '../lib/api';
import type { Report } from '../lib/api';
import { inputCls, btnPrimary, Spinner, StatusBadge } from '../components/ui';

const steps = ['diterima', 'diproses', 'selesai'];

export default function TrackTicket() {
  const [params] = useSearchParams();
  const [ticket, setTicket] = useState(params.get('tiket') || '');
  const [report, setReport] = useState<Report | null>(null);
  const [searched, setSearched] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const search = async (ticketNo: string) => {
    const q = ticketNo.trim();
    if (!q) return;
    setLoading(true);
    setError('');
    setSearched(false);
    try {
      const data = await apiFetch<Report[]>(`/api/reports?ticket=${encodeURIComponent(q)}`);
      setReport(data[0] ?? null);
      setSearched(true);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Gagal melacak tiket');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const t = params.get('tiket');
    if (t) search(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    search(ticket);
  };

  const currentIdx = report ? steps.indexOf(report.status) : -1;

  return (
    <div className="mx-auto max-w-2xl px-4 py-8">
      <Link to="/" className="inline-flex items-center gap-1 text-sm font-medium text-zinc-600 hover:text-zinc-900">
        <ChevronLeft size={16} /> Kembali ke Beranda
      </Link>
      <div className="mt-4 rounded-lg border border-zinc-200 bg-white p-6 shadow-sm sm:p-8">
        <h1 className="text-xl font-bold text-zinc-900">Lacak Status Tiket</h1>
        <p className="mt-1 text-sm text-zinc-500">
          Masukkan nomor tiket (cth: <span className="font-mono font-semibold">TIK-482910</span>) untuk melihat progres
          penanganan laporan Anda.
        </p>
        <form onSubmit={handleSubmit} className="mt-5 flex flex-col gap-2 sm:flex-row">
          <input
            className={`${inputCls} font-mono uppercase sm:flex-1`}
            placeholder="TIK-XXXXXX"
            value={ticket}
            onChange={(e) => setTicket(e.target.value.toUpperCase())}
          />
          <button type="submit" disabled={loading || !ticket.trim()} className={btnPrimary}>
            <Search size={16} /> {loading ? 'Mencari...' : 'Lacak'}
          </button>
        </form>
        {error && (
          <div className="mt-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {error}
          </div>
        )}
        {loading && <Spinner label="Mencari tiket..." />}
        {!loading && searched && !report && (
          <div className="mt-4 rounded-lg border border-yellow-200 bg-yellow-50 px-4 py-3 text-sm text-yellow-800">
            Nomor tiket <span className="font-mono font-bold">{ticket.trim().toUpperCase()}</span> tidak ditemukan.
            Periksa kembali nomor tiket Anda.
          </div>
        )}
        {!loading && report && (
          <div className="mt-6">
            {/* Timeline */}
            <div className="flex items-center">
              {steps.map((s, i) => {
                const passed = i < currentIdx;
                const current = i === currentIdx;
                return (
                  <div key={s} className={`flex items-center ${i < steps.length - 1 ? 'flex-1' : ''}`}>
                    <div className="flex flex-col items-center">
                      <span
                        className={`flex h-9 w-9 items-center justify-center rounded-full border-2 ${
                          passed || current
                            ? 'border-blue-600 bg-blue-600 text-white'
                            : 'border-zinc-200 bg-white text-zinc-300'
                        }`}
                      >
                        {passed ? <CheckCircle2 size={18} /> : current ? <CheckCircle2 size={18} /> : <Circle size={18} />}
                      </span>
                      <span
                        className={`mt-1.5 text-xs font-semibold ${passed || current ? 'text-zinc-900' : 'text-zinc-400'}`}
                      >
                        {STATUS_LABEL[s]}
                      </span>
                    </div>
                    {i < steps.length - 1 && (
                      <div className={`mx-2 mb-6 h-0.5 flex-1 rounded ${i < currentIdx ? 'bg-blue-600' : 'bg-zinc-200'}`} />
                    )}
                  </div>
                );
              })}
            </div>
            {/* Detail */}
            <div className="mt-5 rounded-lg border border-zinc-200 bg-zinc-50 p-5">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <span className="font-mono text-lg font-bold text-zinc-900">{report.ticket_no}</span>
                <StatusBadge status={report.status} />
              </div>
              <div className="mt-4 grid gap-3 text-sm sm:grid-cols-2">
                <p className="flex items-start gap-2 text-zinc-600">
                  <MapPin size={16} className="mt-0.5 shrink-0" />
                  <span>
                    {report.labs?.code} - {report.labs?.name || 'Lab dihapus'}
                  </span>
                </p>
                <p className="flex items-start gap-2 text-zinc-600">
                  <Monitor size={16} className="mt-0.5 shrink-0" />
                  <span className="font-mono font-semibold text-zinc-900">{report.pc_id}</span>
                </p>
                <p className="flex items-start gap-2 text-zinc-600">
                  <User size={16} className="mt-0.5 shrink-0" />
                  <span>
                    {report.student_name} <span className="font-mono">({report.nim})</span>
                  </span>
                </p>
                <p className="flex items-start gap-2 text-zinc-600">
                  <CalendarClock size={16} className="mt-0.5 shrink-0" />
                  <span>Dilaporkan: {formatDateTime(report.created_at)}</span>
                </p>
              </div>
              <div className="mt-4 border-t border-zinc-200 pt-4">
                <p className="text-xs font-semibold uppercase tracking-wide text-zinc-500">Deskripsi Kerusakan</p>
                <p className="mt-1 text-sm text-zinc-800">{report.description}</p>
              </div>
              {report.photo_url && (
                <div className="mt-4">
                  <p className="text-xs font-semibold uppercase tracking-wide text-zinc-500">Foto Bukti</p>
                  <a href={report.photo_url} target="_blank" rel="noreferrer">
                    <img
                      src={report.photo_url}
                      alt="Bukti kerusakan"
                      className="mt-2 max-h-56 rounded-lg border border-zinc-200"
                    />
                  </a>
                </div>
              )}
              {report.technician_note && (
                <div className="mt-4 rounded-lg border border-blue-200 bg-blue-50 p-4">
                  <p className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-blue-700">
                    <Wrench size={14} /> Catatan Teknisi
                  </p>
                  <p className="mt-1 text-sm text-blue-900">{report.technician_note}</p>
                  <p className="mt-1 text-xs text-blue-600">Diperbarui: {formatDateTime(report.updated_at)}</p>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
