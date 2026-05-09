'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useUser, useAuth as useClerkAuth } from '@clerk/nextjs';
import { motion, AnimatePresence } from 'framer-motion';
import {
  AreaChart, Area, BarChart, Bar, RadarChart, Radar, PolarGrid,
  PolarAngleAxis, PolarRadiusAxis, ResponsiveContainer, XAxis, YAxis,
  Tooltip, CartesianGrid, PieChart, Pie, Cell
} from 'recharts';
import {
  ArrowUpRight, Clock, BarChart3, Target, Mic, ChevronRight,
  TrendingUp, Award, Shield, Star, Flame, Zap, Users,
  Calendar, Filter, CheckCircle2
} from 'lucide-react';
import Navbar from '@/components/ui/Navbar';
import Button from '@/components/ui/Button';
import GapAnalysis from '@/components/dashboard/GapAnalysis';
import { dashboardAPI, profileAPI, setAuthTokenGetter } from '@/services/api';
import { useAuth } from '@/context/AuthContext';

const TABS = [
  { id: 'overview', label: 'Overview' },
  { id: 'history', label: 'History' },
  { id: 'badges', label: 'Badges' },
  { id: 'leaderboard', label: 'Leaderboard' },
];

const BADGE_ICONS = {
  first_interview: CheckCircle2,
  five_sessions: Star,
  ten_sessions: Award,
  high_scorer: Zap,
  consistent: Target,
  streak_3: Flame,
  streak_7: Flame,
  tech_master: Shield,
  communicator: Mic,
  all_rounder: TrendingUp,
};

const PIE_COLORS = ['#ff771c', '#546877', '#34d399', '#fbbf24'];

/* ── Stat Card ── */
function StatCard({ label, value, sub, icon: Icon, accent, delay = 0 }) {
  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay }}
      className="rounded-xl bg-surface-900/50 border border-surface-700/20 p-5">
      <div className="flex items-center justify-between mb-3">
        <div className={`w-9 h-9 rounded-lg flex items-center justify-center ${accent ? 'bg-primary-500/10' : 'bg-surface-800'}`}>
          <Icon className={`w-4 h-4 ${accent ? 'text-primary-500' : 'text-surface-400'}`} />
        </div>
        {sub && <span className="text-[10px] text-surface-500 font-medium">{sub}</span>}
      </div>
      <p className="text-2xl font-bold text-surface-50 tracking-tight">{value}</p>
      <p className="text-xs text-surface-400 mt-1 font-medium">{label}</p>
    </motion.div>
  );
}

/* ── Chart Tooltip ── */
function ChartTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-surface-800 border border-surface-700/30 rounded-lg px-3 py-2 text-xs shadow-xl">
      <p className="text-surface-400 mb-1">Session {label}</p>
      {payload.map((p, i) => (
        <p key={i} className="font-medium" style={{ color: p.color }}>{p.name}: {p.value}</p>
      ))}
    </div>
  );
}

