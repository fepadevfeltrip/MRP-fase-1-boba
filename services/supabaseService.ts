import { createClient } from '@supabase/supabase-js';
import { Message, UserLocation, Language } from '../types';

// Credenciais do Supabase
const SUPABASE_PROJECT_ID = 'hronqtfzgyulvluduzjo';
const SUPABASE_URL = `https://${SUPABASE_PROJECT_ID}.supabase.co`;
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imhyb25xdGZ6Z3l1bHZsdWR1empvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjkxNzIxMDAsImV4cCI6MjA4NDc0ODEwMH0.xNqJzTuCBDn37hZyTVqqIii-igCGVxftwoLLaNNV9bA";

let supabase: any = null;

try {
  console.log(`[Supabase] Initializing client for ${SUPABASE_URL}`);
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
  if (!supabase) {
    console.warn("[Supabase] Client not initialized, skipping save.");
    return;
  }

  console.log(`[Supabase] Attempting to save conversation ${sessionId}...`);

  try {
    const { data, error } = await supabase
      .from('conversations')
      .upsert({
        id: sessionId,
        messages: messages,
        location: location || {},
        language: language,
        updated_at: new Date().toISOString()
      }, { onConflict: 'id' })
      .select(); // .select() ajuda a confirmar se a escrita funcionou retornando o dado

    if (error) {
      console.error('[Supabase] ERROR saving conversation:', error.message, error.details);
    } else {
      console.log('[Supabase] SUCCESS. Conversation saved.', data);
    }
  } catch (err) {
    console.error('[Supabase] UNEXPECTED ERROR:', err);
  }
};