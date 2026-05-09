import supabase from '../db.js';
import { parseAndSaveResume } from '../services/resume.service.js';
import { fetchAndSummarize } from '../services/github.service.js';
import { validateProfileSetup } from '../utils/validators.js';

/**
 * POST /api/profile/setup
 * Save or update user profile in Supabase
 */
export const setupProfile = async (req, res) => {
  try {
    const { clerkId } = req.user;
    const { email, name, avatar_url, github_url, linkedin_url, target_role, college } = req.body;

    const validation = validateProfileSetup({ email, name, github_url, linkedin_url, target_role });
    if (!validation.isValid) {
      return res.status(400).json({ errors: validation.errors });
    }

    if (!supabase) {
      return res.status(503).json({ error: 'Database not configured' });
    }

    // Upsert user profile
    const { data: existingUser } = await supabase
      .from('users')
      .select('*')
      .eq('clerk_id', clerkId)
      .single();

    let user;
    if (existingUser) {
      const { data, error } = await supabase
        .from('users')
        .update({ email, name, avatar_url, github_url, linkedin_url, target_role, college })
        .eq('clerk_id', clerkId)
        .select()
        .single();

      if (error) throw new Error(`Failed to update profile: ${error.message}`);
      user = data;
    } else {
      const { data, error } = await supabase
        .from('users')
        .insert({ clerk_id: clerkId, email, name, avatar_url, github_url, linkedin_url, target_role, college })
        .select()
        .single();

      if (error) throw new Error(`Failed to create profile: ${error.message}`);
      user = data;
    }

    res.json({ success: true, user });
  } catch (error) {
    console.error('Profile setup error:', error);
    res.status(500).json({ error: error.message });
  }
};

/**
 * POST /api/profile/resume
 * Upload and parse resume PDF
 */
export const uploadResumeHandler = async (req, res) => {
  try {
    const { clerkId } = req.user;

    if (!req.file) {
      return res.status(400).json({ error: 'No PDF file uploaded' });
    }

    if (!supabase) {
      return res.status(503).json({ error: 'Database not configured' });
    }

    // Get or create user in database
    let { data: user } = await supabase
      .from('users')
      .select('id')
      .eq('clerk_id', clerkId)
      .single();

    if (!user) {
      // Auto-create user so resume can be saved during onboarding Step 1
      const { data: newUser, error: createError } = await supabase
        .from('users')
        .insert({ clerk_id: clerkId, email: 'pending@setup', name: 'Pending Setup' })
        .select('id')
        .single();

      if (createError) throw new Error(`Failed to create user: ${createError.message}`);
      user = newUser;
    }

    // Parse and save resume
    const result = await parseAndSaveResume(req.file.buffer, user.id);

    res.json({
      success: true,
      message: 'Resume parsed successfully',
      data: result,
    });
  } catch (error) {
    console.error('Resume upload error:', error);
    res.status(500).json({ error: error.message });
  }
};

/**
 * GET /api/profile/github?username=
 * Fetch GitHub repos and summarize
 */
export const fetchGitHub = async (req, res) => {
  try {
    const { clerkId } = req.user;
    const { username } = req.query;

    if (!username) {
      return res.status(400).json({ error: 'GitHub username is required' });
    }

    // Get user ID if available
    let userId = null;
    if (supabase) {
      const { data: user } = await supabase
        .from('users')
        .select('id')
        .eq('clerk_id', clerkId)
        .single();
      userId = user?.id;
    }

    const result = await fetchAndSummarize(username, userId);

    res.json({
      success: true,
      data: result,
    });
  } catch (error) {
    console.error('GitHub fetch error:', error);
    res.status(500).json({ error: error.message });
  }
};

/**
 * GET /api/profile/me
 * Get full user profile with resume and GitHub data
 */
export const getProfile = async (req, res) => {
  try {
    const { clerkId } = req.user;

    if (!supabase) {
      return res.status(503).json({ error: 'Database not configured' });
    }

    // Get user profile
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('*')
      .eq('clerk_id', clerkId)
      .single();

    if (userError || !user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Get resume data
    const { data: resume } = await supabase
      .from('resumes')
      .select('*')
      .eq('user_id', user.id)
      .single();

    res.json({
      success: true,
      user: {
        ...user,
        resume: resume
          ? {
              structuredData: resume.structured_data,
              githubSummary: resume.github_summary,
              hasResume: !!resume.parsed_text,
            }
          : null,
      },
    });
  } catch (error) {
    console.error('Get profile error:', error);
    res.status(500).json({ error: error.message });
  }
};
