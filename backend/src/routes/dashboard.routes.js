import { Router } from 'express';
import { requireAuth } from '../middleware/auth.middleware.js';
import { getStats, getSessions, getLeaderboard } from '../controllers/dashboard.controller.js';
import supabase from '../db.js';

const router = Router();

router.use(requireAuth);

// GET /api/dashboard/stats — aggregate stats + badges + trends
router.get('/stats', getStats);

// GET /api/dashboard/sessions — all past sessions
router.get('/sessions', getSessions);

// GET /api/dashboard/leaderboard — top scores (supports ?scope=college&college=X)
router.get('/leaderboard', getLeaderboard);

export default router;
