import { useEffect, useState } from 'react';
import type { FormEvent } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { CheckCircle2, Copy, Check, Search, RotateCcw, ChevronLeft } from 'lucide-react';
import { apiFetch, pcOptions } from '../lib/api';
import type { Lab, Report } from '../lib/api';
import { inputCls, labelCls, btnPrimary, FieldError, Spinner } from '../components/ui';

interface Errors {
  student_name?: string;
  nim?: string;
  lab_id?: string;
  pc_id?: string;
  description?: string;
}

export default function ReportForm() {
  const [params] = useSearchParams();
  const [labs, setLabs] = useState<Lab[]>([]);
  const [loadingLabs, setLoadingLabs] = useState(true);
  const [studentName, setStudentName] = useState('');
  const [nim, setNim] = useState('');
  const [labId, setLabId] = useState(params.get('lab') || '');
  const [pcId, setPcId] = useState('');
  const [description, setDescription] = useState('');
  const [errors, setErrors] = useState<Errors>({});
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState('');
  const [result, setResult] = useState<Report | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    apiFetch<Lab[]>('/api/labs')
      .then(setLabs)
      .catch(() => {})
      .finally(() => setLoadingLabs(false));
  }, []);

  const selectedLab = labs.find((l) => String(l.id) === String(labId));

  const validate = (): boolean => {
    const err: Errors = {};
    if (!studentName.trim()) err.student_name = 'Nama wajib diisi.';
    if (!nim.trim()) err.nim = 'NIM wajib diisi.';
    else if (nim.trim().length < 5) err.nim = 'NIM minimal 5 karakter.';
    if (!labId) err.lab_id = 'Pilih laboratorium.';
    if (!pcId) err.pc_id = 'Pilih nomor PC.';
    if (!description.trim()) err.description = 'Deskripsi kerusakan wajib diisi.';
    else if (description.trim().length < 10) err.description = 'Deskripsi minimal 10 karakter.';
    setErrors(err);
    return Object.keys(err).length === 0;
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setSubmitError('');
    if (!validate()) return;
    setSubmitting(true);
    try {
      const created = await apiFetch<Report>('/api/reports', {
        method: 'POST',
        body: JSON.stringify({
          lab_id: Number(labId),
          pc_id: pcId,
          student_name: studentName.trim(),
          nim: nim.trim(),
          description: description.trim(),
        }),
      });
      setResult(created);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : 'Gagal mengirim laporan');
    } finally {
      setSubmitting(false);
    }
  };

  const resetForm = () => {
    setResult(null);
    setStudentName('');
    setNim('');
    setLabId('');
    setPcId('');
    setDescription('');
    setErrors({});
    setSubmitError('');
    setCopied(false);
  };

  const copyTicket = async () => {
    if (!result) return;
    try {
      await navigator.clipboard.writeText(result.ticket_no);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      setCopied(false);
    }
  };

  // Success view
  if (result) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-10">
        <div className="rounded-lg border border-green-200 bg-white p-8 text-center shadow-sm">
          <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-green-50 text-green-600">
            <CheckCircle2 size={30} />
          </span>
          <h1 className="mt-4 text-xl font-bold text-zinc-900">Laporan Berhasil Dikirim</h1>
          <p className="mt-1 text-sm text-zinc-500">
            Simpan nomor tiket berikut untuk memantau status penanganan laporan Anda.
          </p>
          <div className="mx-auto mt-5 flex max-w-xs items-center justify-between gap-2 rounded-lg border border-zinc-200 bg-zinc-50 px-4 py-3">
            <span className="font-mono text-xl font-bold tracking-wide text-zinc-900">{result.ticket_no}</span>
            <button
              onClick={copyTicket}
              className="rounded-lg border border-zinc-300 bg-white p-2 text-zinc-600 hover:bg-zinc-100"
              aria-label="Salin nomor tiket"
            >
              {copied ? <Check size={16} className="text-green-600" /> : <Copy size={16} />}
            </button>
          </div>
          <div className="mx-auto mt-4 max-w-xs space-y-1.5 text-left text-sm">
            <p className="text-zinc-600">
              <span className="font-medium text-zinc-900">Lab:</span> {result.labs?.code} - {result.labs?.name}
            </p>
            <p className="text-zinc-600">
              <span className="font-medium text-zinc-900">Unit:</span>{' '}
              <span className="font-mono font-semibold">{result.pc_id}</span>
            </p>
            <p className="text-zinc-600">
              <span className="font-medium text-zinc-900">Pelapor:</span> {result.student_name} ({result.nim})
            </p>
          </div>
          <div className="mt-6 flex flex-col justify-center gap-2 sm:flex-row">
            <Link
              to={`/lacak?tiket=${result.ticket_no}`}
              className="inline-flex items-center justify-center gap-2 rounded-lg bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-blue-700"
            >
              <Search size={16} /> Lacak Status
            </Link>
            <button
              onClick={resetForm}
              className="inline-flex items-center justify-center gap-2 rounded-lg border border-zinc-300 bg-white px-5 py-2.5 text-sm font-semibold text-zinc-700 hover:bg-zinc-50"
            >
              <RotateCcw size={16} /> Buat Laporan Baru
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl px-4 py-8">
      <Link to="/" className="inline-flex items-center gap-1 text-sm font-medium text-zinc-600 hover:text-zinc-900">
        <ChevronLeft size={16} /> Kembali ke Beranda
      </Link>
      <div className="mt-4 rounded-lg border border-zinc-200 bg-white p-6 shadow-sm sm:p-8">
        <h1 className="text-xl font-bold text-zinc-900">Formulir Laporan Kerusakan</h1>
        <p className="mt-1 text-sm text-zinc-500">
          Laporkan kerusakan perangkat lab. Nomor tiket akan diterbitkan otomatis setelah laporan dikirim.
        </p>
        {loadingLabs ? (
          <Spinner label="Memuat daftar lab..." />
        ) : (
          <form onSubmit={handleSubmit} className="mt-6 space-y-4" noValidate>
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className={labelCls} htmlFor="nama">Nama Lengkap</label>
                <input
                  id="nama"
                  className={inputCls}
                  placeholder="cth: Ahmad Rizky Pratama"
                  value={studentName}
                  onChange={(e) => setStudentName(e.target.value)}
                />
                <FieldError msg={errors.student_name} />
              </div>
              <div>
                <label className={labelCls} htmlFor="nim">NIM</label>
                <input
                  id="nim"
                  className={`${inputCls} font-mono`}
                  placeholder="cth: 2023014001"
                  value={nim}
                  onChange={(e) => setNim(e.target.value)}
                />
                <FieldError msg={errors.nim} />
              </div>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className={labelCls} htmlFor="lab">Laboratorium</label>
                <select
                  id="lab"
                  className={inputCls}
                  value={labId}
                  onChange={(e) => {
                    setLabId(e.target.value);
                    setPcId('');
                  }}
                >
                  <option value="">-- Pilih Lab --</option>
                  {labs.map((l) => (
                    <option key={l.id} value={l.id}>
                      {l.code} - {l.name}
                    </option>
                  ))}
                </select>
                <FieldError msg={errors.lab_id} />
              </div>
              <div>
                <label className={labelCls} htmlFor="pc">Nomor PC</label>
                <select
                  id="pc"
                  className={`${inputCls} font-mono`}
                  value={pcId}
                  onChange={(e) => setPcId(e.target.value)}
                  disabled={!selectedLab}
                >
                  <option value="">{selectedLab ? '-- Pilih PC --' : 'Pilih lab dulu'}</option>
                  {selectedLab &&
                    pcOptions(selectedLab.total_pc).map((pc) => (
                      <option key={pc} value={pc}>
                        {pc}
                      </option>
                    ))}
                </select>
                <FieldError msg={errors.pc_id} />
              </div>
            </div>
            <div>
              <label className={labelCls} htmlFor="deskripsi">Deskripsi Kerusakan</label>
              <textarea
                id="deskripsi"
                className={`${inputCls} min-h-[110px]`}
                placeholder="Jelaskan kerusakan sedetail mungkin. cth: Monitor PC-12 tidak menampilkan gambar, lampu indikator CPU menyala."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
              />
              <FieldError msg={errors.description} />
            </div>
            {submitError && (
              <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                {submitError}
              </div>
            )}
            <button type="submit" disabled={submitting} className={`${btnPrimary} w-full py-2.5`}>
              {submitting ? 'Mengirim Laporan...' : 'Kirim Laporan'}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
