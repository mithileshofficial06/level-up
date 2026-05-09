'use client';

import { useState, useEffect, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useAuth as useClerkAuth, useUser } from '@clerk/nextjs';
import { motion, AnimatePresence } from 'framer-motion';
import {
  BarChart3, MessageSquare, Eye, Code, ArrowRight, RefreshCw,
  ChevronDown, ChevronUp, Brain, Award, TrendingUp,
  AlertCircle, Clock, FileText, Mic, Share2, Download, ExternalLink, Star
} from 'lucide-react';
import Navbar from '@/components/ui/Navbar';
import Button from '@/components/ui/Button';
import { SkeletonPage } from '@/components/ui/Loader';
import IdealAnswerCard from '@/components/report/IdealAnswerCard';
import ShareCard from '@/components/report/ShareCard';
import Certificate from '@/components/report/Certificate';
import { reportAPI, setAuthTokenGetter } from '@/services/api';

/* ── Score Ring ── */
function ScoreRing({ score, label, size = 120, delay = 0, showGrade = false, grade = '' }) {
  const [val, setVal] = useState(0);
  const r = (size - 8) / 2;
  const circ = 2 * Math.PI * r;
  const off = circ - (val / 100) * circ;
  const color = score >= 75 ? '#34d399' : score >= 50 ? '#fbbf24' : '#f87171';

  useEffect(() => {
    const t = setTimeout(() => {
      let s = 0;
      const iv = setInterval(() => { s += 1; if (s >= score) { setVal(score); clearInterval(iv); } else setVal(s); }, 15);
    }, delay);
    return () => clearTimeout(t);
  }, [score, delay]);

  return (
    <div className="flex flex-col items-center">
      <div className="relative" style={{ width: size, height: size }}>
        <svg className="w-full h-full -rotate-90" viewBox={`0 0 ${size} ${size}`}>
          <circle cx={size/2} cy={size/2} r={r} fill="none" stroke="#2e2a25" strokeWidth="6" />
          <circle cx={size/2} cy={size/2} r={r} fill="none" stroke={color} strokeWidth="6"
            strokeLinecap="round" strokeDasharray={circ} strokeDashoffset={off}
            style={{ transition: 'stroke-dashoffset 1.2s ease-out' }} />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-2xl font-bold text-surface-50">{val}</span>
          {showGrade && grade && <span className={`text-xs font-bold mt-0.5 ${score >= 75 ? 'text-success' : score >= 50 ? 'text-warning' : 'text-error'}`}>{grade}</span>}
        </div>
      </div>
      <span className="text-[11px] text-surface-400 mt-1.5 font-medium">{label}</span>
    </div>
  );
}

/* ── Score Card ── */
function ScoreCard({ icon: Icon, title, score, tips, strengths, weaknesses, delay }) {
  const [open, setOpen] = useState(false);
  const bar = score >= 75 ? 'bg-success' : score >= 50 ? 'bg-warning' : 'bg-error';
  const text = score >= 75 ? 'text-success' : score >= 50 ? 'text-warning' : 'text-error';

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay }}
      className="rounded-xl bg-surface-900/50 border border-surface-700/20 p-5">
      <div className="flex items-center gap-3 mb-3">
        <div className="w-9 h-9 rounded-lg bg-surface-800 flex items-center justify-center">
          <Icon className="w-4 h-4 text-surface-300" />
        </div>
        <div className="flex-1">
          <h3 className="text-sm font-semibold text-surface-200">{title}</h3>
          <span className={`text-sm font-bold ${text}`}>{score}/100</span>
        </div>
      </div>
      <div className="w-full bg-surface-800 rounded-full h-1.5 mb-4">
        <motion.div initial={{ width: 0 }} animate={{ width: `${score}%` }}
          transition={{ delay: delay + 0.2, duration: 1 }}
          className={`${bar} h-1.5 rounded-full`} />
      </div>

      {(strengths?.length > 0 || weaknesses?.length > 0) && (
        <div className="grid grid-cols-2 gap-3 mb-3 text-xs">
          {strengths?.length > 0 && <div>
            <p className="text-success font-semibold mb-1">Strengths</p>
            {strengths.map((s, i) => <p key={i} className="text-surface-400 mb-0.5">{s}</p>)}
          </div>}
          {weaknesses?.length > 0 && <div>
            <p className="text-warning font-semibold mb-1">Improve</p>
            {weaknesses.map((w, i) => <p key={i} className="text-surface-400 mb-0.5">{w}</p>)}
          </div>}
        </div>
      )}

      {tips?.length > 0 && (
        <div>
          <button onClick={() => setOpen(!open)} className="flex items-center gap-1 text-xs text-primary-400 hover:text-primary-300 font-medium">
            {open ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
            {tips.length} tips
          </button>
          <AnimatePresence>{open && (
            <motion.ul initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="mt-2 space-y-1.5 overflow-hidden">
              {tips.map((t, i) => <li key={i} className="text-xs text-surface-300 flex items-start gap-1.5"><AlertCircle className="w-3 h-3 shrink-0 mt-0.5 text-steel-500" />{t}</li>)}
            </motion.ul>
          )}</AnimatePresence>
        </div>
      )}
    </motion.div>
  );
}

