import React from 'react';
import { COLORS } from '../constants';
import { signInWithGoogle } from '../services/supabaseService';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  ui: any;
  onLoginSuccess: (user: any) => void;
}

export const AuthModal: React.FC<AuthModalProps> = ({ isOpen, onClose, ui, onLoginSuccess }) => {
  if (!isOpen) return null;

  const handleLogin = async () => {
      const { user } = await signInWithGoogle();
      if (user) onLoginSuccess(user);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
      <div className="bg-white rounded-2xl p-6 w-full max-w-sm shadow-2xl relative overflow-hidden">
        {/* Decor */}
        <div className={`absolute top-0 left-0 w-full h-1 bg-[${COLORS.mustard}]`} style={{ backgroundColor: COLORS.mustard }}></div>

        <h3 className={`text-xl font-bold text-[${COLORS.teal}] mb-1`} style={{ color: COLORS.teal }}>{ui.loginTitle}</h3>
        <p className={`text-xs font-bold text-[${COLORS.coral}] uppercase mb-6`} style={{ color: COLORS.coral }}>{ui.loginSubtitle}</p>
        
        <button 
            onClick={handleLogin}
            className={`w-full py-4 rounded-xl border-2 border-[${COLORS.teal}] text-[${COLORS.teal}] font-bold hover:bg-[${COLORS.teal}] hover:text-white transition-all mb-3 flex items-center justify-center gap-2`}
            style={{ borderColor: COLORS.teal, color: COLORS.teal }}
        >
          <span>Continuar como Visitante (Demo)</span>
        </button>
        
        <button onClick={onClose} className="w-full py-2 text-gray-400 text-xs hover:text-gray-600">
          Fechar
        </button>
      </div>
    </div>
  );
};