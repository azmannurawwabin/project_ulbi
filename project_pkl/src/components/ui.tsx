import { useCallback, useEffect, useRef, useState } from 'react';
import type {
  ButtonHTMLAttributes,
  InputHTMLAttributes,
  ReactNode,
  SelectHTMLAttributes,
  TextareaHTMLAttributes,
} from 'react';
import { AlertTriangle, Check, CheckCircle2, Inbox, Loader2, X } from 'lucide-react';

export function cn(...parts: Array<string | false | null | undefined>): string {
  return parts.filter(Boolean).join(' ');
}

/* ---------------- Tombol ---------------- */
type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: 'primary' | 'dark' | 'secondary' | 'ghost' | 'danger';
  size?: 'sm' | 'md';
  loading?: boolean;
};

export function Button({ variant = 'secondary', size = 'md', loading = false, className, children, disabled, ...rest }: ButtonProps) {
  const base =
    'inline-flex items-center justify-center gap-2 rounded-md border font-medium transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 focus-visible:ring-offset-1 disabled:pointer-events-none disabled:opacity-50 whitespace-nowrap';
  const sizes = { sm: 'h-8 px-3 text-[13px]', md: 'h-9 px-4 text-sm' };
  const variants = {
    primary: 'border-blue-600 bg-blue-600 text-white hover:bg-blue-700',
    dark: 'border-slate-900 bg-slate-900 text-white hover:bg-slate-800',
    secondary: 'border-slate-300 bg-white text-slate-700 hover:border-slate-400 hover:bg-slate-50',
    ghost: 'border-transparent bg-transparent text-slate-600 hover:bg-slate-100 hover:text-slate-900',
    danger: 'border-slate-300 bg-white text-red-600 hover:border-red-300 hover:bg-red-50',
  };
  return (
    <button className={cn(base, sizes[size], variants[variant], className)} disabled={disabled || loading} {...rest}>
      {loading && <Loader2 className="h-4 w-4 animate-spin" />}
      {children}
    </button>
  );
}

/* ---------------- Badge status ---------------- */
type Tone = 'emerald' | 'blue' | 'amber' | 'red' | 'slate' | 'navy';
const badgeTones: Record<Tone, string> = {
  emerald: 'border-emerald-200 bg-emerald-50 text-emerald-700',
  blue: 'border-blue-200 bg-blue-50 text-blue-700',
  amber: 'border-amber-200 bg-amber-50 text-amber-700',
  red: 'border-red-200 bg-red-50 text-red-700',
  slate: 'border-slate-200 bg-slate-100 text-slate-600',
  navy: 'border-slate-900 bg-slate-900 text-white',
};
const dotTones: Record<Tone, string> = {
  emerald: 'bg-emerald-500',
  blue: 'bg-blue-500',
  amber: 'bg-amber-500',
  red: 'bg-red-500',
  slate: 'bg-slate-400',
  navy: 'bg-white',
};

export function Badge({ tone = 'slate', children, dot = true, className }: { tone?: Tone; children: ReactNode; dot?: boolean; className?: string }) {
  return (
    <span className={cn('inline-flex items-center gap-1.5 rounded border px-2 py-0.5 text-xs font-medium leading-4', badgeTones[tone], className)}>
      {dot && <span className={cn('h-1.5 w-1.5 rounded-full', dotTones[tone])} />}
      {children}
    </span>
  );
}

export function TicketStatusBadge({ status }: { status: string }) {
  const tone: Tone = status === 'Selesai' ? 'emerald' : status === 'Diproses' ? 'blue' : status === 'Diterima' ? 'amber' : 'slate';
  return <Badge tone={tone}>{status}</Badge>;
}

export function UnitStatusBadge({ status }: { status: string }) {
  const tone: Tone = status === 'Aktif' ? 'emerald' : status === 'Perbaikan' ? 'amber' : status === 'Rusak' ? 'red' : 'slate';
  return <Badge tone={tone}>{status}</Badge>;
}

export function LabStatusBadge({ status }: { status: string }) {
  const tone: Tone = status === 'Aktif' ? 'emerald' : status === 'Pemeliharaan' ? 'amber' : 'slate';
  return <Badge tone={tone}>{status}</Badge>;
}

/* ---------------- Form ---------------- */
const inputCls =
  'block w-full rounded-md border border-slate-300 bg-white px-3 text-sm text-slate-900 placeholder:text-slate-400 focus:border-blue-600 focus:outline-none focus:ring-1 focus:ring-blue-600 disabled:bg-slate-50 disabled:text-slate-500';

