import { useEffect, useMemo, useState } from 'react';
import type { FormEvent } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Eye, Trash2, Search } from 'lucide-react';
import { apiFetch, formatDateTime, STATUS_LABEL } from '../../lib/api';
import type { Lab, Report } from '../../lib/api';
import {
  inputCls,
  labelCls,
  btnPrimary,
  btnSecondary,
  btnDanger,
  thCls,
  tdCls,
  Spinner,
  ErrorBanner,
  EmptyState,
  StatusBadge,
  Modal,
} from '../../components/ui';

export default function Reports() {
  const [params] = useSearchParams();
  const [reports, setReports] = useState<Report[]>([]);
  const [labs, setLabs] = useState<Lab[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [statusFilter, setStatusFilter] = useState(params.get('status') || '');
  const [labFilter, setLabFilter] = useState('');
  const [query, setQuery] = useState('');
  const [selected, setSelected] = useState<Report | null>(null);
  const [editStatus, setEditStatus] = useState('');
  const [editNote, setEditNote] = useState('');
  const [editPc, setEditPc] = useState('');
  const [editDesc, setEditDesc] = useState('');
  const [saving, setSaving] = useState(false);
  const [modalError, setModalError] = useState('');

  const load = async () => {
    setLoading(true);
    setError('');
    try {
      const [r, l] = await Promise.all([apiFetch<Report[]>('/api/reports'), apiFetch<Lab[]>('/api/labs')]);
      setReports(r);
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

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return reports.filter((r) => {
      if (statusFilter && r.status !== statusFilter) return false;
      if (labFilter && String(r.lab_id) !== labFilter) return false;
      if (!q) return true;
      return (
        r.ticket_no.toLowerCase().includes(q) ||
        r.student_name.toLowerCase().includes(q) ||
        r.nim.toLowerCase().includes(q) ||
        r.pc_id.toLowerCase().includes(q) ||
        r.description.toLowerCase().includes(q)
      );
    });
  }, [reports, statusFilter, labFilter, query]);

  const openDetail = (r: Report) => {
    setSelected(r);
    setEditStatus(r.status);
    setEditNote(r.technician_note || '');
    setEditPc(r.pc_id);
    setEditDesc(r.description);
    setModalError('');
  };

  const handleSave = async (e: FormEvent) => {
    e.preventDefault();
    if (!selected) return;
    setSaving(true);
    setModalError('');
    try {
      const updated = await apiFetch<Report>('/api/reports', {
        method: 'PUT',
        body: JSON.stringify({
          id: selected.id,
          status: editStatus,
          technician_note: editNote,
          pc_id: editPc,
          description: editDesc,
        }),
      });
      setSelected(updated);
      await load();
    } catch (err) {
      setModalError(err instanceof Error ? err.message : 'Gagal menyimpan');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (r: Report) => {
    if (!window.confirm(`Hapus laporan ${r.ticket_no}? Tindakan ini tidak dapat dibatalkan.`)) return;
    try {
      await apiFetch('/api/reports', { method: 'DELETE', body: JSON.stringify({ id: r.id }) });
      setSelected(null);
      await load();
    } catch (e) {
      alert(e instanceof Error ? e.message : 'Gagal menghapus');
    }
  };

  return (
    <div>
      <h1 className="text-xl font-bold text-zinc-900">Kelola Laporan</h1>
      <p className="mt-0.5 text-sm text-zinc-500">
        {reports.length} laporan masuk • perbarui status, tulis catatan teknisi, atau koreksi data.
      </p>

      <div className="mt-4 grid gap-2 rounded-lg border border-zinc-200 bg-white p-4 shadow-sm sm:grid-cols-4">
        <div className="relative sm:col-span-2">
          <Search size={16} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" />
          <input
            className={`${inputCls} pl-9`}
            placeholder="Cari tiket, nama, NIM, PC..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </div>
        <select className={inputCls} value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
          <option value="">Semua Status</option>
          <option value="diterima">Diterima</option>
          <option value="diproses">Diproses</option>
          <option value="selesai">Selesai</option>
        </select>
        <select className={inputCls} value={labFilter} onChange={(e) => setLabFilter(e.target.value)}>
          <option value="">Semua Lab</option>
          {labs.map((l) => (
            <option key={l.id} value={l.id}>
              {l.code} - {l.name}
            </option>
          ))}
        </select>
      </div>

      <div className="mt-4 overflow-hidden rounded-lg border border-zinc-200 bg-white shadow-sm">
        {loading ? (
          <Spinner label="Memuat laporan..." />
        ) : error ? (
          <div className="p-4">
            <ErrorBanner message={error} onRetry={load} />
          </div>
        ) : filtered.length === 0 ? (
          <div className="p-4">
            <EmptyState title="Tidak ada laporan" desc="Coba ubah filter atau kata kunci pencarian." />
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[860px] border-collapse">
              <thead>
                <tr className="border-b border-zinc-200 bg-zinc-50">
                  <th className={thCls}>Tiket</th>
                  <th className={thCls}>Lab / PC</th>
                  <th className={thCls}>Pelapor</th>
                  <th className={thCls}>Dilaporkan</th>
                  <th className={thCls}>Status</th>
                  <th className={`${thCls} text-right`}>Aksi</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((r) => (
                  <tr key={r.id} className="border-b border-zinc-100 last:border-0 hover:bg-zinc-50/60">
                    <td className="px-4 py-3 font-mono text-sm font-bold text-zinc-900">{r.ticket_no}</td>
                    <td className={tdCls}>
                      <span className="font-mono font-semibold">{r.labs?.code || '-'}</span> /{' '}
                      <span className="font-mono">{r.pc_id}</span>
                    </td>
                    <td className={tdCls}>
                      {r.student_name}
                      <span className="block font-mono text-xs text-zinc-500">{r.nim}</span>
                    </td>
                    <td className="whitespace-nowrap px-4 py-3 text-xs text-zinc-500">{formatDateTime(r.created_at)}</td>
                    <td className="px-4 py-3">
                      <StatusBadge status={r.status} />
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="inline-flex gap-1.5">
                        <button
                          onClick={() => openDetail(r)}
                          className="rounded-lg border border-zinc-300 p-2 text-zinc-600 hover:bg-zinc-100"
                          title="Detail & Kelola"
                        >
                          <Eye size={15} />
                        </button>
                        <button
                          onClick={() => handleDelete(r)}
                          className="rounded-lg border border-zinc-300 p-2 text-red-600 hover:bg-red-50"
                          title="Hapus"
                        >
                          <Trash2 size={15} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {selected && (
        <Modal title={`Kelola ${selected.ticket_no}`} onClose={() => setSelected(null)} wide>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2 text-sm">
              <p className="text-zinc-600">
                <span className="font-medium text-zinc-900">Lab:</span> {selected.labs?.code} -{' '}
                {selected.labs?.name || 'Lab dihapus'}
              </p>
              <p className="text-zinc-600">
                <span className="font-medium text-zinc-900">Pelapor:</span> {selected.student_name} (
                <span className="font-mono">{selected.nim}</span>)
              </p>
              <p className="text-zinc-600">
                <span className="font-medium text-zinc-900">Dilaporkan:</span> {formatDateTime(selected.created_at)}
              </p>
              <p className="text-zinc-600">
                <span className="font-medium text-zinc-900">Status saat ini:</span> {STATUS_LABEL[selected.status]}
              </p>
              {selected.photo_url && (
                <a href={selected.photo_url} target="_blank" rel="noreferrer">
                  <img
                    src={selected.photo_url}
                    alt="Bukti"
                    className="mt-2 max-h-44 rounded-lg border border-zinc-200"
                  />
                </a>
              )}
            </div>
            <form onSubmit={handleSave} className="space-y-3">
              <div>
                <label className={labelCls}>Status Penanganan</label>
                <select className={inputCls} value={editStatus} onChange={(e) => setEditStatus(e.target.value)}>
                  <option value="diterima">Diterima</option>
                  <option value="diproses">Diproses</option>
                  <option value="selesai">Selesai</option>
                </select>
              </div>
              <div>
                <label className={labelCls}>Catatan Teknisi</label>
                <textarea
                  className={`${inputCls} min-h-[80px]`}
                  placeholder="cth: Keyboard diganti dengan unit baru."
                  value={editNote}
                  onChange={(e) => setEditNote(e.target.value)}
                />
              </div>
              <div>
                <label className={labelCls}>Koreksi Nomor PC</label>
                <input
                  className={`${inputCls} font-mono`}
                  value={editPc}
                  onChange={(e) => setEditPc(e.target.value.toUpperCase())}
                />
              </div>
              <div>
                <label className={labelCls}>Koreksi Deskripsi</label>
                <textarea
                  className={`${inputCls} min-h-[80px]`}
                  value={editDesc}
                  onChange={(e) => setEditDesc(e.target.value)}
                />
              </div>
              {modalError && (
                <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
                  {modalError}
                </div>
              )}
              <div className="flex gap-2">
                <button type="submit" disabled={saving} className={`${btnPrimary} flex-1`}>
                  {saving ? 'Menyimpan...' : 'Simpan Perubahan'}
                </button>
                <button type="button" onClick={() => setSelected(null)} className={btnSecondary}>
                  Tutup
                </button>
              </div>
              <button type="button" onClick={() => handleDelete(selected)} className={`${btnDanger} w-full`}>
                <Trash2 size={15} /> Hapus Laporan Ini
              </button>
            </form>
          </div>
        </Modal>
      )}
    </div>
  );
}
