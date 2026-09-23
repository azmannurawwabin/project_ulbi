import { useEffect, useState } from 'react';
import type { ChangeEvent } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { AlertTriangle, ArrowLeft, Check, CheckCircle2, Copy, FileText, Search, Upload, X } from 'lucide-react';
import { api, TICKET_CATEGORIES, formatDateTime } from '../lib/api';
import type { Lab, PcUnit, Ticket } from '../lib/api';
import { Button, Card, Field, Input, PageHeader, Select, Textarea } from '../components/ui';

interface FormState {
  reporter_name: string;
  reporter_nim: string;
  lab_id: string;
  pc_number: string;
  category: string;
  description: string;
}

const EMPTY: FormState = { reporter_name: '', reporter_nim: '', lab_id: '', pc_number: '', category: 'Hardware', description: '' };

export default function ReportForm() {
  const [params] = useSearchParams();
  const [labs, setLabs] = useState<Lab[]>([]);
  const [units, setUnits] = useState<PcUnit[]>([]);
  const [unitsLoading, setUnitsLoading] = useState(false);
  const [form, setForm] = useState<FormState>({ ...EMPTY, lab_id: params.get('lab') || '', pc_number: params.get('pc') || '' });
  const [errors, setErrors] = useState<Partial<FormState>>({});
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [photoError, setPhotoError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [success, setSuccess] = useState<Ticket | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    document.title = 'Lapor Kerusakan — SIMLAB-TIK';
    api.labs.list().then(setLabs).catch(() => setLabs([]));
  }, []);

  useEffect(() => {
    if (!form.lab_id) {
      setUnits([]);
      return;
    }
    setUnitsLoading(true);
    api.units.list(form.lab_id).then(setUnits).catch(() => setUnits([])).finally(() => setUnitsLoading(false));
  }, [form.lab_id]);

  const set = (k: keyof FormState, v: string) => {
    setForm((f) => ({ ...f, [k]: v }));
    setErrors((e) => ({ ...e, [k]: undefined }));
  };

  const onPhotoChange = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    setPhotoError(null);
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      setPhotoError('File harus berupa gambar (JPG/PNG).');
      return;
    }
    if (file.size > 2.5 * 1024 * 1024) {
      setPhotoError('Ukuran foto maksimal 2,5 MB.');
      return;
    }
    setPhotoFile(file);
    const reader = new FileReader();
    reader.onload = () => setPhotoPreview(String(reader.result));
    reader.readAsDataURL(file);
  };

  const clearPhoto = () => {
    setPhotoFile(null);
    setPhotoPreview(null);
    setPhotoError(null);
  };

  const validate = (): boolean => {
    const err: Partial<FormState> = {};
    if (form.reporter_name.trim().length < 3) err.reporter_name = 'Nama wajib diisi (minimal 3 karakter).';
    if (!/^[A-Za-z0-9]{5,20}$/.test(form.reporter_nim.trim())) err.reporter_nim = 'NIM/ID tidak valid (5-20 karakter, tanpa spasi).';
    if (!form.lab_id) err.lab_id = 'Pilih laboratorium.';
    if (!form.pc_number) err.pc_number = 'Pilih nomor PC.';
    if (form.description.trim().length < 20) err.description = 'Jelaskan kerusakan minimal 20 karakter agar mudah ditindaklanjuti.';
    setErrors(err);
    return Object.keys(err).length === 0;
  };

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    setSubmitting(true);
    setSubmitError(null);
    try {
      let photoUrl: string | null = null;
      if (photoFile) photoUrl = await api.uploadPhoto(photoFile);
      const ticket = await api.tickets.create({
        reporter_name: form.reporter_name.trim(),
        reporter_nim: form.reporter_nim.trim(),
        lab_id: Number(form.lab_id),
        pc_number: form.pc_number,
        category: form.category,
        description: form.description.trim(),
        photo_url: photoUrl,
      });
      setSuccess(ticket);
      window.scrollTo(0, 0);
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : 'Gagal mengirim laporan.');
    } finally {
      setSubmitting(false);
    }
  };

  const copyTicket = async () => {
    if (!success) return;
    try {
      await navigator.clipboard.writeText(success.ticket_no);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      /* abaikan */
    }
  };

  const resetAll = () => {
    setForm({ ...EMPTY });
    setErrors({});
    clearPhoto();
    setSuccess(null);
    setSubmitError(null);
  };

  if (success) {
    return (
      <div className="mx-auto max-w-2xl">
        <Card className="p-6 text-center sm:p-10">
          <span className="mx-auto flex h-12 w-12 items-center justify-center rounded-full border border-emerald-200 bg-emerald-50">
            <CheckCircle2 className="h-6 w-6 text-emerald-600" />
          </span>
          <h1 className="mt-4 text-xl font-semibold tracking-tight text-slate-900">Laporan Berhasil Dikirim</h1>
          <p className="mx-auto mt-1 max-w-md text-sm text-slate-500">
            Terima kasih, laporan Anda telah diterima oleh Bagian TIK dan akan segera ditindaklanjuti. Simpan nomor tiket berikut untuk pelacakan.
          </p>
          <div className="mx-auto mt-5 flex max-w-md items-center justify-between gap-3 rounded-md border border-slate-200 bg-slate-50 px-4 py-3">
            <div className="text-left">
              <p className="text-xs text-slate-500">Nomor Tiket</p>
              <p className="font-mono text-lg font-semibold tracking-tight text-slate-900">{success.ticket_no}</p>
            </div>
            <Button size="sm" onClick={copyTicket}>{copied ? <><Check className="h-3.5 w-3.5" /> Tersalin</> : <><Copy className="h-3.5 w-3.5" /> Salin</>}</Button>
          </div>
          <dl className="mx-auto mt-5 max-w-md divide-y divide-slate-100 rounded-md border border-slate-200 text-left text-sm">
            <div className="grid grid-cols-3 gap-2 px-4 py-2.5"><dt className="text-slate-500">Pelapor</dt><dd className="col-span-2 text-slate-900">{success.reporter_name} <span className="font-mono text-[13px] text-slate-500">({success.reporter_nim})</span></dd></div>
            <div className="grid grid-cols-3 gap-2 px-4 py-2.5"><dt className="text-slate-500">Lokasi</dt><dd className="col-span-2 text-slate-900">{success.labs?.name || '-'} <span className="font-mono text-[13px]">• {success.pc_number}</span></dd></div>
            <div className="grid grid-cols-3 gap-2 px-4 py-2.5"><dt className="text-slate-500">Kategori</dt><dd className="col-span-2 text-slate-900">{success.category}</dd></div>
            <div className="grid grid-cols-3 gap-2 px-4 py-2.5"><dt className="text-slate-500">Waktu</dt><dd className="col-span-2 text-slate-900">{formatDateTime(success.created_at)}</dd></div>
          </dl>
          <div className="mt-6 flex flex-col justify-center gap-2 sm:flex-row">
            <Link to={`/lacak?tiket=${encodeURIComponent(success.ticket_no)}`} className="inline-flex h-9 items-center justify-center gap-2 rounded-md bg-blue-600 px-4 text-sm font-medium text-white hover:bg-blue-700">
              <Search className="h-4 w-4" /> Lacak Status
            </Link>
            <Button onClick={resetAll}>Buat Laporan Baru</Button>
            <Link to="/" className="inline-flex h-9 items-center justify-center gap-2 rounded-md px-4 text-sm font-medium text-slate-600 hover:bg-slate-100">
              Kembali ke Beranda
            </Link>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div>
      <PageHeader title="Form Laporan Kerusakan PC" description="Lengkapi data di bawah ini. Setiap laporan yang valid akan diteruskan ke teknisi TIK sesuai antrean." />
      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="p-5 sm:p-6 lg:col-span-2">
          {submitError && (
            <div className="mb-5 flex items-start gap-2.5 rounded-md border border-red-200 bg-red-50 px-3.5 py-3 text-sm text-red-800">
              <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
              <span>{submitError}</span>
            </div>
          )}
          <form onSubmit={onSubmit} noValidate className="space-y-5">
            <div className="grid gap-5 sm:grid-cols-2">
              <Field label="Nama Lengkap" required error={errors.reporter_name}>
                <Input value={form.reporter_name} onChange={(e) => set('reporter_name', e.target.value)} placeholder="cth: Rina Amelia" maxLength={100} />
              </Field>
              <Field label="NIM / Nomor ID" required error={errors.reporter_nim} hint="Tanpa spasi, contoh: 22101101">
                <Input value={form.reporter_nim} onChange={(e) => set('reporter_nim', e.target.value)} placeholder="cth: 22101101" maxLength={20} className="font-mono" />
              </Field>
            </div>
            <div className="grid gap-5 sm:grid-cols-2">
              <Field label="Laboratorium" required error={errors.lab_id}>
                <Select value={form.lab_id} onChange={(e) => { set('lab_id', e.target.value); set('pc_number', ''); }}>
                  <option value="">— Pilih Lab —</option>
                  {labs.map((l) => <option key={l.id} value={l.id}>{l.name} — {l.location || ''}</option>)}
                </Select>
              </Field>
              <Field label="Nomor PC" required error={errors.pc_number} hint="Sesuai stiker nomor pada monitor/CPU">
                <Select value={form.pc_number} onChange={(e) => set('pc_number', e.target.value)} disabled={!form.lab_id || unitsLoading}>
                  <option value="">{!form.lab_id ? '— Pilih lab terlebih dahulu —' : unitsLoading ? 'Memuat unit...' : '— Pilih Nomor PC —'}</option>
                  {units.map((u) => <option key={u.id} value={u.pc_number}>{u.pc_number} — {u.status}</option>)}
                </Select>
              </Field>
            </div>
            <Field label="Kategori Kerusakan" required>
              <Select value={form.category} onChange={(e) => set('category', e.target.value)}>
                {TICKET_CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
              </Select>
            </Field>
            <Field label="Deskripsi Kerusakan" required error={errors.description} hint={`${form.description.trim().length}/1000 karakter — sertakan gejala, kapan terjadi, dan pesan error bila ada.`}>
              <Textarea value={form.description} onChange={(e) => set('description', e.target.value)} rows={5} maxLength={1000} placeholder="cth: Monitor PC-07 tidak menampilkan gambar sejak pukul 09.00. Lampu CPU menyala, tetapi layar hitam dan muncul pesan 'No Signal'." />
            </Field>
            <div>
              <label className="mb-1.5 block text-[13px] font-medium text-slate-700">Lampiran Foto <span className="font-normal text-slate-400">(opsional, maks 2,5 MB)</span></label>
              {photoPreview ? (
                <div className="flex items-start gap-4">
                  <img src={photoPreview} alt="Pratinjau" className="h-28 w-40 rounded-md border border-slate-200 object-cover" />
                  <div>
                    <p className="max-w-[220px] truncate text-sm text-slate-700">{photoFile?.name}</p>
                    <p className="mt-0.5 font-mono text-xs text-slate-500">{photoFile ? `${(photoFile.size / 1024).toFixed(0)} KB` : ''}</p>
                    <button type="button" onClick={clearPhoto} className="mt-2 inline-flex items-center gap-1 text-[13px] font-medium text-red-600 hover:underline">
                      <X className="h-3.5 w-3.5" /> Hapus foto
                    </button>
                  </div>
                </div>
              ) : (
                <label className="flex cursor-pointer items-center justify-center gap-2 rounded-md border border-dashed border-slate-300 bg-slate-50 px-4 py-6 text-sm text-slate-500 transition-colors hover:border-blue-400 hover:bg-blue-50/40 hover:text-slate-700">
                  <Upload className="h-4 w-4" /> Klik untuk memilih foto (JPG/PNG)
                  <input type="file" accept="image/*" className="hidden" onChange={onPhotoChange} />
                </label>
              )}
              {photoError && <p className="mt-1 text-xs text-red-600">{photoError}</p>}
            </div>
            <div className="flex flex-col-reverse gap-2 border-t border-slate-100 pt-5 sm:flex-row sm:justify-end">
              <Link to="/" className="inline-flex h-9 items-center justify-center gap-2 rounded-md px-4 text-sm font-medium text-slate-600 hover:bg-slate-100">
                <ArrowLeft className="h-4 w-4" /> Batal
              </Link>
              <Button type="submit" variant="primary" loading={submitting}>Kirim Laporan</Button>
            </div>
          </form>
        </Card>

        <div className="space-y-4">
          <Card className="p-5">
            <h3 className="flex items-center gap-2 text-sm font-semibold text-slate-900"><FileText className="h-4 w-4 text-slate-400" /> Alur Pelaporan</h3>
            <ol className="mt-4 space-y-4">
              {[
                ['1. Isi formulir', 'Pastikan nomor PC sesuai dengan stiker pada perangkat.'],
                ['2. Terima nomor tiket', 'Nomor tiket unik diterbitkan otomatis sebagai bukti laporan.'],
                ['3. Pantau status', 'Gunakan halaman Lacak Tiket untuk melihat progres penanganan.'],
              ].map(([t, d]) => (
                <li key={t} className="flex gap-3">
                  <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full border border-slate-300 bg-white font-mono text-[11px] font-semibold text-slate-600">{t[0]}</span>
                  <div><p className="text-sm font-medium text-slate-900">{t.slice(3)}</p><p className="mt-0.5 text-[13px] leading-5 text-slate-500">{d}</p></div>
                </li>
              ))}
            </ol>
          </Card>
          <Card className="p-5">
            <h3 className="text-sm font-semibold text-slate-900">Ketentuan</h3>
            <ul className="mt-3 list-disc space-y-1.5 pl-5 text-[13px] leading-5 text-slate-500">
              <li>Satu laporan untuk satu unit PC dan satu jenis kerusakan.</li>
              <li>Laporan diverifikasi admin sebelum diteruskan ke teknisi.</li>
              <li>Penanganan mengikuti antrean dan tingkat urgensi.</li>
              <li>Layanan teknisi: Senin-Jumat, 08.00-16.00 WIB.</li>
            </ul>
          </Card>
        </div>
      </div>
    </div>
  );
}
