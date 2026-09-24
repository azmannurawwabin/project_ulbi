import type { ReactNode } from 'react';
import { X, Inbox, Loader2 } from 'lucide-react';
import { STATUS_LABEL, PC_STATUS_LABEL } from '../lib/api';

export const inputCls =
  'w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 placeholder-zinc-400 focus:border-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-600/20';
export const btnPrimary =
  'inline-flex items-center justify-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50';
export const btnSecondary =
  'inline-flex items-center justify-center gap-2 rounded-lg border border-zinc-300 bg-white px-4 py-2 text-sm font-semibold text-zinc-700 transition-colors hover:bg-zinc-50';
export const btnDanger =
  'inline-flex items-center justify-center gap-2 rounded-lg bg-red-600 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-50';
export const labelCls = 'mb-1 block text-sm font-medium text-zinc-700';
export const thCls = 'px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-zinc-500';
export const tdCls = 'px-4 py-3 text-sm text-zinc-700';

export function StatusBadge({ status }: { status: string }) {
  const map: Record<string, string> = {
    diterima: 'bg-yellow-50 text-yellow-700 border-yellow-200',
    diproses: 'bg-blue-50 text-blue-700 border-blue-200',
    selesai: 'bg-green-50 text-green-700 border-green-200',
  };
  return (
    <span
      className={`inline-flex items-center rounded-md border px-2 py-0.5 text-xs font-semibold ${
        map[status] || 'bg-zinc-50 text-zinc-700 border-zinc-200'
      }`}
    >
      {STATUS_LABEL[status] || status}
    </span>
  );
}

export function PcStatusBadge({ status }: { status: string }) {
  const map: Record<string, string> = {
    baik: 'bg-green-50 text-green-700 border-green-200',
    perawatan: 'bg-yellow-50 text-yellow-700 border-yellow-200',
    rusak: 'bg-red-50 text-red-700 border-red-200',
  };
  return (
    <span
      className={`inline-flex items-center rounded-md border px-2 py-0.5 text-xs font-semibold ${
        map[status] || 'bg-zinc-50 text-zinc-700 border-zinc-200'
      }`}
    >
      {PC_STATUS_LABEL[status] || status}
    </span>
  );
}

export function Spinner({ label }: { label?: string }) {
  return (
    <div className="flex flex-col items-center justify-center gap-2 py-10 text-zinc-500">
      <Loader2 className="animate-spin" size={28} />
      {label && <p className="text-sm">{label}</p>}
    </div>
  );
}

export function EmptyState({ title, desc }: { title: string; desc?: string }) {
  return (
    <div className="flex flex-col items-center justify-center gap-2 rounded-lg border border-dashed border-zinc-300 bg-zinc-50 px-4 py-10 text-center">
      <Inbox size={28} className="text-zinc-400" />
      <p className="text-sm font-semibold text-zinc-700">{title}</p>
      {desc && <p className="text-sm text-zinc-500">{desc}</p>}
    </div>
  );
}

export function FieldError({ msg }: { msg?: string }) {
  if (!msg) return null;
  return <p className="mt-1 text-xs text-red-600">{msg}</p>;
}

export function ErrorBanner({ message, onRetry }: { message: string; onRetry?: () => void }) {
  return (
    <div className="flex flex-col gap-2 rounded-lg border border-red-200 bg-red-50 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
      <p className="text-sm text-red-700">{message}</p>
      {onRetry && (
        <button onClick={onRetry} className="shrink-0 rounded-lg border border-red-200 bg-white px-3 py-1.5 text-xs font-semibold text-red-700 hover:bg-red-100">
          Coba Lagi
        </button>
      )}
    </div>
  );
}

export function Modal({
  title,
  onClose,
  children,
  wide,
}: {
  title: string;
  onClose: () => void;
  children: ReactNode;
  wide?: boolean;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-zinc-950/50" onClick={onClose} />
      <div
        className={`relative max-h-[90vh] w-full overflow-y-auto rounded-lg border border-zinc-200 bg-white shadow-sm ${
          wide ? 'max-w-3xl' : 'max-w-lg'
        }`}
      >
        <div className="sticky top-0 flex items-center justify-between border-b border-zinc-200 bg-white px-5 py-4">
          <h3 className="text-base font-semibold text-zinc-900">{title}</h3>
          <button onClick={onClose} className="rounded p-1 text-zinc-500 hover:bg-zinc-100" aria-label="Tutup">
            <X size={18} />
          </button>
        </div>
        <div className="px-5 py-4">{children}</div>
      </div>
    </div>
  );
}
