import { CharacterTemplate } from '../types';
import { getStartingSkills } from './skills';

export const defaultTemplates: CharacterTemplate[] = [
  {
    id: 'default-1',
    name: '零',
    class: '暗影駭客',
    backstory: '在霓虹閃爍的都市底層長大，依靠植入的「鬼魂」介面在數據之海中穿梭。他為一個神秘的組織「無面者」工作，直到一次任務出錯，他成了被追殺的目標。',
    power: 10,
    skills: getStartingSkills('暗影駭客'),
  },
  {
    id: 'default-2',
    name: '凱亞',
    class: '生化武士',
    backstory: '前巨型企業「天叢雲」的精英衛隊成員，全身超過60%被戰術義體取代。在一場被背叛的戰鬥中倖存下來後，她選擇了浪人的道路，尋找著失落的榮譽與復仇的對象。',
    power: 12,
    skills: getStartingSkills('生化武士'),
  },
  {
    id: 'default-3',
    name: '瑪雅',
    class: '廢土遊俠',
    backstory: '出生於大崩壞後的輻射廢土，與她的機械獵隼「鋼眼」相依為命。她熟悉每一寸被遺忘的土地，依靠拾荒和導航維生，同時守護著一個關於舊世界綠洲的秘密。',
    power: 8,
    skills: getStartingSkills('廢土遊俠'),
  },
];
