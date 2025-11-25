import React from 'react';
import { Achievement } from '../types';

interface AchievementsScreenProps {
  allAchievements: Achievement[];
  unlockedIds: Set<string>;
  onBack: () => void;
}

const AchievementsScreen: React.FC<AchievementsScreenProps> = ({ allAchievements, unlockedIds, onBack }) => {
  const unlockedCount = unlockedIds.size;
  const totalCount = allAchievements.length;

  return (
    <div className="flex flex-col items-center justify-center flex-grow w-full max-w-3xl mx-auto animate-fade-in px-4">
      <h1 className="text-4xl font-black uppercase tracking-widest text-transparent bg-clip-text bg-gradient-to-r from-amber-400 to-orange-500 mb-4">
        遊戲成就
      </h1>
      <p className="text-slate-300 mb-8">{`已解鎖 ${unlockedCount} / ${totalCount}`}</p>
      
      <div className="w-full space-y-3 max-h-[60vh] overflow-y-auto pr-2">
        {allAchievements.map(ach => {
          const isUnlocked = unlockedIds.has(ach.id);
          return (
            <div key={ach.id} className={`p-4 rounded-lg border flex items-center gap-4 transition-all duration-300 ${
              isUnlocked 
                ? 'bg-slate-800/80 border-cyan-500/50' 
                : 'bg-slate-900/50 border-slate-700'
            }`}>
              <div className={`text-4xl transition-opacity duration-500 ${isUnlocked ? 'opacity-100' : 'opacity-30'}`}>
                {isUnlocked ? '🏆' : '🔒'}
              </div>
              <div>
                <h3 className={`font-bold text-lg ${isUnlocked ? 'text-amber-300' : 'text-slate-400'}`}>
                  {isUnlocked ? ach.name : '？？？'}
                </h3>
                <p className={`text-sm ${isUnlocked ? 'text-slate-300' : 'text-slate-500'}`}>
                  {ach.description}
                </p>
              </div>
            </div>
          );
        })}
      </div>
      
      <button onClick={onBack} className="mt-8 bg-slate-700 hover:bg-slate-600 text-slate-200 font-bold py-3 px-8 rounded-full transition-all">
        返回主畫面
      </button>
    </div>
  );
};

export default AchievementsScreen;
