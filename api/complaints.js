import supabase from './db-client.js';

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  if (req.method === 'OPTIONS') return res.status(204).end();

  try {
    if (req.method === 'GET') {
      const { search, severity, priority } = req.query || {};
      let q = supabase.from('complaint_logs').select('*').order('created_at', { ascending: false }).limit(500);
      if (severity) q = q.eq('initial_severity', severity);
      if (priority) q = q.eq('priority', priority);
      const { data, error } = await q;
      if (error) throw error;
      let rows = data || [];
      if (search) {
        const s = String(search).toLowerCase();
        rows = rows.filter((r) =>
          [r.customer_name, r.product_name, r.batch_lot_number, r.complaint_type, r.detailed_description]
            .filter(Boolean).join(' ').toLowerCase().includes(s)
        );
      }
      return res.status(200).json(rows);
    }
    if (req.method === 'POST') {
      const b = req.body || {};
      const payload = {
        complaint_source: b.complaint_source || 'Email',
        customer_name: b.customer_name || '',
        product_name: b.product_name || '',
        product_strength_grade: b.product_strength_grade || '',
        batch_lot_number: b.batch_lot_number || '',
        manufacturing_date: b.manufacturing_date || '',
        expiry_date: b.expiry_date || '',
        quantity_affected: b.quantity_affected || '',
        complaint_type: b.complaint_type || 'Other / Quality Defect',
        detailed_description: b.detailed_description || '',
        complaint_date: b.complaint_date || new Date().toISOString().slice(0, 10),
        initial_severity: b.initial_severity || 'Major',
        priority: b.priority || 'P1 - High',
        status: b.status || 'Open',
        raw_text: b.raw_text || '',
        ai_summary: b.ai_summary || '',
        overall_confidence: b.overall_confidence ?? null,
        confidence: b.confidence || null,
      };
      if (!payload.customer_name && !payload.product_name && !payload.detailed_description) {
        return res.status(400).json({ error: 'Provide at least customer, product or description.' });
      }
      const { data, error } = await supabase.from('complaint_logs').insert(payload).select().single();
      if (error) throw error;
      return res.status(201).json(data);
    }
    if (req.method === 'PUT') {
      const b = req.body || {};
      const { id, ...rest } = b;
      if (!id) return res.status(400).json({ error: 'id is required' });
      const allowed = ['complaint_source','customer_name','product_name','product_strength_grade','batch_lot_number','manufacturing_date','expiry_date','quantity_affected','complaint_type','detailed_description','complaint_date','initial_severity','priority','status','raw_text','ai_summary','overall_confidence','confidence'];
      const patch = {};
      for (const k of allowed) if (rest[k] !== undefined) patch[k] = rest[k];
      const { data, error } = await supabase.from('complaint_logs').update(patch).eq('id', id).select().single();
      if (error) throw error;
      return res.status(200).json(data);
    }
    if (req.method === 'DELETE') {
      const id = req.body?.id ?? req.query?.id;
      if (!id) return res.status(400).json({ error: 'id is required' });
      const { error } = await supabase.from('complaint_logs').delete().eq('id', id);
      if (error) throw error;
      return res.status(200).json({ ok: true });
    }
    return res.status(405).json({ error: 'Method not allowed' });
  } catch (err) {
    console.error('complaints API error:', err);
    return res.status(500).json({ error: err.message || 'Server error' });
  }
}
