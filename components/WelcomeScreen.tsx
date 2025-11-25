import React, { useRef } from 'react';

interface WelcomeScreenProps {
  onStart: () => void;
  onLoad: () => void;
  onShowAchievements: () => void;
  hasSaves: boolean;
  onImportFile: (file: File) => void;
  onExportData: () => void;
  hasDataToExport: boolean;
}

const WelcomeScreen: React.FC<WelcomeScreenProps> = ({ onStart, onLoad, onShowAchievements, hasSaves, onImportFile, onExportData, hasDataToExport }) => {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    onImportFile(file);
    
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <div className="flex flex-col items-center justify-center text-center flex-grow">
      <style>{`
        @keyframes typing {
          from { width: 0; }
          to { width: 100%; }
        }
        @keyframes blink-caret {
          from, to { border-color: transparent; }
          50% { border-color: #67e8f9; }
        }
        .typing-effect {
          overflow: hidden;
          white-space: nowrap;
          border-right: .15em solid #67e8f9;
          animation: typing 2.5s steps(20, end), blink-caret .75s step-end infinite;
        }
        
        @keyframes scanline {
            0% { transform: translateY(0); }
            100% { transform: translateY(100%); }
        }
        .scanline {
            position: absolute;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            width: 100%;
            height: 100%;
            background: linear-gradient(to bottom, rgba(255,255,255,0), rgba(255,255,255,0.02) 50%, rgba(255,255,255,0));
            opacity: 0.4;
            animation: scanline 8s linear infinite;
            pointer-events: none;
        }

        @keyframes noise {
            0%, 100% { opacity: 0.1; }
            20% { opacity: 0.15; }
            40% { opacity: 0.12; }
            60% { opacity: 0.18; }
            80% { opacity: 0.1; }
        }
        .noise {
            position: absolute;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 800 600' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E");
            animation: noise 1s steps(5, end) infinite;
            pointer-events: none;
        }

        @keyframes fade-in-delay {
            from { opacity: 0; transform: translateY(20px); }
            to { opacity: 1; transform: translateY(0); }
        }
        .fade-in-delay {
            opacity: 0;
            animation: fade-in-delay 0.8s ease-out 2.5s forwards;
        }
      `}</style>
      <div className="relative mb-4 w-full max-w-2xl md:max-w-4xl">
         <h1 className="typing-effect text-5xl md:text-7xl font-black uppercase tracking-widest text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-indigo-500 mx-auto inline-block">
            文字冒險 RPG
        </h1>
        <div className="scanline"></div>
        <div className="noise"></div>
      </div>
     
      <div className="fade-in-delay w-full">
        <p className="max-w-2xl mx-auto text-slate-300 text-lg md:text-xl mb-10">
          歡迎來到一個由 AI 驅動的世界。在這裡，你的每一個選擇都將開闢一條新的道路，編織出一段獨一無二的傳奇。準備好開始你的冒險了嗎？
        </p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <button
            onClick={onStart}
            className="bg-gradient-to-r from-cyan-500 to-indigo-500 hover:from-cyan-400 hover:to-indigo-400 text-white font-bold py-4 px-10 rounded-full transition-all duration-300 transform hover:scale-105 shadow-lg shadow-cyan-500/40 text-lg uppercase tracking-wider"
          >
            選擇世界觀
          </button>
          <button
            onClick={onLoad}
            disabled={!hasSaves}
            className="bg-slate-700 hover:bg-slate-600 text-slate-200 font-bold py-4 px-10 rounded-full transition-all duration-300 transform hover:scale-105 shadow-lg shadow-slate-700/40 text-lg uppercase tracking-wider disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
          >
            讀取紀錄
          </button>
        </div>
        <div className="mt-4 flex flex-col sm:flex-row gap-4 justify-center">
           <input
              type="file"
              accept=".json"
              ref={fileInputRef}
              onChange={handleFileSelect}
              className="hidden"
              id="import-file-welcome"
            />
            <label
              htmlFor="import-file-welcome"
              className="cursor-pointer text-center bg-slate-700/80 hover:bg-slate-600/80 text-slate-300 font-bold py-3 px-6 rounded-full transition-all duration-300 transform hover:scale-105"
            >
              匯入資料
            </label>
            <button
              onClick={onExportData}
              disabled={!hasDataToExport}
              className="bg-slate-700/80 hover:bg-slate-600/80 text-slate-300 font-bold py-3 px-6 rounded-full transition-all duration-300 transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
            >
              匯出資料
            </button>
        </div>
        <div className="mt-6">
            <button
                onClick={onShowAchievements}
                className="text-slate-400 hover:text-cyan-300 transition-colors font-semibold py-2 px-4"
            >
                查看遊戲成就
            </button>
        </div>
      </div>
    </div>
  );
};

export default WelcomeScreen;