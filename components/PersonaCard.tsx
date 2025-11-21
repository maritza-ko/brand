
import React from 'react';
import { LucideIcon } from 'lucide-react';

interface PersonaCardProps {
  title: string;
  content: string | string[];
  icon: LucideIcon;
  colorClass: string;
  fullWidth?: boolean;
}

const PersonaCard: React.FC<PersonaCardProps> = ({ title, content, icon: Icon, colorClass, fullWidth = false }) => {
  
  // Custom parser to render styled text from raw string
  const renderStyledContent = (text: string) => {
    if (!text) return null;

    // Split text into lines
    const lines = text.split('\n');
    const elements: React.ReactNode[] = [];
    
    let currentList: React.ReactNode[] = [];
    let listKey = 0;

    const flushList = () => {
      if (currentList.length > 0) {
        elements.push(
          <ul key={`list-${listKey++}`} className="mb-4 space-y-2 bg-slate-50 p-3 rounded-xl border border-slate-100">
            {currentList}
          </ul>
        );
        currentList = [];
      }
    };

    const parseBold = (line: string) => {
      const parts = line.split(/(\*\*.*?\*\*)/g);
      return parts.map((part, i) => {
        if (part.startsWith('**') && part.endsWith('**')) {
          return <strong key={i} className="font-bold text-slate-800 bg-yellow-50 px-1 rounded">{part.slice(2, -2)}</strong>;
        }
        return part;
      });
    };

    lines.forEach((line, index) => {
      const trimmed = line.trim();
      if (!trimmed) {
        flushList();
        return;
      }

      // Check for Headers (###)
      if (trimmed.startsWith('###')) {
        flushList();
        elements.push(
          <h4 key={`h-${index}`} className="text-slate-800 font-bold text-lg mt-4 mb-2 flex items-center gap-2">
             <span className={`w-1.5 h-4 rounded-full ${colorClass.replace('bg-', 'bg-')}`}></span>
             {trimmed.replace(/^###\s*/, '')}
          </h4>
        );
        return;
      }

      // Check for Bullets (- or *)
      if (trimmed.startsWith('- ') || trimmed.startsWith('* ') || trimmed.startsWith('• ')) {
        const content = trimmed.replace(/^[-*•]\s*/, '');
        currentList.push(
          <li key={`li-${index}`} className="flex items-start gap-2 text-sm md:text-base text-slate-600 leading-relaxed">
             <span className={`mt-1.5 w-1.5 h-1.5 rounded-full flex-shrink-0 ${colorClass.replace('bg-', 'bg-')}`}></span>
             <span>{parseBold(content)}</span>
          </li>
        );
        return;
      }

      // Check for Numbered Lists (1. )
      if (/^\d+\.\s/.test(trimmed)) {
         const number = trimmed.match(/^\d+/)?.[0] || '•';
         const content = trimmed.replace(/^\d+\.\s*/, '');
         // Treat numbered list similar to bullet for cleaner visual, or wrap differently
         // Here we use a distinct style
         flushList();
         elements.push(
            <div key={`num-${index}`} className="flex items-start gap-3 mb-3 text-sm md:text-base">
               <span className="flex-shrink-0 w-6 h-6 rounded-full bg-slate-100 text-slate-600 text-xs font-bold flex items-center justify-center border border-slate-200 mt-0.5">
                 {number}
               </span>
               <p className="text-slate-700 leading-relaxed pt-0.5">{parseBold(content)}</p>
            </div>
         );
         return;
      }

      // Standard Paragraph
      flushList();
      elements.push(
        <p key={`p-${index}`} className="mb-3 text-slate-600 leading-relaxed text-sm md:text-base">
          {parseBold(trimmed)}
        </p>
      );
    });

    flushList(); // Flush any remaining list items
    return elements;
  };

  return (
    <div className={`bg-white rounded-2xl p-6 shadow-sm border border-slate-100 hover:shadow-md transition-all duration-300 ${fullWidth ? 'col-span-1 md:col-span-2 lg:col-span-3' : 'col-span-1'}`}>
      <div className="flex items-center gap-3 mb-4 border-b border-slate-50 pb-4">
        <div className={`p-3 rounded-xl ${colorClass} bg-opacity-10`}>
          <Icon className={`w-6 h-6 ${colorClass.replace('bg-', 'text-')}`} />
        </div>
        <h3 className="text-lg font-bold text-slate-800">{title}</h3>
      </div>
      
      <div className="text-slate-600">
        {Array.isArray(content) ? (
          <div className="flex flex-wrap gap-2">
            {content.map((tag, idx) => (
              <span key={idx} className="px-3 py-1 bg-slate-100 text-slate-700 rounded-full text-sm font-medium hover:bg-slate-200 transition-colors">
                #{tag}
              </span>
            ))}
          </div>
        ) : (
          renderStyledContent(content)
        )}
      </div>
    </div>
  );
};

export default PersonaCard;
