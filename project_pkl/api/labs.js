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

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  if (req.method === 'OPTIONS') return res.status(204).end();

  try {
    if (req.method === 'GET') {
      const { id } = req.query;
      const { data: labs, error } = await supabase.from('labs').select('*').order('code', { ascending: true });
      if (error) throw error;
      const { data: units } = await supabase.from('pc_units').select('lab_id, status');
      const { data: tickets } = await supabase.from('tickets').select('lab_id, status').neq('status', 'Selesai');
      const enriched = (labs || []).map((lab) => {
        const labUnits = (units || []).filter((u) => u.lab_id === lab.id);
        return {
          ...lab,
          pc_total: labUnits.length,
          pc_active: labUnits.filter((u) => u.status === 'Aktif').length,
          pc_damaged: labUnits.filter((u) => u.status === 'Rusak' || u.status === 'Perbaikan').length,
          tickets_open: (tickets || []).filter((t) => t.lab_id === lab.id).length,
        };
      });
      if (id) {
        const lab = enriched.find((l) => String(l.id) === String(id));
        if (!lab) return res.status(404).json({ error: 'Lab tidak ditemukan.' });
        return res.status(200).json(lab);
      }
      return res.status(200).json(enriched);
    }

    if (req.method === 'POST') {
      const user = await requireAuth(req, res);
      if (!user) return;
      const { code, name, location, capacity, status, description } = req.body || {};
      if (!code || !name) return res.status(400).json({ error: 'Kode dan nama lab wajib diisi.' });
      const { data, error } = await supabase
        .from('labs')
        .insert([{
          code: String(code).trim(),
          name: String(name).trim(),
          location: location || null,
          capacity: capacity === '' || capacity === null || capacity === undefined ? null : Number(capacity),
          status: status || 'Aktif',
          description: description || null,
        }])
        .select()
        .single();
      if (error) throw error;
      return res.status(201).json(data);
    }

    if (req.method === 'PUT') {
      const user = await requireAuth(req, res);
      if (!user) return;
      const { id, code, name, location, capacity, status, description } = req.body || {};
      if (!id) return res.status(400).json({ error: 'ID lab wajib disertakan.' });
      const payload = {};
      if (code !== undefined) payload.code = String(code).trim();
      if (name !== undefined) payload.name = String(name).trim();
      if (location !== undefined) payload.location = location || null;
      if (capacity !== undefined) payload.capacity = capacity === '' || capacity === null ? null : Number(capacity);
      if (status !== undefined) payload.status = status;
      if (description !== undefined) payload.description = description || null;
      const { data, error } = await supabase.from('labs').update(payload).eq('id', id).select().single();
      if (error) throw error;
      return res.status(200).json(data);
    }

    if (req.method === 'DELETE') {
      const user = await requireAuth(req, res);
      if (!user) return;
      const { id } = req.body || {};
      if (!id) return res.status(400).json({ error: 'ID lab wajib disertakan.' });
      const { error } = await supabase.from('labs').delete().eq('id', id);
      if (error) throw error;
      return res.status(200).json({ ok: true });
    }

    return res.status(405).json({ error: 'Method not allowed' });
  } catch (err) {
    console.error('API labs error:', err);
    return res.status(500).json({ error: err.message || 'Terjadi kesalahan server.' });
  }
}
