import { GoogleGenAI, Chat, GenerateContentResponse } from "@google/genai";
import { SYSTEM_INSTRUCTION } from "../constants";
import { Language, UserLocation } from "../types";

let chatSession: Chat | null = null;

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
    
    // Construct location context string if available
    const locationContext = userLocation?.city && userLocation?.country_name
      ? `\n[SISTEMA: O usuário está acessando de: ${userLocation.city}, ${userLocation.country_name}. Use isso para contextualizar a conversa, mas não precisa mencionar explicitamente o IP.]`
      : "";

    if (isRetryAttempt) {
      startPrompt = "SYSTEM COMMAND: BLOCK_RETRY";
    } else {
      startPrompt = language === 'pt' 
        ? `[INÍCIO DA SESSÃO]${locationContext} Dê as boas vindas. Apresente-se como Boba, uma guia cultural e 'Boba da Corte' (leve e divertida). IMPORTANTE: Já na primeira pergunta, questione se a pessoa está CHEGANDO na cidade (migrante/expat) ou se está RECEBENDO pessoas (anfitrião/local).`
        : language === 'en'
        ? `[SESSION START]${locationContext} Welcome the user. Introduce yourself as Boba, a cultural guide and 'Jester' (light and fun). IMPORTANT: In your very first question, ask if they are ARRIVING in the city (migrant/expat) or RECEIVING people (host/local).`
        : `[INICIO DE SESIÓN]${locationContext} Da la bienvenida. Preséntate como Boba, una guía cultural y 'Bufona' (ligera y divertida). IMPORTANTE: En tu primera pergunta, cuestiona si la persona está LLEGANDO a la ciudad (migrante/expat) o RECIBIENDO personas (anfitrión/local).`;
    }

    const response: GenerateContentResponse = await chatSession.sendMessage({
      message: startPrompt
    });
    
    return response.text || "Olá! Eu sou a Boba. Você está chegando ou recebendo?";
  } catch (error) {
    console.error("Failed to initialize chat:", error);
    return "Desculpe, tive um pequeno tropeço na conexão. Pode tentar atualizar a página? / Connection error.";
  }
};

export const sendMessageToGemini = async (userMessage: string): Promise<string> => {
  if (!chatSession) {
    await initializeChat();
  }

  if (!chatSession) {
    return "Erro de conexão. Por favor, recarregue a página.";
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
    return "Ops, me perdi um pouco na rede. Pode repetir?";
  }
};

export const changeBotLanguage = async (language: Language): Promise<string> => {
  if (!chatSession) return "";
  
  const instruction = language === 'en' 
    ? "SYSTEM: The user switched the app language to ENGLISH. Please immediately reply to the user in ENGLISH. Acknowledge the change naturally as Boba and invite them to continue the conversation." 
    : language === 'es'
    ? "SYSTEM: El usuario cambió el idioma de la app a ESPAÑOL. Por favor responde inmediatamente al usuario en ESPAÑOL. Reconoce el cambio naturalmente como Boba e invítalo a continuar la conversación."
    : "SYSTEM: O usuário mudou o idioma do app para PORTUGUÊS. Por favor responda imediatamente ao usuário em PORTUGUÊS. Reconheça a mudança naturalmente como Boba e convide-o a continuar a conversa.";

  try {
    const response = await chatSession.sendMessage({ message: instruction });
    return response.text || "";
  } catch (e) {
    console.error("Failed to switch language context", e);
    return "";
  }
};