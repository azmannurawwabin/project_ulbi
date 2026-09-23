import { useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Eye, Search, Trash2 } from 'lucide-react';
import { api, TICKET_CATEGORIES, TICKET_STATUSES, formatDateTime } from '../../lib/api';
import type { Lab, Ticket } from '../../lib/api';
import { useAuth } from '../../contexts/AuthContext';
import {
  Button, ConfirmDialog, EmptyState, Field, FlashBanner, Input, Modal, PageHeader,
  Select, Spinner, TableWrap, Textarea, TicketPipeline, TicketStatusBadge, cn, tdCls, thCls, useFlash,
} from '../../components/ui';

interface TicketForm {
  status: string;
  technician_note: string;
  handled_by: string;
  description: string;
  category: string;
  pc_number: string;
}

export default function AdminTickets() {
  const { session } = useAuth();
  const [params] = useSearchParams();
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [labs, setLabs] = useState<Lab[]>([]);
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState(params.get('q') || '');
  const [statusF, setStatusF] = useState('Semua');
  const [labF, setLabF] = useState('Semua');
  const [selected, setSelected] = useState<Ticket | null>(null);
  const [form, setForm] = useState<TicketForm>({ status: 'Diterima', technician_note: '', handled_by: '', description: '', category: 'Hardware', pc_number: '' });
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<Ticket | null>(null);
  const [flash, showFlash] = useFlash();

  const token = session?.access_token || '';

  const load = async () => {
    setLoading(true);
    try {
      const [t, l] = await Promise.all([api.tickets.list(), api.labs.list()]);
      setTickets(t);
      setLabs(l);
    } catch {
      setTickets([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    document.title = 'Kelola Laporan — SIMLAB-TIK';
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const filtered = useMemo(() => {
    const s = q.trim().toLowerCase();
    return tickets.filter((t) => {
      if (statusF !== 'Semua' && t.status !== statusF) return false;
      if (labF !== 'Semua' && String(t.lab_id) !== labF) return false;
      if (!s) return true;
      return (
        t.ticket_no.toLowerCase().includes(s) ||
        t.reporter_name.toLowerCase().includes(s) ||
        t.reporter_nim.toLowerCase().includes(s) ||
        t.pc_number.toLowerCase().includes(s) ||
        t.description.toLowerCase().includes(s)
      );
    });
  }, [tickets, q, statusF, labF]);

  const openDetail = (t: Ticket) => {
    setSelected(t);
    setForm({
      status: t.status,
      technician_note: t.technician_note || '',
      handled_by: t.handled_by || '',
      description: t.description,
      category: t.category,
      pc_number: t.pc_number,
    });
  };

  const save = async () => {
    if (!selected || !token) return;
    if (!form.description.trim()) {
      showFlash('error', 'Deskripsi laporan tidak boleh kosong.');
      return;
    }
    setSaving(true);
    try {
      const updated = await api.tickets.update({
        id: selected.id,
        status: form.status,
        technician_note: form.technician_note.trim(),
        handled_by: form.handled_by.trim(),
        description: form.description.trim(),
        category: form.category,
        pc_number: form.pc_number.trim(),
      }, token);
      setTickets((rows) => rows.map((r) => (r.id === updated.id ? updated : r)));
      setSelected(updated);
      showFlash('success', `Tiket ${updated.ticket_no} berhasil diperbarui.`);
    } catch (e) {
      showFlash('error', e instanceof Error ? e.message : 'Gagal menyimpan perubahan.');
    } finally {
      setSaving(false);
    }
  };

  const doDelete = async () => {
    if (!deleteTarget || !token) return;
    setDeleting(true);
    try {
      await api.tickets.remove(deleteTarget.id, token);
      setTickets((rows) => rows.filter((r) => r.id !== deleteTarget.id));
      if (selected?.id === deleteTarget.id) setSelected(null);
      setDeleteTarget(null);
      showFlash('success', `Tiket ${deleteTarget.ticket_no} dihapus.`);
    } catch (e) {
      showFlash('error', e instanceof Error ? e.message : 'Gagal menghapus laporan.');
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div>
      <PageHeader title="Manajemen Laporan" description="Verifikasi tiket masuk, ubah status penanganan, dan catat tindakan teknisi." />
      <div className="mb-4"><FlashBanner flash={flash} /></div>

      <div className="mb-4 flex flex-col gap-2 rounded-md border border-slate-200 bg-white p-3 sm:flex-row">
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Cari tiket, pelapor, NIM, PC, deskripsi..." className="pl-9" />
        </div>
        <div className="flex gap-2">
          <Select value={statusF} onChange={(e) => setStatusF(e.target.value)} className="w-36">
            <option value="Semua">Semua Status</option>
            {TICKET_STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
          </Select>
          <Select value={labF} onChange={(e) => setLabF(e.target.value)} className="w-44">
            <option value="Semua">Semua Lab</option>
            {labs.map((l) => <option key={l.id} value={l.id}>{l.name}</option>)}
          </Select>
        </div>
      </div>

      {loading ? (
        <div className="rounded-md border border-slate-200 bg-white"><Spinner label="Memuat laporan..." /></div>
      ) : filtered.length === 0 ? (
        <EmptyState title="Tidak ada laporan" description="Tidak ada tiket yang cocok dengan filter saat ini." />
      ) : (
        <TableWrap minWidth={860}>
          <thead>
            <tr>
              <th className={thCls}>Tiket</th>
              <th className={thCls}>Pelapor</th>
              <th className={thCls}>Lab / PC</th>
              <th className={thCls}>Kategori</th>
              <th className={thCls}>Status</th>
              <th className={thCls}>Diperbarui</th>
              <th className={thCls}>Aksi</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 bg-white">
            {filtered.map((t) => (
              <tr key={t.id} className="transition-colors hover:bg-slate-50">
                <td className={tdCls}><span className="font-mono text-[13px] font-semibold text-slate-900">{t.ticket_no}</span><span className="block text-xs text-slate-400">{formatDateTime(t.created_at)}</span></td>
                <td className={tdCls}><span className="block font-medium text-slate-900">{t.reporter_name}</span><span className="font-mono text-xs text-slate-500">{t.reporter_nim}</span></td>
                <td className={tdCls}><span className="block text-[13px]">{t.labs?.name || '-'}</span><span className="font-mono text-xs text-slate-500">{t.pc_number}</span></td>
                <td className={cn(tdCls, 'whitespace-nowrap text-[13px]')}>{t.category}</td>
                <td className={tdCls}><TicketStatusBadge status={t.status} /></td>
                <td className={cn(tdCls, 'whitespace-nowrap text-[13px] text-slate-500')}>{formatDateTime(t.updated_at)}</td>
                <td className={tdCls}>
                  <div className="flex items-center gap-1.5">
                    <Button size="sm" onClick={() => openDetail(t)}><Eye className="h-3.5 w-3.5" /> Detail</Button>
                    <button onClick={() => setDeleteTarget(t)} className="rounded-md border border-slate-200 p-1.5 text-slate-400 hover:border-red-300 hover:bg-red-50 hover:text-red-600" title="Hapus laporan">
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </TableWrap>
      )}
      {!loading && <p className="mt-2 font-mono text-xs text-slate-400">Menampilkan {filtered.length} dari {tickets.length} laporan</p>}

      <Modal open={!!selected} onClose={() => setSelected(null)} title={selected ? `Tiket ${selected.ticket_no}` : ''} subtitle={selected ? `Dilaporkan ${formatDateTime(selected.created_at)} • Diperbarui ${formatDateTime(selected.updated_at)}` : ''} wide>
        {selected && (
          <div className="space-y-5">
            <TicketPipeline status={form.status} />
            <div className="grid gap-4 text-sm sm:grid-cols-3">
              <div><p className="text-xs font-medium uppercase tracking-wider text-slate-400">Pelapor</p><p className="mt-1 font-medium text-slate-900">{selected.reporter_name}</p><p className="font-mono text-xs text-slate-500">{selected.reporter_nim}</p></div>
              <div><p className="text-xs font-medium uppercase tracking-wider text-slate-400">Lab</p><p className="mt-1 font-medium text-slate-900">{selected.labs?.name || '-'}</p><p className="font-mono text-xs text-slate-500">{selected.labs?.code || ''}</p></div>
              <div><p className="text-xs font-medium uppercase tracking-wider text-slate-400">Foto</p>{selected.photo_url ? <a href={selected.photo_url} target="_blank" rel="noreferrer" className="mt-1 inline-block text-blue-700 hover:underline">Lihat lampiran</a> : <p className="mt-1 text-slate-400">Tidak ada</p>}</div>
            </div>
            {selected.photo_url && <a href={selected.photo_url} target="_blank" rel="noreferrer"><img src={selected.photo_url} alt="Lampiran" className="max-h-44 rounded-md border border-slate-200 object-contain" /></a>}
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Nomor PC" required>
                <Input value={form.pc_number} onChange={(e) => setForm((f) => ({ ...f, pc_number: e.target.value }))} className="font-mono" />
              </Field>
              <Field label="Kategori" required>
                <Select value={form.category} onChange={(e) => setForm((f) => ({ ...f, category: e.target.value }))}>
                  {TICKET_CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
                </Select>
              </Field>
            </div>
            <Field label="Deskripsi Laporan (dapat dikoreksi)" required>
              <Textarea rows={3} value={form.description} onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))} />
            </Field>
            <div className="space-y-4 rounded-md border border-slate-200 bg-slate-50 p-4">
              <p className="text-[13px] font-semibold uppercase tracking-wider text-slate-500">Penanganan Teknisi</p>
              <div>
                <p className="mb-1.5 text-[13px] font-medium text-slate-700">Status Penanganan</p>
                <div className="grid grid-cols-3 gap-1 rounded-md border border-slate-200 bg-white p-1">
                  {TICKET_STATUSES.map((s) => (
                    <button key={s} type="button" onClick={() => setForm((f) => ({ ...f, status: s }))} className={cn('h-8 rounded text-[13px] font-medium transition-colors', form.status === s ? 'bg-slate-900 text-white' : 'text-slate-600 hover:bg-slate-100')}>{s}</button>
                  ))}
                </div>
              </div>
              <Field label="Ditangani Oleh" hint="cth: Agus (PKL), Rudi (TIK)">
                <Input value={form.handled_by} onChange={(e) => setForm((f) => ({ ...f, handled_by: e.target.value }))} placeholder="Nama teknisi" />
              </Field>
              <Field label="Catatan Teknisi" hint="cth: Unit PC-05 sudah ganti RAM 8GB. Catatan tampil di halaman pelacakan mahasiswa.">
                <Textarea rows={3} value={form.technician_note} onChange={(e) => setForm((f) => ({ ...f, technician_note: e.target.value }))} placeholder="Tulis tindakan yang dilakukan..." />
              </Field>
            </div>
            <div className="flex items-center justify-between gap-2 border-t border-slate-100 pt-4">
              <Button variant="danger" onClick={() => setDeleteTarget(selected)}><Trash2 className="h-4 w-4" /> Hapus</Button>
              <div className="flex gap-2">
                <Button onClick={() => setSelected(null)}>Batal</Button>
                <Button variant="primary" loading={saving} onClick={save}>Simpan Perubahan</Button>
              </div>
            </div>
          </div>
        )}
      </Modal>

      <ConfirmDialog
        open={!!deleteTarget}
        title="Hapus Laporan?"
        message={`Tiket ${deleteTarget?.ticket_no} akan dihapus permanen dan tidak dapat dikembalikan. Lanjutkan?`}
        onConfirm={doDelete}
        onClose={() => setDeleteTarget(null)}
        loading={deleting}
      />
    </div>
  );
}
