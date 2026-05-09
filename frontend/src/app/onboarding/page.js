'use client';

import { useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useUser, useAuth as useClerkAuth } from '@clerk/nextjs';
import { motion, AnimatePresence } from 'framer-motion';
import { useDropzone } from 'react-dropzone';
import toast from 'react-hot-toast';
import {
  Upload, FileText, GitFork, Link2, User, Check,
  ChevronRight, ChevronLeft, Loader2, Star, ExternalLink, ArrowRight
} from 'lucide-react';
import Navbar from '@/components/ui/Navbar';
import Button from '@/components/ui/Button';
import { profileAPI, setAuthTokenGetter } from '@/services/api';
import { ROLES } from '@/utils/constants';

const steps = [
  { id: 1, title: 'Upload Resume', icon: FileText },
  { id: 2, title: 'GitHub', icon: GitFork },
  { id: 3, title: 'Details', icon: User },
  { id: 4, title: 'Confirm', icon: Check },
];

// Step Progress Bar Component
function StepProgress({ currentStep, steps: stepsList }) {
  return (
    <div className="flex items-center justify-center gap-2 mb-10">
      {stepsList.map((step, i) => {
        const Icon = step.icon;
        const isActive = currentStep === step.id;
        const isComplete = currentStep > step.id;
        return (
          <div key={step.id} className="flex items-center">
            <div className="flex flex-col items-center">
              <motion.div
                animate={{
                  scale: isActive ? 1.05 : 1,
                  backgroundColor: isComplete ? '#ff771c' : isActive ? 'rgba(255,119,28,0.12)' : 'rgba(46,42,37,0.5)',
                }}
                className={`
                  w-11 h-11 rounded-xl flex items-center justify-center border-2 transition-colors
                  ${isComplete ? 'border-primary-500' : isActive ? 'border-primary-500/50' : 'border-surface-700/30'}
                `}
              >
                {isComplete ? (
                  <Check className="w-5 h-5 text-white" />
                ) : (
                  <Icon className={`w-5 h-5 ${isActive ? 'text-primary-400' : 'text-surface-500'}`} />
                )}
              </motion.div>
              <span className={`text-xs mt-2 font-medium ${isActive ? 'text-primary-400' : isComplete ? 'text-primary-500' : 'text-surface-500'}`}>
                {step.title}
              </span>
            </div>
            {i < stepsList.length - 1 && (
              <div className={`w-12 sm:w-20 h-0.5 mx-2 mb-5 rounded-full ${isComplete ? 'bg-primary-500' : 'bg-surface-700'}`} />
            )}
          </div>
        );
      })}
    </div>
  );
}

