// Tipe data & helper pemanggilan API backend (/api/*).
// Seluruh data aplikasi diambil dari sini — tidak ada mock/hardcoded data.

export interface Lab {
  id: number;
  code: string;
  name: string;
  location: string | null;
  capacity: number | null;
  status: string;
  description: string | null;
  created_at: string;
  pc_total: number;
  pc_active: number;
  pc_damaged: number;
  tickets_open: number;
}

export interface PcUnit {
  id: number;
  lab_id: number;
  pc_number: string;
  status: string;
  processor: string;
  ram: string;
  storage: string;
  gpu: string;
  monitor: string;
  os: string;
  notes: string | null;
  created_at: string;
  labs?: { code: string; name: string } | null;
}

export interface Schedule {
  id: number;
  lab_id: number;
  course_code: string | null;
  course_name: string;
  lecturer: string | null;
  day: string;
  start_time: string;
  end_time: string;
  class_group: string | null;
  semester: string | null;
  created_at: string;
  labs?: { code: string; name: string } | null;
}

export interface Ticket {
  id: number;
  ticket_no: string;
  reporter_name: string;
  reporter_nim: string;
  lab_id: number | null;
  pc_number: string;
  category: string;
  description: string;
  photo_url: string | null;
  status: string;
  technician_note: string | null;
  handled_by: string | null;
  created_at: string;
  updated_at: string;
  labs?: { code: string; name: string } | null;
}

export const DAY_ORDER = ['Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu', 'Minggu'];
export const TICKET_STATUSES = ['Diterima', 'Diproses', 'Selesai'];
export const UNIT_STATUSES = ['Aktif', 'Perbaikan', 'Rusak', 'Nonaktif'];
export const LAB_STATUSES = ['Aktif', 'Pemeliharaan', 'Nonaktif'];
export const TICKET_CATEGORIES = ['Hardware', 'Software', 'Jaringan', 'Periferal', 'Lainnya'];

async function request<T>(path: string, options: RequestInit = {}, token?: string | null): Promise<T> {
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  if (options.headers) {
    const h = options.headers as Record<string, string>;
    for (const k of Object.keys(h)) headers[k] = h[k];
  }
  if (token) headers['Authorization'] = `Bearer ${token}`;
  const res = await fetch(path, { ...options, headers });
  const data = (await res.json().catch(() => ({}))) as unknown;
  if (!res.ok) {
    const msg = (data as { error?: string })?.error || `Permintaan gagal (kode ${res.status})`;
    throw new Error(msg);
  }
  return data as T;
}

export interface TicketFilter {
  ticket_no?: string;
  status?: string;
  lab_id?: string | number;
  q?: string;
}

