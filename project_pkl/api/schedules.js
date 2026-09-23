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
      const { lab_id, day } = req.query;
      let query = supabase.from('schedules').select('*, labs(code, name)').order('lab_id', { ascending: true }).order('start_time', { ascending: true });
      if (lab_id) query = query.eq('lab_id', Number(lab_id));
      if (day) query = query.eq('day', day);
      const { data, error } = await query;
      if (error) throw error;
      return res.status(200).json(data || []);
    }

    if (req.method === 'POST') {
      const user = await requireAuth(req, res);
      if (!user) return;
      const { lab_id, course_code, course_name, lecturer, day, start_time, end_time, class_group, semester } = req.body || {};
      if (!lab_id || !course_name || !day || !start_time || !end_time) {
        return res.status(400).json({ error: 'Lab, mata kuliah, hari, dan jam wajib diisi.' });
      }
      const { data, error } = await supabase
        .from('schedules')
        .insert([{
          lab_id: Number(lab_id),
          course_code: course_code || null,
          course_name: String(course_name).trim(),
          lecturer: lecturer || null,
          day,
          start_time,
          end_time,
          class_group: class_group || null,
          semester: semester || null,
        }])
        .select()
        .single();
      if (error) throw error;
      return res.status(201).json(data);
    }

    if (req.method === 'PUT') {
      const user = await requireAuth(req, res);
      if (!user) return;
      const { id, lab_id, course_code, course_name, lecturer, day, start_time, end_time, class_group, semester } = req.body || {};
      if (!id) return res.status(400).json({ error: 'ID jadwal wajib disertakan.' });
      const payload = {};
      if (lab_id !== undefined) payload.lab_id = Number(lab_id);
      if (course_code !== undefined) payload.course_code = course_code || null;
      if (course_name !== undefined) payload.course_name = String(course_name).trim();
      if (lecturer !== undefined) payload.lecturer = lecturer || null;
      if (day !== undefined) payload.day = day;
      if (start_time !== undefined) payload.start_time = start_time;
      if (end_time !== undefined) payload.end_time = end_time;
      if (class_group !== undefined) payload.class_group = class_group || null;
      if (semester !== undefined) payload.semester = semester || null;
      const { data, error } = await supabase.from('schedules').update(payload).eq('id', id).select().single();
      if (error) throw error;
      return res.status(200).json(data);
    }

    if (req.method === 'DELETE') {
      const user = await requireAuth(req, res);
      if (!user) return;
      const { id } = req.body || {};
      if (!id) return res.status(400).json({ error: 'ID jadwal wajib disertakan.' });
      const { error } = await supabase.from('schedules').delete().eq('id', id);
      if (error) throw error;
      return res.status(200).json({ ok: true });
    }

    return res.status(405).json({ error: 'Method not allowed' });
  } catch (err) {
    console.error('API schedules error:', err);
    return res.status(500).json({ error: err.message || 'Terjadi kesalahan server.' });
  }
}
