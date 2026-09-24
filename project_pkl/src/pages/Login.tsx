import { useState } from 'react';
import type { FormEvent } from 'react';
import { Link, Navigate, useNavigate } from 'react-router-dom';
import { Monitor, ChevronLeft, LogIn, Info } from 'lucide-react';
import supabase from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { inputCls, labelCls, btnPrimary, FieldError } from '../components/ui';

export default function Login() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [fieldError, setFieldError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  if (!loading && user) return <Navigate to="/admin" replace />;

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    setFieldError('');
    if (!email.trim() || !password) {
      setFieldError('Email dan password wajib diisi.');
      return;
    }
    setSubmitting(true);
    try {
      const { error: err } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password,
      });
      if (err) throw err;
      navigate('/admin');
    } catch {
      setError('Login gagal. Periksa kembali email dan password Anda.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-zinc-50 px-4 font-sans">
      <div className="w-full max-w-md">
        <Link
          to="/"
          className="inline-flex items-center gap-1 text-sm font-medium text-zinc-600 hover:text-zinc-900"
        >
          <ChevronLeft size={16} /> Kembali ke Beranda
        </Link>
        <div className="mt-4 rounded-lg border border-zinc-200 bg-white p-8 shadow-sm">
          <div className="flex flex-col items-center text-center">
            <span className="flex h-12 w-12 items-center justify-center rounded-lg bg-blue-600 text-white">
              <Monitor size={24} />
            </span>
            <h1 className="mt-3 text-xl font-bold text-zinc-900">Login Admin TIK</h1>
            <p className="mt-1 text-sm text-zinc-500">
              Masuk untuk mengelola lab, hardware, jadwal, dan laporan.
            </p>
          </div>
          <form onSubmit={handleSubmit} className="mt-6 space-y-4" noValidate>
            <div>
              <label className={labelCls} htmlFor="email">Email</label>
              <input
                id="email"
                type="email"
                className={inputCls}
                placeholder="admin@tik.ac.id"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                autoComplete="email"
              />
            </div>
            <div>
              <label className={labelCls} htmlFor="password">Password</label>
              <input
                id="password"
                type="password"
                className={inputCls}
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete="current-password"
              />
            </div>
            <FieldError msg={fieldError} />
            {error && (
              <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                {error}
              </div>
            )}
            <button type="submit" disabled={submitting} className={`${btnPrimary} w-full py-2.5`}>
              <LogIn size={16} /> {submitting ? 'Memeriksa...' : 'Masuk Dashboard'}
            </button>
          </form>
          <div className="mt-5 flex gap-2 rounded-lg border border-blue-200 bg-blue-50 p-3">
            <Info size={16} className="mt-0.5 shrink-0 text-blue-600" />
            <p className="text-xs text-blue-800">
              Akun demo: <span className="font-mono font-semibold">admin@tik.ac.id</span> /{' '}
              <span className="font-mono font-semibold">admin123</span>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
