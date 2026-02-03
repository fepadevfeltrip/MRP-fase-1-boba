
export enum Role {
  USER = 'user',
  MODEL = 'model'
}

export type Language = 'pt' | 'en' | 'es';

export interface Message {
  id: string;
  role: Role;
  text: string;
  timestamp: number;
}

export interface ChatState {
  messages: Message[];
  isLoading: boolean;
  error: string | null;
}

export interface UserLocation {
  city?: string;
  country_name?: string;
  ip?: string;
  latitude?: number;
  longitude?: number;
}

// Novos tipos para o sistema de Planos
export type SubscriptionTier = 'free' | 'premium' | 'immersion';

export interface UserProfile {
  id: string;
  email: string;
  subscription_tier: SubscriptionTier;
  subscription_status: 'active' | 'past_due' | 'canceled' | 'none';
  created_at: string;
}

// Tipos do Mapa Vivo
export type MarkerType = 'presence' | 'place' | 'culture';

export interface LivingMarker {
  id: string;
  user_id: string;
  lat: number;
  lng: number;
  content: string; // O que a Boba disse
  type: MarkerType; // Tag
  created_at: string;
}
