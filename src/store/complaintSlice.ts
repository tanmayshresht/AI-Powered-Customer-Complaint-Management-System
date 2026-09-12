import { createSlice, createAsyncThunk, type PayloadAction } from '@reduxjs/toolkit';
import type { RootState } from './store';

export type TabId = 'workspace' | 'register' | 'analytics' | 'blueprint';

export interface ComplaintForm {
  complaint_source: string;
  customer_name: string;
  product_name: string;
  product_strength_grade: string;
  batch_lot_number: string;
  manufacturing_date: string;
  expiry_date: string;
  quantity_affected: string;
  complaint_type: string;
  detailed_description: string;
  complaint_date: string;
  initial_severity: string;
  priority: string;
}

export interface ComplaintRecord extends ComplaintForm {
  id: number;
  status: string;
  raw_text?: string;
  ai_summary?: string;
  overall_confidence?: number | null;
  confidence?: Record<string, number> | null;
  created_at?: string;
}

export interface TraceStep { node: string; detail: string }
export interface AssistantMsg { role: 'user' | 'assistant'; text: string; ts: number }

export interface ExtractionResponse {
  fields: ComplaintForm;
  confidence: Record<string, number>;
  overallConfidence: number;
  reasoning: string;
  severityRationale: string;
  priorityRationale: string;
  complaintTypeRationale: string;
  trace: TraceStep[];
  provider: string;
  model: string;
}

const today = () => new Date().toISOString().slice(0, 10);

export const EMPTY_FORM: ComplaintForm = {
  complaint_source: 'Email',
  customer_name: '',
  product_name: '',
  product_strength_grade: '',
  batch_lot_number: '',
  manufacturing_date: '',
  expiry_date: '',
  quantity_affected: '',
  complaint_type: '',
  detailed_description: '',
  complaint_date: today(),
  initial_severity: 'Major',
  priority: 'P1 - High',
};

export const FIELD_LABELS: Record<keyof ComplaintForm, string> = {
  complaint_source: 'Complaint Source',
  customer_name: 'Customer Name',
  product_name: 'Product Name',
  product_strength_grade: 'Product Strength / Grade',
  batch_lot_number: 'Batch / Lot Number',
  manufacturing_date: 'Manufacturing Date',
  expiry_date: 'Expiry Date',
  quantity_affected: 'Quantity Affected',
  complaint_type: 'Complaint Type',
  detailed_description: 'Detailed Complaint Description',
  complaint_date: 'Complaint Date',
  initial_severity: 'Initial Severity',
  priority: 'Priority',
};

export const runExtraction = createAsyncThunk<
  ExtractionResponse,
  { text: string; fileName?: string; fileType?: string },
  { rejectValue: string }
>('complaint/runExtraction', async (payload, { rejectWithValue }) => {
  try {
    const res = await fetch('/api/extract', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    const data = await res.json();
    if (!res.ok) return rejectWithValue(data?.error || 'Extraction failed');
    return data as ExtractionResponse;
  } catch (e: any) {
    return rejectWithValue(e?.message || 'Network error');
  }
});

export const fetchComplaints = createAsyncThunk<ComplaintRecord[], void, { rejectValue: string }>(
  'complaint/fetchComplaints',
  async (_, { rejectWithValue }) => {
    try {
      const res = await fetch('/api/complaints');
      const data = await res.json();
      if (!res.ok) return rejectWithValue(data?.error || 'Fetch failed');
      return data as ComplaintRecord[];
    } catch (e: any) {
      return rejectWithValue(e?.message || 'Network error');
    }
  }
);

export const saveComplaint = createAsyncThunk<ComplaintRecord, { rawText: string }, { state: RootState; rejectValue: string }>(
  'complaint/saveComplaint',
  async ({ rawText }, { getState, rejectWithValue }) => {
    try {
      const form = (getState() as RootState).complaint.form;
      const st = (getState() as RootState).complaint;
      const res = await fetch('/api/complaints', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...form,
          status: 'Open',
          raw_text: rawText || '',
          ai_summary: st.reasoning ? String(st.reasoning).slice(0, 600) : '',
          overall_confidence: st.overallConfidence ?? null,
          confidence: st.lastConfidence && Object.keys(st.lastConfidence).length ? st.lastConfidence : null,
        }),
      });
      const data = await res.json();
      if (!res.ok) return rejectWithValue(data?.error || 'Save failed');
      return data as ComplaintRecord;
    } catch (e: any) {
      return rejectWithValue(e?.message || 'Network error');
    }
  }
);

