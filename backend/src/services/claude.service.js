import { GoogleGenerativeAI } from '@google/generative-ai';

const genAI = process.env.GEMINI_API_KEY
  ? new GoogleGenerativeAI(process.env.GEMINI_API_KEY)
  : null;

const MODEL = 'gemini-2.0-flash';
const MAX_RETRIES = 2;
const RETRY_DELAY_MS = 2000;

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

// Track if quota is exhausted to skip retries
let quotaExhausted = false;
let quotaResetTime = 0;

/**
 * Base Gemini API call with retry logic and quota tracking
 */
export const callGemini = async (systemPrompt, userMessage, maxTokens = 4096) => {
  if (!genAI) {
    throw new Error('GEMINI_UNAVAILABLE');
  }

  // Skip API call if quota known to be exhausted
  if (quotaExhausted && Date.now() < quotaResetTime) {
    throw new Error('GEMINI_QUOTA_EXCEEDED');
  }

  let lastError;

  for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
    try {
      const model = genAI.getGenerativeModel({
        model: MODEL,
        systemInstruction: systemPrompt,
        generationConfig: { maxOutputTokens: maxTokens },
      });

      const result = await model.generateContent(userMessage);
      quotaExhausted = false; // Reset on success
      return result.response.text();
    } catch (error) {
      lastError = error;
      console.error(`Gemini API attempt ${attempt}/${MAX_RETRIES} failed:`, error.message);

      // Detect quota exhaustion
      if (error.message?.includes('429') || error.message?.includes('quota')) {
        quotaExhausted = true;
        quotaResetTime = Date.now() + 60000; // Cooldown 1 min
        throw new Error('GEMINI_QUOTA_EXCEEDED');
      }

      if (attempt < MAX_RETRIES) {
        await sleep(RETRY_DELAY_MS * attempt);
      }
    }
  }

  throw new Error(`Gemini API failed after ${MAX_RETRIES} attempts: ${lastError.message}`);
};

/**
 * Parse JSON from Gemini's response (handles markdown code blocks)
 */
export const parseGeminiJSON = (text) => {
  try {
    return JSON.parse(text);
  } catch {
    const jsonMatch = text.match(/```(?:json)?\s*([\s\S]*?)```/);
    if (jsonMatch) return JSON.parse(jsonMatch[1].trim());
    const objectMatch = text.match(/(\{[\s\S]*\})/);
    const arrayMatch = text.match(/(\[[\s\S]*\])/);
    if (objectMatch) return JSON.parse(objectMatch[1]);
    if (arrayMatch) return JSON.parse(arrayMatch[1]);
    throw new Error('Could not parse JSON from Gemini response');
  }
};

/**
 * Generate interview questions based on profile
 */
export const generateQuestions = async (profile, role, companyType, difficulty) => {
  const systemPrompt = `You are a senior technical interviewer at a ${companyType} company. The candidate is applying for a ${role} position. Difficulty level: ${difficulty}.

Their resume summary: ${JSON.stringify(profile.resumeData || {})}
Their GitHub projects: ${JSON.stringify(profile.githubSummary || {})}

Generate exactly 10 interview questions in this JSON format:
[{ "type": "technical"|"project"|"behavioral"|"aptitude", "question": "string", "hint": "string" }]

Distribution: Technical (3), Project-based (3), HR/Behavioral (2), Aptitude (2).
Make project questions reference their ACTUAL projects by name. Be specific.
For ${difficulty} difficulty, adjust complexity accordingly.
Return ONLY valid JSON, no other text.`;

  const response = await callGemini(systemPrompt, 'Generate the interview questions now.');
  return parseGeminiJSON(response);
};

/**
 * Generate a follow-up question based on the candidate's answer
 */
export const generateFollowUp = async (question, answer, profile) => {
  const systemPrompt = `You are a senior interviewer conducting a follow-up. 
The candidate's background: ${JSON.stringify(profile.resumeData || {})}

Based on the candidate's answer, generate ONE smart follow-up question that digs deeper.
Return JSON: { "question": "string", "type": "follow-up", "hint": "string" }
Return ONLY valid JSON.`;

  const userMessage = `Original question: ${question}
Candidate's answer: ${answer}

Generate a follow-up question.`;

  const response = await callGemini(systemPrompt, userMessage, 1024);
  return parseGeminiJSON(response);
};

/**
 * Local fallback: extract basic resume data using regex
 */
