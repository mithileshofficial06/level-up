import supabase from '../db.js';
import { generateQuestions, generateFollowUp } from '../services/claude.service.js';
import { validateInterviewSetup } from '../utils/validators.js';

// ── Large fallback question bank when AI is unavailable ──
const QUESTION_BANK = {
  technical: {
    Easy: [
      { type: 'technical', question: 'What is the difference between let, const, and var in JavaScript?', hint: 'Think about scoping, hoisting, and mutability' },
      { type: 'technical', question: 'What is the DOM and how does the browser render a web page?', hint: 'Discuss parsing, render tree, layout, and paint' },
      { type: 'technical', question: 'Explain the difference between HTTP and HTTPS.', hint: 'Think about SSL/TLS, encryption, and certificates' },
      { type: 'technical', question: 'What are the main differences between arrays and linked lists?', hint: 'Consider memory allocation, access patterns, and insertion/deletion' },
      { type: 'technical', question: 'What is version control and why is Git important?', hint: 'Think about branching, collaboration, and history tracking' },
      { type: 'technical', question: 'Explain the box model in CSS and how margin, padding, and border work together.', hint: 'Consider content-box vs border-box sizing' },
    ],
    Medium: [
      { type: 'technical', question: 'Explain the event loop in JavaScript. How does asynchronous code execution work?', hint: 'Think about call stack, callback queue, and microtasks' },
      { type: 'technical', question: 'What is the difference between SQL and NoSQL databases? When would you choose one over the other?', hint: 'Think about data structure, scalability, and use cases' },
      { type: 'technical', question: 'How does indexing work in databases? What are the trade-offs?', hint: 'Consider B-trees, hash indexes, and write performance' },
      { type: 'technical', question: 'Explain how authentication works in a web application. What is JWT vs session-based auth?', hint: 'Think about stateless vs stateful, security considerations' },
      { type: 'technical', question: 'What is the difference between REST and GraphQL? What are the trade-offs?', hint: 'Consider over-fetching, under-fetching, and flexibility' },
      { type: 'technical', question: 'Explain the concept of closures in JavaScript with a practical example.', hint: 'Think about lexical scope and data privacy patterns' },
    ],
    Hard: [
      { type: 'technical', question: 'Explain database sharding strategies. When would you use horizontal vs vertical partitioning?', hint: 'Think about data distribution, query routing, and consistency' },
      { type: 'technical', question: 'How would you implement rate limiting for a high-traffic API?', hint: 'Consider token bucket, sliding window, and distributed rate limiting' },
      { type: 'technical', question: 'Explain the CAP theorem. How does it affect distributed system design?', hint: 'Think about consistency, availability, partition tolerance trade-offs' },
      { type: 'technical', question: 'How does garbage collection work in JavaScript? What are memory leaks and how do you detect them?', hint: 'Think about mark-and-sweep, reference counting, and heap snapshots' },
      { type: 'technical', question: 'Explain microservices architecture vs monolithic. What are the challenges of microservices?', hint: 'Consider service discovery, data consistency, and network latency' },
      { type: 'technical', question: 'How would you design a caching layer for a web application? When would you invalidate the cache?', hint: 'Think about Redis, cache-aside, write-through, and TTL strategies' },
    ],
  },
  behavioral: [
    { type: 'behavioral', question: 'Tell me about a time you disagreed with a teammate. How did you resolve it?', hint: 'Use the STAR method: Situation, Task, Action, Result' },
    { type: 'behavioral', question: 'Describe a situation where you had to learn a new technology quickly. How did you approach it?', hint: 'Focus on your learning strategy and outcome' },
    { type: 'behavioral', question: 'Tell me about your biggest failure in a project. What did you learn from it?', hint: 'Be honest and focus on the lesson, not the failure' },
    { type: 'behavioral', question: 'How do you prioritize tasks when you have multiple deadlines?', hint: 'Discuss your time management framework' },
    { type: 'behavioral', question: 'Describe a time when you went above and beyond for a project.', hint: 'Highlight initiative and impact' },
    { type: 'behavioral', question: 'How do you handle feedback on your code during code reviews?', hint: 'Show openness to learning and collaboration' },
  ],
  aptitude: [
    { type: 'aptitude', question: 'If you had to design a URL shortener like bit.ly, how would you approach it?', hint: 'Think about hashing, database design, and scaling' },
    { type: 'aptitude', question: 'How would you design a notification system that can handle millions of users?', hint: 'Consider message queues, push vs pull, and batching' },
    { type: 'aptitude', question: 'Design a file storage system like Google Drive. What are the key components?', hint: 'Think about chunking, metadata, sync, and access control' },
    { type: 'aptitude', question: 'How would you design a real-time chat application?', hint: 'Consider WebSockets, message ordering, and presence' },
    { type: 'aptitude', question: 'Design a search autocomplete system. How would you make it fast?', hint: 'Think about tries, caching, and ranking algorithms' },
    { type: 'aptitude', question: 'How would you design an elevator system for a 50-floor building?', hint: 'Consider scheduling algorithms and optimization' },
  ],
};

