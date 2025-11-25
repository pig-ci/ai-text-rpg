import React, { useState, useEffect } from 'react';
import { Character, CharacterTemplate, WorldView } from '../types';
import { worldClasses } from '../data/classes';

interface CharacterCreationScreenProps {
  onCharacterCreate: (character: Omit<Character, 'worldView' | 'power' | 'skills' | 'equipment' | 'hp' | 'maxHp'>) => void;
  onBack: () => void;
  templates: CharacterTemplate[];
  onSaveTemplate: (character: Omit<Character, 'worldView' | 'power' | 'skills' | 'equipment' | 'hp' | 'maxHp'>) => void;
  onDeleteTemplate: (templateId: string) => void;
  worldView: WorldView;
}

const CharacterCreationScreen: React.FC<CharacterCreationScreenProps> = ({ 
  onCharacterCreate, onBack, templates, onSaveTemplate, onDeleteTemplate, worldView
}) => {
  const availableClasses = worldClasses[worldView];

  const [name, setName] = useState('');
  const [selectedClass, setSelectedClass] = useState(availableClasses[0]);
  const [backstory, setBackstory] = useState('');
  const [selectedTemplateId, setSelectedTemplateId] = useState<string>('');

  useEffect(() => {
    if (selectedTemplateId) {
      const template = templates.find(t => t.id === selectedTemplateId);
      if (template) {
        setName(template.name);
        setSelectedClass(template.class);
        setBackstory(template.backstory);
      }
    } else {
        setName('');
        setSelectedClass(availableClasses[0]);
        setBackstory('');
    }
  }, [selectedTemplateId, templates, availableClasses]);

  // When worldView changes, reset the selected class if it's not in the new available list
  useEffect(() => {
      if (!availableClasses.includes(selectedClass)) {
          setSelectedClass(availableClasses[0]);
      }
  }, [worldView, selectedClass, availableClasses]);


  const getCurrentCharacter = (): Omit<Character, 'worldView' | 'power' | 'skills' | 'equipment' | 'hp' | 'maxHp'> => ({
    name: name.trim(),
    class: selectedClass,
    backstory: backstory.trim(),
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (isFormValid) {
      onCharacterCreate(getCurrentCharacter());
    }
  };

  const isFormValid = name.trim() !== '' && backstory.trim() !== '' && backstory.trim().length >= 20;

  return (
    <div className="flex flex-col items-center justify-center flex-grow w-full max-w-2xl mx-auto animate-fade-in px-4">
      <h1 className="text-4xl font-black uppercase tracking-widest text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-indigo-500 mb-8">
        創建你的角色
      </h1>

      {templates.length > 0 && (
         <div className="w-full mb-6">
            <label htmlFor="template" className="block text-sm font-medium text-slate-300 mb-2">使用範本</label>
            <div className="flex gap-2">
              <select
                id="template"
                value={selectedTemplateId}
                onChange={(e) => setSelectedTemplateId(e.target.value)}
                className="flex-grow w-full bg-slate-800 border border-slate-600 rounded-md py-3 px-4 text-slate-100 focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 transition"
              >
                <option value="">-- 選擇一個範本 --</option>
                {templates.map(t => <option key={t.id} value={t.id}>{t.name} - {t.class}</option>)}
              </select>
              {selectedTemplateId && (
                <button
                  type="button"
                  onClick={() => {
                    onDeleteTemplate(selectedTemplateId);
                    setSelectedTemplateId('');
                  }}
                  className="bg-red-700 hover:bg-red-600 text-white font-semibold py-2 px-3 rounded-md transition-colors"
                >
                  刪除
                </button>
              )}
            </div>
          </div>
      )}

      <form onSubmit={handleSubmit} className="w-full space-y-6">
        <div>
          <label htmlFor="name" className="block text-sm font-medium text-slate-300 mb-2">角色姓名</label>
          <input
            type="text"
            id="name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full bg-slate-800 border border-slate-600 rounded-md py-3 px-4 text-slate-100 focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 transition"
            placeholder="例如：赤刃"
            required
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-300 mb-2">選擇職業</label>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {availableClasses.map((charClass) => (
              <button
                key={charClass}
                type="button"
                onClick={() => setSelectedClass(charClass)}
                className={`text-center py-3 px-2 rounded-md transition-all duration-200 border-2 ${
                  selectedClass === charClass
                    ? 'bg-cyan-500/80 border-cyan-400 text-white font-bold'
                    : 'bg-slate-700/80 border-slate-600 hover:bg-slate-600/80'
                }`}
              >
                {charClass}
              </button>
            ))}
          </div>
        </div>
        <div>
          <label htmlFor="backstory" className="block text-sm font-medium text-slate-300 mb-2">背景故事</label>
          <textarea
            id="backstory"
            value={backstory}
            onChange={(e) => setBackstory(e.target.value)}
            rows={5}
            className="w-full bg-slate-800 border border-slate-600 rounded-md py-3 px-4 text-slate-100 focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 transition"
            placeholder="你的角色來自哪裡？是什麼驅使著他們？（至少20個字）"
            required
            minLength={20}
          />
        </div>
        <div className="space-y-4">
           <button
            type="button"
            disabled={!isFormValid}
            onClick={() => onSaveTemplate(getCurrentCharacter())}
            className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-bold py-3 px-8 rounded-full transition-all duration-300 transform hover:scale-105 shadow-lg shadow-indigo-500/30 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
          >
            儲存為範本
          </button>
          <button
            type="submit"
            disabled={!isFormValid}
            className="w-full bg-gradient-to-r from-cyan-500 to-indigo-500 hover:from-cyan-400 hover:to-indigo-400 text-white font-bold py-4 px-10 rounded-full transition-all duration-300 transform hover:scale-105 shadow-lg shadow-cyan-500/40 text-lg uppercase tracking-wider disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
          >
            踏上旅程
          </button>
          <button
            type="button"
            onClick={onBack}
            className="w-full text-center text-slate-400 hover:text-cyan-300 transition-colors py-2"
          >
            返回主畫面
          </button>
        </div>
      </form>
    </div>
  );
};

export default CharacterCreationScreen;