/* ── Overview Tab ── */
function OverviewTab({ stats }) {
  const radarData = [
    { category: 'Technical', value: stats.categoryAverages?.technical || 0 },
    { category: 'Communication', value: stats.categoryAverages?.communication || 0 },
    { category: 'Body Language', value: stats.categoryAverages?.bodyLanguage || 0 },
    { category: 'Problem Solving', value: stats.categoryAverages?.problemSolving || 0 },
    { category: 'Projects', value: stats.categoryAverages?.projects || 0 },
  ];

  const diffData = Object.entries(stats.difficultyDist || {})
    .filter(([, v]) => v > 0)
    .map(([name, value]) => ({ name, value }));

  const companyData = Object.entries(stats.companyDist || {})
    .filter(([, v]) => v > 0)
    .map(([name, value]) => ({ name, value }));

  return (
    <div className="space-y-5">
      {/* Score Trend */}
      {stats.scoreTrend?.length > 1 && (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
          className="rounded-xl bg-surface-900/50 border border-surface-700/20 p-5">
          <h3 className="text-xs font-semibold text-surface-400 uppercase tracking-widest mb-4">Score Trend</h3>
          <ResponsiveContainer width="100%" height={220}>
            <AreaChart data={stats.scoreTrend}>
              <defs>
                <linearGradient id="grad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#ff771c" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#ff771c" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid stroke="#2e2a25" strokeDasharray="3 3" />
              <XAxis dataKey="index" tick={{ fill: '#6b6155', fontSize: 11 }} axisLine={false} tickLine={false} />
              <YAxis domain={[0, 100]} tick={{ fill: '#6b6155', fontSize: 11 }} axisLine={false} tickLine={false} />
              <Tooltip content={<ChartTooltip />} />
              <Area type="monotone" dataKey="overall" name="Overall" stroke="#ff771c" fill="url(#grad)" strokeWidth={2} />
              <Area type="monotone" dataKey="technical" name="Technical" stroke="#546877" fill="none" strokeWidth={1.5} strokeDasharray="4 4" />
            </AreaChart>
          </ResponsiveContainer>
        </motion.div>
      )}

      <div className="grid md:grid-cols-2 gap-4">
        {/* Radar Chart */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
          className="rounded-xl bg-surface-900/50 border border-surface-700/20 p-5">
          <h3 className="text-xs font-semibold text-surface-400 uppercase tracking-widest mb-4">Skills Radar</h3>
          <ResponsiveContainer width="100%" height={240}>
            <RadarChart data={radarData}>
              <PolarGrid stroke="#2e2a25" />
              <PolarAngleAxis dataKey="category" tick={{ fill: '#8a7e6f', fontSize: 10 }} />
              <PolarRadiusAxis domain={[0, 100]} tick={false} axisLine={false} />
              <Radar dataKey="value" stroke="#ff771c" fill="#ff771c" fillOpacity={0.15} strokeWidth={2} />
            </RadarChart>
          </ResponsiveContainer>
        </motion.div>

        {/* Distribution */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}
          className="rounded-xl bg-surface-900/50 border border-surface-700/20 p-5">
          <h3 className="text-xs font-semibold text-surface-400 uppercase tracking-widest mb-4">Practice Distribution</h3>
          {diffData.length > 0 ? (
            <div className="space-y-5">
              <div>
                <p className="text-[10px] text-surface-500 uppercase tracking-wider mb-2">By Difficulty</p>
                <ResponsiveContainer width="100%" height={80}>
                  <BarChart data={diffData} layout="vertical">
                    <XAxis type="number" hide />
                    <YAxis type="category" dataKey="name" tick={{ fill: '#8a7e6f', fontSize: 11 }} axisLine={false} tickLine={false} width={60} />
                    <Bar dataKey="value" fill="#ff771c" radius={[0, 4, 4, 0]} barSize={14} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
              {companyData.length > 0 && (
                <div>
                  <p className="text-[10px] text-surface-500 uppercase tracking-wider mb-2">By Company Type</p>
                  <ResponsiveContainer width="100%" height={100}>
                    <PieChart>
                      <Pie data={companyData} cx="50%" cy="50%" innerRadius={25} outerRadius={40} dataKey="value" label={({ name, value }) => `${name} (${value})`} labelLine={false}>
                        {companyData.map((_, i) => <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />)}
                      </Pie>
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              )}
            </div>
          ) : (
            <p className="text-sm text-surface-500 text-center py-10">No data yet</p>
          )}
        </motion.div>
      </div>

      {/* Category Breakdown */}
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
        className="rounded-xl bg-surface-900/50 border border-surface-700/20 p-5">
        <h3 className="text-xs font-semibold text-surface-400 uppercase tracking-widest mb-4">Category Averages</h3>
        <div className="space-y-3">
          {radarData.map(({ category, value }) => (
            <div key={category} className="flex items-center gap-3">
              <span className="text-xs text-surface-300 w-28 shrink-0">{category}</span>
              <div className="flex-1 bg-surface-800 rounded-full h-2">
                <motion.div initial={{ width: 0 }} animate={{ width: `${value}%` }} transition={{ duration: 1, delay: 0.3 }}
                  className={`h-2 rounded-full ${value >= 75 ? 'bg-success' : value >= 50 ? 'bg-warning' : 'bg-error'}`} />
              </div>
              <span className={`text-xs font-bold w-8 text-right ${value >= 75 ? 'text-success' : value >= 50 ? 'text-warning' : 'text-error'}`}>{value}</span>
            </div>
          ))}
        </div>
      </motion.div>
    </div>
  );
}

/* ── History Tab ── */
function HistoryTab({ sessions }) {
  const router = useRouter();
  const [filter, setFilter] = useState('all');

  const filtered = filter === 'all' ? sessions
    : filter === 'completed' ? sessions.filter(s => s.status === 'completed')
    : sessions.filter(s => s.status === 'in_progress');

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <Filter className="w-3.5 h-3.5 text-surface-400" />
        {['all', 'completed', 'in_progress'].map(f => (
          <button key={f} onClick={() => setFilter(f)}
            className={`px-3 py-1 rounded-md text-xs font-medium transition-all ${filter === f ? 'bg-primary-500/10 text-primary-400 border border-primary-500/20' : 'text-surface-400 hover:text-surface-300'}`}>
            {f === 'all' ? 'All' : f === 'completed' ? 'Completed' : 'In Progress'}
          </button>
        ))}
        <span className="text-[10px] text-surface-500 ml-auto">{filtered.length} sessions</span>
      </div>

      {filtered.length > 0 ? (
        <div className="space-y-2">
          {filtered.map((s, i) => (
            <motion.button key={s.id || i} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.03 }}
              onClick={() => router.push(`/report/${s.id}`)}
              className="w-full flex items-center justify-between p-4 rounded-xl bg-surface-900/40 border border-surface-700/15 hover:border-surface-600/30 transition-all group text-left">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-surface-800 flex items-center justify-center">
                  <Mic className="w-3.5 h-3.5 text-surface-400" />
                </div>
                <div>
                  <p className="text-sm font-medium text-surface-200">{s.role || 'Interview'}</p>
                  <p className="text-[11px] text-surface-500">{s.company_type} · {s.difficulty} · {new Date(s.created_at).toLocaleDateString()}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                {s.score != null && (
                  <span className={`text-sm font-bold ${s.score >= 75 ? 'text-success' : s.score >= 50 ? 'text-warning' : 'text-error'}`}>{s.score}</span>
                )}
                {s.grade && (
                  <span className={`text-xs font-semibold px-2 py-0.5 rounded ${s.score >= 75 ? 'bg-success/10 text-success' : s.score >= 50 ? 'bg-warning/10 text-warning' : 'bg-error/10 text-error'}`}>{s.grade}</span>
                )}
                {!s.hasReport && s.status === 'completed' && (
                  <span className="text-[10px] text-surface-500 bg-surface-800 px-2 py-0.5 rounded">No Report</span>
                )}
                <span className={`text-[10px] font-medium px-2 py-0.5 rounded ${s.status === 'completed' ? 'bg-success/8 text-success' : 'bg-warning/8 text-warning'}`}>
                  {s.status === 'completed' ? 'Done' : 'Active'}
                </span>
                <ChevronRight className="w-4 h-4 text-surface-500 group-hover:text-primary-500 transition-colors" />
              </div>
            </motion.button>
          ))}
        </div>
      ) : (
        <div className="text-center py-16 rounded-xl bg-surface-900/30 border border-surface-700/15">
          <Mic className="w-7 h-7 text-surface-600 mx-auto mb-2" />
          <p className="text-sm text-surface-400">No sessions found</p>
        </div>
      )}
    </div>
  );
}

