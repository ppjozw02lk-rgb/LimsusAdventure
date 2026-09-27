// Enemy Champions and Skill Database for Limsus Adventure
// Defines character models, battle music themes, skills, and stats

export const ENEMIES = [
  {
    id: 'npc-top',
    name: 'Ronin Kai',
    title: 'North Pass Guardian',
    x: 664,
    y: 212,
    radius: 40,
    hp: 250,
    maxHp: 250,
    level: 25,
    spriteType: 'ronin',
    modelImage: './assets/fcbfb356-878c-4e42-8d25-935fdc930e82.jfif',
    themeMusic: './Mili - Through Patches of Violet [Limbus Company].mp3',
    themeTitle: 'Through Patches of Violet (Mili)',
    skills: ['coffin_throw', 'sword_swing', 'rushing'],
    color: '#8b5cf6',
    defeated: false,
    dialogue: 'Halt! Only those who can endure my coffin and blade may traverse the north pass!'
  },
  {
    id: 'npc-right',
    name: 'Brawler Ignis',
    title: 'Middle Finger Enforcer',
    x: 970,
    y: 604,
    radius: 40,
    hp: 260,
    maxHp: 260,
    level: 26,
    spriteType: 'brawler',
    modelImage: './assets/brawler.jfif',
    themeMusic: './Limbus Company Middle Finger Toujou.mp3',
    themeTitle: 'Middle Finger Toujou (Limbus Company)',
    skills: ['punch', 'kick', 'flame_burst'],
    color: '#f97316',
    defeated: false,
    dialogue: 'The Middle Finger never forgives a debt! Feel the burning fury of my molten knuckles!'
  },
  {
    id: 'npc-left',
    name: 'The Red Mist',
    title: 'Legendary Color Fixer | Kali',
    x: 320,
    y: 604,
    radius: 40,
    hp: 300,
    maxHp: 300,
    level: 30,
    spriteType: 'redmist',
    modelImage: './assets/redmist.jfif',
    themeMusic: './Library of Ruina - Red Mist Cover - Skelraiser.mp3',
    themeTitle: 'Red Mist (Library of Ruina)',
    skills: ['slash', 'level_slash', 'rush_slash', 'slay'],
    color: '#ef4444',
    defeated: false,
    dialogue: 'You seek a clash with the Red Mist? Let us see if your spirit survives a single cut.'
  }
];

export const SKILL_DATA = {
  // Brawler buffed original skills + new flame burst:
  punch: {
    id: 'punch',
    name: 'Brawler Punch',
    coins: 5,
    dmg: 10, // Buffed slightly from 5 to 10
    basePower: 3,
    tag: 'Strike',
    desc: 'Heavy mechanical fist strike. Rolls 5 coins to clash.',
    icon: '👊',
    color: '#ea580c'
  },
  kick: {
    id: 'kick',
    name: 'Brawler Kick',
    coins: 7,
    dmg: 15, // Buffed slightly from 10 to 15
    basePower: 4,
    tag: 'Heavy',
    desc: 'Devastating high-torque kick. Rolls 7 coins to clash.',
    icon: '🦵',
    color: '#f97316'
  },
  flame_burst: {
    id: 'flame_burst',
    name: 'Flame Burst',
    coins: 10,
    dmg: 20,
    basePower: 4,
    tag: 'Blaze',
    price: 35,
    desc: 'Molten flame eruption scorches the target. Rolls 10 coins, deals 20 DMG.',
    icon: '🔥',
    color: '#ef4444'
  },

  // Ronin Kai skills:
  coffin_throw: {
    id: 'coffin_throw',
    name: 'Coffin Throw',
    coins: 8,
    dmg: 20,
    basePower: 4,
    tag: 'Impact',
    price: 35,
    desc: 'Hurls an ominous heavy coffin with immense momentum. Rolls 8 coins, deals 20 DMG.',
    icon: '⚰️',
    color: '#a855f7'
  },
  sword_swing: {
    id: 'sword_swing',
    name: 'Sword Swing',
    coins: 10,
    dmg: 15,
    basePower: 4,
    tag: 'Slash',
    price: 30,
    desc: 'Swift sweeping katana slash cleaving through armor. Rolls 10 coins, deals 15 DMG.',
    icon: '⚔️',
    color: '#8b5cf6'
  },
  rushing: {
    id: 'rushing',
    name: 'Rushing',
    coins: 5,
    dmg: 10,
    basePower: 3,
    tag: 'Dash',
    price: 25,
    desc: 'Supersonic blitz thrust overwhelming enemy defenses. Rolls 5 coins, deals 10 DMG.',
    icon: '💨',
    color: '#06b6d4'
  },

  // Red Mist skills:
  slash: {
    id: 'slash',
    name: 'Slash',
    coins: 15,
    dmg: 10,
    basePower: 4,
    tag: 'Slash',
    price: 40,
    desc: 'Relentless barrage of blade cuts. Rolls an astounding 15 coins, deals 10 DMG.',
    icon: '🗡️',
    color: '#f43f5e'
  },
  level_slash: {
    id: 'level_slash',
    name: 'Level Slash',
    coins: 5,
    dmg: 20,
    basePower: 4,
    tag: 'Heavy Slash',
    price: 45,
    desc: 'A horizontal cleave with earth-splitting force. Rolls 5 coins, deals 20 DMG.',
    icon: '⚡',
    color: '#dc2626'
  },
  rush_slash: {
    id: 'rush_slash',
    name: 'Rush Slash',
    coins: 5,
    dmg: 20,
    basePower: 4,
    tag: 'Pierce',
    price: 45,
    desc: 'Charging forward with an unstoppable spear-like lunge. Rolls 5 coins, deals 20 DMG.',
    icon: '💥',
    color: '#e11d48'
  },
  slay: {
    id: 'slay',
    name: 'Slay',
    coins: 5,
    dmg: 20,
    basePower: 5,
    tag: 'Execution',
    price: 50,
    desc: 'The merciless execution cut of the Red Mist. Rolls 5 coins, deals 20 DMG.',
    icon: '🩸',
    color: '#991b1b'
  },

  // Additional player / shop skill:
  charge: {
    id: 'charge',
    name: 'Charge',
    coins: 10,
    dmg: 20,
    basePower: 4,
    tag: 'Plasma',
    price: 20,
    desc: 'High-density plasma burst. Rolls 10 coins, deals 20 DMG.',
    icon: '⚡',
    color: '#38bdf8'
  }
};
