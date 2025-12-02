import React from 'react';
import { Level } from '../types';

interface LevelSelectorProps {
  selectedLevel: Level | null;
  onSelect: (level: Level) => void;
}

export const LevelSelector: React.FC<LevelSelectorProps> = ({ selectedLevel, onSelect }) => {
  const levels = [
    { 
      id: Level.NOVATO, 
      label: "O Novato", 
      points: "10pts", 
      desc: "Foco em erros de aplicação e produtos." 
    },
    { 
      id: Level.INVESTIGADOR, 
      label: "O Investigador", 
      points: "20pts", 
      desc: "Documentação, Lotes e Selfcolor básico." 
    },
    { 
      id: Level.PERITO, 
      label: "O Perito", 
      points: "30pts", 
      desc: "Decisões complexas de laboratório e Selfcolor." 
    },
  ];

  return (
    <div className="grid gap-4 md:grid-cols-3">
      {levels.map((lvl) => (
        <button
          key={lvl.id}
          onClick={() => onSelect(lvl.id)}
          className={`
            relative p-4 rounded-xl border-2 text-left transition-all duration-300
            ${selectedLevel === lvl.id 
              ? 'border-[#FF6600] bg-orange-50 shadow-md transform -translate-y-1' 
              : 'border-gray-200 bg-white hover:border-orange-300 hover:shadow-sm'
            }
          `}
        >
          <div className="flex justify-between items-start mb-2">
            <h3 className={`font-bold ${selectedLevel === lvl.id ? 'text-[#FF6600]' : 'text-gray-800'}`}>
              {lvl.label}
            </h3>
            <span className="text-xs font-bold bg-gray-100 px-2 py-1 rounded text-gray-600">
              {lvl.points}
            </span>
          </div>
          <p className="text-sm text-gray-500">{lvl.desc}</p>
          
          {selectedLevel === lvl.id && (
            <div className="absolute top-[-10px] right-[-10px] bg-[#FF6600] text-white rounded-full p-1 shadow-lg">
               <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
            </div>
          )}
        </button>
      ))}
    </div>
  );
};