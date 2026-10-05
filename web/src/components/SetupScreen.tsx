import React, { useState } from 'react';
import {
  FileText,
  Briefcase,
  Zap,
  Sparkles,
  AlertCircle,
  Play,
  Bot,
  Cpu,
  ShieldCheck,
  Target,
  Layers,
  CheckCircle2,
  Code,
  Globe,
  Award,
} from 'lucide-react';
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

// Preset candidate templates for quick selection
const PRESETS = [
  {
    title: '🚀 Full Stack Engineer (Node/React/Bedrock)',
    role: 'Senior Full Stack Engineer',
    resume: `Alex Rivera - Senior Full Stack Engineer
Skills: TypeScript, React, Node.js, Express, MongoDB, AWS Bedrock, MCP Protocol, System Design
Projects:
- InterviewDojo MCP Server: Self-hosted MCP server with Streamable HTTP SSE transport and Bedrock Converse API.
- Distributed Microservices Cache: Redis and Node.js caching layer handling 50k ops/sec.
Experience: Full Stack Engineer Intern at CloudScale Systems. Optimized database queries and built React interfaces.
Education: B.S. in Computer Science.`,
    job: `Role: Senior Full Stack Engineer (Alexa AI & Agentic Systems)
Responsibilities:
- Build self-hosted Model Context Protocol (MCP) servers with Streamable HTTP transport.
- Design agentic AI workflows using Amazon Bedrock Converse API.
- Create responsive React dashboards and real-time voice interfaces.
Requirements: TypeScript, Node.js, Express, MongoDB, AWS Bedrock runtime SDK.`,
  },
  {
    title: '☕ Java Backend Specialist (Spring Boot/Microservices)',
    role: 'Java Backend Architect',
    resume: `Rahul Sharma - Senior Java Backend Engineer
Skills: Java 17, Spring Boot, Microservices, PostgreSQL, Kafka, Redis, Docker, Kubernetes, AWS
Experience: Backend Engineer at Enterprise Solutions. Designed high-throughput REST APIs and Spring Cloud microservices. Integrated Kafka event streams for transaction processing.
Education: B.Tech in Information Technology.`,
    job: `Role: Senior Java Microservices Engineer
Responsibilities:
- Architect distributed microservices using Spring Boot, Kafka, and PostgreSQL.
- Optimize database queries, implement Redis caching, and maintain high availability.
Requirements: Java 17+, Spring Cloud, Docker, Kafka, AWS, Unit Testing.`,
  },
  {
    title: '🐍 AI & Data Systems Engineer (Python/PyTorch/LLMs)',
    role: 'AI Engineer',
    resume: `Sophia Chen - AI Systems Engineer
Skills: Python, PyTorch, LangChain, Vector Databases (Pinecone, Qdrant), FastAPIs, Docker, AWS
Projects:
- RAG Knowledge Base: Built Retrieval-Augmented Generation pipeline processing 100k docs with vector embeddings.
- LLM Fine-Tuning: Fine-tuned Llama 3 models for domain-specific code analysis.
Education: M.S. in Artificial Intelligence.`,
    job: `Role: Senior AI Engineer
Responsibilities:
- Build agentic workflows and RAG pipelines using LLMs and vector search.
- Deploy scalable Python microservices with FastAPI and AWS.
Requirements: Python, PyTorch, Vector DBs, RAG Architecture, AWS.`,
  },
];