// Step 1: Resume Upload
function ResumeStep({ resumeFile, setResumeFile, resumeData, setResumeData, uploading, setUploading, getToken }) {
  const onDrop = useCallback(async (acceptedFiles) => {
    const file = acceptedFiles[0];
    if (!file) return;

    setResumeFile(file);
    setUploading(true);

    try {
      setAuthTokenGetter(getToken);
      const res = await profileAPI.uploadResume(file);
      setResumeData(res.data.data);
      toast.success('Resume parsed successfully!');
    } catch (error) {
      console.error('Resume upload failed:', error);
      setResumeFile(null);
    } finally {
      setUploading(false);
    }
  }, [setResumeFile, setResumeData, setUploading, getToken]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { 'application/pdf': ['.pdf'] },
    maxSize: 5 * 1024 * 1024,
    maxFiles: 1,
  });

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      className="space-y-6"
    >
      <div className="text-center mb-6">
        <h2 className="text-2xl font-bold text-surface-100 mb-2">Upload Your Resume</h2>
        <p className="text-surface-400">We&apos;ll analyze your skills and projects for personalized questions</p>
      </div>

      <div
        {...getRootProps()}
        className={`
          relative border-2 border-dashed rounded-2xl p-12 text-center cursor-pointer transition-all duration-300
          ${isDragActive ? 'border-primary-500 bg-primary-500/5' : 'border-surface-600/30 hover:border-primary-500/30 hover:bg-surface-800/20'}
          ${resumeFile ? 'border-success/30 bg-success/5' : ''}
        `}
      >
        <input {...getInputProps()} />

        {uploading ? (
          <div className="flex flex-col items-center gap-4">
            <div className="w-16 h-16 rounded-2xl bg-primary-500/10 flex items-center justify-center">
              <Loader2 className="w-8 h-8 text-primary-400 animate-spin" />
            </div>
            <div>
              <p className="text-surface-200 font-medium">Parsing your resume...</p>
              <p className="text-surface-400 text-sm mt-1">AI is extracting skills, projects, and experience</p>
            </div>
            <div className="w-48 h-2 bg-surface-700 rounded-full overflow-hidden">
              <div className="h-full bg-primary-500 rounded-full animate-shimmer" style={{ width: '70%' }} />
            </div>
          </div>
        ) : resumeFile && resumeData ? (
          <div className="flex flex-col items-center gap-4">
            <div className="w-16 h-16 rounded-2xl bg-green-500/10 flex items-center justify-center">
              <Check className="w-8 h-8 text-green-400" />
            </div>
            <div>
              <p className="text-surface-200 font-medium">{resumeFile.name}</p>
              <p className="text-green-400 text-sm mt-1">Resume parsed successfully!</p>
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-4">
            <div className="w-16 h-16 rounded-2xl bg-surface-800 flex items-center justify-center">
              <Upload className="w-8 h-8 text-surface-400" />
            </div>
            <div>
              <p className="text-surface-200 font-medium">
                {isDragActive ? 'Drop your resume here' : 'Drag & drop your resume PDF'}
              </p>
              <p className="text-surface-400 text-sm mt-1">or click to browse • PDF only, max 5MB</p>
            </div>
          </div>
        )}
      </div>

      {/* Parsed Data Preview */}
      {resumeData?.structuredData && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-xl bg-surface-900/50 border border-surface-700/20 p-5 space-y-3"
        >
          <h4 className="text-sm font-semibold text-surface-300 uppercase tracking-wider">Extracted Data</h4>
          {resumeData.structuredData.name && (
            <p className="text-surface-200"><span className="text-surface-400">Name:</span> {resumeData.structuredData.name}</p>
          )}
          {resumeData.structuredData.skills?.length > 0 && (
            <div>
              <p className="text-surface-400 text-sm mb-2">Skills:</p>
              <div className="flex flex-wrap gap-2">
                {resumeData.structuredData.skills.slice(0, 15).map((skill, i) => (
                  <span key={i} className="px-3 py-1 rounded-lg bg-primary-500/10 text-primary-300 text-sm border border-primary-500/20">
                    {skill}
                  </span>
                ))}
              </div>
            </div>
          )}
          {resumeData.structuredData.projects?.length > 0 && (
            <div>
              <p className="text-surface-400 text-sm mb-2">Projects found: {resumeData.structuredData.projects.length}</p>
            </div>
          )}
        </motion.div>
      )}
    </motion.div>
  );
}

