import supabase from './supabase';

export interface Lab {
  id: number;
  code: string;
  name: string;
  floor: string | null;
  total_pc: number;
  description: string | null;
  status: string;
  created_at: string;
}

export interface PcSpec {
  id: number;
  lab_id: number;
  pc_id: string;
  processor: string | null;
  ram: string | null;
  storage: string | null;
  gpu: string | null;
  monitor: string | null;
  os: string | null;
  status: string;
}

export interface Schedule {
  id: number;
  lab_id: number;
  course_name: string;
  lecturer_name: string | null;
  day: string;
  start_time: string;
  end_time: string;
  semester: string | null;
  labs?: { code: string; name: string } | null;
}

export interface Report {
  id: number;
  ticket_no: string;
  lab_id: number | null;
  pc_id: string;
  student_name: string;
  nim: string;
  description: string;
  photo_url: string | null;
  status: string;
  technician_note: string | null;
  created_at: string;
  updated_at: string;
  labs?: { code: string; name: string } | null;
}

export interface Stats {
  totalLabs: number;
  totalPc: number;
  totalReports: number;
  byStatus: { diterima: number; diproses: number; selesai: number };
  perLab: { lab_id: number; open: number; total: number }[];
  pcHealth: { baik: number; perawatan: number; rusak: number };
  recent: Report[];
}

export const DAYS = ['Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];

export const STATUS_LABEL: Record<string, string> = {
  diterima: 'Diterima',
  diproses: 'Diproses',
  selesai: 'Selesai',
};

export const PC_STATUS_LABEL: Record<string, string> = {
  baik: 'Baik',
  perawatan: 'Perawatan',
  rusak: 'Rusak',
};

export function todayDayName(): string {
  return ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'][new Date().getDay()];
}

export function formatDateTime(iso: string): string {
  return new Date(iso).toLocaleString('id-ID', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function pcOptions(total: number): string[] {
  return Array.from({ length: total }, (_, i) => `PC-${String(i + 1).padStart(2, '0')}`);
}

export async function apiFetch<T = unknown>(path: string, options?: RequestInit): Promise<T> {
  const {
    data: { session },
  } = await supabase.auth.getSession();
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...((options?.headers as Record<string, string> | undefined) || {}),
  };
  if (session?.access_token) headers['Authorization'] = `Bearer ${session.access_token}`;
  const res = await fetch(path, { ...options, headers });
  let data: unknown = null;
  try {
    data = await res.json();
  } catch {
    data = null;
  }
  if (!res.ok) {
    const msg = (data as { error?: string } | null)?.error || `Permintaan gagal (${res.status})`;
    throw new Error(msg);
  }
  return data as T;
}
