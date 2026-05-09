// ============================================
// LevelUp AI — Constants
// ============================================

export const ROLES = [
  { value: 'Full Stack', label: 'Full Stack Developer' },
  { value: 'Frontend', label: 'Frontend Developer' },
  { value: 'Backend', label: 'Backend Developer' },
  { value: 'Data Science', label: 'Data Scientist' },
  { value: 'ML Engineer', label: 'ML Engineer' },
  { value: 'DevOps', label: 'DevOps Engineer' },
];

export const COMPANY_TYPES = [
  { value: 'FAANG', label: 'FAANG / Big Tech', description: 'Google, Meta, Amazon, Apple, Netflix' },
  { value: 'Product Startup', label: 'Product Startup', description: 'Fast-paced product companies & unicorns' },
  { value: 'Service Company', label: 'Service / IT', description: 'TCS, Infosys, Wipro, Accenture' },
  { value: 'Government', label: 'Government / PSU', description: 'ISRO, DRDO, BHEL, public sector' },
];

export const DIFFICULTIES = [
  { value: 'Easy', label: 'Easy', description: 'Fundamentals & warm-up' },
  { value: 'Medium', label: 'Medium', description: 'Applied concepts & trade-offs' },
  { value: 'Hard', label: 'Hard', description: 'System design & deep-dives' },
];

export const QUESTION_TYPES = {
  technical: { label: 'Technical', color: 'bg-steel-500/15 text-steel-300 border-steel-500/25' },
  project: { label: 'Project', color: 'bg-primary-500/12 text-primary-300 border-primary-500/25' },
  behavioral: { label: 'Behavioral', color: 'bg-success/12 text-success border-success/25' },
  aptitude: { label: 'Aptitude', color: 'bg-warning/12 text-warning border-warning/25' },
  'follow-up': { label: 'Follow-up', color: 'bg-error/12 text-error border-error/25' },
};

export const FILLER_WORDS = ['um', 'uh', 'like', 'you know', 'basically', 'actually', 'literally', 'right', 'so yeah'];
