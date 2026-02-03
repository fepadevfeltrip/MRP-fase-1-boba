
import React from 'react';
import { LANGUAGE_APP_URL } from '../constants';

interface LanguageModalProps {
  isOpen: boolean;
  onClose: () => void;
  ui: any;
}

export const LanguageModal: React.FC<LanguageModalProps> = ({ isOpen, onClose, ui }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center px-0 sm:px-4 bg-black/80 backdrop-blur-sm">
      <div className="bg-white rounded-none sm:rounded-3xl w-full h-full sm:h-[90vh] sm:max-w-4xl shadow-2xl border border-[#EAA823]/20 relative overflow-hidden flex flex-col">
        
        {/* Header do Modal */}
        <div className="bg-[#006A71] p-4 flex justify-between items-center text-white shrink-0">
            <h3 className="text-lg font-bold tracking-tight">
                {ui.languageAppTitle || "Feltrip Language Lab"}
            </h3>
            <button 
                onClick={onClose}
                className="bg-white/10 hover:bg-white/20 rounded-full p-2 transition-colors"
            >
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
            </button>
        </div>

        {/* Iframe Content */}
        <div className="flex-1 w-full bg-[#F8F8F4] relative">
             <iframe 
                src={LANGUAGE_APP_URL}
                title="Feltrip Language App"
                className="w-full h-full border-0"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
             />
             
             {/* Fallback visual para placeholder se a URL não estiver definida ainda */}
             {LANGUAGE_APP_URL.includes("example.com") && (
                 <div className="absolute inset-0 flex items-center justify-center bg-white/90 z-10 pointer-events-none">
                     <div className="text-center p-8 max-w-md">
                         <h4 className="text-xl font-bold text-[#FF7D6B] mb-2">🚧 Configuração Pendente</h4>
                         <p className="text-gray-600 text-sm">O link do seu App de Idiomas ainda não foi inserido.</p>
                         <p className="text-xs text-gray-400 mt-4">Edite <code>constants.ts</code> e atualize <code>LANGUAGE_APP_URL</code>.</p>
                     </div>
                 </div>
             )}
        </div>
      </div>
    </div>
  );
};