const localExtractResume = (text) => {
  const emailMatch = text.match(/[\w.-]+@[\w.-]+\.\w+/);
  const phoneMatch = text.match(/[\+]?[\d\s\-\(\)]{10,}/);
  const lines = text.split('\n').map(l => l.trim()).filter(Boolean);
  const name = lines[0]?.substring(0, 60) || 'Unknown';

  // Common tech skills to detect
  const knownSkills = [
    'JavaScript','TypeScript','Python','Java','C++','C#','Go','Rust','Ruby','PHP','Swift','Kotlin',
    'React','Next.js','Vue','Angular','Node.js','Express','Django','Flask','Spring','FastAPI',
    'HTML','CSS','Tailwind','Bootstrap','SASS',
    'MongoDB','PostgreSQL','MySQL','Redis','Supabase','Firebase','DynamoDB',
    'AWS','Azure','GCP','Docker','Kubernetes','Linux','Git','CI/CD',
    'Machine Learning','Deep Learning','TensorFlow','PyTorch','NLP','OpenCV',
    'REST','GraphQL','WebSocket','Microservices',
  ];
  const foundSkills = knownSkills.filter(s => text.toLowerCase().includes(s.toLowerCase()));

  return {
    name: name,
    email: emailMatch?.[0] || '',
    phone: phoneMatch?.[0]?.trim() || '',
    skills: foundSkills.length > 0 ? foundSkills : ['Not detected'],
    experience: [],
    projects: [],
    education: [],
    summary: `Resume parsed locally (AI unavailable). Found ${foundSkills.length} skills.`,
  };
};

/**
 * Extract structured data from resume text (with fallback)
 */
export const extractResumeData = async (resumeText) => {
  try {
    const systemPrompt = `You are an expert resume parser. Extract structured information from the resume text.
Return JSON only in this format:
{
  "name": "string",
  "email": "string",
  "phone": "string",
  "skills": ["string"],
  "experience": [{ "company": "string", "role": "string", "duration": "string", "description": "string" }],
  "projects": [{ "name": "string", "description": "string", "techStack": ["string"] }],
  "education": [{ "institution": "string", "degree": "string", "year": "string" }],
  "summary": "A 2-3 sentence professional summary"
}
Return ONLY valid JSON, no other text.`;

    const response = await callGemini(systemPrompt, `Parse this resume:\n\n${resumeText}`);
    return parseGeminiJSON(response);
  } catch (error) {
    console.warn('⚠️ Gemini unavailable for resume parsing, using local fallback:', error.message);
    return localExtractResume(resumeText);
  }
};

/**
 * Summarize GitHub projects (with fallback)
 */
export const summarizeGitHubProjects = async (repos) => {
  const repoData = repos.map((r) => ({
    name: r.name,
    description: r.description,
    language: r.language,
    stars: r.stargazers_count,
    topics: r.topics,
    url: r.html_url,
  }));

  try {
    const systemPrompt = `You are a technical recruiter reviewing GitHub repositories.
Summarize the top 5 most impressive projects with their tech stacks.
Return JSON:
{
  "projects": [
    {
      "name": "string",
      "description": "string",
      "techStack": ["string"],
      "impressiveness": "string (1-2 sentences on why this project stands out)"
    }
  ],
  "overallAssessment": "string (2-3 sentences about the developer's strengths)"
}
Return ONLY valid JSON.`;

    const response = await callGemini(
      systemPrompt,
      `Analyze these GitHub repositories:\n${JSON.stringify(repoData, null, 2)}`
    );
    return parseGeminiJSON(response);
  } catch (error) {
    console.warn('⚠️ Gemini unavailable for GitHub summary, using local fallback:', error.message);
    return {
      projects: repoData.slice(0, 5).map(r => ({
        name: r.name,
        description: r.description || 'No description',
        techStack: [r.language || 'Unknown'].concat(r.topics || []),
        impressiveness: `${r.stars || 0} stars, built with ${r.language || 'unknown language'}`,
      })),
      overallAssessment: `Developer has ${repos.length} public repositories. Top languages: ${[...new Set(repos.map(r => r.language).filter(Boolean))].join(', ')}.`,
    };
  }
};

// Backward-compatible exports
export const callClaude = callGemini;
export const parseClaudeJSON = parseGeminiJSON;

/**
 * Generate a short interviewer reaction to the candidate's answer
 */
