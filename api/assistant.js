function fallbackAnswer(message) {
  const m = String(message || '').toLowerCase();
  if (/critical|p0|adr|adverse|death|hospital/i.test(m)) return 'For a Critical / ADR complaint: (1) Quarantine retained + distribution stock of the batch immediately and put shipments on hold. (2) File the ADR with Pharmacovigilance within 24h and notify QA Head + QP. (3) Open a Major/Critical deviation + CAPA the same day; collect batch record (BMR/BPR), QC release data, stability and distribution list. (4) Medical review decides reportability to CDSCO/FDA/EMA. Do not close until effectiveness check passes. In this app, set Severity=Critical and Priority=P0 - Critical.';
  if (/capa|corrective|preventive|action plan/i.test(m)) return 'A GMP CAPA plan needs: Problem statement (batch + defect + extent), Immediate containment (quarantine, hold, recall assessment), Root-cause tools (5-Why + Fishbone across Man/Machine/Material/Method/Environment), Corrective actions (e.g., vision-system upgrade, torque revalidation, retraining with records), Preventive actions (SOP revision, FMEA update, supplier audit), Owners + due dates, and an Effectiveness Check (e.g., zero recurrence in next 3 lots). Link it to the complaint ID in the Register.';
  if (/severity|major|minor|triage|priority/i.test(m)) return 'Triage rule used here (per SOP): Critical = patient-safety impact (ADR, sterility failure, hospitalisation) -> P0 (24h containment). Major = quality/efficacy/GMP impact (assay failure, foreign particle in sterile, labelling mix-up, temperature excursion) -> P1 (7-day investigation). Minor = isolated cosmetic/packaging/quantity issue with no safety signal -> P2 (30-day closure). When in doubt between Major/Minor for sterile products, escalate to Major.';
  if (/stability|expiry|shelf|oos|out of spec/i.test(m)) return 'If the defect suggests stability or OOS (assay, dissolution, impurities, discolouration near expiry): pull retained samples + place batch on stability alert, initiate OOS Phase I (lab error check) then Phase II (manufacturing investigation), review Annual Product Quality Review trends, and assess whether a market-action / recall evaluation is needed. Record Mfg/Expiry dates exactly as on the pack.';
  if (/recall|reportab|cdsco|fda|ema/i.test(m)) return 'Reportability check: Critical defects (sterility, ADR with hospitalisation, mix-up of labels/strengths) are potentially recall-triggering — escalate to QA Head and Regulatory Affairs within 24h. Document the decision (recall / no-recall with rationale) in the complaint file. Non-critical isolated defects are typically handled via CAPA without field action, but trend them in APQR.';
  if (/batch|bmr|bpr|record|document/i.test(m)) return 'Minimum complaint file (data integrity / ALCOA+): original complaint text, extracted structured fields with confidence, pack photos if any, BMR/BPR + QC + stability + distribution records for the batch, investigation + RCA, CAPA with owners/dates, customer response letter, and closure approval by QA. This app stores raw_text + structured fields + trace for exactly that.';
  if (/hello|hi\b|help|what can/i.test(m)) return 'I can help with: triaging severity/priority, drafting investigation + CAPA steps, checking reportability, explaining the LangGraph extraction pipeline, or reviewing a specific complaint in your Register. Try: "Draft a CAPA for a labelling mix-up" or "Is a glass particle in a vial reportable?"';
  return 'Good question. In GMP complaint handling the flow is: Log (this form) -> Acknowledge customer within 2 business days -> Investigate (batch records, retained samples, trend) -> RCA -> CAPA -> Customer response -> Effectiveness check -> QA closure. Tell me the defect type or batch context and I will draft the next steps, severity rationale, and customer reply.';
}

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  if (req.method === 'OPTIONS') return res.status(204).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
  try {
    const { message, context } = req.body || {};
    if (!message || !String(message).trim()) return res.status(400).json({ error: 'message is required' });
    const apiKey = process.env.GROQ_API_KEY;
    if (apiKey) {
      try {
        const sys = 'You are a concise GMP QMS assistant for pharmaceutical API & FDF complaint management. Answer practically: triage, investigation, RCA, CAPA, reportability (CDSCO/FDA/EMA), timelines (P0 24h, P1 7d, P2 30d). Keep answers under 180 words, use short bullets. Current complaint context (may be empty): ' + (context ? String(context).slice(0, 1500) : 'none');
        const r = await fetch('https://api.groq.com/openai/v1/chat/completions', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Authorization: 'Bearer ' + apiKey },
          body: JSON.stringify({ model: 'llama-3.3-70b-versatile', temperature: 0.3, max_tokens: 500, messages: [{ role: 'system', content: sys }, { role: 'user', content: String(message).slice(0, 2000) }] }),
        });
        if (r.ok) {
          const j = await r.json();
          const text = j.choices?.[0]?.message?.content?.trim();
          if (text) return res.status(200).json({ reply: text, provider: 'groq', model: 'llama-3.3-70b-versatile' });
        }
      } catch (e) { console.warn('assistant groq failed, fallback:', e.message); }
    }
    return res.status(200).json({ reply: fallbackAnswer(message), provider: 'qms-knowledge', model: 'built-in' });
  } catch (err) {
    console.error('assistant API error:', err);
    return res.status(500).json({ error: err.message });
  }
}
