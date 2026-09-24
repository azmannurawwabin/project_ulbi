import supabase from './db-client.js';

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  if (req.method === 'OPTIONS') return res.status(204).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  try {
    const { fileName, fileBase64, contentType } = req.body || {};
    if (!fileName || !fileBase64) return res.status(400).json({ error: 'File tidak valid' });
    const buffer = Buffer.from(fileBase64, 'base64');
    if (buffer.length > 5 * 1024 * 1024) {
      return res.status(400).json({ error: 'Ukuran foto maksimal 5 MB' });
    }
    const safe = String(fileName).replace(/[^a-zA-Z0-9.\-_]/g, '_');
    const path = `reports/${Date.now()}-${safe}`;
    const { error } = await supabase.storage
      .from('report-photos')
      .upload(path, buffer, { contentType: contentType || 'image/jpeg', upsert: false });
    if (error) throw error;
    const { data } = supabase.storage.from('report-photos').getPublicUrl(path);
    return res.status(200).json({ url: data.publicUrl });
  } catch (err) {
    console.error('API upload error:', err);
    return res.status(500).json({ error: err.message });
  }
}
