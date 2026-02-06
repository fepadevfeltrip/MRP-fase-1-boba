import React from 'react';
import { COLORS } from '../constants';

interface ComingSoonModalProps {
  isOpen: boolean;
  onClose: () => void;
  ui: any;
}

export const ComingSoonModal: React.FC<ComingSoonModalProps> = ({ isOpen, onClose, ui }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/30 backdrop-blur-md">
      <div className="bg-white rounded-2xl p-8 w-full max-w-sm shadow-2xl text-center relative overflow-hidden">
        <div className={`absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-[${COLORS.teal}] to-[${COLORS.mustard}]`}></div>
        
        <div className="text-4xl mb-4">✨</div>
        <h3 className={`text-2xl font-bold text-[${COLORS.teal}] mb-2`} style={{ color: COLORS.teal }}>{ui.comingSoon}</h3>
        <p className="text-gray-600 mb-6 leading-relaxed">
          Florianópolis está sendo mapeada pelos nossos guardiões. A magia da ilha requer tempo para ser traduzida em códigos.
        </p>
        
        <button 
          onClick={onClose} 
          className={`w-full py-3 bg-[${COLORS.mustard}] text-white font-bold rounded-xl shadow-lg hover:shadow-xl transition-all`}
          style={{ backgroundColor: COLORS.mustard }}
        >
          Aguardar a Magia
        </button>
      </div>
    </div>
  );
};