import supabase from './db-client.js';

async function requireUser(req, res) {
  const token = req.headers.authorization?.replace('Bearer ', '');
  if (!token) {
    res.status(401).json({ error: 'Unauthorized - silakan login' });
    return null;
  }
  const { data, error } = await supabase.auth.getUser(token);
  if (error || !data?.user) {
    res.status(401).json({ error: 'Sesi tidak valid, silakan login ulang' });
    return null;
  }
  return data.user;
}

function genTicket() {
  return 'TIK-' + String(Math.floor(100000 + Math.random() * 900000));
}

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  if (req.method === 'OPTIONS') return res.status(204).end();

  try {
    if (req.method === 'GET') {
      const { ticket, status, lab_id } = req.query;
      let q = supabase.from('reports').select('*, labs(code,name)').order('created_at', { ascending: false });
      if (ticket) q = q.ilike('ticket_no', String(ticket).trim());
      if (status) q = q.eq('status', status);
      if (lab_id) q = q.eq('lab_id', lab_id);
      const { data, error } = await q;
      if (error) throw error;
      return res.status(200).json(data);
    }
    // POST publik: mahasiswa melapor tanpa login
    if (req.method === 'POST') {
      const { lab_id, pc_id, student_name, nim, description, photo_url } = req.body || {};
      if (!lab_id || !pc_id || !student_name || !nim || !description) {
        return res.status(400).json({ error: 'Semua field wajib diisi' });
      }
      if (String(description).trim().length < 10) {
        return res.status(400).json({ error: 'Deskripsi kerusakan minimal 10 karakter' });
      }
      let ticket_no = genTicket();
      for (let i = 0; i < 5; i++) {
        const { data: exists } = await supabase.from('reports').select('id').eq('ticket_no', ticket_no).limit(1);
        if (!exists || exists.length === 0) break;
        ticket_no = genTicket();
      }
      const { data, error } = await supabase
        .from('reports')
        .insert({
          ticket_no,
          lab_id,
          pc_id: String(pc_id).trim().toUpperCase(),
          student_name: String(student_name).trim(),
          nim: String(nim).trim(),
          description: String(description).trim(),
          photo_url: photo_url || null,
          status: 'diterima',
        })
        .select('*, labs(code,name)')
        .single();
      if (error) throw error;
      return res.status(201).json(data);
    }
    if (req.method === 'PUT') {
      const user = await requireUser(req, res);
      if (!user) return;
      const { id, status, technician_note, lab_id, pc_id, student_name, nim, description, photo_url } = req.body || {};
      if (!id) return res.status(400).json({ error: 'ID laporan wajib diisi' });
      const payload = { updated_at: new Date().toISOString() };
      if (status !== undefined) payload.status = status;
      if (technician_note !== undefined) payload.technician_note = technician_note ? String(technician_note).trim() : null;
      if (lab_id !== undefined) payload.lab_id = lab_id;
      if (pc_id !== undefined) payload.pc_id = String(pc_id).trim().toUpperCase();
      if (student_name !== undefined) payload.student_name = String(student_name).trim();
      if (nim !== undefined) payload.nim = String(nim).trim();
      if (description !== undefined) payload.description = String(description).trim();
      if (photo_url !== undefined) payload.photo_url = photo_url || null;
      const { data, error } = await supabase.from('reports').update(payload).eq('id', id).select('*, labs(code,name)').single();
      if (error) throw error;
      return res.status(200).json(data);
    }
    if (req.method === 'DELETE') {
      const user = await requireUser(req, res);
      if (!user) return;
      const { id } = req.body || {};
      if (!id) return res.status(400).json({ error: 'ID laporan wajib diisi' });
      const { error } = await supabase.from('reports').delete().eq('id', id);
      if (error) throw error;
      return res.status(200).json({ ok: true });
    }
    return res.status(405).json({ error: 'Method not allowed' });
  } catch (err) {
    console.error('API reports error:', err);
    return res.status(500).json({ error: err.message });
  }
}
