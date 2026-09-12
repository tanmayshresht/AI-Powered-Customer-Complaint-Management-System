import { createClient } from '@supabase/supabase-js';

const url =
  (import.meta as any)?.env?.VITE_SUPABASE_URL ||
  (typeof process !== 'undefined' ? (process as any)?.env?.NEXT_PUBLIC_SUPABASE_URL : undefined) ||
  'https://placeholder.supabase.co';
const anon =
  (import.meta as any)?.env?.VITE_SUPABASE_ANON_KEY ||
  (typeof process !== 'undefined' ? (process as any)?.env?.NEXT_PUBLIC_SUPABASE_ANON_KEY : undefined) ||
  'placeholder-anon-key';

const supabase = createClient(url, anon);
export default supabase;
