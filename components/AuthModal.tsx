
import React, { useState } from 'react';
import { signInWithMagicLink, verifyOtp } from '../services/supabaseService';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  ui: any;
  onLoginSuccess: (user: any) => void;
  isPremiumSignup?: boolean; // Novo prop para indicar que veio do Stripe
}

export const AuthModal: React.FC<AuthModalProps> = ({ isOpen, onClose, ui, onLoginSuccess, isPremiumSignup = false }) => {
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [step, setStep] = useState<'email' | 'otp'>('email');
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [isError, setIsError] = useState(false);
  const [consentGiven, setConsentGiven] = useState(false);

  if (!isOpen) return null;

  const handleSendLink = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;
    if (!consentGiven) {
        setIsError(true);
        setMessage("É necessário concordar com os termos para continuar.");
        return;
    }
    
    setIsLoading(true);
    setMessage('');
    setIsError(false);
    
    const { error } = await signInWithMagicLink(email.trim());
    setIsLoading(false);

    if (error) {
        setIsError(true);
        const errMsg = error.message?.toLowerCase() || "";
        
        if (errMsg.includes("rate limit") || errMsg.includes("too many requests") || error.status === 429) {
            setMessage("⏳ Muitos envios recentes. O provedor bloqueou este e-mail temporariamente (1h). Tente outro.");
        } else if (errMsg.includes("security")) {
            setMessage("Erro de segurança. Tente outro e-mail.");
        } else {
            setMessage(`Erro: ${error.message || 'Falha ao enviar.'}`);
        }
    } else {
        setStep('otp');
        setMessage(ui.magicLinkSent || 'Código enviado! Copie do e-mail e cole aqui.');
        setIsError(false);
    }
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
      e.preventDefault();
      if (!otp) return;

      setIsLoading(true);
      setMessage('');
      setIsError(false);

      const { data, error } = await verifyOtp(email.trim(), otp.trim());
      setIsLoading(false);

      if (error || !data.user) {
          console.error("OTP Error:", error);
          setIsError(true);
          setMessage('Código inválido ou expirado. Verifique os dígitos.');
      } else {
          onLoginSuccess(data.user);
          // Não fechamos aqui, o pai decide se fecha ou se processa o upgrade
      }
  };

  return (
    <div className="fixed inset-0 z-[2000] flex items-center justify-center px-4 bg-black/60 backdrop-blur-sm">
      <div className="bg-white rounded-3xl p-6 w-full max-w-sm shadow-2xl border border-[#EAA823]/20 relative overflow-hidden">
        
        {/* Background blobs */}
        <div className="absolute top-[-20%] right-[-20%] w-32 h-32 bg-[#FF7D6B]/20 rounded-full blur-2xl"></div>
        <div className="absolute bottom-[-10%] left-[-10%] w-24 h-24 bg-[#006A71]/10 rounded-full blur-xl"></div>
        
        <button 
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition-colors z-20"
        >
          ✕
        </button>

        <h3 className="text-xl font-bold text-[#006A71] mb-2 text-center relative z-10 tracking-tight">
          {isPremiumSignup ? "Ativar Mapa Vivo" : (ui.loginTitle || "Login")}
        </h3>
        
        <p className="text-xs text-center text-gray-500 mb-6">
            {isPremiumSignup 
                ? "Pagamento detectado! Entre com seu e-mail para vincular sua assinatura Premium." 
                : (ui.loginDesc || "Entre para acessar recursos premium.")}
        </p>

        {step === 'email' ? (
            <form onSubmit={handleSendLink} className="relative z-10 flex flex-col gap-4">
                <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder={ui.emailPlaceholder || "email@exemplo.com"}
                    className="w-full p-4 bg-[#F8F8F4] rounded-xl border border-gray-200 focus:border-[#006A71] outline-none text-sm"
                    required
                />
                
                {/* Checkbox de Consentimento */}
                <div className="flex items-start gap-3 px-1">
                    <input 
                        type="checkbox" 
                        id="authConsent"
                        checked={consentGiven}
                        onChange={(e) => setConsentGiven(e.target.checked)}
                        className="mt-1 w-4 h-4 text-[#006A71] rounded border-gray-300 focus:ring-[#006A71]"
                    />
                    <label htmlFor="authConsent" className="text-[11px] text-gray-600 leading-tight cursor-pointer">
                        {ui.consentText || "Concordo que minhas conversas sejam gravadas e processadas para gerar meu Mapa Vivo."}
                    </label>
                </div>

                <button
                    type="submit"
                    disabled={isLoading || !consentGiven}
                    className="w-full py-3 bg-[#006A71] text-white font-semibold rounded-full hover:bg-[#00555a] disabled:opacity-50 disabled:cursor-not-allowed transition-colors shadow-md text-sm uppercase tracking-wide"
                >
                    {isLoading ? "Enviando..." : (ui.sendMagicLink || "Enviar Código")}
                </button>
                <div className="text-[10px] text-gray-400 text-center mt-2">
                    <p>Conta de teste: <strong>demo@feltrip.com</strong></p>
                </div>
            </form>
        ) : (
            <form onSubmit={handleVerifyOtp} className="relative z-10 flex flex-col gap-4">
                 <div className="bg-yellow-50 border border-yellow-200 p-2 rounded-lg mb-2">
                    <p className="text-[10px] text-yellow-800 text-center font-medium">
                       ⚠️ Não clique no link do e-mail.<br/>Copie o <strong>código numérico</strong> e cole abaixo.
                    </p>
                 </div>
                 <input
                    type="text"
                    value={otp}
                    onChange={(e) => setOtp(e.target.value)}
                    placeholder="Código (6 dígitos)"
                    className="w-full p-4 bg-[#F8F8F4] rounded-xl border border-gray-200 focus:border-[#006A71] outline-none text-center text-lg tracking-widest"
                    required
                />
                <button
                    type="submit"
                    disabled={isLoading}
                    className="w-full py-3 bg-[#006A71] text-white font-semibold rounded-full hover:bg-[#00555a] disabled:opacity-50 transition-colors shadow-md text-sm uppercase tracking-wide"
                >
                    {isLoading ? "Verificando..." : (isPremiumSignup ? "Confirmar e Ativar" : "Confirmar Código")}
                </button>
                
                {email === 'demo@feltrip.com' && (
                    <p className="text-[10px] text-green-600 text-center font-bold">
                        Código Demo: 123456
                    </p>
                )}

                <button 
                    type="button" 
                    onClick={() => setStep('email')}
                    className="text-xs text-center text-gray-400 underline"
                >
                    Voltar / Corrigir e-mail
                </button>
            </form>
        )}

        {message && (
            <p className={`mt-4 text-xs text-center font-medium animate-pulse ${isError ? 'text-[#FF7D6B]' : 'text-[#006A71]'}`}>
                {message}
            </p>
        )}
      </div>
    </div>
  );
};
