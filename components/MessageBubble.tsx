import React, { useState } from 'react';
import { Message, Role } from '../types';
import { BOBA_AVATAR_URL } from '../constants';

interface MessageBubbleProps {
  message: Message;
}

export const MessageBubble: React.FC<MessageBubbleProps> = ({ message }) => {
  const isUser = message.role === Role.USER;
  const [avatarUrl, setAvatarUrl] = useState(BOBA_AVATAR_URL);

  // Formatter for bold text and links
  const formatText = (text: string) => {
    // Regex for URLs
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

  return (
    <div className={`flex w-full mb-6 ${isUser ? 'justify-end' : 'justify-start'}`}>
      {!isUser && (
        <div className="flex-shrink-0 mr-3 self-end sm:self-auto">
          <div className="w-10 h-10 rounded-full overflow-hidden border-2 border-[#EAA823] bg-white shadow-sm">
             <img 
               src={avatarUrl} 
               alt="Boba Avatar" 
               className="w-full h-full object-cover"
               onError={(e) => {
                 // Fallback para um avatar gerado automaticamente se o link quebrar
                 setAvatarUrl("https://ui-avatars.com/api/?name=Boba&background=006A71&color=fff&size=128");
               }}
             />
          </div>
        </div>
      )}
      
      <div
        className={`relative max-w-[85%] sm:max-w-[75%] px-5 py-3.5 rounded-2xl text-base leading-relaxed shadow-sm
          ${
            isUser
              ? 'bg-[#006A71] text-[#F8F8F4] rounded-br-none' // Teal background, Off-white text
              : 'bg-white text-gray-800 border border-[#EAA823]/30 rounded-bl-none' // White background, Mustard border hint
          }
        `}
      >
        <div className="whitespace-pre-wrap font-sans">
           {formatText(message.text)}
        </div>
      </div>
    </div>
  );
};