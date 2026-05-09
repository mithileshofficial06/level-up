import { Router } from 'express';
import { requireAuth } from '../middleware/auth.middleware.js';
import {
  startInterview,
  nextQuestion,
  endInterview,
} from '../controllers/interview.controller.js';
import { generateReaction, generateCoachHint } from '../services/claude.service.js';

const router = Router();

router.use(requireAuth);

// POST /api/interview/start — create session, return first question
router.post('/start', startInterview);

// POST /api/interview/next — process answer, return next question
router.post('/next', nextQuestion);

// POST /api/interview/end — mark session complete
router.post('/end', endInterview);

// POST /api/interview/react — AI reaction to answer
router.post('/react', async (req, res) => {
  try {
    const { question, answer } = req.body;
    if (!question || !answer) return res.status(400).json({ error: 'question and answer required' });
    const reaction = await generateReaction(question, answer);
    res.json({ success: true, reaction });
  } catch (error) {
    res.json({ success: true, reaction: 'Good, let\'s continue.' });
  }
});

// POST /api/interview/coach — real-time coaching hint
router.post('/coach', async (req, res) => {
  try {
    const { question, partialAnswer, questionType, fillerCount } = req.body;
    if (!question || !partialAnswer) return res.status(400).json({ error: 'question and partialAnswer required' });
    const hint = await generateCoachHint(question, partialAnswer, questionType || 'technical', fillerCount || 0);
    res.json({ success: true, ...hint });
  } catch (error) {
    res.json({ success: true, hint: 'Keep going, you\'re doing well', type: 'good' });
  }
});

export default router;
