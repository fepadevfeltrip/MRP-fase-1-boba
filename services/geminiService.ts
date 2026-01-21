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
      // Prompt construction respecting the mandatory definition and flow
      if (language === 'pt') {
        startPrompt = `[INÍCIO DA SESSÃO]${locationContext} Dê as boas vindas como Boba (leve e divertida).
        OBRIGATÓRIO INCLUIR ESTA DEFINIÇÃO: "O Mapa da Presença Relacional é a métrica da Feltrip que identifica como uma pessoa está se adaptando culturalmente a um novo lugar ou recebendo algum estrangeiro - com foco nas relações e emoções."
        
        PERGUNTAS E AVISOS INICIAIS OBRIGATÓRIOS:
        1. Pergunte se a pessoa autoriza que a equipe da Feltrip leia as respostas para melhoria do serviço.
        2. Avise que você tem dados culturais aprofundados/hiperlocais para RIO DE JANEIRO e SÃO PAULO, mas apoia em qualquer lugar.
        3. Pergunte se a pessoa está CHEGANDO na cidade (migrante/expat) ou se está RECEBENDO pessoas (anfitrião/local).
           (NÃO pergunte o papel/função ainda, espere a resposta).`;
      } else if (language === 'en') {
        startPrompt = `[SESSION START]${locationContext} Welcome user as Boba (light and fun).
        MANDATORY DEFINITION TO INCLUDE: "The Map of Relational Presence is Feltrip's metric that identifies how a person is culturally adapting to a new place or hosting a foreigner - focusing on relationships and emotions."
        
        MANDATORY INITIAL QUESTIONS AND NOTICES:
        1. Ask if they authorize the Feltrip team to read the responses for service improvement.
        2. Notice that you have deep/hyperlocal cultural data for RIO DE JANEIRO and SÃO PAULO, but you support anywhere.
        3. Ask if they are ARRIVING in the city (migrant/expat) or RECEIVING people (host/local).
           (DO NOT ask about their role yet, wait for the answer).`;
      } else {
        startPrompt = `[INICIO DE SESIÓN]${locationContext} Da la bienvenida como Boba (ligera y divertida).
        DEFINICIÓN OBLIGATORIA A INCLUIR: "El Mapa de Presencia Relacional es la métrica de Feltrip que identifica cómo una persona se está adaptando culturalmente a un nuevo lugar o recibiendo a un extranjero - con foco en las relaciones y emociones."
        
        PREGUNTAS Y AVISOS INICIALES OBLIGATORIOS:
        1. Pregunta si autorizan al equipo de Feltrip a leer las respuestas para mejorar el servicio.
        2. Avisa que tienes datos culturales profundos/hiperlocales para RÍO DE JANEIRO y SÃO PAULO, pero apoyas en cualquier lugar.
        3. Pregunta si está LLEGANDO a la ciudad (migrante/expat) o RECIBIENDO personas (anfitrión/local).
           (NO preguntes su función todavía, espera la respuesta).`;
      }
    }

    const response: GenerateContentResponse = await chatSession.sendMessage({
      message: startPrompt
    });
    
    return response.text || "Olá! Eu sou a Boba. Você está chegando ou recebendo?";
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

    let finalText = response.text || "";

    const groundingChunks = response.candidates?.[0]?.groundingMetadata?.groundingChunks;
    
    if (groundingChunks && groundingChunks.length > 0) {
      const uniqueUrls = new Set<string>();
      groundingChunks.forEach((chunk: any) => {
        if (chunk.web?.uri) uniqueUrls.add(chunk.web.uri);
      });

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