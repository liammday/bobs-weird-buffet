
import React, { useState, useEffect } from 'react';

interface BobAvatarProps {
  action: string; // IDLE, HUNT_SUCCESS, HURT, COOK, CRAFT, EAT, HAPPY
  inventory: string[];
}

export const BobAvatar: React.FC<BobAvatarProps> = ({ action, inventory }) => {
  const [idleAction, setIdleAction] = useState('BREATHE');

  // Random Idle Behavior Loop
  useEffect(() => {
    if (action !== 'IDLE') return;

    const interval = setInterval(() => {
        const random = Math.random();
        if (random < 0.2) setIdleAction('BLINK');
        else if (random < 0.4) setIdleAction('LOOK_AROUND');
        else if (random < 0.6) setIdleAction('FLOAT');
        else if (random < 0.7) setIdleAction('SCRATCH');
        else setIdleAction('BREATHE');

        // Reset to breathe after a short time if it was a quick action
        if (random < 0.7) {
            setTimeout(() => setIdleAction('BREATHE'), 1500);
        }
    }, 4000);

    return () => clearInterval(interval);
  }, [action]);

  const hasWeapon = inventory.some(i => /Spork|Knife|Axe|Cleaver|Saw/.test(i));
  const hasHat = inventory.some(i => /Helmet|Mask|Hood/.test(i));
  const hasBling = inventory.some(i => /Gold|Divine|Cosmic/.test(i));

  // Determine current effective state (Active action overrides idle)
  const currentMode = action === 'IDLE' ? idleAction : action;

  // Animation Classes
  let containerClass = "relative w-48 h-48 transition-transform duration-300";
  if (action === 'HURT') containerClass += " animate-shake";
  if (action === 'HAPPY' || currentMode === 'FLOAT') containerClass += " animate-bounce-slow";
  if (action === 'COOK') containerClass += " animate-pulse";
  if (currentMode === 'SCRATCH') containerClass += " animate-wiggle"; // Assume wiggle exists or bounce

  const bobColor = action === 'HURT' ? 'fill-red-400' : 'fill-lime-600';
  const strokeColor = '#1a2e05';

  return (
    <div className={containerClass}>
      <svg viewBox="0 0 200 200" className="w-full h-full drop-shadow-2xl filter">
        
        {/* Bling Aura */}
        {hasBling && (
            <circle cx="100" cy="100" r="80" fill="none" stroke="gold" strokeWidth="2" strokeDasharray="5,5" className="animate-spin-slow opacity-50" />
        )}

        {/* --- BODY --- */}
        <path
          d="M50 150 Q20 100 50 50 Q100 0 150 50 Q180 100 150 150 Q100 190 50 150 Z"
          className={`${bobColor} transition-colors duration-500`}
          stroke={strokeColor}
          strokeWidth="4"
        />
        
        {/* --- HAT --- */}
        {hasHat && (
             <path d="M40 60 Q100 20 160 60 L150 40 Q100 0 50 40 Z" fill="#333" stroke="black" />
        )}

        {/* --- EYES --- */}
        {/* Left Eye */}
        <circle cx="85" cy="80" r="15" fill="white" stroke="black" strokeWidth="2" />
        {/* Right Eye */}
        <circle cx="125" cy="80" r="15" fill="white" stroke="black" strokeWidth="2" />

        {/* Pupils */}
        {action === 'HURT' ? (
            <>
                <path d="M78 73 L92 87 M92 73 L78 87" stroke="black" strokeWidth="3" /> {/* X Eye */}
                <path d="M118 73 L132 87 M132 73 L118 87" stroke="black" strokeWidth="3" /> {/* X Eye */}
            </>
        ) : currentMode === 'BLINK' ? (
             <>
                <line x1="70" y1="80" x2="100" y2="80" stroke="black" strokeWidth="3" />
                <line x1="110" y1="80" x2="140" y2="80" stroke="black" strokeWidth="3" />
             </>
        ) : (
            <>
                <circle 
                    cx={currentMode === 'LOOK_AROUND' ? 80 : 85} 
                    cy={currentMode === 'LOOK_AROUND' ? 80 : 80} 
                    r="5" fill="black" 
                />
                <circle 
                    cx={currentMode === 'LOOK_AROUND' ? 120 : 125} 
                    cy={currentMode === 'LOOK_AROUND' ? 80 : 80} 
                    r="5" fill="black" 
                />
            </>
        )}

        {/* --- MOUTH --- */}
        {action === 'EAT' || action === 'HAPPY' ? (
             // Big Open Mouth
             <path d="M70 120 Q105 160 140 120 Z" fill="#3f0f0f" stroke="black" strokeWidth="2" />
        ) : action === 'HURT' ? (
             // Sad Mouth
             <path d="M80 140 Q105 120 130 140" fill="none" stroke="black" strokeWidth="3" />
        ) : action === 'HUNT_SUCCESS' ? (
             // Smirk
             <path d="M80 130 Q105 140 120 125" fill="none" stroke="black" strokeWidth="3" />
        ) : (
             // Neutral / Wiggle
             <path d="M85 130 Q105 140 125 130" fill="none" stroke="black" strokeWidth="3" />
        )}

        {/* Teeth (for open mouth) */}
        {(action === 'EAT' || action === 'HAPPY') && (
            <>
                <path d="M80 120 L85 130 L90 120" fill="white" />
                <path d="M120 120 L125 130 L130 120" fill="white" />
            </>
        )}

        {/* --- ARMS & ACTIONS --- */}
        
        {/* Left Arm (Holding Pot if Cooking) */}
        <path d="M50 100 Q20 120 30 140" fill="none" stroke={strokeColor} strokeWidth="4" strokeLinecap="round" />
        
        {/* Right Arm (Dynamic) */}
        {action === 'HUNT_SUCCESS' ? (
            // Raised Arm
            <path d="M150 100 Q180 80 190 60" fill="none" stroke={strokeColor} strokeWidth="4" strokeLinecap="round" />
        ) : action === 'COOK' ? (
             // Stirring Arm
            <path d="M150 100 Q170 120 150 140" fill="none" stroke={strokeColor} strokeWidth="4" strokeLinecap="round" />
        ) : action === 'CRAFT' ? (
             // Hammering Arm
            <path d="M150 100 Q180 110 160 150" fill="none" stroke={strokeColor} strokeWidth="4" strokeLinecap="round" />
        ) : (
            // Normal Arm
            <path d="M150 100 Q180 120 170 140" fill="none" stroke={strokeColor} strokeWidth="4" strokeLinecap="round" />
        )}

        {/* --- PROPS --- */}
        
        {/* Cooking Pot */}
        {action === 'COOK' && (
             <g>
                 <path d="M100 150 L100 180" stroke="black" strokeWidth="2" /> {/* Ladle Handle */}
                 <ellipse cx="100" cy="180" rx="10" ry="5" fill="silver" /> {/* Ladle Scoop */}
                 <path d="M60 160 Q100 180 140 160 L130 200 Q100 210 70 200 Z" fill="#222" /> {/* Pot Body */}
                 <path d="M65 165 Q80 155 90 165 T120 160" fill="none" stroke="#00ff00" strokeWidth="2" className="animate-pulse" /> {/* Slime */}
             </g>
        )}

        {/* Crafting Hammer */}
        {action === 'CRAFT' && (
             <g transform="translate(160, 150) rotate(45)">
                 <rect x="-5" y="-20" width="10" height="40" fill="brown" />
                 <rect x="-15" y="-30" width="30" height="20" fill="gray" />
             </g>
        )}
        
        {/* Weapon (If unlocked and not doing something else specific like cooking) */}
        {hasWeapon && (action === 'HUNT_SUCCESS' || action === 'IDLE' || action === 'HAPPY') && (
            <path 
                d={action === 'HUNT_SUCCESS' ? "M190 60 L200 40 L180 50" : "M170 140 L190 110 L180 100"} 
                stroke="silver" 
                strokeWidth="4" 
                fill="none" 
            />
        )}

        {/* Scratch Hand */}
        {currentMode === 'SCRATCH' && (
             <path d="M50 80 Q30 70 40 50" fill="none" stroke={strokeColor} strokeWidth="3" strokeDasharray="2,2" />
        )}

      </svg>
      
      {/* Bob's Thoughts / Speech Bubble */}
      <div className="absolute -top-6 -right-6 bg-white text-black p-2 rounded-xl text-xs font-bold border-2 border-black transform rotate-12 shadow-md z-20 min-w-[60px] text-center">
        {action === 'HURT' ? "OUCH!" : 
         action === 'EAT' ? "YUM!" : 
         action === 'COOK' ? "COOKIN'!" : 
         action === 'CRAFT' ? "MAKIES!" : 
         action === 'HAPPY' ? "WOOHOO!" :
         action === 'HUNT_SUCCESS' ? "GOTCHA!" :
         currentMode === 'SCRATCH' ? "ITCHY..." :
         currentMode === 'LOOK_AROUND' ? "HMM?" :
         currentMode === 'FLOAT' ? "WHEEE" :
         "..."}
      </div>
    </div>
  );
};
