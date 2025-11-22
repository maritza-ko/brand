import React, { useState, useEffect } from 'react';
import { Icons } from './Icons';

interface ApiKeyModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSave: (key: string) => void;
}

const ApiKeyModal: React.FC<ApiKeyModalProps> = ({ isOpen, onClose, onSave }) => {
    const [key, setKey] = useState('');
    const [isVisible, setIsVisible] = useState(false);

    useEffect(() => {
        const storedKey = localStorage.getItem('gemini_api_key');
        if (storedKey) setKey(storedKey);
    }, [isOpen]);

    const handleSave = () => {
        if (!key.trim()) {
            alert("API Key를 입력해주세요.");
            return;
        }
        localStorage.setItem('gemini_api_key', key.trim());
        onSave(key.trim());
        onClose();
    };

    const handleClear = () => {
        localStorage.removeItem('gemini_api_key');
        setKey('');
        onSave('');
        onClose();
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-fade-in">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden">
                <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50">
                    <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                        <Icons.Settings className="w-5 h-5 text-indigo-600" />
                        API Key 설정
                    </h3>
                    <button onClick={onClose} className="text-slate-400 hover:text-slate-600 transition-colors">
                        <Icons.X className="w-5 h-5" />
                    </button>
                </div>

                <div className="p-6 space-y-4">
                    <p className="text-sm text-slate-600 leading-relaxed">
                        Google Gemini API Key를 입력하면 더 안정적으로 서비스를 이용할 수 있습니다.
                        입력된 키는 브라우저에만 저장되며 서버로 전송되지 않습니다.
                    </p>

                    <div className="relative">
                        <input
                            type={isVisible ? "text" : "password"}
                            value={key}
                            onChange={(e) => setKey(e.target.value)}
                            placeholder="AIzaSy..."
                            className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all pr-10 font-mono text-sm"
                        />
                        <button
                            onClick={() => setIsVisible(!isVisible)}
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                        >
                            {isVisible ? <Icons.EyeOff className="w-4 h-4" /> : <Icons.Eye className="w-4 h-4" />}
                        </button>
                    </div>

                    <div className="bg-indigo-50 p-3 rounded-lg border border-indigo-100 flex gap-3 items-start">
                        <Icons.Info className="w-4 h-4 text-indigo-600 mt-0.5 flex-shrink-0" />
                        <div className="text-xs text-indigo-800">
                            <p className="font-bold mb-1">API Key 발급 방법:</p>
                            <a href="https://aistudio.google.com/app/apikey" target="_blank" rel="noreferrer" className="underline hover:text-indigo-900">
                                Google AI Studio
                            </a>에서 무료로 발급받을 수 있습니다.
                        </div>
                    </div>
                </div>

                <div className="p-4 bg-slate-50 border-t border-slate-100 flex justify-end gap-2">
                    {key && (
                        <button
                            onClick={handleClear}
                            className="px-4 py-2 text-slate-500 hover:text-red-600 text-sm font-medium transition-colors"
                        >
                            삭제
                        </button>
                    )}
                    <button
                        onClick={onClose}
                        className="px-4 py-2 text-slate-600 hover:bg-slate-200 rounded-lg text-sm font-medium transition-colors"
                    >
                        취소
                    </button>
                    <button
                        onClick={handleSave}
                        className="px-6 py-2 bg-indigo-600 text-white rounded-lg text-sm font-bold hover:bg-indigo-700 shadow-md hover:shadow-lg transition-all transform active:scale-95"
                    >
                        저장하기
                    </button>
                </div>
            </div>
        </div>
    );
};

export default ApiKeyModal;
