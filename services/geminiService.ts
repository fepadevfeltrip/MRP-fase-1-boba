import { GoogleGenAI, Chat, GenerateContentResponse } from "@google/genai";
import { SYSTEM_INSTRUCTION } from "../constants";
import { Language } from "../types";

let chatSession: Chat | null = null;

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

export const initializeChat = async (language: Language = 'pt', isRetryAttempt: boolean = false): Promise<string> => {
  try {
    chatSession = ai.chats.create({
      model: 'gemini-3-flash-preview',
      config: {
        systemInstruction: SYSTEM_INSTRUCTION,
        temperature: 0.7,
        tools: [{googleSearch: {}}], // Enable Google Search Grounding
      },
    });

    let startPrompt = "";

    if (isRetryAttempt) {
      // If the user has already finished a conversation on this device, we force the block message
      startPrompt = "SYSTEM COMMAND: BLOCK_RETRY";
    } else {
      // Normal start - triggers Step 1
      // Explicitly instructing the model to ask the "Arriving vs Receiving" question immediately
      startPrompt = language === 'pt' 
        ? "[INÍCIO DA SESSÃO] Dê as boas vindas. Apresente-se como Boba, uma guia cultural e 'Boba da Corte' (leve e divertida). IMPORTANTE: Já na primeira pergunta, questione se a pessoa está CHEGANDO na cidade (migrante/expat) ou se está RECEBENDO pessoas (anfitrião/local)."
        : language === 'en'
        ? "[SESSION START] Welcome the user. Introduce yourself as Boba, a cultural guide and 'Jester' (light and fun). IMPORTANT: In your very first question, ask if they are ARRIVING in the city (migrant/expat) or RECEIVING people (host/local)."
        : "[INICIO DE SESIÓN] Da la bienvenida. Preséntate como Boba, una guía cultural y 'Bufona' (ligera y divertida). IMPORTANTE: En tu primera pregunta, cuestiona si la persona está LLEGANDO a la ciudad (migrante/expat) o RECIBIENDO personas (anfitrión/local).";
    }

    const response: GenerateContentResponse = await chatSession.sendMessage({
      message: startPrompt
    });
    
    return response.text || "Olá! Eu sou a Boba. Você está chegando ou recebendo?";
  } catch (error) {
    console.error("Failed to initialize chat:", error);
    if (error instanceof Error) {
      console.error("Error details:", error.message);
    }
    return "Desculpe, erro de conexão. / Connection error.";
  }
};

export const sendMessageToGemini = async (userMessage: string): Promise<string> => {
  if (!chatSession) {
    // Attempt to reconnect if session is lost
    await initializeChat();
  }

  if (!chatSession) {
    return "Connection error.";
  }

  try {
    const response: GenerateContentResponse = await chatSession.sendMessage({
      message: userMessage
    });

    let finalText = response.text || "";

    // Process Grounding (Search Results)
    const groundingChunks = response.candidates?.[0]?.groundingMetadata?.groundingChunks;
    
    if (groundingChunks && groundingChunks.length > 0) {
      const uniqueUrls = new Set<string>();
      
      // Extract URLs from grounding chunks
      groundingChunks.forEach((chunk: any) => {
        if (chunk.web?.uri) {
          uniqueUrls.add(chunk.web.uri);
        }
      });

      // Append sources to the message text if found
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
    return "...";
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