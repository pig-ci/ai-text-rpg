import { Synergy } from '../types';

export const allSynergies: Synergy[] = [
  {
    id: 'SYS_CRASH',
    name: '系統崩潰',
    description: '你的數據攻擊變得極具破壞力。',
    requiredSkillIds: ['DATA_SPIKE', 'OVERCLOCK'],
    bonus: { type: 'DAMAGE_MODIFIER', value: 1.3 }, // 增加 30% 傷害
  },
  {
    id: 'IMPROV_FORTRESS',
    name: '臨時堡壘',
    description: '你將各種防禦技巧結合，大幅提升了生存能力。',
    requiredSkillIds: ['DEFENSIVE_STANCE', 'SCRAP_ARMOR'],
    bonus: { type: 'INCOMING_DAMAGE_MODIFIER', value: 0.75 }, // 減免 25% 傷害
  },
  {
    id: 'BERSERKER_FURY',
    name: '狂戰士之怒',
    description: '化學藥劑與原始的憤怒結合，讓你化身為純粹的毀滅力量。',
    requiredSkillIds: ['RADIOACTIVE_RAGE', 'ADRENALINE_RUSH'],
    bonus: { type: 'POWER_BONUS', value: 5 },
  },
  {
    id: 'TACTICAL_SUPERIORITY',
    name: '戰術優勢',
    description: '精準的分析與致命的射擊讓你主宰戰場。',
    requiredSkillIds: ['SNIPER_SHOT', 'ANALYSIS_WEAKNESS'],
    bonus: { type: 'DAMAGE_MODIFIER', value: 1.25 }, // 增加 25% 傷害
  },
  {
    id: 'UNBREAKABLE_WILL',
    name: '不屈意志',
    description: '頑強的生存本能與堅固的機體讓你能夠在戰鬥中持續恢復。',
    requiredSkillIds: ['SURVIVAL_INSTINCT', 'REINFORCED_CHASSIS'],
    bonus: { type: 'HP_REGEN_PER_TURN', value: 4 },
  },
  {
    id: 'HOLY_INFERNO',
    name: '聖潔煉獄',
    description: '神聖的審判與淨化的火焰結合，焚燒一切不潔之物。',
    requiredSkillIds: ['JUDGEMENT_GEAR', 'PURIFYING_FLAME'],
    bonus: { type: 'POWER_BONUS', value: 3 },
  },
];
