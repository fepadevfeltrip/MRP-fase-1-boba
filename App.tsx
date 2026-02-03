
import React, { useState, useEffect, useRef, useCallback, ErrorInfo } from 'react';
import { Message, Role, Language, UserLocation, UserProfile } from './types';
import { initializeChat, sendMessageToGemini, changeBotLanguage } from './services/geminiService';
import { saveConversation, saveFeedback, getUser, getUserProfile, signOut } from './services/supabaseService';
import { MessageBubble } from './components/MessageBubble';
import { TypingIndicator } from './components/TypingIndicator';
import { FeedbackModal } from './components/FeedbackModal';
import { AuthModal } from './components/AuthModal';
import { LanguageModal } from './components/LanguageModal';
import { PlansModal } from './components/PlansModal';
import { UI_STRINGS, BOBA_AVATAR_URL } from './constants';

// --- Error Boundary Component (Para evitar tela branca) ---
interface ErrorBoundaryProps {
  children?: React.ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error?: Error;
}

class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  state: ErrorBoundaryState = { hasError: false };

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
            <p className="text-sm text-gray-600 mb-4">A Boba tropeçou em alguns bits.</p>
            <button 
              onClick={() => window.location.reload()}
              className="px-4 py-2 bg-[#006A71] text-white rounded-full text-sm"
            >
              Recarregar Página
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

// --- Helper Functions ---
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

// --- Daily Usage Logic ---
const DAILY_LIMIT = 12;

const getDailyUsage = (): number => {
  try {
    const today = new Date().toISOString().split('T')[0];
    const stored = localStorage.getItem('boba_daily_usage');
    if (stored) {
      const { date, count } = JSON.parse(stored);
      if (date === today) {
        return count;
      }
    }
    // Se não houver data ou se a data for diferente, reseta
    localStorage.setItem('boba_daily_usage', JSON.stringify({ date: today, count: 0 }));
    return 0;
  } catch (e) {
    return 0;
  }
};

const incrementDailyUsage = (): number => {
  try {
    const today = new Date().toISOString().split('T')[0];
    const current = getDailyUsage();
    const newCount = current + 1;
    localStorage.setItem('boba_daily_usage', JSON.stringify({ date: today, count: newCount }));
    return newCount;
  } catch (e) {
    return 0;
  }
};

