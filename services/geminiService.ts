import { GoogleGenAI, Chat, GenerateContentResponse } from "@google/genai";
import { SYSTEM_INSTRUCTION } from "../constants";
import { Language, UserLocation } from "../types";

let chatSession: Chat | null = null;
let currentLanguage: Language = 'pt';
let lastUserLocation: UserLocation | undefined = undefined;

const getAIClient = () => {
  const apiKey = process.env.API_KEY;
  if (!apiKey) {
    throw new Error("API Key not found in environment variables.");
  }
  return new GoogleGenAI({ apiKey });
};

export const initializeChat = async (
  language: Language = 'pt', 
  isRetryAttempt: boolean = false,
  userLocation?: UserLocation
): Promise<string> => {
  currentLanguage = language;
  lastUserLocation = userLocation;
  
  try {
    const ai = getAIClient();
    chatSession = ai.chats.create({
      model: 'gemini-3-flash-preview',
      config: {
        systemInstruction: SYSTEM_INSTRUCTION,
        temperature: 0.7,
        tools: [{googleSearch: {}}],
      },
    });

    let startPrompt = "";
    
    const locationContext = userLocation?.city && userLocation?.country_name
      ? `\n[SISTEMA: O usuário está acessando de: ${userLocation.city}, ${userLocation.country_name}. Use isso para contextualizar a conversa.]`
      : "";

    if (isRetryAttempt) {
      startPrompt = "SYSTEM COMMAND: BLOCK_RETRY";
    } else {
      startPrompt = language === 'pt' 
        ? `[INÍCIO DA SESSÃO]${locationContext} Dê as boas vindas. Apresente-se como Boba, uma guia cultural e 'Boba da Corte' (leve e divertida). IMPORTANTE: Já na primeira pergunta, questione se a pessoa está CHEGANDO na cidade (migrante/expat) ou se está RECEBENDO pessoas (anfitrião/local).`
        : language === 'en'
        ? `[SESSION START]${locationContext} Welcome the user. Introduce yourself as Boba, a cultural guide and 'Jester' (light and fun). IMPORTANT: In your very first question, ask if they are ARRIVING in the city (migrant/expat) or RECEIVING people (host/local).`
        : `[INICIO DE SESIÓN]${locationContext} Da la bienvenida. Preséntate como Boba, una guía cultural y 'Bufona' (ligera y divertida). IMPORTANTE: En tu primera pergunta, cuestiona si la persona está LLEGANDO a la ciudad (migrante/expat) ou si está RECIBIENDO personas (anfitrión/local).`;
    }

    const response: GenerateContentResponse = await chatSession.sendMessage({
      message: startPrompt
    });
    
    return response.text || "Olá! Eu sou a Boba. Você está chegando ou recebendo?";
  } catch (error) {
    console.error("Failed to initialize chat:", error);
    chatSession = null;
    throw error;
  }
};

export const sendMessageToGemini = async (userMessage: string): Promise<string> => {
  // Try to re-initialize if session is missing
  if (!chatSession) {
    try {
      await initializeChat(currentLanguage, false, lastUserLocation);
    } catch (e) {
      return "Estou com dificuldade de conexão. Pode tentar novamente em alguns segundos?";
    }
  }

  if (!chatSession) {
    return "Erro de conexão persistente. Por favor, recarregue a página.";
  }

  try {
    const response: GenerateContentResponse = await chatSession.sendMessage({
      message: userMessage
    });

    let finalText = response.text || "";

    const groundingChunks = response.candidates?.[0]?.groundingMetadata?.groundingChunks;
    
    if (groundingChunks && groundingChunks.length > 0) {
      const uniqueUrls = new Set<string>();
      groundingChunks.forEach((chunk: any) => {
        if (chunk.web?.uri) uniqueUrls.add(chunk.web.uri);
      });

      if (uniqueUrls.size > 0) {
        finalText += "\n\n**Fontes consultadas:**\n";
        uniqueUrls.forEach((url) => {
          finalText += `- ${url}\n`;
        });
      }
    }

    return finalText;
  } catch (error) {
    console.error("Error sending message:", error);
    // If it's a model error or quota, it might recover on retry
    return "Ops, tive um pequeno soluço digital aqui. Pode repetir sua última mensagem?";
  }
};

export const changeBotLanguage = async (language: Language): Promise<string> => {
  currentLanguage = language;
  if (!chatSession) return "";
  
  const instruction = language === 'en' 
    ? "SYSTEM: The user switched the app language to ENGLISH. Please immediately reply to the user in ENGLISH." 
    : language === 'es'
    ? "SYSTEM: El usuario cambió el idioma de la app a ESPAÑOL. Por favor responde inmediatamente al usuario en ESPAÑOL."
    : "SYSTEM: O usuário mudou o idioma do app para PORTUGUÊS. Por favor responda imediatamente ao usuário em PORTUGUÊS.";

  try {
    const response = await chatSession.sendMessage({ message: instruction });
    return response.text || "";
  } catch (e) {
    console.error("Failed to switch language context", e);
    return "";
  }
};