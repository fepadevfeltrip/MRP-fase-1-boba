
import { createClient } from '@supabase/supabase-js';
import { Message, UserLocation, Language, UserProfile, LivingMarker, MarkerType } from '../types';

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

// --- Local Storage Helpers for Markers ---
const LOCAL_MARKERS_KEY = 'boba_local_markers_v1';

const getLocalMarkers = (): LivingMarker[] => {
    try {
        const stored = localStorage.getItem(LOCAL_MARKERS_KEY);
        return stored ? JSON.parse(stored) : [];
    } catch (e) {
        return [];
    }
};

const saveLocalMarker = (marker: LivingMarker) => {
    try {
        const markers = getLocalMarkers();
        // Remove se já existir (para update)
        const filtered = markers.filter(m => m.id !== marker.id);
        const updated = [...filtered, marker];
        localStorage.setItem(LOCAL_MARKERS_KEY, JSON.stringify(updated));
    } catch (e) {
        console.error("Error saving local marker", e);
    }
};

const removeLocalMarker = (markerId: string) => {
    try {
        const markers = getLocalMarkers();
        const updated = markers.filter(m => m.id !== markerId);
        localStorage.setItem(LOCAL_MARKERS_KEY, JSON.stringify(updated));
    } catch (e) {
        console.error("Error removing local marker", e);
    }
};

// --- Auth Functions ---

export const subscribeToAuthChanges = (callback: (user: any) => void) => {
    if (!supabase) {
        // Fallback: Check local storage for session if supabase fails
        const localSession = localStorage.getItem('sb-hronqtfzgyulvluduzjo-auth-token');
        if (localSession) {
            try {
                const parsed = JSON.parse(localSession);
                callback(parsed.user);
            } catch (e) { callback(null); }
        }
        return () => {};
    }
    
    // Check current session immediately
    supabase.auth.getSession().then(({ data: { session } }: any) => {
        if (session?.user) {
            callback(session.user);
        }
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event: string, session: any) => {
        callback(session?.user || null);
    });

    return () => {
        subscription.unsubscribe();
    };
};

export const signInWithMagicLink = async (email: string) => {
    // --- BYPASS DE DESENVOLVIMENTO ---
    if (email.trim().toLowerCase() === 'demo@feltrip.com') {
        return { data: { message: 'Demo Mode' }, error: null };
    }
    // ---------------------------------

    if (!supabase) return { error: { message: 'Client not initialized' } };
    
    try {
        const { data, error } = await supabase.auth.signInWithOtp({
            email: email.trim(),
            options: { shouldCreateUser: true }
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
    if (userId === 'demo-user-123') {
        return {
            id: userId,
            email: "demo@feltrip.com",
            subscription_tier: 'premium', 
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
            // Se não tiver perfil, cria um free temporário na memória
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
    // Silently fail
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

// --- Living Map Markers Functions (Hybrid Persistence) ---

export const saveMarker = async (
    userId: string, 
    content: string, 
    lat: number, 
    lng: number, 
    type: MarkerType
): Promise<LivingMarker | null> => {
    
    // 1. Prepara o objeto marcador
    const tempId = `local-${Date.now()}`;
    const newMarker: LivingMarker = {
        id: tempId,
        user_id: userId,
        content: content,
        lat: lat,
        lng: lng,
        type: type,
        created_at: new Date().toISOString()
    };

    // 2. Salva localmente IMEDIATAMENTE (Garante que o usuário vê)
    saveLocalMarker(newMarker);

    // 3. Tenta salvar no Supabase
    if (supabase && userId !== 'demo-user-123') {
        try {
            // Remove o ID para que o banco gere um UUID real
            const { id, ...payload } = newMarker;
            
            const { data, error } = await supabase
                .from('living_markers')
                .insert([payload])
                .select()
                .single();
            
            if (!error && data) {
                // Sucesso: Remove o local (temp) e salva o oficial localmente também para cache
                removeLocalMarker(tempId); 
                saveLocalMarker(data); 
                return data;
            }
        } catch (err) {
            console.error("Supabase save failed, keeping local copy.", err);
        }
    }
    
    // Retorna o marcador (seja o do banco ou o local)
    return newMarker;
};

export const updateMarker = async (
    markerId: string,
    content: string,
    type: MarkerType
): Promise<boolean> => {
    // 1. Atualiza Local
    const localMarkers = getLocalMarkers();
    const target = localMarkers.find(m => m.id === markerId);
    if (target) {
        saveLocalMarker({ ...target, content, type });
    }

    // 2. Atualiza Supabase
    if (!supabase || markerId.startsWith('local-')) return true;

    try {
        const { error } = await supabase
            .from('living_markers')
            .update({ content, type })
            .eq('id', markerId);
        return !error;
    } catch (err) {
        return false;
    }
};

export const deleteMarker = async (markerId: string): Promise<boolean> => {
    // 1. Remove Local
    removeLocalMarker(markerId);

    // 2. Remove Supabase
    if (!supabase || markerId.startsWith('local-')) return true;

    try {
        const { error } = await supabase
            .from('living_markers')
            .delete()
            .eq('id', markerId);
        return !error;
    } catch (err) {
        return false;
    }
};

export const getMarkers = async (userId: string): Promise<LivingMarker[]> => {
    // 1. Carrega Locais
    const localMarkers = getLocalMarkers().filter(m => m.user_id === userId);

    // 2. Carrega Remotos
    let remoteMarkers: LivingMarker[] = [];
    if (supabase && userId !== 'demo-user-123') {
        try {
            const { data, error } = await supabase
                .from('living_markers')
                .select('*')
                .eq('user_id', userId);
            
            if (data && !error) {
                remoteMarkers = data;
            }
        } catch (err) {
            console.error("Error fetching remote markers", err);
        }
    }

    // 3. Merge (Prioridade para Remotos se ID coincidir, mas mantém Locais que não estão no remoto)
    const remoteIds = new Set(remoteMarkers.map(m => m.id));
    const uniqueLocals = localMarkers.filter(m => !remoteIds.has(m.id));
    
    // Combina tudo
    const allMarkers = [...remoteMarkers, ...uniqueLocals];

    // Salva o cache atualizado localmente
    localStorage.setItem(LOCAL_MARKERS_KEY, JSON.stringify(allMarkers));

    return allMarkers;
};