const AppContent: React.FC = () => {
  // Chat State
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  // Default language is now English ('en')
  const [language, setLanguage] = useState<Language>('en'); 
  const [isConversationFinished, setIsConversationFinished] = useState(false);
  const [dailyCount, setDailyCount] = useState(0);
  
  // Auth & Plan State
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [showLanguageModal, setShowLanguageModal] = useState(false);
  const [showPlansModal, setShowPlansModal] = useState(false);
  
  // Platform View State (Para usuários Premium)
  // 'chat' | 'groups' | 'finance' | 'photos'
  const [currentView, setCurrentView] = useState('chat');

  // Feedback State
  const [showFeedback, setShowFeedback] = useState(false);
  const [feedbackSubmitted, setFeedbackSubmitted] = useState(false);
  
  // Refs
  const sessionIdRef = useRef(getSessionId());
  const messagesRef = useRef<Message[]>([]);
  const hasInitialized = useRef(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const userLocationRef = useRef<UserLocation | undefined>(undefined);
  
  // Safe UI String Access with Fallback to English
  const ui = UI_STRINGS[language] || UI_STRINGS['en'];

  const STORAGE_KEY = 'boba_conversation_completed_v1';

  // Load Daily Count & User on Mount
  useEffect(() => {
    setDailyCount(getDailyUsage());
    
    const checkUser = async () => {
        const user = await getUser();
        if (user) {
            setCurrentUser(user);
            const profile = await getUserProfile(user.id);
            setUserProfile(profile);
            trackEvent('user_logged_in', { tier: profile?.subscription_tier || 'unknown' });
        }
    };
    checkUser();
  }, []);

  // Sync Ref
  useEffect(() => {
    messagesRef.current = messages;
  }, [messages]);

  // Trigger Feedback
  useEffect(() => {
    if (isConversationFinished && !feedbackSubmitted) {
      const timer = setTimeout(() => {
          setShowFeedback(true);
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, [isConversationFinished, feedbackSubmitted]);

  // Scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading, currentView]);

  const setFinishedInStorage = () => {
    try {
      localStorage.setItem(STORAGE_KEY, 'true');
    } catch (e) {}
  };

  const handleResetMemory = () => {
    try {
      localStorage.removeItem(STORAGE_KEY);
      localStorage.removeItem('boba_daily_usage'); // Reseta a contagem diária também
      sessionStorage.removeItem('boba_session_id');
      trackEvent('reset_memory');
      window.location.reload();
    } catch (e) {
      console.error("Failed to reset memory", e);
    }
  };

  const handleLogout = async () => {
      await signOut();
      setCurrentUser(null);
      setUserProfile(null);
      window.location.reload();
  };

  // Sync to Supabase
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

  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'hidden' && messagesRef.current.length > 0) {
        saveConversation(
          sessionIdRef.current,
          messagesRef.current,
          userLocationRef.current,
          language
        );
      }
    };
    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [language]);

  // Initialization
  useEffect(() => {
    if (hasInitialized.current) return;
    hasInitialized.current = true;

    const startConversation = async () => {
      try {
        const fetchLocation = async () => {
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 1000); 
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
      } catch (e) {}

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
        console.error("Error starting chat:", error);
        setMessages([{
           id: 'error',
           role: Role.MODEL,
           text: "Hi! I'm Boba. (Offline Mode). Please try reloading the page.",
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
        setMessages((prev) => [...prev, {
          id: Date.now().toString(),
          role: Role.MODEL,
          text: responseText,
          timestamp: Date.now(),
        }]);
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
    
    // Se o usuário for Premium (não 'free'), o limite é ignorado.
    const isPremium = userProfile?.subscription_tier && userProfile.subscription_tier !== 'free';
    const isBlocked = !isPremium && dailyCount >= DAILY_LIMIT;

    if (!input.trim() || isLoading || isConversationFinished) return;
    if (isBlocked) return; 

    const userText = input;
    setInput('');
    setIsLoading(true);

    const userMessage: Message = {
      id: Date.now().toString(),
      role: Role.USER,
      text: userText,
      timestamp: Date.now(),
    };

    const newHistory = [...messages, userMessage];
    setMessages(newHistory);
    messagesRef.current = newHistory; 
    saveConversation(sessionIdRef.current, newHistory, userLocationRef.current, language);
    trackEvent('user_message_sent', { length: userText.length });

    // Increment Usage only if NOT premium (or increment but ignore limit)
    const currentUsage = incrementDailyUsage();
    setDailyCount(currentUsage);

    try {
      // Passa a contagem diária para o serviço Gemini
      // Se for Premium, passamos 0 para o prompt nunca disparar o aviso de limite.
      const usageForPrompt = isPremium ? 0 : currentUsage;
      
      const responseText = await sendMessageToGemini(userText, usageForPrompt);
      
      setMessages((prev) => [...prev, {
        id: (Date.now() + 1).toString(),
        role: Role.MODEL,
        text: responseText,
        timestamp: Date.now(),
      }]);
      
      checkConversationCompletion(responseText);
      trackEvent('ai_response_received', { response_length: responseText.length });

    } catch (err) {
      console.error(err);
      setMessages((prev) => [...prev, {
        id: 'err-' + Date.now(),
        role: Role.MODEL,
        text: "Oops! I tripped over some bits. Can you try sending that again?",
        timestamp: Date.now()
      }]);
    } finally {
      setIsLoading(false);
    }
  }, [input, isLoading, isConversationFinished, language, messages, dailyCount, userProfile]);
  
  const handleFeedbackSubmit = async (rating: number, comment: string) => {
    await saveFeedback(sessionIdRef.current, rating, comment);
    setFeedbackSubmitted(true);
    setShowFeedback(false);
    trackEvent('feedback_submitted', { rating });
  };

  const isPremium = userProfile?.subscription_tier && userProfile.subscription_tier !== 'free';
  const isLimitReached = !isPremium && dailyCount >= DAILY_LIMIT;
  const remainingMessages = Math.max(0, DAILY_LIMIT - dailyCount);
  
  // Verifica se é o tier mais alto (Immersion) para mostrar o botão do App de Idiomas
  const isImmersionTier = userProfile?.subscription_tier === 'immersion';

  // --- RENDER LOGIC: CHAT INTERFACE ---
  // Extraímos a interface do chat para reutilizar dentro ou fora do layout premium
  const renderChatInterface = () => (
    <div className="flex flex-col h-full relative">
       {/* Background (only if not in platform mode, or we can keep it consistent) */}
       {!isPremium && (
          <div className="absolute top-0 left-0 w-full h-full pointer-events-none opacity-40 overflow-hidden z-0">
             <div className="absolute top-[-5%] right-[-5%] w-[400px] h-[400px] bg-[#FF7D6B] rounded-full blur-[80px]"></div>
             <div className="absolute bottom-[-10%] left-[-10%] w-[500px] h-[500px] bg-[#006A71] rounded-full blur-[100px] opacity-30"></div>
             <div className="absolute top-[40%] left-[20%] w-[200px] h-[200px] bg-[#EAA823] rounded-full blur-[90px] opacity-20"></div>
          </div>
       )}

      <header className={`z-10 flex flex-col sm:flex-row items-center justify-between px-6 py-4 bg-[#F8F8F4]/90 backdrop-blur-md border-b border-[#EAA823]/20 sticky top-0 shadow-sm gap-2 ${isPremium ? 'rounded-t-3xl sm:rounded-none' : ''}`}>
        <div className="flex items-center gap-3 mb-3 sm:mb-0">
          <div className="relative w-12 h-12 rounded-full border-2 border-[#FF007F] p-0.5 bg-white overflow-hidden shadow-md">
            <img src={BOBA_AVATAR_URL} alt="Boba" className="w-full h-full object-cover rounded-full" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-[#006A71] tracking-tight">{ui.headerTitle}</h1>
            <p className="text-xs text-[#FF7D6B] font-bold tracking-wide uppercase">{ui.headerSubtitle}</p>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row items-center gap-2">
           {/* Botão de Login / Perfil */}
           {currentUser ? (
               <div className="flex items-center gap-3">
                   {/* Botão do App de Idiomas (Só aparece para o plano Immersion) */}
                   {isImmersionTier && (
                       <button
                           onClick={() => setShowLanguageModal(true)}
                           className="flex items-center gap-1 px-3 py-1.5 bg-[#EAA823]/20 hover:bg-[#EAA823]/30 text-[#006A71] text-xs font-bold rounded-full transition-colors border border-[#EAA823]/40"
                       >
                           <span className="text-sm">🗣️</span> {ui.openLanguageApp}
                       </button>
                   )}

                   <div className="flex flex-col items-end cursor-pointer" onClick={() => setShowPlansModal(true)}>
                       <span className="text-xs font-bold text-[#006A71] hover:underline">{isPremium ? ui.premiumBadge : ui.planFreeName}</span>
                       <button onClick={handleLogout} className="text-[10px] text-gray-400 hover:text-red-500 underline">{ui.logout}</button>
                   </div>
                   {isPremium && (
                       <div className="w-2 h-2 rounded-full bg-[#EAA823] shadow-glow" title="Premium Active"></div>
                   )}
               </div>
           ) : (
                <button 
                  onClick={() => setShowAuthModal(true)}
                  className="px-4 py-1.5 bg-[#006A71]/10 hover:bg-[#006A71]/20 text-[#006A71] text-xs font-bold rounded-full transition-colors border border-[#006A71]/30"
                >
                  {ui.loginButton}
                </button>
           )}

            <div className="flex bg-white rounded-full p-1 border border-[#006A71]/20 shadow-sm mt-2 sm:mt-0">
            {/* Reordenação: English First */}
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
              placeholder={isLimitReached ? (ui.upgradeText || "Upgrade needed.") : (isConversationFinished ? "Chat finished" : `${ui.inputPlaceholder} ${!isPremium ? `(${remainingMessages})` : '∞'}`)}
              disabled={isLoading || isConversationFinished || isLimitReached}
              className="flex-1 bg-transparent px-4 py-3 outline-none text-[#006A71] placeholder-gray-400 disabled:opacity-50 disabled:text-gray-400"
            />
            <button
              type="submit"
              disabled={!input.trim() || isLoading || isConversationFinished || isLimitReached}
              className="p-3 bg-[#FF007F] text-white rounded-full hover:bg-[#d4006a] disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors shadow-md flex items-center justify-center"
              aria-label={ui.send}
            >
              {isLimitReached ? (
                  <span className="text-[10px] font-bold px-1" onClick={() => setShowPlansModal(true)}>UP</span> 
              ) : (
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5 translate-x-0.5">
                    <path d="M3.478 2.404a.75.75 0 00-.926.941l2.432 7.905H13.5a.75.75 0 010 1.5H4.984l-2.432 7.905a.75.75 0 00.926.94 60.519 60.519 0 0018.445-8.986.75.75 0 000-1.218A60.517 60.517 0 003.478 2.404z" />
                  </svg>
              )}
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

  // --- RENDER LOGIC: COMING SOON ---
  const renderComingSoon = (featureName: string) => (
    <div className="flex flex-col h-full items-center justify-center text-center p-8 bg-[#F8F8F4] relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-full pointer-events-none opacity-20">
             <div className="absolute top-[-10%] right-[-10%] w-[400px] h-[400px] bg-[#EAA823] rounded-full blur-[80px]"></div>
             <div className="absolute bottom-[-10%] left-[-10%] w-[500px] h-[500px] bg-[#006A71] rounded-full blur-[100px]"></div>
        </div>
        <div className="z-10 bg-white/80 backdrop-blur-md p-10 rounded-3xl border border-[#006A71]/10 shadow-xl max-w-md">
            <div className="text-6xl mb-6">🚧</div>
            <h2 className="text-2xl font-bold text-[#006A71] mb-2">{featureName}</h2>
            <h3 className="text-sm font-bold text-[#EAA823] uppercase tracking-wider mb-6">{ui.featureComingSoon || "Em Construção"}</h3>
            <p className="text-gray-600 leading-relaxed">
                {ui.featureComingSoonDesc || "Estamos construindo essa funcionalidade para sua tribo."}
            </p>
            <button 
                onClick={() => setCurrentView('chat')}
                className="mt-8 px-6 py-2 bg-[#006A71] text-white rounded-full text-sm font-semibold hover:bg-[#00555a] transition-colors"
            >
                Voltar para Boba
            </button>
        </div>
    </div>
  );

  // --- RENDER LOGIC: MAIN APP ---
  
  // Se for Free User, renderiza apenas o Chat (Site da Boba)
  if (!isPremium) {
      return (
        <div className="flex flex-col h-screen bg-[#F8F8F4] relative overflow-hidden font-sans text-slate-800">
           {renderChatInterface()}
           
           {/* Modais Globais */}
           {showFeedback && <FeedbackModal isOpen={showFeedback} onClose={() => setShowFeedback(false)} onSubmit={handleFeedbackSubmit} ui={ui} />}
           {showAuthModal && <AuthModal isOpen={showAuthModal} onClose={() => setShowAuthModal(false)} ui={ui} onLoginSuccess={(user) => { setCurrentUser(user); getUserProfile(user.id).then((profile) => { setUserProfile(profile); setShowAuthModal(false); setShowPlansModal(true); }); }} />}
           {showPlansModal && <PlansModal isOpen={showPlansModal} onClose={() => setShowPlansModal(false)} userProfile={userProfile} ui={ui} />}
           {showLanguageModal && <LanguageModal isOpen={showLanguageModal} onClose={() => setShowLanguageModal(false)} ui={ui} />}
        </div>
      );
  }

  // Se for Premium, renderiza o Layout da Plataforma (Sidebar + Content)
  return (
    <div className="flex h-screen bg-[#F8F8F4] font-sans text-slate-800 overflow-hidden">
        {/* Sidebar */}
        <aside className="w-20 lg:w-64 bg-[#006A71] text-white flex flex-col items-center lg:items-start py-6 border-r border-[#EAA823]/20 shadow-2xl z-50">
            <div className="mb-8 px-4 flex items-center gap-3">
                 <div className="w-10 h-10 rounded-full bg-white p-0.5 overflow-hidden border-2 border-[#EAA823]">
                     <img src={BOBA_AVATAR_URL} alt="Boba" className="w-full h-full object-cover rounded-full" />
                 </div>
                 <span className="hidden lg:block font-bold text-xl tracking-tight">Feltrip</span>
            </div>

            <nav className="flex-1 w-full px-2 space-y-2">
                <button 
                    onClick={() => setCurrentView('chat')}
                    className={`w-full flex items-center gap-3 px-3 py-3 rounded-xl transition-all ${currentView === 'chat' ? 'bg-white/10 text-[#EAA823] font-bold' : 'text-white/70 hover:bg-white/5 hover:text-white'}`}
                >
                    <span className="text-xl">💬</span>
                    <span className="hidden lg:block text-sm">{ui.navChat || "Chat"}</span>
                </button>

                <button 
                    onClick={() => setCurrentView('groups')}
                    className={`w-full flex items-center gap-3 px-3 py-3 rounded-xl transition-all ${currentView === 'groups' ? 'bg-white/10 text-[#EAA823] font-bold' : 'text-white/70 hover:bg-white/5 hover:text-white'}`}
                >
                    <span className="text-xl">🌍</span>
                    <span className="hidden lg:block text-sm">{ui.navGroups || "Groups"}</span>
                </button>

                <button 
                    onClick={() => setCurrentView('finance')}
                    className={`w-full flex items-center gap-3 px-3 py-3 rounded-xl transition-all ${currentView === 'finance' ? 'bg-white/10 text-[#EAA823] font-bold' : 'text-white/70 hover:bg-white/5 hover:text-white'}`}
                >
                    <span className="text-xl">💸</span>
                    <span className="hidden lg:block text-sm">{ui.navFinance || "Finance"}</span>
                </button>

                <button 
                    onClick={() => setCurrentView('photos')}
                    className={`w-full flex items-center gap-3 px-3 py-3 rounded-xl transition-all ${currentView === 'photos' ? 'bg-white/10 text-[#EAA823] font-bold' : 'text-white/70 hover:bg-white/5 hover:text-white'}`}
                >
                    <span className="text-xl">📸</span>
                    <span className="hidden lg:block text-sm">{ui.navPhotos || "Photos"}</span>
                </button>
            </nav>

            <div className="mt-auto w-full px-4">
                 <div className="bg-[#00555a] rounded-xl p-3 text-center mb-4 hidden lg:block">
                     <p className="text-[10px] text-white/60 uppercase font-bold tracking-widest mb-1">{ui.planCurrent}</p>
                     <p className="text-xs font-bold text-[#EAA823] uppercase">{userProfile?.subscription_tier}</p>
                 </div>
                 <button onClick={handleLogout} className="text-xs text-white/50 hover:text-red-300 w-full text-center lg:text-left px-2">
                     {ui.logout}
                 </button>
            </div>
        </aside>

        {/* Main Content Area */}
        <div className="flex-1 flex flex-col h-full relative overflow-hidden bg-white sm:rounded-l-3xl shadow-inner">
            {currentView === 'chat' && renderChatInterface()}
            {currentView === 'groups' && renderComingSoon(ui.navGroups || "Groups")}
            {currentView === 'finance' && renderComingSoon(ui.navFinance || "Finance")}
            {currentView === 'photos' && renderComingSoon(ui.navPhotos || "Photos")}
        </div>

        {/* Modais Globais (Repetidos aqui para garantir contexto) */}
        {showFeedback && <FeedbackModal isOpen={showFeedback} onClose={() => setShowFeedback(false)} onSubmit={handleFeedbackSubmit} ui={ui} />}
        {showAuthModal && <AuthModal isOpen={showAuthModal} onClose={() => setShowAuthModal(false)} ui={ui} onLoginSuccess={(user) => { setCurrentUser(user); getUserProfile(user.id).then((profile) => { setUserProfile(profile); setShowAuthModal(false); setShowPlansModal(true); }); }} />}
        {showPlansModal && <PlansModal isOpen={showPlansModal} onClose={() => setShowPlansModal(false)} userProfile={userProfile} ui={ui} />}
        {showLanguageModal && <LanguageModal isOpen={showLanguageModal} onClose={() => setShowLanguageModal(false)} ui={ui} />}
    </div>
  );
};

// Wrap com Error Boundary
const App: React.FC = () => {
  return (
    <ErrorBoundary>
      <AppContent />
    </ErrorBoundary>
  );
};

export default App;
