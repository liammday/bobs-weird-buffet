
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { GameState, INITIAL_STATE, ActionType, LogEntry, Upgrade, Minion, CraftableItem, Organ, MinionState } from './types';
import { generateFlavorText } from './services/geminiService';
import { GameLog } from './components/GameLog';
import { BobAvatar } from './components/BobAvatar';
import { HuntingMap } from './components/HuntingMap';
import { MonsterDen } from './components/MonsterDen';
import { CraftingBench } from './components/CraftingBench';
import { OrganCase } from './components/OrganCase';
import { playSound } from './services/soundService';
import { UPGRADES, MINIONS, ORGANS, REWARD_INTERVAL, DAMAGE_ON_FAIL, COINS_PER_MEAL, HP_REGEN_ON_EAT, COIN_REWARD, ICONS, CRAFTABLES, ELEMENTS, getMinionUpgradeCost } from './constants';

const App: React.FC = () => {
  const [gameState, setGameState] = useState<GameState>(INITIAL_STATE);
  // Ref to hold latest state for game loop access
  const gameStateRef = useRef(gameState);
  useEffect(() => { gameStateRef.current = gameState; }, [gameState]);

  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [upgrades, setUpgrades] = useState<Upgrade[]>(UPGRADES);
  const [timeToReward, setTimeToReward] = useState<number>(0);
  
  // New Avatar State System
  const [avatarAction, setAvatarAction] = useState<string>('IDLE');
  const avatarTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  
  const [isLoading, setIsLoading] = useState(false);
  const [huntStatus, setHuntStatus] = useState<{ timestamp: number; success: boolean }>({ timestamp: 0, success: false });
  const [isDragOverBob, setIsDragOverBob] = useState(false);

  // Refs for accumulation
  const fractionalResources = useRef({ meat: 0, meals: 0, killProgress: 0, feeds: 0 });

  const addLog = useCallback((text: string, type: ActionType) => {
    const newLog: LogEntry = {
      id: Math.random().toString(36).substr(2, 9),
      text,
      type,
      timestamp: Date.now()
    };
    setLogs(prev => [...prev.slice(-49), newLog]); // Keep last 50
  }, []);

  const triggerAvatarAction = (action: string) => {
    setAvatarAction(action);
    // Clear existing timeout to extend animation if triggered repeatedly
    if (avatarTimeoutRef.current) clearTimeout(avatarTimeoutRef.current);
    
    avatarTimeoutRef.current = setTimeout(() => {
      setAvatarAction('IDLE');
      avatarTimeoutRef.current = null;
    }, 1500);
  };

  // Helper to roll for organs
  const checkForOrganDrops = (kills: number): Record<string, number> => {
      const found: Record<string, number> = {};
      
      // For each "kill"
      for (let k = 0; k < kills; k++) {
          // Organ Check
          ORGANS.forEach(organ => {
              if (Math.random() < organ.chance) {
                  found[organ.id] = (found[organ.id] || 0) + 1;
              }
          });
          
          // Rare Element Check (simulated as hunt drop)
          if (Math.random() < 0.05) { // 5% chance per kill for an element
               const elem = ELEMENTS[Math.floor(Math.random() * ELEMENTS.length)];
               found[elem.id] = (found[elem.id] || 0) + 1;
          }
      }
      return found;
  };

  // Timer for Reward AND Minion Logic
  useEffect(() => {
    const timer = setInterval(() => {
      const currentState = gameStateRef.current;

      // 1. Reward Timer
      const now = Date.now();
      const elapsed = now - currentState.lastRewardTime;
      const remaining = Math.max(0, REWARD_INTERVAL - elapsed);
      setTimeToReward(remaining);

      // 2. Minion Automation Logic (Runs every 1s)
      let hunterKills = 0;
      let mealsCooked = 0;
      let mealsEatenByFeeders = 0;
      let leechHealing = 0;
      const minionUpdates: Record<string, MinionState> = {};
      const leveledUpMinions: string[] = [];

      MINIONS.forEach(minion => {
         const entry = currentState.minions[minion.id];
         if (entry && entry.count > 0) {
             // Logic for Leveling
             // 10 XP per sec per minion count
             let newXp = entry.xp + (entry.count * 10); 
             let newLevel = entry.level;
             
             // Cost to next level = Level * 500
             const xpReq = newLevel * 500;
             if (newXp >= xpReq) {
                 newXp -= xpReq;
                 newLevel++;
                 leveledUpMinions.push(minion.name);
             }

             // Store update
             minionUpdates[minion.id] = { ...entry, xp: newXp, level: newLevel };

             // Performance Multiplier: +10% per level above 1
             const levelMultiplier = 1 + ((newLevel - 1) * 0.1);
             const effectiveRate = minion.rate * levelMultiplier;

             if (minion.role === 'HUNTER') {
                 hunterKills += (effectiveRate * entry.count);
             } else if (minion.role === 'CHEF') {
                 mealsCooked += (effectiveRate * entry.count);
             } else if (minion.role === 'FEEDER') {
                 mealsEatenByFeeders += (effectiveRate * entry.count);
             } else if (minion.role === 'LEECH') {
                 leechHealing += (effectiveRate * entry.count);
             }
         }
      });

      if (leveledUpMinions.length > 0) {
          // Log summary of level ups
          const count = leveledUpMinions.length;
          const names = leveledUpMinions.slice(0, 2).join(", ");
          const suffix = count > 2 ? ` and ${count - 2} others` : "";
          const msg = `${names}${suffix} leveled up!`;
          
          addLog(msg, ActionType.LEVEL_UP);
          playSound('unlock');
      }

      // Process Automation if active
      if (hunterKills > 0 || mealsCooked > 0 || mealsEatenByFeeders > 0 || leechHealing > 0) {
          
          // --- CALCULATE DELTAS OUTSIDE OF SET STATE ---
          let meatGain = 0;
          let mealsGain = 0;
          let coinsGain = 0;
          let hpGain = 0;
          let foundOrgansTotal: Record<string, number> = {};
          let foundElementsTotal: Record<string, number> = {};
          
          // A. Hunting (Produces Meat & Organs)
          fractionalResources.current.meat += hunterKills;
          fractionalResources.current.killProgress += hunterKills;

          if (fractionalResources.current.meat >= 1) {
              const gained = Math.floor(fractionalResources.current.meat);
              meatGain += gained; // 1:1 ratio
              fractionalResources.current.meat -= gained;
          }

          if (fractionalResources.current.killProgress >= 1) {
              const kills = Math.floor(fractionalResources.current.killProgress);
              const drops = checkForOrganDrops(kills);
              
              Object.entries(drops).forEach(([id, qty]) => {
                   if (ORGANS.find(o => o.id === id)) {
                       foundOrgansTotal[id] = (foundOrgansTotal[id] || 0) + qty;
                   } else {
                       foundElementsTotal[id] = (foundElementsTotal[id] || 0) + qty;
                   }
              });
              
              // Log rare drops
              if (Object.keys(drops).length > 0 && (Math.random() < 0.1 || kills > 10)) {
                  let dropsLog = "";
                  Object.entries(drops).forEach(([id, qty]) => {
                       const name = ORGANS.find(o => o.id === id)?.name || ELEMENTS.find(e => e.id === id)?.name || id;
                       dropsLog += `${qty} ${name}, `;
                  });
                  addLog(`Minions found: ${dropsLog.slice(0, -2)}`, ActionType.HUNT);
              }

              fractionalResources.current.killProgress -= kills;
          }

          // B. Cooking (Consumes Meat -> Produces Meals)
          // Use current state meat + new meat gain for availability
          const availableMeat = currentState.rawMeat + meatGain;
          
          if (mealsCooked > 0 && availableMeat > 0) {
              fractionalResources.current.meals += mealsCooked;
              if (fractionalResources.current.meals >= 1) {
                  const potentialMeals = Math.floor(fractionalResources.current.meals);
                  const actualCooked = Math.min(potentialMeals, availableMeat);
                  
                  if (actualCooked > 0) {
                      meatGain -= actualCooked; // Reduce net meat gain (or dip into negative to take from state)
                      mealsGain += actualCooked;
                      fractionalResources.current.meals -= actualCooked;
                  }
              }
          }

          // C. Feeding (Consumes Meals -> Produces Coins/HP)
          const availableMeals = currentState.meals + mealsGain;
          let didFeed = false;

          if (mealsEatenByFeeders > 0 && availableMeals > 0) {
              fractionalResources.current.feeds += mealsEatenByFeeders;
              if (fractionalResources.current.feeds >= 1) {
                  const potentialEats = Math.floor(fractionalResources.current.feeds);
                  const actualEats = Math.min(potentialEats, availableMeals);

                  if (actualEats > 0) {
                      mealsGain -= actualEats; // Reduce net meal gain
                      coinsGain += Math.floor(actualEats * COINS_PER_MEAL * currentState.coinMultiplier);
                      hpGain += actualEats * HP_REGEN_ON_EAT;
                      fractionalResources.current.feeds -= actualEats;
                      didFeed = true;
                  }
              }
          }

          // D. Leeching (Passive HP Gain)
          if (leechHealing > 0) {
              hpGain += leechHealing;
          }

          // Trigger Animation
          if (didFeed) {
              triggerAvatarAction('EAT');
          }

          // Apply all changes
          setGameState(prev => {
              const newState = { 
                  ...prev,
                  organs: { ...prev.organs }, // Shallow copy for safety
                  pantry: { ...prev.pantry },
                  elements: { ...(prev.elements || {}) },
                  minions: { ...prev.minions, ...minionUpdates } // Update XP/Levels
              };

              newState.rawMeat = Math.max(0, newState.rawMeat + meatGain);
              newState.meals = Math.max(0, newState.meals + mealsGain);
              newState.coins += coinsGain;
              newState.hp = Math.min(newState.maxHp, newState.hp + hpGain);

              Object.entries(foundOrgansTotal).forEach(([id, qty]) => {
                  newState.organs[id] = (newState.organs[id] || 0) + qty;
              });

              Object.entries(foundElementsTotal).forEach(([id, qty]) => {
                  newState.elements![id] = (newState.elements![id] || 0) + qty;
              });

              return newState;
          });
      }

    }, 1000);

    return () => clearInterval(timer);
  }, [addLog]); // Removed gameState/upgrades/etc dependencies thanks to ref

  const handleAction = async (action: ActionType, context?: string) => {
    // Basic validation
    if (gameState.hp <= 0 && action !== ActionType.EAT && action !== ActionType.UNLOCK && action !== ActionType.HIRE && action !== ActionType.UPGRADE_MINION && action !== ActionType.EAT_SPECIAL && action !== ActionType.CONSUME_ORGAN) return;
    
    setIsLoading(true);
    
    let isSuccess = false;
    
    if (action === ActionType.HUNT) {
      playSound('hunt');
      isSuccess = Math.random() < gameState.huntChance;
      setHuntStatus({ timestamp: Date.now(), success: isSuccess });

      if (isSuccess) {
         setGameState(prev => {
             const ns = { ...prev, organs: { ...prev.organs }, elements: { ...(prev.elements || {}) } };
             ns.rawMeat += prev.meatYield;
             
             // Manual Hunt Organ Drop Chance
             const foundDrops = checkForOrganDrops(1); // 1 kill
             let organText = "";
             Object.entries(foundDrops).forEach(([id, qty]) => {
                if (ORGANS.find(o => o.id === id)) {
                    ns.organs[id] = (ns.organs[id] || 0) + qty;
                } else {
                    ns.elements![id] = (ns.elements![id] || 0) + qty;
                }
                const name = ORGANS.find(o => o.id === id)?.name || ELEMENTS.find(e => e.id === id)?.name || id;
                organText += ` Found a ${name}!`;
             });
             
             if (organText) setTimeout(() => addLog(organText, ActionType.HUNT), 0);
             return ns;
         });
         triggerAvatarAction('HUNT_SUCCESS');
      } else {
         playSound('fail');
         setGameState(prev => {
             const hp = Math.max(0, prev.hp - DAMAGE_ON_FAIL);
             if (hp === 0) setTimeout(() => addLog("Bob has fainted! Eat something quick!", ActionType.FAIL_HUNT), 0);
             return { ...prev, hp };
         });
         triggerAvatarAction('HURT');
      }
    } else if (action === ActionType.COOK) {
      if (gameState.rawMeat > 0) {
        playSound('cook');
        setGameState(prev => ({ ...prev, rawMeat: prev.rawMeat - 1, meals: prev.meals + 1 }));
        triggerAvatarAction('COOK');
      } else {
        setIsLoading(false);
        return; 
      }
    } else if (action === ActionType.EAT) {
      if (gameState.meals > 0) {
        playSound('eat');
        setGameState(prev => ({ 
            ...prev, 
            meals: prev.meals - 1, 
            coins: prev.coins + Math.floor(COINS_PER_MEAL * prev.coinMultiplier),
            hp: Math.min(prev.maxHp, prev.hp + HP_REGEN_ON_EAT)
        }));
        triggerAvatarAction('EAT');
      } else {
        setIsLoading(false);
        return;
      }
    }

    // AI Text Generation for manual actions only
    if (action !== ActionType.HIRE && action !== ActionType.UPGRADE_MINION) {
        const textAction = action === ActionType.HUNT && !isSuccess ? ActionType.FAIL_HUNT : action;
        const flavorText = await generateFlavorText(textAction, context);
        addLog(flavorText, textAction);
    }
    setIsLoading(false);
  };

  const handleCraft = async (item: CraftableItem) => {
      // Validate all ingredients
      const canAfford = Object.entries(item.ingredients).every(([id, amount]) => {
          if (id === 'rawMeat') return gameState.rawMeat >= amount;
          if (id === 'meals') return gameState.meals >= amount;
          // Check Organs then Elements
          const available = (gameState.organs[id] || 0) + (gameState.elements?.[id] || 0);
          return available >= amount;
      });

      if (canAfford) {
          playSound('craft');
          setGameState(prev => {
              const nextState = { ...prev, organs: { ...prev.organs }, elements: { ...(prev.elements || {}) }, pantry: { ...prev.pantry } };
              
              // Deduct ingredients
              Object.entries(item.ingredients).forEach(([id, amount]) => {
                  if (id === 'rawMeat') {
                      nextState.rawMeat -= amount;
                  } else if (id === 'meals') {
                      nextState.meals -= amount;
                  } else {
                      // Try organs
                      if (nextState.organs[id] && nextState.organs[id] >= amount) {
                          nextState.organs[id] -= amount;
                      } else if (nextState.elements![id] && nextState.elements![id] >= amount) {
                          nextState.elements![id] -= amount;
                      }
                  }
              });

              // Add product
              nextState.pantry[item.id] = (nextState.pantry[item.id] || 0) + 1;
              return nextState;
          });
          
          triggerAvatarAction('CRAFT');
          const flavorText = await generateFlavorText(ActionType.CRAFT, item.name);
          addLog(flavorText, ActionType.CRAFT);
      }
  };

  const handleEatSpecial = async (item: CraftableItem) => {
      if ((gameState.pantry[item.id] || 0) > 0) {
          playSound('eat');
          setGameState(prev => {
              const newState = { 
                  ...prev,
                  pantry: {
                      ...prev.pantry,
                      [item.id]: prev.pantry[item.id] - 1
                  }
              };

              // Apply Effects
              if (item.effectType === 'HEAL') {
                  newState.hp = Math.min(newState.maxHp, newState.hp + item.effectValue);
              } else if (item.effectType === 'BUFF_HUNT') {
                  newState.huntChance = Math.min(1.0, newState.huntChance + item.effectValue);
              } else if (item.effectType === 'BUFF_MAX_HP') {
                  newState.maxHp += item.effectValue;
                  newState.hp += item.effectValue;
              } else if (item.effectType === 'COIN_WIND') {
                  newState.coins += item.effectValue;
              }
              
              return newState;
          });
          triggerAvatarAction('EAT');
          const flavorText = await generateFlavorText(ActionType.EAT_SPECIAL, item.name);
          addLog(flavorText, ActionType.EAT_SPECIAL);
      }
  };

  const handleConsumeOrgan = async (organ: Organ) => {
      if ((gameState.organs[organ.id] || 0) > 0) {
          playSound('eat');
          setGameState(prev => {
              const newState = {
                  ...prev,
                  organs: {
                      ...prev.organs,
                      [organ.id]: prev.organs[organ.id] - 1
                  }
              };

              // Apply Organ Effects
              if (organ.effectType === 'HEAL') {
                  newState.hp = Math.min(newState.maxHp, newState.hp + organ.effectValue);
              } else if (organ.effectType === 'COINS') {
                  newState.coins += organ.effectValue * newState.coinMultiplier;
              } else if (organ.effectType === 'BUFF_MAX_HP') {
                  newState.maxHp += organ.effectValue;
                  newState.hp += organ.effectValue;
              } else if (organ.effectType === 'BUFF_HUNT') {
                   newState.huntChance = Math.min(1.0, newState.huntChance + organ.effectValue);
              }

              return newState;
          });
          triggerAvatarAction('EAT');
          const flavorText = await generateFlavorText(ActionType.CONSUME_ORGAN, organ.name);
          addLog(flavorText, ActionType.CONSUME_ORGAN);
      }
  };

  const buyUpgrade = async (upgrade: Upgrade) => {
    if (gameState.coins >= upgrade.cost && !upgrade.purchased) {
      playSound('unlock');
      const stateUpdate = upgrade.effect(gameState);
      setGameState(prev => ({
        ...prev,
        ...stateUpdate,
        coins: prev.coins - upgrade.cost,
        inventory: [...prev.inventory, upgrade.name]
      }));
      
      setUpgrades(prev => prev.map(u => u.id === upgrade.id ? { ...u, purchased: true } : u));
      
      triggerAvatarAction('HAPPY');
      setIsLoading(true);
      const flavorText = await generateFlavorText(ActionType.UNLOCK, upgrade.name);
      addLog(flavorText, ActionType.UNLOCK);
      setIsLoading(false);
    }
  };

  const hireMinion = async (minion: Minion) => {
      if (gameState.coins >= minion.cost) {
          playSound('unlock');
          setGameState(prev => {
              const currentMinion = prev.minions[minion.id] || { count: 0, xp: 0, level: 1 };
              return {
                  ...prev,
                  coins: prev.coins - minion.cost,
                  minions: {
                      ...prev.minions,
                      [minion.id]: {
                          ...currentMinion,
                          count: currentMinion.count + 1
                      }
                  }
              };
          });
          triggerAvatarAction('HAPPY');
          const roleText = minion.role === 'HUNTER' ? 'Hunting begins.' : minion.role === 'CHEF' ? 'The kitchen grows.' : minion.role === 'LEECH' ? 'Blood flows.' : 'Feeding time.';
          addLog(`Hired a ${minion.name}! ${roleText}`, ActionType.HIRE);
      }
  };

  const handleUpgradeMinion = async (minionId: string) => {
      const minion = MINIONS.find(m => m.id === minionId);
      const state = gameState.minions[minionId];
      if (!minion || !state) return;

      const cost = getMinionUpgradeCost(minion.role, state.level);
      
      if (gameState.coins >= cost) {
          playSound('unlock');
          setGameState(prev => ({
              ...prev,
              coins: prev.coins - cost,
              minions: {
                  ...prev.minions,
                  [minionId]: {
                      ...state,
                      level: state.level + 1
                      // Keep current XP, they are just boosted to next level tier
                  }
              }
          }));
          triggerAvatarAction('CRAFT');
          const flavorText = await generateFlavorText(ActionType.UPGRADE_MINION, minion.name);
          addLog(flavorText, ActionType.UPGRADE_MINION);
      }
  };

  const claimReward = () => {
    if (timeToReward <= 0) {
      playSound('unlock');
      setGameState(prev => ({
        ...prev,
        coins: prev.coins + COIN_REWARD,
        lastRewardTime: Date.now()
      }));
      triggerAvatarAction('HAPPY');
      addLog("Bob found a shiny bag of coins!", ActionType.UNLOCK);
    }
  };

  const formatTime = (ms: number) => {
    const minutes = Math.floor(ms / 60000);
    const seconds = Math.floor((ms % 60000) / 1000);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  // Drag and Drop Logic
  const handleDragOver = (e: React.DragEvent) => {
      e.preventDefault();
      e.dataTransfer.dropEffect = 'move';
      setIsDragOverBob(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
      setIsDragOverBob(false);
  };

  const handleDrop = (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragOverBob(false);
      const dataStr = e.dataTransfer.getData('application/json');
      if (!dataStr) return;

      try {
          const data = JSON.parse(dataStr);
          if (data.type === 'ORGAN') {
              const organ = ORGANS.find(o => o.id === data.id);
              if (organ) handleConsumeOrgan(organ);
          } else if (data.type === 'PANTRY') {
              const item = CRAFTABLES.find(c => c.id === data.id);
              if (item) handleEatSpecial(item);
          } else if (data.type === 'MEAL') {
              handleAction(ActionType.EAT);
          }
      } catch (err) {
          console.error("Drop Parse Error", err);
      }
  };

  // Filter upgrades to only show the next 3 available ones
  const availableUpgrades = upgrades.filter(u => !u.purchased);
  const visibleUpgrades = availableUpgrades.slice(0, 3);

  // Calculate counts for the map
  const activeHunterCount = MINIONS.reduce((acc, minion) => {
      if (minion.role === 'HUNTER') return acc + (gameState.minions[minion.id]?.count || 0);
      return acc;
  }, 0);
  
  const activeLeechCount = MINIONS.reduce((acc, minion) => {
      if (minion.role === 'LEECH') return acc + (gameState.minions[minion.id]?.count || 0);
      return acc;
  }, 0);

  return (
    <div className="h-screen w-screen bg-slate-950 text-slate-200 flex flex-col overflow-hidden">
      
      {/* --- TOP BAR: HEADER & RESOURCES --- */}
      <div className="shrink-0 bg-slate-900 border-b border-slate-800 p-2 flex flex-wrap gap-4 justify-between items-center shadow-md z-50">
          <h1 className="font-creep text-3xl md:text-4xl text-lime-500 drop-shadow-[0_0_5px_rgba(132,204,22,0.5)] whitespace-nowrap">
            Bob's Weird Buffet
          </h1>
          
          <div className="flex items-center gap-4 md:gap-8 overflow-x-auto no-scrollbar">
              <div className="flex items-center gap-2">
                  {ICONS.COIN}
                  <span className="text-xl font-bold text-yellow-400">{Math.floor(gameState.coins)}</span>
              </div>
              <div className="flex items-center gap-2">
                  {ICONS.MEAT}
                  <span className="text-xl font-bold text-red-500">{gameState.rawMeat}</span>
              </div>
              <div 
                  className="flex items-center gap-2 cursor-grab active:cursor-grabbing hover:scale-110 transition-transform"
                  draggable={gameState.meals > 0}
                  onDragStart={(e) => {
                      e.dataTransfer.setData('application/json', JSON.stringify({ type: 'MEAL' }));
                      e.dataTransfer.effectAllowed = 'move';
                  }}
              >
                  {ICONS.MEAL}
                  <span className="text-xl font-bold text-orange-500">{gameState.meals}</span>
              </div>
              <div className="flex items-center gap-2 text-xs md:text-sm text-purple-300 bg-purple-900/30 px-3 py-1 rounded-full border border-purple-800 whitespace-nowrap">
                  <span>Reward: {formatTime(timeToReward)}</span>
                  {timeToReward <= 0 && (
                      <button 
                          onClick={claimReward}
                          className="ml-2 bg-purple-600 hover:bg-purple-500 text-white px-2 py-0.5 rounded text-xs animate-bounce"
                      >
                          CLAIM
                      </button>
                  )}
              </div>
          </div>
      </div>

      {/* --- MAIN DASHBOARD CONTENT --- */}
      <div className="flex-1 flex flex-col md:flex-row min-h-0 overflow-hidden">
        
        {/* --- COL 1: INTERACTION (BOB & ACTIONS & LOGS) --- */}
        <div className="w-full md:w-1/4 min-w-[300px] flex flex-col p-2 border-r border-slate-800 bg-slate-925 overflow-hidden">
           
           {/* Top Section: Scrollable (Avatar, Buttons, Organs) */}
           <div className="flex-1 overflow-y-auto flex flex-col gap-4 pr-1 custom-scrollbar pb-2">
               {/* Bob Avatar Container */}
               <div 
                  className={`relative flex justify-center items-center p-6 bg-slate-900 rounded-xl border-2 transition-all duration-300 shrink-0 ${isDragOverBob ? 'border-orange-500 scale-105 bg-orange-900/20' : 'border-slate-800'}`}
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                  onDrop={handleDrop}
               >
                  <BobAvatar action={isDragOverBob ? 'EAT' : avatarAction} inventory={gameState.inventory} />
                  
                  {/* Vitals Overlay */}
                  <div className="absolute top-2 left-2 flex flex-col gap-1">
                     <div className="flex items-center gap-1 bg-black/50 px-2 py-1 rounded text-xs">
                         {ICONS.HP} <span className={gameState.hp < 30 ? 'text-red-500 animate-pulse font-bold' : 'text-green-400'}>{Math.round(gameState.hp)}/{gameState.maxHp}</span>
                     </div>
                     <div className="flex items-center gap-1 bg-black/50 px-2 py-1 rounded text-xs text-blue-300">
                         🎯 {(gameState.huntChance * 100).toFixed(0)}%
                     </div>
                  </div>
               </div>

               {/* Manual Actions */}
               <div className="grid grid-cols-3 gap-2 shrink-0">
                   <button 
                      onClick={() => handleAction(ActionType.HUNT)}
                      disabled={isLoading || gameState.hp <= 0}
                      className="bg-red-900 hover:bg-red-700 disabled:opacity-50 text-white font-bold py-3 rounded border-b-4 border-red-950 active:border-b-0 active:translate-y-1 transition-all flex flex-col items-center justify-center"
                   >
                      <span className="text-xl">🕸️</span>
                      <span className="text-xs">HUNT</span>
                   </button>

                   <button 
                      onClick={() => handleAction(ActionType.COOK)}
                      disabled={isLoading || gameState.rawMeat <= 0}
                      className="bg-orange-800 hover:bg-orange-600 disabled:opacity-50 text-white font-bold py-3 rounded border-b-4 border-orange-950 active:border-b-0 active:translate-y-1 transition-all flex flex-col items-center justify-center"
                   >
                      <span className="text-xl">🍲</span>
                      <span className="text-xs">COOK</span>
                   </button>

                   <button 
                      onClick={() => handleAction(ActionType.EAT)}
                      disabled={isLoading || gameState.meals <= 0}
                      className="bg-green-800 hover:bg-green-600 disabled:opacity-50 text-white font-bold py-3 rounded border-b-4 border-green-950 active:border-b-0 active:translate-y-1 transition-all flex flex-col items-center justify-center"
                   >
                      <span className="text-xl">😋</span>
                      <span className="text-xs">EAT</span>
                   </button>
               </div>
               
               {/* Organ Case Component */}
               <OrganCase gameState={gameState} onConsume={handleConsumeOrgan} />
           </div>

           {/* Bottom Section: Game Log (Fixed Height) */}
           <div className="h-48 shrink-0 bg-slate-900 p-2 mt-2 rounded border border-slate-800 shadow-inner overflow-hidden">
                <GameLog logs={logs} />
           </div>

        </div>

        {/* --- COL 2: VISUALIZATION (MAP ONLY) --- */}
        <div className="w-full md:w-2/5 flex flex-col bg-black relative border-r border-slate-800 overflow-hidden">
            <HuntingMap 
               huntTrigger={huntStatus} 
               hunterCount={activeHunterCount}
               leechCount={activeLeechCount} 
               meatYield={gameState.meatYield}
               className="w-full h-full"
            />
        </div>

        {/* --- COL 3: MANAGEMENT (SHOPS & CRAFTING) --- */}
        <div className="w-full md:w-[35%] min-w-[320px] bg-slate-925 p-2 overflow-y-auto flex flex-col gap-4">
            
            {/* Upgrades Shop */}
            <div className="bg-slate-900 border-2 border-slate-700 rounded-xl p-4 flex flex-col gap-3">
                <h3 className="text-xl font-bold text-yellow-500 font-creep tracking-wider">Weird Shop</h3>
                <div className="space-y-2">
                    {visibleUpgrades.length === 0 && <div className="text-slate-500 text-sm italic">Sold out... for now.</div>}
                    {visibleUpgrades.map((upgrade) => (
                        <div key={upgrade.id} className="bg-slate-950 p-2 rounded border border-slate-800 flex justify-between items-center animate-slideIn">
                            <div className="flex flex-col">
                                <span className="font-bold text-sm text-slate-300">{upgrade.name}</span>
                                <span className="text-[10px] text-slate-500">{upgrade.description}</span>
                            </div>
                            <button
                                onClick={() => buyUpgrade(upgrade)}
                                disabled={gameState.coins < upgrade.cost}
                                className={`ml-2 px-2 py-1 text-xs font-bold rounded ${
                                    gameState.coins >= upgrade.cost 
                                    ? 'bg-yellow-700 hover:bg-yellow-600 text-white' 
                                    : 'bg-slate-800 text-slate-600 cursor-not-allowed'
                                }`}
                            >
                                ${upgrade.cost}
                            </button>
                        </div>
                    ))}
                </div>
            </div>

            {/* Minions Den */}
            <MonsterDen gameState={gameState} onHire={hireMinion} onUpgrade={handleUpgradeMinion} />

            {/* Crafting Bench */}
            <CraftingBench gameState={gameState} onCraft={handleCraft} onEat={handleEatSpecial} />

        </div>
      </div>

    </div>
  );
};

export default App;
