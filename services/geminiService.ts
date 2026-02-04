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

// Mensagens iniciais atualizadas com a persona "Boba da Corte/Jester"
export const WELCOME_MESSAGES = {
  pt: `Olá! Sou a Boba, sua inteligência cultural e sua Boba da Corte particular. Minha missão é ser a única no reino que fala a verdade sobre as ciladas e as gemas da cidade, mas de um jeito leve e lúdico.\n\nAtravés do Método Feltrip, eu calibro sua bússola para que você não apenas visite um lugar, mas sinta que finalmente pertence a ele.\n\nEscolha uma opção:\n\n1. Vamos brincar de ser local?\n2. Me ajude a receber uma visita.`,
  en: `Hello! I'm Boba, your cultural intelligence and your private Court Jester. My mission is to be the only one in the kingdom who speaks the truth about the traps and gems of the city, but in a light and playful way.\n\nThrough the Feltrip Method, I calibrate your compass so that you don't just visit a place, but feel like you finally belong to it.\n\nChoose an option:\n\n1. Let's play being a local?\n2. Help me host a visit.`,
  es: `¡Hola! Soy Boba, tu inteligencia cultural y tu Bufona de la Corte particular. Mi misión es ser la única en el reino que dice la verdad sobre las trampas y las gemas de la ciudad, pero de una manera ligera y lúdica.\n\nA través del Método Feltrip, calibro tu brújula para que no solo visites un lugar, sino que sientas que finalmente perteneces a él.\n\nElige una opción:\n\n1. ¿Jugamos a ser locales?\n2. Ayúdame a recibir una visita.`
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
            
            Task: Greet the user as the "Court Jester/Boba da Corte" explaining the Feltrip Method.
            
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