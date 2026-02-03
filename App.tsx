import React, { Component, useState, useEffect, useRef, useCallback, ErrorInfo, ReactNode } from 'react';
import { Message, Role, Language, UserLocation, UserProfile, LivingMarker, MarkerType } from './types';
import { initializeChat, sendMessageToGemini, changeBotLanguage } from './services/geminiService';
import { saveConversation, saveFeedback, getUser, getUserProfile, signOut, saveMarker, getMarkers, deleteMarker, updateMarker, subscribeToAuthChanges } from './services/supabaseService';
import { MessageBubble } from './components/MessageBubble';
import { TypingIndicator } from './components/TypingIndicator';
import { FeedbackModal } from './components/FeedbackModal';
import { AuthModal } from './components/AuthModal';
import { LanguageModal } from './components/LanguageModal';
import { PlansModal } from './components/PlansModal';
import { TermsModal } from './components/TermsModal'; // Importar novo componente
import { LivingMap } from './components/LivingMap';
import { UI_STRINGS, BOBA_AVATAR_URL } from './constants';

// --- Error Boundary Component ---
interface ErrorBoundaryProps {
  children?: ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error?: Error;
}

// Fix: Simplified ErrorBoundary to ensure proper property inheritance and inference from React.Component
class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  public state: ErrorBoundaryState = { hasError: false };

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("Uncaught error:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex items-center justify-center h-screen bg-[#F8F8F4] text-[#006A71] p-4 text-center">
          <div>
            <h2 className="text-xl font-bold mb-2">Ops! Algo deu errado.</h2>
            <button onClick={() => window.location.reload()} className="px-4 py-2 bg-[#006A71] text-white rounded-full text-sm">Recarregar</button>
          </div>
        </div>
      );
    }
    // Using children prop passed to the component
    return this.props.children;
  }
}

const trackEvent = (eventName: string, params?: Record<string, any>) => {
  if (typeof window !== 'undefined' && (window as any).gtag) {
    (window as any).gtag('event', eventName, params);
  }
};

