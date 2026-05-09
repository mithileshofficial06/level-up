import { Router } from 'express';

const router = Router();

// Auth routes are handled client-side by Clerk
// This file is reserved for webhook endpoints if needed

router.get('/status', (req, res) => {
  res.json({ status: 'Auth handled by Clerk client-side' });
});

export default router;
