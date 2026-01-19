import { GoogleGenAI, Chat, GenerateContentResponse } from "@google/genai";
import { SYSTEM_INSTRUCTION } from "../constants";

let chatSession: Chat | null = null;

// Initialize the API client
// Ideally this should be outside the render cycle, but inside a service
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

export const initializeChat = async (): Promise<string> => {
  try {
    chatSession = ai.chats.create({
      model: 'gemini-3-flash-preview', // Updated to the recommended latest model
      config: {
        systemInstruction: SYSTEM_INSTRUCTION,
        temperature: 0.7, // Balanced creativity and coherence
      },
    });

    // We trigger the conversation by asking the model to start according to its instructions.
    const response: GenerateContentResponse = await chatSession.sendMessage({
      message: "Olá! Por favor, comece a conversa se apresentando como Boba e seguindo o fluxo definido."
    });
    
    return response.text || "Olá! Eu sou a Boba. Como posso ajudar hoje?";
  } catch (error) {
    console.error("Failed to initialize chat:", error);
    // More descriptive error for debugging in console
    if (error instanceof Error) {
      console.error("Error details:", error.message);
    }
    return "Desculpe, estou tendo dificuldades para conectar ao meu sistema de inteligência cultural. Por favor, verifique se sua chave de API está ativa.";
  }
};

export const sendMessageToGemini = async (userMessage: string): Promise<string> => {
  if (!chatSession) {
    // Re-initialize if lost (shouldn't happen in single session usually)
    await initializeChat();
  }

  if (!chatSession) {
    // If still null after retry
    return "Não foi possível restabelecer a conexão. Por favor, recarregue a página.";
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