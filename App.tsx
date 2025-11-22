
import React, { useState } from 'react';
import { AnalysisRequest, BrandPersona, BuilderState } from './types';
import {
  generateBrandPersonaData,
  generatePlanningGuides,
  finalizePersona
} from './services/geminiService';
import InputForm from './components/InputForm';
import LoadingScreen from './components/LoadingScreen';
import ResultDashboard from './components/ResultDashboard';
import PersonaBuilder from './components/PersonaBuilder';
import { Icons } from './components/Icons';

import ApiKeyModal from './components/ApiKeyModal';

type ViewMode = 'INPUT' | 'BUILDER' | 'RESULT';

function App() {
  const [viewMode, setViewMode] = useState<ViewMode>('INPUT');
  const [isLoading, setIsLoading] = useState(false);
  const [loadingMessage, setLoadingMessage] = useState("");
  const [isApiKeyModalOpen, setIsApiKeyModalOpen] = useState(false);
  const [apiKey, setApiKey] = useState<string>(() => localStorage.getItem('gemini_api_key') || "");

  // Data
  const [requestData, setRequestData] = useState<AnalysisRequest | null>(null);
  const [guides, setGuides] = useState<Record<string, string[]>>({});
  const [result, setResult] = useState<BrandPersona | null>(null);

  const handleApiError = (error: any) => {
    console.error(error);
    // Check for permission denied or 403/401 errors which indicate key issues
    if (error.message?.includes('PERMISSION_DENIED') || error.message?.includes('403') || error.message?.includes('401')) {
      alert("API 키 오류가 발생했습니다. 유효한 API Key를 설정해주세요.");
      setIsApiKeyModalOpen(true);
    } else {
      alert("오류가 발생했습니다. 다시 시도해주세요: " + error.message);
    }
  };

  // 1. Initial Submit (Simple or Start Builder)
  const handleInitialSubmit = async (request: AnalysisRequest, mode: 'simple' | 'advanced') => {
    setRequestData(request);
    setIsLoading(true);

    try {
      if (mode === 'simple') {
        // Simple Mode: Generate everything at once
        const personaData = await generateBrandPersonaData(request, apiKey);

        setResult(personaData);
        setViewMode('RESULT');
      } else {
        // Advanced Mode: Generate Guides & Go to Builder
        setLoadingMessage("브랜드 아이디어를 분석하여 맞춤형 기획 가이드를 생성하고 있습니다...");
        const generatedGuides = await generatePlanningGuides(request.idea, request.brandName, apiKey);
        setGuides(generatedGuides);
        setViewMode('BUILDER');
      }
    } catch (error: any) {
      handleApiError(error);
    } finally {
      setIsLoading(false);
      setLoadingMessage("");
    }
  };

  // 2. Builder Completion
  const handleBuilderComplete = async (builderState: BuilderState) => {
    if (!requestData) return;

    setIsLoading(true);
    setLoadingMessage("작성하신 내용을 바탕으로 최종 브랜드 페르소나를 조립하고 있습니다...");

    try {
      const finalPersona = await finalizePersona(requestData.idea, builderState, apiKey);

      setResult(finalPersona);
      setViewMode('RESULT');
    } catch (error: any) {
      handleApiError(error);
    } finally {
      setIsLoading(false);
      setLoadingMessage("");
    }
  };

  const handleReset = () => {
    setViewMode('INPUT');
    setResult(null);
    setRequestData(null);
    setGuides({});
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans">
      <ApiKeyModal
        isOpen={isApiKeyModalOpen}
        onClose={() => setIsApiKeyModalOpen(false)}
        onSave={setApiKey}
      />

      {/* Header */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2 cursor-pointer" onClick={handleReset}>
            <div className="bg-indigo-600 p-1.5 rounded-lg">
              <Icons.Layers className="w-5 h-5 text-white" />
            </div>
            <h1 className="text-xl font-bold text-slate-900 tracking-tight">Brand Persona <span className="text-indigo-600">Architect</span></h1>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => setIsApiKeyModalOpen(true)}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium transition-colors border ${apiKey ? 'bg-indigo-50 text-indigo-700 border-indigo-100' : 'bg-slate-100 text-slate-500 border-slate-200'}`}
            >
              <Icons.Settings className="w-3.5 h-3.5" />
              {apiKey ? 'API Key 설정됨' : 'API Key 설정 필요'}
            </button>
            <div className="hidden md:block text-xs font-medium text-slate-500 bg-slate-100 px-3 py-1 rounded-full">
              Powered by Google Gemini 2.5
            </div>
          </div>
        </div>
      </header>

      {/* Main */}
      <main className="flex-grow relative p-4 sm:p-6 lg:p-8">
        {isLoading && <LoadingScreen />}

        {viewMode === 'INPUT' && (
          <div className="h-full flex items-center justify-center min-h-[80vh]">
            <InputForm onSubmit={handleInitialSubmit} isLoading={isLoading} />
          </div>
        )}

        {viewMode === 'BUILDER' && requestData && (
          <div className="animate-fade-in-up">
            <PersonaBuilder
              idea={requestData.idea}
              guides={guides}
              initialBrandName={requestData.brandName}
              onComplete={handleBuilderComplete}
              apiKey={apiKey}
            />
          </div>
        )}

        {viewMode === 'RESULT' && result && (
          <div className="animate-fade-in-up">
            <ResultDashboard
              data={result}
              onReset={handleReset}
            />
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="bg-slate-900 text-slate-400 py-8 mt-auto">
        <div className="max-w-7xl mx-auto px-4 text-center text-sm">
          <p>&copy; {new Date().getFullYear()} Brand Persona Architect. All rights reserved.</p>
          <p className="mt-2 text-slate-600">AI can make mistakes. Please review the generated strategy.</p>
        </div>
      </footer>

      <style>{`
        @keyframes fadeInUp {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-fade-in-up {
          animation: fadeInUp 0.8s cubic-bezier(0.2, 0.8, 0.2, 1) forwards;
        }
        @keyframes fadeIn {
            from { opacity: 0; }
            to { opacity: 1; }
        }
        .animate-fade-in {
            animation: fadeIn 0.2s ease-out forwards;
        }
      `}</style>
    </div>
  );
}

export default App;
