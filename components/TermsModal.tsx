import React from 'react';
import { COLORS } from '../constants';

interface TermsModalProps {
  isOpen: boolean;
  onClose: () => void;
  ui: any;
}

export const TermsModal: React.FC<TermsModalProps> = ({ isOpen, onClose, ui }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/20 backdrop-blur-sm">
      <div className="bg-white rounded-2xl p-6 w-full max-w-md shadow-xl max-h-[80vh] overflow-y-auto">
        <h3 className={`text-lg font-bold text-[${COLORS.teal}] mb-4`} style={{ color: COLORS.teal }}>Manifesto Feltrip</h3>
        <div className="space-y-4 text-sm text-gray-600 leading-relaxed">
            <p><strong>1. Menos Tela, Mais Sola.</strong> A tecnologia deve servir para nos levar de volta ao mundo real, não para nos prender em interfaces.</p>
            <p><strong>2. A Cidade é um Museu Vivo.</strong> Cada esquina tem uma história, cada prato é um documento cultural.</p>
            <p><strong>3. Presença Relacional.</strong> Não somos turistas; somos viajantes em busca de conexão com o território, o corpo e o outro.</p>
            <p className="text-xs text-gray-400 mt-6 pt-4 border-t">Ao usar a Boba, você concorda em ser provocado a sair do óbvio.</p>
        </div>
        <button onClick={onClose} className={`mt-6 w-full py-3 bg-[${COLORS.teal}] text-white font-bold rounded-xl`} style={{ backgroundColor: COLORS.teal }}>
          Entendido
        </button>
      </div>
    </div>
  );
};