// Shuffle array in place
const shuffle = (arr) => {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
};

// Generate resume-aware project questions from actual resume data
const generateProjectQuestions = (resumeData, role) => {
  const projects = resumeData?.projects || [];
  const skills = resumeData?.skills || [];
  const name = resumeData?.name || 'the candidate';

  const projectQs = [];

  if (projects.length > 0) {
    // Ask about specific projects from their resume
    for (const proj of projects.slice(0, 3)) {
      const pName = typeof proj === 'string' ? proj : (proj.name || proj.title || proj);
      projectQs.push({
        type: 'project',
        question: `You listed "${pName}" on your resume. Walk me through the architecture, the tech stack you chose, and the hardest problem you solved.`,
        hint: 'Be specific about technical decisions and trade-offs',
      });
    }
  }

  if (projectQs.length < 3 && skills.length > 0) {
    const topSkills = skills.slice(0, 5).join(', ');
    projectQs.push({
      type: 'project',
      question: `Your resume mentions skills in ${topSkills}. Describe a project where you used these technologies together. What was the outcome?`,
      hint: 'Explain how the technologies complemented each other',
    });
  }

  // Fill remaining with generic project questions
  const genericProjectQs = [
    { type: 'project', question: `As a ${role} candidate, walk me through your most impressive project. What technologies did you use and why?`, hint: 'Focus on technical decisions and problem-solving' },
    { type: 'project', question: 'Tell me about a time you had to optimize the performance of an application. What metrics did you track?', hint: 'Think about load times, database queries, caching' },
    { type: 'project', question: 'How do you handle deployment and CI/CD in your projects?', hint: 'Discuss tools, pipelines, and best practices' },
    { type: 'project', question: 'Describe a project where you had to work with a team. What was your role and how did you collaborate?', hint: 'Highlight communication and git workflow' },
  ];

  while (projectQs.length < 3) {
    const q = genericProjectQs.shift();
    if (q) projectQs.push(q);
    else break;
  }

  return projectQs.slice(0, 3);
};

const getFallbackQuestions = (role, difficulty, resumeData = {}) => {
  const techPool = QUESTION_BANK.technical[difficulty] || QUESTION_BANK.technical.Medium;
  const behavPool = [...QUESTION_BANK.behavioral];
  const aptPool = [...QUESTION_BANK.aptitude];

  // Pick random subsets: 3 technical, 3 project, 2 behavioral, 2 aptitude
  const tech = shuffle([...techPool]).slice(0, 3);
  const project = generateProjectQuestions(resumeData, role);
  const behav = shuffle(behavPool).slice(0, 2);
  const apt = shuffle(aptPool).slice(0, 2);

  return shuffle([...tech, ...project, ...behav, ...apt]);
};

/**
 * POST /api/interview/start
 * Create a new interview session and return the first question
 */
