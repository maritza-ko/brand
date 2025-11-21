import React, { useEffect, useState } from 'react';

const LoadingScreen: React.FC = () => {
  const [currentMsgIndex, setCurrentMsgIndex] = useState(0);
  
  const messages = [
    "브랜드의 핵심 가치를 분석하고 있습니다...",
    "경쟁사 대비 차별점을 탐색 중입니다...",
    "타겟 오디언스의 성향을 파악하고 있습니다...",
    "브랜드의 목소리(Tone & Manner)를 다듬고 있습니다...",
    "Nano Banana 엔진으로 시각적 아이덴티티를 생성 중입니다...",
    "전략 리포트를 작성하고 있습니다..."
  ];

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentMsgIndex((prev) => (prev + 1) % messages.length);
    }, 2500);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="fixed inset-0 bg-slate-900/90 backdrop-blur-sm z-50 flex flex-col items-center justify-center p-4">
      <div className="w-24 h-24 mb-8 relative">
        <div className="absolute inset-0 border-4 border-indigo-500/30 rounded-full"></div>
        <div className="absolute inset-0 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
        <div className="absolute inset-0 flex items-center justify-center">
           <span className="text-2xl">✨</span>
        </div>
      </div>
      
      <h3 className="text-2xl font-bold text-white mb-4 text-center transition-all duration-500">
        {messages[currentMsgIndex]}
      </h3>
      
      <div className="w-full max-w-xs bg-slate-700 rounded-full h-1.5 mt-4 overflow-hidden">
        <div className="h-full bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 animate-progress origin-left w-full"></div>
      </div>
      
      <style>{`
        @keyframes progress {
          0% { transform: scaleX(0); }
          100% { transform: scaleX(1); }
        }
        .animate-progress {
          animation: progress 15s cubic-bezier(0.4, 0, 0.2, 1) forwards;
        }
      `}</style>
    </div>
  );
};

export default LoadingScreen;