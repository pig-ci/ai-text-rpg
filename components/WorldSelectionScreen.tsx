import React from 'react';
import { WorldView } from '../types';

interface WorldSelectionScreenProps {
  onSelect: (world: WorldView) => void;
  onBack: () => void;
}

const worlds: { id: WorldView; name: string; description: string; gradient: string }[] = [
  {
    id: 'cyberpunk_mythology',
    name: '賽博神話',
    description: '霓虹燈下的都市叢林與古老神祇的低語交織。在高科技與古老傳說的碰撞中，尋找你的天命。',
    gradient: 'from-cyan-500 to-indigo-600',
  },
  {
    id: 'steampunk_horror',
    name: '蒸氣恐怖',
    description: '齒輪與發條驅動的城市裡，瘋狂的低語從黑暗的巷弄和星辰之間傳來。在煤灰與謎團中，守住你的理智。',
    gradient: 'from-gray-600 to-amber-900',
  },
  {
    id: 'post_apocalyptic_fantasy',
    name: '廢土奇譚',
    description: '科技文明崩毀百年後，魔法重回大地。在變異野獸徘徊的鋼鐵廢墟中，探索輻射與符文交織的傳說。',
    gradient: 'from-emerald-600 to-yellow-700',
  },
];

const WorldSelectionScreen: React.FC<WorldSelectionScreenProps> = ({ onSelect, onBack }) => {
  return (
    <div className="flex flex-col items-center justify-center flex-grow w-full max-w-4xl mx-auto animate-fade-in px-4">
      <h1 className="text-4xl font-black uppercase tracking-widest text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-indigo-500 mb-8">
        選擇你的世界
      </h1>
      <p className="text-slate-300 mb-10 text-center max-w-2xl">每個世界都有獨特的氛圍、故事線，以及一個極其罕見的隱藏事件。你的選擇將決定冒險的基調。</p>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 w-full">
        {worlds.map((world) => (
          <div
            key={world.id}
            className={`group relative p-8 rounded-lg border-2 border-slate-700 bg-slate-800/50 flex flex-col text-center transition-all duration-300 hover:border-cyan-400 hover:scale-105 cursor-pointer`}
            onClick={() => onSelect(world.id)}
          >
            <div className={`absolute -top-3 -left-3 -right-3 -bottom-3 bg-gradient-to-br ${world.gradient} rounded-lg blur opacity-0 group-hover:opacity-20 transition-opacity duration-300`}></div>
            <h2 className="text-3xl font-bold text-slate-100 mb-3">{world.name}</h2>
            <p className="text-slate-300 flex-grow">{world.description}</p>
            <button className="mt-6 w-full bg-slate-700 group-hover:bg-cyan-600 text-white font-bold py-3 px-6 rounded-full transition-colors duration-300">
              進入此世界
            </button>
          </div>
        ))}
      </div>

      <button onClick={onBack} className="mt-12 text-slate-400 hover:text-cyan-300 transition-colors">
        返回主畫面
      </button>
    </div>
  );
};

export default WorldSelectionScreen;
