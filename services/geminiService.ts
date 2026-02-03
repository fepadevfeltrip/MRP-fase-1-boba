import { GoogleGenAI, Chat, GenerateContentResponse } from "@google/genai";
import { SYSTEM_INSTRUCTION } from "../constants";
import { Language, UserLocation } from "../types";

let chatSession: Chat | null = null;
let currentLanguage: Language = 'en'; // Default English
let lastUserLocation: UserLocation | undefined = undefined;
let isFallbackMode = false;

const getAIClient = () => {
  return new GoogleGenAI({ apiKey: process.env.API_KEY as string });
};

// Mensagens iniciais focadas apenas na escolha binária.
// A explicação do método vem NA PRÓXIMA resposta da IA.
const WELCOME_MESSAGES = {
  pt: `Olá! Sou a Boba, sua inteligência cultural.\n\nPara começarmos, me diga: você é um **Visitante** em um lugar novo, ou um **Anfitrião** recebendo alguém?`,
  en: `Hello! I'm Boba, your cultural intelligence.\n\nTo start, tell me: are you a **Visitor** in a new place, or a **Host** welcoming someone?`,
  es: `¡Hola! Soy Boba, tu inteligencia cultural.\n\nPara empezar, dime: ¿eres un **Visitante** en un lugar nuevo, o un **Anfitrión** recibiendo a alguien?`
};

// Helper function to extract and format grounding sources
const formatResponseWithGrounding = (response: GenerateContentResponse): string => {
  let text = response.text || "";
  const candidates = response.candidates;
  if (candidates && candidates[0]) {
    const groundingMetadata = candidates[0].groundingMetadata;
    if (groundingMetadata && groundingMetadata.groundingChunks) {
      const chunks = groundingMetadata.groundingChunks;
      const sources = chunks.map((chunk: any, index: number) => {
         if (chunk.web) {
           return `[${index + 1}] ${chunk.web.title}: ${chunk.web.uri}`;
         }
         return null;
      }).filter((s: string | null) => s);
      
      if (sources.length > 0) {
        text += "\n\n**Sources:**\n" + sources.join("\n");
      }
    }
  }
  return text;
};

export const initializeChat = async (
  language: Language = 'en', 
  isRetryAttempt: boolean = false,
  userLocation?: UserLocation
): Promise<string> => {
  currentLanguage = language;
  lastUserLocation = userLocation;
  isFallbackMode = false;
  
  const defaultWelcome = WELCOME_MESSAGES[language] || WELCOME_MESSAGES['en'];

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
      ? `\n[METADADOS: Usuário está em: ${userLocation.city}, ${userLocation.country_name}]`
      : "";

    if (isRetryAttempt) {
      startPrompt = "SYSTEM COMMAND: BLOCK_RETRY";
    } else {
      // Instrução explícita para a primeira mensagem ser APENAS a pergunta binária
      if (language === 'pt') {
        startPrompt = `[INÍCIO]${locationContext} Aja como Boba. Sua primeira mensagem deve ser APENAS a saudação e a pergunta: Visitante ou Anfitrião? Texto sugerido:\n\n"${defaultWelcome}"`;
      } else if (language === 'en') {
        startPrompt = `[START]${locationContext} Act as Boba. Your first message must ONLY be the greeting and the question: Visitor or Host? Suggested text:\n\n"${defaultWelcome}"`;
      } else {
        startPrompt = `[INICIO]${locationContext} Actúa como Boba. Tu primer mensaje debe ser SOLO el saludo y la pregunta: ¿Visitante o Anfitrión? Texto sugerido:\n\n"${defaultWelcome}"`;
      }
    }

    const response: GenerateContentResponse = await chatSession.sendMessage({
      message: startPrompt
    });
    
    return formatResponseWithGrounding(response) || defaultWelcome;

  } catch (error) {
    console.warn("Failed to reach Gemini. Using fallback.", error);
    isFallbackMode = true; 
    return defaultWelcome;
  }
};

export const sendMessageToGemini = async (userMessage: string): Promise<string> => {
  if (!chatSession) {
    try {
      const ai = getAIClient();
      chatSession = ai.chats.create({
        model: 'gemini-3-flash-preview',
        config: { systemInstruction: SYSTEM_INSTRUCTION, tools: [{googleSearch: {}}] },
      });
      isFallbackMode = true;
    } catch (e) {
      console.error("Critical: Could not recreate session", e);
      return "Erro de conexão. Tente recarregar.";
    }
  }

  try {
    let finalMessageToSend = userMessage;

    if (isFallbackMode) {
      const welcomeContext = WELCOME_MESSAGES[currentLanguage] || WELCOME_MESSAGES['en'];
      finalMessageToSend = `[SISTEMA: Recuperação de contexto. Abertura foi: "${welcomeContext}". Usuário disse:]\n\n"${userMessage}"`;
      isFallbackMode = false; 
    }

    const response: GenerateContentResponse = await chatSession.sendMessage({
      message: finalMessageToSend
    });

    return formatResponseWithGrounding(response) || "";
    
  } catch (error) {
    console.error("Error sending message:", error);
    return "Desculpe, a Boba se distraiu. Pode repetir?";
  }
};

export const changeBotLanguage = async (language: Language): Promise<string> => {
  currentLanguage = language;
  const defaultMessage = WELCOME_MESSAGES[language];

  if (!chatSession) return defaultMessage;
  
  try {
    await chatSession.sendMessage({ message: `[SYSTEM COMMAND: User changed language to ${language}. Restart flow asking Visitor vs Host.]` });
    return defaultMessage;
  } catch (e) {
    return defaultMessage;
  }
};