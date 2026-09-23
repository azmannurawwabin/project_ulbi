import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { AlertTriangle, ArrowLeft, Loader2, Monitor } from 'lucide-react';
import supabase from '../lib/supabase';
import { signInWithGoogle } from '../lib/googleAuth';
import { useAuth } from '../contexts/AuthContext';
import { Button, Field, Input, cn } from '../components/ui';

function GoogleIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-4 w-4" aria-hidden="true">
      <path fill="#4285F4" d="M23.5 12.3c0-.9-.1-1.5-.3-2.3H12v4.5h6.5c-.1 1.1-.8 2.7-2.4 3.8l3.6 2.8c2.2-2 3.8-5 3.8-8.8z" />
      <path fill="#34A853" d="M12 24c3.2 0 6-1.1 7.9-2.9l-3.8-2.9c-1 .7-2.4 1.2-4.1 1.2-3.2 0-5.9-2.1-6.8-5l-3.7 2.9C3.5 21.3 7.5 24 12 24z" />
      <path fill="#FBBC05" d="M5.2 14.4c-.2-.7-.4-1.5-.4-2.4s.1-1.7.4-2.4L1.4 6.6C.5 8.9 0 10.4 0 12s.5 3.1 1.4 4.4l3.8-2z" />
      <path fill="#EA4335" d="M12 4.7c1.8 0 3 .8 3.7 1.4l3.3-3.2C17.9 1.1 15.2 0 12 0 7.5 0 3.5 2.7 1.4 6.6l3.8 2.8c.9-2.9 3.6-4.7 6.8-4.7z" />
    </svg>
  );
}

export default function AdminLogin() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const [mode, setMode] = useState<'in' | 'up'>('in');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);

  useEffect(() => {
    document.title = 'Login Admin — SIMLAB-TIK';
    if (!loading && user) navigate('/admin', { replace: true });
  }, [loading, user, navigate]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setInfo(null);
    if (!email.trim() || !password) {
      setError('Email dan kata sandi wajib diisi.');
      return;
    }
    setBusy(true);
    try {
      if (mode === 'in') {
        const { error } = await supabase.auth.signInWithPassword({ email: email.trim(), password });
        if (error) throw error;
        navigate('/admin', { replace: true });
      } else {
        const { error } = await supabase.auth.signUp({ email: email.trim(), password });
        if (error) throw error;
        setInfo('Akun berhasil dibuat. Silakan masuk dengan kredensial Anda.');
        setMode('in');
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Autentikasi gagal.';
      setError(msg.includes('Invalid login') ? 'Email atau kata sandi salah.' : msg);
    } finally {
      setBusy(false);
    }
  };

  const fillDemo = () => {
    setEmail('admin@tik.ac.id');
    setPassword('admin123');
    setMode('in');
    setError(null);
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50">
        <Loader2 className="h-6 w-6 animate-spin text-slate-400" />
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50 px-4 py-10">
      <div className="w-full max-w-sm">
        <div className="rounded-md border border-slate-200 bg-white p-6 sm:p-8">
          <div className="flex flex-col items-center text-center">
            <span className="flex h-11 w-11 items-center justify-center rounded-md bg-slate-900">
              <Monitor className="h-6 w-6 text-white" />
            </span>
            <h1 className="mt-4 text-lg font-semibold tracking-tight text-slate-900">Panel Admin TIK</h1>
            <p className="mt-1 text-[13px] text-slate-500">Khusus petugas TIK & mahasiswa PKL pengelola lab.</p>
          </div>

          <div className="mt-6 grid grid-cols-2 gap-1 rounded-md border border-slate-200 bg-slate-50 p-1">
            <button type="button" onClick={() => { setMode('in'); setError(null); setInfo(null); }} className={cn('h-8 rounded text-sm font-medium', mode === 'in' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700')}>Masuk</button>
            <button type="button" onClick={() => { setMode('up'); setError(null); setInfo(null); }} className={cn('h-8 rounded text-sm font-medium', mode === 'up' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700')}>Daftar</button>
          </div>

          {error && (
            <div className="mt-4 flex items-start gap-2 rounded-md border border-red-200 bg-red-50 px-3 py-2.5 text-[13px] text-red-700">
              <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" /> {error}
            </div>
          )}
          {info && (
            <div className="mt-4 rounded-md border border-emerald-200 bg-emerald-50 px-3 py-2.5 text-[13px] text-emerald-800">{info}</div>
          )}

          <form onSubmit={submit} className="mt-4 space-y-4">
            <Field label="Email" required>
              <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="nama@tik.ac.id" autoComplete="email" />
            </Field>
            <Field label="Kata Sandi" required>
              <Input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" autoComplete={mode === 'in' ? 'current-password' : 'new-password'} />
            </Field>
            <Button type="submit" variant="dark" loading={busy} className="w-full">
              {mode === 'in' ? 'Masuk ke Dashboard' : 'Buat Akun Admin'}
            </Button>
          </form>

          <div className="my-5 flex items-center gap-3 text-xs text-slate-400">
            <span className="h-px flex-1 bg-slate-200" /> atau <span className="h-px flex-1 bg-slate-200" />
          </div>

          <Button className="w-full" onClick={() => signInWithGoogle('SIMLAB-TIK')}>
            <GoogleIcon /> Masuk dengan Google
          </Button>

          <div className="mt-5 rounded-md border border-slate-200 bg-slate-50 p-3">
            <div className="flex items-center justify-between gap-2">
              <p className="text-xs font-medium text-slate-600">Akun demo</p>
              <button type="button" onClick={fillDemo} className="text-xs font-medium text-blue-700 hover:underline">Isi otomatis</button>
            </div>
            <p className="mt-1.5 font-mono text-xs text-slate-600">admin@tik.ac.id</p>
            <p className="font-mono text-xs text-slate-600">admin123</p>
          </div>
        </div>
        <div className="mt-4 text-center">
          <Link to="/" className="inline-flex items-center gap-1.5 text-[13px] font-medium text-slate-500 hover:text-slate-900">
            <ArrowLeft className="h-4 w-4" /> Kembali ke situs publik
          </Link>
        </div>
      </div>
    </div>
  );
}
