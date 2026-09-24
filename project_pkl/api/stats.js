import supabase from './db-client.js';

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  if (req.method === 'OPTIONS') return res.status(204).end();
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });

  try {
    const [labsRes, reportsRes, specsRes, recentRes] = await Promise.all([
      supabase.from('labs').select('id,total_pc'),
      supabase.from('reports').select('id,status,lab_id'),
      supabase.from('pc_specs').select('id,status'),
      supabase.from('reports').select('*, labs(code,name)').order('created_at', { ascending: false }).limit(6),
    ]);
    if (labsRes.error) throw labsRes.error;
    if (reportsRes.error) throw reportsRes.error;
    if (specsRes.error) throw specsRes.error;
    if (recentRes.error) throw recentRes.error;

    const labs = labsRes.data || [];
    const reports = reportsRes.data || [];
    const specs = specsRes.data || [];

    const byStatus = { diterima: 0, diproses: 0, selesai: 0 };
    reports.forEach((r) => {
      if (r.status === 'diterima') byStatus.diterima += 1;
      else if (r.status === 'diproses') byStatus.diproses += 1;
      else if (r.status === 'selesai') byStatus.selesai += 1;
    });

    const perLab = labs.map((lab) => ({
      lab_id: lab.id,
      open: reports.filter((r) => r.lab_id === lab.id && r.status !== 'selesai').length,
      total: reports.filter((r) => r.lab_id === lab.id).length,
    }));

    const pcHealth = { baik: 0, perawatan: 0, rusak: 0 };
    specs.forEach((s) => {
      if (s.status === 'perawatan') pcHealth.perawatan += 1;
      else if (s.status === 'rusak') pcHealth.rusak += 1;
      else pcHealth.baik += 1;
    });

    return res.status(200).json({
      totalLabs: labs.length,
      totalPc: labs.reduce((sum, l) => sum + (Number(l.total_pc) || 0), 0),
      totalReports: reports.length,
      byStatus,
      perLab,
      pcHealth,
      recent: recentRes.data || [],
    });
  } catch (err) {
    console.error('API stats error:', err);
    return res.status(500).json({ error: err.message });
  }
}
