
import { Upgrade, GameState, Minion, CraftableItem, Organ, Element } from './types';
import React from 'react';

export const REWARD_INTERVAL = 10 * 60 * 1000; // 10 minutes
export const HP_REGEN_ON_EAT = 15;
export const COINS_PER_MEAL = 25;
export const DAMAGE_ON_FAIL = 15;
export const COIN_REWARD = 100;

export const ICONS = {
    MEAT: (
        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 inline-block text-red-500" viewBox="0 0 24 24" fill="currentColor">
            <path d="M19.07 4.93L17.07 3.07C16.68 2.68 16.05 2.68 15.66 3.07L11.76 6.97C11.37 7.36 11.37 7.99 11.76 8.38L12.07 8.69L6.12 14.64L3.5 12.02C3.11 11.63 2.48 11.63 2.09 12.02L1.38 12.73C0.99 13.12 0.99 13.75 1.38 14.14L7.33 20.09C7.72 20.48 8.35 20.48 8.74 20.09L9.45 19.38C9.84 18.99 9.84 18.36 9.45 17.97L6.83 15.35L12.78 9.4L13.09 9.71C13.48 10.1 14.11 10.1 14.5 9.71L18.4 5.81C18.79 5.42 18.79 4.79 18.4 4.4L19.07 4.93Z" />
        </svg>
    ),
    COIN: (
        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 inline-block text-yellow-400" viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 2C6.48 2 2 6.48 2 12C2 17.52 6.48 22 12 22C17.52 22 22 17.52 22 12C22 6.48 17.52 2 12 2ZM13 17H11V15H13V17ZM13 13H11V7H13V13Z" />
            <circle cx="12" cy="12" r="8" fill="gold" />
            <text x="12" y="16" textAnchor="middle" fill="black" fontSize="12" fontWeight="bold">$</text>
        </svg>
    ),
    MEAL: (
        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 inline-block text-orange-500" viewBox="0 0 24 24" fill="currentColor">
             <path d="M11 9H9V2H7v7H5V2H3v7c0 2.12 1.66 3.84 3.75 3.97V22h2.5v-9.03C11.34 12.84 13 11.12 13 9V2h-2v7zm5-3v8h2.5v8H21V2c-2.76 0-5 2.24-5 4z"/>
        </svg>
    ),
    HP: (
        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 inline-block text-green-500" viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/>
        </svg>
    ),
    CRAFT: (
         <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 inline-block text-purple-400" viewBox="0 0 24 24" fill="currentColor">
            <path d="M21.9 8.89l-1.05-4.37c-.22-.9-1-1.52-1.91-1.52H5.05c-.9 0-1.69.63-1.9 1.52L2.1 8.89c-.24 1.02-.02 2.14.76 3.07C3.12 12.33 3.56 12.5 4 12.5c.34 0 .68-.07 1-.21V19c0 1.1.9 2 2 2h10c1.1 0 2-.9 2-2v-6.71c.32.14.66.21 1 .21.44 0 .88-.17 1.13-.54.79-.93 1.01-2.05.77-3.07zM17 19H7v-7.15l1.69.68c.75.3 1.62.1 2.21-.55L12 10.8l1.1 1.18c.59.64 1.46.85 2.21.55L17 11.85V19z"/>
        </svg>
    ),
    ORGAN: (
        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 inline-block text-pink-500" viewBox="0 0 24 24" fill="currentColor">
            <path d="M12,2C12,2 4,6 4,11C4,15 8,22 12,22C16,22 20,15 20,11C20,6 12,2 12,2M12,5C12.83,5 13.5,5.67 13.5,6.5C13.5,7.33 12.83,8 12,8C11.17,8 10.5,7.33 10.5,6.5C10.5,5.67 11.17,5 12,5M10.5,10.5C10.5,9.67 11.17,9 12,9C12.83,9 13.5,9.67 13.5,10.5C13.5,11.33 12.83,12 12,12C11.17,12 10.5,11.33 10.5,10.5Z" />
        </svg>
    )
};

