import { Router } from 'express';
import { requireAuth } from '../middleware/auth.middleware.js';
import { uploadResume, handleUploadError } from '../middleware/upload.middleware.js';
import {
  setupProfile,
  uploadResumeHandler,
  fetchGitHub,
  getProfile,
} from '../controllers/profile.controller.js';

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

export default router;
