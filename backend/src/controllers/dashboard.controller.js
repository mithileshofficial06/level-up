import supabase from '../db.js';

/**
 * GET /api/dashboard/stats
 * Aggregate stats for the authenticated user
 */
export const getStats = async (req, res) => {
  try {
    const { clerkId } = req.user;

    const { data: user } = await supabase
      .from('users')
      .select('id')
      .eq('clerk_id', clerkId)
      .single();

    if (!user) return res.json({ success: true, stats: {} });

    // Fetch all completed sessions
    const { data: sessions } = await supabase
      .from('sessions')
      .select('id, created_at, completed_at, status, difficulty, company_type, role')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    // Fetch all reports
    const { data: reports } = await supabase
      .from('reports')
      .select('session_id, overall_score, technical_score, communication_score, body_language_score, problem_solving_score, project_knowledge_score, grade, created_at')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    const completed = sessions?.filter(s => s.status === 'completed') || [];
    const totalSessions = sessions?.length || 0;
    const completedSessions = completed.length;

    // Calculate average scores
    const scores = reports?.filter(r => r.overall_score != null) || [];
    const avgScore = scores.length > 0
      ? Math.round(scores.reduce((sum, r) => sum + r.overall_score, 0) / scores.length)
      : 0;

    const bestScore = scores.length > 0
      ? Math.max(...scores.map(r => r.overall_score))
      : 0;

    // Calculate total practice time (rough estimate: 3 min per question)
    const totalMinutes = completedSessions * 30; // ~30 min per interview

    // Category averages
    const catAvg = (key) => {
      const vals = reports?.filter(r => r[key] != null).map(r => r[key]) || [];
      return vals.length > 0 ? Math.round(vals.reduce((a, b) => a + b, 0) / vals.length) : 0;
    };

    // Streak calculation (consecutive days with completed sessions)
    const streak = calculateStreak(completed);

    // Score trend (last 10 reports)
    const scoreTrend = scores.slice(0, 10).reverse().map((r, i) => ({
      index: i + 1,
      overall: r.overall_score || 0,
      technical: r.technical_score || 0,
      communication: r.communication_score || 0,
      bodyLanguage: r.body_language_score || 0,
      problemSolving: r.problem_solving_score || 0,
      projects: r.project_knowledge_score || 0,
      date: r.created_at,
    }));

    // Difficulty distribution
    const difficultyDist = { Easy: 0, Medium: 0, Hard: 0 };
    sessions?.forEach(s => { if (difficultyDist[s.difficulty] !== undefined) difficultyDist[s.difficulty]++; });

    // Company type distribution
    const companyDist = {};
    sessions?.forEach(s => { companyDist[s.company_type] = (companyDist[s.company_type] || 0) + 1; });

    // Badges
    const badges = calculateBadges({
      totalSessions,
      completedSessions,
      avgScore,
      bestScore,
      streak,
      categoryAverages: {
        technical: catAvg('technical_score'),
        communication: catAvg('communication_score'),
        bodyLanguage: catAvg('body_language_score'),
        problemSolving: catAvg('problem_solving_score'),
        projects: catAvg('project_knowledge_score'),
      },
    });

    res.json({
      success: true,
      stats: {
        totalSessions,
        completedSessions,
        avgScore,
        bestScore,
        totalMinutes,
        streak,
        scoreTrend,
        difficultyDist,
        companyDist,
        categoryAverages: {
          technical: catAvg('technical_score'),
          communication: catAvg('communication_score'),
          bodyLanguage: catAvg('body_language_score'),
          problemSolving: catAvg('problem_solving_score'),
          projects: catAvg('project_knowledge_score'),
        },
        badges,
        latestGrade: scores[0]?.grade || null,
      },
    });
  } catch (error) {
    console.error('Dashboard stats error:', error);
    res.status(500).json({ error: error.message });
  }
};

/**
 * GET /api/dashboard/sessions
 * All past sessions for the user
 */
export const getSessions = async (req, res) => {
  try {
    const { clerkId } = req.user;

    const { data: user } = await supabase
      .from('users')
      .select('id')
      .eq('clerk_id', clerkId)
      .single();

    if (!user) return res.json({ success: true, sessions: [] });

    const { data: sessions } = await supabase
      .from('sessions')
      .select('id, company_type, difficulty, role, status, current_question_index, created_at, completed_at')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(50);

    // Get reports for these sessions
    const sessionIds = sessions?.map(s => s.id) || [];
    let reportMap = {};
    if (sessionIds.length > 0) {
      const { data: reports } = await supabase
        .from('reports')
        .select('session_id, overall_score, grade')
        .in('session_id', sessionIds);
      reports?.forEach(r => { reportMap[r.session_id] = r; });
    }

    const enriched = sessions?.map(s => ({
      ...s,
      score: reportMap[s.session_id]?.overall_score || reportMap[s.id]?.overall_score || null,
      grade: reportMap[s.session_id]?.grade || reportMap[s.id]?.grade || null,
      hasReport: !!reportMap[s.id],
    })) || [];

    res.json({ success: true, sessions: enriched });
  } catch (error) {
    console.error('Dashboard sessions error:', error);
    res.status(500).json({ error: error.message });
  }
};

