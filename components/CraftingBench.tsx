
import React from 'react';
import { GameState, CraftableItem } from '../types';
import { CRAFTABLES, ICONS, ORGANS } from '../constants';

interface CraftingBenchProps {
  gameState: GameState;
  onCraft: (item: CraftableItem) => void;
  onEat: (item: CraftableItem) => void;
}

export const CraftingBench: React.FC<CraftingBenchProps> = ({ gameState, onCraft, onEat }) => {
  
  const getIngredientName = (id: string) => {
      if (id === 'rawMeat') return 'Meat';
      if (id === 'meals') return 'Meals';
      return ORGANS.find(o => o.id === id)?.name || id;
  };

  const handleDragStart = (e: React.DragEvent, item: CraftableItem) => {
      e.dataTransfer.setData('application/json', JSON.stringify({ type: 'PANTRY', id: item.id }));
      e.dataTransfer.effectAllowed = 'move';
  };

  return (
    <div className="bg-slate-900 border-2 border-slate-700 rounded-xl p-4 flex flex-col gap-4">
      <div className="flex items-center justify-between border-b border-slate-700 pb-2">
        <h3 className="text-xl font-bold text-purple-400 font-creep tracking-wider flex items-center gap-2">
           {ICONS.CRAFT} The Butchery Bench
        </h3>
        <div className="text-xs text-slate-400">
             Raw Meat: <span className="text-red-400 font-bold">{gameState.rawMeat}</span>
        </div>
      </div>
      
      {/* Recipe List */}
      <div className="space-y-3">
        {CRAFTABLES.map((item) => {
           const inPantry = gameState.pantry[item.id] || 0;
           
           // Check availability of ALL ingredients
           const canAfford = Object.entries(item.ingredients).every(([id, amount]) => {
               if (id === 'rawMeat') return gameState.rawMeat >= amount;
               if (id === 'meals') return gameState.meals >= amount;
               return (gameState.organs[id] || 0) >= amount;
           });
           
           return (
            <div key={item.id} 
                 className={`bg-slate-950 p-3 rounded border border-slate-800 flex justify-between items-center group hover:border-purple-900/50 transition-colors ${inPantry > 0 ? 'cursor-grab active:cursor-grabbing border-purple-900/30' : ''}`}
                 draggable={inPantry > 0}
                 onDragStart={(e) => inPantry > 0 && handleDragStart(e, item)}
            >
                <div className="flex flex-col flex-1 pointer-events-none">
                    <span className="font-bold text-slate-200 group-hover:text-purple-300 transition-colors flex items-center gap-2">
                        {item.name}
                        {inPantry > 0 && <span className="bg-purple-900 text-purple-200 text-[10px] px-2 py-0.5 rounded-full">In Pantry: {inPantry}</span>}
                    </span>
                    <span className="text-xs text-slate-500 italic">{item.description}</span>
                    <div className="text-xs text-slate-400 mt-1 flex flex-wrap gap-2">
                        <span>Costs:</span>
                        {Object.entries(item.ingredients).map(([id, amount]) => {
                            let available = (gameState.organs[id] || 0);
                            if (id === 'rawMeat') available = gameState.rawMeat;
                            if (id === 'meals') available = gameState.meals;
                            
                            const hasEnough = available >= amount;
                            return (
                                <span key={id} className={hasEnough ? 'text-slate-300' : 'text-red-500'}>
                                    {amount} {getIngredientName(id)}
                                </span>
                            );
                        })}
                    </div>
                </div>
                
                <div className="flex flex-col gap-1 ml-2">
                    <button
                        onClick={() => onCraft(item)}
                        disabled={!canAfford}
                        className={`px-3 py-1 text-xs font-bold rounded border ${
                            canAfford
                            ? 'bg-purple-900/40 text-purple-200 border-purple-800 hover:bg-purple-800 hover:text-white' 
                            : 'bg-slate-800 text-slate-600 border-slate-700 cursor-not-allowed'
                        } transition-all`}
                    >
                        CRAFT
                    </button>
                    {inPantry > 0 && (
                        <button
                            onClick={() => onEat(item)}
                            className="px-3 py-1 text-xs font-bold rounded border bg-green-900/40 text-green-200 border-green-800 hover:bg-green-800 hover:text-white transition-all"
                        >
                            FEAST
                        </button>
                    )}
                </div>
            </div>
           );
        })}
      </div>
    </div>
  );
};
