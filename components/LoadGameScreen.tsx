import React from 'react';
import { SaveData, Character, CharacterTemplate } from '../types';

interface LoadGameScreenProps {
  saves: SaveData[];
  templates: CharacterTemplate[];
  onLoad: (saveId: string) => void;
  onUseTemplate: (character: Character) => void;
  onDelete: (saveId: string) => void;
  onBack: () => void;
}

const LoadGameScreen: React.FC<LoadGameScreenProps> = ({ saves, templates, onLoad, onUseTemplate, onDelete, onBack }) => {
  return (
    <div className="flex flex-col items-center justify-center flex-grow w-full max-w-3xl mx-auto animate-fade-in px-4">
      <h1 className="text-4xl font-black uppercase tracking-widest text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-indigo-500 mb-8">
        讀取進度
      </h1>

      {saves.length === 0 ? (
        <p className="text-slate-300">沒有任何儲存的紀錄。</p>
      ) : (
        <div className="w-full space-y-4 max-h-[60vh] overflow-y-auto pr-2">
          {saves.map((save) => (
            <div key={save.id} className="bg-slate-800/70 p-4 rounded-lg border border-slate-700 flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="flex-grow text-center sm:text-left">
                <p className="font-bold text-lg text-cyan-300">
                  <span className={`mr-2 text-sm font-semibold ${save.saveType === 'auto' ? 'text-amber-400' : 'text-indigo-400'}`}>
                    [{save.saveType === 'auto' ? '自動儲存' : '手動儲存'}]
                  </span>
                  {save.character.name} - <span className="text-base text-slate-300">{save.character.class} (戰力: {save.character.power})</span>
                </p>
                <p className="text-xs text-slate-400">儲存於: {new Date(save.timestamp).toLocaleString('zh-TW')}</p>
              </div>
              <div className="flex flex-wrap justify-center gap-2">
                <button onClick={() => onLoad(save.id)} className="text-sm bg-cyan-600 hover:bg-cyan-500 text-white font-semibold py-2 px-3 rounded-md transition-colors">繼續冒險</button>
                <button onClick={() => onUseTemplate(save.character)} className="text-sm bg-indigo-600 hover:bg-indigo-500 text-white font-semibold py-2 px-3 rounded-md transition-colors">以此角色開始新遊戲</button>
                <button onClick={() => onDelete(save.id)} className="text-sm bg-red-700 hover:bg-red-600 text-white font-semibold py-2 px-3 rounded-md transition-colors">刪除</button>
              </div>
            </div>
          ))}
        </div>
      )}
      <button onClick={onBack} className="mt-8 bg-slate-700 hover:bg-slate-600 text-slate-200 font-bold py-3 px-8 rounded-full transition-all">
        返回主畫面
      </button>
    </div>
  );
};

export default LoadGameScreen;