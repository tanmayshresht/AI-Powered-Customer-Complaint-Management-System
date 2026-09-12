import { useMemo, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Search, Trash2, Eye, X, Loader2, ChevronRight, AlertOctagon, ArrowRight } from 'lucide-react';
import { setSearch, setSeverityFilter, setPriorityFilter, setTypeFilter, setSelected, deleteComplaint, advanceStatus } from '../store/complaintSlice';
import type { AppDispatch, RootState } from '../store/store';

const NEXT: Record<string, string | null> = { 'Open': 'Under Investigation', 'Under Investigation': 'CAPA In Progress', 'CAPA In Progress': 'Closed', 'Closed': null };

function sevBadge(s: string) {
  if (s === 'Critical') return 'bg-red-100 text-red-700 ring-red-200';
  if (s === 'Major') return 'bg-amber-100 text-amber-800 ring-amber-200';
  return 'bg-emerald-100 text-emerald-700 ring-emerald-200';
}

export default function Register() {
  const dispatch = useDispatch<AppDispatch>();
  const { register, registerLoading, registerError, search, severityFilter, priorityFilter, typeFilter, selected } = useSelector((s: RootState) => s.complaint);
  const [confirmDelete, setConfirmDelete] = useState<number | null>(null);

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return register.filter((r) => {
      if (severityFilter && r.initial_severity !== severityFilter) return false;
      if (priorityFilter && r.priority !== priorityFilter) return false;
      if (typeFilter && r.complaint_type !== typeFilter) return false;
      if (!q) return true;
      return [r.customer_name, r.product_name, r.batch_lot_number, r.complaint_type, r.detailed_description].filter(Boolean).join(' ').toLowerCase().includes(q);
    });
  }, [register, search, severityFilter, priorityFilter, typeFilter]);

  const types = useMemo(() => Array.from(new Set(register.map((r) => r.complaint_type).filter(Boolean))), [register]);

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm lg:flex-row lg:items-center">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input value={search} onChange={(e) => dispatch(setSearch(e.target.value))} placeholder="Search customer, product, batch, defect…" className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2.5 pl-9 pr-3 text-[13.5px] focus:border-teal-500 focus:bg-white focus:outline-none focus:ring-4 focus:ring-teal-500/10" />
        </div>
        <div className="flex flex-wrap gap-2">
          <select value={severityFilter} onChange={(e) => dispatch(setSeverityFilter(e.target.value))} className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-bold text-slate-600">
            <option value="">All severities</option><option>Critical</option><option>Major</option><option>Minor</option>
          </select>
          <select value={priorityFilter} onChange={(e) => dispatch(setPriorityFilter(e.target.value))} className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-bold text-slate-600">
            <option value="">All priorities</option><option>P0 - Critical</option><option>P1 - High</option><option>P2 - Medium</option><option>P3 - Low</option>
          </select>
          <select value={typeFilter} onChange={(e) => dispatch(setTypeFilter(e.target.value))} className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-bold text-slate-600">
            <option value="">All types</option>{types.map((t) => <option key={t}>{t}</option>)}
          </select>
        </div>
      </div>

      {registerLoading && register.length === 0 ? (
        <div className="grid place-items-center rounded-2xl border border-slate-200 bg-white py-16 text-slate-400">
          <Loader2 className="mb-2 h-6 w-6 animate-spin" /><p className="text-sm font-semibold">Loading complaint register…</p>
        </div>
      ) : registerError && register.length === 0 ? (
        <div className="rounded-2xl border border-red-200 bg-red-50 p-6 text-center text-sm font-bold text-red-700">{registerError}</div>
      ) : filtered.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-10 text-center">
          <AlertOctagon className="mx-auto mb-2 h-6 w-6 text-slate-300" />
          <p className="text-sm font-bold text-slate-600">No complaints match</p>
          <p className="text-xs text-slate-400">Run an AI extraction in the workspace and save it to grow this register.</p>
        </div>
      ) : (
        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="hidden grid-cols-[64px_1.3fr_1.2fr_.9fr_.9fr_.8fr_.9fr_120px] gap-2 border-b border-slate-100 bg-slate-50 px-4 py-2.5 text-[10.5px] font-extrabold uppercase tracking-wider text-slate-400 lg:grid">
            <span>ID</span><span>Customer</span><span>Product / Batch</span><span>Type</span><span>Severity</span><span>Priority</span><span>Status</span><span className="text-right">Actions</span>
          </div>
          {filtered.map((r) => (
            <div key={r.id} className="grid gap-2 border-b border-slate-100 px-4 py-3 transition-colors last:border-0 hover:bg-teal-50/40 lg:grid-cols-[64px_1.3fr_1.2fr_.9fr_.9fr_.8fr_.9fr_120px] lg:items-center">
              <span className="font-mono text-xs font-bold text-slate-400">#{r.id}</span>
              <div className="min-w-0"><p className="truncate text-[13px] font-bold text-slate-800">{r.customer_name || '—'}</p><p className="truncate text-[11px] text-slate-400">{r.complaint_source} · {r.complaint_date}</p></div>
              <div className="min-w-0"><p className="truncate text-[13px] font-semibold text-slate-700">{r.product_name} {r.product_strength_grade && <span className="text-slate-400">· {r.product_strength_grade}</span>}</p><p className="font-mono text-[11px] font-bold text-teal-700">{r.batch_lot_number || 'no batch'}</p></div>
              <span className="truncate text-xs font-semibold text-slate-600">{r.complaint_type}</span>
              <span><span className={`inline-block rounded-full px-2 py-0.5 text-[11px] font-extrabold ring-1 ${sevBadge(r.initial_severity)}`}>{r.initial_severity}</span></span>
              <span className="font-mono text-[11px] font-bold text-slate-600">{r.priority}</span>
              <span><span className={`inline-block rounded-full px-2 py-0.5 text-[11px] font-bold ring-1 ${r.status === 'Closed' ? 'bg-slate-100 text-slate-500 ring-slate-200' : r.status === 'Open' ? 'bg-blue-50 text-blue-700 ring-blue-200' : 'bg-violet-50 text-violet-700 ring-violet-200'}`}>{r.status}</span></span>
              <span className="flex justify-end gap-1.5">
                <button onClick={() => dispatch(setSelected(r))} className="grid h-8 w-8 place-items-center rounded-lg border border-slate-200 text-slate-500 hover:border-teal-400 hover:text-teal-700"><Eye className="h-4 w-4" /></button>
                <button onClick={() => setConfirmDelete(r.id)} className="grid h-8 w-8 place-items-center rounded-lg border border-slate-200 text-slate-400 hover:border-red-300 hover:text-red-600"><Trash2 className="h-4 w-4" /></button>
              </span>
            </div>
          ))}
        </div>
      )}

      {confirmDelete != null && (
        <div className="fixed inset-0 z-50 grid place-items-center bg-slate-900/50 p-4 backdrop-blur-sm" onClick={() => setConfirmDelete(null)}>
          <div className="w-full max-w-sm rounded-2xl bg-white p-5 shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-sm font-extrabold text-slate-800">Delete complaint #{confirmDelete}?</h3>
            <p className="mt-1 text-xs text-slate-500">This removes the record from complaint_logs permanently (GMP: prefer status = Closed with rationale).</p>
            <div className="mt-4 flex gap-2">
              <button onClick={() => setConfirmDelete(null)} className="flex-1 rounded-xl border border-slate-200 py-2 text-xs font-bold text-slate-600">Cancel</button>
              <button onClick={() => { dispatch(deleteComplaint(confirmDelete)); setConfirmDelete(null); }} className="flex-1 rounded-xl bg-red-600 py-2 text-xs font-extrabold text-white hover:bg-red-700">Delete</button>
            </div>
          </div>
        </div>
      )}

      {selected && (
        <div className="fixed inset-0 z-50 flex items-stretch justify-end bg-slate-900/50 backdrop-blur-sm" onClick={() => dispatch(setSelected(null))}>
          <div className="custom-scroll w-full max-w-lg overflow-y-auto bg-white p-6 shadow-2xl slide-up" onClick={(e) => e.stopPropagation()}>
            <div className="mb-4 flex items-start justify-between">
              <div>
                <p className="font-mono text-xs font-bold text-teal-700">COMPLAINT #{selected.id} · {selected.status}</p>
                <h3 className="mt-1 text-lg font-extrabold tracking-tight text-slate-900">{selected.product_name}</h3>
                <p className="text-xs text-slate-500">{selected.customer_name} · Batch <span className="font-mono font-bold text-slate-700">{selected.batch_lot_number}</span></p>
              </div>
              <button onClick={() => dispatch(setSelected(null))} className="grid h-8 w-8 place-items-center rounded-lg bg-slate-100 text-slate-500 hover:bg-slate-200"><X className="h-4 w-4" /></button>
            </div>
            <div className="mb-4 flex flex-wrap gap-1.5">
              <span className={`rounded-full px-2.5 py-1 text-[11px] font-extrabold ring-1 ${sevBadge(selected.initial_severity)}`}>{selected.initial_severity}</span>
              <span className="rounded-full bg-slate-900 px-2.5 py-1 font-mono text-[11px] font-bold text-white">{selected.priority}</span>
              <span className="rounded-full bg-slate-100 px-2.5 py-1 text-[11px] font-bold text-slate-600 ring-1 ring-slate-200">{selected.complaint_type}</span>
            </div>
            <dl className="grid grid-cols-2 gap-2.5 text-[12px]">
              {[['Source', selected.complaint_source], ['Complaint date', selected.complaint_date], ['Strength / Grade', selected.product_strength_grade], ['Quantity', selected.quantity_affected], ['Mfg date', selected.manufacturing_date], ['Expiry', selected.expiry_date]].map(([k, v]) => (
                <div key={k} className="rounded-xl bg-slate-50 p-2.5 ring-1 ring-slate-100"><dt className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400">{k}</dt><dd className="mt-0.5 font-bold text-slate-700">{v || '—'}</dd></div>
              ))}
            </dl>
            <div className="mt-3 rounded-xl bg-slate-50 p-3 text-[12.5px] leading-relaxed text-slate-700 ring-1 ring-slate-100">{selected.detailed_description}</div>
            {selected.overall_confidence != null && <p className="mt-2 font-mono text-[11px] text-slate-400">AI confidence {Math.round(selected.overall_confidence * 100)}% · {selected.ai_summary?.slice(0, 160)}</p>}
            <div className="mt-5 flex gap-2">
              {selected.status !== 'Closed' && NEXT[selected.status] && (
                <button onClick={() => dispatch(advanceStatus({ id: selected.id, status: NEXT[selected.status]! }))} className="flex flex-1 items-center justify-center gap-1.5 rounded-xl bg-teal-600 py-2.5 text-xs font-extrabold text-white hover:bg-teal-700">
                  Advance to {NEXT[selected.status]} <ArrowRight className="h-3.5 w-3.5" />
                </button>
              )}
              <button onClick={() => dispatch(setSelected(null))} className="flex items-center gap-1 rounded-xl border border-slate-200 px-4 py-2.5 text-xs font-bold text-slate-600 hover:bg-slate-50">Close <ChevronRight className="h-3.5 w-3.5" /></button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
