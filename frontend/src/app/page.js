'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import { useUser } from '@clerk/nextjs';
import {
  Brain, Eye, BarChart3, GitFork, ArrowRight,
  Shield, TrendingUp, CheckCircle2, Mic, FileText, Code
} from 'lucide-react';
import Navbar from '@/components/ui/Navbar';

const features = [
  { icon: Brain, title: 'AI-Powered Interviews', description: 'Personalized questions based on your resume and GitHub projects.' },
  { icon: Eye, title: 'Body Language Analysis', description: 'Real-time confidence, eye contact, and posture evaluation.' },
  { icon: BarChart3, title: 'Detailed Reports', description: 'Scorecards with improvement tips across six performance categories.' },
  { icon: GitFork, title: 'GitHub Integration', description: 'Project-specific questions generated from your actual repositories.' },
];

const steps = [
  { num: '01', icon: FileText, title: 'Upload Resume', description: 'AI parses your skills, experience, and projects automatically.' },
  { num: '02', icon: Mic, title: 'Start Interview', description: 'Camera-enabled session with voice recognition and real-time AI questions.' },
  { num: '03', icon: BarChart3, title: 'Get Your Report', description: 'Detailed analysis of technical, communication, and soft skills.' },
];

const fade = { hidden: { opacity: 0, y: 16 }, show: { opacity: 1, y: 0 } };
const stagger = { hidden: { opacity: 0 }, show: { opacity: 1, transition: { staggerChildren: 0.1 } } };

