import { useRef, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { CloudUpload, FileText, Loader2, Sparkles, Eraser, FlaskConical, ChevronRight, CheckCircle2, AlertTriangle, FileUp } from 'lucide-react';
import { runExtraction, clearExtraction } from '../store/complaintSlice';
import type { AppDispatch, RootState } from '../store/store';
import { SAMPLE_COMPLAINTS } from '../data/samples';
import AssistantBox from './AssistantBox';

const PIPELINE_STEPS = [
  { node: 'ingest', label: 'Ingest file / text', desc: 'FastAPI UploadFile → raw text' },
  { node: 'preprocess', label: 'Preprocess', desc: 'Clean + preserve batch/date entities' },
  { node: 'extract', label: 'LangGraph · ChatGroq', desc: 'llama-3.3-70b → 13-field JSON' },
  { node: 'assess', label: 'Severity matrix', desc: 'Critical / Major / Minor → P0–P2' },
  { node: 'validate', label: 'Validate + populate', desc: 'Redux fills the form' },
];

export default function IntakePanel() {
  const dispatch = useDispatch<AppDispatch>();
  const { extractionStatus, extractionError, overallConfidence, provider, model, trace } = useSelector((s: RootState) => s.complaint);
  const [pastedText, setPastedText] = useState('');
  const [fileName, setFileName] = useState('');
  const [fileType, setFileType] = useState('');
  const [dragOver, setDragOver] = useState(false);
  const [fileNote, setFileNote] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);
  const loading = extractionStatus === 'loading';

  const readFile = (f: File) => {
    const ext = '.' + (f.name.split('.').pop() || '').toLowerCase();
    setFileName(f.name);
    setFileType(ext.replace('.', '').toUpperCase() || f.type || 'TXT');
    setFileNote('');
    if (['.txt', '.eml', '.md', '.csv', '.log'].includes(ext)) {
      const r = new FileReader();
      r.onload = () => {
        const t = String(r.result || '');
        setPastedText((prev) => (prev ? prev + '\n\n' + t : t));
        setFileNote(`Read ${t.length.toLocaleString()} characters from ${f.name}. Review below, then run extraction.`);
      };
      r.readAsText(f);
    } else if (ext === '.pdf' || ext === '.docx' || ext === '.doc') {
      // Browser demo cannot parse binary PDF/DOCX — FastAPI backend does (pypdf/python-docx).
      // Keep filename for the trace and ask user to paste the text content.
      setFileNote(`${f.name} selected (${(f.size / 1024).toFixed(1)} KB). The Python backend parses ${ext} with pypdf/python-docx — in this live demo, paste the document text below and extraction will attribute it to ${f.name}.`);
    } else {
      const r = new FileReader();
      r.onload = () => setPastedText((prev) => (prev ? prev + '\n\n' + String(r.result || '') : String(r.result || '')));
      try { r.readAsText(f); } catch { setFileNote('Could not read file — please paste the text.'); }
    }
  };

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const f = e.dataTransfer.files?.[0];
    if (f) readFile(f);
  };

  const run = () => {
    const text = pastedText.trim();
    if (text.length < 20) return;
    dispatch(runExtraction({ text, fileName: fileName || 'pasted-text.txt', fileType: fileType || 'TXT' }));
  };

  return (
    <div className="flex flex-col gap-5">
      {/* Upload + paste card */}
      <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="flex items-center justify-between border-b border-slate-100 bg-gradient-to-r from-slate-900 to-slate-800 px-5 py-3.5">
          <div className="flex items-center gap-2 text-white">
            <CloudUpload className="h-4.5 w-4.5 h-5 w-5" />
            <h2 className="text-sm font-bold tracking-tight">AI Intake — Upload or Paste</h2>
          </div>
          <span className="rounded-full bg-white/10 px-2.5 py-1 font-mono text-[10px] font-semibold text-teal-200 ring-1 ring-white/20">PDF · TXT · DOCX · EML</span>
        </div>

        <div className="space-y-4 p-5">
          <div
            onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
            onDragLeave={() => setDragOver(false)}
            onDrop={onDrop}
            onClick={() => inputRef.current?.click()}
            className={`group flex cursor-pointer flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed px-4 py-7 text-center transition-all ${dragOver ? 'border-teal-500 bg-teal-50' : 'border-slate-200 bg-slate-50/60 hover:border-teal-400 hover:bg-teal-50/50'}`}
          >
            <div className="grid h-11 w-11 place-items-center rounded-full bg-slate-900 text-white shadow-md group-hover:scale-105 transition-transform">
              <FileUp className="h-5 w-5" />
            </div>
            <p className="text-sm font-bold text-slate-800">{fileName ? <span className="text-teal-700">{fileName}</span> : 'Drop complaint file here, or click to browse'}</p>
            <p className="text-xs text-slate-500">FastAPI <span className="font-mono font-semibold">POST /api/extract</span> accepts PDF / TXT / DOCX / EML — parsed with pypdf · python-docx · email</p>
            <input ref={inputRef} type="file" accept=".pdf,.txt,.docx,.doc,.eml,.md" className="hidden" onChange={(e) => { const f = e.target.files?.[0]; if (f) readFile(f); e.target.value = ''; }} />
          </div>
          {fileNote && (
            <div className="flex gap-2 rounded-xl bg-amber-50 p-3 text-xs leading-relaxed text-amber-800 ring-1 ring-amber-200">
              <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
              <p>{fileNote}</p>
            </div>
          )}

          <div>
            <div className="mb-2 flex items-center justify-between">
              <label className="flex items-center gap-1.5 text-[13px] font-bold text-slate-700"><FileText className="h-4 w-4 text-teal-700" /> Complaint text</label>
              <div className="flex items-center gap-2">
                <span className="font-mono text-[11px] text-slate-400">{pastedText.length.toLocaleString()} chars</span>
                {pastedText && (
                  <button onClick={() => { setPastedText(''); setFileName(''); setFileType(''); setFileNote(''); dispatch(clearExtraction()); }} className="flex items-center gap-1 rounded-lg px-2 py-1 text-[11px] font-bold text-slate-500 hover:bg-slate-100 hover:text-slate-800">
                    <Eraser className="h-3 w-3" /> Clear
                  </button>
                )}
              </div>
            </div>
            <textarea
              value={pastedText}
              onChange={(e) => setPastedText(e.target.value)}
              rows={9}
              placeholder={"Paste the distributor email, hospital phone log, or QC complaint here…\n\nTip: one click on a sample below fills a realistic GMP complaint."}
              className="custom-scroll w-full resize-y rounded-xl border border-slate-200 bg-slate-50/50 p-3.5 font-mono text-[12.5px] leading-relaxed text-slate-800 placeholder:font-sans placeholder:text-slate-400 focus:border-teal-500 focus:bg-white focus:outline-none focus:ring-4 focus:ring-teal-500/10"
            />
          </div>

          <div>
            <p className="mb-2 text-[11px] font-bold uppercase tracking-wider text-slate-400">Try a realistic sample</p>
            <div className="grid gap-2 sm:grid-cols-3">
              {SAMPLE_COMPLAINTS.map((s) => (
                <button
                  key={s.id}
                  onClick={() => { setPastedText(s.text); setFileName(s.fileName); setFileType(s.fileName.split('.').pop()?.toUpperCase() || 'TXT'); setFileNote(`Sample loaded: ${s.label}.`); dispatch(clearExtraction()); }}
                  className="rounded-xl border border-slate-200 bg-white p-2.5 text-left transition-all hover:-translate-y-0.5 hover:border-teal-400 hover:shadow-md"
                >
                  <span className="mb-1 inline-block rounded-full bg-teal-50 px-1.5 py-0.5 text-[9px] font-extrabold uppercase tracking-wide text-teal-700 ring-1 ring-teal-200">{s.tag}</span>
                  <span className="block text-[11.5px] font-bold leading-snug text-slate-700">{s.label}</span>
                </button>
              ))}
            </div>
          </div>

          {extractionError && (
            <div className="rounded-xl bg-red-50 p-3 text-xs font-semibold text-red-700 ring-1 ring-red-200">{extractionError}</div>
          )}

          <button
            onClick={run}
            disabled={loading || pastedText.trim().length < 20}
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-teal-600 to-emerald-600 px-4 py-3 text-sm font-extrabold text-white shadow-lg shadow-teal-600/25 transition-all hover:shadow-xl hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-40 disabled:shadow-none"
          >
            {loading ? <><Loader2 className="h-4 w-4 animate-spin" /> Extracting with LangGraph + Groq…</> : <><Sparkles className="h-4 w-4" /> Run AI Extraction → Auto-fill form</>}
          </button>
          <p className="text-center text-[11px] text-slate-400">Groq <span className="font-mono font-semibold">llama-3.3-70b-versatile</span> (fallback gemma2-9b-it) · deterministic rules fallback if the LLM is unreachable</p>
        </div>
      </section>

      {/* Progress indicator */}
      <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="mb-3 flex items-center justify-between">
          <h3 className="flex items-center gap-1.5 text-[13px] font-extrabold text-slate-800"><FlaskConical className="h-4 w-4 text-teal-700" /> Extraction progress</h3>
          {extractionStatus === 'succeeded' && (
            <span className="flex items-center gap-1.5 rounded-full bg-emerald-50 px-2.5 py-1 text-[11px] font-extrabold text-emerald-700 ring-1 ring-emerald-200">
              <CheckCircle2 className="h-3.5 w-3.5" /> {Math.round((overallConfidence ?? 0) * 100)}% overall · {provider}
            </span>
          )}
        </div>
        <ol className="space-y-0">
          {PIPELINE_STEPS.map((s, i) => {
            const done = extractionStatus === 'succeeded';
            const active = loading;
            const reached = done || active;
            return (
              <li key={s.node} className="relative flex gap-3 pb-4 last:pb-0">
                {i < PIPELINE_STEPS.length - 1 && <span className={`absolute left-[13px] top-7 h-[calc(100%-24px)] w-0.5 ${done ? 'bg-emerald-300' : active ? 'bg-teal-200' : 'bg-slate-150 bg-slate-200'}`} />}
                <span className={`z-10 grid h-7 w-7 shrink-0 place-items-center rounded-full text-[11px] font-extrabold ring-4 ring-white ${done ? 'bg-emerald-500 text-white' : active ? 'bg-teal-600 text-white' : 'bg-slate-200 text-slate-500'}`}>
                  {active && !done ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : done ? <CheckCircle2 className="h-4 w-4" /> : i + 1}
                </span>
                <div className="min-w-0 pt-0.5">
                  <p className={`text-[13px] font-bold ${done || active ? 'text-slate-800' : 'text-slate-400'}`}>{s.label}</p>
                  <p className="truncate text-xs text-slate-400">{s.desc}</p>
                  {active && i === 2 && <p className="mt-1 font-mono text-[11px] text-teal-600">ChatGroq · {model || 'llama-3.3-70b-versatile'} · temp 0.1 · json_object…</p>}
                </div>
              </li>
            );
          })}
        </ol>
        {trace.length > 0 && (
          <div className="mt-4 rounded-xl bg-slate-900 p-3.5 font-mono text-[11px] leading-relaxed text-slate-300">
            <p className="mb-2 text-[10px] font-bold uppercase tracking-widest text-teal-300">LangGraph trace · {model}</p>
            {trace.map((t, i) => (
              <p key={i} className="flex gap-2"><ChevronRight className="mt-0.5 h-3 w-3 shrink-0 text-teal-400" /><span><span className="font-bold text-white">[{t.node}]</span> {t.detail}</span></p>
            ))}
          </div>
        )}
      </section>

      <AssistantBox />
    </div>
  );
}
