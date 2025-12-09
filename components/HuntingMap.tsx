
import React, { useEffect, useRef } from 'react';

interface HuntingMapProps {
  huntTrigger: { timestamp: number; success: boolean };
  hunterCount: number;
  leechCount?: number;
  meatYield?: number;
  className?: string;
}

interface Entity {
  x: number;
  y: number;
  vx: number;
  vy: number;
  color: string;
  size: number;
  type: 'bob' | 'prey' | 'particle' | 'hunter' | 'leech' | 'loot_meat' | 'loot_organ' | 'blood' | 'blood_drain';
  life?: number;
  dead?: boolean;
  label?: string; // For loot text
  angle?: number; // Facing direction
  attachedTo?: Entity; // For leeches
  attachStart?: number; // Timestamp
}

export const HuntingMap: React.FC<HuntingMapProps> = ({ huntTrigger, hunterCount, leechCount = 0, meatYield = 1, className }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  
  // State for logic to reference current dimensions without re-triggering effects
  const dimensions = useRef({ width: 800, height: 400 });

  const stateRef = useRef({
    entities: [] as Entity[],
    bob: { x: 400, y: 200, vx: 0, vy: 0, color: '#65a30d', size: 8, type: 'bob', angle: 0 } as Entity,
    lastTrigger: 0,
    animationState: 'idle' as 'idle' | 'hunting' | 'returning',
    targetIndex: -1
  });

  // Handle Resizing
  useEffect(() => {
      const handleResize = () => {
          if (containerRef.current && canvasRef.current) {
              const { clientWidth, clientHeight } = containerRef.current;
              canvasRef.current.width = clientWidth;
              canvasRef.current.height = clientHeight;
              
              dimensions.current.width = clientWidth;
              dimensions.current.height = clientHeight;
              
              if (stateRef.current.animationState === 'idle') {
                  stateRef.current.bob.x = clientWidth / 2;
                  stateRef.current.bob.y = clientHeight / 2;
              }
          }
      };

      handleResize();
      const observer = new ResizeObserver(handleResize);
      if (containerRef.current) observer.observe(containerRef.current);
      return () => observer.disconnect();
  }, []);

  // Initialize Prey
  useEffect(() => {
    const initPrey = () => {
        if (stateRef.current.entities.some(e => e.type === 'prey')) return;
        const prey: Entity[] = [];
        const { width, height } = dimensions.current;
        for(let i=0; i<20; i++) {
            prey.push({
                x: Math.random() * (width - 20) + 10,
                y: Math.random() * (height - 20) + 10,
                vx: (Math.random() - 0.5) * 0.5,
                vy: (Math.random() - 0.5) * 0.5,
                color: '#f87171',
                size: 4,
                type: 'prey',
                angle: Math.random() * Math.PI * 2
            });
        }
        stateRef.current.entities = [...stateRef.current.entities, ...prey];
    };
    initPrey();
  }, []);

  // Sync visual hunters/leeches
  useEffect(() => {
    const VISUAL_CAP = 100; 
    const { width, height } = dimensions.current;

    const updateEntityType = (type: 'hunter' | 'leech', count: number, color: string, size: number) => {
        const targetCount = Math.min(count, VISUAL_CAP);
        const currentEntities = stateRef.current.entities.filter(e => e.type === type && !e.dead);
        const diff = targetCount - currentEntities.length;

        if (diff > 0) {
            for(let i=0; i<diff; i++) {
                stateRef.current.entities.push({
                    x: Math.random() * (width - 20) + 10,
                    y: Math.random() * (height - 20) + 10,
                    vx: (Math.random() - 0.5) * (type === 'hunter' ? 0.8 : 0.3),
                    vy: (Math.random() - 0.5) * (type === 'hunter' ? 0.8 : 0.3),
                    color: color,
                    size: size,
                    type: type,
                    angle: Math.random() * Math.PI * 2
                });
            }
        } else if (diff < 0) {
            let removed = 0;
            for (let i = stateRef.current.entities.length - 1; i >= 0; i--) {
                if (stateRef.current.entities[i].type === type && removed < Math.abs(diff)) {
                    stateRef.current.entities[i].dead = true;
                    removed++;
                }
            }
        }
    };

    updateEntityType('hunter', hunterCount, '#818cf8', 3.5);
    updateEntityType('leech', leechCount, '#4a0404', 3);

  }, [hunterCount, leechCount]);

  // Trigger Bob's Hunt
  useEffect(() => {
    if (huntTrigger.timestamp > stateRef.current.lastTrigger) {
        stateRef.current.lastTrigger = huntTrigger.timestamp;
        const { width, height } = dimensions.current;
        
        if (huntTrigger.success) {
            const preys = stateRef.current.entities.filter(e => e.type === 'prey' && !e.dead);
            if (preys.length > 0) {
                const prey = preys[Math.floor(Math.random() * preys.length)];
                stateRef.current.targetIndex = stateRef.current.entities.indexOf(prey);
                stateRef.current.animationState = 'hunting';
            } else {
                const newPrey: Entity = {
                    x: Math.random() < 0.5 ? 20 : width - 20,
                    y: Math.random() * (height - 20) + 10,
                    vx: 0, vy:0, color: '#f87171', size: 4, type: 'prey'
                };
                stateRef.current.entities.push(newPrey);
                stateRef.current.targetIndex = stateRef.current.entities.length - 1;
                stateRef.current.animationState = 'hunting';
            }
        }
    }
  }, [huntTrigger]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationId: number;

    const spawnBlood = (x: number, y: number, isDrain = false) => {
        const count = isDrain ? 1 : 5 + Math.random() * 5;
        for(let i=0; i<count; i++) {
            const angle = Math.random() * Math.PI * 2;
            const speed = Math.random() * 3 + 1;
            stateRef.current.entities.push({
                x, y,
                vx: isDrain ? (Math.random() - 0.5) : Math.cos(angle) * speed,
                vy: isDrain ? (Math.random() - 0.5) : Math.sin(angle) * speed,
                color: isDrain ? '#ef4444' : (Math.random() > 0.5 ? '#7f1d1d' : '#991b1b'),
                size: isDrain ? 1.5 : Math.random() * 2 + 1,
                type: isDrain ? 'blood_drain' : 'blood',
                life: isDrain ? 30 : 150 + Math.random() * 100,
                angle: angle
            });
        }
    };

    const spawnLoot = (x: number, y: number) => {
        spawnBlood(x, y);
        stateRef.current.entities.push({
            x, y, vx: 0, vy: -0.5,
            color: '#ef4444', size: 0, type: 'loot_meat', life: 60, label: `+${meatYield}🍖`
        });
        if (Math.random() < 0.65) {
            const organIcon = ['👁️','🫁','🧠','🥜','🫀'][Math.floor(Math.random()*5)];
            stateRef.current.entities.push({
                x: x + 10, y: y - 5, vx: 0.2, vy: -0.6,
                color: '#ec4899', size: 0, type: 'loot_organ', life: 70, label: organIcon
            });
        }
    };

    const render = () => {
        const state = stateRef.current;
        const bob = state.bob;
        const { width, height } = dimensions.current;
        const now = Date.now();

        // Spawn Prey
        const maxPrey = 40 + Math.floor(hunterCount / 2);
        const currentPreyCount = state.entities.filter(e => e.type === 'prey' && !e.dead).length;
        if (currentPreyCount < maxPrey && Math.random() < (0.02 + hunterCount * 0.001)) {
             state.entities.push({
                x: Math.random() * width,
                y: Math.random() * height,
                vx: (Math.random() - 0.5) * 0.5,
                vy: (Math.random() - 0.5) * 0.5,
                color: '#f87171',
                size: 4,
                type: 'prey',
                angle: Math.random() * Math.PI * 2
            });
        }

        // --- Bob Logic ---
        if (state.animationState === 'hunting') {
             const target = state.entities[state.targetIndex];
             if (!target || target.dead) {
                 state.animationState = 'returning';
             } else {
                const dx = target.x - bob.x;
                const dy = target.y - bob.y;
                const dist = Math.hypot(dx, dy);
                bob.angle = Math.atan2(dy, dx);

                if (dist < 8) {
                    target.dead = true;
                    spawnLoot(target.x, target.y);
                    state.animationState = 'returning';
                } else {
                    bob.x += (dx / dist) * 10;
                    bob.y += (dy / dist) * 10;
                }
             }
        } else if (state.animationState === 'returning') {
             const dx = (width / 2) - bob.x;
             const dy = (height / 2) - bob.y;
             const dist = Math.hypot(dx, dy);
             bob.angle = Math.atan2(dy, dx);

             if (dist < 5) {
                 bob.x = width / 2;
                 bob.y = height / 2;
                 state.animationState = 'idle';
             } else {
                 bob.x += (dx / dist) * 6;
                 bob.y += (dy / dist) * 6;
             }
        } else {
            const dx = (width / 2) - bob.x;
            const dy = (height / 2) - bob.y;
            if (Math.hypot(dx,dy) > 10) {
                 bob.x += dx * 0.1;
                 bob.y += dy * 0.1;
                 bob.angle = Math.atan2(dy, dx);
            }
        }

        // --- Entity Logic ---
        state.entities.forEach(e => {
            if (e.dead) return;

            // Particles
            if (e.type === 'blood' || e.type === 'blood_drain') {
                e.x += e.vx;
                e.y += e.vy;
                e.vx *= 0.8; 
                e.vy *= 0.8;
                if (e.type === 'blood_drain' && e.life) {
                    // Drift towards nothing specifically, handled by spawn origin
                }
                if (e.life) e.life--;
                if (e.life !== undefined && e.life <= 0) e.dead = true;
                return;
            }

            // Leech Logic
            if (e.type === 'leech') {
                if (e.attachedTo) {
                    if (e.attachedTo.dead) {
                        e.attachedTo = undefined;
                        e.attachStart = undefined;
                    } else {
                        // Orbit the host
                        const time = now * 0.005;
                        const offsetX = Math.cos(time + (e.x % 10)) * 8;
                        const offsetY = Math.sin(time + (e.y % 10)) * 8;
                        e.x = e.attachedTo.x + offsetX;
                        e.y = e.attachedTo.y + offsetY;
                        e.vx = e.attachedTo.vx;
                        e.vy = e.attachedTo.vy;

                        // Drain Check
                        if (e.attachStart && now - e.attachStart > 10000) { // 10s to kill (sped up for visuals)
                             e.attachedTo.dead = true;
                             spawnLoot(e.attachedTo.x, e.attachedTo.y);
                             e.attachedTo = undefined;
                             e.attachStart = undefined;
                        }

                        // Visual Drain Particles
                        if (Math.random() < 0.1) {
                             state.entities.push({
                                x: e.attachedTo.x, y: e.attachedTo.y,
                                vx: (e.x - e.attachedTo.x) * 0.2,
                                vy: (e.y - e.attachedTo.y) * 0.2,
                                color: '#ef4444', size: 1.5, type: 'blood_drain', life: 20
                             });
                        }
                    }
                } else {
                    // Seek Logic
                    e.x += e.vx; e.y += e.vy;
                    let target: Entity | null = null;
                    let minDist = 99999;

                    state.entities.forEach(other => {
                        if (other.type === 'prey' && !other.dead && !other.attachedTo) {
                            const d = (other.x - e.x)**2 + (other.y - e.y)**2;
                            if (d < minDist) { minDist = d; target = other; }
                        }
                    });

                    if (target && minDist < 60000) {
                        const d = Math.sqrt(minDist);
                        e.vx += ((target.x - e.x)/d) * 0.2;
                        e.vy += ((target.y - e.y)/d) * 0.2;
                        
                        if (d < 10) {
                            e.attachedTo = target;
                            e.attachStart = now;
                            target.attachedTo = e; // Mark prey as having a parasite
                        }
                    } else {
                        if (Math.random() < 0.05) {
                            e.vx += (Math.random()-0.5)*0.5;
                            e.vy += (Math.random()-0.5)*0.5;
                        }
                    }
                }
                
                e.vx *= 0.9; e.vy *= 0.9;
            }

            // Hunter Logic
            if (e.type === 'hunter') {
                e.x += e.vx; e.y += e.vy;
                let target: Entity | null = null;
                let minDist = 99999;
                state.entities.forEach(other => {
                    if (other.type === 'prey' && !other.dead) {
                        const d = (other.x - e.x)**2 + (other.y - e.y)**2;
                        if (d < minDist) { minDist = d; target = other; }
                    }
                });

                if (target && minDist < 90000) {
                     const d = Math.sqrt(minDist);
                     e.vx += ((target.x - e.x)/d) * 0.15;
                     e.vy += ((target.y - e.y)/d) * 0.15;
                     if (d < 8) {
                         target.dead = true;
                         spawnLoot(target.x, target.y);
                     }
                } else {
                    if(Math.random()<0.05) { e.vx+=(Math.random()-0.5)*0.5; e.vy+=(Math.random()-0.5)*0.5; }
                }
                e.vx *= 0.96; e.vy *= 0.96;
            }

            // Prey Logic (Move & Flee)
            if (e.type === 'prey') {
                e.x += e.vx; e.y += e.vy;
                // Fleeing
                let fearX = 0, fearY = 0;
                state.entities.forEach(h => {
                    if ((h.type === 'hunter' || h.type === 'leech' || h.type === 'bob') && !h.dead) {
                        const d = Math.hypot(h.x-e.x, h.y-e.y);
                        if (d < 100) {
                            fearX -= (h.x - e.x)/d;
                            fearY -= (h.y - e.y)/d;
                        }
                    }
                });
                if (fearX !== 0 || fearY !== 0) {
                    e.vx += fearX * 0.2; e.vy += fearY * 0.2;
                } else if (Math.random() < 0.02) {
                    e.vx += (Math.random()-0.5)*0.2;
                    e.vy += (Math.random()-0.5)*0.2;
                }
                const speed = Math.hypot(e.vx, e.vy);
                if (speed > 3) { e.vx = (e.vx/speed)*3; e.vy = (e.vy/speed)*3; }
            }

            // Bounds
            if (e.type !== 'bob') {
                if (e.x < 0 || e.x > width) e.vx *= -1;
                if (e.y < 0 || e.y > height) e.vy *= -1;
                e.x = Math.max(0, Math.min(width, e.x));
                e.y = Math.max(0, Math.min(height, e.y));
            }
        });

        // --- DRAWING ---
        ctx.clearRect(0, 0, width, height);

        // Draw Blood/Particles
        state.entities.forEach(e => {
            if (e.dead && e.type !== 'blood' && e.type !== 'blood_drain') return;
            if (e.type !== 'blood' && e.type !== 'blood_drain') return;
            ctx.fillStyle = e.color;
            ctx.globalAlpha = (e.life || 0) / (e.type === 'blood_drain' ? 30 : 200);
            ctx.beginPath();
            ctx.arc(e.x, e.y, e.size, 0, Math.PI * 2);
            ctx.fill();
            ctx.globalAlpha = 1.0;
        });

        // Draw Bob
        ctx.fillStyle = bob.color;
        ctx.beginPath();
        ctx.save();
        ctx.translate(bob.x, bob.y);
        ctx.rotate(bob.angle || 0);
        ctx.moveTo(10, 0);
        ctx.lineTo(-6, 6);
        ctx.lineTo(-6, -6);
        ctx.fill();
        ctx.restore();

        // Draw Entities
        state.entities.forEach(e => {
            if (e.dead || e.type === 'bob' || e.type === 'blood' || e.type === 'blood_drain') return;

            // Draw Prey Aura if Leached
            if (e.type === 'prey' && e.attachedTo) {
                ctx.strokeStyle = `rgba(255, 0, 0, ${0.3 + Math.sin(now * 0.01) * 0.2})`;
                ctx.lineWidth = 2;
                ctx.beginPath();
                ctx.arc(e.x, e.y, e.size + 4, 0, Math.PI * 2);
                ctx.stroke();
            }

            // Draw Connector
            if (e.type === 'leech' && e.attachedTo) {
                ctx.strokeStyle = 'rgba(100, 0, 0, 0.5)';
                ctx.lineWidth = 2;
                ctx.beginPath();
                ctx.moveTo(e.x, e.y);
                ctx.lineTo(e.attachedTo.x, e.attachedTo.y);
                ctx.stroke();
            }

            ctx.fillStyle = e.color;
            if (e.type === 'loot_meat' || e.type === 'loot_organ') {
                ctx.font = "12px sans-serif";
                ctx.textAlign = "center";
                ctx.fillText(e.label || '', e.x, e.y);
                e.y += e.vy;
                if (e.life) e.life--;
                if (e.life !== undefined && e.life <= 0) e.dead = true;
            } else {
                ctx.beginPath();
                ctx.arc(e.x, e.y, e.size, 0, Math.PI * 2);
                ctx.fill();
            }
        });

        animationId = requestAnimationFrame(render);
    };

    render();
    return () => cancelAnimationFrame(animationId);
  }, [hunterCount, leechCount, meatYield]);

  return (
    <div ref={containerRef} className={`w-full h-full overflow-hidden ${className || ''}`}>
      <canvas ref={canvasRef} className="block" />
    </div>
  );
};