export const startInterview = async (req, res) => {
  try {
    const { clerkId } = req.user;
    const { company_type, difficulty, role } = req.body;

    const validation = validateInterviewSetup({ company_type, difficulty, role });
    if (!validation.isValid) {
      return res.status(400).json({ errors: validation.errors });
    }

    if (!supabase) {
      return res.status(503).json({ error: 'Database not configured' });
    }

    // Get or create user
    let { data: user } = await supabase
      .from('users')
      .select('*')
      .eq('clerk_id', clerkId)
      .single();

    if (!user) {
      const { data: newUser, error: createError } = await supabase
        .from('users')
        .insert({ clerk_id: clerkId, email: 'pending@setup', name: 'Pending Setup' })
        .select('*')
        .single();
      if (createError) throw new Error(`Failed to create user: ${createError.message}`);
      user = newUser;
    }

    const { data: resume } = await supabase
      .from('resumes')
      .select('*')
      .eq('user_id', user.id)
      .single();

    // Generate questions using Gemini (with fallback)
    const profile = {
      resumeData: resume?.structured_data || {},
      githubSummary: resume?.github_summary || {},
    };

    let questions;
    try {
      questions = await generateQuestions(profile, role, company_type, difficulty);
    } catch (aiError) {
      console.warn('⚠️ AI question generation failed, using fallback questions:', aiError.message);
      questions = getFallbackQuestions(role, difficulty, resume?.structured_data || {});
    }

    // Create session in database
    const { data: session, error } = await supabase
      .from('sessions')
      .insert({
        user_id: user.id,
        company_type,
        difficulty,
        role,
        status: 'in_progress',
        questions,
        answers: [],
        current_question_index: 0,
      })
      .select()
      .single();

    if (error) throw new Error(`Failed to create session: ${error.message}`);

    res.json({
      success: true,
      session_id: session.id,
      total_questions: questions.length,
      current_question: questions[0],
      current_index: 0,
    });
  } catch (error) {
    console.error('Start interview error:', error);
    res.status(500).json({ error: error.message });
  }
};

/**
 * POST /api/interview/next
 * Process answer and return the next question or follow-up
 */
export const nextQuestion = async (req, res) => {
  try {
    const { session_id, answer, skip_followup } = req.body;

    if (!supabase) {
      return res.status(503).json({ error: 'Database not configured' });
    }

    const { data: session } = await supabase
      .from('sessions')
      .select('*')
      .eq('id', session_id)
      .single();

    if (!session) {
      return res.status(404).json({ error: 'Session not found' });
    }

    if (session.status === 'completed') {
      return res.status(400).json({ error: 'Session already completed' });
    }

    const currentIndex = session.current_question_index;
    const questions = session.questions;
    const answers = session.answers || [];

    // Save the answer
    answers.push({
      questionIndex: currentIndex,
      question: questions[currentIndex]?.question,
      answer: answer || '(skipped)',
      timestamp: new Date().toISOString(),
    });

    // Try follow-up question (only if answer is substantial and not already a follow-up)
    if (!skip_followup && answer && answer.trim().length > 20 && currentIndex < questions.length - 1) {
      try {
        const { data: resume } = await supabase
          .from('resumes')
          .select('structured_data')
          .eq('user_id', session.user_id)
          .single();

        const followUp = await generateFollowUp(
          questions[currentIndex].question,
          answer,
          { resumeData: resume?.structured_data || {} }
        );

        await supabase
          .from('sessions')
          .update({ answers })
          .eq('id', session_id);

        return res.json({
          success: true,
          is_followup: true,
          followup_question: followUp,
          current_index: currentIndex,
          total_questions: questions.length,
        });
      } catch (followUpError) {
        console.warn('Follow-up generation failed, moving to next question:', followUpError.message);
      }
    }

    // Move to next question
    const nextIndex = currentIndex + 1;

    if (nextIndex >= questions.length) {
      await supabase
        .from('sessions')
        .update({
          answers,
          current_question_index: nextIndex,
          status: 'completed',
          completed_at: new Date().toISOString(),
        })
        .eq('id', session_id);

      return res.json({
        success: true,
        is_complete: true,
        session_id,
        message: 'Interview complete! Generate your report.',
      });
    }

    await supabase
      .from('sessions')
      .update({
        answers,
        current_question_index: nextIndex,
      })
      .eq('id', session_id);

    res.json({
      success: true,
      is_followup: false,
      current_question: questions[nextIndex],
      current_index: nextIndex,
      total_questions: questions.length,
    });
  } catch (error) {
    console.error('Next question error:', error);
    res.status(500).json({ error: error.message });
  }
};

/**
 * POST /api/interview/end
 * Mark session as completed
 */
export const endInterview = async (req, res) => {
  try {
    const { session_id } = req.body;

    if (!supabase) {
      return res.status(503).json({ error: 'Database not configured' });
    }

    const { data, error } = await supabase
      .from('sessions')
      .update({
        status: 'completed',
        completed_at: new Date().toISOString(),
      })
      .eq('id', session_id)
      .select()
      .single();

    if (error) throw new Error(`Failed to end session: ${error.message}`);

    res.json({
      success: true,
      session_id: data.id,
      message: 'Interview ended. Ready for report generation.',
    });
  } catch (error) {
    console.error('End interview error:', error);
    res.status(500).json({ error: error.message });
  }
};
