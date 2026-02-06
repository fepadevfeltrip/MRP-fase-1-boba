export enum Role {
  USER = 'user',
  MODEL = 'model'
}

export interface Message {
  id: string;
  role: Role;
  text: string;
  timestamp: number;
}

export type Language = 'pt' | 'en';

export interface UserLocation {
  latitude: number;
  longitude: number;
  city?: string;
  country?: string;
}

export interface GemData {
  name: string;
  type: string;
  description: string;
  address?: string;
  coordinates?: {
    lat: number;
    lng: number;
  };
  ritual?: string;
}

export interface BobaUiData {
  emotional_status: string;
  gems: GemData[];
  mrp_scores?: {
    body: number;
    territory: number;
    identity: number;
    other: number;
    space: number;
  };
}

export interface LivingMarker {
    id: string;
    lat: number;
    lng: number;
    type: 'presence' | 'place' | 'culture';
    title: string;
}