export const SetupScreen: React.FC<SetupScreenProps> = ({ onStartSession }) => {
  const [role, setRole] = useState('Senior Full Stack Engineer');
  const [difficulty, setDifficulty] = useState<'easy' | 'medium' | 'hard'>('medium');
  const [numQuestions, setNumQuestions] = useState(5);
  const [resumeText, setResumeText] = useState(PRESETS[0].resume);
  const [jobDescription, setJobDescription] = useState(PRESETS[0].job);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSelectPreset = (presetIndex: number) => {
    const p = PRESETS[presetIndex];
    setRole(p.role);
    setResumeText(p.resume);
    setJobDescription(p.job);
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
    <div className="max-w-6xl mx-auto px-4 py-8 space-y-10">
      {/* Hero Header Banner */}
      <div className="text-center relative">
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-cyan-950/90 border border-cyan-800 text-cyan-300 text-xs font-semibold mb-4 shadow-lg shadow-cyan-950/50">
          <Zap className="w-4 h-4 text-cyan-400 animate-pulse" /> Self-Hosted MCP Server (Spec 2025-11-25+) & AWS Bedrock
        </div>
        <h2 className="text-4xl font-extrabold text-white tracking-tight sm:text-5xl font-heading bg-gradient-to-r from-white via-slate-100 to-cyan-300 bg-clip-text text-transparent">
          Voice Mock Technical Interviews Powered by Alexa+
        </h2>
        <p className="mt-3 text-slate-400 text-base max-w-3xl mx-auto leading-relaxed">
          InterviewDojo doesn't ask generic coding questions. It analyzes your <span className="text-cyan-400 font-semibold">actual resume projects & tech stack</span> against a target job description, asking targeted questions and scoring answers with <span className="text-indigo-400 font-semibold">Amazon Bar Raiser rubrics</span>.
        </p>

        {/* Feature Badges Row */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-6 max-w-4xl mx-auto text-left">
          <div className="bg-slate-900/80 border border-slate-800 p-3 rounded-2xl flex items-center gap-3">
            <div className="p-2 rounded-xl bg-cyan-950 text-cyan-400">
              <Globe className="w-5 h-5" />
            </div>
            <div>
              <div className="text-xs font-bold text-white">Streamable HTTP</div>
              <div className="text-[10px] text-slate-400">JSON-RPC over SSE</div>
            </div>
          </div>

          <div className="bg-slate-900/80 border border-slate-800 p-3 rounded-2xl flex items-center gap-3">
            <div className="p-2 rounded-xl bg-indigo-950 text-indigo-400">
              <Cpu className="w-5 h-5" />
            </div>
            <div>
              <div className="text-xs font-bold text-white">Amazon Bedrock</div>
              <div className="text-[10px] text-slate-400">Claude 3.5 Converse</div>
            </div>
          </div>

          <div className="bg-slate-900/80 border border-slate-800 p-3 rounded-2xl flex items-center gap-3">
            <div className="p-2 rounded-xl bg-blue-950 text-blue-400">
              <Bot className="w-5 h-5" />
            </div>
            <div>
              <div className="text-xs font-bold text-white">Voice & Mic</div>
              <div className="text-[10px] text-slate-400">Web Speech API</div>
            </div>
          </div>

          <div className="bg-slate-900/80 border border-slate-800 p-3 rounded-2xl flex items-center gap-3">
            <div className="p-2 rounded-xl bg-amber-950 text-amber-400">
              <Award className="w-5 h-5" />
            </div>
            <div>
              <div className="text-xs font-bold text-white">Bar Raiser Score</div>
              <div className="text-[10px] text-slate-400">Dynamic 0-10 Rubric</div>
            </div>
          </div>
        </div>
      </div>

      {/* Preset Quick Selectors */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-6 shadow-2xl">
        <div className="flex items-center justify-between mb-4">
          <label className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-cyan-400" /> Quick Preset Resume Templates
          </label>
          <span className="text-[11px] text-slate-400">Select a preset to auto-fill candidate data:</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {PRESETS.map((preset, idx) => (
            <button
              key={idx}
              type="button"
              onClick={() => handleSelectPreset(idx)}
              className="p-3.5 rounded-2xl bg-slate-950 hover:bg-slate-800 border border-slate-800 hover:border-cyan-700/60 text-left transition flex flex-col justify-between group shadow-md"
            >
              <span className="text-xs font-bold text-slate-200 group-hover:text-cyan-400 transition">
                {preset.title}
              </span>
              <span className="text-[10px] text-slate-500 mt-2 font-mono">
                Click to load candidate profile & job
              </span>
            </button>
          ))}
        </div>
      </div>

      {error && (
        <div className="p-4 rounded-2xl bg-red-950/80 border border-red-800 text-red-300 text-sm flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-red-400 shrink-0 mt-0.5" />
          <div>
            <p className="font-semibold">Connection or Setup Error</p>
            <p className="mt-0.5 text-xs text-red-400">{error}</p>
          </div>
        </div>
      )}

      {/* Main Form Area */}
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 bg-slate-900/90 border border-slate-800 p-6 rounded-3xl shadow-xl">
          <div>
            <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
              Target Role Title
            </label>
            <input
              type="text"
              value={role}
              onChange={(e) => setRole(e.target.value)}
              placeholder="e.g. Senior Full Stack Engineer"
              className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-cyan-500 text-xs"
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
              className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white focus:outline-none focus:ring-2 focus:ring-cyan-500 text-xs"
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
            <div className="flex justify-between text-[10px] text-slate-500 mt-1 font-mono">
              <span>3 questions</span>
              <span>5 default</span>
              <span>10 max</span>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-6 shadow-xl flex flex-col">
            <label className="flex items-center gap-2 text-sm font-semibold text-cyan-300 mb-2">
              <FileText className="w-4 h-4 text-cyan-400" /> Candidate Resume / Project Portfolio
            </label>
            <textarea
              rows={10}
              value={resumeText}
              onChange={(e) => setResumeText(e.target.value)}
              placeholder="Paste candidate resume text or project summaries here..."
              className="w-full p-3.5 rounded-2xl bg-slate-950 border border-slate-800 text-slate-200 text-xs focus:outline-none focus:ring-2 focus:ring-cyan-500 resize-none font-mono flex-1 leading-relaxed"
              required
            />
          </div>

          <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-6 shadow-xl flex flex-col">
            <label className="flex items-center gap-2 text-sm font-semibold text-indigo-300 mb-2">
              <Briefcase className="w-4 h-4 text-indigo-400" /> Target Job Description
            </label>
            <textarea
              rows={10}
              value={jobDescription}
              onChange={(e) => setJobDescription(e.target.value)}
              placeholder="Paste target job description and required tech stack here..."
              className="w-full p-3.5 rounded-2xl bg-slate-950 border border-slate-800 text-slate-200 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none font-mono flex-1 leading-relaxed"
              required
            />
          </div>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full py-4 rounded-2xl bg-gradient-to-r from-cyan-500 via-blue-600 to-indigo-600 hover:from-cyan-400 hover:via-blue-500 hover:to-indigo-500 text-white font-bold text-base shadow-xl shadow-cyan-500/20 transition flex items-center justify-center gap-2.5 disabled:opacity-50"
        >
          {loading ? (
            <>
              <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
              <span>Connecting via MCP & Generating Questions with Bedrock...</span>
            </>
          ) : (
            <>
              <Play className="w-5 h-5 fill-current" />
              <span>Start Spoken Alexa+ Mock Interview</span>
            </>
          )}
        </button>
      </form>

      {/* 3-Step Process Walkthrough */}
      <div className="bg-slate-900/60 border border-slate-800/80 rounded-3xl p-8 shadow-xl">
        <h3 className="text-lg font-bold text-white text-center mb-6 font-heading">
          How InterviewDojo Operates Under the Hood
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-slate-950 p-5 rounded-2xl border border-slate-800 space-y-2">
            <div className="w-8 h-8 rounded-xl bg-cyan-950 text-cyan-400 flex items-center justify-center font-bold text-sm">
              1
            </div>
            <h4 className="text-sm font-bold text-slate-200">Skill & Gap Parsing</h4>
            <p className="text-xs text-slate-400 leading-relaxed">
              `parse_resume` extracts candidate skills and matches them against the target job description to compute technical gap areas.
            </p>
          </div>

          <div className="bg-slate-950 p-5 rounded-2xl border border-slate-800 space-y-2">
            <div className="w-8 h-8 rounded-xl bg-blue-950 text-blue-400 flex items-center justify-center font-bold text-sm">
              2
            </div>
            <h4 className="text-sm font-bold text-slate-200">Spoken Voice Interview</h4>
            <p className="text-xs text-slate-400 leading-relaxed">
              Alexa+ reads questions aloud via Web Speech API. Candidates respond via mic or typed input, streamed over SSE transport.
            </p>
          </div>

          <div className="bg-slate-950 p-5 rounded-2xl border border-slate-800 space-y-2">
            <div className="w-8 h-8 rounded-xl bg-indigo-950 text-indigo-400 flex items-center justify-center font-bold text-sm">
              3
            </div>
            <h4 className="text-sm font-bold text-slate-200">Bar Raiser Weak-Spot Report</h4>
            <p className="text-xs text-slate-400 leading-relaxed">
              Answers are scored for correctness, depth, and clarity. A 3-step concrete practice plan is generated at session end.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
