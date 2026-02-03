
import React from 'react';
import { UserProfile } from '../types';
import { STRIPE_LINKS } from '../constants';

interface PlansModalProps {
  isOpen: boolean;
  onClose: () => void;
  userProfile: UserProfile | null;
  ui: any;
}

export const PlansModal: React.FC<PlansModalProps> = ({ isOpen, onClose, userProfile, ui }) => {
  if (!isOpen) return null;

  const currentTier = userProfile?.subscription_tier || 'free';

  // Fallback seguro se ui estiver carregando
  const safeUi = ui || {};

  const handleSelectPlan = (planId: string) => {
    // Acessa o link de forma segura usando a chave
    const link = STRIPE_LINKS[planId as keyof typeof STRIPE_LINKS];

    if (link) {
      // Abre direto para evitar bloqueio de popup pelo navegador
      window.open(link, '_blank');
    } else {
      console.warn(`Link não encontrado para o plano: ${planId}`);
      alert("Link de pagamento indisponível no momento.");
    }
  };

  const plans = [
    {
      id: 'free',
      name: safeUi.planFreeName || 'Visitante',
      price: 'R$ 0',
      features: safeUi.planFreeFeatures || ['Limite de 12 msgs/dia', 'Acesso Básico', 'Memória de Sessão'],
      color: 'bg-gray-100',
      textColor: 'text-gray-600',
      btnColor: 'bg-gray-200 text-gray-700'
    },
    {
      id: 'solo',
      name: safeUi.planSoloName || 'Solo',
      price: 'R$ 29,90',
      features: safeUi.planSoloFeatures || ['Mensagens Ilimitadas', 'Dicas de Cultura Local', 'Upload de fotos', 'Suporte Prioritário'],
      color: 'bg-[#EAA823]/10',
      textColor: 'text-[#EAA823]',
      btnColor: 'bg-[#EAA823] text-white'
    },
    {
      id: 'tribe',
      name: safeUi.planTribeName || 'Tribe',
      price: 'R$ 49,90',
      features: safeUi.planTribeFeatures || ['Tudo do Solo', 'Acesso para 3 Pessoas', 'Criação de Grupos', 'Divisão Financeira', 'Mapa Coletivo (Dicas da Boba)'],
      color: 'bg-[#006A71]/10',
      textColor: 'text-[#006A71]',
      btnColor: 'bg-[#006A71] text-white'
    },
    {
      id: 'immersion',
      name: safeUi.planImmersionName || 'Immersion',
      price: 'R$ 99,90',
      features: safeUi.planImmersionFeatures || ['Tudo do Tribe', 'App de Idiomas (Voz/Texto)', 'Prática: ES, PT, EN, ZH, FR'],
      color: 'bg-[#FF007F]/10',
      textColor: 'text-[#FF007F]',
      btnColor: 'bg-[#FF007F] text-white'
    }
  ];

  return (
    <div className="fixed inset-0 z-[80] overflow-y-auto bg-black/80 backdrop-blur-md">
      {/* Container interno com min-h-screen para garantir centralização ou scroll se for maior */}
      <div className="flex min-h-screen items-center justify-center p-4 sm:p-6">
        <div className="bg-white rounded-3xl w-full max-w-5xl p-6 sm:p-10 relative shadow-2xl border border-white/20">
          
          <button 
            onClick={onClose}
            className="absolute top-4 right-4 text-gray-400 hover:text-gray-700 transition-colors p-2 bg-gray-100 rounded-full z-50"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
          </button>

          <div className="text-center mb-10 pt-4">
            <h2 className="text-3xl font-extrabold text-[#006A71] mb-3 tracking-tight drop-shadow-sm">
              {safeUi.plansTitle || "Escolha sua Travessia"}
            </h2>
            <p className="text-gray-500 font-medium max-w-xl mx-auto">
              {safeUi.plansSubtitle || "Desbloqueie todo o potencial da inteligência cultural Boba."}
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {plans.map((plan) => {
              const isCurrent = currentTier === plan.id;
              
              return (
                <div 
                  key={plan.id} 
                  className={`border rounded-2xl p-6 flex flex-col justify-between relative ${isCurrent ? 'border-[#006A71] ring-2 ring-[#006A71]/20 shadow-xl' : 'border-gray-200'} transition-all hover:shadow-xl hover:-translate-y-1 bg-white`}
                >
                  {isCurrent && (
                     <span className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-[#006A71] text-white text-[10px] font-bold px-3 py-1 rounded-full uppercase tracking-wider shadow-sm z-10">
                       {safeUi.planCurrent || "Atual"}
                     </span>
                  )}

                  <div>
                    <h3 className={`text-xl font-bold ${plan.textColor} mb-2`}>{plan.name}</h3>
                    <div className="text-3xl font-bold text-gray-800 mb-6 tracking-tight">{plan.price}<span className="text-sm font-normal text-gray-400 ml-1">/mês</span></div>
                    
                    <ul className="space-y-3 mb-8">
                      {plan.features.map((feat, i) => (
                        <li key={i} className="text-xs text-gray-600 flex items-start gap-2 leading-relaxed">
                          <span className="text-[#006A71] font-bold shrink-0 mt-0.5">✓</span> {feat}
                        </li>
                      ))}
                    </ul>
                  </div>

                  <button 
                    disabled={isCurrent}
                    className={`w-full py-3 rounded-xl text-sm font-bold transition-all transform active:scale-95 ${isCurrent ? 'bg-gray-100 text-gray-400 cursor-default' : `${plan.btnColor} hover:opacity-90 shadow-md hover:shadow-lg`}`}
                    onClick={() => {
                        if (plan.id === 'free') {
                           // Lógica de downgrade futura
                        } else {
                           handleSelectPlan(plan.id);
                        }
                    }}
                  >
                    {isCurrent ? (safeUi.planCurrent || "Plano Atual") : (safeUi.planSelect || "Assinar")}
                  </button>
                </div>
              );
            })}
          </div>
          
          <div className="mt-10 text-center border-t border-gray-100 pt-6">
              <p className="text-xs text-gray-400 flex items-center justify-center gap-1">
                <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="1" y="4" width="22" height="16" rx="2" ry="2"></rect><line x1="1" y1="10" x2="23" y2="10"></line></svg>
                {safeUi.paymentNote || "Pagamentos via Stripe."}
              </p>
          </div>

        </div>
      </div>
    </div>
  );
};
