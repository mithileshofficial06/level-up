'use client';

import { forwardRef } from 'react';

const Certificate = forwardRef(function Certificate({ report, userName, session }, ref) {
  const score = report?.overall_score || 0;
  const certId = report?.certificate_id || 'N/A';

  return (
    <div ref={ref} style={{
      width: 1122, height: 794, background: '#faf8f5', position: 'absolute', left: '-9999px', top: '-9999px',
      fontFamily: 'Georgia, serif', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
      padding: '50px 80px', border: '4px double #c2a87e', boxSizing: 'border-box',
    }}>
      {/* Inner border */}
      <div style={{ position: 'absolute', inset: 16, border: '1px solid #d4c4a8', borderRadius: 4 }} />

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 20 }}>
        <div style={{ width: 28, height: 28, borderRadius: 6, background: '#ff771c', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <span style={{ color: 'white', fontWeight: 800, fontSize: 14 }}>L</span>
        </div>
        <span style={{ color: '#6b6155', fontSize: 14, fontWeight: 600, letterSpacing: 3, textTransform: 'uppercase' }}>LevelUp AI</span>
      </div>

      <h1 style={{ fontSize: 32, color: '#2e2a25', fontWeight: 400, margin: '0 0 6px 0', fontStyle: 'italic' }}>Certificate of Interview Readiness</h1>
      <p style={{ color: '#8a7e6f', fontSize: 14, margin: '16px 0 4px 0' }}>This certifies that</p>
      <p style={{ fontSize: 36, color: '#161311', fontWeight: 700, margin: '0 0 16px 0' }}>{userName || 'Candidate'}</p>
      <p style={{ color: '#6b6155', fontSize: 15, textAlign: 'center', maxWidth: 600, lineHeight: 1.7, margin: '0 0 30px 0' }}>
        has demonstrated interview readiness by scoring <strong style={{ color: '#ff771c' }}>{score}/100</strong> on a {session?.company_type || 'FAANG'} {session?.role || ''} interview simulation at <strong>{session?.difficulty || 'Hard'}</strong> difficulty.
      </p>

      {/* Seal */}
      <svg viewBox="0 0 100 100" style={{ width: 80, height: 80, marginBottom: 20 }}>
        <circle cx="50" cy="50" r="45" fill="none" stroke="#c2a87e" strokeWidth="2" />
        <circle cx="50" cy="50" r="38" fill="none" stroke="#c2a87e" strokeWidth="1" />
        <text x="50" y="46" textAnchor="middle" fill="#6b6155" fontSize="8" fontWeight="600">VERIFIED BY</text>
        <text x="50" y="58" textAnchor="middle" fill="#ff771c" fontSize="9" fontWeight="700">LEVELUP AI</text>
      </svg>

      {/* Footer */}
      <div style={{ display: 'flex', justifyContent: 'space-between', width: '100%', borderTop: '1px solid #e5ddd0', paddingTop: 16 }}>
        <span style={{ color: '#8a7e6f', fontSize: 11 }}>Date: {new Date().toLocaleDateString()}</span>
        <span style={{ color: '#8a7e6f', fontSize: 11 }}>Certificate ID: {certId}</span>
      </div>
    </div>
  );
});

export default Certificate;
