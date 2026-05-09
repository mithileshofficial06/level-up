'use client';

import { useState } from 'react';
import { Lightbulb, AlertTriangle, CheckCircle2, AlertCircle, X } from 'lucide-react';

const ICONS = {
  tip: { icon: Lightbulb, bg: 'bg-info/10 border-info/20', text: 'text-info' },
  missing: { icon: AlertTriangle, bg: 'bg-warning/10 border-warning/20', text: 'text-warning' },
  good: { icon: CheckCircle2, bg: 'bg-success/10 border-success/20', text: 'text-success' },
  filler: { icon: AlertCircle, bg: 'bg-error/10 border-error/20', text: 'text-error' },
};

export default function LiveCoach({ hint, type = 'tip', visible = false }) {
  const [dismissed, setDismissed] = useState(false);

  if (!visible || dismissed || !hint) return null;

  const style = ICONS[type] || ICONS.tip;
  const Icon = style.icon;

  return (
    <div className={`flex items-center gap-2 px-3 py-2 rounded-lg border transition-all duration-300 ${style.bg}`}
      style={{ animation: 'fade-in 0.3s ease-out' }}>
      <Icon className={`w-3.5 h-3.5 shrink-0 ${style.text}`} />
      <span className={`text-xs font-medium flex-1 ${style.text}`}>{hint}</span>
      <button onClick={() => setDismissed(true)} className="text-surface-500 hover:text-surface-300">
        <X className="w-3 h-3" />
      </button>
    </div>
  );
}
