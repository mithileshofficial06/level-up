import supabase from '../db.js';
import { callGemini, parseGeminiJSON } from '../services/claude.service.js';
import { FILLER_WORDS } from '../utils/constants.js';

/**
 * Analyze communication from transcript answers
 */
function analyzeCommuncation(answers) {
  if (!answers || answers.length === 0) return { score: 50, fillerCount: 0, avgWordCount: 0, pace: 'N/A' };

  let totalWords = 0, totalFillers = 0;
  const validAnswers = answers.filter(a => a.answer && a.answer !== '(skipped)');

  for (const a of validAnswers) {
    const words = a.answer.toLowerCase().split(/\s+/).filter(Boolean);
    totalWords += words.length;
    for (const filler of FILLER_WORDS) {
      const regex = new RegExp(`\\b${filler}\\b`, 'gi');
      const matches = a.answer.match(regex);
      if (matches) totalFillers += matches.length;
    }
  }

  const avgWords = validAnswers.length > 0 ? Math.round(totalWords / validAnswers.length) : 0;
  const fillerRatio = totalWords > 0 ? totalFillers / totalWords : 0;

  // Score: penalize filler words and too-short answers
  let score = 75;
  if (fillerRatio > 0.05) score -= 20;
  else if (fillerRatio > 0.02) score -= 10;
  if (avgWords < 15) score -= 15;
  else if (avgWords > 30) score += 10;
  if (validAnswers.length < answers.length * 0.5) score -= 15; // too many skips

  return {
    score: Math.max(10, Math.min(100, score)),
    fillerCount: totalFillers,
    avgWordCount: avgWords,
    totalWords,
    skippedCount: answers.length - validAnswers.length,
    pace: avgWords > 50 ? 'detailed' : avgWords > 25 ? 'moderate' : 'brief',
  };
}

/**
 * Generate AI-powered detailed analysis using Gemini
 */
async function generateAIAnalysis(session, answers) {
  const systemPrompt = `You are an expert interview coach analyzing a mock interview session.
The candidate interviewed for: ${session.role} at a ${session.company_type} company (${session.difficulty} difficulty).

Analyze each answer and provide scoring. Return ONLY valid JSON in this exact format:
{
  "technical_score": <number 0-100>,
  "problem_solving_score": <number 0-100>,
  "project_knowledge_score": <number 0-100>,
  "body_language_score": <number 0-100>,
  "detailed_scores": {
    "technical": { "score": <number>, "strengths": ["string"], "weaknesses": ["string"] },
    "problem_solving": { "score": <number>, "strengths": ["string"], "weaknesses": ["string"] },
    "project_knowledge": { "score": <number>, "strengths": ["string"], "weaknesses": ["string"] },
    "communication": { "strengths": ["string"], "weaknesses": ["string"] }
  },
  "tips": {
    "body_language": ["string", "string"],
    "communication": ["string", "string"],
    "technical": ["string", "string"],
    "projects": ["string", "string"],
    "problem_solving": ["string", "string"],
    "overall": ["string", "string"]
  },
  "grade": "A+|A|B+|B|C+|C|D|F",
  "summary": "2-3 sentence overall assessment"
}

Score guidelines:
- 90-100: Exceptional, hire-ready
- 75-89: Good, minor improvements needed  
- 60-74: Average, needs practice
- 40-59: Below average, significant gaps
- 0-39: Poor, fundamental issues

Be realistic and constructive. Base body_language_score on answer confidence level since we can't see the camera.`;

  const transcript = answers.map((a, i) =>
    `Q${i + 1} [${a.question}]\nA: ${a.answer}`
  ).join('\n\n');

  const response = await callGemini(systemPrompt, `Interview transcript:\n\n${transcript}`, 4096);
  return parseGeminiJSON(response);
}

/**
 * Generate fallback analysis without AI
 */
