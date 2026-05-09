import { Router } from 'express';
import { requireAuth } from '../middleware/auth.middleware.js';
import {
  startInterview,
  nextQuestion,
  endInterview,
} from '../controllers/interview.controller.js';

const router = Router();

router.use(requireAuth);

// POST /api/interview/start — create session, return first question
router.post('/start', startInterview);

// POST /api/interview/next — process answer, return next question
router.post('/next', nextQuestion);

// POST /api/interview/end — mark session complete
router.post('/end', endInterview);

export default router;