export function Input({ className, ...rest }: InputHTMLAttributes<HTMLInputElement>) {
  return <input className={cn(inputCls, 'h-9', className)} {...rest} />;
}

export function Textarea({ className, ...rest }: TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return <textarea className={cn(inputCls, 'py-2 leading-5', className)} {...rest} />;
}

export function Select({ className, children, ...rest }: SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <select className={cn(inputCls, 'h-9 pr-8', className)} {...rest}>
      {children}
    </select>
  );
}

export function Field({ label, required, error, hint, children }: { label: string; required?: boolean; error?: string | null; hint?: string; children: ReactNode }) {
  return (
    <div>
      <label className="mb-1.5 block text-[13px] font-medium text-slate-700">
        {label} {required && <span className="text-red-600">*</span>}
      </label>
      {children}
      {hint && !error && <p className="mt-1 text-xs text-slate-500">{hint}</p>}
      {error && <p className="mt-1 text-xs text-red-600">{error}</p>}
    </div>
  );
}

/* ---------------- Kartu & layout ---------------- */
export function Card({ className, children }: { className?: string; children: ReactNode }) {
  return <div className={cn('rounded-md border border-slate-200 bg-white', className)}>{children}</div>;
}

export function PageHeader({ title, description, actions }: { title: string; description?: string; actions?: ReactNode }) {
  return (
    <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
      <div>
        <h1 className="text-xl font-semibold tracking-tight text-slate-900 sm:text-2xl">{title}</h1>
        {description && <p className="mt-1 max-w-2xl text-sm text-slate-500">{description}</p>}
      </div>
      {actions && <div className="flex shrink-0 items-center gap-2">{actions}</div>}
    </div>
  );
}

export function SectionTitle({ title, description, action }: { title: string; description?: string; action?: ReactNode }) {
  return (
    <div className="mb-3 flex items-start justify-between gap-3">
      <div>
        <h2 className="text-[15px] font-semibold tracking-tight text-slate-900">{title}</h2>
        {description && <p className="mt-0.5 text-[13px] text-slate-500">{description}</p>}
      </div>
      {action}
    </div>
  );
}

export function StatCard({ label, value, sub, icon }: { label: string; value: string | number; sub?: string; icon?: ReactNode }) {
  return (
    <div className="rounded-md border border-slate-200 bg-white p-4">
      <div className="flex items-center justify-between gap-2">
        <p className="text-[13px] font-medium text-slate-500">{label}</p>
        {icon}
      </div>
      <p className="mt-1 font-mono text-[26px] font-semibold leading-8 text-slate-900">{value}</p>
      {sub && <p className="mt-0.5 truncate text-xs text-slate-500">{sub}</p>}
    </div>
  );
}

/* ---------------- Tabel ---------------- */
export const thCls = 'border-b border-slate-200 bg-slate-50 px-4 py-2.5 text-left text-xs font-semibold uppercase tracking-wider text-slate-500 whitespace-nowrap';
export const tdCls = 'px-4 py-3 align-middle text-sm text-slate-700';
export function TableWrap({ children, minWidth = 640 }: { children: ReactNode; minWidth?: number }) {
  return (
    <div className="scroll-thin overflow-x-auto rounded-md border border-slate-200 bg-white">
      <table className="w-full border-collapse text-left" style={{ minWidth }}>
        {children}
      </table>
    </div>
  );
}

/* ---------------- Modal ---------------- */
export function Modal({ open, onClose, title, subtitle, children, wide }: { open: boolean; onClose: () => void; title: string; subtitle?: string; children: ReactNode; wide?: boolean }) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', onKey);
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = '';
    };
  }, [open, onClose]);
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto p-4 sm:p-6" role="dialog" aria-modal="true">
      <div className="fixed inset-0 bg-slate-900/50" onClick={onClose} />
      <div className={cn('relative my-4 w-full rounded-md border border-slate-200 bg-white shadow-xl', wide ? 'max-w-3xl' : 'max-w-lg')}>
        <div className="flex items-start justify-between gap-4 border-b border-slate-200 px-5 py-4">
          <div className="min-w-0">
            <h3 className="truncate text-[15px] font-semibold text-slate-900">{title}</h3>
            {subtitle && <p className="mt-0.5 text-[13px] text-slate-500">{subtitle}</p>}
          </div>
          <button onClick={onClose} className="rounded p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-700" aria-label="Tutup">
            <X className="h-4 w-4" />
          </button>
        </div>
        <div className="px-5 py-4">{children}</div>
      </div>
    </div>
  );
}

