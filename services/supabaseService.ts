import { createClient } from '@supabase/supabase-js';
import { Message, UserLocation, Language } from '../types';

// Credenciais do Supabase
// ID do projeto extraído do token JWT: hronqtfzgyulvluduzjo
const SUPABASE_PROJECT_ID = 'hronqtfzgyulvluduzjo';
const SUPABASE_URL = `https://${SUPABASE_PROJECT_ID}.supabase.co`;

// Chave fornecida pelo usuário
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imhyb25xdGZ6Z3l1bHZsdWR1empvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjkxNzIxMDAsImV4cCI6MjA4NDc0ODEwMH0.xNqJzTuCBDn37hZyTVqqIii-igCGVxftwoLLaNNV9bA";

let supabase: any = null;

try {
  supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
} catch (e) {
  console.error("Failed to initialize Supabase client", e);
}

export const saveConversation = async (
  sessionId: string,
  messages: Message[],
  location?: UserLocation,
  language?: Language
) => {
  if (!supabase) return;

  try {
    const { error } = await supabase
      .from('conversations')
      .upsert({
        id: sessionId,
        messages: messages, // Salva o array de mensagens como JSON
        location: location,
        language: language,
        updated_at: new Date().toISOString()
      }, { onConflict: 'id' });

    if (error) {
      console.warn('Supabase save error (check if table "conversations" exists):', error.message);
    } else {
      // Debug log para confirmar conexão (pode ser removido em produção)
      console.log('Conversation synced with Supabase successfully.');
    }
  } catch (err) {
    console.error('Unexpected Supabase error:', err);
  }
};