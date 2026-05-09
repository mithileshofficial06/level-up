'use client';

import { useState, useEffect } from 'react';
import { useAuth as useClerkAuth } from '@clerk/nextjs';
import { motion } from 'framer-motion';
import { RefreshCw, ChevronDown, ChevronUp, ExternalLink, Target, CheckCircle2, AlertTriangle, AlertCircle } from 'lucide-react';
import { profileAPI, setAuthTokenGetter } from '@/services/api';

export default function GapAnalysis({ targetRole = 'Full Stack Developer' }) {
  const { getToken } = useClerkAuth();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [expanded, setExpanded] = useState({});

  const load = async () => {
    setLoading(true);
    try {
      setAuthTokenGetter(getToken);
      const res = await profileAPI.getGapAnalysis({ target_role: targetRole });
      if (res.data?.data) setData(res.data.data);
    } catch {}
    finally { setLoading(false); }
  };

  useEffect(() => { load(); }, [targetRole]);

  if (!data && !loading) return null;

  const togglePlan = (i) => setExpanded(prev => ({ ...prev, [i]: !prev[i] }));

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
      className="rounded-xl bg-surface-900/50 border border-surface-700/20 p-5">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Target className="w-4 h-4 text-primary-500" />
          <h3 className="text-xs font-semibold text-surface-400 uppercase tracking-widest">
            Skill Gap for {targetRole}
          </h3>
        </div>
        <button onClick={load} disabled={loading}
          className="p-1.5 rounded-md text-surface-500 hover:text-surface-300 hover:bg-surface-800 transition-colors">
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
        </button>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-8">
          <div className="w-6 h-6 rounded-full border-2 border-primary-500 border-t-transparent animate-spin" />
        </div>
      ) : data && (
        <>
          {/* Gap score meter */}
          <div className="mb-5">
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-xs text-surface-400">You are <strong className="text-primary-400">{data.gap_score || 0}% ready</strong> for this role</span>
            </div>
            <div className="h-2 bg-surface-800 rounded-full overflow-hidden">
              <motion.div initial={{ width: 0 }} animate={{ width: `${data.gap_score || 0}%` }}
                transition={{ duration: 1.2, ease: 'easeOut' }}
                className="h-full rounded-full bg-gradient-to-r from-primary-500 to-primary-400" />
            </div>
          </div>

          {/* 3 columns */}
          <div className="grid sm:grid-cols-3 gap-3 mb-5">
            {/* Strong areas */}
            <div>
              <div className="flex items-center gap-1.5 mb-2">
                <CheckCircle2 className="w-3 h-3 text-success" />
                <span className="text-[10px] font-bold text-success uppercase tracking-wider">You have</span>
              </div>
              <div className="flex flex-wrap gap-1">
                {(data.strong_areas || []).map((s, i) => (
                  <span key={i} className="px-2 py-0.5 bg-success/10 text-success text-[10px] font-medium rounded">{s}</span>
                ))}
              </div>
            </div>

            {/* Missing */}
            <div>
              <div className="flex items-center gap-1.5 mb-2">
                <AlertCircle className="w-3 h-3 text-error" />
                <span className="text-[10px] font-bold text-error uppercase tracking-wider">Missing</span>
              </div>
              <div className="flex flex-wrap gap-1">
                {(data.missing_skills || []).map((s, i) => (
                  <span key={i} className="px-2 py-0.5 bg-error/10 text-error text-[10px] font-medium rounded">{s}</span>
                ))}
              </div>
            </div>

            {/* Weak */}
            <div>
              <div className="flex items-center gap-1.5 mb-2">
                <AlertTriangle className="w-3 h-3 text-warning" />
                <span className="text-[10px] font-bold text-warning uppercase tracking-wider">Work on</span>
              </div>
              <div className="flex flex-wrap gap-1">
                {(data.weak_areas || []).map((s, i) => (
                  <span key={i} className="px-2 py-0.5 bg-warning/10 text-warning text-[10px] font-medium rounded">{s}</span>
                ))}
              </div>
            </div>
          </div>

          {/* Learning plan */}
          {data.learning_plan?.length > 0 && (
            <div>
              <p className="text-[10px] font-bold text-surface-500 uppercase tracking-wider mb-2">Learning Plan</p>
              <div className="space-y-1.5">
                {data.learning_plan.map((item, i) => (
                  <div key={i} className="rounded-lg bg-surface-800/40 border border-surface-700/10 overflow-hidden">
                    <button onClick={() => togglePlan(i)}
                      className="w-full flex items-center justify-between px-3 py-2 text-left hover:bg-surface-800/60 transition-colors">
                      <span className="text-xs font-medium text-surface-200">{item.skill}</span>
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] text-surface-500">{item.days_to_learn}d</span>
                        {expanded[i] ? <ChevronUp className="w-3 h-3 text-surface-500" /> : <ChevronDown className="w-3 h-3 text-surface-500" />}
                      </div>
                    </button>
                    {expanded[i] && (
                      <div className="px-3 pb-2 space-y-1">
                        {item.resources?.map((r, j) => (
                          <div key={j} className="flex items-center gap-1.5">
                            <ExternalLink className="w-2.5 h-2.5 text-primary-500 shrink-0" />
                            <span className="text-[11px] text-surface-300">{r}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      )}
    </motion.div>
  );
}
