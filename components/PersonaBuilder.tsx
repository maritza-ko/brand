
import React, { useState, useEffect, useRef } from 'react';
import { Icons } from './Icons';
import {
  BuilderState,
  PersonaFieldKey,
  FIELD_METADATA,
  FieldState
} from '../types';
import { generateFieldDraft } from '../services/geminiService';

interface PersonaBuilderProps {
  idea: string;
  guides: Record<string, string[]>;
  initialBrandName?: string;
  onComplete: (finalState: BuilderState) => void;
  apiKey?: string;
}

const PersonaBuilder: React.FC<PersonaBuilderProps> = ({ idea, guides, initialBrandName, onComplete, apiKey }) => {
  const [builderState, setBuilderState] = useState<BuilderState>({} as BuilderState);
  const [expandedField, setExpandedField] = useState<PersonaFieldKey | null>(null);

  // Array of strings for 3 answers
  const [currentUserInputs, setCurrentUserInputs] = useState<string[]>(["", "", ""]);

  const [isGenerating, setIsGenerating] = useState(false);

  // Refs to scroll items into view
  const itemRefs = useRef<(HTMLDivElement | null)[]>([]);

  // Initialize builder state
  useEffect(() => {
    if (Object.keys(builderState).length === 0) {
      const initial: BuilderState = {} as BuilderState;
      FIELD_METADATA.forEach(field => {
        let initialDraft = "";
        let initialFinalized = false;

        if (field.key === 'brandName' && initialBrandName) {
          initialDraft = initialBrandName;
          initialFinalized = true;
        }

        initial[field.key] = {
          draft: initialDraft,
          userInputs: field.key === 'brandName' && initialBrandName ? [`확정된 이름: ${initialBrandName}`, "", ""] : ["", "", ""],
          history: [],
          isFinalized: initialFinalized,
          isLoading: false
        };
      });
      setBuilderState(initial);

      // If brand name provided, jump to next, else start at brandName
      if (initialBrandName) {
        setExpandedField('philosophy');
      } else {
        setExpandedField('brandName');
      }
    }
  }, []);

  // Auto-scroll and load inputs when expandedField changes
  useEffect(() => {
    if (expandedField) {
      const index = FIELD_METADATA.findIndex(f => f.key === expandedField);
      if (index !== -1 && itemRefs.current[index]) {
        // Load saved inputs for this field
        const savedInputs = builderState[expandedField]?.userInputs;
        if (savedInputs && Array.isArray(savedInputs) && savedInputs.length === 3) {
          setCurrentUserInputs(savedInputs);
        } else {
          setCurrentUserInputs(["", "", ""]);
        }

        // Delay slightly to allow accordion animation to start
        setTimeout(() => {
          itemRefs.current[index]?.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }, 200);
      }
    }
  }, [expandedField]);

  const handleExpand = (key: PersonaFieldKey) => {
    if (expandedField === key) {
      setExpandedField(null);
    } else {
      setExpandedField(key);
    }
  };

  const handleInputChange = (index: number, value: string) => {
    const newInputs = [...currentUserInputs];
    newInputs[index] = value;
    setCurrentUserInputs(newInputs);
  };

  const handleGenerateDraft = async (key: PersonaFieldKey) => {
    // Check if at least one input has content
    if (currentUserInputs.every(input => !input.trim())) return;

    setBuilderState(prev => ({
      ...prev,
      [key]: { ...prev[key], isLoading: true, userInputs: currentUserInputs }
    }));
    setIsGenerating(true);

    try {
      // Current Brand Name context
      let currentBrandName = initialBrandName;
      if (!currentBrandName && builderState['brandName']?.isFinalized) {
        currentBrandName = builderState['brandName'].draft;
      }

      const context = Object.entries(builderState)
        .map(([k, v]) => [k, v] as [string, FieldState])
        .filter(([k, v]) => v.isFinalized && v.draft)
        .map(([k, v]) => `${k}: ${v.draft}`)
        .join("\n");

      // Pass the guides for this key so we can map Question -> Answer
      const currentGuides = guides[key] || ["가이드 질문 1", "가이드 질문 2", "가이드 질문 3"];

      // Call service with array inputs
      const draft = await generateFieldDraft(key, idea, currentUserInputs, currentGuides, context, currentBrandName, apiKey);

      setBuilderState(prev => ({
        ...prev,
        [key]: {
          ...prev[key],
          draft: draft,
          userInputs: currentUserInputs,
          history: [...prev[key].history, draft],
          isLoading: false,
          isFinalized: true
        }
      }));

      // Auto-Advance Logic
      const currentIndex = FIELD_METADATA.findIndex(f => f.key === key);
      if (currentIndex !== -1 && currentIndex < FIELD_METADATA.length - 1) {
        const nextField = FIELD_METADATA[currentIndex + 1];
        setTimeout(() => {
          setExpandedField(nextField.key);
        }, 800);
      }

    } catch (e) {
      console.error(e);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleRefine = (key: PersonaFieldKey) => {
    setBuilderState(prev => ({
      ...prev,
      [key]: { ...prev[key], isFinalized: false }
    }));
  };

  const completedCount = Object.values(builderState).filter(s => (s as FieldState).isFinalized).length;
  const totalCount = FIELD_METADATA.length;
  const progress = Math.round((completedCount / totalCount) * 100);

  return (
    <div className="w-full max-w-5xl mx-auto pb-20">
      {/* Progress Header */}
      <div className="sticky top-16 z-20 bg-white/90 backdrop-blur-md border-b border-slate-200 mb-6 px-4 py-4 rounded-b-2xl shadow-sm">
        <div className="flex justify-between items-center mb-2">
          <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
            <Icons.Briefcase className="w-5 h-5 text-indigo-600" />
            브랜드 페르소나 워크숍
          </h2>
          <span className="text-sm font-bold text-indigo-600">{progress}% 완성</span>
        </div>
        <div className="w-full bg-slate-100 rounded-full h-2.5">
          <div className="bg-indigo-600 h-2.5 rounded-full transition-all duration-500" style={{ width: `${progress}%` }}></div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        <div className="lg:col-span-12 space-y-4">
          {FIELD_METADATA.map((field, index) => {
            const state = builderState[field.key];
            const isOpen = expandedField === field.key;
            const fieldGuides = guides[field.key] || ["기획 가이드 1", "기획 가이드 2", "기획 가이드 3"];
            const isDone = state?.isFinalized;

            return (
              <div
                key={field.key}
                ref={el => { itemRefs.current[index] = el; }}
                className={`bg-white rounded-2xl border transition-all duration-300 overflow-hidden ${isOpen ? 'border-indigo-500 shadow-md ring-1 ring-indigo-100' : 'border-slate-200 hover:border-indigo-300'}`}
              >
                <button
                  onClick={() => handleExpand(field.key)}
                  className="w-full px-6 py-4 flex items-center justify-between bg-white hover:bg-slate-50 transition-colors text-left"
                >
                  <div className="flex items-center gap-4">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold border ${isDone ? 'bg-green-100 text-green-600 border-green-200' : 'bg-slate-100 text-slate-500 border-slate-200'}`}>
                      {isDone ? <Icons.ShieldCheck className="w-4 h-4" /> : index + 1}
                    </div>
                    <div>
                      <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">{field.category}</span>
                      <h3 className={`text-lg font-bold ${isOpen ? 'text-indigo-700' : 'text-slate-800'}`}>{field.label}</h3>
                    </div>
                  </div>
                  <Icons.ArrowRight className={`w-5 h-5 text-slate-400 transition-transform duration-300 ${isOpen ? 'rotate-90 text-indigo-500' : ''}`} />
                </button>

                {isOpen && (
                  <div className="px-6 pb-6 animate-fade-in">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">

                      {/* Guide & Input Section - 3 Separate Inputs */}
                      <div className="space-y-4 border-r md:border-r-0 border-slate-100 md:pr-4">
                        <div className="bg-indigo-50 p-4 rounded-xl border border-indigo-100">
                          <h4 className="flex items-center gap-2 text-sm font-bold text-indigo-800 mb-1">
                            <Icons.Lightbulb className="w-4 h-4" />
                            상세 기획 가이드
                          </h4>
                          <p className="text-xs text-indigo-600 mb-3">질문에 대한 답변을 각각 입력해주세요. AI가 이를 종합하여 전략을 완성합니다.</p>
                        </div>

                        <div className="space-y-6">
                          {fieldGuides.map((guide, i) => (
                            <div key={i}>
                              <label className="block text-sm font-bold text-slate-700 mb-2 leading-snug">
                                <span className="inline-block w-5 h-5 bg-indigo-100 text-indigo-700 rounded-full text-xs text-center leading-5 mr-2">{i + 1}</span>
                                {guide}
                              </label>
                              <textarea
                                value={currentUserInputs[i]}
                                onChange={(e) => handleInputChange(i, e.target.value)}
                                placeholder="답변을 입력하세요."
                                className="w-full h-16 p-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-indigo-500 focus:border-transparent resize-none text-slate-700 text-sm leading-relaxed bg-slate-50/50"
                                disabled={state?.isLoading || state?.isFinalized}
                              />
                            </div>
                          ))}

                          {!state?.isFinalized ? (
                            <button
                              onClick={() => handleGenerateDraft(field.key)}
                              disabled={currentUserInputs.every(s => !s.trim()) || state?.isLoading}
                              className="mt-4 w-full py-3 bg-indigo-600 text-white rounded-xl font-bold text-sm hover:bg-indigo-700 disabled:bg-slate-200 disabled:text-slate-400 transition-colors flex items-center justify-center gap-2 shadow-md"
                            >
                              {state?.isLoading ? '전략 통합 및 생성 중...' : '답변 제출 및 초안 생성'}
                              {!state?.isLoading && <Icons.Sparkles className="w-4 h-4" />}
                            </button>
                          ) : (
                            <button
                              onClick={() => handleRefine(field.key)}
                              className="mt-4 w-full py-3 bg-white border border-slate-200 text-slate-600 rounded-xl font-bold text-sm hover:bg-slate-50 transition-colors shadow-sm"
                            >
                              수정하기 (다시 생성)
                            </button>
                          )}
                        </div>
                      </div>

                      {/* Result Section */}
                      <div className="bg-slate-50 rounded-xl border border-slate-200 p-5 relative h-fit sticky top-24">
                        <h4 className="text-sm font-bold text-slate-500 mb-3 uppercase tracking-wide">Strategic Definition (전략 정의)</h4>
                        {state?.isLoading ? (
                          <div className="h-full flex flex-col items-center justify-center text-slate-400 gap-3 min-h-[300px]">
                            <div className="w-8 h-8 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin"></div>
                            <span className="text-sm animate-pulse text-center px-4">
                              고객의 갈등을 해결할<br />압도적 솔루션을 설계하고 있습니다...
                            </span>
                          </div>
                        ) : state?.draft ? (
                          <div className="prose prose-sm max-w-none text-slate-700 leading-relaxed animate-fade-in">
                            {state.draft.split('\n').map((line, i) => {
                              // Header Parsing (###, ##, #)
                              if (line.trim().startsWith('### ')) {
                                return <h3 key={i} className="text-lg font-bold text-indigo-800 mt-5 mb-2 block">{line.replace('### ', '').trim()}</h3>;
                              }
                              if (line.trim().startsWith('## ')) {
                                return <h3 key={i} className="text-lg font-bold text-indigo-800 mt-5 mb-2 block">{line.replace('## ', '').trim()}</h3>;
                              }
                              if (line.trim().startsWith('# ')) {
                                return <h3 key={i} className="text-lg font-bold text-indigo-800 mt-5 mb-2 block">{line.replace('# ', '').trim()}</h3>;
                              }
                              // Empty lines
                              if (line.trim() === '') {
                                return <div key={i} className="h-2" />;
                              }
                              // Normal text
                              return <p key={i} className="mb-1 text-slate-600">{line}</p>;
                            })}
                          </div>
                        ) : (
                          <div className="h-full flex items-center justify-center text-slate-400 text-sm min-h-[300px] text-center px-4">
                            심층 질문에 답변하면<br />논백경쟁전략이 적용된 브랜드 헌장이 완성됩니다.
                          </div>
                        )}
                        {state?.isFinalized && (
                          <div className="absolute top-4 right-4">
                            <span className="bg-green-100 text-green-700 px-2 py-1 rounded text-xs font-bold flex items-center gap-1">
                              <Icons.ShieldCheck className="w-3 h-3" /> 완료됨
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      <div className="fixed bottom-0 left-0 w-full bg-white border-t border-slate-200 p-4 z-30 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.1)]">
        <div className="max-w-5xl mx-auto flex justify-between items-center">
          <div className="text-sm text-slate-500">
            <span className="font-bold text-indigo-600">{completedCount}</span> / {totalCount} 항목 작성 완료
          </div>
          <button
            onClick={() => onComplete(builderState)}
            disabled={completedCount < 3}
            className="px-8 py-3 bg-slate-900 text-white rounded-xl font-bold hover:bg-slate-800 disabled:bg-slate-200 disabled:text-slate-400 transition-colors shadow-lg flex items-center gap-2"
          >
            <span>최종 페르소나 완성하기</span>
            <Icons.ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        .animate-fade-in {
          animation: fadeIn 0.3s ease-out forwards;
        }
      `}</style>
    </div>
  );
};

export default PersonaBuilder;
