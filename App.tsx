
import React, { useState, useEffect, useRef, useCallback, ErrorInfo } from 'react';
import { Message, Role, Language, UserLocation, UserProfile, LivingMarker, MarkerType } from './types';
import { initializeChat, sendMessageToGemini, changeBotLanguage } from './services/geminiService';
import { saveConversation, saveFeedback, getUser, getUserProfile, signOut, saveMarker, getMarkers, deleteMarker, updateMarker, subscribeToAuthChanges } from './services/supabaseService';
import { MessageBubble } from './components/MessageBubble';
import { TypingIndicator } from './components/TypingIndicator';
import { FeedbackModal } from './components/FeedbackModal';
import { AuthModal } from './components/AuthModal';
import { LanguageModal } from './components/LanguageModal';
import { PlansModal } from './components/PlansModal';
import { LivingMap } from './components/LivingMap';
import { UI_STRINGS, BOBA_AVATAR_URL } from './constants';

// --- Error Boundary Component ---
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

// --- Usage Logic & Date Scheduling ---

// DATA LIMITE DO BETA: 21 de Fevereiro de 2025 (00:00)
// Até dia 20/02/2025 às 23:59, o uso é ILIMITADO para testes.
const BETA_END_DATE = new Date('2025-02-21T00:00:00').getTime();

const LIMIT_FREE = 2; // LIFETIME TOTAL
const LIMIT_PREMIUM = 50;

// Mudança: Uso Total (Lifetime) ao invés de Diário
const getTotalUsage = (): number => {
  try {
    // Usamos uma chave nova para contar o uso pós-beta
    const stored = localStorage.getItem('boba_free_usage_total');
    if (stored) {
      return parseInt(stored, 10);
    }
    return 0;
  } catch (e) {
    return 0;
  }
};

const incrementTotalUsage = (): number => {
  try {
    const current = getTotalUsage();
    const newCount = current + 1;
    localStorage.setItem('boba_free_usage_total', newCount.toString());
    return newCount;
  } catch (e) {
    return 0;
  }
};

// --- MEMORY SYSTEM (3 DAYS) ---
const MEMORY_KEY = 'boba_chat_history_v2';
const MEMORY_DURATION = 3 * 24 * 60 * 60 * 1000; // 3 dias em ms

const saveMemory = (messages: Message[]) => {
    try {
        const payload = {
            timestamp: Date.now(),
            messages: messages
        };
        localStorage.setItem(MEMORY_KEY, JSON.stringify(payload));
    } catch (e) {
        console.error("Failed to save memory", e);
    }
};

const loadMemory = (): Message[] | null => {
    try {
        const stored = localStorage.getItem(MEMORY_KEY);
        if (!stored) return null;
        
        const { timestamp, messages } = JSON.parse(stored);
        const now = Date.now();
        
        // Verifica se é mais recente que 3 dias
        if (now - timestamp < MEMORY_DURATION) {
            return messages;
        } else {
            localStorage.removeItem(MEMORY_KEY); // Limpa se expirou
            return null;
        }
    } catch (e) {
        return null;
    }
};