// --- PROCEDURAL MONSTER GENERATION ---

const M_PREFIXES = [
    "Feral", "Rabid", "Unhinged", "Gourmet", "Salty", "Greasy", "Rotten", "Ancient", "Radioactive", 
    "Cursed", "Demonic", "Mutant", "Slimy", "Hairy", "Bald", "Screaming", "Silent", "Dancing", 
    "Drunken", "Stinky", "Spicy", "Crispy", "Frozen", "Burning", "Void", "Cosmic", "Glitchy", 
    "Upside-down", "Tiny", "Giant", "Fat", "Skinny", "Ugly", "Pretty", "Deadly", "Friendly"
];

const M_NAMES = [
    "Glarb", "Mork", "Ziltoid", "Bob 2", "Kevin", "Susan", "Chomp", "Gnash", "Slurp", "Drool", 
    "Fist", "Claw", "Tooth", "Gut", "Belly", "Nose", "Ear", "Eye", "Brain", "Foot", "Toe", 
    "Hand", "Arm", "Leg", "Knee", "Elbow", "Neck", "Spine", "Rib", "Skull", "Bone", "Blood"
];

const M_TITLES = [
    "the Devourer", "the Cook", "the Butcher", "the Hunter", "the Slicer", "the Dicer", "the Masher", 
    "the Basher", "the Crusher", "the Smusher", "the Squasher", "the Splasher", "the Trasher", 
    "the Washer", "the Cleaner", "the Eater", "the Chewer", "the Swallower", "the Biter", 
    "the Licker", "the Sniffer", "the Smeller", "the Taster", "the Toucher", "the Feeler"
];

const M_DESCRIPTIONS = [
    "Has too many teeth.", "Smells like old socks.", "Drools constantly.", "Loves the taste of fear.", 
    "Cooks with passion and rage.", "Hunts with a rusty spoon.", "Is actually just three raccoons in a trench coat.", 
    "Wants to be a dentist.", "Is afraid of the dark.", "Glows in the dark.", " Vibrates intensely.", 
    "Speaks in math.", "Only eats left hands.", "Hates mondays.", "Loves lasagna.", "Is a verified influencer.", 
    "Has a PhD in pain.", "Was once a hamster.", "Is made of jelly.", "Is on fire."
];

// Feeders Specifics
const F_TITLES = ["the Spoon", "the Feeder", "the Nurse", "the Stuffer", "the Glutton", "the Mama"];
const F_DESCRIPTIONS = [
    "Here comes the airplane!", "Force feeds with love.", "Hates empty stomachs.", "Uses a shovel to feed.",
    "Whispers 'eat more' constantly.", "Has a baby bib.", "Carries a massive ladle."
];

const L_TITLES = ["the Leech", "the Sucker", "the Parasite", "the Tick", "the Mosquito", "the Drain"];
const L_DESCRIPTIONS = [
    "Sucks.", "Very clingy.", "Hungry for red stuff.", "Leaves a mark.", "Don't let it touch you.", "Squishy."
];

const generateMinions = (count: number): Minion[] => {
    const minions: Minion[] = [];
    const baseCost = 50;

    for (let i = 0; i < count; i++) {
        // Scaling
        const tier = Math.floor(i / 10);
        const cost = Math.floor(baseCost * Math.pow(1.15, i));
        
        // Random attributes
        const role: 'HUNTER' | 'CHEF' = Math.random() < 0.6 ? 'HUNTER' : 'CHEF'; // 60% Hunters
        const prefix = M_PREFIXES[Math.floor(Math.random() * M_PREFIXES.length)];
        const name = M_NAMES[Math.floor(Math.random() * M_NAMES.length)];
        const title = M_TITLES[Math.floor(Math.random() * M_TITLES.length)];
        const desc = M_DESCRIPTIONS[Math.floor(Math.random() * M_DESCRIPTIONS.length)];
        
        const fullName = `${prefix} ${name} ${title}`;
        
        // Rate scaling
        let rate = 0;
        if (role === 'HUNTER') {
            rate = 0.1 + (i * 0.05) + (Math.random() * 0.1);
        } else {
            rate = 0.05 + (i * 0.03) + (Math.random() * 0.05);
        }

        minions.push({
            id: `minion_${i}_${name.toLowerCase()}`,
            name: fullName,
            role,
            cost,
            rate: parseFloat(rate.toFixed(2)),
            description: desc
        });
    }

    return minions;
};

