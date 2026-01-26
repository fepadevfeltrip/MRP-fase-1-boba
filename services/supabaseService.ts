import { createClient } from '@supabase/supabase-js';
import { Message, UserLocation, Language } from '../types';

// Credenciais do Supabase
const SUPABASE_PROJECT_ID = 'hronqtfzgyulvluduzjo';
const SUPABASE_URL = `https://${SUPABASE_PROJECT_ID}.supabase.co`;
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imhyb25xdGZ6Z3l1bHZsdWR1empvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjkxNzIxMDAsImV4cCI6MjA4NDc0ODEwMH0.xNqJzTuCBDn37hZyTVqqIii-igCGVxftwoLLaNNV9bA";

let supabase: any = null;

try {
  supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
} catch (e) {
  console.error("[Supabase] Failed to initialize client:", e);
}

export const verifyAccessCode = async (code: string): Promise<boolean> => {
  // Normaliza para minúsculo para evitar problemas de Case Sensitivity (Ex: MEETINGSINRIO vs meetingsinrio)
  const normalizedCode = code.trim().toLowerCase();
  
  // 1. Verificação Hardcoded (Backup imediato)
  if (normalizedCode === 'meetingsinrio') {
    return true;
  }

  // 2. Verificação no Supabase via RPC (Função Segura)
  // Isso impede que alguém liste todos os códigos da tabela.
  if (!supabase) return false;

  try {
    // Chama a função 'verify_access_code' que criamos no SQL
    const { data, error } = await supabase.rpc('verify_access_code', { 
      input_code: normalizedCode 
    });

    if (error) {
      // Se a função não existir no banco, tentamos o fallback antigo (menos seguro, mas funcional)
      // apenas para não quebrar o app se o SQL não tiver sido rodado ainda.
      console.warn("[Supabase] RPC error (SQL function might be missing), falling back to select:", error.message);
      
      const { data: tableData } = await supabase
        .from('access_codes')
        .select('code')
        .eq('code', normalizedCode)
        .maybeSingle();
      
      return !!tableData;
    }

    return !!data; // Retorna true se a função SQL retornou true
  } catch (err) {
    console.error("[Supabase] Unexpected verification error:", err);
    return false;
  }
};

export const saveConversation = async (
  sessionId: string,
  messages: Message[],
  location?: UserLocation,
  language?: Language
) => {
  if (!supabase) return;

  const fullPayload = {
    id: sessionId,
    messages: messages,
    location: location || {},
    language: language || 'pt',
    updated_at: new Date().toISOString()
  };

  try {
    // Tenta salvar usando UPSERT (Inserir ou Atualizar)
    const { error } = await supabase
      .from('conversations')
      .upsert(fullPayload, { onConflict: 'id' });

    if (error) {
      console.error('[Supabase] Save failed. Check RLS policies.', error.message);
    } else {
      // Sucesso silencioso para não poluir o console
    }
  } catch (err) {
    console.error('[Supabase] Unexpected error during save:', err);
  }
};