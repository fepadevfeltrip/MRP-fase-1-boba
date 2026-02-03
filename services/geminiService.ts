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
export const WELCOME_MESSAGES = {
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
  
  // Contexto de localização se disponível (se não estiver, será injetado depois)
  const locationContext = userLocation?.city 
    ? `User is currently in: ${userLocation.city}, ${userLocation.country_name}. `
    : "";

  try {
    const ai = getAIClient();
    
    // TRUQUE DE VELOCIDADE:
    // Em vez de esperar a API gerar o "Olá", nós iniciamos o chat com um histórico
    // que "finge" que a interação já aconteceu. Isso torna o load instantâneo.
    const initialHistory = [
      {
        role: 'user',
        parts: [{ 
            text: `[SYSTEM_INIT] Start conversation. Language: ${language}. ${locationContext}
            
            Task: Greet the user and ask "Visitor or Host?".
            
            Expected Greeting: "${defaultWelcome}"` 
        }],
      },
      {
        role: 'model',
        parts: [{ text: defaultWelcome }],
      },
    ];
    
    chatSession = ai.chats.create({
      model: 'gemini-3-flash-preview',
      config: {
        systemInstruction: SYSTEM_INSTRUCTION,
        temperature: 0.7,
        tools: [{googleSearch: {}}],
      },
      history: initialHistory
    });

    // Retorna imediatamente o texto estático
    return defaultWelcome;

  } catch (error) {
    console.warn("Failed to initialize chat locally.", error);
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

    // Se houve falha ou recriação, reinjetamos contexto
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
  const defaultMessage = WELCOME_MESSAGES[language] || WELCOME_MESSAGES['en'];

  // Reinicia a sessão com o novo idioma usando o método rápido
  await initializeChat(language, false, lastUserLocation);
  
  return defaultMessage;
};