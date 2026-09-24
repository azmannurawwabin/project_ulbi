import { useEffect, useMemo, useState } from 'react';
import type { FormEvent } from 'react';
import { Plus, Pencil, Trash2 } from 'lucide-react';
import { apiFetch, DAYS } from '../../lib/api';
import type { Lab, Schedule } from '../../lib/api';
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

const emptyForm = {
  lab_id: '',
  course_name: '',
  lecturer_name: '',
  day: 'Senin',
  start_time: '08:00',
  end_time: '10:30',
  semester: 'Ganjil 2026/2027',
};

export default function Schedules() {
  const [schedules, setSchedules] = useState<Schedule[]>([]);
  const [labs, setLabs] = useState<Lab[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [labFilter, setLabFilter] = useState('');
  const [dayFilter, setDayFilter] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState<Schedule | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [formError, setFormError] = useState('');
  const [saving, setSaving] = useState(false);

  const load = async () => {
    setLoading(true);
    setError('');
    try {
      const [s, l] = await Promise.all([apiFetch<Schedule[]>('/api/schedules'), apiFetch<Lab[]>('/api/labs')]);
      setSchedules(s);
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
    const dayIdx = (d: string) => DAYS.indexOf(d);
    return schedules
      .filter((s) => {
        if (labFilter && String(s.lab_id) !== labFilter) return false;
        if (dayFilter && s.day !== dayFilter) return false;
        return true;
      })
      .sort((a, b) => dayIdx(a.day) - dayIdx(b.day) || a.start_time.localeCompare(b.start_time));
  }, [schedules, labFilter, dayFilter]);

  const labCode = (id: number) => labs.find((l) => l.id === id)?.code || `Lab ${id}`;

  const openAdd = () => {
    setEditing(null);
    setForm({ ...emptyForm, lab_id: labFilter });
    setFormError('');
    setShowModal(true);
  };

  const openEdit = (s: Schedule) => {
    setEditing(s);
    setForm({
      lab_id: String(s.lab_id),
      course_name: s.course_name,
      lecturer_name: s.lecturer_name || '',
      day: s.day,
      start_time: s.start_time,
      end_time: s.end_time,
      semester: s.semester || '',
    });
    setFormError('');
    setShowModal(true);
  };

  const handleSave = async (e: FormEvent) => {
    e.preventDefault();
    if (!form.lab_id || !form.course_name.trim()) {
      setFormError('Lab dan nama matakuliah wajib diisi.');
      return;
    }
    if (form.start_time >= form.end_time) {
      setFormError('Jam selesai harus lebih besar dari jam mulai.');
      return;
    }
    setSaving(true);
    setFormError('');
    try {
      const payload = { ...form, lab_id: Number(form.lab_id) };
      if (editing) {
        await apiFetch('/api/schedules', { method: 'PUT', body: JSON.stringify({ id: editing.id, ...payload }) });
      } else {
        await apiFetch('/api/schedules', { method: 'POST', body: JSON.stringify(payload) });
      }
      setShowModal(false);
      await load();
    } catch (err) {
      setFormError(err instanceof Error ? err.message : 'Gagal menyimpan');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (s: Schedule) => {
    if (!window.confirm(`Hapus jadwal ${s.course_name} (${s.day})?`)) return;
    try {
      await apiFetch('/api/schedules', { method: 'DELETE', body: JSON.stringify({ id: s.id }) });
      await load();
    } catch (e) {
      alert(e instanceof Error ? e.message : 'Gagal menghapus');
    }
  };

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-zinc-900">Jadwal &amp; Mata Kuliah</h1>
          <p className="mt-0.5 text-sm text-zinc-500">{schedules.length} jadwal terdaftar.</p>
        </div>
        <button onClick={openAdd} className={btnPrimary}>
          <Plus size={16} /> Tambah Jadwal
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
        <select className={inputCls} value={dayFilter} onChange={(e) => setDayFilter(e.target.value)}>
          <option value="">Semua Hari</option>
          {DAYS.map((d) => (
            <option key={d} value={d}>
              {d}
            </option>
          ))}
        </select>
      </div>

      <div className="mt-4 overflow-hidden rounded-lg border border-zinc-200 bg-white shadow-sm">
        {loading ? (
          <Spinner label="Memuat jadwal..." />
        ) : error ? (
          <div className="p-4">
            <ErrorBanner message={error} onRetry={load} />
          </div>
        ) : filtered.length === 0 ? (
          <div className="p-4">
            <EmptyState title="Tidak ada jadwal" desc="Coba ubah filter atau tambah jadwal baru." />
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[860px] border-collapse">
              <thead>
                <tr className="border-b border-zinc-200 bg-zinc-50">
                  <th className={thCls}>Lab</th>
                  <th className={thCls}>Mata Kuliah</th>
                  <th className={thCls}>Dosen</th>
                  <th className={thCls}>Hari</th>
                  <th className={thCls}>Jam</th>
                  <th className={thCls}>Semester</th>
                  <th className={`${thCls} text-right`}>Aksi</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((s) => (
                  <tr key={s.id} className="border-b border-zinc-100 last:border-0 hover:bg-zinc-50/60">
                    <td className="px-4 py-3 font-mono text-sm font-bold text-zinc-900">{labCode(s.lab_id)}</td>
                    <td className="px-4 py-3 text-sm font-medium text-zinc-900">{s.course_name}</td>
                    <td className={tdCls}>{s.lecturer_name || '-'}</td>
                    <td className={tdCls}>{s.day}</td>
                    <td className="whitespace-nowrap px-4 py-3 font-mono text-xs font-semibold text-zinc-900">
                      {s.start_time} - {s.end_time}
                    </td>
                    <td className={tdCls}>{s.semester || '-'}</td>
                    <td className="px-4 py-3 text-right">
                      <div className="inline-flex gap-1.5">
                        <button
                          onClick={() => openEdit(s)}
                          className="rounded-lg border border-zinc-300 p-2 text-zinc-600 hover:bg-zinc-100"
                          title="Ubah"
                        >
                          <Pencil size={15} />
                        </button>
                        <button
                          onClick={() => handleDelete(s)}
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
        <Modal title={editing ? 'Ubah Jadwal' : 'Tambah Jadwal'} onClose={() => setShowModal(false)}>
          <form onSubmit={handleSave} className="space-y-3">
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
              <label className={labelCls}>Mata Kuliah / Kegiatan</label>
              <input
                className={inputCls}
                placeholder="cth: Algoritma & Pemrograman"
                value={form.course_name}
                onChange={(e) => setForm({ ...form, course_name: e.target.value })}
              />
            </div>
            <div>
              <label className={labelCls}>Dosen / Penanggung Jawab</label>
              <input
                className={inputCls}
                placeholder="cth: Dr. Ahmad Fauzi, M.Kom."
                value={form.lecturer_name}
                onChange={(e) => setForm({ ...form, lecturer_name: e.target.value })}
              />
            </div>
            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className={labelCls}>Hari</label>
                <select className={inputCls} value={form.day} onChange={(e) => setForm({ ...form, day: e.target.value })}>
                  {DAYS.map((d) => (
                    <option key={d} value={d}>
                      {d}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className={labelCls}>Mulai</label>
                <input
                  type="time"
                  className={`${inputCls} font-mono`}
                  value={form.start_time}
                  onChange={(e) => setForm({ ...form, start_time: e.target.value })}
                />
              </div>
              <div>
                <label className={labelCls}>Selesai</label>
                <input
                  type="time"
                  className={`${inputCls} font-mono`}
                  value={form.end_time}
                  onChange={(e) => setForm({ ...form, end_time: e.target.value })}
                />
              </div>
            </div>
            <div>
              <label className={labelCls}>Semester</label>
              <input
                className={inputCls}
                placeholder="Ganjil 2026/2027"
                value={form.semester}
                onChange={(e) => setForm({ ...form, semester: e.target.value })}
              />
            </div>
            <FieldError msg={formError} />
            <div className="flex gap-2 pt-1">
              <button type="submit" disabled={saving} className={`${btnPrimary} flex-1`}>
                {saving ? 'Menyimpan...' : editing ? 'Simpan Perubahan' : 'Tambah Jadwal'}
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
