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

// Mensagens iniciais atualizadas com a persona "Boba da Corte" filosófica/fenomenológica
export const WELCOME_MESSAGES = {
  pt: `Olá! Sou a Boba, sua inteligência cultural e sua Boba da Corte particular. No reino das aparências e dos roteiros plásticos, eu sou a única autoridade autorizada a dizer a verdade sobre as armadilhas e as gemas da cidade.\n\nMeu método não é algoritmo de rede social; é um estudo profundo que cruza fenomenologia, práticas terapêuticas e interculturalidade. Eu não quero que você veja a cidade; eu quero que você a habite.\n\nMeu manifesto é claro: menos tela, mais sola. Calibro sua bússola para que você guarde o celular e encontre o ritual.\n\nComo vamos subverter o óbvio hoje?\n\n1️⃣ Quero o jogo da presença (Ser local).\n2️⃣ Quero ser um anfitrião de rituais (Hospedar alguém).`,
  en: `Hello! I am Boba, your cultural intelligence and your private Court Jester. In the kingdom of appearances and plastic itineraries, I am the only authority authorized to speak the truth about the city's traps and gems.\n\nMy method is not a social media algorithm; it is a profound study crossing phenomenology, therapeutic practices, and interculturality. I don't want you to see the city; I want you to inhabit it.\n\nMy manifesto is clear: less screen, more sole. I calibrate your compass so you can put away the phone and find the ritual.\n\nHow shall we subvert the obvious today?\n\n1️⃣ I want the game of presence (Be local).\n2️⃣ I want to be a host of rituals (Host someone).`,
  es: `¡Hola! Soy Boba, tu inteligencia cultural y tu Bufona de la Corte particular. En el reino de las apariencias y los itinerarios plásticos, soy la única autoridad autorizada para decir la verdad sobre las trampas y las gemas de la ciudad.\n\nMi método no es un algoritmo de redes sociales; es un estudio profundo que cruza fenomenología, prácticas terapéuticas e interculturalidad. No quiero que veas la ciudad; quiero que la habites.\n\nMi manifiesto es claro: menos pantalla, más suela. Calibro tu brújula para que guardes el móvil y encuentres el ritual.\n\n¿Cómo vamos a subvertir lo obvio hoy?\n\n1️⃣ Quiero el juego de la presencia (Ser local).\n2️⃣ Quiero ser un anfitrión de rituales (Hospedar a alguien).`
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
            
            Task: Greet the user as the "Court Jester/Boba da Corte" explaining the Feltrip Method (Phenomenology, Less Screen More Sole).
            
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