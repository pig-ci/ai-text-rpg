import React from 'react';

interface LoadingScreenProps {
  message: string;
}

const LoadingSpinner: React.FC = () => (
  <div className="relative h-24 w-24">
    <div className="absolute inset-0 rounded-full border-4 border-cyan-500 border-t-transparent animate-spin"></div>
    <div className="absolute inset-2 rounded-full border-4 border-indigo-500 border-t-transparent animate-spin-slow"></div>
    <div className="absolute inset-4 rounded-full border-4 border-slate-600"></div>
  </div>
);

const LoadingScreen: React.FC<LoadingScreenProps> = ({ message }) => {
  return (
    <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-md flex flex-col items-center justify-center z-50 animate-fade-in">
      <style>{`
        @keyframes spin-slow {
          from { transform: rotate(0deg); }
          to { transform: rotate(-360deg); }
        }
        .animate-spin-slow {
          animation: spin-slow 3s linear infinite;
        }
        @keyframes fade-in {
            from { opacity: 0; }
            to { opacity: 1; }
        }
        .animate-fade-in {
            animation: fade-in 0.5s ease-in-out;
        }
      `}</style>
      <LoadingSpinner />
      <p className="mt-8 text-xl text-slate-200 tracking-widest">{message || '載入中...'}</p>
    </div>
  );
};

export default LoadingScreen;