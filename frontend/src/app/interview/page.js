'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth as useClerkAuth } from '@clerk/nextjs';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';
import {
  Clock, Send, SkipForward, StopCircle, MessageSquare, ChevronRight,
  Mic, MicOff, Video, VideoOff, Volume2, VolumeX, AlertCircle
} from 'lucide-react';
import Button from '@/components/ui/Button';
import Badge from '@/components/ui/Badge';
import { interviewAPI, setAuthTokenGetter } from '@/services/api';

/* ── Audio Visualizer ── */
function AudioVisualizer({ stream, isActive }) {
  const canvasRef = useRef(null);
  const animRef = useRef(null);

  useEffect(() => {
    if (!stream || !canvasRef.current) return;
    const ctx2d = canvasRef.current.getContext('2d');
    const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    const analyser = audioCtx.createAnalyser();
    analyser.fftSize = 64;
    audioCtx.createMediaStreamSource(stream).connect(analyser);
    const buf = new Uint8Array(analyser.frequencyBinCount);

    const draw = () => {
      animRef.current = requestAnimationFrame(draw);
      analyser.getByteFrequencyData(buf);
      const { width, height } = canvasRef.current;
      ctx2d.clearRect(0, 0, width, height);
      const bw = width / buf.length;
      for (let i = 0; i < buf.length; i++) {
        const v = buf[i] / 255;
        const h = v * height * 0.85;
        ctx2d.fillStyle = isActive ? `rgba(255, 119, 28, ${0.3 + v * 0.5})` : `rgba(84, 104, 119, 0.25)`;
        ctx2d.fillRect(i * bw, height - h, bw - 1, h);
      }
    };
    draw();
    return () => { cancelAnimationFrame(animRef.current); audioCtx.close(); };
  }, [stream, isActive]);

  return <canvas ref={canvasRef} width={200} height={36} className="w-full h-9 rounded" />;
}

/* ── STT Hook ── */
function useSpeechRecognition() {
  const [transcript, setTranscript] = useState('');
  const [isListening, setIsListening] = useState(false);
  const [supported, setSupported] = useState(true);
  const ref = useRef(null);

  useEffect(() => {
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SR) { setSupported(false); return; }
    const r = new SR();
    r.continuous = true; r.interimResults = true; r.lang = 'en-US';
    r.onresult = (e) => {
      let f = '', i2 = '';
      for (let i = 0; i < e.results.length; i++) {
        const t = e.results[i][0].transcript;
        if (e.results[i].isFinal) f += t + ' '; else i2 = t;
      }
      setTranscript((f + i2).trim());
    };
    r.onerror = (e) => { if (!['no-speech', 'aborted', 'network', 'not-allowed', 'service-not-allowed'].includes(e.error)) console.warn('STT:', e.error); };
    r.onend = () => { if (ref.current?._listen) try { r.start(); } catch {} };
    ref.current = r;
  }, []);

  const start = useCallback(() => { if (!ref.current) return; setTranscript(''); ref.current._listen = true; setIsListening(true); try { ref.current.start(); } catch {} }, []);
  const stop = useCallback(() => { if (!ref.current) return; ref.current._listen = false; setIsListening(false); try { ref.current.stop(); } catch {} }, []);
  const reset = useCallback(() => setTranscript(''), []);

  return { transcript, isListening, supported, start, stop, reset };
}

/* ── TTS Hook ── */
function useTTS() {
  const [speaking, setSpeaking] = useState(false);
  const [enabled, setEnabled] = useState(true);

  const speak = useCallback((text) => {
    if (!enabled || !window.speechSynthesis) return;
    window.speechSynthesis.cancel();
    const u = new SpeechSynthesisUtterance(text);
    u.rate = 0.95; u.pitch = 1.0; u.volume = 0.9;
    const voices = window.speechSynthesis.getVoices();
    const v = voices.find(v => v.name.includes('Google') && v.lang.startsWith('en')) || voices.find(v => v.lang.startsWith('en-'));
    if (v) u.voice = v;
    u.onstart = () => setSpeaking(true);
    u.onend = () => setSpeaking(false);
    u.onerror = () => setSpeaking(false);
    window.speechSynthesis.speak(u);
  }, [enabled]);

  const stopSpeech = useCallback(() => { window.speechSynthesis?.cancel(); setSpeaking(false); }, []);
  return { speak, stop: stopSpeech, speaking, enabled, setEnabled };
}