/**
 * GET /api/dashboard/leaderboard
 * Anonymous leaderboard of top scores
 */
export const getLeaderboard = async (req, res) => {
  try {
    const { scope, college } = req.query;
    const { clerkId } = req.user;

    const { data: reports } = await supabase
      .from('reports')
      .select('user_id, overall_score, grade, created_at')
      .not('overall_score', 'is', null)
      .order('overall_score', { ascending: false })
      .limit(100);

    // Get usernames + colleges
    const userIds = [...new Set(reports?.map(r => r.user_id) || [])];
    let userMap = {};
    if (userIds.length > 0) {
      const { data: users } = await supabase
        .from('users')
        .select('id, name, college, clerk_id')
        .in('id', userIds);
      users?.forEach(u => { userMap[u.id] = { name: u.name?.split(' ')[0] || 'Anonymous', college: u.college || '', clerkId: u.clerk_id }; });
    }

    // Best score per user
    const bestByUser = {};
    reports?.forEach(r => {
      if (!bestByUser[r.user_id] || r.overall_score > bestByUser[r.user_id].overall_score) {
        bestByUser[r.user_id] = r;
      }
    });

    let leaderboard = Object.entries(bestByUser)
      .map(([userId, r]) => ({
        name: userMap[userId]?.name || 'Anonymous',
        college: userMap[userId]?.college || '',
        score: r.overall_score,
        grade: r.grade,
        isCurrentUser: userMap[userId]?.clerkId === clerkId,
      }))
      .sort((a, b) => b.score - a.score);

    // Filter by college if scope=college
    if (scope === 'college' && college) {
      leaderboard = leaderboard.filter(e => e.college.toLowerCase() === college.toLowerCase());
    }

    // Add rank
    leaderboard = leaderboard.slice(0, 20).map((e, i) => ({ ...e, rank: i + 1 }));

    // Find current user's rank
    const myRank = leaderboard.find(e => e.isCurrentUser)?.rank || null;

    res.json({ success: true, leaderboard, myRank });
  } catch (error) {
    console.error('Leaderboard error:', error);
    res.status(500).json({ error: error.message });
  }
};

// ── Helpers ──

function calculateStreak(completedSessions) {
  if (!completedSessions.length) return 0;
  const days = [...new Set(completedSessions.map(s =>
    new Date(s.created_at).toISOString().split('T')[0]
  ))].sort().reverse();

  let streak = 0;
  const today = new Date().toISOString().split('T')[0];
  const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];

  if (days[0] !== today && days[0] !== yesterday) return 0;

  for (let i = 0; i < days.length; i++) {
    const expected = new Date(Date.now() - i * 86400000).toISOString().split('T')[0];
    if (days[i] === expected) streak++;
    else break;
  }
  return streak;
}

function calculateBadges(stats) {
  const badges = [
    { id: 'first_interview', name: 'First Steps', description: 'Complete your first interview', unlocked: stats.completedSessions >= 1 },
    { id: 'five_sessions', name: 'Getting Serious', description: 'Complete 5 interviews', unlocked: stats.completedSessions >= 5 },
    { id: 'ten_sessions', name: 'Dedicated', description: 'Complete 10 interviews', unlocked: stats.completedSessions >= 10 },
    { id: 'high_scorer', name: 'Top Performer', description: 'Score 90+ overall', unlocked: stats.bestScore >= 90 },
    { id: 'consistent', name: 'Consistent', description: 'Average score above 75', unlocked: stats.avgScore >= 75 },
    { id: 'streak_3', name: 'On Fire', description: '3-day practice streak', unlocked: stats.streak >= 3 },
    { id: 'streak_7', name: 'Unstoppable', description: '7-day practice streak', unlocked: stats.streak >= 7 },
    { id: 'tech_master', name: 'Tech Master', description: 'Average 85+ in technical', unlocked: stats.categoryAverages.technical >= 85 },
    { id: 'communicator', name: 'Great Communicator', description: 'Average 85+ in communication', unlocked: stats.categoryAverages.communication >= 85 },
    { id: 'all_rounder', name: 'All-Rounder', description: 'All categories above 70', unlocked: Object.values(stats.categoryAverages).every(v => v >= 70) && stats.completedSessions > 0 },
  ];
  return badges;
}
