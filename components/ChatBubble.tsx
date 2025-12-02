import React from 'react';
import { ChatMessage } from '../types';

interface ChatBubbleProps {
  message: ChatMessage;
  showOptions?: boolean;
  onOptionSelect?: (option: string) => void;
}

export const ChatBubble: React.FC<ChatBubbleProps> = ({ message, showOptions, onOptionSelect }) => {
  const isUser = message.role === 'user';

  // Simple formatting for bold text from markdown-style **text**
  const formattedText = message.text.split(/(\*\*.*?\*\*)/).map((part, index) => {
    if (part.startsWith('**') && part.endsWith('**')) {
      return <strong key={index}>{part.slice(2, -2)}</strong>;
    }
    return part;
  });

  return (
    <div className={`flex flex-col w-full ${isUser ? 'items-end' : 'items-start'} mb-6 animate-fade-in-up`}>
      <div 
        className={`
          max-w-[85%] md:max-w-[75%] p-4 rounded-2xl text-sm md:text-base leading-relaxed shadow-sm relative
          ${isUser 
            ? 'bg-[#FF6600] text-white rounded-tr-none' 
            : 'bg-white text-gray-800 border border-gray-200 rounded-tl-none'
          }
        `}
      >
        <div className="whitespace-pre-wrap">{formattedText}</div>
      </div>

      {/* Render Options if active */}
      {!isUser && showOptions && message.options && message.options.length > 0 && (
        <div className="mt-3 grid gap-2 w-full max-w-[85%] md:max-w-[75%] animate-fade-in">
          {message.options.map((option, idx) => (
            <button
              key={idx}
              onClick={() => onOptionSelect && onOptionSelect(option)}
              className="w-full text-left px-4 py-3 bg-white hover:bg-orange-50 border-2 border-orange-100 hover:border-orange-300 text-gray-700 hover:text-[#FF6600] rounded-xl text-sm font-semibold transition-all duration-200 shadow-sm active:scale-[0.98]"
            >
              {option}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};