'use client';

import { useState } from 'react';
import { Star, ChevronDown, ChevronUp } from 'lucide-react';

export default function IdealAnswerCard({ answer }) {
  const [expanded, setExpanded] = useState(false);
  if (!answer) return null;

  return (
    <div className="mt-2 rounded-lg border-l-2 border-success overflow-hidden">
      <button onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center gap-2 px-3 py-2 bg-success/5 hover:bg-success/8 transition-colors text-left">
        <Star className="w-3 h-3 text-success shrink-0" />
        <span className="text-xs font-semibold text-success flex-1">
          {expanded ? 'Model answer' : 'See ideal answer'}
        </span>
        {expanded ? <ChevronUp className="w-3 h-3 text-success" /> : <ChevronDown className="w-3 h-3 text-success" />}
      </button>
      {expanded && (
        <div className="px-3 py-2.5 bg-success/[0.03]" style={{ animation: 'fade-in 0.2s ease-out' }}>
          <p className="text-xs text-surface-200 leading-relaxed">{answer}</p>
          <p className="text-[9px] text-surface-500 mt-2 italic">This is one possible strong answer — yours may differ</p>
        </div>
      )}
    </div>
  );
}