const generateFeeders = (count: number): Minion[] => {
    const feeders: Minion[] = [];
    const baseCost = 250; // Feeders are slightly more expensive starter

    for (let i = 0; i < count; i++) {
        const cost = Math.floor(baseCost * Math.pow(1.15, i));
        const prefix = M_PREFIXES[Math.floor(Math.random() * M_PREFIXES.length)];
        const name = M_NAMES[Math.floor(Math.random() * M_NAMES.length)];
        const title = F_TITLES[Math.floor(Math.random() * F_TITLES.length)];
        const desc = F_DESCRIPTIONS[Math.floor(Math.random() * F_DESCRIPTIONS.length)];
        
        const fullName = `${prefix} ${name} ${title}`;
        const rate = 0.05 + (i * 0.04) + (Math.random() * 0.05);

        feeders.push({
            id: `feeder_${i}_${name.toLowerCase()}`,
            name: fullName,
            role: 'FEEDER',
            cost,
            rate: parseFloat(rate.toFixed(2)),
            description: desc
        });
    }
    return feeders;
};

const generateLeeches = (count: number): Minion[] => {
    const leeches: Minion[] = [];
    const baseCost = 150; 

    for (let i = 0; i < count; i++) {
        const cost = Math.floor(baseCost * Math.pow(1.15, i));
        const prefix = M_PREFIXES[Math.floor(Math.random() * M_PREFIXES.length)];
        const name = M_NAMES[Math.floor(Math.random() * M_NAMES.length)];
        const title = L_TITLES[Math.floor(Math.random() * L_TITLES.length)];
        const desc = L_DESCRIPTIONS[Math.floor(Math.random() * L_DESCRIPTIONS.length)];
        
        const fullName = `${prefix} ${name} ${title}`;
        // Healing rate
        const rate = 1 + (i * 0.5) + (Math.random() * 1);

        leeches.push({
            id: `leech_${i}_${name.toLowerCase()}`,
            name: fullName,
            role: 'LEECH',
            cost,
            rate: parseFloat(rate.toFixed(2)),
            description: desc
        });
    }
    return leeches;
}

// Generate 700 minions and 100 feeders and 50 leeches
export const MINIONS: Minion[] = [...generateMinions(700), ...generateFeeders(100), ...generateLeeches(50)];


// --- ELEMENTS ---
export const ELEMENTS: Element[] = [
    { id: 'gold', name: 'Gold', description: 'Shiny and heavy.' },
    { id: 'iron', name: 'Iron', description: 'Magnetic metal.' },
    { id: 'copper', name: 'Copper', description: 'Conducts weird energy.' },
    { id: 'rust', name: 'Rust', description: 'Flaky red dust.' },
    { id: 'platinum', name: 'Platinum', description: 'Expensive metal.' },
    { id: 'kylamonias', name: 'Kylamonias', description: 'A glowing, vibrating isotope.' }
];

// --- ORGANS ---
export const ORGANS: Organ[] = [
    { id: 'eyeball', name: 'Eyeball', chance: 0.25, description: "It stares back.", effectType: 'HEAL', effectValue: 10 },
    { id: 'lung', name: 'Lung', chance: 0.15, description: "Still breathing.", effectType: 'HEAL', effectValue: 30 },
    { id: 'kidney', name: 'Kidney', chance: 0.12, description: "A healthy snack.", effectType: 'COINS', effectValue: 50 },
    { id: 'liver', name: 'Liver', chance: 0.08, description: "Full of vitamins.", effectType: 'COINS', effectValue: 150 },
    { id: 'heart', name: 'Heart', chance: 0.04, description: "Thump. Thump.", effectType: 'BUFF_MAX_HP', effectValue: 2 },
    { id: 'brain', name: 'Brain', chance: 0.01, description: "Knowledge is power.", effectType: 'BUFF_HUNT', effectValue: 0.01 },
];

