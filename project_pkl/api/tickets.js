import supabase from './db-client.js';

async function requireAuth(req, res) {
  const token = req.headers.authorization?.replace('Bearer ', '');
  if (!token) {
    res.status(401).json({ error: 'Unauthorized: sesi admin diperlukan.' });
    return null;
  }
  const { data, error } = await supabase.auth.getUser(token);
  if (error || !data?.user) {
    res.status(401).json({ error: 'Sesi tidak valid. Silakan login ulang.' });
    return null;
  }
  return data.user;
}

function genTicketNo() {
  const d = new Date();
  const pad = (n) => String(n).padStart(2, '0');
  const date = `${String(d.getFullYear()).slice(2)}${pad(d.getMonth() + 1)}${pad(d.getDate())}`;
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let s = '';
  for (let i = 0; i < 4; i++) s += chars[Math.floor(Math.random() * chars.length)];
  return `TIK-${date}-${s}`;
}

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  if (req.method === 'OPTIONS') return res.status(204).end();

  try {
    if (req.method === 'GET') {
      const { ticket_no, status, lab_id, q } = req.query;
      let query = supabase.from('tickets').select('*, labs(code, name)').order('created_at', { ascending: false });
      if (ticket_no) query = query.ilike('ticket_no', String(ticket_no).trim());
      if (status) query = query.eq('status', status);
      if (lab_id) query = query.eq('lab_id', Number(lab_id));
      if (q) {
        const safe = String(q).replace(/[,()]/g, '').trim();
        if (safe) query = query.or(`ticket_no.ilike.%${safe}%,reporter_name.ilike.%${safe}%,reporter_nim.ilike.%${safe}%,pc_number.ilike.%${safe}%,description.ilike.%${safe}%`);
      }
      const { data, error } = await query.limit(500);
      if (error) throw error;
      return res.status(200).json(data || []);
    }

    // Laporan baru: terbuka untuk publik (mahasiswa)
    if (req.method === 'POST') {
      const { reporter_name, reporter_nim, lab_id, pc_number, category, description, photo_url } = req.body || {};
      if (!reporter_name || String(reporter_name).trim().length < 3) {
        return res.status(400).json({ error: 'Nama pelapor wajib diisi (minimal 3 karakter).' });
      }
      if (!reporter_nim || !/^[A-Za-z0-9]{5,20}$/.test(String(reporter_nim).trim())) {
        return res.status(400).json({ error: 'NIM/ID tidak valid (5-20 karakter alfanumerik).' });
      }
      if (!lab_id) return res.status(400).json({ error: 'Lab wajib dipilih.' });
      if (!pc_number) return res.status(400).json({ error: 'Nomor PC wajib dipilih.' });
      if (!description || String(description).trim().length < 10) {
        return res.status(400).json({ error: 'Deskripsi kerusakan wajib diisi (minimal 10 karakter).' });
      }
      let ticketNo = '';
      for (let i = 0; i < 5; i++) {
        const candidate = genTicketNo();
        const { data: exists } = await supabase.from('tickets').select('id').eq('ticket_no', candidate).limit(1);
        if (!exists || exists.length === 0) { ticketNo = candidate; break; }
      }
      if (!ticketNo) return res.status(500).json({ error: 'Gagal membuat nomor tiket, silakan coba lagi.' });
      const { data, error } = await supabase
        .from('tickets')
        .insert([{
          ticket_no: ticketNo,
          reporter_name: String(reporter_name).trim(),
          reporter_nim: String(reporter_nim).trim(),
          lab_id: Number(lab_id),
          pc_number: String(pc_number).trim().toUpperCase(),
          category: category || 'Lainnya',
          description: String(description).trim(),
          photo_url: photo_url || null,
          status: 'Diterima',
        }])
        .select('*, labs(code, name)')
        .single();
      if (error) throw error;
      return res.status(201).json(data);
    }

    if (req.method === 'PUT') {
      const user = await requireAuth(req, res);
      if (!user) return;
      const { id, status, technician_note, handled_by, description, category, pc_number, lab_id } = req.body || {};
      if (!id) return res.status(400).json({ error: 'ID laporan wajib disertakan.' });
      if (status && !['Diterima', 'Diproses', 'Selesai'].includes(status)) {
        return res.status(400).json({ error: 'Status tidak valid.' });
      }
      const payload = { updated_at: new Date().toISOString() };
      if (status !== undefined) payload.status = status;
      if (technician_note !== undefined) payload.technician_note = technician_note || null;
      if (handled_by !== undefined) payload.handled_by = handled_by || null;
      if (description !== undefined) payload.description = String(description).trim();
      if (category !== undefined) payload.category = category;
      if (pc_number !== undefined) payload.pc_number = String(pc_number).trim().toUpperCase();
      if (lab_id !== undefined) payload.lab_id = lab_id ? Number(lab_id) : null;
      const { data, error } = await supabase.from('tickets').update(payload).eq('id', id).select('*, labs(code, name)').single();
      if (error) throw error;
      return res.status(200).json(data);
    }

    if (req.method === 'DELETE') {
      const user = await requireAuth(req, res);
      if (!user) return;
      const { id } = req.body || {};
      if (!id) return res.status(400).json({ error: 'ID laporan wajib disertakan.' });
      const { error } = await supabase.from('tickets').delete().eq('id', id);
      if (error) throw error;
      return res.status(200).json({ ok: true });
    }

    return res.status(405).json({ error: 'Method not allowed' });
  } catch (err) {
    console.error('API tickets error:', err);
    return res.status(500).json({ error: err.message || 'Terjadi kesalahan server.' });
  }
}
