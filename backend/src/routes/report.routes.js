import { Router } from 'express';
import { requireAuth } from '../middleware/auth.middleware.js';
import {
  generateReport,
  getReport,
} from '../controllers/report.controller.js';

const router = Router();

router.use(requireAuth);

// POST /api/report/generate — generate full report
router.post('/generate', generateReport);

// GET /api/report/:sessionId — get saved report
router.get('/:sessionId', getReport);

export default router;
