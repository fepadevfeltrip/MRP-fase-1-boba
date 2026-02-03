
import { createClient } from '@supabase/supabase-js';
import { Message, UserLocation, Language, UserProfile } from '../types';

// Credenciais do projeto
const SUPABASE_PROJECT_ID = 'hronqtfzgyulvluduzjo';
const SUPABASE_URL = `https://${SUPABASE_PROJECT_ID}.supabase.co`;
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imhyb25xdGZ6Z3l1bHZsdWR1empvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjkxNzIxMDAsImV4cCI6MjA4NDc0ODEwMH0.xNqJzTuCBDn37hZyTVqqIii-igCGVxftwoLLaNNV9bA";

let supabase: any = null;

try {
  supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
} catch (e) {
  console.error("[Supabase] Failed to initialize client:", e);
}

// --- Auth Functions ---

export const signInWithMagicLink = async (email: string) => {
    // --- BYPASS DE DESENVOLVIMENTO ---
    // Permite testar o fluxo sem gastar cota de e-mail do Supabase
    if (email.trim().toLowerCase() === 'demo@feltrip.com') {
        return { data: { message: 'Demo Mode' }, error: null };
    }
    // ---------------------------------

    if (!supabase) return { error: { message: 'Client not initialized' } };
    
    try {
        const { data, error } = await supabase.auth.signInWithOtp({
            email: email.trim(),
            options: {
                // Removendo emailRedirectTo temporariamente para reduzir chance de erro de configuração,
                // já que estamos focando no uso do Token numérico.
                shouldCreateUser: true,
            }
        });
        
        if (error) console.error("Supabase Auth Error:", error);
        return { data, error };
    } catch (err: any) {
        console.error("Unexpected Auth Error:", err);
        return { data: null, error: err };
    }
};

export const verifyOtp = async (email: string, token: string) => {
    // --- BYPASS DE DESENVOLVIMENTO ---
    if (email.trim().toLowerCase() === 'demo@feltrip.com' && token === '123456') {
        return { 
            data: { 
                user: { 
                    id: 'demo-user-123', 
                    email: 'demo@feltrip.com',
                    user_metadata: { name: 'Viajante Demo' }
                } 
            }, 
            error: null 
        };
    }
    // ---------------------------------

    if (!supabase) return { error: { message: 'Client not initialized' } };
    
    try {
        // Verificação padrão via Token (Email)
        const { data, error } = await supabase.auth.verifyOtp({
            email: email.trim(),
            token: token.trim(),
            type: 'email'
        });
        
        // Se falhar como login normal, tenta como signup (caso o usuário tenha acabado de criar a conta)
        if (error) {
             const retry = await supabase.auth.verifyOtp({
                email: email.trim(),
                token: token.trim(),
                type: 'signup'
            });
            if (!retry.error) return { data: retry.data, error: null };
        }
        
        return { data, error };
    } catch (err: any) {
        return { data: null, error: err };
    }
};

export const signOut = async () => {
    if (!supabase) return;
    await supabase.auth.signOut();
};

export const getUser = async () => {
    if (!supabase) return null;
    const { data } = await supabase.auth.getUser();
    return data.user;
};

// --- Profile / Plan Functions ---

export const getUserProfile = async (userId: string): Promise<UserProfile | null> => {
    // Mock profile for Demo User
    if (userId === 'demo-user-123') {
        return {
            id: userId,
            email: "demo@feltrip.com",
            subscription_tier: 'free', // Começa como free para testar o modal de planos
            subscription_status: 'active',
            created_at: new Date().toISOString()
        };
    }

    if (!supabase) return null;
    
    try {
        const { data, error } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', userId)
            .single();
            
        if (error) {
            // Fallback silencioso se o perfil não existir ainda
            return {
                id: userId,
                email: "",
                subscription_tier: 'free',
                subscription_status: 'none',
                created_at: new Date().toISOString()
            };
        }
        return data as UserProfile;
    } catch (e) {
        return null;
    }
};

// --- Database Functions ---

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
    const { error } = await supabase
      .from('conversations')
      .upsert(fullPayload, { onConflict: 'id' });
  } catch (err) {
    // console.error('[Supabase] Error saving:', err);
  }
};

export const saveFeedback = async (sessionId: string, rating: number, comment: string) => {
  if (!supabase) return;

  try {
    const { error } = await supabase
      .from('feedbacks')
      .insert([
        { session_id: sessionId, rating, comment, created_at: new Date().toISOString() }
      ]);
  } catch (err) {
    console.error('[Supabase] Feedback error:', err);
  }
};
