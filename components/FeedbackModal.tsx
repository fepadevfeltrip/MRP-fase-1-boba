import React, { useState } from 'react';

interface FeedbackModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (rating: number, comment: string) => void;
  ui: any;
}

export const FeedbackModal: React.FC<FeedbackModalProps> = ({ isOpen, onClose, onSubmit, ui }) => {
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (rating === 0) return;
    
    setIsSubmitting(true);
    await onSubmit(rating, comment);
    setIsSubmitting(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center px-4 bg-black/40 backdrop-blur-sm animate-fade-in transition-opacity duration-300">
      <div className="bg-white rounded-3xl p-6 w-full max-w-sm shadow-2xl border border-[#EAA823]/20 relative overflow-hidden transform transition-all scale-100">
        {/* Decorative background blur */}
        <div className="absolute top-[-20%] right-[-20%] w-32 h-32 bg-[#FF7D6B]/20 rounded-full blur-2xl"></div>
        <div className="absolute bottom-[-10%] left-[-10%] w-24 h-24 bg-[#006A71]/10 rounded-full blur-xl"></div>
        
        <button 
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition-colors z-20"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
        </button>

        <h3 className="text-xl font-bold text-[#006A71] mb-2 text-center relative z-10 tracking-tight">
          {ui.feedbackTitle}
        </h3>
        
        <div className="flex justify-center gap-2 mb-6 relative z-10 py-2">
          {[1, 2, 3, 4, 5].map((star) => (
            <button
              key={star}
              type="button"
              onClick={() => setRating(star)}
              className="transition-transform hover:scale-110 focus:outline-none"
            >
              <svg 
                xmlns="http://www.w3.org/2000/svg" 
                width="36" 
                height="36" 
                viewBox="0 0 24 24" 
                fill={star <= rating ? "#EAA823" : "none"} 
                stroke={star <= rating ? "#EAA823" : "#CBD5E1"}
                strokeWidth="1.5" 
                strokeLinecap="round" 
                strokeLinejoin="round"
                className="transition-colors duration-200"
              >
                <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon>
              </svg>
            </button>
          ))}
        </div>

        <textarea
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          placeholder={ui.feedbackPlaceholder}
          className="w-full p-4 bg-[#F8F8F4] rounded-xl border border-gray-200 focus:border-[#006A71] focus:ring-1 focus:ring-[#006A71] outline-none text-sm text-gray-700 resize-none h-24 mb-4 relative z-10 placeholder-gray-400"
        />

        <div className="flex flex-col gap-2 relative z-10">
          <button
            onClick={handleSubmit}
            disabled={rating === 0 || isSubmitting}
            className="w-full py-3 bg-[#006A71] text-white font-semibold rounded-full hover:bg-[#00555a] disabled:opacity-50 disabled:cursor-not-allowed transition-colors shadow-md text-sm uppercase tracking-wide"
          >
            {isSubmitting ? ui.loading : ui.submitFeedback}
          </button>
          <button 
             onClick={onClose}
             className="text-xs text-gray-400 hover:text-[#006A71] text-center py-1"
          >
            {ui.skip}
          </button>
        </div>
      </div>
    </div>
  );
};