'use client';

import { Eye, Mic, MessageSquare } from 'lucide-react';

function getColor(v) {
  if (v >= 71) return '#22c55e';
  if (v >= 41) return '#f59e0b';
  return '#ef4444';
}

function getPaceLabel(wpm) {
  if (wpm > 160) return 'Too fast';
  if (wpm >= 120) return 'Good pace';
  if (wpm > 0) return 'Too slow';
  return '—';
}

export default function ConfidenceMeter({ liveMetrics = {} }) {
  const { eyeContact = 60, wordsPerMinute = 0, fillerCount = 0, confidence = 50 } = liveMetrics;
  const score = Math.round(Math.max(0, Math.min(100, confidence)));
  const color = getColor(score);

  return (
    <div className="w-12 shrink-0 flex flex-col items-center gap-2 py-3 bg-surface-900/30 border-l border-surface-700/15">
      <span className="text-[8px] font-bold text-surface-500 uppercase tracking-wider [writing-mode:vertical-lr] rotate-180 mb-1">Confidence</span>

      {/* Bar */}
      <div className="flex-1 w-3 bg-surface-800 rounded-full overflow-hidden relative">
        <div className="absolute bottom-0 left-0 right-0 rounded-full transition-all duration-[800ms] ease-out"
          style={{ height: `${score}%`, backgroundColor: color }} />
      </div>

      {/* Score */}
      <span className="text-xs font-bold" style={{ color }}>{score}</span>

      {/* Metric indicators */}
      <div className="flex flex-col items-center gap-2 mt-1">
        <div className="text-center" title="Eye contact">
          <Eye className="w-3 h-3 text-surface-500 mx-auto" />
          <span className="text-[8px] text-surface-400">{eyeContact}%</span>
        </div>
        <div className="text-center" title="Speaking pace">
          <Mic className="w-3 h-3 text-surface-500 mx-auto" />
          <span className="text-[8px] text-surface-400 leading-none block">{getPaceLabel(wordsPerMinute)}</span>
        </div>
        <div className="text-center" title="Filler words">
          <MessageSquare className="w-3 h-3 text-surface-500 mx-auto" />
          <span className="text-[8px] text-surface-400">{fillerCount}</span>
        </div>
      </div>
    </div>
  );
}