export const deleteComplaint = createAsyncThunk<number, number, { rejectValue: string }>(
  'complaint/deleteComplaint',
  async (id, { rejectWithValue }) => {
    try {
      const res = await fetch('/api/complaints', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id }),
      });
      const data = await res.json();
      if (!res.ok) return rejectWithValue(data?.error || 'Delete failed');
      return id;
    } catch (e: any) {
      return rejectWithValue(e?.message || 'Network error');
    }
  }
);

export const advanceStatus = createAsyncThunk<ComplaintRecord, { id: number; status: string }, { rejectValue: string }>(
  'complaint/advanceStatus',
  async ({ id, status }, { rejectWithValue }) => {
    try {
      const res = await fetch('/api/complaints', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, status }),
      });
      const data = await res.json();
      if (!res.ok) return rejectWithValue(data?.error || 'Update failed');
      return data as ComplaintRecord;
    } catch (e: any) {
      return rejectWithValue(e?.message || 'Network error');
    }
  }
);

export const askAssistant = createAsyncThunk<
  { reply: string; provider: string },
  { message: string; context?: string },
  { rejectValue: string }
>('complaint/askAssistant', async ({ message, context }, { rejectWithValue }) => {
  try {
    const res = await fetch('/api/assistant', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message, context }),
    });
    const data = await res.json();
    if (!res.ok) return rejectWithValue(data?.error || 'Assistant failed');
    return { reply: data.reply as string, provider: data.provider as string };
  } catch (e: any) {
    return rejectWithValue(e?.message || 'Network error');
  }
});

interface ComplaintState {
  form: ComplaintForm;
  autofilled: string[];
  lastConfidence: Record<string, number>;
  overallConfidence: number | null;
  provider: string | null;
  model: string | null;
  reasoning: string | null;
  severityRationale: string | null;
  priorityRationale: string | null;
  extractionStatus: 'idle' | 'loading' | 'succeeded' | 'failed';
  extractionError: string | null;
  trace: TraceStep[];
  lastRawText: string;
  lastFileName: string;
  assistantMessages: AssistantMsg[];
  assistantLoading: boolean;
  pendingQuestion: string | null;
  register: ComplaintRecord[];
  registerLoading: boolean;
  registerError: string | null;
  search: string;
  severityFilter: string;
  priorityFilter: string;
  typeFilter: string;
  activeTab: TabId;
  selected: ComplaintRecord | null;
  saveStatus: 'idle' | 'loading' | 'succeeded' | 'failed';
  saveError: string | null;
  justSavedId: number | null;
}

const initialState: ComplaintState = {
  form: { ...EMPTY_FORM },
  autofilled: [],
  lastConfidence: {},
  overallConfidence: null,
  provider: null,
  model: null,
  reasoning: null,
  severityRationale: null,
  priorityRationale: null,
  extractionStatus: 'idle',
  extractionError: null,
  trace: [],
  lastRawText: '',
  lastFileName: '',
  assistantMessages: [
    { role: 'assistant', text: 'Namaste! I am your GMP complaint assistant. Paste a complaint on the right and run AI extraction, or ask me about triage, CAPA, reportability, or the LangGraph pipeline.', ts: Date.now() },
  ],
  assistantLoading: false,
  pendingQuestion: null,
  register: [],
  registerLoading: false,
  registerError: null,
  search: '',
  severityFilter: '',
  priorityFilter: '',
  typeFilter: '',
  activeTab: 'workspace',
  selected: null,
  saveStatus: 'idle',
  saveError: null,
  justSavedId: null,
};