/* ── Main Page ── */
export default function InterviewSessionPage() {
  const router = useRouter();
  const { getToken } = useClerkAuth();
  const [sessionId, setSessionId] = useState(null);
  const [currentQuestion, setCurrentQuestion] = useState(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [totalQuestions, setTotalQuestions] = useState(10);
  const [answer, setAnswer] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [isComplete, setIsComplete] = useState(false);
  const [isFollowUp, setIsFollowUp] = useState(false);
  const [config, setConfig] = useState({});
  const [timer, setTimer] = useState(0);
  const [qTimer, setQTimer] = useState(0);
  const [answeredCount, setAnsweredCount] = useState(0);
  const [cameraOn, setCameraOn] = useState(true);
  const [micMode, setMicMode] = useState('voice');
  const videoRef = useRef(null);
  const streamRef = useRef(null);
  const textareaRef = useRef(null);
  const stt = useSpeechRecognition();
  const tts = useTTS();

  useEffect(() => {
    const s = sessionStorage.getItem('interviewSession');
    if (s) {
      const d = JSON.parse(s);
      setSessionId(d.sessionId); setCurrentQuestion(d.currentQuestion);
      setCurrentIndex(d.currentIndex); setTotalQuestions(d.totalQuestions);
      setConfig({ companyType: d.companyType, difficulty: d.difficulty, role: d.role });
    } else { toast.error('No session found'); router.push('/setup'); }
  }, [router]);

  useEffect(() => {
    const startCam = async () => {
      try {
        const s = await navigator.mediaDevices.getUserMedia({ video: { width: 640, height: 480 }, audio: true });
        streamRef.current = s;
        if (videoRef.current) videoRef.current.srcObject = s;
      } catch { setCameraOn(false); }
    };
    startCam();
    return () => { streamRef.current?.getTracks().forEach(t => t.stop()); };
  }, []);

  useEffect(() => {
    if (!isComplete) {
      const iv = setInterval(() => { setTimer(t => t + 1); setQTimer(t => t + 1); }, 1000);
      return () => clearInterval(iv);
    }
  }, [isComplete]);

  useEffect(() => {
    if (currentQuestion?.question) { tts.speak(currentQuestion.question); }
    setQTimer(0);
    const d = setTimeout(() => { if (micMode === 'voice' && stt.supported) stt.start(); }, 2000);
    return () => clearTimeout(d);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentQuestion]);

  useEffect(() => { if (micMode === 'voice' && stt.transcript) setAnswer(stt.transcript); }, [stt.transcript, micMode]);

  const fmt = (s) => `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`;

  const toggleCam = () => {
    const vt = streamRef.current?.getVideoTracks();
    if (vt?.length) { vt[0].enabled = !vt[0].enabled; setCameraOn(vt[0].enabled); }
  };

  const toggleMic = () => {
    if (micMode === 'voice') { stt.stop(); setMicMode('type'); }
    else { setMicMode('voice'); if (stt.supported) stt.start(); }
  };

  const handleSubmit = async () => {
    if (!answer.trim()) return;
    setSubmitting(true); stt.stop(); tts.stop();
    try {
      setAuthTokenGetter(getToken);
      const res = await interviewAPI.next({ session_id: sessionId, answer, skip_followup: isFollowUp });
      setAnswer(''); stt.reset(); setAnsweredCount(c => c + 1);
      if (res.data.is_complete) { setIsComplete(true); }
      else if (res.data.is_followup) { setCurrentQuestion(res.data.followup_question); setIsFollowUp(true); }
      else { setCurrentQuestion(res.data.current_question); setCurrentIndex(res.data.current_index); setIsFollowUp(false); }
    } catch { toast.error('Failed to submit'); }
    finally { setSubmitting(false); }
  };

  const handleEnd = async () => {
    stt.stop(); tts.stop();
    try { setAuthTokenGetter(getToken); await interviewAPI.end({ session_id: sessionId }); setIsComplete(true); } catch {}
  };

  if (!currentQuestion && !isComplete) {
    return <div className="h-screen bg-surface-950 flex items-center justify-center">
      <div className="w-12 h-12 rounded-full border-2 border-primary-500 border-t-transparent animate-spin" />
    </div>;
  }

  return (
    <div className="h-screen bg-surface-950 flex flex-col overflow-hidden">
      {/* Top Bar */}
      <div className="shrink-0 bg-surface-900/70 backdrop-blur-xl border-b border-surface-700/20 px-5 py-2">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <span className="text-xs font-medium text-surface-400">{config.companyType} · {config.difficulty} · {config.role}</span>
          <div className="flex items-center gap-2.5">
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-surface-800/50 text-xs text-surface-300">
              <MessageSquare className="w-3 h-3 text-primary-500" />{currentIndex + 1}/{totalQuestions}
            </div>
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-surface-800/50 text-xs font-mono text-surface-300">
              <Clock className="w-3 h-3" />{fmt(timer)}
            </div>
            {!isComplete && <Button variant="danger" size="sm" onClick={handleEnd} icon={StopCircle}>End</Button>}
          </div>
        </div>
        <div className="max-w-7xl mx-auto mt-1.5">
          <div className="h-[2px] bg-surface-800 rounded-full"><motion.div className="h-full bg-primary-500 rounded-full" animate={{ width: `${((currentIndex + 1) / totalQuestions) * 100}%` }} /></div>
        </div>
      </div>

      {/* Main */}
      <div className="flex-1 flex overflow-hidden">
        {isComplete ? (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex-1 flex items-center justify-center p-6">
            <div className="text-center max-w-md">
              <div className="w-16 h-16 rounded-2xl bg-success/10 flex items-center justify-center mx-auto mb-5">
                <CheckCircle2 className="w-8 h-8 text-success" />
              </div>
              <h2 className="text-2xl font-bold text-surface-50 mb-2">Interview Complete</h2>
              <p className="text-sm text-surface-400 mb-8">{fmt(timer)} duration · {answeredCount} questions answered</p>
              <Button size="lg" onClick={() => router.push(`/report/${sessionId}`)} icon={ChevronRight}>
                View Report
              </Button>
            </div>
          </motion.div>
        ) : (
          <div className="flex-1 flex flex-col lg:flex-row overflow-hidden">
            {/* Left: Camera */}
            <div className="lg:w-[340px] shrink-0 p-4 flex flex-col gap-3">
              <div className="relative rounded-xl overflow-hidden bg-surface-900 border border-surface-700/20 aspect-[4/3]">
                <video ref={videoRef} autoPlay muted playsInline className={`w-full h-full object-cover ${!cameraOn ? 'hidden' : ''}`} />
                {!cameraOn && <div className="absolute inset-0 flex items-center justify-center bg-surface-900"><VideoOff className="w-8 h-8 text-surface-600" /></div>}
                {stt.isListening && (
                  <div className="absolute top-2.5 left-2.5 flex items-center gap-1.5 px-2 py-0.5 rounded bg-error/20 border border-error/30 backdrop-blur-sm">
                    <div className="w-1.5 h-1.5 rounded-full bg-error animate-pulse" />
                    <span className="text-[10px] text-error font-semibold tracking-wider">REC</span>
                  </div>
                )}
                <div className="absolute top-2.5 right-2.5 px-2 py-0.5 rounded bg-surface-900/60 backdrop-blur-sm text-[10px] font-mono text-surface-300">{fmt(qTimer)}</div>
              </div>

              <div className="flex items-center justify-center gap-1.5">
                {[
                  { on: cameraOn, toggle: toggleCam, iconOn: Video, iconOff: VideoOff },
                  { on: micMode === 'voice', toggle: toggleMic, iconOn: Mic, iconOff: MicOff },
                  { on: tts.enabled, toggle: () => tts.setEnabled(!tts.enabled), iconOn: Volume2, iconOff: VolumeX },
                ].map(({ on, toggle, iconOn: I1, iconOff: I2 }, idx) => (
                  <button key={idx} onClick={toggle}
                    className={`p-2 rounded-lg border transition-all ${on ? 'bg-surface-800 border-surface-600/50 text-surface-300' : 'bg-surface-900 border-surface-700/30 text-surface-500'}`}>
                    {on ? <I1 className="w-4 h-4" /> : <I2 className="w-4 h-4" />}
                  </button>
                ))}
              </div>

              {streamRef.current && (
                <div className="rounded-lg bg-surface-900/40 border border-surface-700/20 p-1.5">
                  <AudioVisualizer stream={streamRef.current} isActive={stt.isListening} />
                </div>
              )}

              <p className="text-center text-[11px] font-medium text-surface-500">
                {micMode === 'voice' ? 'Voice Mode' : 'Type Mode'}
              </p>
            </div>

            {/* Right: Q&A */}
            <div className="flex-1 flex flex-col p-4 overflow-hidden">
              <AnimatePresence mode="wait">
                <motion.div key={`q-${currentIndex}-${isFollowUp}`}
                  initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}
                  className="shrink-0 rounded-xl bg-surface-900/50 border border-surface-700/20 p-5 mb-4">
                  <div className="flex items-center gap-2 mb-2.5 flex-wrap">
                    <Badge type={currentQuestion?.type || 'technical'} />
                    {isFollowUp && <span className="text-[10px] text-primary-400 bg-primary-500/8 px-2 py-0.5 rounded font-semibold uppercase tracking-wider">Follow-up</span>}
                    {tts.speaking && <span className="text-[10px] text-success bg-success/8 px-2 py-0.5 rounded font-semibold flex items-center gap-1"><Volume2 className="w-2.5 h-2.5" /> Speaking</span>}
                    <span className="text-[10px] text-surface-500 ml-auto font-medium">Q{currentIndex + 1}/{totalQuestions}</span>
                  </div>
                  <p className="text-[15px] text-surface-100 leading-relaxed font-medium">{currentQuestion?.question}</p>
                  {currentQuestion?.hint && (
                    <p className="text-xs text-surface-500 mt-2.5 flex items-start gap-1.5">
                      <AlertCircle className="w-3.5 h-3.5 shrink-0 mt-0.5 text-steel-500" /><span>{currentQuestion.hint}</span>
                    </p>
                  )}
                </motion.div>
              </AnimatePresence>

              <div className="flex-1 flex flex-col min-h-0">
                {micMode === 'voice' ? (
                  <div className="flex-1 flex flex-col">
                    <div className="flex-1 rounded-xl bg-surface-900/30 border border-surface-700/15 p-4 overflow-y-auto mb-3">
                      {answer ? <p className="text-sm text-surface-200 leading-relaxed whitespace-pre-wrap">{answer}</p>
                        : <div className="h-full flex items-center justify-center">
                            <div className="text-center"><Mic className="w-6 h-6 text-surface-600 mx-auto mb-2" />
                            <p className="text-xs text-surface-500">{stt.isListening ? 'Listening...' : 'Tap mic to speak'}</p></div>
                          </div>}
                    </div>
                    <div className="flex items-center gap-2.5">
                      <button onClick={stt.isListening ? stt.stop : stt.start}
                        className={`p-3 rounded-xl transition-all ${stt.isListening ? 'bg-error text-white shadow-lg shadow-error/20' : 'bg-primary-500 text-white shadow-lg shadow-primary-500/20 hover:bg-primary-600'}`}>
                        {stt.isListening ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
                      </button>
                      <span className="flex-1 text-[11px] text-surface-500">{answer ? `${answer.split(/\s+/).filter(Boolean).length} words` : ''}</span>
                      <Button variant="ghost" size="sm" onClick={() => { setAnswer('(skipped)'); handleSubmit(); }} icon={SkipForward}>Skip</Button>
                      <Button onClick={handleSubmit} loading={submitting} disabled={!answer.trim()} icon={Send}>Submit</Button>
                    </div>
                  </div>
                ) : (
                  <div className="flex-1 flex flex-col">
                    <textarea ref={textareaRef} value={answer} onChange={(e) => setAnswer(e.target.value)}
                      onKeyDown={(e) => { if (e.key === 'Enter' && e.ctrlKey) handleSubmit(); }}
                      placeholder="Type your answer... (Ctrl+Enter to submit)"
                      className="flex-1 bg-surface-900/30 border border-surface-700/15 rounded-xl p-4 text-sm text-surface-100 placeholder-surface-600 focus:outline-none focus:ring-1 focus:ring-primary-500/30 resize-none leading-relaxed mb-3" />
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] text-surface-500">{answer.length > 0 ? `${answer.split(/\s+/).filter(Boolean).length} words` : 'Ctrl+Enter'}</span>
                      <div className="flex gap-2">
                        <Button variant="ghost" size="sm" onClick={() => { setAnswer('(skipped)'); handleSubmit(); }} icon={SkipForward}>Skip</Button>
                        <Button onClick={handleSubmit} loading={submitting} disabled={!answer.trim()} icon={Send}>Submit</Button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
