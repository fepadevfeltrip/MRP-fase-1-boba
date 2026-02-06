import React, { useEffect } from 'react';
import { BOBA_AVATAR_URL } from './constants';

// O Link do seu NOVO aplicativo
const NEW_APP_URL = "https://boba-ai-presence-planner-690453797160.us-west1.run.app";

const App: React.FC = () => {
  
  useEffect(() => {
    // Redireciona automaticamente após 2 segundos para o usuário ler a mensagem
    const timer = setTimeout(() => {
        window.location.href = NEW_APP_URL;
    }, 2500);

    return () => clearTimeout(timer);
  }, []);

  const handleManualRedirect = () => {
      window.location.href = NEW_APP_URL;
  };

  return (
    <div className="flex flex-col items-center justify-center h-[100dvh] bg-boba-offWhite font-sans text-slate-800 relative overflow-hidden p-6 text-center">
       
       {/* Background - Fixed Layout */}
       <div className="absolute inset-0 pointer-events-none z-0 opacity-40">
            <div className="absolute top-[-5%] right-[-5%] w-[400px] h-[400px] bg-boba-coral rounded-full blur-[80px]"></div>
            <div className="absolute bottom-[-10%] left-[-10%] w-[500px] h-[500px] bg-boba-teal rounded-full blur-[100px] opacity-30"></div>
       </div>

       <div className="z-10 bg-white/80 backdrop-blur-xl p-8 rounded-3xl border border-boba-mustard/20 shadow-xl max-w-md w-full animate-fade-in">
          
          <div className="w-20 h-20 mx-auto rounded-full border-2 border-boba-mustard p-1 bg-white overflow-hidden shadow-sm mb-6">
            <img src={BOBA_AVATAR_URL} alt="Boba" className="w-full h-full object-cover" />
          </div>

          <h1 className="text-2xl font-bold text-boba-teal mb-2">Estamos de Casa Nova!</h1>
          <p className="text-gray-600 mb-6 leading-relaxed">
            A Boba evoluiu e agora habita um novo endereço. <br/>
            Estamos te teletransportando...
          </p>

          <div className="flex justify-center mb-6">
             <div className="w-8 h-8 border-4 border-boba-teal border-t-transparent rounded-full animate-spin"></div>
          </div>

          <button 
            onClick={handleManualRedirect}
            className="w-full py-3 bg-boba-teal text-white font-bold rounded-xl shadow-lg hover:shadow-xl hover:scale-[1.02] transition-all"
          >
            Ir agora ➔
          </button>

          <p className="mt-4 text-[10px] text-gray-400 uppercase tracking-widest">
            Feltrip Presence Planner
          </p>
       </div>
    </div>
  );
};

export default App;