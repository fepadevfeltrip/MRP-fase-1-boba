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

// Mensagens de boas-vindas "hardcoded" para fallback em caso de falha de rede
const WELCOME_MESSAGES = {
  pt: `Oi! Sou a Boba, sua boba da corte moderna e alma cultural.\n\nQual caminho devemos seguir?\n\n1. Mapa das Emoções do Viajante: (Como estou me movendo pelo mundo agora?)\n2. Um segredo da cidade: (Me mostre o 'ouro escondido' no Rio ou em São Paulo.)\n3. Hospitalidade: (Estou recebendo alguém e quero ser o guia definitivo.)`,
  en: `I'm Boba, your modern-day jester and a cultural soul.\n\nIt’s about being truly present, not just passing through.\n\nWhich path shall we take?\n\n1. Traveler's Emotions Map: (How am I moving through the world right now?)\n2. A city secret: (Show me the 'hidden gold' in Rio or São Paulo.)\n3. Hospitality: (I’m hosting someone and want to be the ultimate guide.)`,
  es: `Hola, soy Boba, tu bufona moderna y alma cultural.\n\n¿Qué camino debemos seguir?\n\n1. Mapa de las Emociones del Viajero: (¿Cómo me muevo por el mundo ahora?)\n2. Un secreto de la ciudad: (Muéstrame el 'oro escondido' en Río o São Paulo.)\n3. Hospitalidad: (Recibo a alguien y quiero ser la guía definitiva.)`
};

export const initializeChat = async (
  language: Language = 'pt', 
  isRetryAttempt: boolean = false,
  userLocation?: UserLocation
): Promise<string> => {
  currentLanguage = language;
  lastUserLocation = userLocation;
  
  // Define a mensagem de boas-vindas padrão baseada no idioma
  const defaultWelcome = WELCOME_MESSAGES[language] || WELCOME_MESSAGES['pt'];

  try {
    const ai = getAIClient();
    
    // Configura a sessão. Note que as System Instructions garantem a persona mesmo sem histórico.
    chatSession = ai.chats.create({
      model: 'gemini-3-flash-preview',
      config: {
        systemInstruction: SYSTEM_INSTRUCTION,
        temperature: 0.7,
        tools: [{googleSearch: {}}],
      },
    });

    let startPrompt = "";
    
    // Contexto Silencioso de Localização
    const locationContext = userLocation?.city && userLocation?.country_name
      ? `\n[METADADOS TÉCNICOS (SIGILO ABSOLUTO): O IP do usuário indica: ${userLocation.city}, ${userLocation.country_name}. \nREGRA CRÍTICA: NÃO REVELE QUE VOCÊ SABE ISSO. Use essa informação apenas para contexto interno.]`
      : "";

    if (isRetryAttempt) {
      startPrompt = "SYSTEM COMMAND: BLOCK_RETRY";
    } else {
      // Instrução para a IA repetir exatamente a mensagem de boas-vindas
      if (language === 'pt') {
        startPrompt = `[INÍCIO DA SESSÃO]${locationContext} Aja como Boba. Sua PRIMEIRA mensagem deve ser ESTRITAMENTE o texto abaixo. NÃO adicione saudações extras. Reproduza exatamente:\n\n"${defaultWelcome}"`;
      } else if (language === 'en') {
        startPrompt = `[SESSION START]${locationContext} Act as Boba. Your FIRST message MUST BE EXACTLY the text below:\n\n"${defaultWelcome}"`;
      } else {
        startPrompt = `[INICIO DE SESIÓN]${locationContext} Actúa como Boba. Tu PRIMER mensaje DEBE SER la traducción exacta del siguiente texto al Español:\n\n"${defaultWelcome}"`;
      }
    }

    // Tenta enviar a mensagem para a API
    const response: GenerateContentResponse = await chatSession.sendMessage({
      message: startPrompt
    });
    
    // Se a API retornar vazio, usa o fallback
    return response.text || defaultWelcome;

  } catch (error) {
    // FALLBACK CRÍTICO:
    // Se a conexão falhar (comum no Facebook Browser), NÃO jogue o erro.
    // Retorne a mensagem hardcoded. A sessão existe (chatSession), mas talvez precise ser recriada no próximo envio.
    console.warn("Failed to reach Gemini for welcome message (likely network restriction). Using fallback.", error);
    
    // Retorna a mensagem "local" para o usuário não ficar travado na tela de erro
    return defaultWelcome;
  }
};

export const sendMessageToGemini = async (userMessage: string): Promise<string> => {
  // Try to re-initialize if session is missing
  if (!chatSession) {
    try {
      await initializeChat(currentLanguage, false, lastUserLocation);
    } catch (e) {
      // Se falhar a reinicialização aqui, aí sim retornamos erro pro usuário
      console.error("Critical connection failure", e);
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
    // Tenta recuperar a sessão silenciosamente para a próxima
    chatSession = null;
    return "Ops, tive um pequeno soluço digital aqui (instabilidade de rede). Pode repetir sua última mensagem?";
  }
};

export const changeBotLanguage = async (language: Language): Promise<string> => {
  currentLanguage = language;
  
  // Mensagem de troca imediata "hardcoded" para evitar latência
  const switchMessage = language === 'en' 
      ? "Language switched to English. How can I help?" 
      : language === 'es'
      ? "Idioma cambiado a Español. ¿Cómo puedo ayudar?"
      : "Idioma alterado para Português. Como posso ajudar?";

  if (!chatSession) return switchMessage;
  
  const instruction = language === 'en' 
    ? "SYSTEM: The user switched the app language to ENGLISH. Please immediately reply to the user in ENGLISH confirming the switch." 
    : language === 'es'
    ? "SYSTEM: El usuario cambió el idioma de la app a ESPAÑOL. Por favor responde inmediatamente al usuario en ESPAÑOL confirmando."
    : "SYSTEM: O usuário mudou o idioma do app para PORTUGUÊS. Por favor responda imediatamente ao usuário em PORTUGUÊS confirmando.";

  try {
    const response = await chatSession.sendMessage({ message: instruction });
    return response.text || switchMessage;
  } catch (e) {
    console.error("Failed to switch language context via API", e);
    return switchMessage;
  }
};