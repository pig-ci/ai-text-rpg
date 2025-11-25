import { Skill } from '../types';

export const allSkills: { [key: string]: Skill } = {
  // 生化武士
  STRONG_STRIKE: { id: 'STRONG_STRIKE', name: '強力斬擊', description: '消耗少量體力，進行一次威力更強的攻擊。' },
  DEFENSIVE_STANCE: { id: 'DEFENSIVE_STANCE', name: '防禦姿態', description: '採取防禦姿態，減免下一次受到的傷害，但攻擊力會稍微降低。' },
  ADRENALINE_RUSH: { id: 'ADRENALINE_RUSH', name: '腎上腺素', description: '激發體內的戰鬥藥劑，短時間內大幅提升戰力。' },

  // 數據巫師
  FIREWALL_BLAST: { id: 'FIREWALL_BLAST', name: '防火牆衝擊', description: '釋放一道數據衝擊波，對敵人造成傷害並有機會使其短路。' },
  ENCRYPTION_SHIELD: { id: 'ENCRYPTION_SHIELD', name: '加密護盾', description: '編織一層數據護盾，抵擋敵人的攻擊。' },
  OVERCLOCK: { id: 'OVERCLOCK', name: '超頻運算', description: '將處理器超載，極大地增強下一次攻擊的威力，但有微小風險造成自身系統過熱。' },
    
  // 暗影駭客
  DATA_SPIKE: { id: 'DATA_SPIKE', name: '數據尖刺', description: '將惡意代碼注入敵人系統，直接造成傷害並削弱其戰力。' },
  EVASIVE_MANEUVER: { id: 'EVASIVE_MANEUVER', name: '閃避機動', description: '利用環境和幻象，大幅提高閃避攻擊的機率。' },
  GHOST_PROTOCOL: { id: 'GHOST_PROTOCOL', name: '幽靈協議', description: '短暫從敵人感測器中消失，準備一次出其不意的突襲。' },

  // 廢土遊俠
  SNIPER_SHOT: { id: 'SNIPER_SHOT', name: '精準射擊', description: '花費時間瞄準，對敵人弱點進行一次高傷害的攻擊。' },
  TRAP: { id: 'TRAP', name: '設置陷阱', description: '在戰場佈置一個陷阱，如果敵人觸發，將會受到傷害並被牽制。' },
  SURVIVAL_INSTINCT: { id: 'SURVIVAL_INSTINCT', name: '生存本能', description: '依靠廢土的生存經驗，找到敵人的破綻，提升自己的戰鬥效率。' },

  // 機造僧侶
  SYSTEM_SHOCK_PALM: { id: 'SYSTEM_SHOCK_PALM', name: '系統震盪掌', description: '將電磁脈衝注入敵人體內，造成傷害並有機會使其暫時癱瘓。' },
  REINFORCED_CHASSIS: { id: 'REINFORCED_CHASSIS', name: '強化骨架', description: '硬化自身機體，大幅提升防禦力。' },
  ENERGY_CYCLE: { id: 'ENERGY_CYCLE', name: '能量循環', description: '將受到的部分傷害轉化為自身能量，略微恢復戰力。' },

  // 機械工匠 (新)
  OVERDRIVE_WRENCH: { id: 'OVERDRIVE_WRENCH', name: '過載扳手', description: '用灌注能量的扳手重擊，造成中等傷害。' },
  SCRAP_ARMOR: { id: 'SCRAP_ARMOR', name: '廢料護甲', description: '用臨時找到的廢料強化自身防禦。' },
  CLOCKWORK_BOMB: { id: 'CLOCKWORK_BOMB', name: '發條炸彈', description: '投擲一個不穩定的發條炸彈，造成範圍傷害。' },

  // 怪奇醫師 (新)
  INJECT_SERUM: { id: 'INJECT_SERUM', name: '注射藥劑', description: '給自己注射不穩定的藥劑，大幅強化下一次攻擊。' },
  ANALYSIS_WEAKNESS: { id: 'ANALYSIS_WEAKNESS', name: '分析弱點', description: '快速分析敵人弱點，使你的攻擊更有效。' },
  TOXIC_CONCOCTION: { id: 'TOXIC_CONCOCTION', name: '劇毒藥水', description: '向敵人投擲腐蝕性的劇毒藥水。' },

  // 黃銅審判官 (新)
  JUDGEMENT_GEAR: { id: 'JUDGEMENT_GEAR', name: '審判齒輪', description: '擲出一個神聖的齒輪，對敵人進行公正的審判。' },
  STEAM_SHIELD: { id: 'STEAM_SHIELD', name: '蒸汽護盾', description: '釋放高壓蒸汽形成護盾，抵擋攻擊。' },
  PURIFYING_FLAME: { id: 'PURIFYING_FLAME', name: '淨化之火', description: '用煉金術混合的火焰淨化敵人。' },

  // 突變蠻兵 (新)
  RADIOACTIVE_RAGE: { id: 'RADIOACTIVE_RAGE', name: '輻射狂怒', description: '進入輻射引發的狂怒狀態，攻擊力大幅提升。' },
  SAVAGE_STRIKE: { id: 'SAVAGE_STRIKE', name: '野蠻打擊', description: '一次充滿力量、不計後果的原始攻擊。' },
  TOUGH_HIDE: { id: 'TOUGH_HIDE', name: '堅韌外皮', description: '變異的皮膚提供了天然的防禦力。' },
  
  // 裝備技能 (新)
  TARGETING_STRIKE: {id: 'TARGETING_STRIKE', name: '鎖定打擊', description: '利用輔助系統鎖定弱點進行攻擊。'},
  AEGIS_SHIELD: {id: 'AEGIS_SHIELD', name: '神盾力場', description: '產生一個強大的能量護盾。'},
  FURY_INJECTION: {id: 'FURY_INJECTION', name: '狂怒藥劑', description: '注射強力藥劑，大幅提升力量。'},
};

export const classSkills: Record<string, string[]> = {
  "生化武士": ['STRONG_STRIKE', 'DEFENSIVE_STANCE', 'ADRENALINE_RUSH'],
  "數據巫師": ['FIREWALL_BLAST', 'ENCRYPTION_SHIELD', 'OVERCLOCK'],
  "暗影駭客": ['DATA_SPIKE', 'EVASIVE_MANEUVER', 'GHOST_PROTOCOL'],
  "廢土遊俠": ['SNIPER_SHOT', 'TRAP', 'SURVIVAL_INSTINCT'],
  "機造僧侶": ['SYSTEM_SHOCK_PALM', 'REINFORCED_CHASSIS', 'ENERGY_CYCLE'],
  "機械工匠": ['OVERDRIVE_WRENCH', 'SCRAP_ARMOR', 'CLOCKWORK_BOMB'],
  "怪奇醫師": ['INJECT_SERUM', 'ANALYSIS_WEAKNESS', 'TOXIC_CONCOCTION'],
  "黃銅審判官": ['JUDGEMENT_GEAR', 'STEAM_SHIELD', 'PURIFYING_FLAME'],
  "突變蠻兵": ['RADIOACTIVE_RAGE', 'SAVAGE_STRIKE', 'TOUGH_HIDE'],
};

export const getStartingSkills = (characterClass: string): Skill[] => {
  const skillIds = classSkills[characterClass] || [];
  return skillIds.map(id => allSkills[id]).filter(Boolean);
};