export const api = {
  labs: {
    list: () => request<Lab[]>('/api/labs'),
    get: (id: string | number) => request<Lab>(`/api/labs?id=${id}`),
    create: (payload: Record<string, unknown>, token: string) =>
      request<Lab>('/api/labs', { method: 'POST', body: JSON.stringify(payload) }, token),
    update: (payload: Record<string, unknown>, token: string) =>
      request<Lab>('/api/labs', { method: 'PUT', body: JSON.stringify(payload) }, token),
    remove: (id: number, token: string) =>
      request<{ ok: boolean }>('/api/labs', { method: 'DELETE', body: JSON.stringify({ id }) }, token),
  },
  units: {
    list: (labId?: string | number) =>
      request<PcUnit[]>(labId ? `/api/pc-units?lab_id=${labId}` : '/api/pc-units'),
    create: (payload: Record<string, unknown>, token: string) =>
      request<PcUnit>('/api/pc-units', { method: 'POST', body: JSON.stringify(payload) }, token),
    bulkCreate: (units: Array<Record<string, unknown>>, token: string) =>
      request<{ created: PcUnit[]; skipped: number }>('/api/pc-units', { method: 'POST', body: JSON.stringify({ units }) }, token),
    update: (payload: Record<string, unknown>, token: string) =>
      request<PcUnit>('/api/pc-units', { method: 'PUT', body: JSON.stringify(payload) }, token),
    remove: (id: number, token: string) =>
      request<{ ok: boolean }>('/api/pc-units', { method: 'DELETE', body: JSON.stringify({ id }) }, token),
  },
  schedules: {
    list: (labId?: string | number) =>
      request<Schedule[]>(labId ? `/api/schedules?lab_id=${labId}` : '/api/schedules'),
    create: (payload: Record<string, unknown>, token: string) =>
      request<Schedule>('/api/schedules', { method: 'POST', body: JSON.stringify(payload) }, token),
    update: (payload: Record<string, unknown>, token: string) =>
      request<Schedule>('/api/schedules', { method: 'PUT', body: JSON.stringify(payload) }, token),
    remove: (id: number, token: string) =>
      request<{ ok: boolean }>('/api/schedules', { method: 'DELETE', body: JSON.stringify({ id }) }, token),
  },
  tickets: {
    list: (f: TicketFilter = {}) => {
      const p = new URLSearchParams();
      if (f.ticket_no) p.set('ticket_no', f.ticket_no);
      if (f.status) p.set('status', f.status);
      if (f.lab_id) p.set('lab_id', String(f.lab_id));
      if (f.q) p.set('q', f.q);
      const qs = p.toString();
      return request<Ticket[]>(qs ? `/api/tickets?${qs}` : '/api/tickets');
    },
    getByNo: async (ticketNo: string) => {
      const rows = await request<Ticket[]>(`/api/tickets?ticket_no=${encodeURIComponent(ticketNo)}`);
      return rows[0] ?? null;
    },
    create: (payload: Record<string, unknown>) =>
      request<Ticket>('/api/tickets', { method: 'POST', body: JSON.stringify(payload) }),
    update: (payload: Record<string, unknown>, token: string) =>
      request<Ticket>('/api/tickets', { method: 'PUT', body: JSON.stringify(payload) }, token),
    remove: (id: number, token: string) =>
      request<{ ok: boolean }>('/api/tickets', { method: 'DELETE', body: JSON.stringify({ id }) }, token),
  },
  uploadPhoto: (file: File): Promise<string> =>
    new Promise((resolve, reject) => {
      if (!file.type.startsWith('image/')) {
        reject(new Error('File harus berupa gambar (JPG/PNG).'));
        return;
      }
      if (file.size > 2.5 * 1024 * 1024) {
        reject(new Error('Ukuran foto maksimal 2,5 MB.'));
        return;
      }
      const reader = new FileReader();
      reader.onload = async () => {
        try {
          const base64 = String(reader.result).split(',')[1];
          const data = await request<{ url: string }>('/api/upload', {
            method: 'POST',
            body: JSON.stringify({ fileName: file.name, fileBase64: base64, contentType: file.type }),
          });
          resolve(data.url);
        } catch (e) {
          reject(e);
        }
      };
      reader.onerror = () => reject(new Error('Gagal membaca file foto.'));
      reader.readAsDataURL(file);
    }),
};

export function formatDateTime(iso: string): string {
  try {
    return new Intl.DateTimeFormat('id-ID', {
      day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit',
    }).format(new Date(iso));
  } catch {
    return iso;
  }
}

export function formatDate(iso: string): string {
  try {
    return new Intl.DateTimeFormat('id-ID', { day: '2-digit', month: 'short', year: 'numeric' }).format(new Date(iso));
  } catch {
    return iso;
  }
}

export function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  if (Number.isNaN(diff)) return '-';
  const mnt = Math.floor(diff / 60000);
  if (mnt < 1) return 'baru saja';
  if (mnt < 60) return `${mnt} mnt lalu`;
  const jam = Math.floor(mnt / 60);
  if (jam < 24) return `${jam} jam lalu`;
  const hari = Math.floor(jam / 24);
  if (hari < 7) return `${hari} hari lalu`;
  const mgg = Math.floor(hari / 7);
  if (mgg < 5) return `${mgg} mgg lalu`;
  return formatDate(iso);
}