const slice = createSlice({
  name: 'complaint',
  initialState,
  reducers: {
    setField: (state, action: PayloadAction<{ field: keyof ComplaintForm; value: string }>) => {
      state.form[action.payload.field] = action.payload.value;
      state.autofilled = state.autofilled.filter((f) => f !== action.payload.field);
      state.saveStatus = 'idle';
      state.justSavedId = null;
    },
    setFormAll: (state, action: PayloadAction<ComplaintForm>) => {
      state.form = action.payload;
    },
    resetForm: (state) => {
      state.form = { ...EMPTY_FORM, complaint_date: today() };
      state.autofilled = [];
      state.saveStatus = 'idle';
      state.saveError = null;
      state.justSavedId = null;
    },
    clearExtraction: (state) => {
      state.extractionStatus = 'idle';
      state.extractionError = null;
      state.trace = [];
      state.autofilled = [];
    },
    setActiveTab: (state, action: PayloadAction<TabId>) => {
      state.activeTab = action.payload;
    },
    setSearch: (state, action: PayloadAction<string>) => { state.search = action.payload; },
    setSeverityFilter: (state, action: PayloadAction<string>) => { state.severityFilter = action.payload; },
    setPriorityFilter: (state, action: PayloadAction<string>) => { state.priorityFilter = action.payload; },
    setTypeFilter: (state, action: PayloadAction<string>) => { state.typeFilter = action.payload; },
    setSelected: (state, action: PayloadAction<ComplaintRecord | null>) => { state.selected = action.payload; },
    clearSaveState: (state) => { state.saveStatus = 'idle'; state.saveError = null; state.justSavedId = null; },
  },
  extraReducers: (builder) => {
    builder
      .addCase(runExtraction.pending, (state, action) => {
        state.extractionStatus = 'loading';
        state.extractionError = null;
        state.lastRawText = action.meta.arg.text;
        state.lastFileName = action.meta.arg.fileName || 'pasted-text.txt';
      })
      .addCase(runExtraction.fulfilled, (state, action) => {
        state.extractionStatus = 'succeeded';
        const { fields, confidence, overallConfidence, reasoning, severityRationale, priorityRationale, trace, provider, model } = action.payload;
        const filled: string[] = [];
        (Object.keys(fields) as (keyof ComplaintForm)[]).forEach((k) => {
          const v = (fields[k] || '').trim();
          if (v) { state.form[k] = v; filled.push(k); }
        });
        state.autofilled = filled;
        state.lastConfidence = confidence;
        state.overallConfidence = overallConfidence;
        state.provider = provider;
        state.model = model;
        state.reasoning = reasoning;
        state.severityRationale = severityRationale;
        state.priorityRationale = priorityRationale;
        state.trace = trace;
      })
      .addCase(runExtraction.rejected, (state, action) => {
        state.extractionStatus = 'failed';
        state.extractionError = (action.payload as string) || 'Extraction failed';
      })
      .addCase(fetchComplaints.pending, (state) => { state.registerLoading = true; state.registerError = null; })
      .addCase(fetchComplaints.fulfilled, (state, action) => { state.registerLoading = false; state.register = action.payload; })
      .addCase(fetchComplaints.rejected, (state, action) => { state.registerLoading = false; state.registerError = (action.payload as string) || 'Failed to load'; })
      .addCase(saveComplaint.pending, (state) => { state.saveStatus = 'loading'; state.saveError = null; })
      .addCase(saveComplaint.fulfilled, (state, action) => {
        state.saveStatus = 'succeeded';
        state.justSavedId = action.payload.id;
        state.register = [action.payload, ...state.register];
      })
      .addCase(saveComplaint.rejected, (state, action) => { state.saveStatus = 'failed'; state.saveError = (action.payload as string) || 'Save failed'; })
      .addCase(deleteComplaint.fulfilled, (state, action) => { state.register = state.register.filter((r) => r.id !== action.payload); if (state.selected?.id === action.payload) state.selected = null; })
      .addCase(advanceStatus.fulfilled, (state, action) => {
        state.register = state.register.map((r) => (r.id === action.payload.id ? action.payload : r));
        if (state.selected?.id === action.payload.id) state.selected = action.payload;
      })
      .addCase(askAssistant.pending, (state, action) => {
        state.assistantLoading = true;
        state.pendingQuestion = action.meta.arg.message;
        state.assistantMessages.push({ role: 'user', text: action.meta.arg.message, ts: Date.now() });
      })
      .addCase(askAssistant.fulfilled, (state, action) => {
        state.assistantLoading = false;
        state.pendingQuestion = null;
        state.assistantMessages.push({ role: 'assistant', text: action.payload.reply, ts: Date.now() });
      })
      .addCase(askAssistant.rejected, (state, action) => {
        state.assistantLoading = false;
        state.pendingQuestion = null;
        state.assistantMessages.push({ role: 'assistant', text: 'Sorry — I could not answer that just now (' + ((action.payload as string) || 'error') + '). Please try again.', ts: Date.now() });
      });
  },
});

export const {
  setField, setFormAll, resetForm, clearExtraction,
  setActiveTab, setSearch, setSeverityFilter, setPriorityFilter, setTypeFilter,
  setSelected, clearSaveState,
} = slice.actions;
export default slice.reducer;
