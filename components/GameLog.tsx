
import React, { useEffect, useRef } from 'react';
import { LogEntry, ActionType } from '../types';

interface GameLogProps {
  logs: LogEntry[];
}

export const GameLog: React.FC<GameLogProps> = ({ logs }) => {
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [logs]);

  const getColor = (type: ActionType) => {
    switch (type) {
      case ActionType.HUNT: return 'text-lime-400';
      case ActionType.FAIL_HUNT: return 'text-red-400 font-bold';
      case ActionType.COOK: return 'text-orange-300';
      case ActionType.EAT: return 'text-yellow-300';
      case ActionType.UNLOCK: return 'text-purple-300';
      default: return 'text-slate-300';
    }
  };

  return (
    <div className="h-full flex flex-col font-mono text-sm overflow-hidden">
      <h3 className="text-slate-500 uppercase text-xs mb-1 tracking-widest border-b border-slate-800 pb-1">Activity Log</h3>
      <div className="flex-1 overflow-y-auto space-y-1 pr-1 custom-scrollbar">
        {logs.length === 0 && <span className="text-slate-600 italic text-xs">Bob is waiting...</span>}
        {logs.map((log) => (
          <div key={log.id} className={`${getColor(log.type)} border-l-2 border-slate-700 pl-2 text-xs py-0.5 animate-fadeIn break-words`}>
            <span className="opacity-50 text-[10px] mr-2">[{new Date(log.timestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit', second:'2-digit'})}]</span>
            {log.text}
          </div>
        ))}
        <div ref={bottomRef} />
      </div>
    </div>
  );
};
