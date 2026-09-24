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

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  if (req.method === 'OPTIONS') return res.status(204).end();

  try {
    if (req.method === 'GET') {
      const { lab_id } = req.query;
      let q = supabase.from('pc_specs').select('*, labs(code,name)').order('pc_id', { ascending: true });
      if (lab_id) q = q.eq('lab_id', lab_id);
      const { data, error } = await q;
      if (error) throw error;
      return res.status(200).json(data);
    }
    if (req.method === 'POST') {
      const user = await requireUser(req, res);
      if (!user) return;
      const { lab_id, pc_id, processor, ram, storage, gpu, monitor, os, status } = req.body || {};
      if (!lab_id || !pc_id) return res.status(400).json({ error: 'Lab dan Nomor PC wajib diisi' });
      const { data, error } = await supabase
        .from('pc_specs')
        .insert({
          lab_id,
          pc_id: String(pc_id).trim().toUpperCase(),
          processor: processor || null,
          ram: ram || null,
          storage: storage || null,
          gpu: gpu || null,
          monitor: monitor || null,
          os: os || null,
          status: status || 'baik',
        })
        .select()
        .single();
      if (error) throw error;
      return res.status(201).json(data);
    }
    if (req.method === 'PUT') {
      const user = await requireUser(req, res);
      if (!user) return;
      const { id, lab_id, pc_id, processor, ram, storage, gpu, monitor, os, status } = req.body || {};
      if (!id) return res.status(400).json({ error: 'ID spesifikasi wajib diisi' });
      const payload = {};
      if (lab_id !== undefined) payload.lab_id = lab_id;
      if (pc_id !== undefined) payload.pc_id = String(pc_id).trim().toUpperCase();
      if (processor !== undefined) payload.processor = processor || null;
      if (ram !== undefined) payload.ram = ram || null;
      if (storage !== undefined) payload.storage = storage || null;
      if (gpu !== undefined) payload.gpu = gpu || null;
      if (monitor !== undefined) payload.monitor = monitor || null;
      if (os !== undefined) payload.os = os || null;
      if (status !== undefined) payload.status = status;
      const { data, error } = await supabase.from('pc_specs').update(payload).eq('id', id).select().single();
      if (error) throw error;
      return res.status(200).json(data);
    }
    if (req.method === 'DELETE') {
      const user = await requireUser(req, res);
      if (!user) return;
      const { id } = req.body || {};
      if (!id) return res.status(400).json({ error: 'ID spesifikasi wajib diisi' });
      const { error } = await supabase.from('pc_specs').delete().eq('id', id);
      if (error) throw error;
      return res.status(200).json({ ok: true });
    }
    return res.status(405).json({ error: 'Method not allowed' });
  } catch (err) {
    console.error('API specs error:', err);
    return res.status(500).json({ error: err.message });
  }
}
