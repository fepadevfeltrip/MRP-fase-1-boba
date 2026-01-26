import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Message, Role, Language, UserLocation } from './types';
import { initializeChat, sendMessageToGemini, changeBotLanguage } from './services/geminiService';
import { saveConversation, verifyAccessCode } from './services/supabaseService';
import { MessageBubble } from './components/MessageBubble';
import { TypingIndicator } from './components/TypingIndicator';
import { UI_STRINGS, BOBA_AVATAR_URL } from './constants';

const App: React.FC = () => {
  // Access Control State
  const [isAccessGranted, setIsAccessGranted] = useState(false);
  const [accessCodeInput, setAccessCodeInput] = useState('');
  const [accessError, setAccessError] = useState('');
  const [isVerifying, setIsVerifying] = useState(false);

  // Chat State
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [language, setLanguage] = useState<Language>('pt');
  const [isConversationFinished, setIsConversationFinished] = useState(false);
  
  // Privacy State: 'pending' (default - saves), 'granted' (saves), 'denied' (does not save)
  const [consentStatus, setConsentStatus] = useState<'pending' | 'granted' | 'denied'>('pending');
  
  // Create a unique ID for this session
  const sessionIdRef = useRef(`session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`);
  
  const hasInitialized = useRef(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const userLocationRef = useRef<UserLocation | undefined>(undefined);
  const ui = UI_STRINGS[language];

  const STORAGE_KEY = 'boba_conversation_completed_v1';
  const ACCESS_KEY = 'boba_access_granted_v1';

  // --- ACCESS CONTROL LOGIC ---
  useEffect(() => {
    const hasAccess = localStorage.getItem(ACCESS_KEY);
    if (hasAccess === 'true') {
      setIsAccessGranted(true);
    }
  }, []);

  const handleAccessSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!accessCodeInput.trim()) return;

    setIsVerifying(true);
    setAccessError('');

    const isValid = await verifyAccessCode(accessCodeInput);

    if (isValid) {
      localStorage.setItem(ACCESS_KEY, 'true');
      setIsAccessGranted(true);
    } else {
      setAccessError('Código inválido ou expirado.');
    }
    setIsVerifying(false);
  };
  // ---------------------------

  const checkHasFinished = () => {
    try {
      return localStorage.getItem(STORAGE_KEY) === 'true';
    } catch (e) {
      return false;
    }
  };

  const setFinishedInStorage = () => {
    try {
      localStorage.setItem(STORAGE_KEY, 'true');
    } catch (e) {
    }
  };

  const handleResetMemory = () => {
    try {
      localStorage.removeItem(STORAGE_KEY);
      localStorage.removeItem(ACCESS_KEY); // Also reset access for testing
      window.location.reload();
    } catch (e) {
      console.error("Failed to reset memory", e);
    }
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  // Simple heuristic to detect explicit denial
  const detectConsent = (text: string): 'granted' | 'denied' | 'pending' => {
    const lower = text.toLowerCase();
    
    // Check for denial keywords
    if (/\b(n(ã|a)o|no|nunca|jamais|recuso|discordo|pare|stop)\b/i.test(lower)) {
      return 'denied';
    }
    // Check for explicit grant
    if (/\b(sim|yes|si|s|claro|ok|pode|aceito|autorizo|concordo|tá|ta|vamos|bora|beleza|fechou|vai)\b/i.test(lower)) {
      return 'granted';
    }

    return 'pending';
  };

  // Sync with Supabase
  useEffect(() => {
    // SECURITY/PRIVACY UPDATE: 
    // Save by default (Legitimate Interest/Beta Test) UNLESS explicitly denied.
    // This fixes the issue where neutral conversations weren't being saved.
    if (messages.length > 0 && consentStatus !== 'denied') {
      console.log("[App] Syncing conversation to Supabase...");
      saveConversation(
        sessionIdRef.current,
        messages,
        userLocationRef.current,
        language
      );
    }
  }, [messages, language, consentStatus]);

  useEffect(() => {
    // Only initialize chat if access is granted
    if (hasInitialized.current || !isAccessGranted) return;
    hasInitialized.current = true;

    const startConversation = async () => {
      const hasFinished = checkHasFinished();
      
      let userLocation: UserLocation | undefined = undefined;
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 3000);
        
        const res = await fetch('https://ipapi.co/json/', { signal: controller.signal });
        clearTimeout(timeoutId);
        
        if (res.ok) {
           userLocation = await res.json();
           userLocationRef.current = userLocation;
        }
      } catch (e) {
        console.warn("Location fetch skipped or timed out.");
      }
      
      if (hasFinished) {
        setIsConversationFinished(true);
        try {
          const blockMessage = await initializeChat(language, true, userLocation);
          setMessages([{
            id: Date.now().toString(),
            role: Role.MODEL,
            text: blockMessage,
            timestamp: Date.now(),
          }]);
        } catch (e) {
          console.error(e);
        } finally {
          setIsLoading(false);
        }
        return;
      }

      try {
        const initialGreeting = await initializeChat(language, false, userLocation);
        const initialMessage: Message = {
          id: Date.now().toString(),
          role: Role.MODEL,
          text: initialGreeting,
          timestamp: Date.now(),
        };
        setMessages([initialMessage]);
      } catch (error) {
        console.error("Error starting chat", error);
        setMessages([{
           id: 'error',
           role: Role.MODEL,
           text: "Tive um probleminha para carregar. Por favor, recarregue a página.",
           timestamp: Date.now()
        }]);
      } finally {
        setIsLoading(false);
      }
    };

    startConversation();
  }, [language, isAccessGranted]);

  const handleLanguageChange = async (newLang: Language) => {
    if (language === newLang || isLoading) return;
    
    setLanguage(newLang);
    setIsLoading(true);

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
    }
  };

  const handleSendMessage = useCallback(async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!input.trim() || isLoading || isConversationFinished) return;

    const userText = input;
    setInput('');
    setIsLoading(true);

    // Update consent status based on user input
    if (consentStatus === 'pending') {
      const detected = detectConsent(userText);
      if (detected !== 'pending') {
        setConsentStatus(detected);
        if (detected === 'denied') {
          console.log("PRIVACY: User denied consent. Supabase sync disabled.");
        }
      }
    }

    const userMessage: Message = {
      id: Date.now().toString(),
      role: Role.USER,
      text: userText,
      timestamp: Date.now(),
    };

    setMessages((prev) => [...prev, userMessage]);

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

    } catch (err) {
      console.error(err);
      setMessages((prev) => [...prev, {
        id: 'err-' + Date.now(),
        role: Role.MODEL,
        text: "Ops! Minha conexão tropeçou. Pode tentar enviar de novo?",
        timestamp: Date.now()
      }]);
    } finally {
      setIsLoading(false);
    }
  }, [input, isLoading, isConversationFinished, consentStatus]);

  // RENDER: ACCESS GATEKEEPER
  if (!isAccessGranted) {
    return (
      <div className="flex flex-col h-screen bg-[#F8F8F4] relative overflow-hidden font-sans text-slate-800 items-center justify-center p-6">
        <div className="absolute top-0 left-0 w-full h-full pointer-events-none opacity-40 overflow-hidden">
          <div className="absolute top-[-5%] right-[-5%] w-[400px] h-[400px] bg-[#FF7D6B] rounded-full blur-[80px]"></div>
          <div className="absolute bottom-[-10%] left-[-10%] w-[500px] h-[500px] bg-[#006A71] rounded-full blur-[100px] opacity-30"></div>
        </div>

        <div className="z-10 bg-white/80 backdrop-blur-lg p-8 rounded-3xl shadow-xl border border-[#006A71]/10 max-w-sm w-full text-center">
          <div className="w-20 h-20 rounded-full border-4 border-[#EAA823] p-1 bg-white overflow-hidden shadow-md mx-auto mb-6">
             <img src={BOBA_AVATAR_URL} alt="Boba" className="w-full h-full object-cover rounded-full" />
          </div>
          
          <h1 className="text-2xl font-bold text-[#006A71] mb-2">Feltrip • Boba</h1>
          <p className="text-gray-500 mb-6 text-sm">Insira seu código de convite para acessar a inteligência relacional.</p>

          <form onSubmit={handleAccessSubmit} className="flex flex-col gap-4">
            <input
              type="text"
              value={accessCodeInput}
              onChange={(e) => setAccessCodeInput(e.target.value)}
              placeholder="Código de acesso"
              className="px-4 py-3 rounded-xl border border-gray-200 focus:border-[#006A71] focus:ring-2 focus:ring-[#006A71]/20 outline-none transition-all text-center uppercase tracking-widest text-lg placeholder:text-gray-300 placeholder:normal-case placeholder:tracking-normal"
            />
            
            {accessError && (
              <p className="text-[#FF007F] text-xs font-semibold">{accessError}</p>
            )}

            <button
              type="submit"
              disabled={isVerifying || !accessCodeInput}
              className="bg-[#006A71] text-white font-bold py-3 rounded-xl hover:bg-[#00555a] transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg hover:shadow-xl active:scale-95"
            >
              {isVerifying ? 'Verificando...' : 'Entrar'}
            </button>
          </form>
          
          <p className="mt-6 text-xs text-gray-400">
            Acesso exclusivo para convidados.
          </p>
        </div>
      </div>
    );
  }

  // RENDER: MAIN APP (LOGGED IN)
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
          <p className="text-center text-xs text-[#006A71]/60 mt-2 font-medium">
            {ui.disclaimer}
          </p>
          <button 
            onClick={handleResetMemory}
            className="block mx-auto mt-2 text-[10px] text-gray-300 hover:text-red-400 uppercase tracking-widest transition-colors"
          >
            Reset Memory & Access (Dev)
          </button>
        </div>
      </footer>
    </div>
  );
};

export default App;