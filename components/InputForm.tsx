
import React, { useState } from 'react';
import { Icons } from './Icons';
import { AnalysisRequest } from '../types';

interface InputFormProps {
  onSubmit: (data: AnalysisRequest, mode: 'simple' | 'advanced') => void;
  isLoading: boolean;
}

const InputForm: React.FC<InputFormProps> = ({ onSubmit, isLoading }) => {
  // Default mode changed to 'advanced' as requested
  const [mode, setMode] = useState<'simple' | 'advanced'>('advanced');
  const [idea, setIdea] = useState('');
  const [url, setUrl] = useState('');
  const [brandName, setBrandName] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!idea.trim()) return;
    
    onSubmit({ 
      idea, 
      url, 
      brandName,
    }, mode);
  };

  return (
    <div className="w-full max-w-4xl mx-auto bg-white rounded-3xl shadow-xl border border-indigo-50 relative overflow-hidden">
      <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500"></div>
      
      {/* Header & Mode Toggle */}
      <div className="p-8 md:p-10 pb-0 text-center">
        <h2 className="text-3xl font-bold text-slate-900 mb-3">브랜드 페르소나 구축</h2>
        <p className="text-slate-500 mb-8 leading-relaxed">
          추상적인 아이디어를 <span className="font-bold text-indigo-600">17가지 구체적 전략</span>과 <span className="font-bold text-fuchsia-600">Pomelli (Business DNA)</span>로 완벽하게 설계해드립니다.
        </p>
        
        <div className="inline-flex bg-slate-100 p-1 rounded-xl mb-6">
          <button
            onClick={() => setMode('simple')}
            className={`px-6 py-2 rounded-lg text-sm font-bold transition-all ${mode === 'simple' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
          >
            ⚡️ 간편 생성
          </button>
          <button
            onClick={() => setMode('advanced')}
            className={`px-6 py-2 rounded-lg text-sm font-bold transition-all ${mode === 'advanced' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
          >
            🛠️ 심층 기획 (Pro Mode)
          </button>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="p-8 md:p-10 pt-4 space-y-6">
        
        {/* Basic Information */}
        <div className="p-6 bg-slate-50 rounded-2xl border border-slate-100">
          <div className="grid grid-cols-1 gap-6">
             <div>
                <label className="block text-sm font-bold text-slate-700 mb-2 flex items-center gap-2">
                  <Icons.Lightbulb className="w-4 h-4 text-indigo-600" />
                  브랜드 아이디어 / 개념 (필수)
                </label>
                <textarea
                  value={idea}
                  onChange={(e) => setIdea(e.target.value)}
                  placeholder="친구들과 하루 종일 놀 수 있는 쾌적한 PC방.
또는, 도심 속에서 힐링할 수 있는 아늑한 만화카페.
또는, 퇴근 후 맛있는 안주와 술 한잔 기울이는 레트로 포차."
                  className="w-full h-40 px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all resize-none text-slate-700 placeholder-slate-400 bg-white leading-relaxed text-sm"
                  required
                />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-2 flex items-center gap-2">
                    <Icons.Tag className="w-4 h-4 text-purple-600" />
                    확정된 브랜드명 (선택)
                  </label>
                  <input
                    type="text"
                    value={brandName}
                    onChange={(e) => setBrandName(e.target.value)}
                    placeholder="예: 더 벙커 (The Bunker)"
                    className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all text-slate-700 placeholder-slate-400 bg-white"
                  />
                </div>
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-2 flex items-center gap-2">
                    <Icons.Globe className="w-4 h-4 text-blue-600" />
                    참고 URL (선택)
                  </label>
                  <input
                    type="url"
                    value={url}
                    onChange={(e) => setUrl(e.target.value)}
                    placeholder="https://example.com"
                    className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all text-slate-700 placeholder-slate-400 bg-white"
                  />
                </div>
            </div>
          </div>
        </div>

        {/* Advanced Mode Explanation */}
        {mode === 'advanced' && (
          <div className="animate-fade-in-up bg-indigo-50 p-6 rounded-2xl border border-indigo-100 flex flex-col md:flex-row gap-4 items-start">
             <div className="p-3 bg-indigo-100 rounded-full text-indigo-600 flex-shrink-0">
                <Icons.Users className="w-6 h-6" />
             </div>
             <div>
               <h3 className="text-lg font-bold text-indigo-900 mb-1">AI와 함께하는 심층 브랜드 설계</h3>
               <p className="text-indigo-700 text-sm leading-relaxed mb-3">
                 단순한 자동 생성이 아닙니다. 17가지 핵심 항목에 대해 AI가 던지는 날카로운 질문(Guide)에 답하며, 당신만의 독보적인 브랜드를 직접 완성해보세요.<br/>
                 마지막 단계에서 브랜드의 시각적 유전자, <strong>Pomelli (Business DNA)</strong>까지 도출됩니다.
               </p>
               <ul className="text-sm text-indigo-600 space-y-1 list-disc list-inside">
                 <li>1단계: 브랜드 기본 개념 입력</li>
                 <li>2단계: AI가 맞춤형 기획 질문 생성</li>
                 <li>3단계: 깊이 있는 고민과 입력으로 초안 완성</li>
                 <li>4단계: 최종 브랜드 전략 및 시각적 DNA 도출</li>
               </ul>
             </div>
          </div>
        )}

        <div className="pt-4">
          <button
            type="submit"
            disabled={isLoading || !idea.trim()}
            className={`w-full py-4 rounded-xl font-bold text-lg flex items-center justify-center gap-2 transition-all transform active:scale-[0.99] shadow-lg hover:shadow-xl
              ${isLoading || !idea.trim() 
                ? 'bg-slate-200 text-slate-400 cursor-not-allowed' 
                : 'bg-gradient-to-r from-indigo-600 to-indigo-700 text-white hover:from-indigo-700 hover:to-indigo-800'}`}
          >
            {isLoading ? (
              <>
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                {mode === 'simple' ? '분석 중...' : '워크숍 준비 중...'}
              </>
            ) : (
              <>
                {mode === 'simple' ? <Icons.Sparkles className="w-5 h-5" /> : <Icons.Briefcase className="w-5 h-5" />}
                {mode === 'simple' ? '브랜드 페르소나 바로 생성' : '항목별 페르소나 만들기 시작'}
              </>
            )}
          </button>
        </div>
      </form>
      <style>{`
        @keyframes fadeInUp {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-fade-in-up {
          animation: fadeInUp 0.4s ease-out forwards;
        }
      `}</style>
    </div>
  );
};

export default InputForm;