export const generateReaction = async (question, answer) => {
  const FALLBACK_REACTIONS = [
    'Interesting approach, let me note that.',
    'Good, let\'s continue.',
    'Okay, I see your reasoning.',
    'Thanks, let\'s move forward.',
    'Noted. Let\'s proceed.',
    'That\'s a fair point.',
    'Alright, let\'s try another one.',
    'I see where you\'re going with that.',
    'Hmm, interesting perspective.',
    'Good effort, let\'s keep going.',
  ];
  try {
    const prompt = `You are a professional interviewer. The candidate just answered: "${answer.substring(0, 300)}" to the question: "${question.substring(0, 200)}". Give ONE short natural reaction (max 8 words) like a real interviewer would say. Return just the reaction string, nothing else.`;
    const response = await callGemini(prompt, 'Give your reaction now.', 60);
    return response.replace(/["\n]/g, '').trim() || FALLBACK_REACTIONS[Math.floor(Math.random() * FALLBACK_REACTIONS.length)];
  } catch {
    return FALLBACK_REACTIONS[Math.floor(Math.random() * FALLBACK_REACTIONS.length)];
  }
};

/**
 * Generate a real-time coaching hint
 */
export const generateCoachHint = async (question, partialAnswer, questionType, fillerCount) => {
  try {
    const prompt = `You are a real-time interview coach. Given the question and partial answer so far, give ONE short coaching hint (max 10 words) to help the candidate improve their answer RIGHT NOW. Return JSON: { "hint": "string", "type": "tip"|"missing"|"good"|"filler" }. Be specific to the actual content, not generic.`;
    const msg = `Question [${questionType}]: ${question}\nPartial answer so far: ${partialAnswer}\nFiller words used: ${fillerCount}`;
    const response = await callGemini(prompt, msg, 100);
    return parseGeminiJSON(response);
  } catch {
    if (fillerCount > 3) return { hint: 'Slow down, reduce filler words', type: 'filler' };
    if (partialAnswer.split(/\s+/).length < 15) return { hint: 'Add a concrete example', type: 'missing' };
    return { hint: 'Good structure, keep going', type: 'good' };
  }
};

/**
 * Analyse a job description
 */
export const analyseJobDescription = async (jdText) => {
  try {
    const prompt = `Extract from this job description: required_skills (array of strings), experience_years (string like "2-3 years"), company_type ("FAANG"|"startup"|"service"|"government"|"unknown"), key_topics (array of technical topics to focus on). Return JSON only.`;
    const response = await callGemini(prompt, `Job Description:\n${jdText.substring(0, 3000)}`, 1000);
    return parseGeminiJSON(response);
  } catch {
    // Basic keyword extraction fallback
    const skills = ['JavaScript','Python','React','Node.js','AWS','Docker','SQL','Java','TypeScript','Go','Kubernetes','MongoDB']
      .filter(s => jdText.toLowerCase().includes(s.toLowerCase()));
    return { required_skills: skills.length ? skills : ['Could not parse'], experience_years: 'Unknown', company_type: 'unknown', key_topics: [] };
  }
};

/**
 * Generate resume gap analysis
 */
export const generateGapAnalysis = async (resumeSkills, targetRole, jdSkills = []) => {
  try {
    const prompt = `Compare this candidate's skills: ${JSON.stringify(resumeSkills)} against the requirements for a ${targetRole} position${jdSkills.length ? ` and this specific JD skills: ${JSON.stringify(jdSkills)}` : ''}. Return JSON: { "missing_skills": ["string"], "weak_areas": ["string"], "strong_areas": ["string"], "gap_score": 0-100, "learning_plan": [{ "skill": "string", "resources": ["string"], "days_to_learn": number }] }`;
    const response = await callGemini(prompt, 'Analyze the skill gap now.', 2000);
    return parseGeminiJSON(response);
  } catch {
    return {
      missing_skills: ['System Design', 'Data Structures'],
      weak_areas: ['DSA Practice', 'System Design Fundamentals'],
      strong_areas: resumeSkills.slice(0, 5),
      gap_score: 60,
      learning_plan: [
        { skill: 'System Design', resources: ['Grokking System Design'], days_to_learn: 30 },
        { skill: 'DSA', resources: ['LeetCode', 'NeetCode 150'], days_to_learn: 45 },
      ],
    };
  }
};

/**
 * Generate ideal answers for weak questions
 */
export const generateIdealAnswers = async (questions, answers) => {
  try {
    const qa = questions.map((q, i) => `Q${i}: ${q.question}\nA${i}: ${answers[i]?.answer || '(skipped)'}`).join('\n\n');
    const prompt = `For each question where the candidate's answer was weak, empty, or skipped, generate an ideal_answer (3-5 sentences showing what a great answer looks like). Return JSON: { "ideal_answers": { "0": "ideal answer text", "3": "ideal answer text" } } — only include indices where improvement is needed. Return ONLY valid JSON.`;
    const response = await callGemini(prompt, `Interview transcript:\n${qa}`, 3000);
    return parseGeminiJSON(response);
  } catch {
    return { ideal_answers: {} };
  }
};

export default {
  callGemini,
  parseGeminiJSON,
  generateQuestions,
  generateFollowUp,
  extractResumeData,
  summarizeGitHubProjects,
  generateReaction,
  generateCoachHint,
  analyseJobDescription,
  generateGapAnalysis,
  generateIdealAnswers,
};

