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

export const saveConversation = async (
  sessionId: string,
  messages: Message[],
  location?: UserLocation,
  language?: Language
) => {
  if (!supabase) return;

  // 1. Payload Completo (Ideal)
  const fullPayload = {
    id: sessionId,
    messages: messages,
    location: location || {},
    language: language,
    updated_at: new Date().toISOString()
  };

  try {
    // Tenta salvar tudo
    const { error } = await supabase
      .from('conversations')
      .upsert(fullPayload, { onConflict: 'id' });

    if (error) {
      console.warn('[Supabase] Full save failed (likely missing columns). Retrying minimal save...', error.message);

      // 2. Payload Mínimo (Fallback)
      // Se falhar, tenta salvar só o que vimos no print do usuário (id, messages, updated_at)
      const minimalPayload = {
        id: sessionId,
        messages: messages,
        updated_at: new Date().toISOString()
      };

      const { error: retryError } = await supabase
        .from('conversations')
        .upsert(minimalPayload, { onConflict: 'id' });

      if (retryError) {
        console.error('[Supabase] Minimal save also failed. Likely RLS Policy missing.', retryError.message);
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