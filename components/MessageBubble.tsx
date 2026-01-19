import React from 'react';
import { Message, Role } from '../types';
import { BOBA_AVATAR_URL } from '../constants';

interface MessageBubbleProps {
  message: Message;
}

export const MessageBubble: React.FC<MessageBubbleProps> = ({ message }) => {
  const isUser = message.role === Role.USER;

  // Simple formatter for bold text (**text**) and line breaks
  const formatText = (text: string) => {
    return text.split('\n').map((line, i) => (
      <React.Fragment key={i}>
        {line.split(/(\*\*.*?\*\*)/).map((part, j) => {
          if (part.startsWith('**') && part.endsWith('**')) {
            return <strong key={j} className="font-semibold">{part.slice(2, -2)}</strong>;
          }
          return <span key={j}>{part}</span>;
        })}
        <br />
      </React.Fragment>
    ));
  };

  return (
    <div className={`flex w-full mb-6 ${isUser ? 'justify-end' : 'justify-start'}`}>
      {!isUser && (
        <div className="flex-shrink-0 mr-3">
          <div className="w-10 h-10 rounded-full overflow-hidden border-2 border-orange-200 bg-white shadow-sm">
             <img 
               src={BOBA_AVATAR_URL} 
               alt="Boba Avatar" 
               className="w-full h-full object-cover"
             />
          </div>
        </div>
      )}
      
      <div
        className={`relative max-w-[85%] sm:max-w-[75%] px-5 py-3.5 rounded-2xl text-base leading-relaxed shadow-sm
          ${
            isUser
              ? 'bg-teal-600 text-white rounded-br-none'
              : 'bg-white text-gray-800 border border-gray-100 rounded-bl-none'
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