export default function LandingPage() {
  const { isSignedIn } = useUser();

  return (
    <div className="min-h-screen bg-surface-950">
      <Navbar />

      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-primary-500/[0.03] rounded-full blur-[120px]" />
          <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-steel-500/[0.03] rounded-full blur-[100px]" />
        </div>

        <div className="relative max-w-5xl mx-auto px-6 pt-24 pb-20">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}
            className="text-center max-w-3xl mx-auto">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary-500/8 border border-primary-500/15 text-xs font-semibold text-primary-400 mb-8">
              <div className="w-1.5 h-1.5 rounded-full bg-primary-500" />
              AI-Powered Interview Platform
            </div>

            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-surface-50 mb-6 leading-[1.1]">
              Ace Your Next
              <br />
              <span className="gradient-text">Interview</span>
            </h1>

            <p className="text-base sm:text-lg text-surface-400 max-w-xl mx-auto mb-10 leading-relaxed">
              Practice with AI that reads your resume and GitHub, asks real interview questions,
              and gives detailed feedback on your technical skills, communication, and body language.
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
              <Link href={isSignedIn ? '/dashboard' : '/sign-up'}
                className="flex items-center gap-2 px-7 py-3.5 bg-primary-500 hover:bg-primary-600 text-white font-semibold rounded-lg transition-all shadow-md shadow-primary-500/15">
                Get Started <ArrowRight className="w-4 h-4" />
              </Link>
              <Link href="#how-it-works"
                className="flex items-center gap-2 px-7 py-3.5 bg-surface-800/50 hover:bg-surface-800 text-surface-200 font-medium rounded-lg border border-surface-700/30 transition-all">
                How It Works
              </Link>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Features */}
      <section className="max-w-5xl mx-auto px-6 py-20">
        <motion.div variants={stagger} initial="hidden" whileInView="show" viewport={{ once: true }}
          className="text-center mb-14">
          <motion.p variants={fade} className="text-xs font-semibold text-primary-500 uppercase tracking-widest mb-3">Features</motion.p>
          <motion.h2 variants={fade} className="text-2xl sm:text-3xl font-bold text-surface-50 tracking-tight">
            Everything you need to prepare
          </motion.h2>
        </motion.div>

        <motion.div variants={stagger} initial="hidden" whileInView="show" viewport={{ once: true }}
          className="grid sm:grid-cols-2 gap-3">
          {features.map((f) => (
            <motion.div key={f.title} variants={fade}
              className="group rounded-xl bg-surface-900/50 border border-surface-700/20 p-6 hover:border-surface-600/30 transition-all">
              <div className="w-10 h-10 rounded-lg bg-surface-800 flex items-center justify-center mb-4 group-hover:bg-primary-500/10 transition-colors">
                <f.icon className="w-5 h-5 text-surface-300 group-hover:text-primary-500 transition-colors" />
              </div>
              <h3 className="text-sm font-semibold text-surface-100 mb-1.5">{f.title}</h3>
              <p className="text-xs text-surface-400 leading-relaxed">{f.description}</p>
            </motion.div>
          ))}
        </motion.div>
      </section>

      {/* How it Works */}
      <section id="how-it-works" className="max-w-5xl mx-auto px-6 py-20">
        <motion.div variants={stagger} initial="hidden" whileInView="show" viewport={{ once: true }}
          className="text-center mb-14">
          <motion.p variants={fade} className="text-xs font-semibold text-primary-500 uppercase tracking-widest mb-3">Process</motion.p>
          <motion.h2 variants={fade} className="text-2xl sm:text-3xl font-bold text-surface-50 tracking-tight">
            Three simple steps
          </motion.h2>
        </motion.div>

        <motion.div variants={stagger} initial="hidden" whileInView="show" viewport={{ once: true }}
          className="grid sm:grid-cols-3 gap-3">
          {steps.map((step) => (
            <motion.div key={step.num} variants={fade}
              className="rounded-xl bg-surface-900/50 border border-surface-700/20 p-6 text-center">
              <span className="text-[10px] font-bold text-primary-500/60 uppercase tracking-widest">{step.num}</span>
              <div className="w-10 h-10 rounded-lg bg-surface-800 flex items-center justify-center mx-auto my-4">
                <step.icon className="w-5 h-5 text-surface-300" />
              </div>
              <h3 className="text-sm font-semibold text-surface-100 mb-1.5">{step.title}</h3>
              <p className="text-xs text-surface-400 leading-relaxed">{step.description}</p>
            </motion.div>
          ))}
        </motion.div>
      </section>

      {/* What You Get */}
      <section className="max-w-5xl mx-auto px-6 py-20">
        <motion.div variants={stagger} initial="hidden" whileInView="show" viewport={{ once: true }}
          className="rounded-xl bg-surface-900/50 border border-surface-700/20 p-8 sm:p-12">
          <div className="max-w-lg mx-auto text-center mb-8">
            <p className="text-xs font-semibold text-primary-500 uppercase tracking-widest mb-3">Analysis</p>
            <h2 className="text-2xl font-bold text-surface-50 tracking-tight mb-3">Comprehensive Feedback</h2>
            <p className="text-sm text-surface-400">Every interview generates a detailed report covering six dimensions of performance.</p>
          </div>
          <motion.div variants={stagger} initial="hidden" whileInView="show" viewport={{ once: true }}
            className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {[
              { icon: Eye, label: 'Body Language', desc: 'Confidence and posture' },
              { icon: Mic, label: 'Communication', desc: 'Clarity and filler words' },
              { icon: Code, label: 'Technical Depth', desc: 'Accuracy of answers' },
              { icon: Brain, label: 'Problem Solving', desc: 'Thought process quality' },
              { icon: GitFork, label: 'Project Knowledge', desc: 'Depth of understanding' },
              { icon: TrendingUp, label: 'Overall Grade', desc: 'A+ to F performance' },
            ].map((item) => (
              <motion.div key={item.label} variants={fade} className="flex items-start gap-3 p-3 rounded-lg">
                <div className="w-8 h-8 rounded-lg bg-surface-800 flex items-center justify-center shrink-0">
                  <item.icon className="w-4 h-4 text-primary-500" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-surface-100">{item.label}</p>
                  <p className="text-xs text-surface-400">{item.desc}</p>
                </div>
              </motion.div>
            ))}
          </motion.div>
        </motion.div>
      </section>

      {/* CTA */}
      <section className="max-w-5xl mx-auto px-6 py-20">
        <motion.div initial={{ opacity: 0, y: 16 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
          className="text-center">
          <h2 className="text-2xl sm:text-3xl font-bold text-surface-50 tracking-tight mb-4">
            Ready to level up?
          </h2>
          <p className="text-sm text-surface-400 mb-8 max-w-md mx-auto">
            Join students who are acing their interviews with AI-powered practice and feedback.
          </p>
          <Link href={isSignedIn ? '/setup' : '/sign-up'}
            className="inline-flex items-center gap-2 px-8 py-4 bg-primary-500 hover:bg-primary-600 text-white font-semibold rounded-lg transition-all shadow-md shadow-primary-500/15">
            Start Practicing <ArrowRight className="w-4 h-4" />
          </Link>
        </motion.div>
      </section>

      {/* Footer */}
      <footer className="border-t border-surface-700/20 py-8">
        <div className="max-w-5xl mx-auto px-6 flex items-center justify-between text-xs text-surface-500">
          <span>LevelUp AI</span>
          <span>Built for students, by students</span>
        </div>
      </footer>
    </div>
  );
}
