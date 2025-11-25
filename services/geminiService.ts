import { GoogleGenAI, Type } from "@google/genai";
import { StorySegment, Character, CombatEncounter, Equipment } from '../types';

// Assume process.env.API_KEY is available in the environment
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

const equipmentSchema = {
  type: Type.OBJECT,
  properties: {
    id: { type: Type.STRING, description: "裝備的唯一ID，格式為 'world-type-name'，例如 'cyber-weapon-katana'。" },
    name: { type: Type.STRING, description: "裝備的名稱（繁體中文）。" },
    description: { type: Type.STRING, description: "裝備的簡短描述（繁體中文）。" },
    type: { type: Type.STRING, description: "裝備類型。可選值：'weapon', 'armor', 'accessory'。" },
    worldView: { type: Type.STRING, description: "裝備所屬的世界觀。"},
    powerBonus: { type: Type.NUMBER, description: "裝備提供的戰力加成。如果沒有，則省略。" },
    grantedSkill: {
      type: Type.OBJECT,
      description: "裝備賦予的技能。如果沒有，則省略。",
      properties: {
        id: { type: Type.STRING, description: "技能的唯一ID。" },
        name: { type: Type.STRING, description: "技能的名稱（繁體中文）。" },
        description: { type: Type.STRING, description: "技能的簡短描述（繁體中文）。" },
      },
      required: ["id", "name", "description"]
    }
  },
  required: ["id", "name", "description", "type", "worldView"]
};

const storySegmentSchema = {
  type: Type.OBJECT,
  properties: {
    situation: { 
      type: Type.STRING, 
      description: "用引人入勝的風格，以繁體中文描述目前遊戲中的情境。請務必將玩家的角色資訊自然地融入敘述中。如果接下來是戰鬥，這裡的描述應是遭遇敵人、戰鬥即將開始的氛圍。**請務必、積極地使用 Markdown 格式來增強表現力**。例如：用 `# 地點名稱` 或 `## 場景標題` 來組織段落、用 `**關鍵字**` 強調重要動作或物體、用 `*內心獨白或特殊聲音*` 增加沉浸感、用項目符號清單 `- 細節一\\n- 細節二` 來列出觀察到的事物或物品。如果觸發了世界特定的隱藏事件，請在此處的任意位置單獨插入標記 `[HIDDEN_EVENT_TRIGGERED]`。"
    },
    choices: {
      type: Type.ARRAY,
      description: "提供3個簡潔且清晰的行動選項（繁體中文），這些選項應基於你對後續劇情的策略性思考，每個選項都應導向一個獨特的分支。如果當前是戰鬥結束後的場景，選項應反映戰鬥後的狀態。",
      items: { type: Type.STRING },
    },
    isEnd: { 
      type: Type.BOOLEAN, 
      description: "如果故事在此處達到一個明確的結局（無論好壞），則設為 true。如果故事應繼續，則設為 false。" 
    },
    combatEncounter: {
      type: Type.OBJECT,
      description: "如果當前情境觸發了一場戰鬥，請設定此物件。如果沒有戰鬥，請省略此欄位。",
      properties: {
        enemyName: { type: Type.STRING, description: "敵人的名稱。" },
        enemyPower: { type: Type.NUMBER, description: "敵人的戰力值。請根據玩家的當前戰力來設定一個具有挑戰性但公平的數值。" },
        abilities: {
          type: Type.ARRAY,
          description: "為敵人賦予 0 至 2 個特殊能力，讓戰鬥更多樣化。如果沒有特殊能力，請提供一個空陣列 `[]` 或省略此欄位。",
          items: {
            type: Type.OBJECT,
            properties: {
              id: { 
                type: Type.STRING, 
                description: "能力的唯一識別碼。可選值：'SHIELD'（護盾）, 'POISON'（中毒）, 'POWER_DRAIN'（戰力吸取）, 'WEAKEN'（弱化攻擊）, 'REGENERATE'（再生）, 'EMP'（電磁脈衝）。"
              },
              name: { type: Type.STRING, description: "能力的名稱（繁體中文）。" },
              description: { type: Type.STRING, description: "能力的簡短描述（繁體中文）。" }
            },
            required: ["id", "name", "description"]
          }
        }
      },
      required: ["enemyName", "enemyPower"],
    },
    reward: {
        type: Type.OBJECT,
        description: "當玩家完成挑戰或達成特定條件時，可以提供獎勵。如果沒有獎勵，請省略此欄位。",
        properties: {
            equipment: equipmentSchema,
            power: { type: Type.NUMBER, description: "給予玩家的永久戰力提升點數。" }
        }
    }
  },
  required: ["situation", "choices", "isEnd"],
};

