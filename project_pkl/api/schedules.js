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
      let q = supabase.from('schedules').select('*, labs(code,name)').order('start_time', { ascending: true });
      if (lab_id) q = q.eq('lab_id', lab_id);
      const { data, error } = await q;
      if (error) throw error;
      return res.status(200).json(data);
    }
    if (req.method === 'POST') {
      const user = await requireUser(req, res);
      if (!user) return;
      const { lab_id, course_name, lecturer_name, day, start_time, end_time, semester } = req.body || {};
      if (!lab_id || !course_name || !day || !start_time || !end_time) {
        return res.status(400).json({ error: 'Lab, matakuliah, hari, dan jam wajib diisi' });
      }
      const { data, error } = await supabase
        .from('schedules')
        .insert({
          lab_id,
          course_name: String(course_name).trim(),
          lecturer_name: lecturer_name ? String(lecturer_name).trim() : null,
          day,
          start_time,
          end_time,
          semester: semester ? String(semester).trim() : null,
        })
        .select()
        .single();
      if (error) throw error;
      return res.status(201).json(data);
    }
    if (req.method === 'PUT') {
      const user = await requireUser(req, res);
      if (!user) return;
      const { id, lab_id, course_name, lecturer_name, day, start_time, end_time, semester } = req.body || {};
      if (!id) return res.status(400).json({ error: 'ID jadwal wajib diisi' });
      const payload = {};
      if (lab_id !== undefined) payload.lab_id = lab_id;
      if (course_name !== undefined) payload.course_name = String(course_name).trim();
      if (lecturer_name !== undefined) payload.lecturer_name = lecturer_name ? String(lecturer_name).trim() : null;
      if (day !== undefined) payload.day = day;
      if (start_time !== undefined) payload.start_time = start_time;
      if (end_time !== undefined) payload.end_time = end_time;
      if (semester !== undefined) payload.semester = semester ? String(semester).trim() : null;
      const { data, error } = await supabase.from('schedules').update(payload).eq('id', id).select().single();
      if (error) throw error;
      return res.status(200).json(data);
    }
    if (req.method === 'DELETE') {
      const user = await requireUser(req, res);
      if (!user) return;
      const { id } = req.body || {};
      if (!id) return res.status(400).json({ error: 'ID jadwal wajib diisi' });
      const { error } = await supabase.from('schedules').delete().eq('id', id);
      if (error) throw error;
      return res.status(200).json({ ok: true });
    }
    return res.status(405).json({ error: 'Method not allowed' });
  } catch (err) {
    console.error('API schedules error:', err);
    return res.status(500).json({ error: err.message });
  }
}
