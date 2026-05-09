'use client';

import { forwardRef } from 'react';

const ShareCard = forwardRef(function ShareCard({ report, session }, ref) {
  const score = report?.overall_score || 0;
  const grade = report?.grade || 'B';
  const categories = [
    { label: 'Technical', value: report?.technical_score || 0 },
    { label: 'Communication', value: report?.communication_score || 0 },
    { label: 'Body Language', value: report?.body_language_score || 0 },
    { label: 'Problem Solving', value: report?.problem_solving_score || 0 },
  ];

  return (
    <div ref={ref} style={{
      width: 1200, height: 630, background: '#0f0f0f', position: 'absolute', left: '-9999px', top: '-9999px',
      fontFamily: 'system-ui, sans-serif', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', padding: 60,
      backgroundImage: 'radial-gradient(circle at 1px 1px, #1a1a1a 1px, transparent 0)',
      backgroundSize: '40px 40px',
    }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 40 }}>
        <div style={{ width: 32, height: 32, borderRadius: 8, background: '#ff771c', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <span style={{ color: 'white', fontWeight: 800, fontSize: 16 }}>L</span>
        </div>
        <span style={{ color: '#8a7e6f', fontSize: 16, fontWeight: 600, letterSpacing: 2, textTransform: 'uppercase' }}>LevelUp AI — Mock Interview Report</span>
      </div>

      {/* Score circle */}
      <div style={{ position: 'relative', width: 160, height: 160, marginBottom: 30 }}>
        <svg viewBox="0 0 160 160" style={{ width: 160, height: 160 }}>
          <circle cx="80" cy="80" r="70" fill="none" stroke="#1f1c18" strokeWidth="8" />
          <circle cx="80" cy="80" r="70" fill="none" stroke="#ff771c" strokeWidth="8"
            strokeDasharray={`${(score / 100) * 440} 440`}
            strokeLinecap="round" transform="rotate(-90 80 80)" />
        </svg>
        <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
          <span style={{ fontSize: 48, fontWeight: 800, color: '#f5ede0' }}>{score}</span>
          <span style={{ fontSize: 20, fontWeight: 700, color: '#ff771c' }}>{grade}</span>
        </div>
      </div>

      {/* Category bars */}
      <div style={{ display: 'flex', gap: 30, marginBottom: 40, width: '80%', justifyContent: 'center' }}>
        {categories.map(c => (
          <div key={c.label} style={{ flex: 1, maxWidth: 200 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
              <span style={{ color: '#8a7e6f', fontSize: 12, fontWeight: 600 }}>{c.label}</span>
              <span style={{ color: '#f5ede0', fontSize: 12, fontWeight: 700 }}>{c.value}</span>
            </div>
            <div style={{ height: 6, background: '#1f1c18', borderRadius: 3 }}>
              <div style={{
                height: 6, borderRadius: 3, width: `${c.value}%`,
                background: c.value >= 75 ? '#22c55e' : c.value >= 50 ? '#f59e0b' : '#ef4444',
              }} />
            </div>
          </div>
        ))}
      </div>

      {/* Footer */}
      <div style={{ display: 'flex', justifyContent: 'space-between', width: '80%' }}>
        <div style={{ color: '#6b6155', fontSize: 13 }}>
          {session?.role || 'Interview'} · {session?.company_type || ''} · {session?.difficulty || ''}
        </div>
        <div style={{ color: '#454038', fontSize: 12 }}>
          levelupai.com · {new Date().toLocaleDateString()}
        </div>
      </div>
    </div>
  );
});

export default ShareCard;
