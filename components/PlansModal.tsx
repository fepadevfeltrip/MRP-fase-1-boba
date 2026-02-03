
import React from 'react';
import { UserProfile } from '../types';
import { STRIPE_LINKS } from '../constants';

interface PlansModalProps {
  isOpen: boolean;
  onClose: () => void;
  userProfile: UserProfile | null;
  ui: any;
  onLoginClick?: () => void;
}

export const PlansModal: React.FC<PlansModalProps> = ({ isOpen, onClose, userProfile, ui, onLoginClick }) => {
  if (!isOpen) return null;

  const isPremium = userProfile?.subscription_tier === 'premium';
  const safeUi = ui || {};

  // Link direto hardcoded (Corrigido)
  const stripeUrl = "https://buy.stripe.com/bJe9ASb688Eo34Dgdi7ss0c";

  return (
    <div className="fixed inset-0 z-[2000] overflow-y-auto bg-black/90 backdrop-blur-md">
      <div className="flex min-h-screen items-center justify-center p-4">
        
        {/* Card Principal - Mapa Vivo */}
        <div className="bg-white rounded-[2rem] w-full max-w-lg overflow-hidden relative shadow-2xl border border-white/20">
          
          {/* Botão Fechar */}
          <button 
            onClick={onClose}
            className="absolute top-5 right-5 text-white/80 hover:text-white transition-colors z-20 bg-black/20 hover:bg-black/40 rounded-full p-2"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
          </button>

          {/* Header Visual */}
          <div className="relative h-64 bg-[#006A71] flex flex-col items-center justify-center text-center p-6 overflow-hidden">
             {/* Efeitos de Fundo */}
             <div className="absolute top-[-50%] left-[-50%] w-[500px] h-[500px] bg-[#EAA823] rounded-full blur-[100px] opacity-30 animate-pulse"></div>
             <div className="absolute bottom-[-20%] right-[-20%] w-[300px] h-[300px] bg-[#FF7D6B] rounded-full blur-[80px] opacity-40"></div>
             
             {/* Conteúdo Header */}
             <div className="z-10 relative">
                <span className="text-[#EAA823] font-bold text-xs uppercase tracking-[0.2em] mb-3 block">
                   Feltrip Presents
                </span>
                <h2 className="text-4xl md:text-5xl font-extrabold text-white mb-4 tracking-tight drop-shadow-lg">
                   {safeUi.plansTitle || "Mapa Vivo"}
                </h2>
                <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-sm px-4 py-1.5 rounded-full border border-white/20">
                   <span className="w-2 h-2 bg-[#00FF94] rounded-full animate-pulse shadow-[0_0_10px_#00FF94]"></span>
                   <span className="text-white text-xs font-semibold">Living Map Access</span>
                </div>
             </div>
          </div>

          {/* Corpo do Card */}
          <div className="p-8 sm:p-10">
            <p className="text-xl text-[#006A71] font-medium text-center leading-relaxed mb-8">
              "{safeUi.plansSubtitle || "Um mapa onde você guarda não só lugares, mas o jeito como você esteve neles."}"
            </p>

            {/* Lista de Features */}
            <div className="space-y-4 mb-10">
               <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-4">
                  {safeUi.featuresTitle || "O que você desbloqueia:"}
               </h3>
               
               <div className="flex items-start gap-3">
                  <div className="mt-1 w-5 h-5 rounded-full bg-[#EAA823]/20 flex items-center justify-center text-[#EAA823] font-bold text-xs">✓</div>
                  <p className="text-gray-600 text-sm">{safeUi.featureChat || "Conversa Boba Estendida"}</p>
               </div>
               
               <div className="flex items-start gap-3">
                  <div className="mt-1 w-5 h-5 rounded-full bg-[#EAA823]/20 flex items-center justify-center text-[#EAA823] font-bold text-xs">✓</div>
                  <p className="text-gray-600 text-sm">{safeUi.featureMaps || "Integração Google Maps (Diário Vivo)"}</p>
               </div>
               
               <div className="flex items-start gap-3">
                  <div className="mt-1 w-5 h-5 rounded-full bg-[#EAA823]/20 flex items-center justify-center text-[#EAA823] font-bold text-xs">✓</div>
                  <p className="text-gray-600 text-sm">{safeUi.featurePresence || "Mapeamento de Presença Relacional"}</p>
               </div>
            </div>

            {/* Preço e Botão */}
            <div className="bg-[#F8F8F4] rounded-2xl p-6 text-center border border-gray-100">
               {isPremium ? (
                  <div className="text-[#006A71] font-bold flex flex-col items-center">
                     <span className="text-3xl mb-1">✨</span>
                     <span>Você já possui o Mapa Vivo.</span>
                  </div>
               ) : (
                  <>
                    <div className="mb-4">
                       <span className="text-4xl font-extrabold text-[#006A71]">{safeUi.priceTag || "R$ 49,00"}</span>
                       <span className="text-gray-400 text-sm font-medium ml-2">{safeUi.priceSub || "/mês"}</span>
                    </div>
                    
                    {/* Botão de Link Direto (Sem target blank para evitar bloqueio) */}
                    <a 
                      href={stripeUrl}
                      className="block w-full text-center py-4 bg-[#FF007F] hover:bg-[#d4006a] text-white font-bold rounded-xl shadow-lg hover:shadow-xl hover:-translate-y-0.5 transition-all transform active:scale-95 text-lg no-underline cursor-pointer"
                    >
                      {safeUi.planSelect || "Assinar Agora"}
                    </a>
                    
                    <div className="mt-3 text-[10px] text-gray-500 font-medium bg-white/50 py-1 px-3 rounded-full inline-block">
                       🔒 {safeUi.paymentNote || "Pagamento seguro via Stripe. Cancele a qualquer momento."}
                    </div>
                  </>
               )}
            </div>

            {/* Login Link */}
            {!userProfile && onLoginClick && (
                <div className="mt-6 text-center">
                    <button 
                      onClick={onLoginClick}
                      className="text-xs font-bold text-[#006A71] hover:underline"
                    >
                      {safeUi.alreadyHaveAccount || "Já tem o Mapa Vivo? Entre aqui."}
                    </button>
                </div>
            )}

          </div>
        </div>
      </div>
    </div>
  );
};
