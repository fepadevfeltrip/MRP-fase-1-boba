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
      // Texto exato solicitado
      const welcomePT = `Oi! Sou a Boba, sua Boba da Corte que fala sobre tudo e a inteligência cultural e relacional da Feltrip.\n\nPara te entregar o mapa da mina em SP ou no Rio, eu processo nosso papo através da inteligência da Feltrip, tá? Vamos nessa.\n\nO Mapa da Presença Relacional é a nossa bússola para você não ser apenas mais um na multidão, mas sim o dono da sua própria travessia.\n\nComo posso te ajudar agora?\n\n1. Quero entender minha presença (Como estou me sentindo nesse movimento?)\n2. Quero um segredo da cidade (Onde está o ouro escondido hoje?)\n3. Estou Recebendo uma pessoa e quero dicas de hospitalidade.`;

      if (language === 'pt') {
        startPrompt = `[INÍCIO DA SESSÃO]${locationContext} Aja como Boba. Sua PRIMEIRA mensagem deve ser ESTRITAMENTE o texto abaixo. NÃO adicione saudações extras, NÃO mude a ordem, NÃO resuma. Reproduza exatamente:\n\n"${welcomePT}"`;
      } else if (language === 'en') {
        startPrompt = `[SESSION START]${locationContext} Act as Boba. Your FIRST message MUST BE the exact translation of the following text to English (Use "Map of Relational Presence (MRP)" for "Mapa da Presença Relacional"). Do not add anything else:\n\n"${welcomePT}"`;
      } else {
        startPrompt = `[INICIO DE SESIÓN]${locationContext} Actúa como Boba. Tu PRIMER mensaje DEBE SER la traducción exacta del siguiente texto al Español (Mantén "Map of Relational Presence (MRP)" si es relevante). No agregues nada más:\n\n"${welcomePT}"`;
      }
    }

    const response: GenerateContentResponse = await chatSession.sendMessage({
      message: startPrompt
    });
    
    return response.text || "Olá! Eu sou a Boba. Vamos mapear sua presença?";
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

    // Retorna apenas o texto gerado pela IA.
    // Fontes/Links (groundingChunks) foram omitidos propositalmente conforme solicitado.
    return response.text || "";
    
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