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
  const normalizedCode = code.trim();
  
  // 1. Verificação Hardcoded (Para funcionar imediatamente com o código solicitado)
  if (normalizedCode === 'meetingsinrio') {
    return true;
  }

  // 2. Verificação no Supabase (Para códigos futuros)
  if (!supabase) return false;

  try {
    // Supõe uma tabela chamada 'access_codes' com uma coluna 'code'
    const { data, error } = await supabase
      .from('access_codes')
      .select('id')
      .eq('code', normalizedCode)
      .maybeSingle();

    if (error) {
      console.warn("[Supabase] Code verification error:", error.message);
      return false;
    }

    return !!data; // Retorna true se encontrou o código
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

  // 1. Payload Completo (Ideal)
  // Certifique-se de que a tabela 'conversations' (sua pasta) tem as colunas: id, messages, location, language, updated_at
  const fullPayload = {
    id: sessionId,
    messages: messages,
    location: location || {},
    language: language || 'pt',
    updated_at: new Date().toISOString()
  };

  try {
    // Tenta salvar tudo
    const { error } = await supabase
      .from('conversations')
      .upsert(fullPayload, { onConflict: 'id' });

    if (error) {
      console.warn('[Supabase] Full save failed. Retrying minimal save... Error:', error.message);

      // 2. Payload Mínimo (Fallback)
      // Se falhar (ex: coluna 'location' não existe), tenta salvar só o básico
      const minimalPayload = {
        id: sessionId,
        messages: messages,
        updated_at: new Date().toISOString()
      };

      const { error: retryError } = await supabase
        .from('conversations')
        .upsert(minimalPayload, { onConflict: 'id' });

      if (retryError) {
        console.error('[Supabase] Minimal save also failed. Check RLS Policies or Table Name.', retryError.message);
      } else {
        console.log('[Supabase] Minimal save success.');
      }
    } else {
      console.log('[Supabase] Full save success.');
    }
  } catch (err) {
    console.error('[Supabase] Unexpected error:', err);
  }
};