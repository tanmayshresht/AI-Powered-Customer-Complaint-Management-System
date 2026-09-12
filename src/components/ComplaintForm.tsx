import { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Building2, PackageSearch, ClipboardList, Gauge, Save, RotateCcw, CheckCircle2, Loader2, Sparkles, Info } from 'lucide-react';
import { setField, resetForm, saveComplaint, FIELD_LABELS, type ComplaintForm as Form } from '../store/complaintSlice';
import type { AppDispatch, RootState } from '../store/store';

const SOURCES = ['Email', 'Phone', 'Distributor', 'Regulatory Authority', 'Audit', 'Website Portal', 'Field Visit'];
const TYPES = ['Physical Damage / Packaging Defect', 'Contamination / Sterility Failure', 'Foreign Particle', 'Labelling Error', 'Shortage / Quantity Mismatch', 'Adverse Drug Reaction', 'Efficacy / Quality Failure', 'Appearance / Quality Defect', 'Temperature Excursion', 'Other / Quality Defect'];
const SEVERITIES = [
  { v: 'Minor', desc: 'Cosmetic / isolated', cls: 'border-emerald-300 bg-emerald-50 text-emerald-800', dot: 'bg-emerald-500' },
  { v: 'Major', desc: 'Quality / GMP impact', cls: 'border-amber-300 bg-amber-50 text-amber-800', dot: 'bg-amber-500' },
  { v: 'Critical', desc: 'Patient-safety impact', cls: 'border-red-300 bg-red-50 text-red-800', dot: 'bg-red-500' },
];
const PRIORITIES = ['P0 - Critical', 'P1 - High', 'P2 - Medium', 'P3 - Low'];

function confColor(c?: number) {
  if (c == null) return 'bg-slate-300';
  if (c >= 0.85) return 'bg-emerald-500';
  if (c >= 0.6) return 'bg-amber-500';
  return 'bg-red-400';
}

function FieldWrap({ field, children, hint }: { field: keyof Form; children: React.ReactNode; hint?: string }) {
  const autofilled = useSelector((s: RootState) => s.complaint.autofilled);
  const lastConfidence = useSelector((s: RootState) => s.complaint.lastConfidence);
  const isAuto = autofilled.includes(field);
  const c = lastConfidence[field];
  return (
    <label className="block">
      <span className="mb-1.5 flex items-center gap-1.5 text-[12.5px] font-bold text-slate-700">
        {c != null && <span title={`AI confidence ${Math.round(c * 100)}%`} className={`h-2 w-2 rounded-full ${confColor(c)}`} />}
        {FIELD_LABELS[field]}
        {isAuto && <span className="inline-flex items-center gap-0.5 rounded-full bg-emerald-100 px-1.5 py-px text-[9.5px] font-extrabold uppercase tracking-wide text-emerald-700"><Sparkles className="h-2.5 w-2.5" /> AI</span>}
      </span>
      {children}
      {hint && <span className="mt-1 block text-[11px] text-slate-400">{hint}</span>}
    </label>
  );
}

const inputCls = "w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-[13.5px] font-medium text-slate-800 placeholder:font-normal placeholder:text-slate-400 focus:border-teal-500 focus:outline-none focus:ring-4 focus:ring-teal-500/10 transition-all";

