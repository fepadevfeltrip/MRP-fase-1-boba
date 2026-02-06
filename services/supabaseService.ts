import { Message, UserLocation, Language } from '../types';

// This is a mock service since we don't have Supabase credentials in this environment.
// It ensures the app runs without crashing.

export const saveConversation = async (sessionId: string, messages: Message[], location?: UserLocation, language?: Language) => {
  // console.log("Mock: Saving conversation", sessionId);
};

export const subscribeToAuthChanges = (callback: (user: any) => void) => {
  // Mock: No user logged in by default.
  callback(null);
  return { data: { subscription: { unsubscribe: () => {} } } };
};

export const saveFeedback = async (text: string) => {
    console.log("Mock: Feedback saved", text);
};

export const signInWithGoogle = async () => {
    // Mock login for demo purposes
    return { user: { id: 'demo-user', email: 'traveler@feltrip.com', name: 'Traveler' }, error: null };
};