const getWorldDescription = (worldView: Character['worldView']): string => {
    switch(worldView) {
        case 'cyberpunk_mythology':
            return `遊戲背景是一個融合了賽博龐克與古老神話的奇幻世界。
隱藏事件：在這個世界中，存在數個極其罕見的隱藏事件。如果時機自然成熟，你可以從下列事件中選擇一個最適合當前劇情的來自然地觸發：
- 數據神祇：玩家在數據洪流中意外發現一個通往「數位英靈殿」的古老節點。
- AI 幽魂：玩家遭遇一個活在舊時代網路廢墟中，已產生自我意識的「覺醒 AI」。
當你決定觸發任一事件時，請務必在 'situation' 文本中加入 '[HIDDEN_EVENT_TRIGGERED]' 標記。
裝備範例：'單分子太刀' (weapon, +3 power), '神經介面' (accessory, 賦予'目標分析'技能), '克維拉編織背心' (armor, +2 power)。`;
        case 'steampunk_horror':
            return `遊戲背景是一個融合了蒸氣龐克與洛夫克拉夫特式宇宙恐怖的黑暗世界。
隱藏事件：在這個世界中，存在數個極其罕見的隱藏事件。如果時機自然成熟，你可以從下列事件中選擇一個最適合當前劇情的來自然地觸發：
- 窺見外神：玩家在修理古老發條裝置時，無意中解開了窺見「外神」存在的瘋狂謎題。
- 詭異教團：玩家偶然撞見一個崇拜機械實體的「黃銅之血教團」正在舉行的秘密儀式。
當你決定觸發任一事件時，請務必在 'situation' 文本中加入 '[HIDDEN_EVENT_TRIGGERED]' 標記。
裝備範例：'乙太動力步槍' (weapon, +3 power), '發條僕從' (accessory, 賦予'修復'技能), '黃銅板甲' (armor, +2 power)。`;
        case 'post_apocalyptic_fantasy':
            return `遊戲背景是一個在科技文明崩毀百年後，魔法重回大地的後末日奇幻世界。變異野獸在鋼鐵廢墟中徘徊，輻射與符文交織出奇異的傳說。
隱藏事件：在這個世界中，存在數個極其罕見的隱藏事件。如果時機自然成熟，你可以從下列事件中選擇一個最適合當前劇情的來自然地觸發：
- 晶體花園：玩家在致命的輻射區深處，發現一個由輻射能量孕育而生，美麗卻充滿危險的「晶體花園」。
- 天空之城：玩家找到一張古老的地圖，指向一座傳說中在大崩壞時墜落的「天空之城」的殘骸位置。
當你決定觸發任一事件時，請務必在 'situation' 文本中加入 '[HIDDEN_EVENT_TRIGGERED]' 標記。
裝備範例：'輻射戰斧' (weapon, +3 power), '突變腺體' (accessory, 賦予'再生'技能), '廢金屬肩甲' (armor, +2 power)。`;
        default:
            return '遊戲背景是一個充滿謎團的世界。';
    }
}