export function ConfirmDialog({ open, title, message, confirmLabel = 'Hapus', onConfirm, onClose, loading }: { open: boolean; title: string; message: string; confirmLabel?: string; onConfirm: () => void; onClose: () => void; loading?: boolean }) {
  return (
    <Modal open={open} onClose={onClose} title={title}>
      <p className="text-sm leading-6 text-slate-600">{message}</p>
      <div className="mt-5 flex justify-end gap-2">
        <Button onClick={onClose}>Batal</Button>
        <Button variant="danger" loading={loading} onClick={onConfirm} className="border-red-600 bg-red-600 text-white hover:bg-red-700">
          {confirmLabel}
        </Button>
      </div>
    </Modal>
  );
}

/* ---------------- Status & umpan balik ---------------- */
export function Spinner({ label }: { label?: string }) {
  return (
    <div className="flex items-center justify-center gap-2.5 py-10 text-sm text-slate-500">
      <Loader2 className="h-5 w-5 animate-spin text-slate-400" />
      {label || 'Memuat...'}
    </div>
  );
}

export function EmptyState({ title, description, action }: { title: string; description?: string; action?: ReactNode }) {
  return (
    <div className="rounded-md border border-dashed border-slate-300 bg-white px-6 py-10 text-center">
      <Inbox className="mx-auto h-7 w-7 text-slate-300" />
      <p className="mt-3 text-sm font-medium text-slate-700">{title}</p>
      {description && <p className="mx-auto mt-1 max-w-sm text-[13px] text-slate-500">{description}</p>}
      {action && <div className="mt-4 flex justify-center">{action}</div>}
    </div>
  );
}

export type FlashMsg = { type: 'success' | 'error'; text: string } | null;

export function useFlash(): [FlashMsg, (type: 'success' | 'error', text: string) => void] {
  const [flash, setFlash] = useState<FlashMsg>(null);
  const timer = useRef<number | null>(null);
  const show = useCallback((type: 'success' | 'error', text: string) => {
    setFlash({ type, text });
    if (timer.current) window.clearTimeout(timer.current);
    timer.current = window.setTimeout(() => setFlash(null), 4500);
  }, []);
  useEffect(() => () => {
    if (timer.current) window.clearTimeout(timer.current);
  }, []);
  return [flash, show];
}

export function FlashBanner({ flash }: { flash: FlashMsg }) {
  if (!flash) return null;
  const ok = flash.type === 'success';
  return (
    <div className={cn('flex items-start gap-2.5 rounded-md border px-3.5 py-3 text-sm', ok ? 'border-emerald-200 bg-emerald-50 text-emerald-800' : 'border-red-200 bg-red-50 text-red-800')}>
      {ok ? <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" /> : <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />}
      <span>{flash.text}</span>
    </div>
  );
}

/* ---------------- Pipeline status tiket ---------------- */
const PIPE = ['Diterima', 'Diproses', 'Selesai'];
export function TicketPipeline({ status }: { status: string }) {
  const current = PIPE.indexOf(status);
  return (
    <div className="flex items-center">
      {PIPE.map((s, i) => {
        const done = current >= 0 && i < current;
        const active = i === current;
        return (
          <div key={s} className={cn('flex items-center', i < PIPE.length - 1 && 'flex-1')}>
            <div className="flex items-center gap-2">
              <span
                className={cn(
                  'flex h-6 w-6 items-center justify-center rounded-full border text-[11px] font-semibold',
                  done ? 'border-blue-600 bg-blue-600 text-white' : active ? 'border-blue-600 bg-white text-blue-700 ring-2 ring-blue-100' : 'border-slate-300 bg-white text-slate-400',
                )}
              >
                {done ? <Check className="h-3.5 w-3.5" /> : i + 1}
              </span>
              <span className={cn('text-[13px] font-medium', done || active ? 'text-slate-900' : 'text-slate-400')}>{s}</span>
            </div>
            {i < PIPE.length - 1 && <div className={cn('mx-3 h-px flex-1', current >= 0 && i < current ? 'bg-blue-600' : 'bg-slate-200')} />}
          </div>
        );
      })}
    </div>
  );
}
