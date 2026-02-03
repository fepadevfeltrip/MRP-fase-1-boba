
import { GoogleGenAI, Chat, GenerateContentResponse } from "@google/genai";
import { SYSTEM_INSTRUCTION } from "../constants";
import { Language, UserLocation } from "../types";

let chatSession: Chat | null = null;
let currentLanguage: Language = 'en'; // Default English
let lastUserLocation: UserLocation | undefined = undefined;
let isFallbackMode = false; // Flag para saber se estamos rodando no modo "sem conexão inicial"

const getAIClient = () => {
  const apiKey = process.env.API_KEY;
  if (!apiKey) {
    throw new Error("API Key not found in environment variables.");
  }
  return new GoogleGenAI({ apiKey });
};

// Mensagens de boas-vindas globais - VERSÃO BETA (SEM MENÇÃO A LIMITE)
const WELCOME_MESSAGES = {
  pt: `Oi! Sou a Boba, sua boba da corte moderna e alma cultural.\n\nQual caminho devemos seguir hoje?\n\n1. Mapa das Emoções do Viajante: (Como estou me movendo pelo mundo agora?)\n2. Um segredo da cidade: (Me mostre o 'ouro escondido' de onde estou.)\n3. Hospitalidade: (Estou recebendo alguém e quero ser o guia definitivo.)`,
  en: `I'm Boba, your modern-day jester and a cultural soul.\n\nWhich path shall we take today?\n\n1. Traveler's Emotions Map: (How am I moving through the world right now?)\n2. A city secret: (Show me the 'hidden gold' where I am.)\n3. Hospitality: (I’m hosting someone and want to be the ultimate guide.)`,
  es: `Hola, soy Boba, tu bufona moderna y alma cultural.\n\n¿Qué camino debemos seguir hoy?\n\n1. Mapa de las Emociones del Viajero: (¿Cómo me muevo por el mundo ahora?)\n2. Un secreto de la ciudad: (Muéstrame el 'oro escondido' donde estoy.)\n3. Hospitalidad: (Recibo a alguien y quiero ser la guía definitiva.)`
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
      ? `\n[METADADOS TÉCNICOS (SIGILO ABSOLUTO): O IP do usuário indica: ${userLocation.city}, ${userLocation.country_name}. Use isso para buscar GEMAS locais se ele pedir.]`
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
    console.warn("Failed to reach Gemini for welcome message. Using fallback.", error);
    isFallbackMode = true; 
    return defaultWelcome;
  }
};

export const sendMessageToGemini = async (userMessage: string, usageCount: number = 0): Promise<string> => {
  // 1. Recuperação de Sessão Perdida ou Nula
  if (!chatSession) {
    try {
      const ai = getAIClient();
      chatSession = ai.chats.create({
        model: 'gemini-3-flash-preview',
        config: { systemInstruction: SYSTEM_INSTRUCTION, tools: [{googleSearch: {}}] },
      });
      isFallbackMode = true;
    } catch (e) {
      console.error("Critical: Could not recreate session object", e);
      return getFacebookErrorMessage();
    }
  }

  try {
    let finalMessageToSend = userMessage;

    // Injeção de Contexto de Contagem para controle de fluxo (2 Encounters Logic)
    let countInjection = `\n\n[SYSTEM NOTE: This is user interaction number ${usageCount}/2 (Lifetime Free Limit).]`;
    
    // Se a contagem for 0, significa que estamos no BETA ou Premium, então não injetamos pressão de limite
    if (usageCount === 0) {
        countInjection = ""; 
    } else if (usageCount === 1) {
      countInjection += `\n[TRIGGER: WARNING] This is the FIRST of 2 interactions. Answer fully, but remind them they have ONE last encounter left.`;
    } else if (usageCount >= 2) {
      countInjection += `\n[TRIGGER: FINAL] This is the LAST allowed interaction. Answer the user's question with depth and closure. Then, proceed immediately to the Closing Ritual (Soft goodbye + Invite to Living Map Premium).`;
    }
    
    finalMessageToSend += countInjection;

    if (isFallbackMode) {
      const welcomeContext = WELCOME_MESSAGES[currentLanguage] || WELCOME_MESSAGES['en'];
      finalMessageToSend = `[SISTEMA: A conexão anterior falhou. O usuário visualizou esta mensagem de boas-vindas: "${welcomeContext}".\n\nAgora, o usuário respondeu:]\n\n"${userMessage}"` + countInjection;
      isFallbackMode = false; 
    }

    const response: GenerateContentResponse = await chatSession.sendMessage({
      message: finalMessageToSend
    });

    return response.text || "";
    
  } catch (error) {
    console.error("Error sending message:", error);
    
    // Retry Logic
    try {
        console.log("Attempting one-time retry...");
        const ai = getAIClient();
        chatSession = ai.chats.create({
            model: 'gemini-3-flash-preview',
            config: { systemInstruction: SYSTEM_INSTRUCTION, tools: [{googleSearch: {}}] },
        });
        
        const retryMessage = `[SISTEMA: Houve uma queda de conexão. Recupere o contexto. O usuário disse:] ${userMessage}`;
        const retryResponse = await chatSession.sendMessage({ message: retryMessage });
        return retryResponse.text || "";
    } catch (retryError) {
        console.error("Retry failed:", retryError);
        return getFacebookErrorMessage();
    }
  }
};

const getFacebookErrorMessage = () => {
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
  
  // Mensagem padrão caso algo falhe
  const defaultMessage = language === 'en' 
      ? "Language switched to English." 
      : language === 'es'
      ? "Idioma cambiado a Español."
      : "Idioma alterado para Português.";

  if (!chatSession) return defaultMessage;
  
  try {
    // 1. Avisa a IA para mudar o idioma interno
    await chatSession.sendMessage({ message: `[SYSTEM COMMAND: User changed language to ${language}. From now on, answer ONLY in ${language}. Reset conversation tone.]` });
    
    // 2. Retorna a mensagem de boas vindas original do novo idioma (hardcoded) para garantir a experiência correta
    return WELCOME_MESSAGES[language];
  } catch (e) {
    return WELCOME_MESSAGES[language] || defaultMessage;
  }
};