// --- CRAFTING RECIPES (WEIRD) ---
export const CRAFTABLES: CraftableItem[] = [
    { 
        id: 'meat_brick', 
        name: 'Meat Brick', 
        ingredients: { rawMeat: 25 },
        description: "It's just compressed meat. Very dense. Heals 50 HP.", 
        effectType: 'HEAL', 
        effectValue: 50,
        flavor: "Heavy."
    },
    { 
        id: 'seeing_eye_soup', 
        name: 'Seeing Eye Soup', 
        ingredients: { meals: 2, eyeball: 4 },
        description: "The soup watches you eat it. +5% Hunt Chance.", 
        effectType: 'BUFF_HUNT', 
        effectValue: 0.05,
        flavor: "Blink. Blink."
    },
    { 
        id: 'iron_gut_shake', 
        name: 'Iron Gut Shake', 
        ingredients: { rawMeat: 50, iron: 1 },
        description: "Hardens your insides. +50 Max HP.", 
        effectType: 'BUFF_MAX_HP', 
        effectValue: 50,
        flavor: "Tastes like pennies."
    },
    { 
        id: 'golden_nugget', 
        name: 'Golden Nugget', 
        ingredients: { gold: 1 },
        description: "It's pure gold. Worth 5000 Coins.", 
        effectType: 'COIN_WIND', 
        effectValue: 5000,
        flavor: "We're rich!"
    },
    { 
        id: 'the_abomination', 
        name: 'The Abomination', 
        ingredients: { heart: 1, lung: 1, brain: 1, liver: 1 },
        description: "Why did you make this? +200 Max HP.", 
        effectType: 'BUFF_MAX_HP', 
        effectValue: 200,
        flavor: "It's alive..."
    },
    { 
        id: 'golden_liver', 
        name: 'Golden Liver', 
        ingredients: { liver: 1, gold: 1 },
        description: "Rich food. Instant 1500 Coins.", 
        effectType: 'COIN_WIND', 
        effectValue: 1500,
        flavor: "Metallic aftertaste."
    }
];

// --- UPGRADE GENERATION ---

const ADJECTIVES = [
    "Rusty", "Slimy", "Cursed", "Moldy", "Sharp", "Spiky", "Golden", "Ancient", "Radioactive", "Demonic", 
    "Soggy", "Greasy", "Wobbling", "Forbidden", "Haunted", "Vibrating", "Invisible", "Heavy", "Sentient", 
    "Screaming", "Sticky", "Frozen", "Burning", "Toxic", "Void", "Cosmic", "Unholy", "Divine", "Glitched"
];

const HUNT_NOUNS = ["Net", "Trap", "Lure", "Hook", "Sneakers", "Camo", "Drone", "Pit", "Tranquilizer", "Lasso", "Sack", "Glove", "Radar", "Whistle", "Bait", "Cage"];
const MEAT_NOUNS = ["Spork", "Cleaver", "Grinder", "Slicer", "Tenderizer", "Knife", "Chainsaw", "Blender", "Axe", "Saw", "Machete", "Scissors", "Scalpel", "Dagger"];
const HP_NOUNS = ["Stomach", "Vitamin", "Pill", "Armor", "Helmet", "Shield", "Skin", "Heart", "Liver", "Bandage", "Elixir", "Tonic", "Mutagen", "DNA"];
const COIN_NOUNS = ["Spice", "Sauce", "Salt", "Pepper", "Plate", "Napkin", "Bib", "Table", "Menu", "Wallet", "Bank", "Investment", "Contract", "Logo"];

