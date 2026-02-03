
import React from 'react';

interface TermsModalProps {
  isOpen: boolean;
  onClose: () => void;
  ui: any;
}

export const TermsModal: React.FC<TermsModalProps> = ({ isOpen, onClose, ui }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[3000] flex items-center justify-center px-4 bg-black/60 backdrop-blur-sm">
      <div className="bg-white rounded-3xl p-8 w-full max-w-sm shadow-2xl border border-[#EAA823]/20 relative overflow-hidden animate-in fade-in zoom-in duration-300">
        
        {/* Background Decorations */}
        <div className="absolute top-[-20%] left-[-20%] w-32 h-32 bg-[#006A71]/10 rounded-full blur-2xl"></div>
        <div className="absolute bottom-[-10%] right-[-10%] w-24 h-24 bg-[#FF7D6B]/10 rounded-full blur-xl"></div>
        
        <button 
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition-colors z-20"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
        </button>

        <div className="text-center relative z-10">
            <div className="mx-auto w-12 h-12 bg-[#F8F8F4] rounded-full flex items-center justify-center mb-4 text-2xl shadow-sm border border-gray-100">
                🛡️
            </div>
            
            <h3 className="text-xl font-bold text-[#006A71] mb-4 tracking-tight">
              {ui.termsTitle || "Privacidade & Dados"}
            </h3>
            
            <p className="text-sm text-gray-600 leading-relaxed mb-6 text-left bg-[#F8F8F4] p-4 rounded-xl border border-gray-100">
                {ui.termsContent}
            </p>

            <button
                onClick={onClose}
                className="w-full py-3 bg-[#006A71] text-white font-semibold rounded-full hover:bg-[#00555a] transition-colors shadow-md text-sm uppercase tracking-wide"
            >
                Entendi
            </button>
        </div>
      </div>
    </div>
  );
};