/* ── Badges Tab ── */
function BadgesTab({ badges, stats }) {
  const unlocked = badges?.filter(b => b.unlocked).length || 0;
  const total = badges?.length || 0;

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-semibold text-surface-200">{unlocked}/{total} Unlocked</p>
          <div className="w-32 bg-surface-800 rounded-full h-1.5 mt-1.5">
            <div className="bg-primary-500 h-1.5 rounded-full" style={{ width: `${total > 0 ? (unlocked / total) * 100 : 0}%` }} />
          </div>
        </div>
        <div className="flex items-center gap-2 text-xs text-surface-400">
          <Flame className="w-3.5 h-3.5 text-primary-500" />
          {stats.streak || 0} day streak
        </div>
      </div>

      <div className="grid sm:grid-cols-2 gap-3">
        {badges?.map((badge, i) => {
          const Icon = BADGE_ICONS[badge.id] || Award;
          return (
            <motion.div key={badge.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
              className={`rounded-xl border p-4 flex items-start gap-3 transition-all ${badge.unlocked ? 'bg-surface-900/50 border-primary-500/15' : 'bg-surface-900/20 border-surface-700/15 opacity-50'}`}>
              <div className={`w-10 h-10 rounded-lg flex items-center justify-center shrink-0 ${badge.unlocked ? 'bg-primary-500/10' : 'bg-surface-800'}`}>
                <Icon className={`w-5 h-5 ${badge.unlocked ? 'text-primary-500' : 'text-surface-500'}`} />
              </div>
              <div>
                <p className={`text-sm font-semibold ${badge.unlocked ? 'text-surface-100' : 'text-surface-400'}`}>{badge.name}</p>
                <p className="text-xs text-surface-500 mt-0.5">{badge.description}</p>
                {badge.unlocked && <p className="text-[10px] text-primary-400 font-medium mt-1">Unlocked</p>}
              </div>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}

/* ── Leaderboard Tab ── */
function LeaderboardTab({ getToken, userCollege }) {
  const router = useRouter();
  const [scope, setScope] = useState('global');
  const [data, setData] = useState([]);
  const [myRank, setMyRank] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        setAuthTokenGetter(getToken);
        const params = scope === 'college' && userCollege ? { scope: 'college', college: userCollege } : {};
        const res = await dashboardAPI.getLeaderboard(params);
        if (res.data?.leaderboard) setData(res.data.leaderboard);
        if (res.data?.myRank) setMyRank(res.data.myRank);
      } catch {}
      finally { setLoading(false); }
    };
    load();
  }, [scope, getToken, userCollege]);

  const MEDALS = ['#fbbf24', '#c0c0c0', '#cd7f32']; // gold, silver, bronze

  return (
    <div className="space-y-4">
      {/* Toggle */}
      <div className="flex items-center gap-2">
        {['global', 'college'].map(s => (
          <button key={s} onClick={() => setScope(s)}
            className={`px-3 py-1.5 rounded-md text-xs font-medium transition-all ${scope === s ? 'bg-primary-500/10 text-primary-400 border border-primary-500/20' : 'text-surface-400 hover:text-surface-300'}`}>
            {s === 'global' ? 'All India' : 'My College'}
          </button>
        ))}
        <span className="text-[10px] text-surface-500 ml-auto">Resets every Monday</span>
      </div>

      {/* Own rank */}
      {myRank && (
        <div className="flex items-center gap-2 px-4 py-2.5 rounded-lg bg-primary-500/5 border border-primary-500/15">
          <Award className="w-4 h-4 text-primary-500" />
          <span className="text-xs font-semibold text-primary-400">
            You are #{myRank} {scope === 'college' && userCollege ? `at ${userCollege}` : 'overall'} this week
          </span>
        </div>
      )}

      {loading ? (
        <div className="flex justify-center py-12"><div className="w-6 h-6 rounded-full border-2 border-primary-500 border-t-transparent animate-spin" /></div>
      ) : data.length > 0 ? (
        <div className="space-y-2">
          {data.map((entry, i) => (
            <motion.div key={i} initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.04 }}
              className={`flex items-center gap-4 p-4 rounded-xl border transition-all ${
                entry.isCurrentUser ? 'bg-primary-500/5 border-primary-500/20' : 'bg-surface-900/40 border-surface-700/15'}`}>
              <span className={`w-7 h-7 rounded-lg flex items-center justify-center text-xs font-bold shrink-0`}
                style={{ backgroundColor: i < 3 ? `${MEDALS[i]}15` : '#1f1c18', color: i < 3 ? MEDALS[i] : '#8a7e6f' }}>
                {entry.rank}
              </span>
              <div className="flex-1">
                <span className="text-sm font-medium text-surface-200">{entry.name}</span>
                {entry.college && <span className="text-[10px] text-surface-500 ml-2">{entry.college}</span>}
              </div>
              <span className={`text-sm font-bold ${entry.score >= 75 ? 'text-success' : entry.score >= 50 ? 'text-warning' : 'text-error'}`}>{entry.score}</span>
              {entry.grade && <span className="text-xs text-surface-400 font-medium">{entry.grade}</span>}
            </motion.div>
          ))}
        </div>
      ) : (
        <div className="text-center py-16 rounded-xl bg-surface-900/30 border border-surface-700/15">
          <Users className="w-7 h-7 text-surface-600 mx-auto mb-2" />
          <p className="text-sm text-surface-400">No leaderboard data yet</p>
        </div>
      )}

      <Button size="sm" onClick={() => router.push('/setup')} icon={Mic} className="mx-auto">
        Beat your rank — start an interview
      </Button>
    </div>
  );
}

