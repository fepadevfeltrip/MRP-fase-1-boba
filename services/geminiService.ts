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
    
    // ATUALIZAÇÃO: Instrução de "Silent Context" (Contexto Silencioso)
    const locationContext = userLocation?.city && userLocation?.country_name
      ? `\n[METADADOS TÉCNICOS (SIGILO ABSOLUTO): O IP do usuário indica: ${userLocation.city}, ${userLocation.country_name}. \nREGRA CRÍTICA: NÃO REVELE QUE VOCÊ SABE ISSO. Use essa informação apenas para contexto interno (ex: priorizar dicas do Rio se ele estiver no Rio), mas se o usuário não disse onde está, aja como se você não soubesse. Não cite a cidade nem o nome dele a menos que ele escreva no chat.]`
      : "";

    if (isRetryAttempt) {
      startPrompt = "SYSTEM COMMAND: BLOCK_RETRY";
    } else {
      // Mensagens de boas-vindas limpas (Sem aviso de dados no corpo)
      const welcomePT = `Oi! Sou a Boba, sua boba da corte moderna e alma cultural.\n\Qual caminho devemos seguir?\n\n1. Entender minha presença: (Como estou me movendo pelo mundo agora?)\n2. Um segredo da cidade: (Me mostre o 'ouro escondido' no Rio ou em São Paulo.)\n3. Hospitalidade: (Estou recebendo alguém e quero ser o guia definitivo.)`;
      
      const welcomeEN = `I'm Boba, your modern-day jester and a cultural soul.\n\It’s about being truly present, not just passing through.\n\nWhich path shall we take?\n\n1. Understand my presence: (How am I moving through the world right now?)\n2. A city secret: (Show me the 'hidden gold' in Rio or São Paulo.)\n3. Hospitality: (I’m hosting someone and want to be the ultimate guide.)`;

      if (language === 'pt') {
        startPrompt = `[INÍCIO DA SESSÃO]${locationContext} Aja como Boba. Sua PRIMEIRA mensagem deve ser ESTRITAMENTE o texto abaixo. NÃO adicione saudações extras, NÃO mude a ordem, NÃO resuma. Reproduza exatamente:\n\n"${welcomePT}"`;
      } else if (language === 'en') {
        startPrompt = `[SESSION START]${locationContext} Act as Boba. Your FIRST message MUST BE EXACTLY the text below. Do not add anything else:\n\n"${welcomeEN}"`;
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

    return response.text || "";
    
  } catch (error) {
    console.error("Error sending message:", error);
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