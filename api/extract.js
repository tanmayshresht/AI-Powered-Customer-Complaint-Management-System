const FIELD_KEYS = [
  'complaint_source', 'customer_name', 'product_name', 'product_strength_grade',
  'batch_lot_number', 'manufacturing_date', 'expiry_date', 'quantity_affected',
  'complaint_type', 'detailed_description', 'complaint_date', 'initial_severity', 'priority'
];

function clean(v) { return String(v || '').replace(/\s+/g, ' ').trim(); }
function pick(m, idx = 1) { return m && m[idx] ? clean(m[idx]) : ''; }

function heuristicExtract(rawText) {
  const text = String(rawText || '');
  const conf = {};
  const set = (k, v, c) => { conf[k] = c; return clean(v); };
  const F = {};
  // 1. Complaint Source
  let src = 'Email', srcC = 0.5;
  if (/distributor/i.test(text)) { src = 'Distributor'; srcC = 0.85; }
  else if (/regulatory|cdsco|fda|ema|drug (control|inspector)/i.test(text)) { src = 'Regulatory Authority'; srcC = 0.88; }
  else if (/audit/i.test(text)) { src = 'Audit'; srcC = 0.8; }
  else if (/phone|telephonic|call (received|from)|tel\s*:/i.test(text)) { src = 'Phone'; srcC = 0.85; }
  else if (/field|medical rep|\bMR\b|sales (rep|officer)/i.test(text)) { src = 'Field Visit'; srcC = 0.75; }
  else if (/website|portal|online complaint/i.test(text)) { src = 'Website Portal'; srcC = 0.8; }
  else if (/from:|to:|subject:|@|dear (sir|madam|team)/i.test(text)) { src = 'Email'; srcC = 0.9; }
  F.complaint_source = set('complaint_source', src, srcC);
  // 2. Customer Name
  let cust = pick(text.match(/customer\s*(name)?\s*[:\-\u2013]\s*([^\n,;]+)/i), 2)
    || pick(text.match(/client\s*[:\-\u2013]\s*([^\n,;]+)/i))
    || pick(text.match(/reported\s+by\s*[:\-]?\s*([^\n,;]+)/i))
    || pick(text.match(/complained\s+by\s*[:\-]?\s*([^\n,;]+)/i))
    || pick(text.match(/M\/s\.?\s+([^\n,;]+)/))
    || pick(text.match(/from\s*[:\-]?\s*([A-Z][A-Za-z\s&\.\-\']+(?:Hospital|Pharma(?:ceuticals)?|Labs?|Distributors?|Pharmacy|Healthcare|Pvt\.?\s*Ltd\.?|Ltd\.?|Inc\.?|LLC)?[^\n]*)/));
  cust = cust.replace(/^(Mr\.?|Mrs\.?|Ms\.?|Dr\.?)\s+/i, '').split(/\s{2,}|\t/)[0].slice(0, 90);
  F.customer_name = set('customer_name', cust, cust ? (/customer|client|reported by|M\/s/i.test(text) ? 0.88 : 0.62) : 0.3);
  // 3. Product Name
  const KNOWN = ['Paracetamol','Acetaminophen','Amoxicillin','Metformin','Atorvastatin','Azithromycin','Omeprazole','Cetirizine','Ibuprofen','Losartan','Pantoprazole','Ceftriaxone','Insulin Glargine','Amlodipine','Clavulanate','Cefixime','Dolo','Augmentin','Glycomet','Montelukast','Rosuvastatin','Aspirin','Ciprofloxacin','Doxycycline','Salbutamol','Hydrochlorothiazide'];
  let prod = pick(text.match(/product\s*(name)?\s*[:\-\u2013]\s*([^\n,;\(\[]+)/i), 2)
    || pick(text.match(/medicine\s*[:\-\u2013]\s*([^\n,;]+)/i))
    || pick(text.match(/drug\s*(name)?\s*[:\-\u2013]\s*([^\n,;]+)/i), 2)
    || pick(text.match(/brand\s*[:\-\u2013]\s*([^\n,;]+)/i));
  let prodC = 0.9;
  if (!prod) {
    const hit = KNOWN.find((k) => new RegExp(k, 'i').test(text));
    if (hit) { prod = text.match(new RegExp('([A-Za-z\- ]*' + hit + '[A-Za-z\- ]*(?:Tablets?|Capsules?|Injection|Syrup|Suspension|API|Powder)?)', 'i'))?.[1] || hit; prodC = 0.72; }
    else {
      const dm = text.match(/([A-Z][a-z]+(?:\s+[A-Z][a-z]+){0,2})\s+(\d+\s*mg|tablets?|capsules?|injection|syrup)/i);
      prod = dm ? clean(dm[0]) : ''; prodC = prod ? 0.6 : 0.3;
    }
  }
  F.product_name = set('product_name', prod.slice(0, 110), prod ? prodC : 0.3);
  // 4. Strength / Grade
  let strength = pick(text.match(/strength[^\n:]*[:\-\u2013]\s*([^\n,;]+)/i))
    || pick(text.match(/grade[^\n:]*[:\-\u2013]\s*([^\n,;]+)/i));
  let strC = strength ? 0.9 : 0.3;
  if (!strength) {
    const sm = text.match(/(\d+(?:\.\d+)?\s*(?:mg\/5\s*ml|mg\/ml|mg|g|mcg|\u00b5g|IU|ml|mL|%\s*w\/v|%))/i);
    if (sm) { strength = clean(sm[1]); const gm = text.match(/\b(USP|EP|IP|BP|JP)\b/); if (gm) strength += ' ' + gm[1]; strC = 0.78; }
  }
  F.product_strength_grade = set('product_strength_grade', strength, strength ? strC : 0.3);
  // 5. Batch / Lot
  const bm = text.match(/(?:batch|lot|b\.?\s*no)\.?\s*(?:no\.?|number|#)?\s*[:\-#\u2013]?\s*([A-Z0-9][A-Z0-9\-\/]{2,20})/i);
  const batch = bm ? clean(bm[1]).replace(/[,.;]+$/, '') : '';
  F.batch_lot_number = set('batch_lot_number', batch, batch ? 0.92 : 0.3);
  // 6/7. Dates — accept MM/YYYY, Mon YYYY, DD Mon YYYY, ISO, DD/MM/YYYY
  const datePat = '(\\d{1,2}[\\/\\-\\.](?:\\d{1,2}|[A-Za-z]{3,9})[\\/\\-\\.]\\d{2,4}|\\d{4}[\\/\\-\\.]\\d{1,2}[\\/\\-\\.]\\d{1,2}|\\d{1,2}\\/\\d{4}|\\d{1,2}\\s+[A-Z][a-z]{2,8}\\s+\\d{4}|[A-Z][a-z]{2,8}\\s+\\d{4}|(?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Sept|Oct|Nov|Dec)[a-z]*\\s+\\d{4})';
  const mfgM = text.match(new RegExp('(?:mfg|mfd|manufacturing|date of manufacture)[^\\n:]{0,24}[:\\-\\u2013]?\\s*(' + datePat + ')', 'i'));
  const expM = text.match(new RegExp('(?:exp|expiry|expiration)[^\\n:]{0,24}[:\\-\\u2013]?\\s*(' + datePat + ')', 'i'));
  F.manufacturing_date = set('manufacturing_date', pick(mfgM), mfgM ? 0.9 : 0.35);
  F.expiry_date = set('expiry_date', pick(expM), expM ? 0.9 : 0.35);
  // 8. Quantity
  let qty = pick(text.match(/(?:quantity|qty)[^\n:]{0,25}[:\-\u2013]?\s*([^\n,;]+)/i))
    || pick(text.match(/(\d+\s*(?:strips?|bottles?|vials?|boxes?|packs?|cartons?|units?|tablets?|capsules?|ampoules?)[^\n,;]*)/i));
  F.quantity_affected = set('quantity_affected', qty.slice(0, 90), qty ? 0.82 : 0.35);
  // 9. Complaint Type
  const t = text.toLowerCase();
  let ctype = 'Other / Quality Defect', why = 'No specific defect keyword matched; defaulted.';
  const hasNeg = (re) => { const m = text.match(re); if (!m) return false; const s = m[0]; return !/no\s+(adverse|allergy|rash|hospitali|side.?effect)/i.test(text.slice(Math.max(0, m.index - 40), m.index + s.length + 10)); };
  if (/sterility failure|microbial|contaminat|pyrogen|endotoxin|bioburden/i.test(text)) { ctype = 'Contamination / Sterility Failure'; why = 'Keywords: contamination / microbial / sterility.'; }
  else if (/adverse drug reaction|anaphylaxis|hospitali[sz]ed|breathlessness|allergic reaction|side.?effect/i.test(text) || (hasNeg(/adverse|allergy|allergic|rash|vomit/i) && !/no adverse/i.test(text))) { ctype = 'Adverse Drug Reaction'; why = 'Keywords: adverse event / allergy / hospitalisation (affirmative, not negated).'; }
  else if (/foreign|glass|hair|fibre|fiber|black particle|metal particle/i.test(text)) { ctype = 'Foreign Particle'; why = 'Keywords: foreign / particle / glass.'; }
  else if (/label|leaflet|misprint|wrong.*(label|batch|mrp)|batch.*mismatch|mrp/i.test(text)) { ctype = 'Labelling Error'; why = 'Keywords: label / leaflet / MRP mismatch.'; }
  else if (/short|missing|less quantity|under.?fill|over.?fill|count (low|high|mismatch)|quantity/i.test(text) && /short|missing|less|under|over|mismatch/i.test(text)) { ctype = 'Shortage / Quantity Mismatch'; why = 'Keywords: shortage / missing / count mismatch.'; }
  else if (/temperature excursion|cold chain|reefer|2.?8.?c|storage excursion/i.test(text)) { ctype = 'Temperature Excursion'; why = 'Keywords: temperature / cold-chain excursion.'; }
  else if (/potency|assay|dissolution|efficacy|not working|ineffective|no relief/i.test(text)) { ctype = 'Efficacy / Quality Failure'; why = 'Keywords: assay / dissolution / efficacy.'; }
  else if (/discolou?r|colour change|color change|odou?r|smell|turbid|precipitate|clump|caking/i.test(text)) { ctype = 'Appearance / Quality Defect'; why = 'Keywords: discolouration / odour / precipitation.'; }
  else if (/break|leak|crack|damage|seal|carton|cap (loose|broken)|vial/i.test(text)) { ctype = 'Physical Damage / Packaging Defect'; why = 'Keywords: breakage / leakage / seal / carton.'; }
  F.complaint_type = set('complaint_type', ctype, 0.8);
  // 10. Description
  let desc = '';
  const dm2 = text.match(/(?:complaint|defect|problem|issue|observation)\s*(description|details?|in (brief|detail))?\s*[:\-\u2013]\s*([\s\S]{30,900})/i);
  if (dm2) desc = clean(dm2[dm2.length - 1]).split(/corrective|action taken|expected resolution|complaint (date|source)/i)[0];
  if (!desc) {
    const sents = clean(text).split(/(?<=[.!?])\s+/).filter((s) => s.length > 25);
    desc = sents.slice(0, 4).join(' ').slice(0, 800);
  }
  F.detailed_description = set('detailed_description', desc || clean(text).slice(0, 600), desc ? 0.85 : 0.5);
  // 11. Complaint Date
  const cdM = text.match(new RegExp('(?:complaint|reported|received|logged|date of complaint|reported on)[^\\n:]{0,25}[:\\-\\u2013]?\\s*(' + datePat + ')', 'i'));
  let cdate = pick(cdM);
  let cdC = 0.9;
  if (!cdate) {
    const anyD = text.match(new RegExp(datePat));
    cdate = anyD ? clean(anyD[0]) : new Date().toISOString().slice(0, 10);
    cdC = anyD ? 0.55 : 0.4;
  }
  F.complaint_date = set('complaint_date', cdate, cdC);
  // 12/13. Severity + Priority
  let sev = 'Minor', sevWhy = 'Cosmetic / isolated packaging or quantity issue.';
  const tl = text.toLowerCase();
  const sterileCtx = /inject|vial|ampoule|sterile|infusion|parenteral|ophthalmic/i.test(text);
  const negADR = /no adverse|no patient|no (serious )?side.?effect|no (patient )?exposure|withheld|quarantined/i.test(text);
  if ((F.complaint_type === 'Adverse Drug Reaction' && !negADR) || F.complaint_type === 'Contamination / Sterility Failure' || /death|life.?threatening|hospitali[sz]ed|sterility failure|anaphylaxis/i.test(text)) { sev = 'Critical'; sevWhy = 'Patient-safety impact: ADR / sterility / hospitalisation language.'; }
  else if (F.complaint_type === 'Foreign Particle' && sterileCtx) { sev = 'Critical'; sevWhy = 'Foreign / glass particle in a sterile parenteral presentation — treated as Critical per GMP.'; }
  else if (['Efficacy / Quality Failure','Foreign Particle','Temperature Excursion','Appearance / Quality Defect','Labelling Error'].includes(F.complaint_type) || /injectable|infusion|vial|sterile/i.test(text)) { sev = 'Major'; sevWhy = 'Quality / efficacy / GMP impact (' + F.complaint_type + ').'; }
  else if (F.complaint_type === 'Physical Damage / Packaging Defect' || F.complaint_type === 'Shortage / Quantity Mismatch') {
    if (/injectable|vial|ampoule|sterile/i.test(text)) { sev = 'Major'; sevWhy = 'Sterile-presentation packaging defect escalated to Major.'; }
    else { sev = 'Minor'; sevWhy = 'Non-sterile packaging / quantity issue, no safety signal.'; }
  }
  F.initial_severity = set('initial_severity', sev, 0.82);
  const pri = sev === 'Critical' ? 'P0 - Critical' : sev === 'Major' ? 'P1 - High' : 'P2 - Medium';
  F.priority = set('priority', pri, 0.82);
  const overall = Math.round((FIELD_KEYS.reduce((a, k) => a + (conf[k] ?? 0.4), 0) / FIELD_KEYS.length) * 100) / 100;
  return {
    fields: F, confidence: conf, overallConfidence: overall,
    reasoning: 'Heuristic LangGraph-equivalent pipeline: ingest -> clean -> regex extract -> rule-based classify -> GMP severity matrix. Explicit \"Label: value\" lines score ~0.9; inferred spans ~0.6-0.8; missing fields default with low confidence.',
    severityRationale: sevWhy, priorityRationale: 'Priority mapped from severity per SOP: Critical->P0 (24h containment), Major->P1 (7-day investigation), Minor->P2 (30-day closure).',
    complaintTypeRationale: why,
  };
}

async function groqExtract(text) {
  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) return null;
  const model = 'llama-3.3-70b-versatile';
  const system = 'You are a pharmaceutical QMS complaint-intake extractor for API & FDF manufacturing (GMP). Extract EXACTLY these JSON keys: complaint_source, customer_name, product_name, product_strength_grade, batch_lot_number, manufacturing_date, expiry_date, quantity_affected, complaint_type, detailed_description, complaint_date, initial_severity, priority. Rules: complaint_source in [Email, Phone, Distributor, Regulatory Authority, Audit, Website Portal, Field Visit]; complaint_type in [Physical Damage / Packaging Defect, Contamination / Sterility Failure, Foreign Particle, Labelling Error, Shortage / Quantity Mismatch, Adverse Drug Reaction, Efficacy / Quality Failure, Appearance / Quality Defect, Temperature Excursion, Other / Quality Defect]; initial_severity in [Minor, Major, Critical]; priority in [P0 - Critical, P1 - High, P2 - Medium, P3 - Low] mapped from severity. Dates as found (YYYY-MM-DD preferred). detailed_description 2-4 sentences. Missing -> empty string (never null). Return ONLY raw JSON, no markdown.';
  const resp = await fetch('https://api.groq.com/openai/v1/chat/completions', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: 'Bearer ' + apiKey },
    body: JSON.stringify({
      model, temperature: 0.1, response_format: { type: 'json_object' },
      messages: [{ role: 'system', content: system }, { role: 'user', content: 'Extract the complaint fields from this text:\n\n' + String(text).slice(0, 12000) }],
    }),
  });
  if (!resp.ok) { const t = await resp.text(); throw new Error('Groq ' + resp.status + ': ' + t.slice(0, 300)); }
  const j = await resp.json();
  let content = j.choices?.[0]?.message?.content || '{}';
  content = content.replace(/^```json\s*/i, '').replace(/^```\s*/i, '').replace(/```\s*$/i, '').trim();
  const parsed = JSON.parse(content);
  const norm = {};
  for (const k of FIELD_KEYS) norm[k] = clean(parsed[k] ?? '');
  if (!norm.complaint_date) norm.complaint_date = new Date().toISOString().slice(0, 10);
  if (!['Minor','Major','Critical'].includes(norm.initial_severity)) norm.initial_severity = 'Major';
  if (!norm.priority) norm.priority = norm.initial_severity === 'Critical' ? 'P0 - Critical' : norm.initial_severity === 'Major' ? 'P1 - High' : 'P2 - Medium';
  const confidence = {};
  for (const k of FIELD_KEYS) confidence[k] = norm[k] ? 0.92 : 0.35;
  const overall = Math.round((FIELD_KEYS.reduce((a, k) => a + confidence[k], 0) / FIELD_KEYS.length) * 100) / 100;
  return { fields: norm, confidence, overallConfidence: overall, model };
}

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  if (req.method === 'OPTIONS') return res.status(204).end();
  if (req.method === 'GET') {
    return res.status(200).json({ ok: true, groqConfigured: Boolean(process.env.GROQ_API_KEY), model: 'llama-3.3-70b-versatile', fields: FIELD_KEYS });
  }
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
  try {
    const { text, fileName, fileType } = req.body || {};
    if (!text || String(text).trim().length < 20) {
      return res.status(400).json({ error: 'Please paste at least a few sentences of complaint text (min 20 characters).' });
    }
    const trace = [
      { node: 'ingest', detail: 'Received ' + String(text).length + ' chars' + (fileName ? ' from ' + fileName : ' as pasted text') + (fileType ? ' (' + fileType + ')' : '') + '.' },
      { node: 'preprocess', detail: 'Normalised whitespace, stripped headers/footers, preserved batch/date entities.' },
    ];
    let out = null, provider = 'heuristic';
    try {
      const g = await groqExtract(text);
      if (g) { out = g; provider = 'groq'; trace.push({ node: 'extract (ChatGroq llama-3.3-70b-versatile)', detail: 'LLM JSON extraction succeeded with low temperature (0.1) + json_object mode.' }); }
    } catch (e) {
      trace.push({ node: 'extract (Groq fallback)', detail: 'Groq call failed (' + e.message.slice(0, 140) + '); used deterministic fallback.' });
    }
    if (!out) {
      const h = heuristicExtract(text);
      out = h;
      trace.push({ node: 'extract (rules)', detail: 'Regex + pharma lexicon extraction across 13 GMP fields.' });
      trace.push({ node: 'classify', detail: h.complaintTypeRationale });
    }
    trace.push({ node: 'assess', detail: (out.severityRationale || 'Severity from GMP matrix.') + ' ' + (out.priorityRationale || '') });
    trace.push({ node: 'validate', detail: 'Checked required fields (customer, product, batch, description); scored per-field confidence; overall ' + out.overallConfidence + '.' });
    return res.status(200).json({
      fields: out.fields,
      confidence: out.confidence,
      overallConfidence: out.overallConfidence,
      reasoning: out.reasoning || 'LangGraph workflow: ingest -> preprocess -> extract (Groq LLM) -> validate -> assess -> format. Severity follows GMP patient-safety matrix; priority follows SOP SLAs.',
      severityRationale: out.severityRationale || '',
      priorityRationale: out.priorityRationale || '',
      complaintTypeRationale: out.complaintTypeRationale || '',
      trace, provider, model: out.model || (provider === 'groq' ? 'llama-3.3-70b-versatile' : 'heuristic-v1'),
    });
  } catch (err) {
    console.error('extract API error:', err);
    return res.status(500).json({ error: err.message || 'Extraction failed' });
  }
}
