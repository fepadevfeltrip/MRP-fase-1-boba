import React, { useState, useMemo } from 'react';
import { Message, Role, BobaUiData } from '../types';
import { BOBA_AVATAR_URL } from '../constants';
import { GemCard } from './GemCard';

interface MessageBubbleProps {
  message: Message;
  onPin?: (text: string) => void; 
  onAction?: (actionText: string) => void;
  currentUser?: any; 
}

export const MessageBubble: React.FC<MessageBubbleProps> = ({ message, onAction, currentUser }) => {
  const isUser = message.role === Role.USER;
  const [avatarUrl, setAvatarUrl] = useState(BOBA_AVATAR_URL);
  const [copied, setCopied] = useState(false);

  const rawText = message?.text || "";

  // Parse Message
  const { displayText, uiData } = useMemo(() => {
    const splitMarker = '|||BOBA_UI_DATA|||';
    const endMarker = '|||END_BOBA_UI_DATA|||';
    
    if (rawText.includes(splitMarker)) {
        const parts = rawText.split(splitMarker);
        const textContent = parts[0].trim();
        let dataContent = parts[1];
        if (dataContent && dataContent.includes(endMarker)) {
            dataContent = dataContent.split(endMarker)[0];
        }
        try {
            return { displayText: textContent, uiData: JSON.parse(dataContent) as BobaUiData };
        } catch (e) {
            return { displayText: rawText, uiData: null };
        }
    }
    return { displayText: rawText, uiData: null };
  }, [rawText]);

  const buttonRegex = /\[(.*?)\](?!\()/g;

  const renderContent = (text: string) => {
    if (!text) return null;
    const lines = text.split('\n');
    
    return lines.map((line, lineIndex) => {
      const trimmed = line.trim();
      const isPureButton = trimmed.startsWith('[') && trimmed.endsWith(']') && !trimmed.includes('](');
      
      if (isPureButton && !isUser && onAction) {
         const btnText = trimmed.slice(1, -1);
         const isCitySelection = btnText.includes('Rio') || btnText.includes('Paulo') || btnText.includes('Floripa');
         
         let btnClass = "block w-full text-left my-2 px-6 py-4 rounded-2xl shadow-sm transition-all font-bold text-sm border active:scale-[0.98] ";
         
         if (isCitySelection) {
             btnClass += "bg-white text-boba-teal border-boba-mustard/50 hover:bg-boba-mustard/10 hover:shadow-md";
         } else {
             btnClass += "bg-gradient-to-r from-boba-teal to-[#00555a] text-white border-transparent hover:shadow-lg hover:-translate-y-0.5";
         }

         return (
           <button key={`btn-${lineIndex}`} onClick={() => onAction(btnText)} className={btnClass}>
             {btnText}
           </button>
         );
      }

      const urlRegex = /(https?:\/\/[^\s]+)/g;
      const parts = line.split(urlRegex);

      return (
        <div key={lineIndex} className="min-h-[1.5em] mb-1">
          {parts.map((part, j) => {
            if (part.match(urlRegex)) {
              return (
                <a key={j} href={part} target="_blank" rel="noopener noreferrer" className={`font-medium underline break-all hover:opacity-100 ${isUser ? 'text-white opacity-90' : 'text-boba-teal opacity-90'}`}>
                  {part}
                </a>
              );
            }
            return part.split(/(\*\*.*?\*\*)/).map((subPart, k) => {
              if (subPart.startsWith('**') && subPart.endsWith('**')) {
                return <strong key={k} className={`font-bold ${isUser ? 'text-white' : 'text-boba-teal'}`}>{subPart.slice(2, -2)}</strong>;
              }
              if (!isUser && onAction) {
                  const subPartsWithButtons = subPart.split(buttonRegex);
                  if (subPartsWithButtons.length > 1) {
                      return subPartsWithButtons.map((sp, idx) => {
                           if (idx % 2 === 1) { 
                               return (
                                   <button 
                                      key={`ib-${k}-${idx}`} 
                                      onClick={() => onAction(sp)} 
                                      className="inline-block mx-1 px-3 py-1 bg-boba-mustard/10 text-boba-teal border border-boba-teal/20 rounded-full text-xs font-bold hover:bg-boba-mustard/20 transition-colors align-middle"
                                   >
                                     {sp}
                                   </button>
                               );
                           }
                           return <span key={`txt-${k}-${idx}`}>{sp}</span>;
                      });
                  }
              }
              return <span key={k}>{subPart}</span>;
            });
          })}
        </div>
      );
    });
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(displayText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const hasUiData = !isUser && uiData && uiData.gems && Array.isArray(uiData.gems);

  return (
    <div className={`flex w-full mb-6 group ${isUser ? 'justify-end' : 'justify-start'}`}>
      {!isUser && (
        <div className="flex-shrink-0 mr-3 mt-2">
          <div className="w-10 h-10 rounded-full overflow-hidden border-2 border-boba-mustard bg-white shadow-sm">
             <img src={avatarUrl} alt="Boba" className="w-full h-full object-cover" onError={() => setAvatarUrl("https://ui-avatars.com/api/?name=Boba&background=006A71&color=fff")} />
          </div>
        </div>
      )}
      
      <div className={`relative max-w-[90%] sm:max-w-[85%] ${!isUser ? 'w-full' : ''}`}>
        <div className={`px-5 py-4 rounded-[1.5rem] text-base leading-relaxed shadow-sm ${isUser ? 'bg-boba-teal text-boba-offWhite rounded-br-none shadow-md' : 'bg-white text-gray-700 border border-boba-mustard/20 rounded-bl-none shadow-sm'}`}>
          <div className="font-sans whitespace-pre-wrap">
             {renderContent(displayText)}
          </div>

          {hasUiData && uiData && (
              <div className="mt-6 border-t border-gray-100 pt-4 animate-fade-in">
                  {uiData.gems.length > 0 && (
                      <>
                        <h4 className="text-boba-teal font-bold text-[10px] uppercase tracking-[0.2em] mb-3 flex items-center gap-2">
                            <span>💎</span> Curadoria Feltrip
                        </h4>
                        <div className="flex flex-col gap-3">
                            {uiData.gems.map((gem, idx) => (
                                <GemCard key={idx} gem={gem} currentUser={currentUser} emotionalStatus={uiData.emotional_status} />
                            ))}
                        </div>
                      </>
                  )}
              </div>
          )}
        </div>

        {!isUser && (
          <button onClick={handleCopy} className="absolute -bottom-6 left-4 text-[10px] text-gray-400 hover:text-boba-teal opacity-0 group-hover:opacity-100 transition-opacity uppercase tracking-wide">
            {copied ? 'Copiado!' : 'Copiar'}
          </button>
        )}
      </div>
    </div>
  );
};