import { useEffect, useMemo, useState } from 'react';
import { Pencil, Plus, Search, Trash2 } from 'lucide-react';
import { api, DAY_ORDER } from '../../lib/api';
import type { Lab, Schedule } from '../../lib/api';
import { useAuth } from '../../contexts/AuthContext';
import {
  Button, ConfirmDialog, EmptyState, Field, FlashBanner, Input, Modal, PageHeader,
  Select, Spinner, TableWrap, cn, tdCls, thCls, useFlash,
} from '../../components/ui';

interface SchedForm {
  lab_id: string; course_code: string; course_name: string; lecturer: string;
  day: string; start_time: string; end_time: string; class_group: string; semester: string;
}
const EMPTY: SchedForm = { lab_id: '', course_code: '', course_name: '', lecturer: '', day: 'Senin', start_time: '08:00', end_time: '10:30', class_group: '', semester: 'Ganjil 2026/2027' };

export default function AdminSchedules() {
  const { session } = useAuth();
  const [schedules, setSchedules] = useState<Schedule[]>([]);
  const [labs, setLabs] = useState<Lab[]>([]);
  const [loading, setLoading] = useState(true);
  const [labF, setLabF] = useState('Semua');
  const [dayF, setDayF] = useState('Semua');
  const [q, setQ] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Schedule | null>(null);
  const [form, setForm] = useState<SchedForm>(EMPTY);
  const [formError, setFormError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<Schedule | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [flash, showFlash] = useFlash();

  const token = session?.access_token || '';

  const load = async () => {
    setLoading(true);
    try {
      const [s, l] = await Promise.all([api.schedules.list(), api.labs.list()]);
      setSchedules(s);
      setLabs(l);
    } catch {
      setSchedules([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    document.title = 'Kelola Jadwal — SIMLAB-TIK';
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const filtered = useMemo(() => {
    const s = q.trim().toLowerCase();
    return schedules
      .filter((r) => {
        if (labF !== 'Semua' && String(r.lab_id) !== labF) return false;
        if (dayF !== 'Semua' && r.day !== dayF) return false;
        if (!s) return true;
        return ((r.course_code || '') + ' ' + r.course_name + ' ' + (r.lecturer || '') + ' ' + (r.class_group || '')).toLowerCase().includes(s);
      })
      .sort((a, b) => DAY_ORDER.indexOf(a.day) - DAY_ORDER.indexOf(b.day) || a.start_time.localeCompare(b.start_time));
  }, [schedules, labF, dayF, q]);

  const openAdd = () => {
    setEditing(null);
    setForm({ ...EMPTY, lab_id: labF !== 'Semua' ? labF : '' });
    setFormError(null);
    setModalOpen(true);
  };

  const openEdit = (r: Schedule) => {
    setEditing(r);
    setForm({
      lab_id: String(r.lab_id), course_code: r.course_code || '', course_name: r.course_name,
      lecturer: r.lecturer || '', day: r.day, start_time: r.start_time.slice(0, 5), end_time: r.end_time.slice(0, 5),
      class_group: r.class_group || '', semester: r.semester || '',
    });
    setFormError(null);
    setModalOpen(true);
  };

  const save = async () => {
    if (!form.lab_id || !form.course_name.trim() || !form.day || !form.start_time || !form.end_time) {
      setFormError('Lab, mata kuliah, hari, dan jam wajib diisi.');
      return;
    }
    if (form.start_time >= form.end_time) {
      setFormError('Jam selesai harus lebih besar dari jam mulai.');
      return;
    }
    if (!token) return;
    setSaving(true);
    try {
      const payload = {
        lab_id: Number(form.lab_id), course_code: form.course_code.trim(), course_name: form.course_name.trim(),
        lecturer: form.lecturer.trim(), day: form.day, start_time: form.start_time, end_time: form.end_time,
        class_group: form.class_group.trim(), semester: form.semester.trim(),
      };
      if (editing) {
        await api.schedules.update({ ...payload, id: editing.id }, token);
        showFlash('success', 'Jadwal berhasil diperbarui.');
      } else {
        await api.schedules.create(payload, token);
        showFlash('success', 'Jadwal berhasil ditambahkan.');
      }
      setModalOpen(false);
      load();
    } catch (e) {
      setFormError(e instanceof Error ? e.message : 'Gagal menyimpan jadwal.');
    } finally {
      setSaving(false);
    }
  };

  const doDelete = async () => {
    if (!deleteTarget || !token) return;
    setDeleting(true);
    try {
      await api.schedules.remove(deleteTarget.id, token);
      setDeleteTarget(null);
      showFlash('success', 'Jadwal dihapus.');
      load();
    } catch (e) {
      showFlash('error', e instanceof Error ? e.message : 'Gagal menghapus jadwal.');
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div>
      <PageHeader
        title="Kelola Jadwal & Mata Kuliah"
        description="Atur penggunaan lab per hari: mata kuliah, dosen pengampu, dan kelas."
        actions={<Button variant="primary" onClick={openAdd}><Plus className="h-4 w-4" /> Tambah Jadwal</Button>}
      />
      <div className="mb-4"><FlashBanner flash={flash} /></div>

      <div className="mb-4 flex flex-col gap-2 rounded-md border border-slate-200 bg-white p-3 sm:flex-row">
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Cari matkul / dosen / kelas..." className="pl-9" />
        </div>
        <div className="flex gap-2">
          <Select value={labF} onChange={(e) => setLabF(e.target.value)} className="w-40">
            <option value="Semua">Semua Lab</option>
            {labs.map((l) => <option key={l.id} value={l.id}>{l.name}</option>)}
          </Select>
          <Select value={dayF} onChange={(e) => setDayF(e.target.value)} className="w-32">
            <option value="Semua">Semua Hari</option>
            {DAY_ORDER.map((d) => <option key={d} value={d}>{d}</option>)}
          </Select>
        </div>
      </div>

      {loading ? (
        <div className="rounded-md border border-slate-200 bg-white"><Spinner label="Memuat jadwal..." /></div>
      ) : filtered.length === 0 ? (
        <EmptyState title="Tidak ada jadwal" description="Belum ada jadwal yang cocok dengan filter saat ini." action={<Button variant="primary" onClick={openAdd}><Plus className="h-4 w-4" /> Tambah Jadwal</Button>} />
      ) : (
        <TableWrap minWidth={900}>
          <thead>
            <tr>
              <th className={thCls}>Lab</th>
              <th className={thCls}>Hari</th>
              <th className={thCls}>Jam</th>
              <th className={thCls}>Kode</th>
              <th className={thCls}>Mata Kuliah</th>
              <th className={thCls}>Dosen</th>
              <th className={thCls}>Kelas</th>
              <th className={thCls}>Semester</th>
              <th className={thCls}>Aksi</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 bg-white">
            {filtered.map((r) => (
              <tr key={r.id} className="transition-colors hover:bg-slate-50">
                <td className={cn(tdCls, 'whitespace-nowrap text-[13px]')}>{r.labs?.name || '-'}</td>
                <td className={cn(tdCls, 'whitespace-nowrap font-medium text-slate-900')}>{r.day}</td>
                <td className={cn(tdCls, 'whitespace-nowrap font-mono text-[13px]')}>{r.start_time.slice(0, 5)} - {r.end_time.slice(0, 5)}</td>
                <td className={cn(tdCls, 'font-mono text-[13px]')}>{r.course_code || '-'}</td>
                <td className={cn(tdCls, 'font-medium text-slate-900')}>{r.course_name}</td>
                <td className={tdCls}>{r.lecturer || '-'}</td>
                <td className={cn(tdCls, 'font-mono text-[13px]')}>{r.class_group || '-'}</td>
                <td className={cn(tdCls, 'whitespace-nowrap text-[13px] text-slate-500')}>{r.semester || '-'}</td>
                <td className={tdCls}>
                  <div className="flex items-center gap-1.5">
                    <button onClick={() => openEdit(r)} className="rounded-md border border-slate-200 p-1.5 text-slate-500 hover:border-blue-300 hover:bg-blue-50 hover:text-blue-700" title="Ubah">
                      <Pencil className="h-4 w-4" />
                    </button>
                    <button onClick={() => setDeleteTarget(r)} className="rounded-md border border-slate-200 p-1.5 text-slate-400 hover:border-red-300 hover:bg-red-50 hover:text-red-600" title="Hapus">
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </TableWrap>
      )}
      {!loading && <p className="mt-2 font-mono text-xs text-slate-400">Menampilkan {filtered.length} dari {schedules.length} jadwal</p>}

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title={editing ? 'Ubah Jadwal' : 'Tambah Jadwal'} wide>
        <div className="space-y-4">
          {formError && <div className="rounded-md border border-red-200 bg-red-50 px-3 py-2.5 text-[13px] text-red-700">{formError}</div>}
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Lab" required>
              <Select value={form.lab_id} onChange={(e) => setForm((f) => ({ ...f, lab_id: e.target.value }))}>
                <option value="">— Pilih —</option>
                {labs.map((l) => <option key={l.id} value={l.id}>{l.name}</option>)}
              </Select>
            </Field>
            <Field label="Hari" required>
              <Select value={form.day} onChange={(e) => setForm((f) => ({ ...f, day: e.target.value }))}>
                {DAY_ORDER.map((d) => <option key={d} value={d}>{d}</option>)}
              </Select>
            </Field>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Kode Mata Kuliah" hint="cth: IF101">
              <Input value={form.course_code} onChange={(e) => setForm((f) => ({ ...f, course_code: e.target.value }))} placeholder="IF101" className="font-mono" maxLength={20} />
            </Field>
            <Field label="Kelas" hint="cth: TI-3A">
              <Input value={form.class_group} onChange={(e) => setForm((f) => ({ ...f, class_group: e.target.value }))} placeholder="TI-3A" className="font-mono" maxLength={20} />
            </Field>
          </div>
          <Field label="Nama Mata Kuliah / Kegiatan" required>
            <Input value={form.course_name} onChange={(e) => setForm((f) => ({ ...f, course_name: e.target.value }))} placeholder="cth: Algoritma & Pemrograman" maxLength={120} />
          </Field>
          <Field label="Dosen / Penanggung Jawab">
            <Input value={form.lecturer} onChange={(e) => setForm((f) => ({ ...f, lecturer: e.target.value }))} placeholder="cth: Dr. Andini Pratiwi, M.Kom" maxLength={120} />
          </Field>
          <div className="grid gap-4 sm:grid-cols-3">
            <Field label="Jam Mulai" required><Input type="time" value={form.start_time} onChange={(e) => setForm((f) => ({ ...f, start_time: e.target.value }))} /></Field>
            <Field label="Jam Selesai" required><Input type="time" value={form.end_time} onChange={(e) => setForm((f) => ({ ...f, end_time: e.target.value }))} /></Field>
            <Field label="Semester" hint="cth: Ganjil 2026/2027">
              <Input value={form.semester} onChange={(e) => setForm((f) => ({ ...f, semester: e.target.value }))} placeholder="Ganjil 2026/2027" maxLength={30} />
            </Field>
          </div>
          <div className="flex justify-end gap-2 border-t border-slate-100 pt-4">
            <Button onClick={() => setModalOpen(false)}>Batal</Button>
            <Button variant="primary" loading={saving} onClick={save}>Simpan</Button>
          </div>
        </div>
      </Modal>

      <ConfirmDialog
        open={!!deleteTarget}
        title="Hapus Jadwal?"
        message={`${deleteTarget?.course_name} (${deleteTarget?.day}, ${deleteTarget?.start_time.slice(0, 5)}-${deleteTarget?.end_time.slice(0, 5)}) akan dihapus permanen. Lanjutkan?`}
        onConfirm={doDelete}
        onClose={() => setDeleteTarget(null)}
        loading={deleting}
      />
    </div>
  );
}
