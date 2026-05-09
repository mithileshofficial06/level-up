-- ============================================
-- LevelUp AI — Phase 3 Migration
-- Run this in Supabase SQL Editor if you already 
-- created the tables from supabase-schema.sql
-- ============================================

-- Add new columns to reports table
ALTER TABLE reports ADD COLUMN IF NOT EXISTS problem_solving_score INTEGER;
ALTER TABLE reports ADD COLUMN IF NOT EXISTS grade TEXT;
ALTER TABLE reports ADD COLUMN IF NOT EXISTS summary TEXT;