/* ── Speech Stats ── */
function SpeechStats({ data }) {
  if (!data) return null;
  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}
      className="rounded-xl bg-surface-900/50 border border-surface-700/20 p-5">
      <h3 className="text-xs font-semibold text-surface-400 uppercase tracking-widest mb-4">Speech Analysis</h3>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: 'Total Words', value: data.totalWords || 0, icon: FileText },
          { label: 'Avg / Answer', value: data.avgWordCount || 0, icon: MessageSquare },
          { label: 'Filler Words', value: data.fillerCount || 0, icon: AlertCircle, warn: (data.fillerCount || 0) > 5 },
          { label: 'Pace', value: data.pace || '--', icon: Clock },
        ].map((s) => (
          <div key={s.label} className="text-center p-3 rounded-lg bg-surface-800/40">
            <s.icon className={`w-3.5 h-3.5 mx-auto mb-1 ${s.warn ? 'text-warning' : 'text-surface-400'}`} />
            <p className={`text-lg font-bold ${s.warn ? 'text-warning' : 'text-surface-100'}`}>{s.value}</p>
            <p className="text-[10px] text-surface-500 mt-0.5">{s.label}</p>
          </div>
        ))}
      </div>
    </motion.div>
  );
}

/* ── Transcript ── */
function TranscriptSection({ transcript, idealAnswers = {} }) {
  const [showAll, setShowAll] = useState(false);
  const [showIdeal, setShowIdeal] = useState(false);
  if (!transcript?.length) return null;
  const display = showAll ? transcript : transcript.slice(0, 3);
  const hasIdeals = Object.keys(idealAnswers).length > 0;

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }}
      className="rounded-xl bg-surface-900/50 border border-surface-700/20 p-5">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-xs font-semibold text-surface-400 uppercase tracking-widest">Transcript</h3>
        {hasIdeals && (
          <button onClick={() => setShowIdeal(!showIdeal)} className="text-[10px] text-primary-400 hover:text-primary-300 font-medium flex items-center gap-1">
            <Star className="w-3 h-3" /> {showIdeal ? 'Hide' : 'Show'} ideal answers
          </button>
        )}
      </div>
      <div className="space-y-3 max-h-[400px] overflow-y-auto">
        {display.map((item, i) => (
          <div key={i} className="rounded-lg bg-surface-800/30 border border-surface-700/15 p-3.5">
            <div className="flex items-start gap-2.5 mb-1.5">
              <Mic className="w-3.5 h-3.5 text-primary-500 mt-0.5 shrink-0" />
              <p className="text-xs font-medium text-surface-200">{item.question}</p>
            </div>
            <p className="text-[10px] text-surface-500 ml-6 mb-0.5">Your answer</p>
            <p className={`text-xs leading-relaxed ml-6 ${item.answer === '(skipped)' ? 'text-surface-500 italic' : 'text-surface-300'}`}>
              {item.answer}
            </p>
            {(showIdeal || idealAnswers[String(i)]) && idealAnswers[String(i)] && (
              <div className="ml-6">
                <IdealAnswerCard answer={idealAnswers[String(i)]} />
              </div>
            )}
          </div>
        ))}
      </div>
      {transcript.length > 3 && (
        <button onClick={() => setShowAll(!showAll)} className="mt-3 text-xs text-primary-400 hover:text-primary-300 font-medium">
          {showAll ? 'Show less' : `Show all ${transcript.length}`}
        </button>
      )}
    </motion.div>
  );
}

