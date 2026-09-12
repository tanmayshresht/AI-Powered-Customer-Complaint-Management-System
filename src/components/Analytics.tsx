import { useEffect, useState } from 'react';
import { Loader2, TriangleAlert, Timer, FolderOpen } from 'lucide-react';

interface Stats { total: number; open: number; criticalOpen: number; recent7d: number; bySeverity: Record<string, number>; byPriority: Record<string, number>; byType: Record<string, number>; byStatus: Record<string, number>; }

function Bar({ label, value, max, color }: { label: string; value: number; max: number; color: string }) {
  return (
    <div>
      <div className="mb-1 flex justify-between text-xs"><span className="font-bold text-slate-600">{label}</span><span className="font-mono font-bold text-slate-800">{value}</span></div>
      <div className="h-2 overflow-hidden rounded-full bg-slate-100"><div className={`h-full rounded-full ${color} transition-all`} style={{ width: `${max ? Math.round((value / max) * 100) : 0}%` }} /></div>
    </div>
  );
}

export default function Analytics() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const r = await fetch('/api/stats');
        const j = await r.json();
        if (!r.ok) throw new Error(j?.error || 'Failed');
        setStats(j);
      } catch (e: any) { setErr(e.message); } finally { setLoading(false); }
    })();
  }, []);

  if (loading) return <div className="grid place-items-center rounded-2xl border border-slate-200 bg-white py-16 text-slate-400"><Loader2 className="mb-2 h-6 w-6 animate-spin" /><p className="text-sm font-semibold">Computing QMS metrics…</p></div>;
  if (err || !stats) return <div className="rounded-2xl border border-red-200 bg-red-50 p-6 text-sm font-bold text-red-700">{err || 'No data'}</div>;

  const maxSev = Math.max(1, ...Object.values(stats.bySeverity));
  const maxPri = Math.max(1, ...Object.values(stats.byPriority));
  const maxType = Math.max(1, ...Object.values(stats.byType));

  return (
    <div className="space-y-4">
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {[
          { icon: FolderOpen, label: 'Total complaints', v: stats.total, sub: `${stats.recent7d} in last 7 days`, bg: 'from-slate-800 to-slate-900' },
          { icon: Timer, label: 'Open investigations', v: stats.open, sub: 'Across all severities', bg: 'from-blue-600 to-indigo-600' },
          { icon: TriangleAlert, label: 'Critical open', v: stats.criticalOpen, sub: 'P0 — 24h containment', bg: 'from-red-600 to-rose-600' },
          { icon: TriangleAlert, label: 'Major share', v: `${stats.total ? Math.round(((stats.bySeverity.Major || 0) / stats.total) * 100) : 0}%`, sub: `${stats.bySeverity.Major || 0} major records`, bg: 'from-amber-500 to-orange-600' },
        ].map((c, i) => (
          <div key={i} className={`rounded-2xl bg-gradient-to-br ${c.bg} p-4 text-white shadow-lg`}>
            <c.icon className="mb-2 h-5 w-5 opacity-80" />
            <p className="text-2xl font-extrabold tracking-tight">{c.v}</p>
            <p className="text-xs font-bold opacity-90">{c.label}</p>
            <p className="text-[11px] opacity-70">{c.sub}</p>
          </div>
        ))}
      </div>
      <div className="grid gap-4 lg:grid-cols-3">
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <h3 className="mb-3 text-[13px] font-extrabold text-slate-800">By severity (GMP matrix)</h3>
          <div className="space-y-3">
            <Bar label="Critical — patient safety" value={stats.bySeverity.Critical || 0} max={maxSev} color="bg-red-500" />
            <Bar label="Major — quality / GMP" value={stats.bySeverity.Major || 0} max={maxSev} color="bg-amber-500" />
            <Bar label="Minor — cosmetic / isolated" value={stats.bySeverity.Minor || 0} max={maxSev} color="bg-emerald-500" />
          </div>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <h3 className="mb-3 text-[13px] font-extrabold text-slate-800">By priority (SOP SLA)</h3>
          <div className="space-y-3">
            {Object.entries(stats.byPriority).sort().map(([k, v]) => <Bar key={k} label={k} value={v} max={maxPri} color={k.includes('P0') ? 'bg-red-500' : k.includes('P1') ? 'bg-orange-500' : 'bg-teal-500'} />)}
            {Object.keys(stats.byPriority).length === 0 && <p className="text-xs text-slate-400">No data yet.</p>}
          </div>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <h3 className="mb-3 text-[13px] font-extrabold text-slate-800">By complaint type</h3>
          <div className="space-y-3">
            {Object.entries(stats.byType).sort((a, b) => b[1] - a[1]).slice(0, 6).map(([k, v]) => <Bar key={k} label={k} value={v} max={maxType} color="bg-indigo-500" />)}
            {Object.keys(stats.byType).length === 0 && <p className="text-xs text-slate-400">No data yet.</p>}
          </div>
        </div>
      </div>
      <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <h3 className="mb-3 text-[13px] font-extrabold text-slate-800">By workflow status</h3>
        <div className="flex flex-wrap gap-2">
          {Object.entries(stats.byStatus).map(([k, v]) => (
            <span key={k} className="rounded-full bg-slate-100 px-3 py-1.5 text-xs font-bold text-slate-700 ring-1 ring-slate-200">{k} · <span className="font-mono">{v}</span></span>
          ))}
        </div>
        <p className="mt-3 text-[11px] leading-relaxed text-slate-400">SOP flow: Open → Under Investigation → CAPA In Progress → Closed. Critical (P0) complaints require containment + PV filing within 24h; Major (P1) within 7 days.</p>
      </div>
    </div>
  );
}