// Step 2: GitHub
function GitHubStep({ githubUsername, setGithubUsername, githubData, setGithubData, loadingGithub, setLoadingGithub, getToken }) {
  const handleFetchGithub = async () => {
    if (!githubUsername.trim()) {
      toast.error('Enter a GitHub username');
      return;
    }

    setLoadingGithub(true);
    try {
      setAuthTokenGetter(getToken);
      const res = await profileAPI.fetchGitHub(githubUsername.trim());
      setGithubData(res.data.data);
      toast.success('GitHub data fetched!');
    } catch (error) {
      console.error('GitHub fetch failed:', error);
    } finally {
      setLoadingGithub(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      className="space-y-6"
    >
      <div className="text-center mb-6">
        <h2 className="text-2xl font-bold text-surface-100 mb-2">Connect GitHub</h2>
        <p className="text-surface-400">We&apos;ll fetch your repos for project-specific interview questions</p>
      </div>

      <div className="flex gap-3">
        <div className="relative flex-1">
          <GitFork className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-surface-500" />
          <input
            type="text"
            placeholder="Enter GitHub username"
            value={githubUsername}
            onChange={(e) => setGithubUsername(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleFetchGithub()}
            className="w-full pl-12 pr-4 py-3 bg-surface-900/60 border border-surface-700/30 rounded-lg text-surface-100 placeholder-surface-500 focus:outline-none focus:ring-1 focus:ring-primary-500/30 focus:border-primary-500/30 transition-all text-sm"
          />
        </div>
        <Button
          onClick={handleFetchGithub}
          loading={loadingGithub}
          disabled={!githubUsername.trim()}
        >
          Fetch
        </Button>
      </div>

      {/* Repo Preview */}
      {githubData?.repos?.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-3"
        >
          <h4 className="text-sm font-semibold text-surface-300 uppercase tracking-wider">
            Top Repositories ({githubData.repos.length})
          </h4>
          <div className="grid gap-3 max-h-80 overflow-y-auto pr-2">
            {githubData.repos.slice(0, 6).map((repo) => (
              <div
                key={repo.name}
                className="rounded-lg bg-surface-900/40 border border-surface-700/20 p-3.5 hover:border-surface-600/30 transition-colors"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <h5 className="text-surface-100 font-medium truncate">{repo.name}</h5>
                      <a href={repo.url} target="_blank" rel="noopener noreferrer" className="text-surface-500 hover:text-primary-400">
                        <ExternalLink className="w-3.5 h-3.5" />
                      </a>
                    </div>
                    {repo.description && (
                      <p className="text-surface-400 text-sm mt-1 line-clamp-2">{repo.description}</p>
                    )}
                    <div className="flex items-center gap-3 mt-2">
                      {repo.language && (
                        <span className="text-xs text-surface-400 flex items-center gap-1">
                          <span className="w-2.5 h-2.5 rounded-full bg-primary-500" />
                          {repo.language}
                        </span>
                      )}
                      {repo.stars > 0 && (
                        <span className="text-xs text-surface-400 flex items-center gap-1">
                          <Star className="w-3 h-3" /> {repo.stars}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </motion.div>
      )}

      {/* AI Summary */}
      {githubData?.summary?.overallAssessment && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="rounded-xl bg-primary-500/5 border border-primary-500/20 p-4"
        >
          <p className="text-xs font-semibold text-primary-400 uppercase tracking-wider mb-1">AI Assessment</p>
          <p className="text-surface-300 text-sm">{githubData.summary.overallAssessment}</p>
        </motion.div>
      )}

      <p className="text-center text-surface-500 text-sm">
        This step is optional. You can skip if you prefer.
      </p>
    </motion.div>
  );
}

// Step 3: Details
function DetailsStep({ linkedinUrl, setLinkedinUrl, targetRole, setTargetRole, college, setCollege }) {
  const TOP_COLLEGES = [
    'IIT Bombay','IIT Delhi','IIT Madras','IIT Kanpur','IIT Kharagpur','IIT Roorkee','IIT Hyderabad','IIT Guwahati',
    'NIT Trichy','NIT Warangal','NIT Surathkal','NIT Calicut','IIIT Hyderabad','BITS Pilani','VIT Vellore',
    'SRM University','Anna University','Manipal IT','PSG Tech','DTU Delhi','NSUT Delhi','COEP Pune',
    'VJTI Mumbai','College of Engineering Guindy','MIT Manipal',
  ];
  const filtered = college ? TOP_COLLEGES.filter(c => c.toLowerCase().includes(college.toLowerCase())) : [];

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      className="space-y-6"
    >
      <div className="text-center mb-6">
        <h2 className="text-2xl font-bold text-surface-100 mb-2">Your Details</h2>
        <p className="text-surface-400">Tell us about your career goals</p>
      </div>

      {/* LinkedIn */}
      <div>
        <label className="block text-sm font-medium text-surface-300 mb-2">LinkedIn Profile (optional)</label>
        <div className="relative">
          <Link2 className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-surface-500" />
          <input
            type="url"
            placeholder="https://linkedin.com/in/yourprofile"
            value={linkedinUrl}
            onChange={(e) => setLinkedinUrl(e.target.value)}
            className="w-full pl-12 pr-4 py-3 bg-surface-900/60 border border-surface-700/30 rounded-lg text-surface-100 placeholder-surface-500 focus:outline-none focus:ring-1 focus:ring-primary-500/30 focus:border-primary-500/30 transition-all text-sm"
          />
        </div>
      </div>

      {/* College */}
      <div>
        <label className="block text-sm font-medium text-surface-300 mb-2">College / University (optional)</label>
        <div className="relative">
          <input
            type="text"
            placeholder="Type your college name..."
            value={college}
            onChange={(e) => setCollege(e.target.value)}
            className="w-full px-4 py-3 bg-surface-900/60 border border-surface-700/30 rounded-lg text-surface-100 placeholder-surface-500 focus:outline-none focus:ring-1 focus:ring-primary-500/30 focus:border-primary-500/30 transition-all text-sm"
          />
          {college && filtered.length > 0 && (
            <div className="absolute z-10 left-0 right-0 top-full mt-1 rounded-lg border border-surface-700/30 bg-surface-900 shadow-xl max-h-40 overflow-y-auto">
              {filtered.slice(0, 6).map((c, i) => (
                <button key={i} onClick={() => setCollege(c)}
                  className="w-full px-4 py-2 text-left text-sm text-surface-200 hover:bg-surface-800 transition-colors">
                  {c}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Target Role */}
      <div>
        <label className="block text-sm font-medium text-surface-300 mb-3">Target Role</label>
        <div className="grid grid-cols-2 gap-3">
          {ROLES.map((role) => (
            <button
              key={role.value}
              onClick={() => setTargetRole(role.value)}
              className={`
                py-3 px-4 rounded-lg border text-left transition-all duration-200
                ${targetRole === role.value
                  ? 'border-primary-500/40 bg-primary-500/5 text-primary-400'
                  : 'border-surface-700/30 bg-surface-900/40 text-surface-300 hover:border-surface-600/50'
                }
              `}
            >
              <span className="font-medium">{role.label}</span>
            </button>
          ))}
        </div>
      </div>
    </motion.div>
  );
}

// Step 4: Confirmation
function ConfirmStep({ resumeData, githubData, linkedinUrl, targetRole, githubUsername }) {
  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      className="space-y-6"
    >
      <div className="text-center mb-6">
        <h2 className="text-2xl font-bold text-surface-100 mb-2">Profile Summary</h2>
        <p className="text-surface-400">Review your details before completing setup</p>
      </div>

      <div className="space-y-4">
        {/* Resume */}
        <div className="rounded-xl bg-surface-900/40 border border-surface-700/20 p-5">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-xl bg-green-500/10 flex items-center justify-center">
              <FileText className="w-5 h-5 text-green-400" />
            </div>
            <div>
              <h4 className="font-medium text-surface-200">Resume</h4>
              <p className="text-sm text-success">
                {resumeData ? 'Parsed successfully' : 'Not uploaded'}
              </p>
            </div>
          </div>
          {resumeData?.structuredData?.skills?.length > 0 && (
            <div className="flex flex-wrap gap-1.5 mt-2">
              {resumeData.structuredData.skills.slice(0, 10).map((s, i) => (
                <span key={i} className="px-2 py-0.5 rounded-md bg-surface-700 text-surface-300 text-xs">{s}</span>
              ))}
            </div>
          )}
        </div>

        {/* GitHub */}
        <div className="rounded-xl bg-surface-800/50 border border-surface-700/50 p-5">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-purple-500/10 flex items-center justify-center">
              <GitFork className="w-5 h-5 text-purple-400" />
            </div>
            <div>
              <h4 className="font-medium text-surface-200">GitHub</h4>
              <p className="text-sm text-surface-400">
                {githubData ? `@${githubUsername} — ${githubData.repos?.length || 0} repos` : 'Not connected'}
              </p>
            </div>
          </div>
        </div>

        {/* Target Role */}
        <div className="rounded-xl bg-surface-800/50 border border-surface-700/50 p-5">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-primary-500/10 flex items-center justify-center">
              <User className="w-5 h-5 text-primary-400" />
            </div>
            <div>
              <h4 className="font-medium text-surface-200">Target Role</h4>
              <p className="text-sm text-surface-400">{targetRole || 'Not selected'}</p>
            </div>
          </div>
        </div>

        {linkedinUrl && (
          <div className="rounded-xl bg-surface-800/50 border border-surface-700/50 p-5">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-blue-500/10 flex items-center justify-center">
                <Link2 className="w-5 h-5 text-blue-400" />
              </div>
              <div>
                <h4 className="font-medium text-surface-200">LinkedIn</h4>
                <p className="text-sm text-surface-400 truncate">{linkedinUrl}</p>
              </div>
            </div>
          </div>
        )}
      </div>
    </motion.div>
  );
}

// Main Onboarding Page
export default function OnboardingPage() {
  const router = useRouter();
  const { user } = useUser();
  const { getToken } = useClerkAuth();
  const [currentStep, setCurrentStep] = useState(1);
  const [saving, setSaving] = useState(false);

  // Step 1 state
  const [resumeFile, setResumeFile] = useState(null);
  const [resumeData, setResumeData] = useState(null);
  const [uploading, setUploading] = useState(false);

  // Step 2 state
  const [githubUsername, setGithubUsername] = useState('');
  const [githubData, setGithubData] = useState(null);
  const [loadingGithub, setLoadingGithub] = useState(false);

  // Step 3 state
  const [linkedinUrl, setLinkedinUrl] = useState('');
  const [targetRole, setTargetRole] = useState('');
  const [college, setCollege] = useState('');

  const handleNext = () => {
    if (currentStep === 1 && !resumeData) {
      toast.error('Please upload your resume first');
      return;
    }
    if (currentStep === 3 && !targetRole) {
      toast.error('Please select a target role');
      return;
    }
    setCurrentStep((prev) => Math.min(prev + 1, 4));
  };

  const handleBack = () => {
    setCurrentStep((prev) => Math.max(prev - 1, 1));
  };

  const handleComplete = async () => {
    setSaving(true);
    try {
      setAuthTokenGetter(getToken);
      await profileAPI.setup({
        email: user?.primaryEmailAddress?.emailAddress,
        name: user?.fullName || user?.firstName || '',
        avatar_url: user?.imageUrl,
        github_url: githubUsername ? `https://github.com/${githubUsername}` : '',
        linkedin_url: linkedinUrl,
        target_role: targetRole,
        college: college,
      });

      toast.success('Profile setup complete!');
      router.push('/dashboard');
    } catch (error) {
      console.error('Profile setup failed:', error);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-surface-950">
      <Navbar />

      <div className="max-w-2xl mx-auto px-4 py-12">
        <StepProgress currentStep={currentStep} steps={steps} />

        <div className="rounded-xl bg-surface-900/50 border border-surface-700/20 p-6 sm:p-8">
          <AnimatePresence mode="wait">
            {currentStep === 1 && (
              <ResumeStep
                key="resume"
                resumeFile={resumeFile}
                setResumeFile={setResumeFile}
                resumeData={resumeData}
                setResumeData={setResumeData}
                uploading={uploading}
                setUploading={setUploading}
                getToken={getToken}
              />
            )}
            {currentStep === 2 && (
              <GitHubStep
                key="github"
                githubUsername={githubUsername}
                setGithubUsername={setGithubUsername}
                githubData={githubData}
                setGithubData={setGithubData}
                loadingGithub={loadingGithub}
                setLoadingGithub={setLoadingGithub}
                getToken={getToken}
              />
            )}
            {currentStep === 3 && (
              <DetailsStep
                key="details"
                linkedinUrl={linkedinUrl}
                setLinkedinUrl={setLinkedinUrl}
                targetRole={targetRole}
                setTargetRole={setTargetRole}
                college={college}
                setCollege={setCollege}
              />
            )}
            {currentStep === 4 && (
              <ConfirmStep
                key="confirm"
                resumeData={resumeData}
                githubData={githubData}
                linkedinUrl={linkedinUrl}
                targetRole={targetRole}
                githubUsername={githubUsername}
              />
            )}
          </AnimatePresence>

          {/* Navigation Buttons */}
          <div className="flex items-center justify-between mt-8 pt-6 border-t border-surface-700/20">
            {currentStep > 1 ? (
              <Button variant="ghost" onClick={handleBack} icon={ChevronLeft}>
                Back
              </Button>
            ) : (
              <div />
            )}

            {currentStep < 4 ? (
              <Button onClick={handleNext} disabled={uploading}>
                {currentStep === 2 && !githubData ? 'Skip' : 'Next'}
                <ChevronRight className="w-4 h-4" />
              </Button>
            ) : (
              <Button onClick={handleComplete} loading={saving} icon={ArrowRight}>
                Complete Setup
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