const getSessionId = () => {
  try {
    const stored = sessionStorage.getItem('boba_session_id');
    if (stored) return stored;
    const newId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    sessionStorage.setItem('boba_session_id', newId);
    return newId;
  } catch (e) {
    return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
};

// --- DAILY LIMIT SYSTEM (Local) ---
const checkDailyLimit = (): boolean => {
    try {
        const today = new Date().toDateString();
        const storedDate = localStorage.getItem('boba_last_date');
        const storedCount = parseInt(localStorage.getItem('boba_daily_count') || '0');

        if (storedDate !== today) {
            // New day, reset
            localStorage.setItem('boba_last_date', today);
            localStorage.setItem('boba_daily_count', '1'); // Counting the current one
            return true;
        } else {
            if (storedCount >= 2) {
                return false; // Limit reached
            }
            localStorage.setItem('boba_daily_count', (storedCount + 1).toString());
            return true;
        }
    } catch (e) {
        return true;
    }
};

const AppContent: React.FC = () => {
  // Chat State
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [language, setLanguage] = useState<Language>('en'); 
  const [isConversationFinished, setIsConversationFinished] = useState(false);
  const [limitReached, setLimitReached] = useState(false);
  const [isTermsOpen, setIsTermsOpen] = useState(false);
  const [isFeedbackOpen, setIsFeedbackOpen] = useState(false);
  const [pendingRestart, setPendingRestart] = useState(false);
  
  // Auth State (Mantido para futuro, mas hidden na UI)
  const [currentUser, setCurrentUser] = useState<any>(null);
  
  // View State (Forçado para Chat)
  const [currentView, setCurrentView] = useState('chat');
  const [markers, setMarkers] = useState<LivingMarker[]>([]); // Mantido, não usado visualmente

  const sessionIdRef = useRef(getSessionId());
  const hasInitialized = useRef(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const userLocationRef = useRef<UserLocation | undefined>(undefined);
  
  const ui = UI_STRINGS[language] || UI_STRINGS['en'];

  // --- Initialization ---
  useEffect(() => {
    if (hasInitialized.current) return;
    hasInitialized.current = true;

    // Check Limit before starting
    const allowed = checkDailyLimit();
    if (!allowed) {
        setLimitReached(true);
        setMessages([{
            id: 'limit',
            role: Role.MODEL,
            text: ui.limitReached,
            timestamp: Date.now()
        }]);
        setIsLoading(false);
        return;
    }

    const startConversation = async () => {
      try {
        const res = await fetch('https://ipapi.co/json/');
        if (res.ok) {
            const loc = await res.json();
            userLocationRef.current = loc;
        }
      } catch (e) {}

      try {
        const initialGreeting = await initializeChat(language, false, userLocationRef.current);
        setMessages([{
          id: Date.now().toString(),
          role: Role.MODEL,
          text: initialGreeting,
          timestamp: Date.now(),
        }]);
      } catch (error) {
        setMessages([{
           id: 'error',
           role: Role.MODEL,
           text: "...",
           timestamp: Date.now()
        }]);
      } finally {
        setIsLoading(false);
      }
    };

    startConversation();
  }, [language]);

  // Scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

  // --- SAVE CONVERSATION LOGIC (NOVO) ---
  // Salva no Supabase sempre que houver novas mensagens
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

  // Restart Logic handling Feedback
  useEffect(() => {
    if (pendingRestart && !isFeedbackOpen) {
        window.location.reload();
    }
  }, [pendingRestart, isFeedbackOpen]);

  const handleLanguageChange = async (newLang: Language) => {
    if (language === newLang || isLoading) return;
    setLanguage(newLang);
    setIsLoading(true);
    try {
      const welcomeText = await changeBotLanguage(newLang);
      if (welcomeText) {
        setMessages((prev) => [...prev, {
          id: Date.now().toString(),
          role: Role.MODEL,
          text: welcomeText,
          timestamp: Date.now(),
        }]);
      }
    } catch (error) {
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSendMessage = useCallback(async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!input.trim() || isLoading || isConversationFinished || limitReached) return;
    
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
    trackEvent('user_message_sent');

    try {
      const responseText = await sendMessageToGemini(userText);
      setMessages((prev) => [...prev, {
        id: (Date.now() + 1).toString(),
        role: Role.MODEL,
        text: responseText,
        timestamp: Date.now(),
      }]);
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  }, [input, isLoading, isConversationFinished, limitReached]);

  const handleRestartRequest = () => {
     setPendingRestart(true);
     setIsFeedbackOpen(true);
  };

  const handleFeedbackSubmit = async (rating: number, comment: string) => {
    await saveFeedback(sessionIdRef.current, rating, comment);
    setIsFeedbackOpen(false); // This will trigger the useEffect to reload
  };

  return (
    <div className="flex flex-col h-screen bg-[#F8F8F4] font-sans text-slate-800" style={{ height: '100dvh' }}>
       
       {/* Background Visual Effects (Mantidos para estética) */}
       <div className="absolute top-0 left-0 w-full h-full pointer-events-none opacity-40 overflow-hidden z-0">
            <div className="absolute top-[-5%] right-[-5%] w-[400px] h-[400px] bg-[#FF7D6B] rounded-full blur-[80px]"></div>
            <div className="absolute bottom-[-10%] left-[-10%] w-[500px] h-[500px] bg-[#006A71] rounded-full blur-[100px] opacity-30"></div>
       </div>

      {/* Header Simplificado */}
      <header className={`z-10 flex flex-col sm:flex-row items-center justify-between px-6 py-4 bg-[#F8F8F4]/90 backdrop-blur-md border-b border-[#EAA823]/20 sticky top-0 shadow-sm gap-2`}>
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-full border-2 border-[#FF007F] p-0.5 bg-white overflow-hidden shadow-md">
            <img src={BOBA_AVATAR_URL} alt="Boba" className="w-full h-full object-cover" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-[#006A71]">{ui.headerTitle}</h1>
            <p className="text-xs text-[#FF7D6B] font-bold uppercase">{ui.headerSubtitle}</p>
            <a 
              href="http://feltrip.com" 
              target="_blank" 
              rel="noopener noreferrer"
              className="text-[10px] text-[#006A71]/60 hover:text-[#006A71] block -mt-0.5 hover:underline"
            >
              feltrip.com
            </a>
          </div>
        </div>

        <div className="flex items-center gap-2">
            {/* Seletor de Idioma */}
            <div className="flex bg-white rounded-full p-1 border border-[#006A71]/20 shadow-sm">
            {(['en', 'pt', 'es'] as Language[]).map((lang) => (
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
            
            {/* Botão de Restart Discreto */}
            <button onClick={handleRestartRequest} className="text-xs text-gray-400 hover:text-[#006A71] underline ml-2">
                {ui.logout}
            </button>
        </div>
      </header>

      {/* Chat Area */}
      <main className="flex-1 overflow-y-auto p-4 sm:p-6 z-10 scroll-smooth">
        <div className="max-w-3xl mx-auto flex flex-col min-h-full">
          {messages.map((msg) => (
            <MessageBubble 
                key={msg.id} 
                message={msg} 
                // Pinning desabilitado por enquanto
            />
          ))}
          {isLoading && <div className="mb-6"><TypingIndicator /></div>}
          <div ref={messagesEndRef} />
        </div>
      </main>

      {/* Footer Input & Links */}
      <footer className="z-20 p-4 bg-[#F8F8F4]/95 backdrop-blur border-t border-[#006A71]/10">
        <div className="max-w-3xl mx-auto">
          {!limitReached ? (
             <form 
               onSubmit={handleSendMessage}
               className="flex gap-2 items-center bg-white p-1.5 rounded-full border border-[#006A71]/20 focus-within:ring-2 focus-within:ring-[#006A71]/30"
             >
               <input
                 type="text"
                 value={input}
                 onChange={(e) => setInput(e.target.value)}
                 placeholder={ui.inputPlaceholder}
                 disabled={isLoading || isConversationFinished}
                 className="flex-1 bg-transparent px-4 py-3 outline-none text-[#006A71] placeholder-gray-400 disabled:opacity-50"
               />
               <button
                 type="submit"
                 disabled={!input.trim() || isLoading || isConversationFinished}
                 className="p-3 bg-[#FF007F] text-white rounded-full hover:bg-[#d4006a] disabled:bg-gray-300 shadow-md"
               >
                 ➤
               </button>
             </form>
          ) : (
             <div className="text-center p-4 bg-gray-100 rounded-xl text-gray-500 text-sm">
                {ui.limitReached}
             </div>
          )}
          
          <div className="mt-3 text-center space-y-1 flex justify-center items-center gap-4">
             <p className="text-[9px] text-gray-400">{ui.dataNotice}</p>
             <button 
                onClick={() => setIsTermsOpen(true)}
                className="text-[9px] text-[#006A71] underline hover:text-[#004e53]"
             >
                 {ui.termsLink}
             </button>
          </div>
        </div>
      </footer>

      {/* Componentes Modais */}
      <TermsModal isOpen={isTermsOpen} onClose={() => setIsTermsOpen(false)} ui={ui} />
      <FeedbackModal 
        isOpen={isFeedbackOpen} 
        onClose={() => setIsFeedbackOpen(false)} 
        onSubmit={handleFeedbackSubmit} 
        ui={ui} 
      />
      
    </div>
  );
};

const App: React.FC = () => {
  return (
    <ErrorBoundary>
      <AppContent />
    </ErrorBoundary>
  );
};

export default App;