export default function ComplaintForm() {
  const dispatch = useDispatch<AppDispatch>();
  const { form, extractionStatus, reasoning, severityRationale, priorityRationale, lastRawText, saveStatus, saveError, justSavedId } = useSelector((s: RootState) => s.complaint);
  const [triedSave, setTriedSave] = useState(false);
  const set = (field: keyof Form, value: string) => dispatch(setField({ field, value }));

  const missing: (keyof Form)[] = [];
  if (!form.customer_name.trim()) missing.push('customer_name');
  if (!form.product_name.trim()) missing.push('product_name');
  if (!form.detailed_description.trim()) missing.push('detailed_description');
  const valid = missing.length === 0;

  const onSave = () => {
    setTriedSave(true);
    if (!valid) return;
    dispatch(saveComplaint({ rawText: lastRawText }));
  };

  return (
    <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 bg-gradient-to-r from-teal-700 via-teal-600 to-emerald-600 px-5 py-4">
        <div>
          <h2 className="text-[15px] font-extrabold tracking-tight text-white">Log Customer Complaint</h2>
          <p className="text-xs text-teal-100">GMP complaint record · API &amp; FDF · auto-populated by the AI agent</p>
        </div>
        <div className="flex items-center gap-2">
          {extractionStatus === 'succeeded' && <span className="rounded-full bg-white/15 px-2.5 py-1 text-[11px] font-bold text-white ring-1 ring-white/30">✨ AI-populated — review &amp; edit</span>}
          <button onClick={() => { dispatch(resetForm()); setTriedSave(false); }} className="flex items-center gap-1.5 rounded-lg bg-white/15 px-2.5 py-1.5 text-[11px] font-bold text-white ring-1 ring-white/30 hover:bg-white/25">
            <RotateCcw className="h-3.5 w-3.5" /> Reset
          </button>
        </div>
      </div>

      <div className="space-y-5 p-5">
        {/* Section 1 */}
        <fieldset className="rounded-2xl border border-slate-200 bg-slate-50/50 p-4">
          <legend className="px-1 text-[11px] font-extrabold uppercase tracking-widest text-teal-700"><span className="mr-1.5 inline-flex items-center gap-1 rounded-lg bg-teal-700 px-2 py-1 text-white"><Building2 className="h-3 w-3" /> 01 · Origin &amp; Customer Details</span></legend>
          <div className="grid gap-3.5 sm:grid-cols-2">
            <FieldWrap field="complaint_source">
              <select value={form.complaint_source} onChange={(e) => set('complaint_source', e.target.value)} className={inputCls}>
                {SOURCES.map((s) => <option key={s}>{s}</option>)}
              </select>
            </FieldWrap>
            <FieldWrap field="complaint_date">
              <input type="text" value={form.complaint_date} onChange={(e) => set('complaint_date', e.target.value)} placeholder="YYYY-MM-DD" className={inputCls} />
            </FieldWrap>
            <div className="sm:col-span-2">
              <FieldWrap field="customer_name" hint="Distributor / hospital / retailer — as written in the complaint">
                <input value={form.customer_name} onChange={(e) => set('customer_name', e.target.value)} placeholder="e.g. Shree LifeCare Distributors, Ahmedabad" className={`${inputCls} ${triedSave && !form.customer_name.trim() ? 'border-red-400 ring-4 ring-red-500/10' : ''}`} />
              </FieldWrap>
            </div>
          </div>
        </fieldset>

        {/* Section 2 */}
        <fieldset className="rounded-2xl border border-slate-200 bg-slate-50/50 p-4">
          <legend className="px-1 text-[11px] font-extrabold uppercase tracking-widest text-teal-700"><span className="mr-1.5 inline-flex items-center gap-1 rounded-lg bg-teal-700 px-2 py-1 text-white"><PackageSearch className="h-3 w-3" /> 02 · Product &amp; Batch Details</span></legend>
          <div className="grid gap-3.5 sm:grid-cols-2">
            <FieldWrap field="product_name">
              <input value={form.product_name} onChange={(e) => set('product_name', e.target.value)} placeholder="e.g. Paracetamol Tablets IP" className={`${inputCls} ${triedSave && !form.product_name.trim() ? 'border-red-400 ring-4 ring-red-500/10' : ''}`} />
            </FieldWrap>
            <FieldWrap field="product_strength_grade" hint="e.g. 650 mg · IP/USP/EP">
              <input value={form.product_strength_grade} onChange={(e) => set('product_strength_grade', e.target.value)} placeholder="e.g. 650 mg" className={inputCls} />
            </FieldWrap>
            <FieldWrap field="batch_lot_number" hint="Exactly as printed on the pack">
              <input value={form.batch_lot_number} onChange={(e) => set('batch_lot_number', e.target.value)} placeholder="e.g. PTM-2408" className={`${inputCls} font-mono font-bold uppercase`} />
            </FieldWrap>
            <FieldWrap field="quantity_affected">
              <input value={form.quantity_affected} onChange={(e) => set('quantity_affected', e.target.value)} placeholder="e.g. 240 strips (12 boxes)" className={inputCls} />
            </FieldWrap>
            <FieldWrap field="manufacturing_date">
              <input value={form.manufacturing_date} onChange={(e) => set('manufacturing_date', e.target.value)} placeholder="e.g. 03/2025" className={inputCls} />
            </FieldWrap>
            <FieldWrap field="expiry_date">
              <input value={form.expiry_date} onChange={(e) => set('expiry_date', e.target.value)} placeholder="e.g. 02/2027" className={inputCls} />
            </FieldWrap>
          </div>
        </fieldset>

        {/* Section 3 */}
        <fieldset className="rounded-2xl border border-slate-200 bg-slate-50/50 p-4">
          <legend className="px-1 text-[11px] font-extrabold uppercase tracking-widest text-teal-700"><span className="mr-1.5 inline-flex items-center gap-1 rounded-lg bg-teal-700 px-2 py-1 text-white"><ClipboardList className="h-3 w-3" /> 03 · Complaint Details</span></legend>
          <div className="grid gap-3.5">
            <FieldWrap field="complaint_type">
              <select value={form.complaint_type} onChange={(e) => set('complaint_type', e.target.value)} className={inputCls}>
                <option value="">Select complaint type…</option>
                {TYPES.map((t) => <option key={t}>{t}</option>)}
              </select>
            </FieldWrap>
            <FieldWrap field="detailed_description" hint="Factual 2–4 sentences: what was seen, where, how many units, patient impact">
              <textarea value={form.detailed_description} onChange={(e) => set('detailed_description', e.target.value)} rows={5} placeholder="Describe the defect as reported…" className={`${inputCls} custom-scroll resize-y leading-relaxed ${triedSave && !form.detailed_description.trim() ? 'border-red-400 ring-4 ring-red-500/10' : ''}`} />
            </FieldWrap>
          </div>
        </fieldset>

        {/* Section 4 */}
        <fieldset className="rounded-2xl border border-slate-200 bg-slate-50/50 p-4">
          <legend className="px-1 text-[11px] font-extrabold uppercase tracking-widest text-teal-700"><span className="mr-1.5 inline-flex items-center gap-1 rounded-lg bg-teal-700 px-2 py-1 text-white"><Gauge className="h-3 w-3" /> 04 · Initial Assessment &amp; Priority</span></legend>
          <div className="grid gap-3.5 sm:grid-cols-2">
            <div className="sm:col-span-2">
              <p className="mb-1.5 text-[12.5px] font-bold text-slate-700">Initial Severity</p>
              <div className="grid grid-cols-3 gap-2">
                {SEVERITIES.map((s) => (
                  <button key={s.v} type="button" onClick={() => { set('initial_severity', s.v); set('priority', s.v === 'Critical' ? 'P0 - Critical' : s.v === 'Major' ? 'P1 - High' : 'P2 - Medium'); }} className={`rounded-xl border-2 px-2 py-2.5 text-center transition-all ${form.initial_severity === s.v ? s.cls + ' shadow-md scale-[1.02]' : 'border-slate-200 bg-white text-slate-500 hover:border-slate-300'}`}>
                    <span className={`mx-auto mb-1 block h-2 w-2 rounded-full ${s.dot}`} />
                    <span className="block text-[13px] font-extrabold">{s.v}</span>
                    <span className="block text-[10px] font-semibold opacity-80">{s.desc}</span>
                  </button>
                ))}
              </div>
            </div>
            <div className="sm:col-span-2">
              <p className="mb-1.5 text-[12.5px] font-bold text-slate-700">Priority (SOP SLA)</p>
              <div className="flex flex-wrap gap-2">
                {PRIORITIES.map((p) => (
                  <button key={p} type="button" onClick={() => set('priority', p)} className={`rounded-full px-3.5 py-1.5 text-xs font-extrabold ring-2 transition-all ${form.priority === p ? 'bg-slate-900 text-white ring-slate-900' : 'bg-white text-slate-500 ring-slate-200 hover:ring-slate-400'}`}>{p}</button>
                ))}
              </div>
              <p className="mt-1.5 text-[11px] text-slate-400">P0 Critical → 24h containment · P1 High → 7-day investigation · P2 Medium → 30-day closure</p>
            </div>
          </div>
          {(severityRationale || priorityRationale || reasoning) && (
            <div className="mt-3.5 space-y-2 rounded-xl bg-slate-900 p-3.5 text-[12px] leading-relaxed text-slate-300">
              {severityRationale && <p><span className="font-bold text-amber-300">Severity:</span> {severityRationale}</p>}
              {priorityRationale && <p><span className="font-bold text-teal-300">Priority:</span> {priorityRationale}</p>}
              {reasoning && <p className="border-t border-white/10 pt-2 text-slate-400"><Info className="mr-1 inline h-3.5 w-3.5" />{reasoning}</p>}
            </div>
          )}
        </fieldset>

        {triedSave && !valid && (
          <div className="rounded-xl bg-red-50 p-3 text-xs font-bold text-red-700 ring-1 ring-red-200">
            Required before saving: {missing.map((m) => FIELD_LABELS[m]).join(' · ')}
          </div>
        )}
        {saveError && <div className="rounded-xl bg-red-50 p-3 text-xs font-bold text-red-700 ring-1 ring-red-200">{saveError}</div>}
        {saveStatus === 'succeeded' && justSavedId && (
          <div className="slide-up flex items-center gap-2 rounded-xl bg-emerald-50 p-3 text-xs font-bold text-emerald-800 ring-1 ring-emerald-200">
            <CheckCircle2 className="h-4 w-4" /> Complaint #{justSavedId} saved to the register (SQLAlchemy → complaint_logs).
          </div>
        )}

        <div className="flex flex-col gap-2 sm:flex-row">
          <button onClick={onSave} disabled={saveStatus === 'loading'} className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-slate-900 px-4 py-3 text-sm font-extrabold text-white shadow-md transition-all hover:bg-slate-700 disabled:opacity-50">
            {saveStatus === 'loading' ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
            {saveStatus === 'loading' ? 'Saving to database…' : 'Save Complaint to Register'}
          </button>
          <button onClick={() => { dispatch(resetForm()); setTriedSave(false); }} className="rounded-xl border border-slate-200 px-4 py-3 text-sm font-bold text-slate-600 hover:bg-slate-50">Clear form</button>
        </div>
      </div>
    </section>
  );
}
