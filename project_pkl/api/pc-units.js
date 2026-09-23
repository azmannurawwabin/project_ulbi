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
      const { lab_id, status } = req.query;
      let query = supabase.from('pc_units').select('*, labs(code, name)').order('lab_id', { ascending: true }).order('pc_number', { ascending: true });
      if (lab_id) query = query.eq('lab_id', Number(lab_id));
      if (status) query = query.eq('status', status);
      const { data, error } = await query;
      if (error) throw error;
      return res.status(200).json(data || []);
    }

    if (req.method === 'POST') {
      const user = await requireAuth(req, res);
      if (!user) return;
      const body = req.body || {};
      const isBulk = Array.isArray(body.units);
      const rows = isBulk ? body.units : [body];
      if (!rows.length) return res.status(400).json({ error: 'Tidak ada data unit.' });
      const prepared = [];
      for (const r of rows) {
        if (!r.lab_id || !r.pc_number) return res.status(400).json({ error: 'lab_id dan pc_number wajib diisi.' });
        prepared.push({
          lab_id: Number(r.lab_id),
          pc_number: String(r.pc_number).trim().toUpperCase(),
          status: r.status || 'Aktif',
          processor: r.processor || '-',
          ram: r.ram || '-',
          storage: r.storage || '-',
          gpu: r.gpu || '-',
          monitor: r.monitor || '-',
          os: r.os || '-',
          notes: r.notes || null,
        });
      }
      const labIds = [...new Set(prepared.map((p) => p.lab_id))];
      const { data: existing } = await supabase.from('pc_units').select('lab_id, pc_number').in('lab_id', labIds);
      const existSet = new Set((existing || []).map((e) => `${e.lab_id}:${e.pc_number}`));
      const fresh = prepared.filter((p) => !existSet.has(`${p.lab_id}:${p.pc_number}`));
      if (!fresh.length) return res.status(409).json({ error: 'Semua nomor PC tersebut sudah terdaftar di lab ini.' });
      const { data, error } = await supabase.from('pc_units').insert(fresh).select();
      if (error) throw error;
      if (isBulk) return res.status(201).json({ created: data || [], skipped: prepared.length - fresh.length });
      return res.status(201).json((data || [])[0]);
    }

    if (req.method === 'PUT') {
      const user = await requireAuth(req, res);
      if (!user) return;
      const { id, lab_id, pc_number, status, processor, ram, storage, gpu, monitor, os, notes } = req.body || {};
      if (!id) return res.status(400).json({ error: 'ID unit wajib disertakan.' });
      const payload = {};
      if (lab_id !== undefined) payload.lab_id = Number(lab_id);
      if (pc_number !== undefined) payload.pc_number = String(pc_number).trim().toUpperCase();
      if (status !== undefined) payload.status = status;
      if (processor !== undefined) payload.processor = processor || '-';
      if (ram !== undefined) payload.ram = ram || '-';
      if (storage !== undefined) payload.storage = storage || '-';
      if (gpu !== undefined) payload.gpu = gpu || '-';
      if (monitor !== undefined) payload.monitor = monitor || '-';
      if (os !== undefined) payload.os = os || '-';
      if (notes !== undefined) payload.notes = notes || null;
      const { data, error } = await supabase.from('pc_units').update(payload).eq('id', id).select().single();
      if (error) throw error;
      return res.status(200).json(data);
    }

    if (req.method === 'DELETE') {
      const user = await requireAuth(req, res);
      if (!user) return;
      const { id } = req.body || {};
      if (!id) return res.status(400).json({ error: 'ID unit wajib disertakan.' });
      const { error } = await supabase.from('pc_units').delete().eq('id', id);
      if (error) throw error;
      return res.status(200).json({ ok: true });
    }

    return res.status(405).json({ error: 'Method not allowed' });
  } catch (err) {
    console.error('API pc-units error:', err);
    return res.status(500).json({ error: err.message || 'Terjadi kesalahan server.' });
  }
}
