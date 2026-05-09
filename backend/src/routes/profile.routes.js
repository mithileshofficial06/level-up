import { Router } from 'express';
import { requireAuth } from '../middleware/auth.middleware.js';
import { uploadResume, handleUploadError } from '../middleware/upload.middleware.js';
import {
  setupProfile,
  uploadResumeHandler,
  fetchGitHub,
  getProfile,
} from '../controllers/profile.controller.js';
import { analyseJobDescription, generateGapAnalysis } from '../services/claude.service.js';
import supabase from '../db.js';

const router = Router();

// All profile routes require authentication
router.use(requireAuth);

// POST /api/profile/setup — save/update user profile
router.post('/setup', setupProfile);

// POST /api/profile/resume — upload and parse resume PDF
router.post('/resume', uploadResume, handleUploadError, uploadResumeHandler);

// GET /api/profile/github?username= — fetch GitHub data
router.get('/github', fetchGitHub);

// GET /api/profile/me — get full user profile
router.get('/me', getProfile);

// POST /api/profile/analyse-jd — parse job description
router.post('/analyse-jd', async (req, res) => {
  try {
    const { jd_text, jd_url } = req.body;
    let text = jd_text || '';

    if (jd_url && !text) {
      try {
        const response = await fetch(jd_url, { headers: { 'User-Agent': 'Mozilla/5.0' } });
        text = await response.text();
        text = text.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').substring(0, 5000);
      } catch {
        return res.status(400).json({ error: 'Could not fetch URL' });
      }
    }

    if (!text || text.length < 20) return res.status(400).json({ error: 'Job description text is required' });

    const result = await analyseJobDescription(text);

    // Save to user record
    const { clerkId } = req.user;
    if (supabase) {
      const { data: user } = await supabase.from('users').select('id').eq('clerk_id', clerkId).single();
      if (user) {
        await supabase.from('users').update({ jd_skills: result.required_skills, jd_text: text.substring(0, 5000) }).eq('id', user.id);
      }
    }

    res.json({ success: true, data: result });
  } catch (error) {
    console.error('JD analysis error:', error);
    res.status(500).json({ error: error.message });
  }
});

// POST /api/profile/gap-analysis — resume gap analysis
router.post('/gap-analysis', async (req, res) => {
  try {
    const { clerkId } = req.user;
    if (!supabase) return res.status(503).json({ error: 'Database not configured' });

    const { data: user } = await supabase.from('users').select('id, target_role, jd_skills').eq('clerk_id', clerkId).single();
    if (!user) return res.status(404).json({ error: 'User not found' });

    const { data: resume } = await supabase.from('resumes').select('structured_data').eq('user_id', user.id).single();
    const resumeSkills = resume?.structured_data?.skills || [];
    const targetRole = req.body.target_role || user.target_role || 'Full Stack Developer';
    const jdSkills = user.jd_skills || [];

    const result = await generateGapAnalysis(resumeSkills, targetRole, jdSkills);

    // Cache result
    await supabase.from('users').update({ gap_analysis: result }).eq('id', user.id);

    res.json({ success: true, data: result });
  } catch (error) {
    console.error('Gap analysis error:', error);
    res.status(500).json({ error: error.message });
  }
});

export default router;
