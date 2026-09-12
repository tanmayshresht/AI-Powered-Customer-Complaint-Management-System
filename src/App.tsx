import { useEffect } from 'react';
import { Provider, useDispatch, useSelector } from 'react-redux';
import { FlaskConical, LayoutDashboard, Table2, Code2, ShieldCheck, Sparkles } from 'lucide-react';
import { store, type AppDispatch, type RootState } from './store/store';
import { fetchComplaints, setActiveTab, type TabId } from './store/complaintSlice';
import IntakePanel from './components/IntakePanel';
import ComplaintForm from './components/ComplaintForm';
import Register from './components/Register';
import Analytics from './components/Analytics';
import Blueprint from './components/Blueprint';

const TABS: { id: TabId; label: string; icon: any; desc: string }[] = [
  { id: 'workspace', label: 'Intake Workspace', icon: LayoutDashboard, desc: 'Split-screen extraction → form' },
  { id: 'register', label: 'Complaint Register', icon: Table2, desc: 'All logged complaints' },
  { id: 'analytics', label: 'QMS Analytics', icon: FlaskConical, desc: 'Severity & priority trends' },
  { id: 'blueprint', label: 'Backend Blueprint', icon: Code2, desc: 'FastAPI + LangGraph code' },
];

function Shell() {
  const dispatch = useDispatch<AppDispatch>();
  const activeTab = useSelector((s: RootState) => s.complaint.activeTab);
  const register = useSelector((s: RootState) => s.complaint.register);

  useEffect(() => {
    dispatch(fetchComplaints());
  }, [dispatch]);

  const openCount = register.filter((r: any) => r.status !== 'Closed').length;
  const criticalCount = register.filter((r: any) => r.initial_severity === 'Critical' && r.status !== 'Closed').length;

  return (
    <div className="min-h-screen flex flex-col">
      {/* Top bar */}
      <header className="sticky top-0 z-40 border-b border-slate-200/80 bg-white/90 backdrop-blur-xl">
        <div className="mx-auto max-w-[1440px] px-4 sm:px-6">
          <div className="flex items-center gap-3 py-3">
            <div className="flex items-center gap-3 min-w-0">
              <div className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-gradient-to-br from-teal-600 to-emerald-700 text-white shadow-lg shadow-teal-600/25">
                <ShieldCheck className="h-5 w-5" />
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <h1 className="truncate text-[15px] font-800 font-extrabold tracking-tight text-slate-900 sm:text-base">
                    PharmaQMS <span className="text-teal-700">·</span> <span className="font-semibold">AI Complaint Manager</span>
                  </h1>
                  <span className="hidden items-center gap-1 rounded-full bg-teal-50 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-teal-700 ring-1 ring-teal-200 sm:inline-flex">
                    <Sparkles className="h-3 w-3" /> API · FDF · GMP
                  </span>
                </div>
                <p className="truncate text-xs text-slate-500">LangGraph + Groq extraction · React + Redux · Postgres / MySQL</p>
              </div>
            </div>
            <div className="ml-auto flex items-center gap-2">
              <div className="hidden items-center gap-2 rounded-full bg-slate-100 px-3 py-1.5 text-xs font-semibold text-slate-600 md:flex">
                <span className={`h-2 w-2 rounded-full ${criticalCount > 0 ? 'bg-red-500 pulse-dot' : 'bg-emerald-500'}`} />
                {register.length} logged · {openCount} open{criticalCount > 0 ? ` · ${criticalCount} critical` : ''}
              </div>
              <a href="#blueprint" onClick={(e) => { e.preventDefault(); dispatch(setActiveTab('blueprint')); window.scrollTo({ top: 0, behavior: 'smooth' }); }} className="hidden rounded-lg bg-slate-900 px-3.5 py-2 text-xs font-bold text-white hover:bg-slate-700 sm:block">
                View FastAPI code
              </a>
            </div>
          </div>
          {/* Tabs */}
          <nav className="flex gap-1 overflow-x-auto pb-2 custom-scroll">
            {TABS.map((t) => {
              const active = activeTab === t.id;
              const Icon = t.icon;
              return (
                <button
                  key={t.id}
                  onClick={() => dispatch(setActiveTab(t.id))}
                  className={`flex shrink-0 items-center gap-2 rounded-xl px-3.5 py-2 text-[13px] font-semibold transition-all ${active ? 'bg-slate-900 text-white shadow-md' : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'}`}
                >
                  <Icon className="h-4 w-4" />
                  {t.label}
                  {t.id === 'register' && register.length > 0 && (
                    <span className={`rounded-full px-1.5 py-0.5 text-[10px] font-extrabold ${active ? 'bg-white/20 text-white' : 'bg-teal-100 text-teal-800'}`}>{register.length}</span>
                  )}
                </button>
              );
            })}
          </nav>
        </div>
      </header>

      <main className="mx-auto w-full max-w-[1440px] flex-1 px-4 py-5 sm:px-6">
        {activeTab === 'workspace' && (
          <div className="grid items-start gap-5 xl:grid-cols-[1.12fr_.88fr]">
            <ComplaintForm />
            <IntakePanel />
          </div>
        )}
        {activeTab === 'register' && <Register />}
        {activeTab === 'analytics' && <Analytics />}
        {activeTab === 'blueprint' && <Blueprint />}
      </main>

      <footer className="border-t border-slate-200 bg-white/70 py-4">
        <div className="mx-auto flex max-w-[1440px] flex-col items-center justify-between gap-2 px-6 text-xs text-slate-500 sm:flex-row">
          <p><span className="font-bold text-slate-700">PharmaQMS assignment build</span> — FastAPI + LangGraph (Groq llama-3.3-70b / gemma2-9b-it) · React + Redux (Inter) · SQLAlchemy on MySQL/Postgres</p>
          <p className="font-mono text-[11px]">POST /api/extract → 13 GMP fields → POST /api/complaints</p>
        </div>
      </footer>
    </div>
  );
}

export default function App() {
  return (
    <Provider store={store}>
      <Shell />
    </Provider>
  );
}
