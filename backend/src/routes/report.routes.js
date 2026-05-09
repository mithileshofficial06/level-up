import { Router } from 'express';
import { requireAuth } from '../middleware/auth.middleware.js';
import {
  generateReport,
  getReport,
} from '../controllers/report.controller.js';
import supabase from '../db.js';

const router = Router();

// POST /api/report/generate — generate full report (requires auth)
router.post('/generate', requireAuth, generateReport);

// GET /api/report/:sessionId — get saved report (requires auth)
router.get('/:sessionId', requireAuth, getReport);

// GET /api/certificate/:id — public certificate verification (no auth)
router.get('/certificate/:certId', async (req, res) => {
  try {
    const { certId } = req.params;
    if (!supabase) return res.status(503).json({ error: 'Database not configured' });

    const { data: report } = await supabase
      .from('reports')
      .select('certificate_id, overall_score, grade, created_at, user_id')
      .eq('certificate_id', certId)
      .single();

    if (!report) return res.status(404).json({ error: 'Certificate not found', valid: false });

    // Get user name
    const { data: user } = await supabase
      .from('users')
      .select('name')
      .eq('id', report.user_id)
      .single();

    res.json({
      valid: true,
      name: user?.name || 'Unknown',
      score: report.overall_score,
      grade: report.grade,
      issued_at: report.created_at,
      certificate_id: report.certificate_id,
    });
  } catch (error) {
    res.status(500).json({ error: error.message, valid: false });
  }
});

export default router;
