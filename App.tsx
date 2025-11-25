


import React, { useState, useCallback, useRef, useEffect } from 'react';
import { StorySegment, Character, SaveData, CharacterTemplate, BackupData, Achievement, WorldView, CombatEncounter, RandomEvent, Skill, Equipment, Synergy } from './types';
import { generateStorySegment } from './services/geminiService';
import { getStartingSkills } from './data/skills';
import LoadingScreen from './components/LoadingScreen';
import WelcomeScreen from './components/WelcomeScreen';
import CharacterCreationScreen from './components/CharacterCreationScreen';
import LoadGameScreen from './components/LoadGameScreen';
import AchievementsScreen from './components/AchievementsScreen';
import WorldSelectionScreen from './components/WorldSelectionScreen';
import Modal from './components/Modal';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { defaultTemplates } from './data/defaultTemplates';
import { allAchievements } from './data/achievements';
import { randomEvents } from './data/randomEvents';
import { allSynergies } from './data/synergies';

const SAVE_KEY = 'text-rpg-saves';
const TEMPLATES_KEY = 'text-rpg-templates';
const ACHIEVEMENTS_KEY = 'text-rpg-achievements';
const USED_CLASSES_KEY = 'text-rpg-used-classes';
const HIDDEN_EVENTS_WORLDS_KEY = 'text-rpg-hidden-events-worlds';
const AUTOSAVE_ID = 'autosave';

interface ModalState {
  isOpen: boolean;
  title: string;
  children: React.ReactNode;
  onConfirm?: () => void;
  confirmText?: string;
  onCancel?: () => void;
  cancelText?: string;
}

