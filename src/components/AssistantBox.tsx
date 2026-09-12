import { useState, useRef, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Bot, Send, Loader2, Lightbulb } from 'lucide-react';
import { askAssistant } from '../store/complaintSlice';
import type { AppDispatch, RootState } from '../store/store';

const SUGGESTIONS = [
  'Draft a CAPA for a labelling mix-up',
  'Is a glass particle in a vial reportable?',
  'How do I triage severity vs priority?',
  'Explain the LangGraph pipeline',
];

export default function AssistantBox() {
  const dispatch = useDispatch<AppDispatch>();
  const { assistantMessages, assistantLoading, form } = useSelector((s: RootState) => s.complaint);
  const [draft, setDraft] = useState('');
  const boxRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    boxRef.current?.scrollTo({ top: boxRef.current.scrollHeight, behavior: 'smooth' });
  }, [assistantMessages.length, assistantLoading]);

  const send = (text?: string) => {
    const msg = (text ?? draft).trim();
    if (!msg || assistantLoading) return;
    setDraft('');
    const ctx = [form.product_name, form.batch_lot_number, form.complaint_type, form.initial_severity].filter(Boolean).join(' | ');
    dispatch(askAssistant({ message: msg, context: ctx ? `Current form: ${ctx}. ${form.detailed_description.slice(0, 400)}` : undefined }));
  };

  return (
    <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
      <div className="flex items-center gap-2 border-b border-slate-100 px-5 py-3.5">
        <div className="grid h-8 w-8 place-items-center rounded-xl bg-gradient-to-br from-violet-600 to-indigo-600 text-white shadow-md">
          <Bot className="h-4 w-4" />
        </div>
        <div>
          <h3 className="text-[13.5px] font-extrabold text-slate-800">AI Assistant — GMP QMS Copilot</h3>
          <p className="text-[11px] text-slate-400">Triage · CAPA drafting · reportability · pipeline help</p>
        </div>
        {assistantLoading && <Loader2 className="ml-auto h-4 w-4 animate-spin text-violet-600" />}
      </div>
      <div ref={boxRef} className="custom-scroll h-64 space-y-3 overflow-y-auto bg-slate-50/60 p-4">
        {assistantMessages.map((m, i) => (
          <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div className={`max-w-[88%] rounded-2xl px-3.5 py-2.5 text-[12.5px] leading-relaxed shadow-sm ${m.role === 'user' ? 'rounded-br-md bg-slate-900 text-white' : 'rounded-bl-md border border-slate-200 bg-white text-slate-700'}`}>
              {m.text}
            </div>
          </div>
        ))}
        {assistantLoading && (
          <div className="flex justify-start">
            <div className="flex items-center gap-1.5 rounded-2xl rounded-bl-md border border-slate-200 bg-white px-4 py-3 shadow-sm">
              <span className="h-1.5 w-1.5 rounded-full bg-violet-500 pulse-dot" />
              <span className="h-1.5 w-1.5 rounded-full bg-violet-500 pulse-dot" style={{ animationDelay: '.15s' }} />
              <span className="h-1.5 w-1.5 rounded-full bg-violet-500 pulse-dot" style={{ animationDelay: '.3s' }} />
            </div>
          </div>
        )}
      </div>
      <div className="border-t border-slate-100 p-3">
        <div className="mb-2 flex flex-wrap gap-1.5">
          {SUGGESTIONS.map((s) => (
            <button key={s} onClick={() => send(s)} className="flex items-center gap-1 rounded-full bg-violet-50 px-2.5 py-1 text-[11px] font-bold text-violet-700 ring-1 ring-violet-200 hover:bg-violet-100">
              <Lightbulb className="h-3 w-3" />{s}
            </button>
          ))}
        </div>
        <div className="flex gap-2">
          <input
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter') send(); }}
            placeholder="Ask about CAPA, severity, recall decision…"
            className="flex-1 rounded-xl border border-slate-200 px-3 py-2.5 text-[13px] focus:border-violet-500 focus:outline-none focus:ring-4 focus:ring-violet-500/10"
          />
          <button onClick={() => send()} disabled={!draft.trim() || assistantLoading} className="grid h-10 w-10 place-items-center rounded-xl bg-violet-600 text-white shadow-md hover:bg-violet-700 disabled:opacity-40">
            <Send className="h-4 w-4" />
          </button>
        </div>
      </div>
    </section>
  );
}
