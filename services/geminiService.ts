import { GoogleGenAI, Chat, GenerateContentResponse } from "@google/genai";
import { SYSTEM_INSTRUCTION } from "../constants";

let chatSession: Chat | null = null;

// Initialize the API client
// Ideally this should be outside the render cycle, but inside a service
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

export const initializeChat = async (): Promise<string> => {
  try {
    chatSession = ai.chats.create({
      model: 'gemini-2.5-flash-latest', // High speed, good reasoning
      config: {
        systemInstruction: SYSTEM_INSTRUCTION,
        temperature: 0.7, // Balanced creativity and coherence
      },
    });

    // We trigger the conversation by asking the model to start according to its instructions.
    // This message is internal and doesn't need to be shown to the user if we don't want to,
    // but typically we want the model's first output to be the greeting.
    // However, the `chatSession` is fresh. We can send an empty prompt or a "Start" prompt.
    const response: GenerateContentResponse = await chatSession.sendMessage({
      message: "Olá! Por favor, comece a conversa se apresentando como Boba e seguindo o fluxo definido."
    });
    
    return response.text || "Olá! Eu sou a Boba. Como posso ajudar hoje?";
  } catch (error) {
    console.error("Failed to initialize chat:", error);
    return "Desculpe, estou tendo dificuldades para conectar ao meu sistema de inteligência cultural. Por favor, verifique sua conexão.";
  }
};

export const sendMessageToGemini = async (userMessage: string): Promise<string> => {
  if (!chatSession) {
    // Re-initialize if lost (shouldn't happen in single session usually)
    await initializeChat();
  }

  if (!chatSession) {
    throw new Error("Chat session could not be established.");
  }

  try {
    const response: GenerateContentResponse = await chatSession.sendMessage({
      message: userMessage
    });
    return response.text || "";
  } catch (error) {
    console.error("Error sending message:", error);
    return "Tive um pequeno lapso de atenção. Poderia repetir, por favor?";
  }
};