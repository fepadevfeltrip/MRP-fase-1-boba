import { GoogleGenAI, Chat, GenerateContentResponse } from "@google/genai";
import { SYSTEM_INSTRUCTION } from "../constants";
import { Language, UserLocation } from "../types";

let chatSession: Chat | null = null;
let currentLanguage: Language = 'pt';
let lastUserLocation: UserLocation | undefined = undefined;
let isFallbackMode = false; // Flag para saber se estamos rodando no modo "sem conexão inicial"

const getAIClient = () => {
  const apiKey = process.env.API_KEY;
  if (!apiKey) {
    throw new Error("API Key not found in environment variables.");
  }
  return new GoogleGenAI({ apiKey });
};

// Mensagens de boas-vindas "hardcoded" para fallback
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
  isFallbackMode = false;
  
  const defaultWelcome = WELCOME_MESSAGES[language] || WELCOME_MESSAGES['pt'];

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
      ? `\n[METADADOS TÉCNICOS (SIGILO ABSOLUTO): O IP do usuário indica: ${userLocation.city}, ${userLocation.country_name}.]`
      : "";

    if (isRetryAttempt) {
      startPrompt = "SYSTEM COMMAND: BLOCK_RETRY";
    } else {
      if (language === 'pt') {
        startPrompt = `[INÍCIO DA SESSÃO]${locationContext} Aja como Boba. Sua PRIMEIRA mensagem deve ser ESTRITAMENTE o texto abaixo:\n\n"${defaultWelcome}"`;
      } else if (language === 'en') {
        startPrompt = `[SESSION START]${locationContext} Act as Boba. Your FIRST message MUST BE EXACTLY:\n\n"${defaultWelcome}"`;
      } else {
        startPrompt = `[INICIO DE SESIÓN]${locationContext} Actúa como Boba. Tu PRIMER mensaje DEBE SER exactamente:\n\n"${defaultWelcome}"`;
      }
    }

    const response: GenerateContentResponse = await chatSession.sendMessage({
      message: startPrompt
    });
    
    return response.text || defaultWelcome;

  } catch (error) {
    console.warn("Failed to reach Gemini for welcome message (Network/Facebook Block). Using fallback.", error);
    isFallbackMode = true; // Marca que a conexão real falhou e estamos usando o texto gravado
    return defaultWelcome;
  }
};

export const sendMessageToGemini = async (userMessage: string): Promise<string> => {
  // 1. Recuperação de Sessão Perdida ou Nula
  if (!chatSession) {
    try {
      // Tenta recriar a sessão silenciosamente
      const ai = getAIClient();
      chatSession = ai.chats.create({
        model: 'gemini-3-flash-preview',
        config: { systemInstruction: SYSTEM_INSTRUCTION, tools: [{googleSearch: {}}] },
      });
      isFallbackMode = true; // Se recriamos agora, perdemos o histórico anterior, então tratamos como fallback
    } catch (e) {
      console.error("Critical: Could not recreate session object", e);
      return getFacebookErrorMessage();
    }
  }

  try {
    let finalMessageToSend = userMessage;

    // 2. Injeção de Contexto (Se a inicialização tinha falhado)
    // Se estávamos no modo Fallback, a IA não sabe que "enviou" o menu de opções.
    // O usuário vai mandar "1", e a IA vai pensar "1 o quê?".
    // Aqui injetamos o contexto invisível para o usuário.
    if (isFallbackMode) {
      const welcomeContext = WELCOME_MESSAGES[currentLanguage] || WELCOME_MESSAGES['pt'];
      finalMessageToSend = `[SISTEMA: A conexão anterior falhou. O usuário visualizou esta mensagem de boas-vindas: "${welcomeContext}".\n\nAgora, o usuário respondeu:]\n\n"${userMessage}"`;
      
      // Desliga o modo fallback pois agora já enviamos o contexto
      isFallbackMode = false; 
    }

    const response: GenerateContentResponse = await chatSession.sendMessage({
      message: finalMessageToSend
    });

    return response.text || "";
    
  } catch (error) {
    console.error("Error sending message:", error);
    
    // 3. TENTATIVA ÚNICA DE RECONEXÃO (Retry)
    // Se falhar, tentamos recriar a sessão uma vez e reenviar
    try {
        console.log("Attempting one-time retry...");
        const ai = getAIClient();
        chatSession = ai.chats.create({
            model: 'gemini-3-flash-preview',
            config: { systemInstruction: SYSTEM_INSTRUCTION, tools: [{googleSearch: {}}] },
        });
        
        // Reenvia com contexto reforçado
        const retryMessage = `[SISTEMA: Houve uma queda de conexão. Recupere o contexto. O usuário disse:] ${userMessage}`;
        const retryResponse = await chatSession.sendMessage({ message: retryMessage });
        return retryResponse.text || "";
    } catch (retryError) {
        console.error("Retry failed:", retryError);
        // Se falhar na segunda vez, é bloqueio definitivo do Facebook/Rede.
        return getFacebookErrorMessage();
    }
  }
};

const getFacebookErrorMessage = () => {
    // Mensagens ajustadas para soarem explicativas e confiáveis, citando a tecnologia Gemini
    if (currentLanguage === 'en') {
        return "🌱 **Let's move to a better space!**\n\nThe browser inside this app is limiting my connection to **Gemini AI**. I can't think clearly here.\n\n✨ **To fix this:** Tap the **three dots (•••)** at the top and select **'Open in Browser'** (Chrome/Safari). See you there!";
    } else if (currentLanguage === 'es') {
        return "🌱 **¡Vamos a un lugar mejor!**\n\nEl navegador dentro de esta app limita mi conexión con **Gemini AI**. No puedo pensar con claridad aquí.\n\n✨ **Solución:** Toca los **tres puntos (•••)** arriba y selecciona **'Abrir en el Navegador'**. ¡Te espero allí!";
    } else {
        return "🌱 **Vamos para um lugar melhor!**\n\nO navegador do Facebook/Instagram está limitando minha conexão com a **Gemini AI**. Não consigo pensar direito aqui.\n\n✨ **A solução:** Toque nos **3 pontinhos (•••)** no topo da tela e escolha **'Abrir no Navegador'** (Chrome ou Safari). Te espero lá!";
    }
};

export const changeBotLanguage = async (language: Language): Promise<string> => {
  currentLanguage = language;
  
  const switchMessage = language === 'en' 
      ? "Language switched to English. How can I help?" 
      : language === 'es'
      ? "Idioma cambiado a Español. ¿Cómo puedo ayudar?"
      : "Idioma alterado para Português. Como posso ajudar?";

  if (!chatSession) return switchMessage;
  
  try {
    const response = await chatSession.sendMessage({ message: `SYSTEM: Switch language to ${language}.` });
    return response.text || switchMessage;
  } catch (e) {
    return switchMessage;
  }
};