function generateFallbackAnalysis(answers, commStats) {
  const validAnswers = answers.filter(a => a.answer && a.answer !== '(skipped)');
  const answerRatio = answers.length > 0 ? validAnswers.length / answers.length : 0;
  const avgLen = commStats.avgWordCount;

  const techScore = Math.round(40 + answerRatio * 35 + Math.min(avgLen / 3, 15));
  const projScore = Math.round(35 + answerRatio * 40 + Math.min(avgLen / 4, 15));
  const bodyScore = Math.round(50 + answerRatio * 20 + Math.min(avgLen / 5, 10));
  const problemScore = Math.round(40 + answerRatio * 30 + Math.min(avgLen / 3, 15));

  const grade = commStats.score >= 80 && techScore >= 75 ? 'A'
    : commStats.score >= 65 && techScore >= 60 ? 'B+'
    : commStats.score >= 50 && techScore >= 45 ? 'B'
    : commStats.score >= 35 ? 'C' : 'D';

  return {
    technical_score: Math.min(100, techScore),
    problem_solving_score: Math.min(100, problemScore),
    project_knowledge_score: Math.min(100, projScore),
    body_language_score: Math.min(100, bodyScore),
    detailed_scores: {
      technical: { score: techScore, strengths: ['Attempted technical questions'], weaknesses: avgLen < 20 ? ['Answers could be more detailed'] : [] },
      problem_solving: { score: problemScore, strengths: ['Showed logical approach'], weaknesses: [] },
      project_knowledge: { score: projScore, strengths: validAnswers.length > 3 ? ['Covered multiple projects'] : [], weaknesses: avgLen < 20 ? ['Provide more project details'] : [] },
      communication: { strengths: commStats.fillerCount < 5 ? ['Low filler word usage'] : [], weaknesses: commStats.fillerCount >= 5 ? ['Reduce filler words'] : [] },
    },
    tips: {
      body_language: ['Maintain eye contact with the camera', 'Sit upright and use hand gestures naturally'],
      communication: ['Practice speaking at a steady pace', commStats.fillerCount > 3 ? 'Work on reducing filler words like "um" and "like"' : 'Good control of filler words'],
      technical: ['Study data structures and system design', 'Practice explaining technical concepts clearly'],
      projects: ['Prepare 2-3 project deep-dives with architecture details', 'Know the trade-offs of your technology choices'],
      problem_solving: ['Think out loud to show your reasoning process', 'Break complex problems into smaller steps'],
      overall: ['Practice mock interviews regularly', 'Record yourself and review for improvement'],
    },
    grade,
    summary: `Completed ${validAnswers.length} of ${answers.length} questions with an average response of ${avgLen} words. ${commStats.fillerCount > 5 ? 'Work on reducing filler words.' : 'Communication style was clear.'} Overall grade: ${grade}.`,
  };
}

/**
 * POST /api/report/generate
 */
export const generateReport = async (req, res) => {
  try {
    const { clerkId } = req.user;
    const { session_id } = req.body;

    if (!supabase) return res.status(503).json({ error: 'Database not configured' });
    if (!session_id) return res.status(400).json({ error: 'session_id is required' });

    // Get session
    const { data: session } = await supabase
      .from('sessions')
      .select('*')
      .eq('id', session_id)
      .single();

    if (!session) return res.status(404).json({ error: 'Session not found' });

    // Check if report already exists
    const { data: existing } = await supabase
      .from('reports')
      .select('*')
      .eq('session_id', session_id)
      .single();

    if (existing) {
      return res.json({ success: true, report: existing });
    }

    const answers = session.answers || [];

    // Analyze communication locally
    const commStats = analyzeCommuncation(answers);

    // Get AI analysis (with fallback)
    let aiAnalysis;
    try {
      aiAnalysis = await generateAIAnalysis(session, answers);
    } catch (err) {
      console.warn('⚠️ AI report analysis failed, using local fallback:', err.message);
      aiAnalysis = generateFallbackAnalysis(answers, commStats);
    }

    // Compute overall score
    const overall = Math.round(
      (commStats.score * 0.2) +
      ((aiAnalysis.technical_score || 50) * 0.25) +
      ((aiAnalysis.problem_solving_score || 50) * 0.2) +
      ((aiAnalysis.project_knowledge_score || 50) * 0.2) +
      ((aiAnalysis.body_language_score || 50) * 0.15)
    );

    // Build report
    const report = {
      session_id,
      user_id: session.user_id,
      body_language_score: aiAnalysis.body_language_score || 50,
      communication_score: commStats.score,
      technical_score: aiAnalysis.technical_score || 50,
      project_knowledge_score: aiAnalysis.project_knowledge_score || 50,
      overall_score: Math.min(100, overall),
      transcript: answers,
      speech_data: {
        fillerCount: commStats.fillerCount,
        avgWordCount: commStats.avgWordCount,
        totalWords: commStats.totalWords,
        pace: commStats.pace,
        skippedCount: commStats.skippedCount,
      },
      detailed_scores: aiAnalysis.detailed_scores || {},
      tips: aiAnalysis.tips || {},
      body_language_data: { confidence: aiAnalysis.body_language_score || 50 },
    };

    // Add extra fields for frontend
    report.grade = aiAnalysis.grade || 'B';
    report.summary = aiAnalysis.summary || '';
    report.problem_solving_score = aiAnalysis.problem_solving_score || 50;

    // Save to database
    const { data: saved, error: saveError } = await supabase
      .from('reports')
      .insert(report)
      .select()
      .single();

    if (saveError) throw new Error(`Failed to save report: ${saveError.message}`);

    res.json({ success: true, report: saved });
  } catch (error) {
    console.error('Generate report error:', error);
    res.status(500).json({ error: error.message });
  }
};

/**
 * GET /api/report/:sessionId
 */
export const getReport = async (req, res) => {
  try {
    const { sessionId } = req.params;

    if (!supabase) return res.status(503).json({ error: 'Database not configured' });

    const { data: report } = await supabase
      .from('reports')
      .select('*')
      .eq('session_id', sessionId)
      .single();

    if (!report) {
      return res.json({ success: true, report: null });
    }

    res.json({ success: true, report });
  } catch (error) {
    console.error('Get report error:', error);
    res.status(500).json({ error: error.message });
  }
};
