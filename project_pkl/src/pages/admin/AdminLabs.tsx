import { useEffect, useState } from 'react';
import { Pencil, Plus, Trash2 } from 'lucide-react';
import { api, LAB_STATUSES } from '../../lib/api';
import type { Lab } from '../../lib/api';
import { useAuth } from '../../contexts/AuthContext';
import {
  Button, ConfirmDialog, EmptyState, Field, FlashBanner, Input, LabStatusBadge,
  Modal, PageHeader, Select, Spinner, TableWrap, Textarea, tdCls, thCls, useFlash,
} from '../../components/ui';

interface LabForm { code: string; name: string; location: string; capacity: string; status: string; description: string; }
const EMPTY: LabForm = { code: '', name: '', location: '', capacity: '', status: 'Aktif', description: '' };

export default function AdminLabs() {
  const { session } = useAuth();
  const [labs, setLabs] = useState<Lab[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Lab | null>(null);
  const [form, setForm] = useState<LabForm>(EMPTY);
  const [formError, setFormError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<Lab | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [flash, showFlash] = useFlash();

  const token = session?.access_token || '';

  const load = async () => {
    setLoading(true);
    try {
      setLabs(await api.labs.list());
    } catch {
      setLabs([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    document.title = 'Kelola Lab — SIMLAB-TIK';
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const openAdd = () => {
    setEditing(null);
    setForm(EMPTY);
    setFormError(null);
    setModalOpen(true);
  };

  const openEdit = (l: Lab) => {
    setEditing(l);
    setForm({ code: l.code, name: l.name, location: l.location || '', capacity: l.capacity?.toString() || '', status: l.status, description: l.description || '' });
    setFormError(null);
    setModalOpen(true);
  };

  const save = async () => {
    if (!form.code.trim() || !form.name.trim()) {
      setFormError('Kode dan nama lab wajib diisi.');
      return;
    }
    if (!token) return;
    setSaving(true);
    try {
      const payload = {
        code: form.code.trim(),
        name: form.name.trim(),
        location: form.location.trim(),
        capacity: form.capacity.trim(),
        status: form.status,
        description: form.description.trim(),
      };
      if (editing) {
        await api.labs.update({ ...payload, id: editing.id }, token);
        showFlash('success', `${form.name} berhasil diperbarui.`);
      } else {
        await api.labs.create(payload, token);
        showFlash('success', `${form.name} berhasil ditambahkan.`);
      }
      setModalOpen(false);
      load();
    } catch (e) {
      setFormError(e instanceof Error ? e.message : 'Gagal menyimpan data.');
    } finally {
      setSaving(false);
    }
  };

  const doDelete = async () => {
    if (!deleteTarget || !token) return;
    setDeleting(true);
    try {
      await api.labs.remove(deleteTarget.id, token);
      setDeleteTarget(null);
      showFlash('success', `${deleteTarget.name} beserta seluruh unit & jadwalnya dihapus.`);
      load();
    } catch (e) {
      showFlash('error', e instanceof Error ? e.message : 'Gagal menghapus lab.');
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div>
      <PageHeader
        title="Kelola Laboratorium"
        description="Tambah, ubah, atau hapus data laboratorium komputer."
        actions={<Button variant="primary" onClick={openAdd}><Plus className="h-4 w-4" /> Tambah Lab</Button>}
      />
      <div className="mb-4"><FlashBanner flash={flash} /></div>

      {loading ? (
        <div className="rounded-md border border-slate-200 bg-white"><Spinner label="Memuat data lab..." /></div>
      ) : labs.length === 0 ? (
        <EmptyState title="Belum ada data lab" description="Tambahkan laboratorium pertama untuk mulai mengelola inventaris." action={<Button variant="primary" onClick={openAdd}><Plus className="h-4 w-4" /> Tambah Lab</Button>} />
      ) : (
        <TableWrap minWidth={760}>
          <thead>
            <tr>
              <th className={thCls}>Kode</th>
              <th className={thCls}>Nama Lab</th>
              <th className={thCls}>Lokasi</th>
              <th className={thCls}>Kapasitas</th>
              <th className={thCls}>Unit PC</th>
              <th className={thCls}>Status</th>
              <th className={thCls}>Aksi</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 bg-white">
            {labs.map((l) => (
              <tr key={l.id} className="transition-colors hover:bg-slate-50">
                <td className={tdCls}><span className="font-mono text-[13px] font-semibold text-slate-900">{l.code}</span></td>
                <td className={tdCls}><span className="font-medium text-slate-900">{l.name}</span></td>
                <td className={tdCls}>{l.location || '-'}</td>
                <td className={tdCls}><span className="font-mono text-[13px]">{l.capacity ?? '-'}</span></td>
                <td className={tdCls}><span className="font-mono text-[13px]">{l.pc_active}/{l.pc_total} aktif</span></td>
                <td className={tdCls}><LabStatusBadge status={l.status} /></td>
                <td className={tdCls}>
                  <div className="flex items-center gap-1.5">
                    <button onClick={() => openEdit(l)} className="rounded-md border border-slate-200 p-1.5 text-slate-500 hover:border-blue-300 hover:bg-blue-50 hover:text-blue-700" title="Ubah">
                      <Pencil className="h-4 w-4" />
                    </button>
                    <button onClick={() => setDeleteTarget(l)} className="rounded-md border border-slate-200 p-1.5 text-slate-400 hover:border-red-300 hover:bg-red-50 hover:text-red-600" title="Hapus">
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </TableWrap>
      )}

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title={editing ? `Ubah ${editing.name}` : 'Tambah Laboratorium'} subtitle="Data lab tampil di halaman publik.">
        <div className="space-y-4">
          {formError && <div className="rounded-md border border-red-200 bg-red-50 px-3 py-2.5 text-[13px] text-red-700">{formError}</div>}
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Kode Lab" required hint="cth: 301, ICT, FIS">
              <Input value={form.code} onChange={(e) => setForm((f) => ({ ...f, code: e.target.value }))} placeholder="301" className="font-mono" maxLength={10} />
            </Field>
            <Field label="Nama Lab" required>
              <Input value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} placeholder="Lab 301" maxLength={60} />
            </Field>
          </div>
          <Field label="Lokasi">
            <Input value={form.location} onChange={(e) => setForm((f) => ({ ...f, location: e.target.value }))} placeholder="cth: Gedung A — Lantai 3, Ruang 301" maxLength={120} />
          </Field>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Kapasitas Kursi">
              <Input type="number" min={0} value={form.capacity} onChange={(e) => setForm((f) => ({ ...f, capacity: e.target.value }))} placeholder="cth: 25" />
            </Field>
            <Field label="Status">
              <Select value={form.status} onChange={(e) => setForm((f) => ({ ...f, status: e.target.value }))}>
                {LAB_STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
              </Select>
            </Field>
          </div>
          <Field label="Deskripsi / Ringkasan">
            <Textarea rows={3} value={form.description} onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))} placeholder="Fungsi lab dan peruntukannya..." maxLength={500} />
          </Field>
          <div className="flex justify-end gap-2 border-t border-slate-100 pt-4">
            <Button onClick={() => setModalOpen(false)}>Batal</Button>
            <Button variant="primary" loading={saving} onClick={save}>Simpan</Button>
          </div>
        </div>
      </Modal>

      <ConfirmDialog
        open={!!deleteTarget}
        title="Hapus Lab?"
        message={`${deleteTarget?.name} akan dihapus permanen beserta SELURUH data unit PC dan jadwal di dalamnya. Laporan terkait akan kehilangan referensi lab. Lanjutkan?`}
        onConfirm={doDelete}
        onClose={() => setDeleteTarget(null)}
        loading={deleting}
      />
    </div>
  );
}
