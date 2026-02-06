import { GoogleGenAI } from "@google/genai";
import { SYSTEM_INSTRUCTION } from "../constants";
import { Language, UserLocation } from "../types";

let chatSession: any = null;

export const initializeChat = async (language: Language, isReset: boolean = false, location?: UserLocation) => {
  if (!process.env.API_KEY) {
      console.warn("API Key is missing!");
      return "Erro: API Key não configurada.";
  }

  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  
  let instruction = SYSTEM_INSTRUCTION;
  
  if (location) {
      instruction += `\n\nCONTEXTO DO USUÁRIO: Latitude ${location.latitude}, Longitude ${location.longitude}.`;
  }
  
  instruction += `\n\nIDIOMA: ${language === 'pt' ? 'Português' : 'Inglês'}.`;

  const chat = ai.chats.create({
    model: 'gemini-2.5-flash-latest', 
    config: {
      systemInstruction: instruction,
    },
  });
  
  chatSession = chat;
  return "Chat Initialized";
};

export const sendMessageToGemini = async (text: string) => {
  if (!chatSession) {
      // Attempt auto-recovery
      await initializeChat('pt');
      if (!chatSession) return "Minha conexão com o éter falhou. Recarregue a página.";
  }
  
  try {
    const response = await chatSession.sendMessage({ message: text });
    return response.text;
  } catch (error) {
    console.error("Gemini API Error:", error);
    return "Houve uma interferência no sinal. Tente novamente.";
  }
};

export const changeBotLanguage = (lang: Language) => {
    // Stub for future language switching logic
};