
import React from 'react';
import { GameState, Organ } from '../types';
import { ORGANS, ICONS } from '../constants';

interface OrganCaseProps {
  gameState: GameState;
  onConsume: (organ: Organ) => void;
}

export const OrganCase: React.FC<OrganCaseProps> = ({ gameState, onConsume }) => {
  const hasOrgans = Object.values(gameState.organs).some((count) => (count as number) > 0);

  const handleDragStart = (e: React.DragEvent, organ: Organ) => {
      e.dataTransfer.setData('application/json', JSON.stringify({ type: 'ORGAN', id: organ.id }));
      e.dataTransfer.effectAllowed = 'move';
  };

  return (
    <div className="bg-slate-900 border-2 border-slate-700 rounded-xl p-4 flex flex-col gap-4">
      <div className="flex items-center justify-between border-b border-slate-700 pb-2">
        <h3 className="text-xl font-bold text-pink-400 font-creep tracking-wider flex items-center gap-2">
           {ICONS.ORGAN} Organ Harvest
        </h3>
      </div>
      
      {!hasOrgans && (
          <div className="text-center text-slate-600 text-sm py-4 italic">
              Hunt more prey to find tasty bits...
          </div>
      )}

      <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
        {ORGANS.map((organ) => {
           const count = gameState.organs[organ.id] || 0;
           if (count === 0) return null;

           return (
            <div key={organ.id} 
                 className="bg-slate-950 p-2 rounded border border-pink-900/30 flex flex-col items-center text-center gap-1 group hover:border-pink-500 transition-colors cursor-grab active:cursor-grabbing"
                 onClick={() => onConsume(organ)}
                 draggable
                 onDragStart={(e) => handleDragStart(e, organ)}
            >
                <div className="text-2xl animate-pulse-slow pointer-events-none">
                    {organ.id === 'heart' ? '🫀' : 
                     organ.id === 'brain' ? '🧠' : 
                     organ.id === 'eyeball' ? '👁️' :
                     organ.id === 'lung' ? '🫁' :
                     organ.id === 'kidney' ? '🥜' : '🍖'}
                </div>
                <div className="font-bold text-pink-200 text-sm pointer-events-none">{organ.name} <span className="text-white">x{count}</span></div>
                <div className="text-[10px] text-slate-500 pointer-events-none">{organ.effectType} +{organ.effectValue}</div>
                <div className="text-[10px] text-slate-600 italic hidden group-hover:block pointer-events-none">{organ.description}</div>
            </div>
           );
        })}
      </div>
    </div>
  );
};
