import supabase from './db-client.js';

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  if (req.method === 'OPTIONS') return res.status(204).end();

  try {
    if (req.method === 'POST') {
      const { fileName, fileBase64, contentType } = req.body || {};
      if (!fileBase64 || !fileName) return res.status(400).json({ error: 'File foto wajib disertakan.' });
      if (contentType && !String(contentType).startsWith('image/')) {
        return res.status(400).json({ error: 'File harus berupa gambar (JPG/PNG).' });
      }
      const buffer = Buffer.from(fileBase64, 'base64');
      if (buffer.length > 2.5 * 1024 * 1024) {
        return res.status(400).json({ error: 'Ukuran foto maksimal 2,5 MB.' });
      }
      const safe = String(fileName).replace(/[^a-zA-Z0-9._-]/g, '_').slice(-60);
      const d = new Date();
      const path = `tickets/${d.getFullYear()}/${String(d.getMonth() + 1).padStart(2, '0')}/${Date.now()}-${Math.random().toString(36).slice(2, 8)}-${safe}`;
      const { error } = await supabase.storage
        .from('ticket-photos')
        .upload(path, buffer, { contentType: contentType || 'image/jpeg', upsert: false });
      if (error) throw error;
      const { data } = supabase.storage.from('ticket-photos').getPublicUrl(path);
      return res.status(200).json({ url: data.publicUrl });
    }
    return res.status(405).json({ error: 'Method not allowed' });
  } catch (err) {
    console.error('API upload error:', err);
    return res.status(500).json({ error: err.message || 'Gagal mengunggah foto.' });
  }
}