const getPrompt = (character: Character, history: string[], playerChoice: string | null): string => {
    const characterInfo = `
---
玩家角色資訊：
- 姓名：${character.name}
- 職業：${character.class}
- 背景故事：${character.backstory}
- 目前世界：${character.worldView}
- **目前基礎戰力：${character.power}** (HP 會由此自動計算)
- **目前裝備：**
  - 武器: ${character.equipment.weapon?.name || '無'}
  - 護甲: ${character.equipment.armor?.name || '無'}
  - 飾品: ${character.equipment.accessory?.name || '無'}
---
請在遊戲敘述中巧妙地運用這些資訊，讓故事更具個人化。例如，NPC可以稱呼玩家的名字，玩家的職業或背景可能會影響他們遇到的情境或解決問題的方式。
`;

    const worldInfo = getWorldDescription(character.worldView);

    const intro = `你是一位卓越的文字冒險遊戲大師（Game Master），擅長創造具有深度和分支的個人化敘事。
${worldInfo}

**獎勵系統**：
- 在玩家完成重大挑戰、擊敗強大敵人或探索隱密區域後，你可以給予獎勵。
- 獎勵可以是永久的戰力提升 (reward.power)，或是強大的裝備 (reward.equipment)。
- 給予的裝備必須符合當前的世界觀，並感覺像是應得的獎勵，而非隨處可見。請不要頻繁地給予裝備。

**秘密彩蛋**：
- 在**極其罕見**且荒謬或出乎意料的情況下（例如，玩家做出了非常愚蠢或完全不合邏輯的選擇），你可以獎勵玩家一件名為「黃瓜」的無用飾品。
- **黃瓜物品資料**：{ id: 'misc-cucumber', name: '黃瓜', description: '一根普通的黃瓜。清脆爽口。沒有任何實際作用。', type: 'accessory', worldView: '${character.worldView}' }。
- 當你決定給予此物品時，請不要在故事中解釋原因，讓它顯得神秘而無厘頭。

**技能連攜系統**：
- 玩家可以透過組合特定的技能（無論是天生的還是來自裝備）來觸發額外的戰鬥加成。你不需要直接生成這些加成，但請知曉這個機制的存在。

**戰鬥系統**：
- 戰鬥是多回合的，HP 會由客戶端根據戰力計算。你只需要設定敵人的**基礎戰力 (enemyPower)**。
- 當你決定觸發戰鬥時，請在 JSON 回應中填寫 'combatEncounter' 欄位。
- 敵人的戰力 (enemyPower) 應該根據玩家的當前戰力 (${character.power}) 來平衡。一場普通難度的戰鬥，敵人戰力應約為玩家戰力的 80% 到 120%。對於 Boss 戰，可以提升至 130% - 150%。
- 觸發戰鬥前的情境 (situation) 應該清楚地描述遭遇的敵人。
- **敵人特殊能力**：你可以為敵人賦予 0 至 2 個特殊能力，讓戰鬥更有趣。請根據世界觀選擇適合的能力：
  - **賽博神話 (cyberpunk_mythology)**：'EMP' (電磁脈衝，使玩家一個技能暫時失效), 'SHIELD' (數據護盾，抵擋部分傷害), 'POWER_DRAIN' (系統腐化，吸取玩家戰力)。
  - **蒸氣恐怖 (steampunk_horror)**：'WEAKEN' (瘋狂低語，降低玩家攻擊力), 'SHIELD' (黃銅護甲，抵擋大量傷害), 'POISON' (毒性蒸汽，玩家會持續損失戰力)。
  - **廢土奇譚 (post_apocalyptic_fantasy)**：'REGENERATE' (突變再生，敵人會恢復戰力), 'POISON' (劇毒撕咬，使玩家中毒), 'WEAKEN' (輻射靈氣，降低玩家攻擊力)。
- 請在 JSON 的 'abilities' 欄位中提供能力的 id, name 和 description。

你的思考與回應流程如下：
1.  **策略性思考**：在撰寫任何內容之前，請先在腦中構思接下來可能的三個分支劇情。為每個分支都想一個獨特且有趣的發展方向。這一步是為了確保你提供的選項都是有意義且能引導故事走向不同道路的。
2.  **撰寫當前情境**：根據玩家的角色資訊、遊戲歷史和玩家的最新選擇，以生動、富有想像力的文筆，用繁體中文描述接下來發生的事情。將你的策略性思考融入敘述中，巧妙地引導至你設計好的分支點。**請務必使用 Markdown 格式來豐富文本**，例如使用標題、粗體、斜體和清單。
3.  **提供選項**：根據你構思好的三個分支，提供3個（不多不少）簡潔且清晰的行動選項讓玩家抉擇。
4.  **判斷結局**：如果故事在此處達到一個自然的结局，將 'isEnd' 設為 true。`;

    const historyLog = history.length > 0 
      ? history.join('\n') 
      : `遊戲剛開始。這是玩家的角色資訊，請以此為基礎，創造一個引人入勝的開場。並在腦中構思好後續的三個可能發展方向，然後提供對應的選項。`;

    const choiceLog = playerChoice 
      ? `\n玩家的最新選擇是：「${playerChoice}」。請根據這個選擇繼續故事。` 
      : '';

    return `${intro}
${characterInfo}
---
遊戲歷史：
${historyLog}
${choiceLog}
---

請嚴格按照指定的 JSON 格式輸出你的回應。`;
}


export const generateStorySegment = async (character: Character, history: string[], playerChoice: string | null): Promise<StorySegment> => {
  const prompt = getPrompt(character, history, playerChoice);
  
  const response = await ai.models.generateContent({
    model: "gemini-flash-lite-latest",
    contents: prompt,
    config: {
      responseMimeType: "application/json",
      responseSchema: storySegmentSchema,
      temperature: 0.9,
      topP: 0.95,
    },
  });

  const jsonText = response.text.trim();
  try {
    const segment = JSON.parse(jsonText) as StorySegment;
    // Ensure there are at most 3 choices as requested in the prompt
    if (Array.isArray(segment.choices) && segment.choices.length > 3) {
        segment.choices = segment.choices.slice(0, 3);
    }
    return segment;
  } catch (e) {
    console.error("Failed to parse JSON response:", jsonText);
    throw new Error("從 API 收到的 JSON 格式無效。");
  }
};
