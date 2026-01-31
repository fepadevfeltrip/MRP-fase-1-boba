import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Message, Role, Language, UserLocation } from './types';
import { initializeChat, sendMessageToGemini, changeBotLanguage } from './services/geminiService';
import { saveConversation } from './services/supabaseService';
import { MessageBubble } from './components/MessageBubble';
import { TypingIndicator } from './components/TypingIndicator';
import { UI_STRINGS, BOBA_AVATAR_URL } from './constants';

// Helper para Google Analytics
const trackEvent = (eventName: string, params?: Record<string, any>) => {
  if (typeof window !== 'undefined' && (window as any).gtag) {
    (window as any).gtag('event', eventName, params);
  }
};

// Helper para Gerar/Recuperar ID de Sessão Persistente
// Isso garante que se o usuário der F5, a sessão continua a mesma no banco de dados.
const getSessionId = () => {
  try {
    const stored = sessionStorage.getItem('boba_session_id');
    if (stored) return stored;
    
    const newId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    sessionStorage.setItem('boba_session_id', newId);
    return newId;
  } catch (e) {
    // Fallback caso sessionStorage esteja bloqueado (Navegação Privada restrita)
    return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
};

const App: React.FC = () => {
  // Chat State
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [language, setLanguage] = useState<Language>('pt'); // Default to 'pt' for Brazil context
  const [isConversationFinished, setIsConversationFinished] = useState(false);
  
  // Create a unique ID for this session (Persistent across reloads)
  const sessionIdRef = useRef(getSessionId());
  
  const hasInitialized = useRef(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const userLocationRef = useRef<UserLocation | undefined>(undefined);
  const ui = UI_STRINGS[language];

  const STORAGE_KEY = 'boba_conversation_completed_v1';

  // Logic to set finished state
  const setFinishedInStorage = () => {
    try {
      localStorage.setItem(STORAGE_KEY, 'true');
    } catch (e) {
    }
  };

  const handleResetMemory = () => {
    try {
      localStorage.removeItem(STORAGE_KEY);
      sessionStorage.removeItem('boba_session_id'); // Limpa também a sessão atual
      trackEvent('reset_memory');
      window.location.reload();
    } catch (e) {
      console.error("Failed to reset memory", e);
    }
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  // 1. Sync Normal (Sempre que mensagens mudam)
  useEffect(() => {
    if (messages.length > 0) {
      saveConversation(
        sessionIdRef.current,
        messages,
        userLocationRef.current,
        language
      );
    }
  }, [messages, language]);

  // 2. Sync de Segurança (Quando usuário troca de aba/minimiza)
  // CRÍTICO PARA PESQUISA: Garante que salva antes do browser fechar a conexão.
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'hidden' && messages.length > 0) {
        saveConversation(
          sessionIdRef.current,
          messages,
          userLocationRef.current,
          language
        );
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [messages, language]);

  useEffect(() => {
    // Initialize chat immediately
    if (hasInitialized.current) return;
    hasInitialized.current = true;

    const startConversation = async () => {
      
      // 1. Tenta obter localização (Fail-safe total)
      try {
        const fetchLocation = async () => {
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 1000); // Timeout ultra-rápido de 1s
            try {
                const res = await fetch('https://ipapi.co/json/', { signal: controller.signal });
                clearTimeout(timeoutId);
                if (res.ok) return await res.json();
            } catch (e) {
                return undefined;
            }
        };
        
        const loc = await fetchLocation();
        if (loc) {
            userLocationRef.current = loc;
            trackEvent('user_location_detected', { city: loc.city });
        }
      } catch (e) {
        // Ignora qualquer erro de localização
      }

      // 2. Inicialização do Chat
      try {
        const initialGreeting = await initializeChat(language, false, userLocationRef.current);
        
        const initialMessage: Message = {
          id: Date.now().toString(),
          role: Role.MODEL,
          text: initialGreeting,
          timestamp: Date.now(),
        };
        setMessages([initialMessage]);
        trackEvent('session_start', { language });
      } catch (error) {
        console.error("Error starting chat fatal:", error);
        setMessages([{
           id: 'error',
           role: Role.MODEL,
           text: "Olá! Sou a Boba. (Modo offline/instável ativado). Se não conseguir responder, tente recarregar.",
           timestamp: Date.now()
        }]);
      } finally {
        setIsLoading(false);
      }
    };

    startConversation();
  }, [language]);

  const handleLanguageChange = async (newLang: Language) => {
    if (language === newLang || isLoading) return;
    
    setLanguage(newLang);
    setIsLoading(true);
    trackEvent('language_change', { from: language, to: newLang });

    try {
      const responseText = await changeBotLanguage(newLang);
      
      if (responseText) {
        const botMessage: Message = {
          id: Date.now().toString(),
          role: Role.MODEL,
          text: responseText,
          timestamp: Date.now(),
        };
        setMessages((prev) => [...prev, botMessage]);
      }
    } catch (error) {
      console.error("Error changing language", error);
    } finally {
      setIsLoading(false);
    }
  };

  const checkConversationCompletion = (text: string) => {
    if (text.includes("wa.me/message/BG24GCPKNF6KG1")) {
      setFinishedInStorage();
      setIsConversationFinished(true);
      trackEvent('conversation_completed', { sessionId: sessionIdRef.current });
    }
  };

  const handleSendMessage = useCallback(async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!input.trim() || isLoading || isConversationFinished) return;

    const userText = input;
    setInput('');
    setIsLoading(true);

    const userMessage: Message = {
      id: Date.now().toString(),
      role: Role.USER,
      text: userText,
      timestamp: Date.now(),
    };

    setMessages((prev) => [...prev, userMessage]);
    trackEvent('user_message_sent', { length: userText.length });

    try {
      const responseText = await sendMessageToGemini(userText);
      
      const botMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: Role.MODEL,
        text: responseText,
        timestamp: Date.now(),
      };
      
      setMessages((prev) => [...prev, botMessage]);
      
      checkConversationCompletion(responseText);
      trackEvent('ai_response_received', { 
        response_length: responseText.length,
        language: language
      });

    } catch (err) {
      console.error(err);
      trackEvent('ai_api_error');
      setMessages((prev) => [...prev, {
        id: 'err-' + Date.now(),
        role: Role.MODEL,
        text: "Ops! Minha conexão tropeçou. Pode tentar enviar de novo?",
        timestamp: Date.now()
      }]);
    } finally {
      setIsLoading(false);
    }
  }, [input, isLoading, isConversationFinished, language]);

  return (
    <div className="flex flex-col h-screen bg-[#F8F8F4] relative overflow-hidden font-sans text-slate-800">
      
      <div className="absolute top-0 left-0 w-full h-full pointer-events-none opacity-40 overflow-hidden">
          <div className="absolute top-[-5%] right-[-5%] w-[400px] h-[400px] bg-[#FF7D6B] rounded-full blur-[80px]"></div>
          <div className="absolute bottom-[-10%] left-[-10%] w-[500px] h-[500px] bg-[#006A71] rounded-full blur-[100px] opacity-30"></div>
          <div className="absolute top-[40%] left-[20%] w-[200px] h-[200px] bg-[#EAA823] rounded-full blur-[90px] opacity-20"></div>
      </div>

      <header className="z-10 flex flex-col sm:flex-row items-center justify-between px-6 py-4 bg-[#F8F8F4]/90 backdrop-blur-md border-b border-[#EAA823]/20 sticky top-0 shadow-sm">
        <div className="flex items-center gap-3 mb-3 sm:mb-0">
          <div className="relative w-12 h-12 rounded-full border-2 border-[#FF007F] p-0.5 bg-white overflow-hidden shadow-md">
            <img src={BOBA_AVATAR_URL} alt="Boba" className="w-full h-full object-cover rounded-full" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-[#006A71] tracking-tight">{ui.headerTitle}</h1>
            <p className="text-xs text-[#FF7D6B] font-bold tracking-wide uppercase">{ui.headerSubtitle}</p>
          </div>
        </div>

        <div className="flex bg-white rounded-full p-1 border border-[#006A71]/20 shadow-sm">
          {(['pt', 'en', 'es'] as Language[]).map((lang) => (
            <button 
              key={lang}
              onClick={() => handleLanguageChange(lang)}
              disabled={isLoading}
              className={`px-3 py-1 rounded-full text-xs font-semibold uppercase transition-all ${language === lang ? 'bg-[#006A71] text-white shadow' : 'text-gray-500 hover:text-[#006A71]'} disabled:opacity-50`}
            >
              {lang}
            </button>
          ))}
        </div>
      </header>

      <main className="flex-1 overflow-y-auto p-4 sm:p-6 z-10 scroll-smooth">
        <div className="max-w-3xl mx-auto flex flex-col min-h-full">
          {messages.map((msg) => (
            <MessageBubble key={msg.id} message={msg} />
          ))}
          
          {isLoading && (
            <div className="mb-6">
               <TypingIndicator />
            </div>
          )}
          
          <div ref={messagesEndRef} />
        </div>
      </main>

      <footer className="z-20 p-4 bg-[#F8F8F4]/95 backdrop-blur border-t border-[#006A71]/10">
        <div className="max-w-3xl mx-auto">
          <form 
            onSubmit={handleSendMessage}
            className="flex gap-2 items-center bg-white p-1.5 rounded-full border border-[#006A71]/20 focus-within:ring-2 focus-within:ring-[#006A71]/30 focus-within:border-[#006A71] transition-all shadow-sm"
          >
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder={isConversationFinished ? "Conversa finalizada" : ui.inputPlaceholder}
              disabled={isLoading || isConversationFinished}
              className="flex-1 bg-transparent px-4 py-3 outline-none text-[#006A71] placeholder-gray-400 disabled:opacity-50 disabled:text-gray-400"
            />
            <button
              type="submit"
              disabled={!input.trim() || isLoading || isConversationFinished}
              className="p-3 bg-[#FF007F] text-white rounded-full hover:bg-[#d4006a] disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors shadow-md flex items-center justify-center"
              aria-label={ui.send}
            >
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5 translate-x-0.5">
                <path d="M3.478 2.404a.75.75 0 00-.926.941l2.432 7.905H13.5a.75.75 0 010 1.5H4.984l-2.432 7.905a.75.75 0 00.926.94 60.519 60.519 0 0018.445-8.986.75.75 0 000-1.218A60.517 60.517 0 003.478 2.404z" />
              </svg>
            </button>
          </form>
          <p className="text-center text-[10px] text-[#006A71]/60 mt-2 font-medium">
            {ui.disclaimer}
          </p>
          <button 
            onClick={handleResetMemory}
            className="block mx-auto mt-2 text-[8px] text-gray-300 hover:text-red-400 uppercase tracking-widest transition-colors"
          >
            Reset Memory (Dev)
          </button>
        </div>
      </footer>
    </div>
  );
};

export default App;