const createUpgrade = (
  id: string,
  name: string,
  description: string,
  cost: number,
  effectType: 'MEAT' | 'HUNT' | 'HP' | 'COIN',
  value: number
): Upgrade => {
  return {
    id,
    name,
    description,
    cost: Math.floor(cost),
    purchased: false,
    effect: (state: GameState) => {
      switch (effectType) {
        case 'MEAT': return { meatYield: state.meatYield + value };
        case 'HUNT': return { huntChance: Math.min(1.0, state.huntChance + value) };
        case 'HP': return { maxHp: state.maxHp + value, hp: state.hp + value }; // Heal on buy maxHP increase
        case 'COIN': return { coinMultiplier: state.coinMultiplier + value };
        default: return {};
      }
    }
  };
};

const generateUpgrades = (): Upgrade[] => {
    const upgrades: Upgrade[] = [];
    
    // Core Starter Upgrades (Manual)
    upgrades.push(createUpgrade('starter_spork', 'Rusty Spork', '+1 Meat per hunt.', 50, 'MEAT', 1));
    upgrades.push(createUpgrade('starter_shoes', 'Sneaky Shoes', '+15% Hunt Chance.', 150, 'HUNT', 0.15));
    upgrades.push(createUpgrade('starter_stomach', 'Iron Stomach', '+50 Max HP.', 300, 'HP', 50));
    upgrades.push(createUpgrade('starter_pot', 'Fancy Cauldron', '+100% Coin Value.', 1000, 'COIN', 1.0));

    // Procedural Generation for 100 items
    // We will generate 25 of each category with increasing costs
    
    const countPerType = 25;
    let baseCost = 200;

    for (let i = 0; i < countPerType; i++) {
        // Scaling factors
        const tier = Math.floor(i / 5); // 0 to 4
        const costMultiplier = Math.pow(1.3, i);
        
        // 1. Meat Upgrades
        const meatVal = 1 + Math.floor(i / 3);
        const meatName = `${ADJECTIVES[i % ADJECTIVES.length]} ${MEAT_NOUNS[i % MEAT_NOUNS.length]}`;
        upgrades.push(createUpgrade(`gen_meat_${i}`, meatName, `+${meatVal} Meat per hunt.`, baseCost * costMultiplier * 1.5, 'MEAT', meatVal));

        // 2. Hunt Upgrades
        const huntVal = 0.01 + (i * 0.002);
        const huntName = `${ADJECTIVES[(i + 5) % ADJECTIVES.length]} ${HUNT_NOUNS[i % HUNT_NOUNS.length]}`;
        upgrades.push(createUpgrade(`gen_hunt_${i}`, huntName, `+${(huntVal * 100).toFixed(1)}% Hunt Chance.`, baseCost * costMultiplier * 1.2, 'HUNT', huntVal));

        // 3. HP Upgrades
        const hpVal = 20 + (i * 10);
        const hpName = `${ADJECTIVES[(i + 10) % ADJECTIVES.length]} ${HP_NOUNS[i % HP_NOUNS.length]}`;
        upgrades.push(createUpgrade(`gen_hp_${i}`, hpName, `+${hpVal} Max HP.`, baseCost * costMultiplier * 0.8, 'HP', hpVal));

        // 4. Coin Upgrades
        const coinVal = 0.1 + (i * 0.05);
        const coinName = `${ADJECTIVES[(i + 15) % ADJECTIVES.length]} ${COIN_NOUNS[i % COIN_NOUNS.length]}`;
        upgrades.push(createUpgrade(`gen_coin_${i}`, coinName, `+${(coinVal * 100).toFixed(0)}% Coin Value.`, baseCost * costMultiplier * 2.0, 'COIN', coinVal));
    }

    return upgrades.sort((a, b) => a.cost - b.cost);
};

export const UPGRADES: Upgrade[] = generateUpgrades();

export const getMinionUpgradeCost = (role: string, level: number): number => {
    // Base cost depends on role power
    let base = 100;
    if (role === 'CHEF') base = 80;
    if (role === 'FEEDER') base = 250;
    if (role === 'LEECH') base = 300;

    // Exponential scaling based on current level
    return Math.floor(base * Math.pow(1.6, level));
};