/* ── Main Page ── */
export default function ReportPage() {
  const { sessionId } = useParams();
  const router = useRouter();
  const { getToken } = useClerkAuth();
  const { user } = useUser();
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const shareCardRef = useRef(null);
  const certRef = useRef(null);

  useEffect(() => { fetchReport(); }, [sessionId]);

  const fetchReport = async () => {
    setLoading(true);
    try { setAuthTokenGetter(getToken); const r = await reportAPI.get(sessionId); setReport(r.data?.report || null); }
    catch { setReport(null); } finally { setLoading(false); }
  };

  const handleGenerate = async () => {
    setGenerating(true);
    try { setAuthTokenGetter(getToken); const r = await reportAPI.generate({ session_id: sessionId }); setReport(r.data?.report || null); }
    catch (e) { console.error(e); } finally { setGenerating(false); }
  };

  const handleShareImage = async () => {
    if (!shareCardRef.current) return;
    try {
      const html2canvas = (await import('html2canvas')).default;
      shareCardRef.current.style.position = 'fixed';
      shareCardRef.current.style.left = '0';
      shareCardRef.current.style.top = '0';
      const canvas = await html2canvas(shareCardRef.current, { scale: 2, useCORS: true });
      shareCardRef.current.style.position = 'absolute';
      shareCardRef.current.style.left = '-9999px';
      canvas.toBlob(blob => {
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a'); a.href = url; a.download = `levelup-report-${sessionId}.png`; a.click();
        URL.revokeObjectURL(url);
      });
    } catch (e) { console.error('Share image error:', e); }
  };

  const handleLinkedIn = () => {
    const url = encodeURIComponent(window.location.href);
    window.open(`https://www.linkedin.com/sharing/share-offsite/?url=${url}`, '_blank');
  };

  const handleWhatsApp = () => {
    const msg = encodeURIComponent(`I scored ${report?.overall_score}/100 on a mock interview! Check out LevelUp AI: ${window.location.href}`);
    window.open(`https://wa.me/?text=${msg}`, '_blank');
  };

  const handleCertDownload = async () => {
    if (!certRef.current) return;
    try {
      const html2canvas = (await import('html2canvas')).default;
      certRef.current.style.position = 'fixed';
      certRef.current.style.left = '0';
      certRef.current.style.top = '0';
      const canvas = await html2canvas(certRef.current, { scale: 2 });
      certRef.current.style.position = 'absolute';
      certRef.current.style.left = '-9999px';
      const { jsPDF } = await import('jspdf');
      const pdf = new jsPDF({ orientation: 'landscape', unit: 'px', format: [1122, 794] });
      pdf.addImage(canvas.toDataURL('image/png'), 'PNG', 0, 0, 1122, 794);
      pdf.save(`LevelUp-Certificate-${report?.certificate_id || 'cert'}.pdf`);
    } catch (e) { console.error('Certificate error:', e); }
  };

  if (loading) return <><Navbar /><SkeletonPage /></>;

  const ds = report?.detailed_scores || {};
  const hasCertificate = report?.certificate_id && report?.overall_score >= 80;

  return (
    <div className="min-h-screen bg-surface-950">
      <Navbar />

      {/* Hidden share card + certificate for canvas capture */}
      {report && <ShareCard ref={shareCardRef} report={report} session={report} />}
      {hasCertificate && <Certificate ref={certRef} report={report} userName={user?.fullName || 'Candidate'} session={report} />}

      <div className="max-w-4xl mx-auto px-6 py-10 space-y-6">
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
          <h1 className="text-2xl font-bold text-surface-50 tracking-tight mb-1">Interview Report</h1>
          <p className="text-sm text-surface-400">Detailed performance analysis</p>
        </motion.div>

        {!report ? (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
            className="text-center rounded-xl bg-surface-900/50 border border-surface-700/20 py-20 px-6">
            <div className="w-14 h-14 rounded-xl bg-surface-800 flex items-center justify-center mx-auto mb-5">
              <BarChart3 className="w-7 h-7 text-surface-400" />
            </div>
            <h2 className="text-lg font-bold text-surface-200 mb-2">Report Not Generated</h2>
            <p className="text-sm text-surface-400 mb-8 max-w-sm mx-auto">Analyze your answers, communication patterns, and technical depth</p>
            <Button onClick={handleGenerate} loading={generating} size="lg">
              {generating ? 'Analyzing...' : 'Generate Report'}
            </Button>
          </motion.div>
        ) : (
          <div className="space-y-5">
            {/* Certificate Banner */}
            {hasCertificate && (
              <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
                className="rounded-xl bg-gradient-to-r from-primary-500/10 to-success/10 border border-primary-500/20 p-5 text-center">
                <Award className="w-8 h-8 text-primary-500 mx-auto mb-2" />
                <h3 className="text-base font-bold text-surface-100 mb-1">Certificate Unlocked!</h3>
                <p className="text-xs text-surface-400 mb-3">You scored {report.overall_score}/100 on Hard difficulty</p>
                <div className="flex justify-center gap-2">
                  <Button size="sm" onClick={handleCertDownload} icon={Download}>Download Certificate</Button>
                  <Button size="sm" variant="secondary" onClick={handleLinkedIn} icon={ExternalLink}>Share on LinkedIn</Button>
                </div>
                <p className="text-[9px] text-surface-500 mt-2">ID: {report.certificate_id}</p>
              </motion.div>
            )}

            {/* Hero */}
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
              className="rounded-xl bg-surface-900/60 border border-surface-700/20 p-6">
              <div className="flex flex-col sm:flex-row items-center gap-6">
                <ScoreRing score={report.overall_score || 0} label="Overall" size={140} showGrade grade={report.grade} />
                <div className="flex-1 text-center sm:text-left">
                  <div className="flex items-center gap-2 justify-center sm:justify-start mb-2">
                    <Award className="w-4 h-4 text-primary-500" />
                    <h2 className="text-base font-bold text-surface-100">Performance Summary</h2>
                  </div>
                  <p className="text-sm text-surface-300 leading-relaxed mb-3">{report.summary || 'Review detailed scores below.'}</p>
                  <span className={`inline-block text-xs font-semibold px-2.5 py-0.5 rounded ${
                    (report.overall_score || 0) >= 75 ? 'bg-success/10 text-success'
                    : (report.overall_score || 0) >= 50 ? 'bg-warning/10 text-warning'
                    : 'bg-error/10 text-error'}`}>
                    {(report.overall_score || 0) >= 75 ? 'Strong Performance' : (report.overall_score || 0) >= 50 ? 'Room to Improve' : 'Needs Practice'}
                  </span>
                </div>
              </div>
            </motion.div>

            {/* Score Rings */}
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
              className="grid grid-cols-2 sm:grid-cols-5 gap-3 rounded-xl bg-surface-900/40 border border-surface-700/15 p-5">
              <ScoreRing score={report.body_language_score || 0} label="Body Language" size={90} delay={150} />
              <ScoreRing score={report.communication_score || 0} label="Communication" size={90} delay={200} />
              <ScoreRing score={report.technical_score || 0} label="Technical" size={90} delay={250} />
              <ScoreRing score={report.problem_solving_score || 0} label="Problem Solving" size={90} delay={300} />
              <ScoreRing score={report.project_knowledge_score || 0} label="Projects" size={90} delay={350} />
            </motion.div>

            {/* Score Cards */}
            <div className="grid md:grid-cols-2 gap-3">
              <ScoreCard icon={Eye} title="Body Language" score={report.body_language_score || 0} tips={report.tips?.body_language} strengths={ds.body_language?.strengths} weaknesses={ds.body_language?.weaknesses} delay={0.15} />
              <ScoreCard icon={MessageSquare} title="Communication" score={report.communication_score || 0} tips={report.tips?.communication} strengths={ds.communication?.strengths} weaknesses={ds.communication?.weaknesses} delay={0.2} />
              <ScoreCard icon={Code} title="Technical Accuracy" score={report.technical_score || 0} tips={report.tips?.technical} strengths={ds.technical?.strengths} weaknesses={ds.technical?.weaknesses} delay={0.25} />
              <ScoreCard icon={Brain} title="Problem Solving" score={report.problem_solving_score || 0} tips={report.tips?.problem_solving} strengths={ds.problem_solving?.strengths} weaknesses={ds.problem_solving?.weaknesses} delay={0.3} />
              <ScoreCard icon={TrendingUp} title="Project Knowledge" score={report.project_knowledge_score || 0} tips={report.tips?.projects} strengths={ds.project_knowledge?.strengths} weaknesses={ds.project_knowledge?.weaknesses} delay={0.35} />
              <ScoreCard icon={BarChart3} title="Overall Tips" score={report.overall_score || 0} tips={report.tips?.overall} delay={0.4} />
            </div>

            <SpeechStats data={report.speech_data} />
            <TranscriptSection transcript={report.transcript} idealAnswers={report.ideal_answers || {}} />

            {/* Share + Actions */}
            <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.6 }}
              className="rounded-xl bg-surface-900/40 border border-surface-700/15 p-5">
              <h3 className="text-xs font-semibold text-surface-400 uppercase tracking-widest mb-3">Share Result</h3>
              <div className="flex flex-wrap gap-2">
                <Button size="sm" variant="secondary" onClick={handleShareImage} icon={Download}>Download Image</Button>
                <Button size="sm" variant="secondary" onClick={handleLinkedIn} icon={ExternalLink}>LinkedIn</Button>
                <Button size="sm" variant="secondary" onClick={handleWhatsApp} icon={Share2}>WhatsApp</Button>
              </div>
            </motion.div>

            <div className="flex flex-col sm:flex-row justify-center gap-2.5 pt-2">
              <Button variant="secondary" size="lg" onClick={() => router.push('/setup')} icon={RefreshCw}>Practice Again</Button>
              <Button size="lg" onClick={() => router.push('/dashboard')} icon={ArrowRight}>Dashboard</Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
