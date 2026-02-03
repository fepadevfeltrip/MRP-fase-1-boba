
import React, { useState } from 'react';
import { Message, Role } from '../types';
import { BOBA_AVATAR_URL } from '../constants';

interface MessageBubbleProps {
  message: Message;
  onPin?: (text: string) => void; // Callback para pinar a mensagem (Premium feature)
}

export const MessageBubble: React.FC<MessageBubbleProps> = ({ message, onPin }) => {
  const isUser = message.role === Role.USER;
  const [avatarUrl, setAvatarUrl] = useState(BOBA_AVATAR_URL);
  const [copied, setCopied] = useState(false);

  // Formatter for bold text and links
  const formatText = (text: string) => {
    const urlRegex = /(https?:\/\/[^\s]+)/g;
    
    return text.split('\n').map((line, i) => (
      <React.Fragment key={i}>
        {line.split(urlRegex).map((part, j) => {
          if (part.match(urlRegex)) {
            return (
              <a 
                key={j} 
                href={part} 
                target="_blank" 
                rel="noopener noreferrer" 
                className={`font-medium underline ${isUser ? 'text-white' : 'text-[#006A71]'}`}
              >
                {part}
              </a>
            );
          }
          // Handle bold markdown
          return part.split(/(\*\*.*?\*\*)/).map((subPart, k) => {
            if (subPart.startsWith('**') && subPart.endsWith('**')) {
              return <strong key={k} className="font-semibold">{subPart.slice(2, -2)}</strong>;
            }
            return <span key={k}>{subPart}</span>;
          });
        })}
        <br />
      </React.Fragment>
    ));
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(message.text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className={`flex w-full mb-8 group ${isUser ? 'justify-end' : 'justify-start'}`}>
      {!isUser && (
        <div className="flex-shrink-0 mr-3 self-end sm:self-auto">
          <div className="w-10 h-10 rounded-full overflow-hidden border-2 border-[#EAA823] bg-white shadow-sm">
             <img 
               src={avatarUrl} 
               alt="Boba Avatar" 
               className="w-full h-full object-cover"
               onError={(e) => {
                 setAvatarUrl("https://ui-avatars.com/api/?name=Boba&background=006A71&color=fff&size=128");
               }}
             />
          </div>
        </div>
      )}
      
      <div className="relative max-w-[85%] sm:max-w-[75%]">
        <div
          className={`px-5 py-3.5 rounded-2xl text-base leading-relaxed shadow-sm
            ${
              isUser
                ? 'bg-[#006A71] text-[#F8F8F4] rounded-br-none' 
                : 'bg-white text-gray-800 border border-[#EAA823]/30 rounded-bl-none'
            }
          `}
        >
          <div className="whitespace-pre-wrap font-sans">
             {formatText(message.text)}
          </div>
        </div>

        {/* Action Buttons (Copy & Pin) - Sempre visíveis para facilitar o uso */}
        {!isUser && (
          <div className="absolute -top-3 right-0 flex gap-2">
            
            {/* Copy Button */}
            <button 
              onClick={handleCopy}
              className="bg-white text-gray-400 hover:text-[#006A71] p-1.5 rounded-full shadow-md border border-gray-200 transition-all hover:scale-105"
              title="Copiar texto"
            >
              {copied ? (
                <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-green-500"><polyline points="20 6 9 17 4 12"></polyline></svg>
              ) : (
                <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path></svg>
              )}
            </button>

            {/* Pin Button (Premium) */}
            {onPin && (
              <button 
                onClick={() => onPin(message.text)}
                className="bg-white text-[#EAA823] p-1.5 rounded-full shadow-md border border-[#EAA823]/20 transition-all hover:scale-110 hover:bg-[#EAA823] hover:text-white"
                title="Pinar no Mapa Vivo"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path><circle cx="12" cy="10" r="3"></circle></svg>
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