// Fix: Changed to a named export to resolve module resolution issues.
export const App: React.FC = () => {
  const [gameState, setGameState] = useState<'welcome' | 'world_selection' | 'character_creation' | 'playing' | 'error' | 'ended' | 'load_game' | 'achievements' | 'combat' | 'dead'>('welcome');
  const [character, setCharacter] = useState<Character | null>(null);
  const [worldView, setWorldView] = useState<WorldView | null>(null);
  const [story, setStory] = useState<string[]>([]);
  const [choices, setChoices] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isContinuing, setIsContinuing] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [savedGames, setSavedGames] = useState<SaveData[]>([]);
  const [characterTemplates, setCharacterTemplates] = useState<CharacterTemplate[]>([]);
  const [unlockedAchievements, setUnlockedAchievements] = useState<Set<string>>(new Set());
  const [notifications, setNotifications] = useState<(Achievement & { key: number })[]>([]);
  const [modalState, setModalState] = useState<ModalState>({ isOpen: false, title: '', children: '' });
  const [combatEncounter, setCombatEncounter] = useState<CombatEncounter | null>(null);
  const [combatResult, setCombatResult] = useState<{outcome: 'win' | 'lose', text: string} | null>(null);

  const storyEndRef = useRef<HTMLDivElement>(null);

  const getAvailableSkills = useCallback((char: Character | null): Skill[] => {
      if (!char) return [];
      const equipmentSkills = [
          char.equipment?.weapon?.grantedSkill,
          char.equipment?.armor?.grantedSkill,
          char.equipment?.accessory?.grantedSkill,
      ].filter((skill): skill is Skill => !!skill);
      return [...char.skills, ...equipmentSkills];
  }, []);
  
  const getActiveSynergies = useCallback((char: Character | null): Synergy[] => {
    if (!char) return [];
    const currentSkills = getAvailableSkills(char);
    const currentSkillIds = new Set(currentSkills.map(s => s.id));
    
    return allSynergies.filter(synergy => 
        synergy.requiredSkillIds.every(id => currentSkillIds.has(id))
    );
  }, [getAvailableSkills]);

  const calculateTotalPower = useCallback((char: Character | null): number => {
      if (!char) return 0;
      let bonus = 0;
      if (char.equipment?.weapon?.powerBonus) bonus += char.equipment.weapon.powerBonus;
      if (char.equipment?.armor?.powerBonus) bonus += char.equipment.armor.powerBonus;
      if (char.equipment?.accessory?.powerBonus) bonus += char.equipment.accessory.powerBonus;

      const activeSynergies = getActiveSynergies(char);
      activeSynergies.forEach(synergy => {
        if (synergy.bonus.type === 'POWER_BONUS') {
          bonus += synergy.bonus.value;
        }
      });

      return char.power + bonus;
  }, [getActiveSynergies]);


  const showModal = useCallback((config: Omit<ModalState, 'isOpen'>) => {
    setModalState({ ...config, isOpen: true });
  }, []);

  const hideModal = useCallback(() => {
    setModalState(prev => ({ ...prev, isOpen: false }));
  }, []);

  const persistAchievements = (achievementIds: Set<string>) => {
    setUnlockedAchievements(achievementIds);
    try {
        localStorage.setItem(ACHIEVEMENTS_KEY, JSON.stringify(Array.from(achievementIds)));
    } catch (e) {
        console.error("無法儲存成就:", e);
    }
  };

  const unlockAchievement = useCallback((achievementId: string) => {
    setUnlockedAchievements(prevUnlocked => {
        if (prevUnlocked.has(achievementId)) {
            return prevUnlocked;
        }

        const achievement = allAchievements.find(a => a.id === achievementId);
        if (achievement) {
            console.log(`成就解鎖: ${achievement.name}`);
            const newUnlocked = new Set(prevUnlocked);
            newUnlocked.add(achievementId);
            
            try {
              localStorage.setItem(ACHIEVEMENTS_KEY, JSON.stringify(Array.from(newUnlocked)));
            } catch (e) {
                console.error("無法儲存成就:", e);
            }
            
            const newNotification = { ...achievement, key: Date.now() };
            setNotifications(prev => [...prev, newNotification]);
            setTimeout(() => {
                setNotifications(prev => prev.filter(n => n.key !== newNotification.key));
            }, 5000);

            return newUnlocked;
        }
        return prevUnlocked;
    });
  }, []);

  useEffect(() => {
    try {
      const savesFromStorage = localStorage.getItem(SAVE_KEY);
      if (savesFromStorage) {
        const parsedSaves: SaveData[] = JSON.parse(savesFromStorage);
        parsedSaves.sort((a, b) => b.timestamp - a.timestamp);
        setSavedGames(parsedSaves);
      }
    } catch (e) { console.error("無法讀取儲存的遊戲:", e); }
    
    try {
      const templatesFromStorage = localStorage.getItem(TEMPLATES_KEY);
      if (templatesFromStorage) {
        setCharacterTemplates(JSON.parse(templatesFromStorage));
      } else {
        persistTemplates(defaultTemplates);
      }
    } catch (e) { console.error("無法讀取角色範本:", e); }

    try {
      const achievementsFromStorage = localStorage.getItem(ACHIEVEMENTS_KEY);
      if (achievementsFromStorage) {
        setUnlockedAchievements(new Set(JSON.parse(achievementsFromStorage)));
      }
    } catch (e) { console.error("無法讀取成就:", e); }
  }, []);

  useEffect(() => {
    storyEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [story, choices]);

  useEffect(() => {
    if (character) {
        if (character.power >= 15) {
            unlockAchievement('GEAR_READY');
        }
        const totalPower = calculateTotalPower(character);
        if (totalPower >= 25) {
            unlockAchievement('POWER_OVERWHELMING');
        }
        if (totalPower >= 40) {
            unlockAchievement('LEGENDARY_WARRIOR');
        }
    }
  }, [character, unlockAchievement, calculateTotalPower]);


  const persistSaves = (saves: SaveData[]) => {
    saves.sort((a, b) => b.timestamp - a.timestamp);
    setSavedGames(saves);
    try {
      localStorage.setItem(SAVE_KEY, JSON.stringify(saves));
    } catch (e) { console.error("無法儲存進度:", e); }
  };

  const persistTemplates = (templates: CharacterTemplate[]) => {
    setCharacterTemplates(templates);
    try {
      localStorage.setItem(TEMPLATES_KEY, JSON.stringify(templates));
    } catch (e) { console.error("無法儲存範本:", e); }
  };

  const handleAutoSave = useCallback(() => {
     if (!character || (gameState !== 'playing' && gameState !== 'ended')) return;

    const newAutoSave: SaveData = {
      id: AUTOSAVE_ID,
      timestamp: Date.now(),
      character,
      story,
      choices,
      isEnd: gameState === 'ended',
      saveType: 'auto',
    };

    const otherSaves = savedGames.filter(s => s.id !== AUTOSAVE_ID);
    persistSaves([newAutoSave, ...otherSaves]);
  }, [character, story, choices, gameState, savedGames]);

  useEffect(() => {
    if ((gameState === 'playing' || gameState === 'ended') && story.length > 0) {
      handleAutoSave();
      if (gameState === 'ended') {
          unlockAchievement('THE_END');
      }
    }
  }, [story, gameState, handleAutoSave, unlockAchievement]);

  const handleStartGame = useCallback(() => setGameState('world_selection'), []);
  const handleWorldSelected = useCallback((selectedWorld: WorldView) => {
    setWorldView(selectedWorld);
    setGameState('character_creation');
  }, []);
  const handleGoToLoadScreen = useCallback(() => setGameState('load_game'), []);
  const handleShowAchievements = useCallback(() => setGameState('achievements'), []);

  const handleResetGame = useCallback(() => {
    setGameState('welcome');
    setCharacter(null);
    setStory([]);
    setChoices([]);
    setError(null);
    setIsLoading(false);
    setIsContinuing(false);
    setWorldView(null);
    setCombatEncounter(null);
    setCombatResult(null);
  }, []);
  
  const startGameWithCharacter = useCallback(async (characterToStart: Character) => {
      setCharacter(characterToStart);
      setIsLoading(true);
      setError(null);
      setStory([]);
      setChoices([]);
      setGameState('playing');
      unlockAchievement('BEGINNER');

      try {
          const usedClasses = new Set<string>(JSON.parse(localStorage.getItem(USED_CLASSES_KEY) || '[]'));
          usedClasses.add(characterToStart.class);
          localStorage.setItem(USED_CLASSES_KEY, JSON.stringify(Array.from(usedClasses)));
          if (usedClasses.size >= 3) {
              unlockAchievement('VERSATILE');
          }

          const segment = await generateStorySegment(characterToStart, [], null);
          setStory([segment.situation]);
          setChoices(segment.choices);
          if (segment.isEnd) {
              setGameState('ended');
          }
      } catch (err) {
          console.error(err);
          setError('無法開始新的冒險。或許是宇宙的能量不穩定，請再試一次。');
          setGameState('error');
      } finally {
          setIsLoading(false);
      }
  }, [unlockAchievement]);
  
  const handleCharacterCreated = useCallback(async (charData: Omit<Character, 'worldView' | 'power' | 'skills' | 'equipment' | 'hp' | 'maxHp'>) => {
    if (!worldView) {
        setError('未選擇世界觀，無法開始遊戲。');
        setGameState('error');
        return;
    }
    const basePower = 10 + Math.floor(Math.random() * 5);
    const maxHp = basePower * 4 + 20;
    const newCharacter: Character = { 
        ...charData, 
        worldView, 
        power: basePower,
        maxHp,
        hp: maxHp,
        skills: getStartingSkills(charData.class),
        equipment: { weapon: null, armor: null, accessory: null },
    };
    await startGameWithCharacter(newCharacter);
  }, [worldView, startGameWithCharacter]);

  const handleStartFromCharacter = useCallback((baseChar: Character) => {
      const basePower = 10 + Math.floor(Math.random() * 5);
      const maxHp = basePower * 4 + 20;
      // FIX: Removed `story` and `choices` from character initialization.
      // These properties are not part of the `Character` type and are handled
      // by component state, which is reset in `startGameWithCharacter`.
      const charToStart: Character = {
        ...baseChar,
        power: basePower,
        maxHp: maxHp,
        hp: maxHp,
        skills: getStartingSkills(baseChar.class),
        equipment: { weapon: null, armor: null, accessory: null },
      };
      setWorldView(baseChar.worldView);
      startGameWithCharacter(charToStart);
  }, [startGameWithCharacter]);

  const handleCombatAction = useCallback((action: 'attack' | Skill) => {
    if (!character || !combatEncounter) return;

    let playerDamage = 0;
    let enemyDamage = Math.max(1, Math.floor(combatEncounter.enemyPower / 2) + Math.floor(Math.random() * 4));
    let actionDescription = '';
    const combatLog: string[] = [];
    
    // Synergy Effects
    const activeSynergies = getActiveSynergies(character);
    let powerBonus = 0;
    let damageModifier = 1.0;
    let incomingDamageModifier = 1.0;
    let hpRegen = 0;

    activeSynergies.forEach(synergy => {
        switch (synergy.bonus.type) {
            case 'POWER_BONUS':
                powerBonus += synergy.bonus.value;
                break;
            case 'DAMAGE_MODIFIER':
                damageModifier *= synergy.bonus.value;
                break;
            case 'INCOMING_DAMAGE_MODIFIER':
                incomingDamageModifier *= synergy.bonus.value;
                break;
            case 'HP_REGEN_PER_TURN':
                hpRegen += synergy.bonus.value;
                break;
        }
    });
    
    // Process abilities that affect damage before the strike
    if (combatEncounter.abilities?.some(a => a.id === 'SHIELD')) {
        enemyDamage = Math.floor(enemyDamage * 0.7);
        combatLog.push(`敵人的護盾削弱了你的攻擊！`);
    }
    if (combatEncounter.abilities?.some(a => a.id === 'WEAKEN')) {
        playerDamage = Math.floor(playerDamage * 0.8);
        combatLog.push(`你的攻擊因弱化效果而威力下降！`);
    }
    enemyDamage = Math.floor(enemyDamage * incomingDamageModifier);
    if(incomingDamageModifier < 1.0) {
        combatLog.push(`你的技能連攜效果減免了部分傷害！`);
    }

    // Player's action
    const playerBasePower = calculateTotalPower(character);
    let playerActionDamage = Math.max(1, Math.floor(playerBasePower / 2) + Math.floor(Math.random() * 6));

    if (action === 'attack') {
        actionDescription = '你發動了普通攻擊。';
        playerDamage = playerActionDamage;
    } else {
        actionDescription = `你使用了「${action.name}」。`;
        if (action.name.includes('強力') || action.name.includes('衝擊') || action.name.includes('射擊') || action.name.includes('尖刺') || action.name.includes('扳手') || action.name.includes('藥水') || action.name.includes('齒輪') || action.name.includes('打擊') || action.name.includes('之火')) {
            playerDamage = Math.floor(playerActionDamage * 1.5);
        } else if (action.name.includes('腎上腺素') || action.name.includes('超頻') || action.name.includes('藥劑') || action.name.includes('炸彈') || action.name.includes('狂怒')) {
            playerDamage = Math.floor(playerActionDamage * 2);
        } else if (action.name.includes('防禦') || action.name.includes('護盾') || action.name.includes('骨架') || action.name.includes('護甲') || action.name.includes('外皮')) {
            enemyDamage = Math.floor(enemyDamage * 0.5);
            playerDamage = Math.floor(playerActionDamage * 0.7);
        } else if (action.name.includes('閃避') || action.name.includes('幽靈')) {
            if(Math.random() > 0.4) {
                 enemyDamage = 0;
                 actionDescription += ' 敵人完全沒打中你！';
            } else {
                 actionDescription += ' 可惜，你的動作被看穿了。';
            }
            playerDamage = playerActionDamage;
        } else {
            playerDamage = playerActionDamage;
        }
    }
    
    playerDamage = Math.floor(playerDamage * damageModifier);
     if (damageModifier > 1.0) {
        combatLog.push(`你的技能連攜效果強化了你的攻擊！`);
    }
    
    playerDamage = Math.max(0, playerDamage);
    enemyDamage = Math.max(0, enemyDamage);
    
    let newEnemyHp = combatEncounter.enemyHp - playerDamage;
    let newPlayerHp = character.hp - enemyDamage;

    combatLog.push(`${actionDescription}`);
    combatLog.push(`你對 ${combatEncounter.enemyName} 造成了 **${playerDamage}** 點傷害。`);
    combatLog.push(`${combatEncounter.enemyName} 對你造成了 **${enemyDamage}** 點傷害。`);

    // Post-turn effects
    if (combatEncounter.abilities?.some(a => a.id === 'POISON')) {
        const poisonDamage = 2;
        newPlayerHp -= poisonDamage;
        combatLog.push(`你身上的毒素發作，受到了 **${poisonDamage}** 點額外傷害！`);
    }
    if (combatEncounter.abilities?.some(a => a.id === 'POWER_DRAIN')) {
        const drainAmount = 1;
        setCharacter(c => c ? { ...c, power: Math.max(1, c.power - drainAmount) } : null);
        combatLog.push(`敵人的能力吸取了你 **${drainAmount}** 點基礎戰力！`);
    }
     if (combatEncounter.abilities?.some(a => a.id === 'REGENERATE')) {
        const regenAmount = 3;
        newEnemyHp = Math.min(combatEncounter.enemyMaxHp, newEnemyHp + regenAmount);
        combatLog.push(`敵人再生了 **${regenAmount}** 點 HP！`);
    }
    if (hpRegen > 0) {
        newPlayerHp = Math.min(character.maxHp, newPlayerHp + hpRegen);
        combatLog.push(`你的技能連攜效果回復了 **${hpRegen}** 點 HP！`);
    }


    newPlayerHp = Math.max(0, newPlayerHp);
    newEnemyHp = Math.max(0, newEnemyHp);

    const updatedCharacter = { ...character, hp: newPlayerHp };
    const updatedEncounter = { ...combatEncounter, enemyHp: newEnemyHp };
    
    setCharacter(updatedCharacter);
    setCombatEncounter(updatedEncounter);
    setStory(prev => [...prev, combatLog.join('\n')]);

    if (newEnemyHp <= 0 && newPlayerHp <= 0) {
        unlockAchievement('DEATH');
        unlockAchievement('MUTUAL_DESTRUCTION');
        setGameState('dead');
    } else if (newEnemyHp <= 0) {
        const powerChange = Math.round((combatEncounter.enemyPower / 5) + 1);
        const finalCharacter = { ...updatedCharacter, power: updatedCharacter.power + powerChange };
        setCharacter(finalCharacter);

        const resultText = `> **你擊敗了 ${combatEncounter.enemyName}！**\n你的基礎戰力增加了 ${powerChange} 點。`;
        setCombatResult({ outcome: 'win', text: resultText });
        unlockAchievement('FIRST_BLOOD');
        if (updatedCharacter.hp > 0 && updatedCharacter.hp <= (character.maxHp * 0.1)) {
            unlockAchievement('SURVIVOR');
        }

    } else if (newPlayerHp <= 0) {
        unlockAchievement('DEATH');
        setGameState('dead');
    }
  }, [character, combatEncounter, unlockAchievement, calculateTotalPower, getActiveSynergies]);

  const handleContinueAfterCombat = useCallback(async () => {
    if (!character || !combatResult) return;

    setIsLoading(true);
    setGameState('playing');
    setCombatEncounter(null);
    
    const finalHp = combatResult.outcome === 'win' ? character.maxHp : 1;
    const characterForNextSegment = { ...character, hp: finalHp };
    setCharacter(characterForNextSegment);

    const currentStory = [...story, combatResult.text];
    setCombatResult(null);
    setStory(currentStory);
    setChoices([]);

    try {
      const segment = await generateStorySegment(characterForNextSegment, currentStory, `戰鬥結果: ${combatResult.outcome === 'win' ? '勝利' : '失敗'}`);
      setStory(prev => [...prev, segment.situation]);
      setChoices(segment.choices);
      if (segment.isEnd) {
        setGameState('ended');
      }
    } catch (err) {
      console.error(err);
      setError('故事的絲線似乎纏繞在一起了。請再試一次，或許能找到新的道路。');
      setGameState('error');
    } finally {
      setIsLoading(false);
    }
  }, [character, combatResult, story]);

  const handleChoice = useCallback(async (choice: string) => {
    if (!character) {
      setError('角色資訊遺失，無法繼續故事。');
      setGameState('error');
      return;
    }

    setIsContinuing(true);
    setError(null);
    const currentStory = [...story, `> ${choice}`];
    setStory(currentStory);
    setChoices([]);

    try {
      let segment = await generateStorySegment(character, currentStory, choice);
      
      if (segment.reward?.equipment) {
        const newItem = segment.reward.equipment;
        const itemType = newItem.type;

        if (newItem.id === 'misc-cucumber') {
            unlockAchievement('CUCUMBER');
        }
        
        setCharacter(c => {
            if (!c) return null;
            
            const oldSynergies = getActiveSynergies(c);
            
            const newChar = { ...c, equipment: { ...c.equipment } };
            const oldItem = newChar.equipment[itemType];
            newChar.equipment[itemType] = newItem;

            const newSynergies = getActiveSynergies(newChar);

            newSynergies.forEach(synergy => {
                if (!oldSynergies.some(s => s.id === synergy.id)) {
                    const synergyNotification = {
                        id: `synergy-${synergy.id}-${Date.now()}`,
                        name: `🔗 技能連攜啟用！`,
                        description: `你啟用了「${synergy.name}」：${synergy.description}`,
                        key: Date.now(),
                    };
                    setNotifications(prev => [...prev, synergyNotification]);
                    setTimeout(() => {
                        setNotifications(prev => prev.filter(n => n.key !== synergyNotification.key));
                    }, 5000);
                }
            });

            const newNotification = { 
              id: `item-${Date.now()}`, 
              name: `✨ 獲得裝備！`, 
              description: `你獲得了「${newItem.name}」。${oldItem ? `已替換掉「${oldItem.name}」。` : ''}`, 
              key: Date.now() 
            };
            setNotifications(prev => [...prev, newNotification]);
            setTimeout(() => {
                setNotifications(prev => prev.filter(n => n.key !== newNotification.key));
            }, 5000);

            unlockAchievement('EQUIPMENT_NOVICE');
            if (newChar.equipment.weapon && newChar.equipment.armor && newChar.equipment.accessory) {
                unlockAchievement('FULLY_EQUIPPED');
            }
            
            return newChar;
        });
      }

      if (segment.reward?.power) {
          const powerBonus = segment.reward.power;
          setCharacter(c => {
              if (!c) return null;
              const newPower = c.power + powerBonus;
              const newMaxHp = newPower * 4 + 20;
              const hpGain = newMaxHp - c.maxHp;
              const newHp = c.hp + hpGain;

              const newNotification = {
                  id: `power-${Date.now()}`,
                  name: '🌟 戰力提升！',
                  description: `你的基礎戰力永久提升了 ${powerBonus} 點！最大HP增加了 ${hpGain}！`,
                  key: Date.now(),
              };
              setNotifications(prev => [...prev, newNotification]);
              setTimeout(() => {
                  setNotifications(prev => prev.filter(n => n.key !== newNotification.key));
              }, 5000);
              return { ...c, power: newPower, maxHp: newMaxHp, hp: newHp };
          });
      }

      if (segment.situation.includes('[HIDDEN_EVENT_TRIGGERED]')) {
        unlockAchievement('SECRET_HUNTER');
        segment.situation = segment.situation.replace('[HIDDEN_EVENT_TRIGGERED]', '').trim();
        try {
            const triggeredWorlds = new Set<string>(JSON.parse(localStorage.getItem(HIDDEN_EVENTS_WORLDS_KEY) || '[]'));
            triggeredWorlds.add(character.worldView);
            localStorage.setItem(HIDDEN_EVENTS_WORLDS_KEY, JSON.stringify(Array.from(triggeredWorlds)));
            if (triggeredWorlds.size >= 2) {
                unlockAchievement('PLANESWALKER');
            }
        } catch (e) { console.error("無法處理隱藏事件成就:", e); }
      }

      setStory(prev => [...prev, segment.situation]);

      if (segment.combatEncounter) {
        const enemyMaxHp = segment.combatEncounter.enemyPower * 4 + 15;
        const fullEncounter: CombatEncounter = {
            ...segment.combatEncounter,
            enemyMaxHp,
            enemyHp: enemyMaxHp,
        };
        setCombatEncounter(fullEncounter);
        setGameState('combat');
      } else {
        setChoices(segment.choices);
        if (segment.isEnd) {
          setGameState('ended');
        }

        const RANDOM_EVENT_CHANCE = 0.2; // 20% chance
        if (gameState === 'playing' && !segment.isEnd && Math.random() < RANDOM_EVENT_CHANCE) {
          const event = randomEvents[Math.floor(Math.random() * randomEvents.length)];
          setCharacter(c => {
            if (!c) return null;
            const newPower = Math.max(1, c.power + event.powerEffect);
            const eventNotification = { 
              id: `event-${Date.now()}`, 
              name: `🎲 隨機事件！`, 
              description: `${event.description} 你的基礎戰力 ${event.powerEffect >= 0 ? `增加 ${event.powerEffect}` : `減少 ${Math.abs(event.powerEffect)}`}。`, 
              key: Date.now() 
            };
            setNotifications(prev => [...prev, eventNotification]);
            setTimeout(() => {
                setNotifications(prev => prev.filter(n => n.key !== eventNotification.key));
            }, 5000);
            return { ...c, power: newPower };
          });
        }
      }

      if (Math.ceil(currentStory.length / 2) >= 10) {
        unlockAchievement('STORYTELLER');
      }
    } catch (err) {
      console.error(err);
      setError('故事的絲線似乎纏繞在一起了。請再試一次，或許能找到新的道路。');
      setGameState('error');
    } finally {
      setIsContinuing(false);
    }
  }, [story, character, unlockAchievement, gameState, getActiveSynergies]);

  const handleManualSave = useCallback(() => {
    if (!character) return;
    const newSave: SaveData = {
      id: Date.now().toString(),
      timestamp: Date.now(),
      character,
      story,
      choices,
      isEnd: gameState === 'ended',
      saveType: 'manual',
    };
    persistSaves([newSave, ...savedGames]);
    unlockAchievement('SAVER');
    showModal({ title: '儲存成功', children: '遊戲已手動儲存！', confirmText: '好的', onConfirm: hideModal });
  }, [character, story, choices, gameState, savedGames, unlockAchievement, showModal, hideModal]);

  const handleLoadGame = useCallback((saveId: string) => {
    const saveToLoad = savedGames.find(s => s.id === saveId);
    if (saveToLoad) {
      // Data migration for older save files
      if (!saveToLoad.character.skills || saveToLoad.character.skills.length === 0) {
        saveToLoad.character.skills = getStartingSkills(saveToLoad.character.class);
      }
      if (!saveToLoad.character.equipment) {
        saveToLoad.character.equipment = { weapon: null, armor: null, accessory: null };
      }
      if (saveToLoad.character.hp === undefined || saveToLoad.character.maxHp === undefined) {
        saveToLoad.character.maxHp = saveToLoad.character.power * 4 + 20;
        saveToLoad.character.hp = saveToLoad.character.maxHp;
      }
      
      const { character: charToLoad, story: storyToLoad, choices: choicesToLoad, isEnd: isEndToLoad } = saveToLoad;

      // Set state from save file first
      setCharacter(charToLoad);
      setWorldView(charToLoad.worldView);
      setStory(storyToLoad);
      setChoices(choicesToLoad);
      setGameState(isEndToLoad ? 'ended' : 'playing');
      setError(null);
      setCombatEncounter(null); // Explicitly clear any lingering combat state
      setCombatResult(null);
      unlockAchievement('TIME_TRAVELER');

      // BUG FIX: If the loaded state is a "limbo" state (not the end, but no choices),
      // it means the game was likely saved after combat but before the next segment was generated.
      // We need to automatically generate the next segment to continue the story.
      if (!isEndToLoad && (!choicesToLoad || choicesToLoad.length === 0)) {
        const continueStoryAfterLoad = async () => {
          setIsLoading(true); // Show full screen loading
          try {
            // Passing null for playerChoice tells the AI to just continue based on the history.
            const segment = await generateStorySegment(charToLoad, storyToLoad, null);
            setStory(prev => [...prev, segment.situation]);
            setChoices(segment.choices);
            if (segment.isEnd) {
              setGameState('ended');
            }
          } catch (err) {
            console.error("Error continuing story after load:", err);
            setError('故事的絲線似乎纏繞在一起了。請再試一次，或許能找到新的道路。');
            setGameState('error');
          } finally {
            setIsLoading(false);
          }
        };
        
        // Use a small timeout to allow the initial state to render before showing the loading screen.
        setTimeout(continueStoryAfterLoad, 100);
      }
    }
  }, [savedGames, unlockAchievement]);

  const handleDeleteSave = useCallback((saveId: string) => {
    showModal({
        title: '確認刪除',
        children: '你確定要刪除這個存檔嗎？此動作無法復原。',
        confirmText: '刪除',
        onConfirm: () => {
            persistSaves(savedGames.filter(s => s.id !== saveId));
            hideModal();
        },
        cancelText: '取消',
        onCancel: hideModal,
    });
  }, [savedGames, showModal, hideModal]);

  const handleSaveTemplate = useCallback((characterToSave: Omit<Character, 'worldView' | 'power' | 'skills' | 'equipment' | 'hp' | 'maxHp'>) => {
    const isDuplicate = characterTemplates.some(template => 
      template.name.trim() === characterToSave.name.trim() &&
      template.class === characterToSave.class &&
      template.backstory.trim() === characterToSave.backstory.trim()
    );

    if (isDuplicate) {
      showModal({ title: '無法儲存', children: '這個角色範本已經存在，無法重複儲存。', confirmText: '了解', onConfirm: hideModal });
      return;
    }
    
    const newTemplate: CharacterTemplate = {
      ...characterToSave,
      id: Date.now().toString(),
      power: 10,
      skills: getStartingSkills(characterToSave.class),
    };
    persistTemplates([...characterTemplates, newTemplate]);
    unlockAchievement('CREATOR');
    showModal({ title: '儲存成功', children: '角色範本已儲存！', confirmText: '好的', onConfirm: hideModal });
  }, [characterTemplates, unlockAchievement, showModal, hideModal]);

  const handleDeleteTemplate = useCallback((templateId: string) => {
    showModal({
        title: '確認刪除',
        children: '你確定要刪除這個角色範本嗎？',
        confirmText: '刪除',
        onConfirm: () => {
            persistTemplates(characterTemplates.filter(t => t.id !== templateId));
            hideModal();
        },
        cancelText: '取消',
        onCancel: hideModal,
    });
  }, [characterTemplates, showModal, hideModal]);
  
  const handleImportData = useCallback((data: BackupData) => {
    if (!data || typeof data !== 'object') {
        showModal({ title: '匯入失敗', children: '檔案格式不正確。', confirmText: '了解', onConfirm: hideModal });
        return;
    }

    const { saves = [], templates = [], unlockedAchievements: importedAchievements = [] } = data;
    const existingSaveIds = new Set(savedGames.map(s => s.id));
    const newSaves = saves.filter(s => s && s.id && !existingSaveIds.has(s.id));
    const newTemplates = templates.filter(incoming => !incoming || !incoming.name || !incoming.class || !incoming.backstory ? false : !characterTemplates.some(existing => existing.name.trim() === incoming.name.trim() && existing.class === incoming.class && existing.backstory.trim() === incoming.backstory.trim()));
    const initialUnlockedCount = unlockedAchievements.size;
    const newUnlockedSet = new Set<string>([...unlockedAchievements, ...importedAchievements]);
    
    if (newUnlockedSet.size > initialUnlockedCount) persistAchievements(newUnlockedSet);
    const newAchievementsCount = newUnlockedSet.size - initialUnlockedCount;

    if (newSaves.length === 0 && newTemplates.length === 0 && newAchievementsCount === 0) {
        showModal({ title: '無新資料', children: '沒有新的存檔、範本或成就可以匯入。', confirmText: '好的', onConfirm: hideModal });
        return;
    }

    if (newSaves.length > 0) persistSaves([...savedGames, ...newSaves]);
    if (newTemplates.length > 0) persistTemplates([...characterTemplates, ...newTemplates]);
    
    showModal({ title: '匯入成功', children: `成功匯入 ${newSaves.length} 個新存檔、${newTemplates.length} 個新範本，並更新了 ${newAchievementsCount} 個成就！`, confirmText: '太棒了', onConfirm: hideModal });
  }, [savedGames, characterTemplates, unlockedAchievements, showModal, hideModal]);
  
  const handleImportFile = useCallback((file: File) => {
      const reader = new FileReader();
      reader.onload = (e) => {
          try {
              const text = e.target?.result as string;
              const data = JSON.parse(text) as BackupData;
              handleImportData(data);
          } catch (error) {
              console.error("無法匯入檔案:", error);
              showModal({ title: '匯入失敗', children: '檔案可能已損毀或格式不正確。', confirmText: '了解', onConfirm: hideModal });
          }
      };
      reader.readAsText(file);
  }, [handleImportData, showModal, hideModal]);

  const handleExportData = useCallback(() => {
    const dataToExport: BackupData = {
      saves: savedGames,
      templates: characterTemplates,
      unlockedAchievements: Array.from(unlockedAchievements),
    };
    const jsonString = JSON.stringify(dataToExport, null, 2);
    const blob = new Blob([jsonString], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `text-rpg-backup-${new Date().toISOString().slice(0, 10)}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    unlockAchievement('ARCHIVIST');
  }, [savedGames, characterTemplates, unlockedAchievements, unlockAchievement]);

  const HpBar: React.FC<{current: number; max: number; colorClass: string;}> = ({ current, max, colorClass }) => {
    const percentage = max > 0 ? (current / max) * 100 : 0;
    return (
        <div className="w-full bg-slate-700 rounded-full h-2.5 border border-slate-600">
            <div className={`${colorClass} h-full rounded-full transition-all duration-500`} style={{ width: `${percentage}%` }}></div>
        </div>
    );
  };
  
  const SynergyDisplay: React.FC<{char: Character | null}> = ({ char }) => {
    const activeSynergies = getActiveSynergies(char);
    if (!activeSynergies || activeSynergies.length === 0) return null;
    
    return (
      <div className="mb-4 p-4 bg-slate-900/50 rounded-lg border border-indigo-500/50 animate-fade-in">
          <h3 className="text-lg font-bold text-indigo-300 mb-2 text-center">技能連攜</h3>
          <div className="space-y-2">
            {activeSynergies.map(synergy => (
                <div key={synergy.id} className="text-center">
                    <p className="font-semibold text-slate-100">{synergy.name}</p>
                    <p className="text-xs text-slate-400">{synergy.description}</p>
                </div>
            ))}
          </div>
      </div>
    );
  };

  const renderGameContent = () => {
    switch (gameState) {
      case 'welcome':
        return <WelcomeScreen onStart={handleStartGame} onLoad={handleGoToLoadScreen} onShowAchievements={handleShowAchievements} hasSaves={savedGames.length > 0} onImportFile={handleImportFile} onExportData={handleExportData} hasDataToExport={savedGames.length > 0 || characterTemplates.length > 0} />;
      case 'world_selection':
        return <WorldSelectionScreen onSelect={handleWorldSelected} onBack={handleResetGame} />;
      case 'character_creation':
        return <CharacterCreationScreen onCharacterCreate={handleCharacterCreated} onBack={handleResetGame} templates={characterTemplates} onSaveTemplate={handleSaveTemplate} onDeleteTemplate={handleDeleteTemplate} worldView={worldView!} />;
      case 'load_game':
        // FIX: Changed `templates={templates}` to `templates={characterTemplates}` to pass the correct state variable.
        return <LoadGameScreen saves={savedGames} templates={characterTemplates} onLoad={handleLoadGame} onUseTemplate={handleStartFromCharacter} onDelete={handleDeleteSave} onBack={handleResetGame} />;
       case 'achievements':
        return <AchievementsScreen allAchievements={allAchievements} unlockedIds={unlockedAchievements} onBack={handleResetGame} />;
      case 'error':
         return (
          <div className="flex flex-col items-center justify-center text-center h-full flex-grow">
            <h2 className="text-2xl font-bold text-red-400 mb-4">發生錯誤</h2>
            <p className="text-slate-300 max-w-md mb-8">{error}</p>
            <button onClick={handleResetGame} className="bg-cyan-500 hover:bg-cyan-400 text-slate-900 font-bold py-3 px-8 rounded-full transition-all duration-300 transform hover:scale-105 shadow-lg shadow-cyan-500/30">返回主畫面</button>
          </div>
        );
      case 'dead':
        return (
          <div className="flex flex-col items-center justify-center text-center h-full flex-grow animate-fade-in">
            <h2 className="text-6xl font-black text-red-500 mb-4">你已殞落</h2>
            <p className="text-slate-300 max-w-md mb-8">你的傳奇到此為止。但每個終點，都是新故事的起點。</p>
            <button onClick={handleResetGame} className="bg-cyan-500 hover:bg-cyan-400 text-slate-900 font-bold py-3 px-8 rounded-full transition-all duration-300 transform hover:scale-105 shadow-lg shadow-cyan-500/30">返回主畫面</button>
          </div>
        );
      case 'combat':
        if (!combatEncounter || !character) return null;
        const totalPower = calculateTotalPower(character);
        return (
          <div className="flex flex-col items-center justify-center w-full max-w-3xl mx-auto animate-fade-in">
              <h2 className="text-5xl font-black text-red-400 uppercase tracking-widest mb-2">遭遇戰！</h2>
              {!combatResult && <p className="text-slate-200 text-lg mb-6">你遭遇了 <span className="text-amber-300 font-bold">{combatEncounter.enemyName}</span>！</p>}
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full mb-6">
                  {/* Player Card */}
                  <div className="bg-slate-800/50 p-4 rounded-lg border border-slate-700 space-y-2">
                      <p className="text-lg font-bold text-cyan-300 text-center">{character.name}</p>
                      <HpBar current={character.hp} max={character.maxHp} colorClass="bg-gradient-to-r from-cyan-500 to-blue-500" />
                      <div className="text-center text-sm font-semibold text-slate-200">{character.hp} / {character.maxHp}</div>
                      <p className="text-center text-sm text-slate-400">總戰力: <span className="font-bold text-slate-200">{totalPower}</span></p>
                  </div>
                   {/* Enemy Card */}
                  <div className="bg-slate-800/50 p-4 rounded-lg border border-slate-700 space-y-2">
                      <p className="text-lg font-bold text-amber-300 text-center">{combatEncounter.enemyName}</p>
                      <HpBar current={combatEncounter.enemyHp} max={combatEncounter.enemyMaxHp} colorClass="bg-gradient-to-r from-red-500 to-amber-500" />
                      <div className="text-center text-sm font-semibold text-slate-200">{combatEncounter.enemyHp} / {combatEncounter.enemyMaxHp}</div>
                      <p className="text-center text-sm text-slate-400">戰力: <span className="font-bold text-slate-200">{combatEncounter.enemyPower}</span></p>
                  </div>
              </div>
              
              <div className="w-full grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
                {combatEncounter.abilities && combatEncounter.abilities.length > 0 && (
                    <div className="bg-slate-800/50 p-4 rounded-lg border border-amber-500/50">
                        <h3 className="text-base font-bold text-amber-300 mb-2 text-center">特殊能力</h3>
                        <div className="space-y-2">
                            {combatEncounter.abilities.map(ability => (
                                <div key={ability.id} className="text-center">
                                    <p className="font-semibold text-slate-100 text-sm">{ability.name}</p>
                                    <p className="text-xs text-slate-400">{ability.description}</p>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
                <div className={combatEncounter.abilities?.length ? '' : 'sm:col-start-1 sm:col-span-2'}>
                  <SynergyDisplay char={character} />
                </div>
              </div>

              <div className="w-full bg-slate-800/50 p-4 rounded-lg border border-slate-700 mb-6 overflow-y-auto max-h-[25vh]">
                {story.slice(-5).map((paragraph, index) => ( // Show recent combat log
                  <ReactMarkdown key={index} remarkPlugins={[remarkGfm]} components={{
                      p: ({node, ...props}) => <p className={`mb-2 text-sm leading-relaxed ${paragraph.startsWith('>') ? 'text-cyan-300 italic' : 'text-slate-300'}`} {...props} />,
                      strong: ({node, ...props}) => <strong className="font-bold text-amber-300" {...props} />,
                  }}>{paragraph}</ReactMarkdown>
                ))}
                <div ref={storyEndRef} />
              </div>

              {combatResult ? (
                 <div className="text-center animate-fade-in w-full">
                    <button
                        onClick={handleContinueAfterCombat}
                        className="bg-cyan-500 hover:bg-cyan-400 text-slate-900 font-bold py-3 px-8 rounded-full transition-all duration-300 transform hover:scale-105 shadow-lg shadow-cyan-500/30"
                    >
                        繼續
                    </button>
                </div>
              ) : (
                <div className="w-full">
                    <p className="text-base text-slate-300 mb-3 text-center">選擇你的行動：</p>
                    <div className="grid grid-cols-2 gap-3">
                        <button
                            onClick={() => handleCombatAction('attack')}
                            className="bg-slate-700/80 hover:bg-red-600/80 border border-slate-600 hover:border-red-400 text-slate-200 font-bold py-3 px-4 rounded-lg transition-all duration-300 transform hover:scale-105"
                        >
                           普通攻擊
                        </button>
                        {getAvailableSkills(character).map(skill => (
                            <button
                              key={skill.id}
                              onClick={() => handleCombatAction(skill)}
                              className="bg-slate-700/80 hover:bg-cyan-500/80 border border-slate-600 hover:border-cyan-400 text-slate-200 font-bold py-3 px-4 rounded-lg transition-all duration-300 transform hover:scale-105 group"
                            >
                              <p className="text-sm sm:text-base">{skill.name}</p>
                              <p className="text-xs text-slate-400 font-normal hidden sm:block group-hover:text-slate-200">{skill.description}</p>
                            </button>
                        ))}
                    </div>
                </div>
              )}
          </div>
        );
      case 'playing':
      case 'ended':
        const totalPowerPlaying = calculateTotalPower(character);
        const powerBonusPlaying = totalPowerPlaying - (character?.power ?? 0);
        return (
          <div className="flex flex-col flex-grow w-full max-w-4xl mx-auto animate-fade-in">
             {character && (
                <div className="mb-4 text-center text-sm sm:text-base font-bold text-cyan-300 tracking-wider">
                  {character.name} - {character.class} | 戰力: {totalPowerPlaying} {powerBonusPlaying > 0 ? `(${character.power} + ${powerBonusPlaying})` : ''} | HP: {character.hp} / {character.maxHp}
                </div>
              )}
            
            {character && (character.power >= 15 || Object.values(character.equipment).some(e => e !== null)) && (
                <div className="mb-4 p-4 bg-slate-900/50 rounded-lg border border-slate-700 animate-fade-in">
                    <h3 className="text-lg font-bold text-amber-300 mb-2 text-center">裝備</h3>
                    <div className="grid grid-cols-3 gap-2 text-center">
                    <div>
                        <p className="text-sm text-slate-400">武器</p>
                        <p className="font-semibold text-slate-100 truncate" title={character.equipment.weapon?.name}>{character.equipment.weapon?.name || '---'}</p>
                    </div>
                    <div>
                        <p className="text-sm text-slate-400">護甲</p>
                        <p className="font-semibold text-slate-100 truncate" title={character.equipment.armor?.name}>{character.equipment.armor?.name || '---'}</p>
                    </div>
                    <div>
                        <p className="text-sm text-slate-400">飾品</p>
                        <p className="font-semibold text-slate-100 truncate" title={character.equipment.accessory?.name}>{character.equipment.accessory?.name || '---'}</p>
                    </div>
                    </div>
                </div>
            )}
            <SynergyDisplay char={character} />

            <div className="flex-grow bg-slate-800/50 p-6 rounded-lg border border-slate-700 backdrop-blur-sm mb-6 overflow-y-auto max-h-[60vh]">
              {story.map((paragraph, index) => (
                 <ReactMarkdown key={index} remarkPlugins={[remarkGfm]} components={{
                    p: ({node, ...props}) => <p className={`mb-4 leading-relaxed ${paragraph.startsWith('> ') ? 'text-cyan-300 italic' : 'text-slate-200'}`} {...props} />,
                    h1: ({node, ...props}) => <h1 className="text-2xl font-black mb-3 text-cyan-400" {...props} />,
                    h2: ({node, ...props}) => <h2 className="text-xl font-bold mb-3 text-cyan-300" {...props} />,
                    strong: ({node, ...props}) => <strong className="font-bold text-cyan-300" {...props} />,
                    em: ({node, ...props}) => <em className="italic text-slate-300" {...props} />,
                    ul: ({node, ...props}) => <ul className="list-disc list-inside mb-4 ml-4 space-y-1" {...props} />,
                    li: ({node, ...props}) => <li className="pl-2 marker:text-cyan-400" {...props} />,
                 }}>{paragraph}</ReactMarkdown>
              ))}
               <div ref={storyEndRef} />
            </div>
            {!isContinuing && (
              <div className="animate-fade-in">
                {choices.length > 0 && gameState === 'playing' && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {choices.map((choice, index) => (
                      <button key={index} onClick={() => handleChoice(choice)} className="bg-slate-700/80 hover:bg-cyan-500/80 border border-slate-600 hover:border-cyan-400 text-slate-200 font-bold py-4 px-6 rounded-lg transition-all duration-300 transform hover:scale-105">{choice}</button>
                    ))}
                  </div>
                )}
                <div className="text-center mt-6">
                  {gameState === 'playing' && (<button onClick={handleManualSave} className="bg-indigo-600 hover:bg-indigo-500 text-white font-bold py-3 px-8 rounded-full transition-all duration-300 transform hover:scale-105 shadow-lg shadow-indigo-500/30">手動儲存</button>)}
                  {gameState === 'ended' && (<div className="animate-fade-in"><p className="text-2xl text-cyan-300 font-bold mb-4">故事結束</p><button onClick={handleResetGame} className="bg-cyan-500 hover:bg-cyan-400 text-slate-900 font-bold py-3 px-8 rounded-full transition-all duration-300 transform hover:scale-105 shadow-lg shadow-cyan-500/30">返回主畫面</button></div>)}
                </div>
              </div>
            )}
          </div>
        );
      default:
        return null;
    }
  }

  return (
    <div className={`bg-slate-900 text-slate-100 min-h-screen antialiased selection:bg-cyan-300 selection:text-slate-900 relative isolate`}>
      {isLoading && <LoadingScreen message={story.length === 0 ? '創建你的傳奇...' : '讀取中...'} />}
      {isContinuing && (
          <div className="fixed top-4 left-4 z-[100] flex items-center gap-2 bg-slate-800/90 p-2 rounded-lg border border-slate-700 backdrop-blur-sm animate-fade-in">
              <div className="h-4 w-4 border-2 border-cyan-400 border-t-transparent rounded-full animate-spin"></div>
              <span className="text-sm text-slate-300 font-semibold">故事繼續...</span>
          </div>
      )}
      <Modal {...modalState} />
      <div className="relative z-0 min-h-screen">
        <style>{`
          @keyframes grid-scroll { from { background-position-y: 0; } to { background-position-y: -24px; } }
          @keyframes float-glow { 0%, 100% { transform: translateY(0) scale(1); opacity: 0.2; } 50% { transform: translateY(-20px) scale(1.05); opacity: 0.25; } }
          @keyframes slide-in-up { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }
          @keyframes fade-in { from { opacity: 0; } to { opacity: 1; } }
          @keyframes fog-drift { from { background-position: 0 0; } to { background-position: 500px 0; } }
          @keyframes crackle { from { background-position: 0 0; } to { background-position: -256px -256px; } }

          .animate-slide-in-up { animation: slide-in-up 0.5s ease-out forwards; }
          .animate-grid-scroll { animation: grid-scroll 3s linear infinite; }
          .animate-float-glow { animation: float-glow 12s ease-in-out infinite; }
          .animate-fade-in { animation: fade-in 0.5s ease-out forwards; }

          .combat-bg {
            content: '';
            position: fixed;
            inset: 0;
            z-index: -1;
            opacity: 0;
            transition: opacity 0.5s ease-in-out;
          }
          .combat-active .combat-bg {
            opacity: 1;
          }

          .combat-bg--cyberpunk {
            background: radial-gradient(ellipse 80% 80% at 50% 120%, rgba(22, 163, 74, 0.15), transparent),
                        radial-gradient(ellipse 50% 50% at 50% 120%, rgba(56, 189, 248, 0.2), transparent);
            background-color: #020617;
            background-image:
              linear-gradient(rgba(100, 255, 255, 0.1) 1px, transparent 1px),
              linear-gradient(90deg, rgba(100, 255, 255, 0.1) 1px, transparent 1px);
            background-size: 50px 50px;
            animation: grid-scroll 2s linear infinite;
          }
          .combat-bg--steampunk {
            background-color: #1a1a2e;
            background-image: radial-gradient(circle at 20% 20%, rgba(245, 158, 11, 0.1) 0%, transparent 40%),
                              radial-gradient(circle at 80% 70%, rgba(13, 148, 136, 0.1) 0%, transparent 40%);
            overflow: hidden;
          }
           .combat-bg--steampunk::before {
             content: '';
             position: absolute;
             inset: 0;
             background-image: url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%239C92AC' fill-opacity='0.05'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E");
             animation: fog-drift 20s linear infinite;
           }
          .combat-bg--post-apocalyptic {
            background-color: #261e19;
            background-image: radial-gradient(circle, rgba(130, 110, 90, 0.2) 0%, transparent 60%);
          }
          .combat-bg--post-apocalyptic::before {
             content: '';
             position: absolute;
             inset: 0;
             background-image: url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIxMDAiIGhlaWdodD0iMTAwIj48ZmlsdGVyIGlkPSJmIj48ZmVUdXJidWxlbmNlIHR5cGU9ImZyYWN0YWxOb2lzZSIgYmFzZUZyZXF1ZW5jeT0iLjIiIG51bU9jdGF2ZXM9IjEwIiAvPjxmZURpZmZ1c2VMaWdodGluZyBzdXJmYWNlU2NhbGU9IjEwIiBsaWdodGluZ0NvbG9yPSIjZmZmIiBkaWZmdXNlQ29uc3RhbnQ9IjEiPjxmZVBvaW50TGlnaHQgeD0iLTUwMDAiIHk9Ii0xMDAwMCIgej0iMTAwMDAiIC8+PC9mZURpZmZ1c2VMaWdodGluZz48L2ZpbHRlcj48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWx0ZXI9InVybCgjZikiIG9wYWNpdHk9IjAuMTUiLz48L3N2Zz4=');
             mix-blend-mode: overlay;
           }
        `}</style>
        
        <div className={`combat-bg ${worldView === 'cyberpunk_mythology' ? 'combat-bg--cyberpunk' : ''} ${worldView === 'steampunk_horror' ? 'combat-bg--steampunk' : ''} ${worldView === 'post_apocalyptic_fantasy' ? 'combat-bg--post-apocalyptic' : ''}`}></div>

        <div className={`transition-opacity duration-500 ${gameState === 'combat' ? 'combat-active' : ''}`}>
            <div className="animate-grid-scroll absolute inset-0 -z-10 h-full w-full bg-slate-900 bg-[linear-gradient(to_right,#8080800a_1px,transparent_1px),linear-gradient(to_bottom,#8080800a_1px,transparent_1px)] bg-[size:14px_24px]">
              <div className="animate-float-glow absolute left-0 right-0 top-0 -z-10 m-auto h-[310px] w-[310px] rounded-full bg-cyan-400/20 opacity-20 blur-[100px]"></div>
            </div>
        </div>

        <main className="flex flex-col items-center justify-center p-4 sm:p-6 md:p-8 min-h-screen relative z-10">
          {renderGameContent()}
        </main>
        <div className="fixed bottom-4 right-4 z-[100] flex flex-col gap-3">
          {notifications.map(notif => (
              <div key={notif.key} className="bg-slate-800 border border-cyan-500 rounded-lg shadow-2xl shadow-cyan-500/20 p-4 w-80 animate-slide-in-up">
                  <p className="font-bold text-amber-300">{notif.name.includes('事件') || notif.name.includes('裝備') || notif.name.includes('戰力') || notif.name.includes('連攜') ? notif.name : `🏆 成就解鎖！`}</p>
                  <p className="text-slate-100 font-semibold">{notif.name.includes('事件') || notif.name.includes('裝備') || notif.name.includes('戰力') || notif.name.includes('連攜') ? notif.description : notif.name}</p>
              </div>
          ))}
        </div>
    </div>
  );
};
