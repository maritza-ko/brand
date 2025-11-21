
import React, { useState } from 'react';
import { AnalysisRequest, BrandPersona, BuilderState } from './types';
import { 
  generateBrandPersonaData, 
  generateImageWithCustomStyle, 
  generatePlanningGuides,
  finalizePersona
} from './services/geminiService';
import InputForm from './components/InputForm';
import LoadingScreen from './components/LoadingScreen';
import ResultDashboard from './components/ResultDashboard';
import PersonaBuilder from './components/PersonaBuilder';
import { Icons } from './components/Icons';

type ViewMode = 'INPUT' | 'BUILDER' | 'RESULT';

function App() {
  const [viewMode, setViewMode] = useState<ViewMode>('INPUT');
  const [isLoading, setIsLoading] = useState(false);
  const [loadingMessage, setLoadingMessage] = useState("");
  
  // Data
  const [requestData, setRequestData] = useState<AnalysisRequest | null>(null);
  const [guides, setGuides] = useState<Record<string, string[]>>({});
  const [result, setResult] = useState<BrandPersona | null>(null);
  const [generatedImage, setGeneratedImage] = useState<string | null>(null);

  // 1. Initial Submit (Simple or Start Builder)
  const handleInitialSubmit = async (request: AnalysisRequest, mode: 'simple' | 'advanced') => {
    setRequestData(request);
    setIsLoading(true);
    
    try {
      if (mode === 'simple') {
        // Simple Mode: Generate everything at once
        const personaData = await generateBrandPersonaData(request);
        const imageBase64 = await generateImageWithCustomStyle(request, personaData);
        
        setResult(personaData);
        setGeneratedImage(imageBase64);
        setViewMode('RESULT');
      } else {
        // Advanced Mode: Generate Guides & Go to Builder
        setLoadingMessage("브랜드 아이디어를 분석하여 맞춤형 기획 가이드를 생성하고 있습니다...");
        const generatedGuides = await generatePlanningGuides(request.idea, request.brandName);
        setGuides(generatedGuides);
        setViewMode('BUILDER');
      }
    } catch (error) {
      alert("오류가 발생했습니다. 다시 시도해주세요.");
      console.error(error);
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
      const finalPersona = await finalizePersona(requestData.idea, builderState);
      
      // Generate Image based on the finalized persona
      // We can use 'imageStyle' from the first input if user typed it in custom inputs, 
      // or rely on the finalized keywords/philosophy.
      // Since builder doesn't explicitly ask for 'imageStyle', we rely on AI inference.
      const imageBase64 = await generateImageWithCustomStyle(requestData, finalPersona);

      setResult(finalPersona);
      setGeneratedImage(imageBase64);
      setViewMode('RESULT');
    } catch (error) {
      alert("최종 생성 중 오류가 발생했습니다.");
      console.error(error);
    } finally {
      setIsLoading(false);
      setLoadingMessage("");
    }
  };

  const handleReset = () => {
    setViewMode('INPUT');
    setResult(null);
    setGeneratedImage(null);
    setRequestData(null);
    setGuides({});
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans">
      {/* Header */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2 cursor-pointer" onClick={handleReset}>
            <div className="bg-indigo-600 p-1.5 rounded-lg">
               <Icons.Layers className="w-5 h-5 text-white" />
            </div>
            <h1 className="text-xl font-bold text-slate-900 tracking-tight">Brand Persona <span className="text-indigo-600">Architect</span></h1>
          </div>
          <div className="hidden md:block text-xs font-medium text-slate-500 bg-slate-100 px-3 py-1 rounded-full">
            Powered by Google Gemini 2.5
          </div>
        </div>
      </header>

      {/* Main */}
      <main className="flex-grow relative p-4 sm:p-6 lg:p-8">
        {isLoading && <LoadingScreen />} {/* You might want to pass custom message prop to LoadingScreen */}

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
              onComplete={handleBuilderComplete}
            />
          </div>
        )}

        {viewMode === 'RESULT' && result && (
          <div className="animate-fade-in-up">
             <ResultDashboard 
                data={result} 
                imageUrl={generatedImage} 
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
      `}</style>
    </div>
  );
}

export default App;
