-- ============================================
-- LevelUp AI — Supabase Schema
-- Run this in your Supabase SQL Editor
-- ============================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================
-- Users table
-- ============================================
CREATE TABLE IF NOT EXISTS users (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  clerk_id TEXT UNIQUE NOT NULL,
  email TEXT NOT NULL,
  name TEXT NOT NULL,
  avatar_url TEXT,
  github_url TEXT,
  linkedin_url TEXT,
  target_role TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- Resumes table
-- ============================================
CREATE TABLE IF NOT EXISTS resumes (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  file_url TEXT,
  parsed_text TEXT,
  structured_data JSONB,
  github_summary JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- Sessions table
-- ============================================
CREATE TABLE IF NOT EXISTS sessions (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  company_type TEXT NOT NULL,
  difficulty TEXT NOT NULL,
  role TEXT NOT NULL,
  status TEXT DEFAULT 'in_progress',
  questions JSONB,
  answers JSONB DEFAULT '[]'::jsonb,
  current_question_index INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  completed_at TIMESTAMPTZ
);

-- ============================================
-- Reports table
-- ============================================
CREATE TABLE IF NOT EXISTS reports (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  session_id UUID REFERENCES sessions(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  body_language_score INTEGER,
  communication_score INTEGER,
  technical_score INTEGER,
  project_knowledge_score INTEGER,
  problem_solving_score INTEGER,
  overall_score INTEGER,
  grade TEXT,
  summary TEXT,
  transcript JSONB,
  body_language_data JSONB,
  speech_data JSONB,
  detailed_scores JSONB,
  tips JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- Indexes
-- ============================================
CREATE INDEX IF NOT EXISTS idx_users_clerk_id ON users(clerk_id);
CREATE INDEX IF NOT EXISTS idx_resumes_user_id ON resumes(user_id);
CREATE INDEX IF NOT EXISTS idx_sessions_user_id ON sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_sessions_status ON sessions(status);
CREATE INDEX IF NOT EXISTS idx_reports_session_id ON reports(session_id);
CREATE INDEX IF NOT EXISTS idx_reports_user_id ON reports(user_id);

-- ============================================
-- Row Level Security
-- ============================================
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE resumes ENABLE ROW LEVEL SECURITY;
ALTER TABLE sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE reports ENABLE ROW LEVEL SECURITY;

-- Since we use the service key on the backend, these policies
-- allow the backend to access all rows. For direct client access,
-- you'd add more restrictive policies.

-- Users: service role has full access
CREATE POLICY "Service role full access on users"
  ON users FOR ALL
  USING (true)
  WITH CHECK (true);

-- Resumes: service role has full access
CREATE POLICY "Service role full access on resumes"
  ON resumes FOR ALL
  USING (true)
  WITH CHECK (true);

-- Sessions: service role has full access
CREATE POLICY "Service role full access on sessions"
  ON sessions FOR ALL
  USING (true)
  WITH CHECK (true);

-- Reports: service role has full access
CREATE POLICY "Service role full access on reports"
  ON reports FOR ALL
  USING (true)
  WITH CHECK (true);
