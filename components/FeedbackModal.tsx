import React from 'react';
import { COLORS } from '../constants';

interface FeedbackModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: () => void;
  ui: any;
}

export const FeedbackModal: React.FC<FeedbackModalProps> = ({ isOpen, onClose, onSubmit, ui }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/20 backdrop-blur-sm">
      <div className="bg-white rounded-2xl p-6 w-full max-w-sm shadow-xl border border-gray-100">
        <h3 className={`text-lg font-bold text-[${COLORS.teal}] mb-2`} style={{ color: COLORS.teal }}>Recalibrar?</h3>
        <p className="text-sm text-gray-600 mb-6">Deseja reiniciar a conversa e recalibrar sua bússola?</p>
        
        <div className="flex gap-3">
          <button onClick={onClose} className="flex-1 py-3 text-gray-500 font-bold text-sm bg-gray-50 rounded-xl hover:bg-gray-100">
            Cancelar
          </button>
          <button 
            onClick={onSubmit} 
            className={`flex-1 py-3 text-white font-bold text-sm rounded-xl bg-[${COLORS.teal}] hover:opacity-90`}
            style={{ backgroundColor: COLORS.teal }}
          >
            Reiniciar
          </button>
        </div>
      </div>
    </div>
  );
};