const AppContent: React.FC = () => {
  // Chat State
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [language, setLanguage] = useState<Language>('en'); 
  const [isConversationFinished, setIsConversationFinished] = useState(false);
  const [usageCount, setUsageCount] = useState(0);
  
  // Auth & Plan State
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [showLanguageModal, setShowLanguageModal] = useState(false);
  const [showPlansModal, setShowPlansModal] = useState(false);
  
  // Premium View State
  const [currentView, setCurrentView] = useState('chat'); // 'chat' | 'map'
  const [markers, setMarkers] = useState<LivingMarker[]>([]);
  
  // Pinning Flow State (New)
  const [showPinModal, setShowPinModal] = useState(false);
  const [pinTitle, setPinTitle] = useState('');
  const [pinDesc, setPinDesc] = useState('');
  const [selectedPinType, setSelectedPinType] = useState<MarkerType>('place');
  const [pendingCoords, setPendingCoords] = useState<{lat: number, lng: number} | null>(null);
  const [editingMarker, setEditingMarker] = useState<LivingMarker | null>(null);

  // Refs
  const sessionIdRef = useRef(getSessionId());
  const messagesRef = useRef<Message[]>([]);
  const hasInitialized = useRef(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const userLocationRef = useRef<UserLocation | undefined>(undefined);
  
  const ui = UI_STRINGS[language] || UI_STRINGS['en'];

  // --- 1. Load User & Persist Login ---
  useEffect(() => {
    setUsageCount(getTotalUsage());

    // Listener para Auth State (Persistência)
    const unsubscribe = subscribeToAuthChanges(async (user) => {
        if (user) {
            setCurrentUser(user);
            const profile = await getUserProfile(user.id);
            setUserProfile(profile);
            
            // Carrega marcadores
            if (profile?.subscription_tier !== 'free') {
                const loadedMarkers = await getMarkers(user.id);
                setMarkers(loadedMarkers);
            }
        } else {
            setCurrentUser(null);
            setUserProfile(null);
            setMarkers([]);
        }
    });

    return () => {
        unsubscribe();
    };
  }, []);

  // --- 2. Memory System & Initialization ---
  useEffect(() => {
    if (hasInitialized.current) return;
    hasInitialized.current = true;

    const startConversation = async () => {
      // Tenta pegar localização
      try {
        const res = await fetch('https://ipapi.co/json/');
        if (res.ok) {
            const loc = await res.json();
            userLocationRef.current = loc;
        }
      } catch (e) {}

      // Tenta carregar memória de 3 dias
      const memory = loadMemory();
      if (memory && memory.length > 0) {
          setMessages(memory);
          setIsLoading(false);
          // Opcional: Adicionar uma mensagem de sistema "Bem-vindo de volta"
      } else {
          // Inicia nova conversa se não tiver memória
          try {
            const initialGreeting = await initializeChat(language, false, userLocationRef.current);
            const initialMessage: Message = {
              id: Date.now().toString(),
              role: Role.MODEL,
              text: initialGreeting,
              timestamp: Date.now(),
            };
            setMessages([initialMessage]);
          } catch (error) {
            setMessages([{
               id: 'error',
               role: Role.MODEL,
               text: "Hi! I'm Boba. (Offline Mode). Please try reloading the page.",
               timestamp: Date.now()
            }]);
          } finally {
            setIsLoading(false);
          }
      }
    };

    startConversation();
  }, [language]);

  // --- 3. Save Memory on Change ---
  useEffect(() => {
    messagesRef.current = messages;
    if (messages.length > 0) {
        saveMemory(messages); // Salva no LocalStorage (3 dias)
        // Salva no Supabase (Backup nuvem)
        saveConversation(
            sessionIdRef.current,
            messages,
            userLocationRef.current,
            language
        );
    }
  }, [messages, language]);

  // Scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading, currentView]);

  const handleResetMemory = () => {
    localStorage.removeItem(MEMORY_KEY); // Limpa a memória de 3 dias
    // Opcional: Não resetar o uso total para evitar "burla" do free plan
    // localStorage.removeItem('boba_free_usage_total'); 
    sessionStorage.removeItem('boba_session_id');
    window.location.reload();
  };

  const handleLogout = async () => {
      await signOut();
      setCurrentUser(null);
      setUserProfile(null);
      // Opcional: Limpar memória ao sair?
      // localStorage.removeItem(MEMORY_KEY); 
      window.location.reload();
  };

  const handleLanguageChange = async (newLang: Language) => {
    if (language === newLang || isLoading) return;
    setLanguage(newLang);
    setIsLoading(true);
    try {
      // Ao trocar de idioma, a função agora retorna a mensagem de boas-vindas traduzida
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
    
    // LIMIT LOGIC (Com Período de Teste Beta)
    const now = Date.now();
    const isBetaPeriod = now < BETA_END_DATE;
    const isPremium = userProfile?.subscription_tier && userProfile.subscription_tier !== 'free';
    
    // Se for premium OU estiver no período beta, o limite é "infinito"
    // Caso contrário (Free pós-beta), usa o limite total
    const currentLimit = (isPremium || isBetaPeriod) ? LIMIT_PREMIUM : LIMIT_FREE;
    
    const isBlocked = usageCount >= currentLimit;

    if (!input.trim() || isLoading || isConversationFinished) return;
    
    // Se bloqueado, abre modal de upgrade (se free e fora do beta)
    if (isBlocked) {
        if (!isPremium) {
            setShowPlansModal(true);
        }
        return; 
    }

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

    // IMPORTANT: Só incrementamos o contador vitalício se NÃO for Beta e NÃO for Premium.
    // Assim, quando o Beta acabar, o usuário Free começa com 0/2.
    // Durante o Beta, ele pode usar a vontade sem gastar seus "créditos futuros".
    let newUsage = usageCount;
    if (!isBetaPeriod && !isPremium) {
        newUsage = incrementTotalUsage();
        setUsageCount(newUsage);
    }

    try {
      // Passa a contagem para a IA (se for beta, passamos 0 para não gatilhar avisos de fim)
      const usageForPrompt = (isBetaPeriod || isPremium) ? 0 : newUsage;
      const responseText = await sendMessageToGemini(userText, usageForPrompt);
      
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
  }, [input, isLoading, isConversationFinished, language, usageCount, userProfile]);

  // --- PINNING & EDITING LOGIC ---
  
  const handleMapClick = async (lat: number, lng: number) => {
      setEditingMarker(null);
      setPendingCoords({lat, lng});
      setPinTitle('');
      setPinDesc('');
      setSelectedPinType('place');
      setShowPinModal(true);
  };

  const handlePinMessage = (text: string) => {
      setEditingMarker(null);
      const lat = userLocationRef.current?.latitude || -22.9068;
      const lng = userLocationRef.current?.longitude || -43.1729;
      setPendingCoords({ lat, lng });
      setPinTitle(''); 
      setPinDesc(text); 
      setSelectedPinType('presence');
      setShowPinModal(true);
      
      // Se estiver no mobile, pode querer mudar a view para map automaticamente?
      // setCurrentView('map');
  };

  const handleMarkerEdit = (marker: LivingMarker) => {
      setEditingMarker(marker);
      const parts = marker.content.split('\n');
      const title = parts[0] || '';
      const desc = parts.slice(1).join('\n') || '';
      
      setPinTitle(title);
      setPinDesc(desc);
      setSelectedPinType(marker.type);
      setPendingCoords({ lat: marker.lat, lng: marker.lng }); 
      setShowPinModal(true);
  };

  const savePin = async () => {
      if (!currentUser || !pinTitle) return;
      const content = `${pinTitle}\n${pinDesc}`;

      if (editingMarker) {
          // UPDATE
          const success = await updateMarker(editingMarker.id, content, selectedPinType);
          if (success) {
              setMarkers(prev => prev.map(m => m.id === editingMarker.id ? { ...m, content, type: selectedPinType } : m));
          }
      } else if (pendingCoords) {
          // CREATE
          const newMarker = await saveMarker(currentUser.id, content, pendingCoords.lat, pendingCoords.lng, selectedPinType);
          if (newMarker) {
              setMarkers(prev => [...prev, newMarker]);
          }
      }

      setShowPinModal(false);
      setPendingCoords(null);
      setEditingMarker(null);
  };

  const handleDeletePin = async () => {
      if (editingMarker) {
          if (window.confirm("Delete this note?")) {
              const success = await deleteMarker(editingMarker.id);
              if (success) {
                  setMarkers(prev => prev.filter(m => m.id !== editingMarker.id));
              }
              setShowPinModal(false);
              setEditingMarker(null);
          }
      }
  };

  // Logic to determine UI limits
  const isBeta = Date.now() < BETA_END_DATE;
  const isPremium = userProfile?.subscription_tier && userProfile.subscription_tier !== 'free';
  const effectiveLimit = (isPremium || isBeta) ? LIMIT_PREMIUM : LIMIT_FREE;
  const isLimitReached = usageCount >= effectiveLimit;
  const remainingMessages = Math.max(0, effectiveLimit - usageCount);
  
  // Logic for placeholder text
  const getPlaceholderText = () => {
      if (isLimitReached) {
          return isPremium ? ui.limitReachedPremium : ui.upgradeText;
      }
      
      let limitText = "";
      if (isPremium) {
          limitText = "";
      } else if (isBeta) {
          limitText = " (Beta ∞)";
      } else {
          limitText = ` (${remainingMessages} ${language === 'pt' ? 'encontros' : 'encounters'})`;
      }
      
      return `${ui.inputPlaceholder}${limitText}`;
  };

  // --- RENDER CHAT ---
  const renderChatInterface = () => (
    <div className="flex flex-col h-full relative">
       {/* Background */}
       {!isPremium && (
          <div className="absolute top-0 left-0 w-full h-full pointer-events-none opacity-40 overflow-hidden z-0">
             <div className="absolute top-[-5%] right-[-5%] w-[400px] h-[400px] bg-[#FF7D6B] rounded-full blur-[80px]"></div>
             <div className="absolute bottom-[-10%] left-[-10%] w-[500px] h-[500px] bg-[#006A71] rounded-full blur-[100px] opacity-30"></div>
          </div>
       )}

      <header className={`z-10 flex flex-col sm:flex-row items-center justify-between px-6 py-4 bg-[#F8F8F4]/90 backdrop-blur-md border-b border-[#EAA823]/20 sticky top-0 shadow-sm gap-2`}>
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-full border-2 border-[#FF007F] p-0.5 bg-white overflow-hidden shadow-md">
            <img src={BOBA_AVATAR_URL} alt="Boba" className="w-full h-full object-cover rounded-full" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-[#006A71]">{ui.headerTitle}</h1>
            <p className="text-xs text-[#FF7D6B] font-bold uppercase">{ui.headerSubtitle}</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
           {currentUser ? (
               <div className="flex items-center gap-3">
                   <div className="flex flex-col items-end cursor-pointer" onClick={() => setShowPlansModal(true)}>
                       <span className="text-xs font-bold text-[#006A71] hover:underline">{isPremium ? ui.premiumBadge : ui.planFreeName}</span>
                       <button onClick={handleLogout} className="text-[10px] text-gray-400 hover:text-red-500 underline">{ui.logout}</button>
                   </div>
                   {isPremium && <div className="w-2 h-2 rounded-full bg-[#EAA823] shadow-glow" title="Premium Active"></div>}
               </div>
           ) : (
                <button 
                  onClick={() => setShowPlansModal(true)}
                  className="px-4 py-1.5 bg-[#006A71]/10 hover:bg-[#006A71]/20 text-[#006A71] text-xs font-bold rounded-full transition-colors border border-[#006A71]/30"
                >
                  {ui.loginButton}
                </button>
           )}

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
        </div>
      </header>

      <main className="flex-1 overflow-y-auto p-4 sm:p-6 z-10 scroll-smooth">
        <div className="max-w-3xl mx-auto flex flex-col min-h-full">
          {messages.map((msg) => (
            <MessageBubble 
                key={msg.id} 
                message={msg} 
                onPin={isPremium ? handlePinMessage : undefined}
            />
          ))}
          {isLoading && <div className="mb-6"><TypingIndicator /></div>}
          <div ref={messagesEndRef} />
        </div>
      </main>

      <footer className="z-20 p-4 bg-[#F8F8F4]/95 backdrop-blur border-t border-[#006A71]/10">
        <div className="max-w-3xl mx-auto">
          <form 
            onSubmit={handleSendMessage}
            className="flex gap-2 items-center bg-white p-1.5 rounded-full border border-[#006A71]/20 focus-within:ring-2 focus-within:ring-[#006A71]/30"
          >
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder={getPlaceholderText()}
              disabled={isLoading || isConversationFinished || (isLimitReached && !isPremium && !isBeta)}
              className="flex-1 bg-transparent px-4 py-3 outline-none text-[#006A71] placeholder-gray-400 disabled:opacity-50"
            />
            <button
              type={(isLimitReached && !isPremium && !isBeta) ? "button" : "submit"}
              onClick={(e) => {
                  if (isLimitReached && !isPremium && !isBeta) {
                      e.preventDefault();
                      setShowPlansModal(true);
                  }
              }}
              disabled={(!input.trim() && !isLimitReached) || isLoading || isConversationFinished}
              className="p-3 bg-[#FF007F] text-white rounded-full hover:bg-[#d4006a] disabled:bg-gray-300 shadow-md"
            >
              {(isLimitReached && !isPremium && !isBeta) ? <span className="text-[10px] font-bold px-1">UP</span> : "➤"}
            </button>
          </form>
          
          {/* Data Disclaimer & Reset */}
          <div className="mt-2 text-center space-y-1">
             <p className="text-[9px] text-gray-400">
                {ui.dataNotice || "Conversas gravadas para gerar o mapa. Contatos não são salvos."}
             </p>
             <button onClick={handleResetMemory} className="text-[8px] text-gray-300 hover:text-red-400 uppercase tracking-widest">
                Reset Memory
             </button>
          </div>

        </div>
      </footer>
    </div>
  );

  // --- MAIN RENDER ---

  // Modo Free: Chat Fullscreen
  if (!isPremium) {
      return (
        <div className="flex flex-col h-screen bg-[#F8F8F4] font-sans text-slate-800" style={{ height: '100dvh' }}>
           {renderChatInterface()}
           {/* Modals */}
           {showAuthModal && <AuthModal isOpen={showAuthModal} onClose={() => setShowAuthModal(false)} ui={ui} onLoginSuccess={(user) => { setCurrentUser(user); getUserProfile(user.id).then((profile) => { setUserProfile(profile); setShowAuthModal(false); setShowPlansModal(true); }); }} />}
           {showPlansModal && <PlansModal isOpen={showPlansModal} onClose={() => setShowPlansModal(false)} userProfile={userProfile} ui={ui} onLoginClick={() => { setShowPlansModal(false); setShowAuthModal(true); }} />}
        </div>
      );
  }

  // Modo Premium: Split View (Chat + Map)
  return (
    <div className="flex h-screen bg-[#F8F8F4] font-sans text-slate-800 overflow-hidden" style={{ height: '100dvh' }}>
        {/* Sidebar Mini (Navigation) */}
        <aside className="w-16 bg-[#006A71] text-white flex flex-col items-center py-6 z-50 shadow-2xl shrink-0">
            <div className="mb-6 w-10 h-10 rounded-full bg-white p-0.5 border-2 border-[#EAA823] overflow-hidden">
                <img src={BOBA_AVATAR_URL} alt="Boba" className="w-full h-full object-cover" />
            </div>
            
            <nav className="flex-1 flex flex-col gap-4 w-full px-2">
                {/* Chat Button */}
                <button 
                   onClick={() => setCurrentView('chat')} 
                   className={`p-3 rounded-xl transition-all flex flex-col items-center gap-1 ${currentView === 'chat' ? 'bg-white/20 text-[#EAA823]' : 'text-white/70 hover:bg-white/10'}`}
                   title="Chat"
                >
                   <span className="text-xl">💬</span>
                </button>

                {/* Map Button (Visible on all screens, essential for mobile) */}
                <button 
                   onClick={() => setCurrentView('map')} 
                   className={`p-3 rounded-xl transition-all flex flex-col items-center gap-1 ${currentView === 'map' ? 'bg-white/20 text-[#EAA823]' : 'text-white/70 hover:bg-white/10'}`}
                   title="Map"
                >
                   <span className="text-xl">🗺️</span>
                </button>
            </nav>
            
            <button onClick={handleLogout} className="mt-auto text-white/50 hover:text-red-300 text-xs">Exit</button>
        </aside>

        {/* Split Content */}
        <div className="flex-1 flex flex-col md:flex-row h-full relative overflow-hidden">
            
            {/* Left: Chat (Mobile: Only visible if view='chat') */}
            <div className={`w-full md:w-[40%] h-full border-r border-gray-200 bg-white absolute inset-0 md:relative z-10 transition-transform duration-300 ease-in-out ${currentView === 'chat' ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}`}>
                {renderChatInterface()}
            </div>

            {/* Right: Living Map (Mobile: Only visible if view='map') */}
            <div className={`w-full md:w-[60%] h-full relative absolute inset-0 md:relative z-0 ${currentView === 'map' ? 'block' : 'hidden md:block'}`}>
                <LivingMap 
                    markers={markers} 
                    userLocation={userLocationRef.current} 
                    ui={ui} 
                    onMapClick={handleMapClick}
                    onMarkerEdit={handleMarkerEdit}
                />
            </div>
        </div>

        {/* New Pin Modal (Form Style) */}
        {showPinModal && (
            <div className="fixed inset-0 z-[2000] flex items-center justify-center bg-black/60 backdrop-blur-sm px-4">
                <div className="bg-white rounded-[20px] w-full max-w-sm shadow-2xl relative overflow-hidden flex flex-col">
                    
                    {/* Header with Close */}
                    <div className="px-6 py-5 border-b border-gray-100 flex justify-between items-center">
                        <div className="flex items-center gap-2 text-[#006A71]">
                            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path><circle cx="12" cy="10" r="3"></circle></svg>
                            <h3 className="text-lg font-bold">{editingMarker ? "Edit Note" : ui.pinModalTitle}</h3>
                        </div>
                        <button onClick={() => setShowPinModal(false)} className="text-gray-400 hover:text-gray-600">✕</button>
                    </div>

                    {/* Content */}
                    <div className="p-6 space-y-5">
                        {/* Title Input - Explicit BG and Text Color */}
                        <div>
                            <label className="block text-xs font-bold text-[#006A71] uppercase mb-1.5 ml-1">{ui.formTitle} *</label>
                            <input 
                                type="text"
                                value={pinTitle}
                                onChange={(e) => setPinTitle(e.target.value)}
                                placeholder={ui.formPlaceholderTitle}
                                className="w-full p-3 rounded-xl border border-[#006A71]/20 text-sm bg-white text-gray-900 focus:border-[#006A71] focus:ring-1 focus:ring-[#006A71] outline-none"
                                autoFocus
                            />
                        </div>

                        {/* Category Dropdown (Simulated with Buttons for UX) */}
                        <div>
                            <label className="block text-xs font-bold text-[#006A71] uppercase mb-1.5 ml-1">{ui.formCategory}</label>
                            <div className="flex bg-gray-50 rounded-xl p-1 border border-gray-200">
                                {(['presence', 'place', 'culture'] as MarkerType[]).map(type => (
                                    <button
                                        key={type}
                                        onClick={() => setSelectedPinType(type)}
                                        className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all capitalize ${selectedPinType === type ? 'bg-white text-[#006A71] shadow-sm' : 'text-gray-400 hover:text-gray-600'}`}
                                    >
                                        {ui[`pinTag${type.charAt(0).toUpperCase() + type.slice(1)}` as keyof typeof ui] || type}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Description - Explicit BG and Text Color */}
                        <div>
                            <label className="block text-xs font-bold text-[#006A71] uppercase mb-1.5 ml-1">{ui.formDesc}</label>
                            <textarea 
                                value={pinDesc}
                                onChange={(e) => setPinDesc(e.target.value)}
                                placeholder={ui.formPlaceholderDesc}
                                className="w-full p-3 rounded-xl border border-[#006A71]/20 text-sm bg-white text-gray-900 focus:border-[#006A71] focus:ring-1 focus:ring-[#006A71] outline-none resize-none h-24"
                            />
                        </div>

                        {/* Privacy Warning */}
                        <div className="bg-[#EAA823]/10 text-[#EAA823] text-xs font-medium px-4 py-2 rounded-lg flex items-center gap-2">
                             <span>{ui.privateNoteWarning}</span>
                        </div>
                    </div>

                    {/* Footer Actions */}
                    <div className="px-6 py-4 bg-gray-50 flex gap-3">
                         {/* Delete Button (Only in Edit Mode) */}
                        {editingMarker && (
                            <button 
                                onClick={handleDeletePin}
                                className="px-4 py-3 text-red-500 font-bold text-sm bg-white border border-red-100 rounded-xl hover:bg-red-50"
                                title="Delete Note"
                            >
                                🗑️
                            </button>
                        )}
                        
                        <button onClick={() => setShowPinModal(false)} className="flex-1 py-3 text-gray-500 font-bold text-sm bg-white border border-gray-200 rounded-xl hover:bg-gray-100">{ui.pinCancel}</button>
                        <button 
                            onClick={savePin} 
                            disabled={!pinTitle.trim()}
                            className="flex-1 py-3 bg-[#006A71] text-white rounded-xl font-bold shadow-lg hover:bg-[#00555a] disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {editingMarker ? "Update" : ui.pinConfirm}
                        </button>
                    </div>
                </div>
            </div>
        )}

        {/* Global Modals */}
        {showPlansModal && <PlansModal isOpen={showPlansModal} onClose={() => setShowPlansModal(false)} userProfile={userProfile} ui={ui} />}
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
