
export enum ActionType {
  HUNT = 'HUNT',
  COOK = 'COOK',
  EAT = 'EAT',
  FAIL_HUNT = 'FAIL_HUNT',
  UNLOCK = 'UNLOCK',
  HIRE = 'HIRE',
  UPGRADE_MINION = 'UPGRADE_MINION',
  CRAFT = 'CRAFT',
  EAT_SPECIAL = 'EAT_SPECIAL',
  CONSUME_ORGAN = 'CONSUME_ORGAN',
  LEVEL_UP = 'LEVEL_UP'
}

export interface LogEntry {
  id: string;
  text: string;
  type: ActionType;
  timestamp: number;
}

export interface Upgrade {
  id: string;
  name: string;
  description: string;
  cost: number;
  effect: (state: GameState) => Partial<GameState>;
  purchased: boolean;
}

export interface Minion {
  id: string;
  name: string;
  role: 'HUNTER' | 'CHEF' | 'FEEDER' | 'LEECH';
  cost: number;
  rate: number; // Operations per second
  description: string;
}

export interface MinionState {
    count: number;
    xp: number;
    level: number;
}

export interface CraftableItem {
  id: string;
  name: string;
  ingredients: Record<string, number>; // 'rawMeat' or organId -> quantity
  description: string;
  effectType: 'HEAL' | 'BUFF_HUNT' | 'BUFF_MAX_HP' | 'COIN_WIND';
  effectValue: number;
  flavor: string;
}

export interface Organ {
  id: string;
  name: string;
  description: string;
  chance: number; // 0.0 to 1.0 drop rate per kill
  effectType: 'HEAL' | 'BUFF_HUNT' | 'BUFF_MAX_HP' | 'COINS';
  effectValue: number;
}

export interface GameState {
  hp: number;
  maxHp: number;
  coins: number;
  rawMeat: number;
  meals: number;
  huntChance: number; // 0.0 to 1.0
  meatYield: number;
  coinMultiplier: number;
  lastRewardTime: number;
  inventory: string[]; // For unlocked items visual
  minions: Record<string, MinionState>; // Minion ID -> State Object
  pantry: Record<string, number>; // Crafted Item ID -> Count
  organs: Record<string, number>; // Organ ID -> Count
  elements?: Record<string, number>;
}

export interface Element {
    id: string;
    name: string;
    description: string;
}

export const INITIAL_STATE: GameState = {
  hp: 100,
  maxHp: 100,
  coins: 0,
  rawMeat: 0,
  meals: 0,
  huntChance: 0.6,
  meatYield: 1,
  coinMultiplier: 1.0,
  lastRewardTime: Date.now(),
  inventory: [],
  minions: {},
  pantry: {},
  organs: {},
  elements: {}
};
