import { useEffect, useState } from 'react';
import type { FormEvent } from 'react';
import { Plus, Pencil, Trash2 } from 'lucide-react';
import { apiFetch } from '../../lib/api';
import type { Lab } from '../../lib/api';
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
  Modal,
  FieldError,
} from '../../components/ui';

const emptyForm = { code: '', name: '', floor: '', total_pc: 30, description: '', status: 'aktif' };

export default function Labs() {
  const [labs, setLabs] = useState<Lab[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState<Lab | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [formError, setFormError] = useState('');
  const [saving, setSaving] = useState(false);

  const load = async () => {
    setLoading(true);
    setError('');
    try {
      setLabs(await apiFetch<Lab[]>('/api/labs'));
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Gagal memuat data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const openAdd = () => {
    setEditing(null);
    setForm(emptyForm);
    setFormError('');
    setShowModal(true);
  };

  const openEdit = (lab: Lab) => {
    setEditing(lab);
    setForm({
      code: lab.code,
      name: lab.name,
      floor: lab.floor || '',
      total_pc: lab.total_pc,
      description: lab.description || '',
      status: lab.status,
    });
    setFormError('');
    setShowModal(true);
  };

  const handleSave = async (e: FormEvent) => {
    e.preventDefault();
    if (!form.code.trim() || !form.name.trim()) {
      setFormError('Kode dan nama lab wajib diisi.');
      return;
    }
    setSaving(true);
    setFormError('');
    try {
      if (editing) {
        await apiFetch('/api/labs', { method: 'PUT', body: JSON.stringify({ id: editing.id, ...form }) });
      } else {
        await apiFetch('/api/labs', { method: 'POST', body: JSON.stringify(form) });
      }
      setShowModal(false);
      await load();
    } catch (err) {
      setFormError(err instanceof Error ? err.message : 'Gagal menyimpan');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (lab: Lab) => {
    if (
      !window.confirm(
        `Hapus ${lab.code} - ${lab.name}?\nData hardware & jadwal terkait juga akan ikut terhapus.`
      )
    )
      return;
    try {
      await apiFetch('/api/labs', { method: 'DELETE', body: JSON.stringify({ id: lab.id }) });
      await load();
    } catch (e) {
      alert(e instanceof Error ? e.message : 'Gagal menghapus');
    }
  };

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-zinc-900">Data Lab</h1>
          <p className="mt-0.5 text-sm text-zinc-500">{labs.length} laboratorium terdaftar.</p>
        </div>
        <button onClick={openAdd} className={btnPrimary}>
          <Plus size={16} /> Tambah Lab
        </button>
      </div>

      <div className="mt-4 overflow-hidden rounded-lg border border-zinc-200 bg-white shadow-sm">
        {loading ? (
          <Spinner label="Memuat data lab..." />
        ) : error ? (
          <div className="p-4">
            <ErrorBanner message={error} onRetry={load} />
          </div>
        ) : labs.length === 0 ? (
          <div className="p-4">
            <EmptyState title="Belum ada lab" desc="Klik Tambah Lab untuk membuat data baru." />
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[760px] border-collapse">
              <thead>
                <tr className="border-b border-zinc-200 bg-zinc-50">
                  <th className={thCls}>Kode</th>
                  <th className={thCls}>Nama Lab</th>
                  <th className={thCls}>Lokasi</th>
                  <th className={thCls}>Total PC</th>
                  <th className={thCls}>Status</th>
                  <th className={`${thCls} text-right`}>Aksi</th>
                </tr>
              </thead>
              <tbody>
                {labs.map((l) => (
                  <tr key={l.id} className="border-b border-zinc-100 last:border-0 hover:bg-zinc-50/60">
                    <td className="px-4 py-3 font-mono text-sm font-bold text-zinc-900">{l.code}</td>
                    <td className={tdCls}>
                      <span className="font-medium text-zinc-900">{l.name}</span>
                      {l.description && (
                        <span className="block max-w-xs truncate text-xs text-zinc-500">{l.description}</span>
                      )}
                    </td>
                    <td className={tdCls}>{l.floor || '-'}</td>
                    <td className="px-4 py-3 font-mono text-sm font-semibold text-zinc-900">{l.total_pc}</td>
                    <td className="px-4 py-3">
                      <span
                        className={`inline-flex items-center rounded-md border px-2 py-0.5 text-xs font-semibold ${
                          l.status === 'aktif'
                            ? 'border-green-200 bg-green-50 text-green-700'
                            : 'border-zinc-200 bg-zinc-50 text-zinc-600'
                        }`}
                      >
                        {l.status === 'aktif' ? 'Aktif' : 'Nonaktif'}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="inline-flex gap-1.5">
                        <button
                          onClick={() => openEdit(l)}
                          className="rounded-lg border border-zinc-300 p-2 text-zinc-600 hover:bg-zinc-100"
                          title="Ubah"
                        >
                          <Pencil size={15} />
                        </button>
                        <button
                          onClick={() => handleDelete(l)}
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

      {showModal && (
        <Modal title={editing ? `Ubah ${editing.code}` : 'Tambah Lab Baru'} onClose={() => setShowModal(false)}>
          <form onSubmit={handleSave} className="space-y-3">
            <div className="grid gap-3 sm:grid-cols-2">
              <div>
                <label className={labelCls}>Kode Lab</label>
                <input
                  className={`${inputCls} font-mono`}
                  placeholder="LAB-08"
                  value={form.code}
                  onChange={(e) => setForm({ ...form, code: e.target.value.toUpperCase() })}
                />
              </div>
              <div>
                <label className={labelCls}>Total PC</label>
                <input
                  type="number"
                  min={0}
                  className={`${inputCls} font-mono`}
                  value={form.total_pc}
                  onChange={(e) => setForm({ ...form, total_pc: Number(e.target.value) })}
                />
              </div>
            </div>
            <div>
              <label className={labelCls}>Nama Lab</label>
              <input
                className={inputCls}
                placeholder="cth: Lab Sistem Tertanam"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
              />
            </div>
            <div>
              <label className={labelCls}>Lokasi / Lantai</label>
              <input
                className={inputCls}
                placeholder="cth: Lantai 4 — Gedung TIK"
                value={form.floor}
                onChange={(e) => setForm({ ...form, floor: e.target.value })}
              />
            </div>
            <div>
              <label className={labelCls}>Deskripsi</label>
              <textarea
                className={inputCls}
                placeholder="Keterangan singkat lab..."
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
              />
            </div>
            <div>
              <label className={labelCls}>Status</label>
              <select className={inputCls} value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })}>
                <option value="aktif">Aktif</option>
                <option value="nonaktif">Nonaktif</option>
              </select>
            </div>
            <FieldError msg={formError} />
            <div className="flex gap-2 pt-1">
              <button type="submit" disabled={saving} className={`${btnPrimary} flex-1`}>
                {saving ? 'Menyimpan...' : editing ? 'Simpan Perubahan' : 'Tambah Lab'}
              </button>
              <button type="button" onClick={() => setShowModal(false)} className={btnSecondary}>
                Batal
              </button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
}
