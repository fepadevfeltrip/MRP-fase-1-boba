import React from 'react';

export const TypingIndicator: React.FC = () => {
  return (
    <div className="flex space-x-1 items-center p-2 bg-gray-100 rounded-2xl w-fit ml-10">
      <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
      <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
      <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
    </div>
  );
};