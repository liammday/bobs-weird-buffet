
import React from 'react';
import { Minion, GameState } from '../types';
import { MINIONS, getMinionUpgradeCost } from '../constants';

interface MonsterDenProps {
  gameState: GameState;
  onHire: (minion: Minion) => void;
  onUpgrade?: (minionId: string) => void;
}

export const MonsterDen: React.FC<MonsterDenProps> = ({ gameState, onHire, onUpgrade }) => {
  // Calculate aggregate rates
  let hunterKillsPerSec = 0;
  let chefRate = 0;
  let feederRate = 0;
  let leechRate = 0;
  let hiredCount = 0;

  MINIONS.forEach(minion => {
      const entry = gameState.minions[minion.id];
      if (entry && entry.count > 0) {
          // Calculate boosted rate based on level
          const levelMultiplier = 1 + ((entry.level - 1) * 0.1);
          const effectiveRate = minion.rate * levelMultiplier;

          if (minion.role === 'HUNTER') hunterKillsPerSec += entry.count * effectiveRate;
          if (minion.role === 'CHEF') chefRate += entry.count * effectiveRate;
          if (minion.role === 'FEEDER') feederRate += entry.count * effectiveRate;
          if (minion.role === 'LEECH') leechRate += entry.count * effectiveRate;
          hiredCount += entry.count;
      }
  });

  // 1 Hunter Kill = 1 Raw Meat, so rate is just the kill rate
  const effectiveMeatRate = hunterKillsPerSec;

  // Filter available minions (Not yet hired)
  const availableMinions = MINIONS.filter(m => (gameState.minions[m.id]?.count || 0) === 0);
  
  // Sort by cost (should already be somewhat sorted by generation index, but good to ensure)
  availableMinions.sort((a, b) => a.cost - b.cost);

  // Take top 3
  const visibleMinions = availableMinions.slice(0, 3);
  
  // Get list of hired minions for management view
  const hiredMinionsList = MINIONS.filter(m => (gameState.minions[m.id]?.count || 0) > 0);

  const getRoleColor = (role: string) => {
      if (role === 'HUNTER') return 'text-red-400';
      if (role === 'CHEF') return 'text-orange-400';
      if (role === 'FEEDER') return 'text-teal-400';
      if (role === 'LEECH') return 'text-rose-600';
      return 'text-slate-400';
  }

  return (
    <div className="bg-slate-900 border-2 border-slate-700 rounded-xl p-4 flex flex-col gap-4 flex-1">
      <div className="flex items-center justify-between border-b border-slate-700 pb-2">
        <h3 className="text-xl font-bold text-red-400 font-creep tracking-wider">
           The Basement Den
        </h3>
        <div className="text-xs text-slate-400 text-right">
             <div>Hired: <span className="text-white">{hiredCount}</span></div>
             <div className="text-[10px] text-slate-500 flex flex-wrap justify-end gap-2">
                <span className="text-red-300" title={`Base Rate: ${hunterKillsPerSec.toFixed(1)} Kills/s`}>
                    {effectiveMeatRate.toFixed(1)} Meat/s
                </span>
                <span className="text-orange-300"> {chefRate.toFixed(1)} Meal/s</span>
                <span className="text-teal-300"> {feederRate.toFixed(1)} Eat/s</span>
                <span className="text-rose-500"> {leechRate.toFixed(1)} Heal/s</span>
             </div>
        </div>
      </div>
      
      {/* Available for Hire (Shop) */}
      <div className="space-y-2">
        {visibleMinions.length === 0 && hiredMinionsList.length === 0 && (
            <div className="text-center text-slate-500 py-4">No monsters to hire!</div>
        )}
        {visibleMinions.map((minion) => {
           return (
            <div key={minion.id} className="bg-slate-950 p-3 rounded border border-slate-800 flex justify-between items-center group hover:border-red-900/50 transition-colors animate-fadeIn">
                <div className="flex flex-col">
                    <span className="font-bold text-slate-200 group-hover:text-red-300 transition-colors flex items-center gap-2">
                        {minion.name} 
                    </span>
                    <span className="text-xs text-slate-500 italic max-w-[150px] truncate">{minion.description}</span>
                    <span className="text-xs text-slate-400 mt-1">
                        Role: <span className={getRoleColor(minion.role)}>{minion.role}</span>
                        {' '}| Rate: {minion.rate}/s
                    </span>
                </div>
                <button
                    onClick={() => onHire(minion)}
                    disabled={gameState.coins < minion.cost}
                    className={`px-3 py-1 text-xs font-bold rounded border ${
                        gameState.coins >= minion.cost 
                        ? 'bg-red-900/40 text-red-200 border-red-800 hover:bg-red-800 hover:text-white' 
                        : 'bg-slate-800 text-slate-600 border-slate-700 cursor-not-allowed'
                    } transition-all`}
                >
                    HIRE<br/>${minion.cost}
                </button>
            </div>
           );
        })}
      </div>
      
      {/* Hired Workforce (Simple list with Stats) */}
      {hiredMinionsList.length > 0 && (
          <div className="mt-4 border-t border-slate-800 pt-2">
              <h4 className="text-xs font-bold text-slate-500 mb-2 uppercase tracking-wide">Workforce Status</h4>
              <div className="space-y-1 max-h-[250px] overflow-y-auto pr-1 custom-scrollbar">
                  {hiredMinionsList.map(minion => {
                      const entry = gameState.minions[minion.id];
                      const levelMultiplier = 1 + ((entry.level - 1) * 0.1);
                      const currentRate = (minion.rate * levelMultiplier).toFixed(2);
                      const xpReq = entry.level * 500;
                      const xpPercent = Math.min(100, (entry.xp / xpReq) * 100);
                      const upgradeCost = getMinionUpgradeCost(minion.role, entry.level);

                      return (
                          <div key={minion.id} className="bg-slate-950/50 p-2 rounded text-xs flex items-center justify-between border border-slate-800/50">
                               <div className="flex flex-col flex-1 mr-2">
                                   <div className="flex justify-between items-center">
                                       <span className="font-bold text-slate-300">{minion.name}</span>
                                       <span className="text-yellow-500 font-mono">Lvl {entry.level}</span>
                                   </div>
                                   <div className="flex justify-between items-center mt-0.5">
                                       <span className="text-[10px] text-slate-500">Count: {entry.count}</span>
                                       <span className="text-[10px] text-slate-400">Rate: {currentRate}/s <span className="text-green-500 text-[9px]">(+{Math.round((levelMultiplier-1)*100)}%)</span></span>
                                   </div>
                                   {/* XP Bar */}
                                   <div className="relative w-full h-2 bg-slate-800 rounded-full mt-1 overflow-hidden group">
                                       <div className="h-full bg-blue-500 transition-all duration-500" style={{ width: `${xpPercent}%` }}></div>
                                       {/* Tooltip on hover/always visible if preferred */}
                                       <div className="absolute inset-0 flex items-center justify-center text-[8px] text-white opacity-0 group-hover:opacity-100 transition-opacity bg-black/50">
                                           {Math.floor(entry.xp)} / {xpReq} XP
                                       </div>
                                   </div>
                               </div>
                               <div className="flex flex-col gap-1 items-end">
                                   <button
                                        onClick={() => onHire(minion)}
                                        disabled={gameState.coins < minion.cost}
                                        className={`px-2 py-1 text-[10px] font-bold rounded border ${
                                            gameState.coins >= minion.cost 
                                            ? 'bg-slate-800 hover:bg-slate-700 text-slate-200 border-slate-600' 
                                            : 'bg-slate-900 text-slate-700 border-slate-800 cursor-not-allowed'
                                        }`}
                                        title="Hire another one"
                                    >
                                        +1
                                    </button>
                                    {onUpgrade && (
                                        <button
                                            onClick={() => onUpgrade(minion.id)}
                                            disabled={gameState.coins < upgradeCost}
                                            className={`px-2 py-1 text-[10px] font-bold rounded border w-full ${
                                                gameState.coins >= upgradeCost 
                                                ? 'bg-yellow-900/40 text-yellow-200 border-yellow-800 hover:bg-yellow-800 hover:text-white' 
                                                : 'bg-slate-900 text-slate-700 border-slate-800 cursor-not-allowed'
                                            }`}
                                            title="Instant Level Up"
                                        >
                                            UP (${upgradeCost})
                                        </button>
                                    )}
                               </div>
                          </div>
                      );
                  })}
              </div>
          </div>
      )}
    </div>
  );
};