/* ── Main Dashboard ── */
export default function DashboardPage() {
  const { user } = useUser();
  const { getToken } = useClerkAuth();
  const { profile } = useAuth();
  const router = useRouter();
  const [tab, setTab] = useState('overview');
  const [stats, setStats] = useState({});
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        setAuthTokenGetter(getToken);
        const [statsRes, sessionsRes] = await Promise.all([
          dashboardAPI.getStats(),
          dashboardAPI.getSessions(),
        ]);
        if (statsRes.data?.stats) setStats(statsRes.data.stats);
        if (sessionsRes.data?.sessions) setSessions(sessionsRes.data.sessions);
      } catch (e) { /* silent */ }
      finally { setLoading(false); }
    };
    load();
  }, [getToken]);

  const greeting = () => {
    const h = new Date().getHours();
    return h < 12 ? 'Good morning' : h < 18 ? 'Good afternoon' : 'Good evening';
  };

  return (
    <div className="min-h-screen bg-surface-950">
      <Navbar />

      <div className="max-w-6xl mx-auto px-6 py-10">
        {/* Header */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="flex items-start justify-between mb-8">
          <div>
            <p className="text-sm text-surface-400 mb-1">{greeting()}</p>
            <h1 className="text-2xl font-bold text-surface-50 tracking-tight">{user?.firstName || 'Welcome'}</h1>
          </div>
          <Button size="sm" onClick={() => router.push('/setup')} icon={Mic}>
            New Interview
          </Button>
        </motion.div>

        {/* Stats Row */}
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-3 mb-8">
          <StatCard label="Interviews" value={stats.totalSessions || 0} icon={BarChart3} accent delay={0.05} />
          <StatCard label="Avg Score" value={stats.avgScore ? `${stats.avgScore}%` : '--'} icon={Target} delay={0.1} />
          <StatCard label="Best Score" value={stats.bestScore || '--'} icon={TrendingUp} delay={0.15} sub={stats.latestGrade || ''} />
          <StatCard label="Practice Time" value={stats.totalMinutes ? `${Math.round(stats.totalMinutes / 60)}h` : '0h'} icon={Clock} delay={0.2} />
          <StatCard label="Streak" value={`${stats.streak || 0}d`} icon={Flame} delay={0.25} />
        </div>

        {/* Gap Analysis */}
        <div className="mb-6">
          <GapAnalysis targetRole={profile?.targetRole || 'Full Stack Developer'} />
        </div>

        {/* Tabs */}
        <div className="flex items-center gap-1 mb-6 border-b border-surface-700/20 pb-px">
          {TABS.map(t => (
            <button key={t.id} onClick={() => setTab(t.id)}
              className={`relative px-4 py-2.5 text-sm font-medium transition-colors ${tab === t.id ? 'text-primary-500' : 'text-surface-400 hover:text-surface-300'}`}>
              {t.label}
              {tab === t.id && <motion.div layoutId="tab-underline" className="absolute bottom-0 left-2 right-2 h-0.5 bg-primary-500 rounded-full" />}
            </button>
          ))}
        </div>

        {/* Tab Content */}
        {loading ? (
          <div className="space-y-4">
            {[1, 2, 3].map(i => <div key={i} className="skeleton h-32 rounded-xl" />)}
          </div>
        ) : (
          <AnimatePresence mode="wait">
            {tab === 'overview' && <OverviewTab key="overview" stats={stats} />}
            {tab === 'history' && <HistoryTab key="history" sessions={sessions} />}
            {tab === 'badges' && <BadgesTab key="badges" badges={stats.badges} stats={stats} />}
            {tab === 'leaderboard' && <LeaderboardTab key="leaderboard" getToken={getToken} userCollege={profile?.college || ''} />}
          </AnimatePresence>
        )}
      </div>
    </div>
  );
}
