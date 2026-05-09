'use client';

const PERSONAS = {
  'FAANG': { name: 'Rahul', title: 'Senior SDE @ Google', color: '#4285f4' },
  'Product Startup': { name: 'Priya', title: 'CTO @ YC Startup', color: '#ff771c' },
  'Service Company': { name: 'Vikram', title: 'Technical Lead @ TCS', color: '#546877' },
  'Government': { name: 'Anjali', title: 'Assessment Officer', color: '#34d399' },
};

export default function InterviewerAvatar({ companyType = 'FAANG', avatarState = 'idle', isSpeaking = false, reaction = '' }) {
  const persona = PERSONAS[companyType] || PERSONAS['FAANG'];

  return (
    <div className="flex flex-col items-center gap-2">
      <div className="relative">
        {/* Pulsing ring when speaking */}
        <div className={`absolute -inset-1.5 rounded-full transition-all duration-500 ${isSpeaking ? 'animate-[pulse-ring_1.5s_ease-in-out_infinite]' : ''}`}
          style={{ border: `2px solid ${isSpeaking ? persona.color : 'transparent'}`, opacity: isSpeaking ? 0.6 : 0 }} />

        {/* Avatar container */}
        <div className={`w-[72px] h-[72px] rounded-full overflow-hidden border-2 transition-all duration-300 ${isSpeaking ? 'shadow-lg' : ''}`}
          style={{ borderColor: isSpeaking ? persona.color : '#2e2a25' }}>
          <svg viewBox="0 0 72 72" className={`w-full h-full avatar-${avatarState}`}>
            {/* Head */}
            <circle cx="36" cy="28" r="16" fill="#2e2a25" stroke="#454038" strokeWidth="1" />
            {/* Hair */}
            <path d="M20 24 Q20 12 36 12 Q52 12 52 24 Q52 18 36 16 Q20 18 20 24Z" fill="#454038" />
            {/* Eyes */}
            <g className={avatarState === 'thinking' ? 'translate-x-[-1px] translate-y-[-2px]' : ''}>
              <ellipse cx="30" cy="27" rx="2.5" ry={avatarState === 'reacting' ? '2' : '2.5'} fill="#f5ede0" />
              <ellipse cx="42" cy="27" rx="2.5" ry={avatarState === 'reacting' ? '2' : '2.5'} fill="#f5ede0" />
              <circle cx="30" cy="27" r="1.2" fill="#161311" />
              <circle cx="42" cy="27" r="1.2" fill="#161311" />
            </g>
            {/* Mouth */}
            {avatarState === 'reacting' ? (
              <path d="M30 35 Q36 40 42 35" fill="none" stroke="#f5ede0" strokeWidth="1.2" strokeLinecap="round" />
            ) : (
              <path d="M31 35 Q36 37 41 35" fill="none" stroke="#8a7e6f" strokeWidth="1" strokeLinecap="round" />
            )}
            {/* Body */}
            <path d="M16 58 Q16 44 36 44 Q56 44 56 58 L56 72 L16 72Z" fill="#2e2a25" stroke="#454038" strokeWidth="1" />
            {/* Collar accent */}
            <path d="M30 44 L36 50 L42 44" fill="none" stroke={persona.color} strokeWidth="1.5" />
          </svg>
        </div>

        {/* Thinking dots */}
        {avatarState === 'thinking' && (
          <div className="absolute -right-5 top-1 flex gap-0.5">
            <span className="w-1 h-1 bg-surface-400 rounded-full animate-[bounce_1s_ease_infinite_0ms]" />
            <span className="w-1 h-1 bg-surface-400 rounded-full animate-[bounce_1s_ease_infinite_200ms]" />
            <span className="w-1 h-1 bg-surface-400 rounded-full animate-[bounce_1s_ease_infinite_400ms]" />
          </div>
        )}
      </div>

      {/* Name badge */}
      <div className="text-center">
        <p className="text-[11px] font-semibold text-surface-200">{persona.name}</p>
        <p className="text-[9px] text-surface-500">{persona.title}</p>
      </div>

      {/* Reaction bubble */}
      {reaction && (
        <div className="absolute top-[-38px] left-1/2 -translate-x-1/2 animate-[fade-up_0.3s_ease-out]">
          <div className="bg-surface-800 border border-surface-700/30 rounded-lg px-3 py-1.5 text-[11px] text-surface-200 whitespace-nowrap shadow-xl max-w-[200px] text-center">
            {reaction}
            <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-2 h-2 bg-surface-800 border-r border-b border-surface-700/30 rotate-45" />
          </div>
        </div>
      )}

      <style jsx>{`
        .avatar-idle { animation: breathe 3s ease-in-out infinite; }
        .avatar-thinking { animation: think 2s ease-in-out infinite; }
        .avatar-nodding { animation: nod 0.8s ease-in-out 2; }
        .avatar-reacting { animation: react-tilt 0.6s ease-in-out; }
        @keyframes breathe { 0%, 100% { transform: scale(1); } 50% { transform: scale(1.02); } }
        @keyframes think { 0%, 100% { transform: translateY(0); } 50% { transform: translateY(-2px); } }
        @keyframes nod { 0%, 100% { transform: rotate(0); } 25% { transform: rotate(3deg); } 75% { transform: rotate(-2deg); } }
        @keyframes react-tilt { 0%, 100% { transform: rotate(0); } 50% { transform: rotate(4deg); } }
        @keyframes pulse-ring { 0%, 100% { transform: scale(1); opacity: 0.6; } 50% { transform: scale(1.08); opacity: 0.2; } }
      `}</style>
    </div>
  );
}
