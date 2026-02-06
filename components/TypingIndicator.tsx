import React from 'react';
import { COLORS } from '../constants';

export const TypingIndicator: React.FC = () => {
  return (
    <div className="flex items-center space-x-1 p-4 bg-white rounded-2xl w-fit border border-gray-100 shadow-sm">
      <div className={`w-2 h-2 rounded-full bg-[${COLORS.teal}] animate-bounce`} style={{ animationDelay: '0ms', backgroundColor: COLORS.teal }}></div>
      <div className={`w-2 h-2 rounded-full bg-[${COLORS.teal}] animate-bounce`} style={{ animationDelay: '150ms', backgroundColor: COLORS.teal }}></div>
      <div className={`w-2 h-2 rounded-full bg-[${COLORS.teal}] animate-bounce`} style={{ animationDelay: '300ms', backgroundColor: COLORS.teal }}></div>
    </div>
  );
};