
import { ActionType } from "../types";

// Local flavor text database to replace AI generation
const FLAVOR_TEXTS: Record<string, string[]> = {
  [ActionType.HUNT]: [
    "Bob snagged one with his weird grabbers!",
    "Gotcha! Another one for the pantry.",
    "A swift capture. Bob is pleased.",
    "Bob's hunting skills are unmatched... mostly.",
    "Into the sack you go!",
    "Bob lurked, Bob pounced, Bob won."
  ],
  [ActionType.FAIL_HUNT]: [
    "Ouch! That one bit back!",
    "Bob tripped over his own feet.",
    "The prey escaped. Bob is sad.",
    "A humiliating defeat.",
    "Bob got slapped. It hurts.",
    "Mission failed. Bob returns empty handed."
  ],
  [ActionType.COOK]: [
    "Something bubbles ominously in the pot...",
    "Smells like... victory?",
    "Bob adds a dash of mystery spice.",
    "The stew thickens beautifully.",
    "Cooking up a storm!",
    "A weird aroma fills the air."
  ],
  [ActionType.EAT]: [
    "Burp. Delicious.",
    "Bob feels rejuvinated.",
    "Yum! Tastes like chicken.",
    "Crunchy and satisfying.",
    "Bob licks his lips.",
    "Gulp. Gone."
  ],
  [ActionType.UNLOCK]: [
    "Bob is happy with his new toy!",
    "Upgrade acquired! Bob feels stronger.",
    "Shiny new gear for Bob.",
    "Look at that bling!",
    "Money well spent.",
    "Power overwhelming!"
  ],
  [ActionType.CRAFT]: [
    "Bob mashes the meat together.",
    "A culinary masterpiece is born.",
    "Squish, squash, craft.",
    "Bob made a thing!",
    "It looks edible enough.",
    "Butchery at its finest."
  ],
  [ActionType.EAT_SPECIAL]: [
    "Tastes... powerful.",
    "Magic tingles in Bob's stomach.",
    "A surge of weird energy!",
    "Special snack consumed.",
    "Bob feels weirdly good.",
    "Strange texture, great effect."
  ],
  [ActionType.CONSUME_ORGAN]: [
    "Squelch. Gulp.",
    "Slurped right down.",
    "Disgusting, but nutritious.",
    "Bob loves organ meat.",
    "Raw power... literally.",
    "Slimy, yet satisfying."
  ],
  [ActionType.LEVEL_UP]: [
    "The horde grows stronger...",
    "Evolution at work. Scarry.",
    "They are learning.",
    "Power radiates from the basement.",
    "A minion has ascended.",
    "Bob's army is improving."
  ],
  [ActionType.UPGRADE_MINION]: [
    "Bob sent them to weird school.",
    "Forced evolution. Effective.",
    "Training complete. Muscles bigger.",
    "They look smarter now. Maybe.",
    "A promotion! They work harder.",
    "Paid for better performance."
  ],
  // Fallback
  "DEFAULT": [
    "Bob did a thing.",
    "Something happened.",
    "Bob stares blankly.",
    "Activity complete."
  ]
};

export const generateFlavorText = async (action: ActionType, context?: string): Promise<string> => {
    // Simulate async to keep interface compatible with App.tsx
    return new Promise((resolve) => {
        const templates = FLAVOR_TEXTS[action] || FLAVOR_TEXTS["DEFAULT"];
        const template = templates[Math.floor(Math.random() * templates.length)];
        
        let result = template;
        
        // Simple context interpolation
        if (context) {
            if (action === ActionType.UNLOCK) {
                result = `Bob bought ${context}. ${template}`;
            } else if (action === ActionType.CRAFT) {
                result = `Bob crafted ${context}. ${template}`;
            } else if (action === ActionType.EAT_SPECIAL || action === ActionType.CONSUME_ORGAN) {
                result = `Bob ate ${context}. ${template}`;
            } else if (action === ActionType.LEVEL_UP) {
                result = `${context} ${template}`;
            } else if (action === ActionType.UPGRADE_MINION) {
                result = `${context} upgraded! ${template}`;
            } else {
                result = `${template} (${context})`;
            }
        }
        
        resolve(result);
    });
};
