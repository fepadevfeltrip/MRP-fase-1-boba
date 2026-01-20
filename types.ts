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
}