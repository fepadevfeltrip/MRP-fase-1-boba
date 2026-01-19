import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Message, Role } from './types';
import { initializeChat, sendMessageToGemini } from './services/geminiService';
import { MessageBubble } from './components/MessageBubble';
import { TypingIndicator } from './components/TypingIndicator';

const App: React.FC = () => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(true); // Start loading while initializing
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isLoading]);

  // Initialize Chat on Mount
  useEffect(() => {
    const startConversation = async () => {
      try {
        const initialGreeting = await initializeChat();
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
           text: "Olá! Parece que estou com um pouco de dificuldade para me conectar agora. Tente recarregar a página.",
           timestamp: Date.now()
        }]);
      } finally {
        setIsLoading(false);
      }
    };

    startConversation();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleSendMessage = useCallback(async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!input.trim() || isLoading) return;

    const userText = input;
    setInput('');
    setIsLoading(true);

    // Optimistic User Message
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
    } catch (err) {
      console.error(err);
      // Optional: Add error message to chat
    } finally {
      setIsLoading(false);
    }
  }, [input, isLoading]);

  return (
    <div className="flex flex-col h-screen bg-slate-50 relative overflow-hidden">
      {/* Background decoration */}
      <div className="absolute top-0 left-0 w-full h-full pointer-events-none opacity-50 overflow-hidden">
          <div className="absolute top-[-10%] right-[-10%] w-[500px] h-[500px] bg-orange-100 rounded-full blur-[100px]"></div>
          <div className="absolute bottom-[-10%] left-[-10%] w-[500px] h-[500px] bg-teal-100 rounded-full blur-[100px]"></div>
      </div>

      {/* Header */}
      <header className="z-10 flex items-center justify-between px-6 py-4 bg-white/80 backdrop-blur-md border-b border-gray-200 sticky top-0">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-teal-500 to-orange-400 flex items-center justify-center text-white font-bold text-lg shadow-md">
            B
          </div>
          <div>
            <h1 className="text-xl font-bold text-gray-800 tracking-tight">Feltrip</h1>
            <p className="text-xs text-gray-500 font-medium">Boba • Inteligência Relacional</p>
          </div>
        </div>
      </header>

      {/* Chat Area */}
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

      {/* Input Area */}
      <footer className="z-20 p-4 bg-white/90 backdrop-blur border-t border-gray-200">
        <div className="max-w-3xl mx-auto">
          <form 
            onSubmit={handleSendMessage}
            className="flex gap-2 items-center bg-gray-100 p-1.5 rounded-full border border-gray-200 focus-within:ring-2 focus-within:ring-teal-500/50 focus-within:border-teal-500 transition-all shadow-sm"
          >
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Digite sua mensagem para Boba..."
              disabled={isLoading}
              className="flex-1 bg-transparent px-4 py-3 outline-none text-gray-700 placeholder-gray-400 disabled:opacity-50"
            />
            <button
              type="submit"
              disabled={!input.trim() || isLoading}
              className="p-3 bg-teal-600 text-white rounded-full hover:bg-teal-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors shadow-sm flex items-center justify-center"
              aria-label="Enviar"
            >
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5 translate-x-0.5">
                <path d="M3.478 2.404a.75.75 0 00-.926.941l2.432 7.905H13.5a.75.75 0 010 1.5H4.984l-2.432 7.905a.75.75 0 00.926.94 60.519 60.519 0 0018.445-8.986.75.75 0 000-1.218A60.517 60.517 0 003.478 2.404z" />
              </svg>
            </button>
          </form>
          <p className="text-center text-xs text-gray-400 mt-2">
            A Boba não substitui aconselhamento psicológico profissional.
          </p>
        </div>
      </footer>
    </div>
  );
};

export default App;