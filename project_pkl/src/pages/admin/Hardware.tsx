import { useEffect, useMemo, useState } from 'react';
import type { FormEvent } from 'react';
import { Plus, Pencil, Trash2 } from 'lucide-react';
import { apiFetch } from '../../lib/api';
import type { Lab, PcSpec } from '../../lib/api';
import {
  inputCls,
  labelCls,
  btnPrimary,
  btnSecondary,
  thCls,
  tdCls,
  Spinner,
  ErrorBanner,
  EmptyState,
  PcStatusBadge,
  Modal,
  FieldError,
} from '../../components/ui';

const emptyForm = {
  lab_id: '',
  pc_id: '',
  processor: '',
  ram: '',
  storage: '',
  gpu: '',
  monitor: '',
  os: '',
  status: 'baik',
};

export default function Hardware() {
  const [specs, setSpecs] = useState<PcSpec[]>([]);
  const [labs, setLabs] = useState<Lab[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [labFilter, setLabFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState<PcSpec | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [formError, setFormError] = useState('');
  const [saving, setSaving] = useState(false);

  const load = async () => {
    setLoading(true);
    setError('');
    try {
      const [s, l] = await Promise.all([apiFetch<PcSpec[]>('/api/specs'), apiFetch<Lab[]>('/api/labs')]);
      setSpecs(s);
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

  const filtered = useMemo(
    () =>
      specs.filter((s) => {
        if (labFilter && String(s.lab_id) !== labFilter) return false;
        if (statusFilter && s.status !== statusFilter) return false;
        return true;
      }),
    [specs, labFilter, statusFilter]
  );

  const labCode = (id: number) => labs.find((l) => l.id === id)?.code || `Lab ${id}`;

  const openAdd = () => {
    setEditing(null);
    setForm({ ...emptyForm, lab_id: labFilter });
    setFormError('');
    setShowModal(true);
  };

  const openEdit = (s: PcSpec) => {
    setEditing(s);
    setForm({
      lab_id: String(s.lab_id),
      pc_id: s.pc_id,
      processor: s.processor || '',
      ram: s.ram || '',
      storage: s.storage || '',
      gpu: s.gpu || '',
      monitor: s.monitor || '',
      os: s.os || '',
      status: s.status,
    });
    setFormError('');
    setShowModal(true);
  };

  const handleSave = async (e: FormEvent) => {
    e.preventDefault();
    if (!form.lab_id || !form.pc_id.trim()) {
      setFormError('Lab dan Nomor PC wajib diisi.');
      return;
    }
    setSaving(true);
    setFormError('');
    try {
      const payload = { ...form, lab_id: Number(form.lab_id) };
      if (editing) {
        await apiFetch('/api/specs', { method: 'PUT', body: JSON.stringify({ id: editing.id, ...payload }) });
      } else {
        await apiFetch('/api/specs', { method: 'POST', body: JSON.stringify(payload) });
      }
      setShowModal(false);
      await load();
    } catch (err) {
      setFormError(err instanceof Error ? err.message : 'Gagal menyimpan');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (s: PcSpec) => {
    if (!window.confirm(`Hapus spesifikasi ${labCode(s.lab_id)} ${s.pc_id}?`)) return;
    try {
      await apiFetch('/api/specs', { method: 'DELETE', body: JSON.stringify({ id: s.id }) });
      await load();
    } catch (e) {
      alert(e instanceof Error ? e.message : 'Gagal menghapus');
    }
  };

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-zinc-900">Spesifikasi Hardware</h1>
          <p className="mt-0.5 text-sm text-zinc-500">{specs.length} unit PC terdata.</p>
        </div>
        <button onClick={openAdd} className={btnPrimary}>
          <Plus size={16} /> Tambah Unit
        </button>
      </div>

      <div className="mt-4 grid gap-2 rounded-lg border border-zinc-200 bg-white p-4 shadow-sm sm:grid-cols-2">
        <select className={inputCls} value={labFilter} onChange={(e) => setLabFilter(e.target.value)}>
          <option value="">Semua Lab</option>
          {labs.map((l) => (
            <option key={l.id} value={l.id}>
              {l.code} - {l.name}
            </option>
          ))}
        </select>
        <select className={inputCls} value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
          <option value="">Semua Kondisi</option>
          <option value="baik">Baik</option>
          <option value="perawatan">Perawatan</option>
          <option value="rusak">Rusak</option>
        </select>
      </div>

      <div className="mt-4 overflow-hidden rounded-lg border border-zinc-200 bg-white shadow-sm">
        {loading ? (
          <Spinner label="Memuat data hardware..." />
        ) : error ? (
          <div className="p-4">
            <ErrorBanner message={error} onRetry={load} />
          </div>
        ) : filtered.length === 0 ? (
          <div className="p-4">
            <EmptyState title="Tidak ada data" desc="Coba ubah filter atau tambah unit baru." />
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[1000px] border-collapse">
              <thead>
                <tr className="border-b border-zinc-200 bg-zinc-50">
                  <th className={thCls}>Lab</th>
                  <th className={thCls}>Unit</th>
                  <th className={thCls}>Processor</th>
                  <th className={thCls}>RAM</th>
                  <th className={thCls}>Storage</th>
                  <th className={thCls}>GPU</th>
                  <th className={thCls}>Monitor</th>
                  <th className={thCls}>OS</th>
                  <th className={thCls}>Kondisi</th>
                  <th className={`${thCls} text-right`}>Aksi</th>
                </tr>
              </thead>
              <tbody className="font-mono text-xs">
                {filtered.map((s) => (
                  <tr key={s.id} className="border-b border-zinc-100 last:border-0 hover:bg-zinc-50/60">
                    <td className="px-4 py-3 font-bold text-zinc-900">{labCode(s.lab_id)}</td>
                    <td className="px-4 py-3 font-bold text-blue-700">{s.pc_id}</td>
                    <td className={tdCls}>{s.processor || '-'}</td>
                    <td className={tdCls}>{s.ram || '-'}</td>
                    <td className={tdCls}>{s.storage || '-'}</td>
                    <td className={tdCls}>{s.gpu || '-'}</td>
                    <td className={tdCls}>{s.monitor || '-'}</td>
                    <td className={tdCls}>{s.os || '-'}</td>
                    <td className="px-4 py-3">
                      <PcStatusBadge status={s.status} />
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="inline-flex gap-1.5">
                        <button
                          onClick={() => openEdit(s)}
                          className="rounded-lg border border-zinc-300 bg-white p-2 text-zinc-600 hover:bg-zinc-100"
                          title="Ubah"
                        >
                          <Pencil size={15} />
                        </button>
                        <button
                          onClick={() => handleDelete(s)}
                          className="rounded-lg border border-zinc-300 bg-white p-2 text-red-600 hover:bg-red-50"
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

      {showModal && (
        <Modal title={editing ? `Ubah ${editing.pc_id}` : 'Tambah Unit PC'} onClose={() => setShowModal(false)} wide>
          <form onSubmit={handleSave} className="grid gap-3 sm:grid-cols-2">
            <div>
              <label className={labelCls}>Laboratorium</label>
              <select className={inputCls} value={form.lab_id} onChange={(e) => setForm({ ...form, lab_id: e.target.value })}>
                <option value="">-- Pilih Lab --</option>
                {labs.map((l) => (
                  <option key={l.id} value={l.id}>
                    {l.code} - {l.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className={labelCls}>Nomor PC</label>
              <input
                className={`${inputCls} font-mono`}
                placeholder="PC-01"
                value={form.pc_id}
                onChange={(e) => setForm({ ...form, pc_id: e.target.value.toUpperCase() })}
              />
            </div>
            <div>
              <label className={labelCls}>Processor</label>
              <input
                className={`${inputCls} font-mono`}
                placeholder="Intel Core i5-12400"
                value={form.processor}
                onChange={(e) => setForm({ ...form, processor: e.target.value })}
              />
            </div>
            <div>
              <label className={labelCls}>RAM</label>
              <input
                className={`${inputCls} font-mono`}
                placeholder="16 GB DDR4"
                value={form.ram}
                onChange={(e) => setForm({ ...form, ram: e.target.value })}
              />
            </div>
            <div>
              <label className={labelCls}>Storage</label>
              <input
                className={`${inputCls} font-mono`}
                placeholder="512 GB NVMe SSD"
                value={form.storage}
                onChange={(e) => setForm({ ...form, storage: e.target.value })}
              />
            </div>
            <div>
              <label className={labelCls}>GPU</label>
              <input
                className={`${inputCls} font-mono`}
                placeholder="Intel UHD 730"
                value={form.gpu}
                onChange={(e) => setForm({ ...form, gpu: e.target.value })}
              />
            </div>
            <div>
              <label className={labelCls}>Monitor</label>
              <input
                className={`${inputCls} font-mono`}
                placeholder='22" FHD'
                value={form.monitor}
                onChange={(e) => setForm({ ...form, monitor: e.target.value })}
              />
            </div>
            <div>
              <label className={labelCls}>Sistem Operasi</label>
              <input
                className={`${inputCls} font-mono`}
                placeholder="Windows 11 Pro"
                value={form.os}
                onChange={(e) => setForm({ ...form, os: e.target.value })}
              />
            </div>
            <div className="sm:col-span-2">
              <label className={labelCls}>Kondisi Unit</label>
              <select className={inputCls} value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })}>
                <option value="baik">Baik</option>
                <option value="perawatan">Perawatan</option>
                <option value="rusak">Rusak</option>
              </select>
            </div>
            <div className="sm:col-span-2">
              <FieldError msg={formError} />
              <div className="flex gap-2">
                <button type="submit" disabled={saving} className={`${btnPrimary} flex-1`}>
                  {saving ? 'Menyimpan...' : editing ? 'Simpan Perubahan' : 'Tambah Unit'}
                </button>
                <button type="button" onClick={() => setShowModal(false)} className={btnSecondary}>
                  Batal
                </button>
              </div>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
}
