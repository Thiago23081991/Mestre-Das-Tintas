import { createClient, SupabaseClient } from '@supabase/supabase-js';

// Utiliza as variáveis de ambiente se existirem, senão usa as credenciais fornecidas diretamente
const supabaseUrl = process.env.SUPABASE_URL || "https://ledwhjhmoekrkbhkjscu.supabase.co";
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY || "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxlZHdoamhtb2VrcmtiaGtqc2N1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQ2NDU3NjYsImV4cCI6MjA4MDIyMTc2Nn0.xcD0ywc2T5_RVy5IPQnW3Ctwj4vQ92sVmE8uqvTzcmk";

export const supabase: SupabaseClient | null = (supabaseUrl && supabaseAnonKey)
  ? createClient(supabaseUrl, supabaseAnonKey)
  : null;

if (!supabase) {
  console.warn("Aviso: Credenciais do Supabase não encontradas. O aplicativo usará LocalStorage para persistência.");
}