import { useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Layers, Pencil, Plus, Search, Trash2 } from 'lucide-react';
import { api, UNIT_STATUSES } from '../../lib/api';
import type { Lab, PcUnit } from '../../lib/api';
import { useAuth } from '../../contexts/AuthContext';
import {
  Button, ConfirmDialog, EmptyState, Field, FlashBanner, Input, Modal, PageHeader,
  Select, Spinner, TableWrap, Textarea, UnitStatusBadge, cn, tdCls, thCls, useFlash,
} from '../../components/ui';

interface UnitForm {
  lab_id: string; pc_number: string; status: string;
  processor: string; ram: string; storage: string; gpu: string; monitor: string; os: string; notes: string;
}
const EMPTY: UnitForm = { lab_id: '', pc_number: '', status: 'Aktif', processor: '', ram: '', storage: '', gpu: '', monitor: '', os: '', notes: '' };

interface BulkForm {
  lab_id: string; start: string; end: string; status: string;
  processor: string; ram: string; storage: string; gpu: string; monitor: string; os: string;
}
const BULK_EMPTY: BulkForm = { lab_id: '', start: '1', end: '20', status: 'Aktif', processor: '', ram: '', storage: '', gpu: '', monitor: '', os: '' };

export default function AdminUnits() {
  const { session } = useAuth();
  const [params] = useSearchParams();
  const [units, setUnits] = useState<PcUnit[]>([]);
  const [labs, setLabs] = useState<Lab[]>([]);
  const [loading, setLoading] = useState(true);
  const [labF, setLabF] = useState(params.get('lab') || 'Semua');
  const [q, setQ] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [bulkOpen, setBulkOpen] = useState(false);
  const [editing, setEditing] = useState<PcUnit | null>(null);
  const [form, setForm] = useState<UnitForm>(EMPTY);
  const [bulk, setBulk] = useState<BulkForm>(BULK_EMPTY);
  const [formError, setFormError] = useState<string | null>(null);
  const [bulkError, setBulkError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<PcUnit | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [flash, showFlash] = useFlash();

  const token = session?.access_token || '';

  const load = async () => {
    setLoading(true);
    try {
      const [u, l] = await Promise.all([api.units.list(), api.labs.list()]);
      setUnits(u);
      setLabs(l);
    } catch {
      setUnits([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    document.title = 'Kelola Unit PC — SIMLAB-TIK';
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const filtered = useMemo(() => {
    const s = q.trim().toLowerCase();
    return units.filter((u) => {
      if (labF !== 'Semua' && String(u.lab_id) !== labF) return false;
      if (!s) return true;
      return (u.pc_number + ' ' + u.processor + ' ' + u.ram + ' ' + u.storage + ' ' + u.os).toLowerCase().includes(s);
    });
  }, [units, labF, q]);

  const labName = (id: number) => units.find((u) => u.lab_id === id)?.labs?.name || labs.find((l) => l.id === id)?.name || '-';

  const openAdd = () => {
    setEditing(null);
    setForm({ ...EMPTY, lab_id: labF !== 'Semua' ? labF : '' });
    setFormError(null);
    setModalOpen(true);
  };

  const openEdit = (u: PcUnit) => {
    setEditing(u);
    setForm({
      lab_id: String(u.lab_id), pc_number: u.pc_number, status: u.status,
      processor: u.processor === '-' ? '' : u.processor, ram: u.ram === '-' ? '' : u.ram,
      storage: u.storage === '-' ? '' : u.storage, gpu: u.gpu === '-' ? '' : u.gpu,
      monitor: u.monitor === '-' ? '' : u.monitor, os: u.os === '-' ? '' : u.os,
      notes: u.notes || '',
    });
    setFormError(null);
    setModalOpen(true);
  };

  const save = async () => {
    if (!form.lab_id || !form.pc_number.trim()) {
      setFormError('Lab dan nomor PC wajib diisi.');
      return;
    }
    if (!token) return;
    setSaving(true);
    try {
      const payload = {
        lab_id: Number(form.lab_id), pc_number: form.pc_number.trim(), status: form.status,
        processor: form.processor.trim(), ram: form.ram.trim(), storage: form.storage.trim(),
        gpu: form.gpu.trim(), monitor: form.monitor.trim(), os: form.os.trim(), notes: form.notes.trim(),
      };
      if (editing) {
        await api.units.update({ ...payload, id: editing.id }, token);
        showFlash('success', `${form.pc_number} berhasil diperbarui.`);
      } else {
        await api.units.create(payload, token);
        showFlash('success', `${form.pc_number} berhasil ditambahkan.`);
      }
      setModalOpen(false);
      load();
    } catch (e) {
      setFormError(e instanceof Error ? e.message : 'Gagal menyimpan data.');
    } finally {
      setSaving(false);
    }
  };

  const saveBulk = async () => {
    const start = parseInt(bulk.start, 10);
    const end = parseInt(bulk.end, 10);
    if (!bulk.lab_id) { setBulkError('Pilih laboratorium tujuan.'); return; }
    if (Number.isNaN(start) || Number.isNaN(end) || start < 1 || end < start || end - start > 60) {
      setBulkError('Rentang nomor tidak valid (maksimal 60 unit sekaligus).');
      return;
    }
    if (!token) return;
    setSaving(true);
    try {
      const rows = [];
      for (let n = start; n <= end; n++) {
        rows.push({
          lab_id: Number(bulk.lab_id), pc_number: `PC-${String(n).padStart(2, '0')}`, status: bulk.status,
          processor: bulk.processor.trim(), ram: bulk.ram.trim(), storage: bulk.storage.trim(),
          gpu: bulk.gpu.trim(), monitor: bulk.monitor.trim(), os: bulk.os.trim(),
        });
      }
      const res = await api.units.bulkCreate(rows, token);
      setBulkOpen(false);
      showFlash('success', `${res.created.length} unit berhasil dibuat${res.skipped ? `, ${res.skipped} dilewati (sudah ada)` : ''}.`);
      load();
    } catch (e) {
      setBulkError(e instanceof Error ? e.message : 'Gagal membuat unit massal.');
    } finally {
      setSaving(false);
    }
  };

  const doDelete = async () => {
    if (!deleteTarget || !token) return;
    setDeleting(true);
    try {
      await api.units.remove(deleteTarget.id, token);
      setDeleteTarget(null);
      showFlash('success', `${deleteTarget.pc_number} dihapus dari inventaris.`);
      load();
    } catch (e) {
      showFlash('error', e instanceof Error ? e.message : 'Gagal menghapus unit.');
    } finally {
      setDeleting(false);
    }
  };

  const specFields: Array<[keyof UnitForm, string, string]> = [
    ['processor', 'Processor', 'cth: Intel Core i5-12400'],
    ['ram', 'RAM', 'cth: 16GB DDR4'],
    ['storage', 'Storage / SSD', 'cth: 512GB NVMe SSD'],
    ['gpu', 'GPU / VGA', 'cth: Intel UHD 730'],
    ['monitor', 'Monitor', 'cth: 21.5" FHD'],
    ['os', 'Sistem Operasi', 'cth: Windows 11 Pro'],
  ];

  return (
    <div>
      <PageHeader
        title="Kelola Unit PC & Spesifikasi"
        description="Inventarisasi seluruh unit komputer beserta spesifikasi hardware per lab."
        actions={
          <>
            <Button onClick={() => { setBulk({ ...BULK_EMPTY, lab_id: labF !== 'Semua' ? labF : '' }); setBulkError(null); setBulkOpen(true); }}><Layers className="h-4 w-4" /> Tambah Massal</Button>
            <Button variant="primary" onClick={openAdd}><Plus className="h-4 w-4" /> Tambah Unit</Button>
          </>
        }
      />
      <div className="mb-4"><FlashBanner flash={flash} /></div>

      <div className="mb-4 flex flex-col gap-2 rounded-md border border-slate-200 bg-white p-3 sm:flex-row">
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Cari nomor PC / spesifikasi..." className="pl-9" />
        </div>
        <Select value={labF} onChange={(e) => setLabF(e.target.value)} className="sm:w-48">
          <option value="Semua">Semua Lab</option>
          {labs.map((l) => <option key={l.id} value={l.id}>{l.name}</option>)}
        </Select>
      </div>

      {loading ? (
        <div className="rounded-md border border-slate-200 bg-white"><Spinner label="Memuat unit PC..." /></div>
      ) : filtered.length === 0 ? (
        <EmptyState title="Tidak ada unit" description="Belum ada unit PC yang cocok dengan filter saat ini." action={<Button variant="primary" onClick={openAdd}><Plus className="h-4 w-4" /> Tambah Unit</Button>} />
      ) : (
        <TableWrap minWidth={1000}>
          <thead>
            <tr>
              <th className={thCls}>Unit</th>
              <th className={thCls}>Lab</th>
              <th className={thCls}>Processor</th>
              <th className={thCls}>RAM</th>
              <th className={thCls}>Storage</th>
              <th className={thCls}>GPU</th>
              <th className={thCls}>Monitor</th>
              <th className={thCls}>OS</th>
              <th className={thCls}>Status</th>
              <th className={thCls}>Aksi</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 bg-white">
            {filtered.map((u) => (
              <tr key={u.id} className="transition-colors hover:bg-slate-50">
                <td className={tdCls}><span className="font-mono text-[13px] font-semibold text-slate-900">{u.pc_number}</span></td>
                <td className={cn(tdCls, 'whitespace-nowrap text-[13px]')}>{u.labs?.name || labName(u.lab_id)}</td>
                <td className={cn(tdCls, 'font-mono text-xs')}>{u.processor}</td>
                <td className={cn(tdCls, 'whitespace-nowrap font-mono text-xs')}>{u.ram}</td>
                <td className={cn(tdCls, 'whitespace-nowrap font-mono text-xs')}>{u.storage}</td>
                <td className={cn(tdCls, 'font-mono text-xs')}>{u.gpu}</td>
                <td className={cn(tdCls, 'whitespace-nowrap text-[13px]')}>{u.monitor}</td>
                <td className={cn(tdCls, 'whitespace-nowrap text-[13px]')}>{u.os}</td>
                <td className={tdCls}><UnitStatusBadge status={u.status} /></td>
                <td className={tdCls}>
                  <div className="flex items-center gap-1.5">
                    <button onClick={() => openEdit(u)} className="rounded-md border border-slate-200 p-1.5 text-slate-500 hover:border-blue-300 hover:bg-blue-50 hover:text-blue-700" title="Ubah">
                      <Pencil className="h-4 w-4" />
                    </button>
                    <button onClick={() => setDeleteTarget(u)} className="rounded-md border border-slate-200 p-1.5 text-slate-400 hover:border-red-300 hover:bg-red-50 hover:text-red-600" title="Hapus">
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </TableWrap>
      )}
      {!loading && <p className="mt-2 font-mono text-xs text-slate-400">Menampilkan {filtered.length} dari {units.length} unit</p>}

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title={editing ? `Ubah ${editing.pc_number}` : 'Tambah Unit PC'} wide>
        <div className="space-y-4">
          {formError && <div className="rounded-md border border-red-200 bg-red-50 px-3 py-2.5 text-[13px] text-red-700">{formError}</div>}
          <div className="grid gap-4 sm:grid-cols-3">
            <Field label="Lab" required>
              <Select value={form.lab_id} onChange={(e) => setForm((f) => ({ ...f, lab_id: e.target.value }))}>
                <option value="">— Pilih —</option>
                {labs.map((l) => <option key={l.id} value={l.id}>{l.name}</option>)}
              </Select>
            </Field>
            <Field label="Nomor PC" required hint="cth: PC-01">
              <Input value={form.pc_number} onChange={(e) => setForm((f) => ({ ...f, pc_number: e.target.value.toUpperCase() }))} placeholder="PC-01" className="font-mono" maxLength={12} />
            </Field>
            <Field label="Status">
              <Select value={form.status} onChange={(e) => setForm((f) => ({ ...f, status: e.target.value }))}>
                {UNIT_STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
              </Select>
            </Field>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            {specFields.map(([key, label, ph]) => (
              <Field key={key} label={label}>
                <Input value={form[key]} onChange={(e) => setForm((f) => ({ ...f, [key]: e.target.value }))} placeholder={ph} maxLength={80} className="font-mono text-[13px]" />
              </Field>
            ))}
          </div>
          <Field label="Catatan Internal" hint="Hanya tampil untuk admin dan halaman detail lab bila relevan.">
            <Textarea rows={2} value={form.notes} onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))} placeholder="cth: RAM di-upgrade ke 16GB pada Sep 2026" maxLength={300} />
          </Field>
          <div className="flex justify-end gap-2 border-t border-slate-100 pt-4">
            <Button onClick={() => setModalOpen(false)}>Batal</Button>
            <Button variant="primary" loading={saving} onClick={save}>Simpan</Button>
          </div>
        </div>
      </Modal>

      <Modal open={bulkOpen} onClose={() => setBulkOpen(false)} title="Tambah Unit Massal" subtitle="Buat banyak unit sekaligus dengan spesifikasi seragam (mis. PC-01 s.d. PC-24)." wide>
        <div className="space-y-4">
          {bulkError && <div className="rounded-md border border-red-200 bg-red-50 px-3 py-2.5 text-[13px] text-red-700">{bulkError}</div>}
          <div className="grid gap-4 sm:grid-cols-4">
            <div className="sm:col-span-2">
              <Field label="Lab Tujuan" required>
                <Select value={bulk.lab_id} onChange={(e) => setBulk((b) => ({ ...b, lab_id: e.target.value }))}>
                  <option value="">— Pilih —</option>
                  {labs.map((l) => <option key={l.id} value={l.id}>{l.name}</option>)}
                </Select>
              </Field>
            </div>
            <Field label="Nomor Awal" required><Input type="number" min={1} value={bulk.start} onChange={(e) => setBulk((b) => ({ ...b, start: e.target.value }))} /></Field>
            <Field label="Nomor Akhir" required><Input type="number" min={1} value={bulk.end} onChange={(e) => setBulk((b) => ({ ...b, end: e.target.value }))} /></Field>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            {([
              ['processor', 'Processor'], ['ram', 'RAM'], ['storage', 'Storage / SSD'],
              ['gpu', 'GPU / VGA'], ['monitor', 'Monitor'], ['os', 'Sistem Operasi'],
            ] as Array<[keyof BulkForm, string]>).map(([key, label]) => (
              <Field key={key} label={label}>
                <Input value={bulk[key]} onChange={(e) => setBulk((b) => ({ ...b, [key]: e.target.value }))} maxLength={80} className="font-mono text-[13px]" />
              </Field>
            ))}
          </div>
          <div className="flex justify-end gap-2 border-t border-slate-100 pt-4">
            <Button onClick={() => setBulkOpen(false)}>Batal</Button>
            <Button variant="primary" loading={saving} onClick={saveBulk}>Buat Unit</Button>
          </div>
        </div>
      </Modal>

      <ConfirmDialog
        open={!!deleteTarget}
        title="Hapus Unit?"
        message={`${deleteTarget?.pc_number} (${deleteTarget?.labs?.name || ''}) akan dihapus permanen dari inventaris. Lanjutkan?`}
        onConfirm={doDelete}
        onClose={() => setDeleteTarget(null)}
        loading={deleting}
      />
    </div>
  );
}
