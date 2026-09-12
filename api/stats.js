export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  if (req.method === 'OPTIONS') return res.status(204).end();
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });
  try {
    const { default: supabase } = await import('./db-client.js');
    const { data, error } = await supabase.from('complaint_logs').select('id,initial_severity,priority,complaint_type,status,created_at');
    if (error) throw error;
    const rows = data || [];
    const count = (fn) => rows.filter(fn).length;
    const bySeverity = {
      Critical: count((r) => r.initial_severity === 'Critical'),
      Major: count((r) => r.initial_severity === 'Major'),
      Minor: count((r) => r.initial_severity === 'Minor'),
    };
    const byPriority = {};
    const byType = {};
    const byStatus = {};
    for (const r of rows) {
      if (r.priority) byPriority[r.priority] = (byPriority[r.priority] || 0) + 1;
      if (r.complaint_type) byType[r.complaint_type] = (byType[r.complaint_type] || 0) + 1;
      if (r.status) byStatus[r.status] = (byStatus[r.status] || 0) + 1;
    }
    const sevenAgo = Date.now() - 7 * 24 * 3600 * 1000;
    const recent7d = rows.filter((r) => r.created_at && new Date(r.created_at).getTime() >= sevenAgo).length;
    return res.status(200).json({
      total: rows.length,
      bySeverity, byPriority, byType, byStatus,
      criticalOpen: rows.filter((r) => r.initial_severity === 'Critical' && r.status !== 'Closed').length,
      open: rows.filter((r) => r.status !== 'Closed').length,
      recent7d,
    });
  } catch (err) {
    console.error('stats API error:', err);
    return res.status(500).json({ error: err.message });
  }
}
