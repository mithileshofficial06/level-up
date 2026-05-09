import axios from 'axios';
import { summarizeGitHubProjects } from './claude.service.js';
import supabase from '../db.js';

const GITHUB_API = 'https://api.github.com';

/**
 * Fetch user's public repos from GitHub API
 * @param {string} username - GitHub username
 * @returns {Array} Repository data
 */
export const fetchUserRepos = async (username) => {
  const headers = {
    Accept: 'application/vnd.github.v3+json',
  };

  if (process.env.GITHUB_TOKEN) {
    headers.Authorization = `token ${process.env.GITHUB_TOKEN}`;
  }

  try {
    const response = await axios.get(
      `${GITHUB_API}/users/${username}/repos`,
      {
        headers,
        params: {
          sort: 'updated',
          direction: 'desc',
          per_page: 30,
          type: 'owner',
        },
      }
    );

    return response.data;
  } catch (error) {
    if (error.response?.status === 404) {
      throw new Error(`GitHub user "${username}" not found`);
    }
    if (error.response?.status === 403) {
      throw new Error('GitHub API rate limit exceeded. Try again later.');
    }
    throw new Error(`Failed to fetch GitHub repos: ${error.message}`);
  }
};

/**
 * Fetch repos, summarize with Claude, and save to Supabase
 * @param {string} username - GitHub username
 * @param {string} userId - Database user ID
 * @returns {Object} GitHub summary
 */
export const fetchAndSummarize = async (username, userId) => {
  // Step 1: Fetch repos from GitHub
  console.log(`🐙 Fetching GitHub repos for @${username}...`);
  const repos = await fetchUserRepos(username);

  if (!repos || repos.length === 0) {
    return {
      projects: [],
      overallAssessment: 'No public repositories found.',
    };
  }

  // Filter out forks and sort by stars
  const ownRepos = repos
    .filter((r) => !r.fork)
    .sort((a, b) => b.stargazers_count - a.stargazers_count)
    .slice(0, 10); // Send top 10 to Claude for analysis

  // Step 2: Summarize with Claude
  console.log('🤖 Summarizing projects with Claude...');
  const summary = await summarizeGitHubProjects(ownRepos);

  // Step 3: Save to Supabase
  if (supabase && userId) {
    const { data: resume } = await supabase
      .from('resumes')
      .select('id')
      .eq('user_id', userId)
      .single();

    if (resume) {
      await supabase
        .from('resumes')
        .update({ github_summary: summary })
        .eq('id', resume.id);
    } else {
      await supabase
        .from('resumes')
        .insert({
          user_id: userId,
          github_summary: summary,
        });
    }
  }

  return {
    repos: ownRepos.map((r) => ({
      name: r.name,
      description: r.description,
      language: r.language,
      stars: r.stargazers_count,
      url: r.html_url,
      topics: r.topics || [],
    })),
    summary,
  };
};

export default { fetchUserRepos, fetchAndSummarize };
