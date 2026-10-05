import React, { useState } from 'react';
import { FileText, Briefcase, Zap, Sparkles, AlertCircle, Play } from 'lucide-react';
import { mcpStartInterview } from '../services/mcpClient';

interface SetupScreenProps {
  onStartSession: (sessionData: {
    sessionId: string;
    firstQuestion: string;
    topics: string[];
    role: string;
    difficulty: string;
  }) => void;
}

const SAMPLE_RESUME = `Alex Rivera - Senior Full Stack Engineer
Skills: TypeScript, React, Node.js, Express, MongoDB, AWS Bedrock, MCP Protocol, System Design
Experience: Software Engineer at CloudScale Systems (2022 - Present). Built high-concurrency microservices, integrated Amazon Bedrock LLM endpoints, and designed real-time websockets.
Education: B.S. in Computer Science, State University.`;

const SAMPLE_JOB = `Role: Senior Full Stack Engineer (Alexa AI & Agentic Systems)
Responsibilities:
- Build self-hosted Model Context Protocol (MCP) servers with Streamable HTTP transport.
- Design agentic AI workflows using Amazon Bedrock Converse API.
- Create responsive React dashboards and real-time voice interfaces.
Requirements: TypeScript, Node.js, Express, MongoDB, AWS Bedrock runtime SDK.`;

export const SetupScreen: React.FC<SetupScreenProps> = ({ onStartSession }) => {
  const [role, setRole] = useState('Senior Full Stack Engineer');
  const [difficulty, setDifficulty] = useState<'easy' | 'medium' | 'hard'>('medium');
  const [numQuestions, setNumQuestions] = useState(5);
  const [resumeText, setResumeText] = useState('');
  const [jobDescription, setJobDescription] = useState('');

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handlePrefillDemo = () => {
    setResumeText(SAMPLE_RESUME);
    setJobDescription(SAMPLE_JOB);
    setRole('Senior Full Stack Engineer');
    setDifficulty('medium');
    setNumQuestions(4);
    setError(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!resumeText.trim() || !jobDescription.trim() || !role.trim()) {
      setError('Please fill out your resume text, target job description, and role title.');
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const result = await mcpStartInterview(
        resumeText,
        jobDescription,
        role,
        difficulty,
        numQuestions
      );

      onStartSession({
        sessionId: result.sessionId,
        firstQuestion: result.firstQuestion,
        topics: result.plan.topics,
        role,
        difficulty,
      });
    } catch (err: any) {
      setError(err.message || 'Failed to connect to InterviewDojo MCP Server.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <div className="text-center mb-8">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-950/80 border border-cyan-800 text-cyan-400 text-xs font-semibold mb-3">
          <Zap className="w-3.5 h-3.5" /> Powered by Self-Hosted MCP Server & AWS Bedrock
        </div>
        <h2 className="text-3xl font-extrabold text-white tracking-tight sm:text-4xl">
          Voice Mock Interview Setup
        </h2>
        <p className="mt-2 text-slate-400 text-sm max-w-2xl mx-auto">
          Share your resume and target job description. InterviewDojo generates custom questions targeting your real projects, skills, and job gap areas.
        </p>
      </div>

      <div className="flex justify-end mb-4">
        <button
          type="button"
          onClick={handlePrefillDemo}
          className="text-xs px-3 py-1.5 rounded-md bg-indigo-950 hover:bg-indigo-900 border border-indigo-700/60 text-indigo-300 transition flex items-center gap-1.5 shadow-sm"
        >
          <Sparkles className="w-3.5 h-3.5 text-indigo-400" /> Prefill Quick Demo Data (2-Min Run)
        </button>
      </div>

      {error && (
        <div className="mb-6 p-4 rounded-xl bg-red-950/80 border border-red-800 text-red-300 text-sm flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-red-400 shrink-0 mt-0.5" />
          <div>
            <p className="font-semibold">Connection or Setup Error</p>
            <p className="mt-0.5 text-xs text-red-400">{error}</p>
          </div>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
              Target Role Title
            </label>
            <input
              type="text"
              value={role}
              onChange={(e) => setRole(e.target.value)}
              placeholder="e.g. Full Stack Engineer"
              className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-800 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-cyan-500 text-sm"
              required
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
              Interview Difficulty
            </label>
            <select
              value={difficulty}
              onChange={(e) => setDifficulty(e.target.value as any)}
              className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-800 text-white focus:outline-none focus:ring-2 focus:ring-cyan-500 text-sm"
            >
              <option value="easy">Easy (Fundamentals & Conceptual)</option>
              <option value="medium">Medium (Standard Technical & Design)</option>
              <option value="hard">Hard (Amazon Bar Raiser Level)</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
              Total Questions ({numQuestions})
            </label>
            <input
              type="range"
              min={3}
              max={10}
              value={numQuestions}
              onChange={(e) => setNumQuestions(Number(e.target.value))}
              className="w-full accent-cyan-400 mt-2"
            />
            <div className="flex justify-between text-[10px] text-slate-500 mt-1">
              <span>3 questions</span>
              <span>6 default</span>
              <span>10 max</span>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 shadow-xl">
            <label className="flex items-center gap-2 text-sm font-semibold text-cyan-300 mb-2">
              <FileText className="w-4 h-4 text-cyan-400" /> Candidate Resume / Project Portfolio
            </label>
            <textarea
              rows={8}
              value={resumeText}
              onChange={(e) => setResumeText(e.target.value)}
              placeholder="Paste candidate resume text or project summaries here..."
              className="w-full p-3 rounded-xl bg-slate-950 border border-slate-800 text-slate-200 text-xs focus:outline-none focus:ring-2 focus:ring-cyan-500 resize-none"
              required
            />
          </div>

          <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 shadow-xl">
            <label className="flex items-center gap-2 text-sm font-semibold text-indigo-300 mb-2">
              <Briefcase className="w-4 h-4 text-indigo-400" /> Target Job Description
            </label>
            <textarea
              rows={8}
              value={jobDescription}
              onChange={(e) => setJobDescription(e.target.value)}
              placeholder="Paste target job description and required tech stack here..."
              className="w-full p-3 rounded-xl bg-slate-950 border border-slate-800 text-slate-200 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none"
              required
            />
          </div>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full py-4 rounded-2xl bg-gradient-to-r from-cyan-500 via-blue-600 to-indigo-600 hover:from-cyan-400 hover:via-blue-500 hover:to-indigo-500 text-white font-bold text-base shadow-xl shadow-cyan-500/20 transition flex items-center justify-center gap-2 disabled:opacity-50"
        >
          {loading ? (
            <>
              <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
              <span>Connecting via MCP & Generating Plan with Bedrock...</span>
            </>
          ) : (
            <>
              <Play className="w-5 h-5 fill-current" />
              <span>Start Spoken Alexa+ Mock Interview</span>
            </>
          )}
        </button>
      </form>
    </div>
  );
};
