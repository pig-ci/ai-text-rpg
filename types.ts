export type WorldView = 'cyberpunk_mythology' | 'steampunk_horror' | 'post_apocalyptic_fantasy';

export interface EnemyAbility {
  id: 'SHIELD' | 'POISON' | 'POWER_DRAIN' | 'WEAKEN' | 'REGENERATE' | 'EMP';
  name: string;
  description: string;
}

export interface CombatEncounter {
  enemyName: string;
  enemyPower: number;
  enemyHp: number;
  enemyMaxHp: number;
  abilities?: EnemyAbility[];
}

export type EquipmentType = 'weapon' | 'armor' | 'accessory';

export interface Equipment {
  id: string;
  name: string;
  description: string;
  type: EquipmentType;
  worldView: WorldView;
  powerBonus?: number;
  grantedSkill?: Skill;
}

export interface StorySegment {
  situation: string;
  choices: string[];
  isEnd?: boolean;
  combatEncounter?: Omit<CombatEncounter, 'enemyHp' | 'enemyMaxHp'>;
  reward?: {
    equipment?: Equipment;
    power?: number;
  };
}

export interface Skill {
  id: string;
  name: string;
  description: string;
}

export interface Character {
  name: string;
  class: string;
  backstory: string;
  worldView: WorldView;
  power: number;
  hp: number;
  maxHp: number;
  skills: Skill[];
  equipment: {
    weapon: Equipment | null;
    armor: Equipment | null;
    accessory: Equipment | null;
  };
}

export interface CharacterTemplate extends Omit<Character, 'worldView' | 'equipment' | 'hp' | 'maxHp'> {
  id: string;
}

export interface SaveData {
  id: string;
  timestamp: number;
  character: Character;
  story: string[];
  choices: string[];
  isEnd: boolean;
  saveType: 'auto' | 'manual';
}

export interface Achievement {
  id: string;
  name: string;
  description: string;
}

export interface BackupData {
  saves: SaveData[];
  templates: CharacterTemplate[];
  unlockedAchievements?: string[];
}

export interface RandomEvent {
  description:string;
  powerEffect: number;
}

export type SynergyBonus =
  | { type: 'POWER_BONUS'; value: number }
  | { type: 'DAMAGE_MODIFIER'; value: number } // e.g., 1.2 for +20%
  | { type: 'INCOMING_DAMAGE_MODIFIER'; value: number } // e.g., 0.8 for -20%
  | { type: 'HP_REGEN_PER_TURN'; value: number };

export interface Synergy {
  id: string;
  name: string;
  description: string;
  requiredSkillIds: string[];
  bonus: SynergyBonus;
}