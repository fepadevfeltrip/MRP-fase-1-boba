import React from 'react';
import { GemData } from '../types';

interface GemCardProps {
  gem: GemData;
  currentUser?: any;
  emotionalStatus?: string;
}

export const GemCard: React.FC<GemCardProps> = ({ gem, currentUser, emotionalStatus }) => {
  const getIcon = (type: string) => {
    const t = type.toLowerCase();
    if (t.includes('gastr')) return '🍽️';
    if (t.includes('nature') || t.includes('livre') || t.includes('ar')) return '🌿';
    if (t.includes('cultur')) return '🎨';
    if (t.includes('event')) return '📅';
    return '💎';
  };

  return (
    <div className="bg-white p-4 rounded-xl border border-boba-teal/10 shadow-sm hover:shadow-md transition-all group relative overflow-hidden">
      
      {/* Decorative Stripe */}
      <div className="absolute left-0 top-0 bottom-0 w-1 bg-boba-mustard"></div>

      <div className="flex items-start gap-3 pl-2">
        <div className="w-10 h-10 rounded-full bg-boba-offWhite flex items-center justify-center text-xl shrink-0 border border-gray-100">
          {getIcon(gem.type)}
        </div>
        
        <div className="flex-1 min-w-0">
          <div className="flex justify-between items-start">
            <h4 className="font-bold text-boba-teal text-sm leading-tight mb-1 truncate pr-2">
              {gem.name}
            </h4>
            <span className="text-[10px] uppercase tracking-wider text-gray-400 bg-gray-50 px-2 py-0.5 rounded-full border border-gray-100">
              {gem.type}
            </span>
          </div>
          
          <p className="text-xs text-gray-600 leading-relaxed line-clamp-2">
            {gem.description}
          </p>

          {gem.ritual && (
             <div className="mt-2 text-[10px] italic text-boba-teal/80 border-l-2 border-boba-mustard pl-2">
               "{gem.ritual}"
             </div>
          )}
        </div>
      </div>

      <div className="mt-3 pl-2 flex items-center justify-between border-t border-gray-50 pt-2">
        <span className="text-[10px] text-boba-coral font-bold">
            {emotionalStatus ? `Vibe: ${emotionalStatus}` : 'Feltrip Curated'}
        </span>
        
        <button className="text-[10px] text-boba-teal font-bold hover:underline opacity-0 group-hover:opacity-100 transition-opacity">
           Ver no Mapa →
        </button>
      </div>
    </div>
  );
};