'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth as useClerkAuth } from '@clerk/nextjs';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';
import {
  Mic, ChevronRight, Building, Target, Shield,
  Camera, CameraOff, CheckCircle2, AlertTriangle, Loader2, ArrowLeft, ArrowRight
} from 'lucide-react';
import Navbar from '@/components/ui/Navbar';
import Button from '@/components/ui/Button';
import { interviewAPI, setAuthTokenGetter } from '@/services/api';
import { COMPANY_TYPES, DIFFICULTIES, ROLES } from '@/utils/constants';
import { useAuth } from '@/context/AuthContext';

export default function InterviewSetupPage() {
  const router = useRouter();
  const { getToken } = useClerkAuth();
  const { profile } = useAuth();
  const [companyType, setCompanyType] = useState('');
  const [difficulty, setDifficulty] = useState('');
  const [role, setRole] = useState(profile?.targetRole || '');
  const [starting, setStarting] = useState(false);
  const [step, setStep] = useState('config');
  const [cameraOk, setCameraOk] = useState(null);
  const [micOk, setMicOk] = useState(null);
  const videoRef = useRef(null);
  const streamRef = useRef(null);

  useEffect(() => {
    return () => { streamRef.current?.getTracks().forEach(t => t.stop()); };
  }, []);

  const checkPermissions = async () => {
    setStep('permissions');
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
      streamRef.current = stream;
      if (videoRef.current) videoRef.current.srcObject = stream;
      setCameraOk(true);
      setMicOk(true);
      setTimeout(() => setStep('ready'), 1200);
    } catch (err) {
      try {
        const vs = await navigator.mediaDevices.getUserMedia({ video: true });
        streamRef.current = vs;
        if (videoRef.current) videoRef.current.srcObject = vs;
        setCameraOk(true);
      } catch { setCameraOk(false); }
      try {
        await navigator.mediaDevices.getUserMedia({ audio: true });
        setMicOk(true);
      } catch { setMicOk(false); }
      setTimeout(() => setStep('ready'), 1200);
    }
  };

  const handleProceed = () => {
    if (!companyType) { toast.error('Select a company type'); return; }
    if (!difficulty) { toast.error('Select difficulty'); return; }
    if (!role) { toast.error('Select a role'); return; }
    checkPermissions();
  };

  const handleStart = async () => {
    setStarting(true);
    try {
      setAuthTokenGetter(getToken);
      const res = await interviewAPI.start({ company_type: companyType, difficulty, role });
      sessionStorage.setItem('interviewSession', JSON.stringify({
        sessionId: res.data.session_id,
        currentQuestion: res.data.current_question,
        currentIndex: res.data.current_index,
        totalQuestions: res.data.total_questions,
        companyType, difficulty, role,
      }));
      streamRef.current?.getTracks().forEach(t => t.stop());
      router.push('/interview');
    } catch (error) {
      console.error(error);
      toast.error('Failed to start interview');
    } finally { setStarting(false); }
  };

  return (
    <div className="min-h-screen bg-surface-950">
      <Navbar />
      <div className="max-w-3xl mx-auto px-6 py-12">

        {/* Header */}
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="mb-10">
          <h1 className="text-2xl font-bold text-surface-50 tracking-tight mb-1">Interview Setup</h1>
          <p className="text-sm text-surface-400">
            {step === 'config' && 'Configure your session preferences'}
            {step === 'permissions' && 'Checking device access...'}
            {step === 'ready' && 'Ready to begin'}
          </p>
        </motion.div>

        <AnimatePresence mode="wait">
          {/* Config */}
          {step === 'config' && (
            <motion.div key="config" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -12 }} className="space-y-8">

              {/* Company Type */}
              <div>
                <label className="flex items-center gap-2 text-xs font-semibold text-surface-400 uppercase tracking-widest mb-3">
                  <Building className="w-3.5 h-3.5" /> Company Type
                </label>
                <div className="grid sm:grid-cols-2 gap-2">
                  {COMPANY_TYPES.map((c) => (
                    <button key={c.value} onClick={() => setCompanyType(c.value)}
                      className={`p-4 rounded-lg border text-left transition-all ${companyType === c.value
                        ? 'border-primary-500/40 bg-primary-500/5'
                        : 'border-surface-700/30 bg-surface-900/40 hover:border-surface-600/50'}`}
                    >
                      <p className={`text-sm font-semibold ${companyType === c.value ? 'text-primary-400' : 'text-surface-200'}`}>{c.label}</p>
                      <p className="text-xs text-surface-500 mt-0.5">{c.description}</p>
                    </button>
                  ))}
                </div>
              </div>

              {/* Difficulty */}
              <div>
                <label className="flex items-center gap-2 text-xs font-semibold text-surface-400 uppercase tracking-widest mb-3">
                  <Target className="w-3.5 h-3.5" /> Difficulty
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {DIFFICULTIES.map((d) => (
                    <button key={d.value} onClick={() => setDifficulty(d.value)}
                      className={`p-4 rounded-lg border text-center transition-all ${difficulty === d.value
                        ? 'border-primary-500/40 bg-primary-500/5'
                        : 'border-surface-700/30 bg-surface-900/40 hover:border-surface-600/50'}`}
                    >
                      <p className={`text-sm font-bold ${difficulty === d.value ? 'text-primary-400' : 'text-surface-200'}`}>{d.label}</p>
                      <p className="text-[11px] text-surface-500 mt-0.5">{d.description}</p>
                    </button>
                  ))}
                </div>
              </div>

              {/* Role */}
              <div>
                <label className="flex items-center gap-2 text-xs font-semibold text-surface-400 uppercase tracking-widest mb-3">
                  <Shield className="w-3.5 h-3.5" /> Target Role
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {ROLES.map((r) => (
                    <button key={r.value} onClick={() => setRole(r.value)}
                      className={`py-3 px-4 rounded-lg border text-sm font-medium transition-all ${role === r.value
                        ? 'border-primary-500/40 bg-primary-500/5 text-primary-400'
                        : 'border-surface-700/30 bg-surface-900/40 text-surface-300 hover:border-surface-600/50'}`}
                    >
                      {r.label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex justify-end pt-2">
                <Button size="lg" onClick={handleProceed} disabled={!companyType || !difficulty || !role} icon={ArrowRight}>
                  Continue
                </Button>
              </div>
            </motion.div>
          )}

          {/* Permissions */}
          {step === 'permissions' && (
            <motion.div key="perm" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -12 }}
              className="max-w-sm mx-auto">
              <div className="rounded-xl bg-surface-900/60 border border-surface-700/30 p-6 space-y-5">
                {[{ ok: cameraOk, label: 'Camera', sub: 'Video feed during interview' },
                  { ok: micOk, label: 'Microphone', sub: 'Voice input for answers' }].map(({ ok, label, sub }) => (
                  <div key={label} className="flex items-center gap-4">
                    {ok === null ? <Loader2 className="w-5 h-5 text-primary-500 animate-spin" />
                      : ok ? <CheckCircle2 className="w-5 h-5 text-success" />
                      : <AlertTriangle className="w-5 h-5 text-warning" />}
                    <div>
                      <p className="text-sm font-medium text-surface-200">{label}</p>
                      <p className="text-xs text-surface-500">{ok === null ? 'Requesting...' : ok ? 'Granted' : 'Unavailable'}</p>
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>
          )}

          {/* Ready */}
          {step === 'ready' && (
            <motion.div key="ready" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -12 }}
              className="max-w-md mx-auto space-y-6">
              <div className="relative rounded-xl overflow-hidden bg-surface-900 border border-surface-700/30 aspect-[4/3]">
                <video ref={videoRef} autoPlay muted playsInline className="w-full h-full object-cover" />
                {!cameraOk && (
                  <div className="absolute inset-0 flex items-center justify-center bg-surface-900">
                    <CameraOff className="w-10 h-10 text-surface-600" />
                  </div>
                )}
              </div>

              <div className="rounded-xl bg-surface-900/50 border border-surface-700/30 p-4">
                <div className="grid grid-cols-3 gap-4 text-center text-xs">
                  <div><p className="text-surface-500 mb-0.5">Company</p><p className="font-semibold text-surface-200">{companyType}</p></div>
                  <div><p className="text-surface-500 mb-0.5">Difficulty</p><p className="font-semibold text-surface-200">{difficulty}</p></div>
                  <div><p className="text-surface-500 mb-0.5">Role</p><p className="font-semibold text-surface-200">{role}</p></div>
                </div>
              </div>

              <div className="rounded-xl bg-primary-500/5 border border-primary-500/15 p-4">
                <p className="text-xs font-semibold text-primary-400 mb-2">Before you start</p>
                <ul className="text-xs text-surface-400 space-y-1">
                  <li>Look at the camera to simulate eye contact</li>
                  <li>Speak clearly and at a moderate pace</li>
                  <li>You can switch between voice and type mode anytime</li>
                </ul>
              </div>

              <div className="flex gap-3">
                <Button variant="secondary" onClick={() => { streamRef.current?.getTracks().forEach(t => t.stop()); setStep('config'); }} icon={ArrowLeft}>
                  Back
                </Button>
                <Button size="lg" onClick={handleStart} loading={starting} className="flex-1">
                  Begin Interview
                </Button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
