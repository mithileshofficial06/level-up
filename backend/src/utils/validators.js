/**
 * Input validation utilities
 */

export const validateProfileSetup = (data) => {
  const errors = [];

  if (!data.email || !data.email.includes('@')) {
    errors.push('Valid email is required');
  }
  if (!data.name || data.name.trim().length < 2) {
    errors.push('Name must be at least 2 characters');
  }
  if (data.linkedin_url && !data.linkedin_url.includes('linkedin.com')) {
    errors.push('Invalid LinkedIn URL');
  }
  if (data.github_url && !data.github_url.includes('github.com')) {
    errors.push('Invalid GitHub URL');
  }

  const validRoles = [
    'Full Stack',
    'Data Science',
    'DevOps',
    'ML Engineer',
    'Backend',
    'Frontend',
  ];
  if (data.target_role && !validRoles.includes(data.target_role)) {
    errors.push(`Invalid target role. Must be one of: ${validRoles.join(', ')}`);
  }

  return { isValid: errors.length === 0, errors };
};

export const validateInterviewSetup = (data) => {
  const errors = [];

  const validCompanyTypes = ['FAANG', 'Product Startup', 'Service Company', 'Government'];
  const validDifficulties = ['Easy', 'Medium', 'Hard'];

  if (!data.company_type || !validCompanyTypes.includes(data.company_type)) {
    errors.push(`Invalid company type. Must be one of: ${validCompanyTypes.join(', ')}`);
  }
  if (!data.difficulty || !validDifficulties.includes(data.difficulty)) {
    errors.push(`Invalid difficulty. Must be one of: ${validDifficulties.join(', ')}`);
  }
  if (!data.role) {
    errors.push('Role is required');
  }

  return { isValid: errors.length === 0, errors };
};

export default { validateProfileSetup, validateInterviewSetup };
