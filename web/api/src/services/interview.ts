import { z } from 'zod';
import { v4 as uuidv4 } from 'uuid';
import { invokeBedrockJson } from './llm.js';
import { ISession, IQuestion } from '../models/session.js';
import { saveSession, getSession } from './storage.js';
import { logger } from '../utils/logger.js';

// --- Zod Schemas ---

export const ParsedResumeSchema = z.object({
  skills: z.array(z.string()),
  projects: z.array(
    z.object({
      name: z.string(),
      summary: z.string(),
      tech: z.array(z.string()),
    })
  ),
  experience: z.array(
    z.object({
      role: z.string(),
      org: z.string(),
      highlights: z.array(z.string()),
    })
  ),
  education: z.string(),
});

export type ParsedResume = z.infer<typeof ParsedResumeSchema>;

export const QuestionGeneratedSchema = z.object({
  index: z.number(),
  question: z.string(),
  topic: z.string(),
  category: z.enum(['project', 'skill_gap', 'behavioral']),
});

export const InterviewPlanSchema = z.object({
  questions: z.array(QuestionGeneratedSchema),
});

export const ScoreAnswerSchema = z.object({
  scores: z.object({
    correctness: z.number().min(0).max(10),
    depth: z.number().min(0).max(10),
    clarity: z.number().min(0).max(10),
  }),
  overall: z.number().min(0).max(10),
  feedback: z.string(),
  followUp: z.string().optional(),
  idealAnswerHint: z.string(),
});

export type ScoreAnswerResult = z.infer<typeof ScoreAnswerSchema>;

export const SessionReportSchema = z.object({
  overall: z.number(),
  perTopic: z.array(
    z.object({
      topic: z.string(),
      score: z.number(),
    })
  ),
  strengths: z.array(z.string()),
  weakTopics: z.array(z.string()),
  practicePlan: z.array(z.string()),
});

export type SessionReportResult = z.infer<typeof SessionReportSchema>;

// --- Dynamic Keyword Extractor & Smart Mock Generators ---

function escapeRegex(str: string): string {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function extractKeywords(text: string): string[] {
  const commonTech = [
    'Java', 'Spring Boot', 'Python', 'C++', 'JavaScript', 'TypeScript', 'React', 'Angular', 'Vue',
    'Node.js', 'Express', 'Next.js', 'MongoDB', 'PostgreSQL', 'MySQL', 'Redis', 'Kafka', 'Docker',
    'Kubernetes', 'AWS', 'Bedrock', 'Microservices', 'REST', 'GraphQL', 'System Design', 'CI/CD',
    'Hibernate', 'Redux', 'Tailwind', 'Git'
  ];
  const found: string[] = [];
  for (const tech of commonTech) {
    const regex = new RegExp(`\\b${escapeRegex(tech)}\\b`, 'i');
    if (regex.test(text)) {
      found.push(tech);
    }
  }
  return found.length > 0 ? found : ['Software Development', 'System Architecture', 'API Integration'];
}

function getDynamicParsedResume(resumeText: string): ParsedResume {
  const skills = extractKeywords(resumeText);
  const lines = resumeText.split('\n').map((l) => l.trim()).filter(Boolean);
  
  const projectLines = lines.filter((l) => /project|built|created|developed|designed/i.test(l));
  const projects = projectLines.slice(0, 3).map((line, idx) => ({
    name: line.substring(0, 40) || `Project ${idx + 1}`,
    summary: line,
    tech: skills.slice(0, 3),
  }));

  if (projects.length === 0) {
    projects.push({
      name: 'Primary Portfolio Project',
      summary: lines[0] || 'Core technical implementation project.',
      tech: skills.slice(0, 3),
    });
  }

  return {
    skills,
    projects,
    experience: [
      {
        role: 'Software Development Engineer',
        org: 'Tech Engineering Team',
        highlights: lines.slice(0, 2),
      },
    ],
    education: 'Degree in Computer Science or Software Engineering',
  };
}

function getDynamicPlan(
  numQuestions: number,
  role: string,
  parsedResume: ParsedResume,
  jobDescription: string
): { questions: z.infer<typeof QuestionGeneratedSchema>[] } {
  const resumeSkills = parsedResume.skills;
  const jobSkills = extractKeywords(jobDescription);
  const gapSkills = jobSkills.filter((s) => !resumeSkills.includes(s));
  const activeGaps = gapSkills.length > 0 ? gapSkills : ['System Scalability', 'Performance Tuning'];

  const questions: z.infer<typeof QuestionGeneratedSchema>[] = [];
  let currentIdx = 0;

  // 1. Project / Resume Questions (~60%)
  const projCount = Math.max(1, Math.floor(numQuestions * 0.5));
  for (let i = 0; i < projCount; i++) {
    const skill = resumeSkills[i % resumeSkills.length] || 'software architecture';
    const projName = parsedResume.projects[i % parsedResume.projects.length]?.name || 'your primary project';
    questions.push({
      index: currentIdx++,
      question: `In your experience with ${skill} on ${projName}, how did you handle system design trade-offs and error recovery?`,
      topic: `${skill} & Architecture`,
      category: 'project',
    });
  }

  // 2. Skill Gap Questions (~40%)
  const gapCount = Math.max(1, numQuestions - projCount - 1);
  for (let i = 0; i < gapCount; i++) {
    const gapSkill = activeGaps[i % activeGaps.length];
    questions.push({
      index: currentIdx++,
      question: `The ${role} role requires proficiency in ${gapSkill}. How would you design a scalable microservice using ${gapSkill}?`,
      topic: `${gapSkill} Implementation`,
      category: 'skill_gap',
    });
  }

  // 3. Exactly One Behavioral Question
  questions.push({
    index: currentIdx++,
    question: `Tell me about a challenging technical deadline or production incident you faced, and how you communicated trade-offs to stakeholders.`,
    topic: 'Leadership & Conflict Resolution',
    category: 'behavioral',
  });

  return { questions: questions.slice(0, numQuestions) };
}

function getDynamicScore(
  question: IQuestion,
  answer: string
): ScoreAnswerResult {
  const trimmed = answer.trim();
  const wordCount = trimmed.split(/\s+/).length;
  
  // Check for technical buzzwords / keywords in candidate answer
  const techKeywords = [
    'architecture', 'service', 'api', 'database', 'cache', 'redis', 'async', 'concurrency',
    'latency', 'scalability', 'react', 'java', 'node', 'express', 'mongodb', 'spring', 'design',
    'metric', 'error', 'testing', 'index', 'queue', 'kafka', 'cluster', 'deployment'
  ];

  let keywordHits = 0;
  for (const kw of techKeywords) {
    if (new RegExp(`\\b${kw}\\b`, 'i').test(trimmed)) {
      keywordHits++;
    }
  }

  let correctness = 5.0;
  let depth = 5.0;
  let clarity = 6.0;

  if (wordCount < 6) {
    // Extremely brief / vague answer
    correctness = Math.min(3.5, wordCount * 0.7);
    depth = 2.0;
    clarity = 4.0;
  } else if (wordCount < 15) {
    correctness = 5.0 + keywordHits * 0.8;
    depth = 4.5 + keywordHits * 0.9;
    clarity = 6.5;
  } else {
    // Substantial detailed answer
    correctness = Math.min(9.5, 6.0 + keywordHits * 0.8);
    depth = Math.min(9.5, 5.5 + wordCount * 0.08 + keywordHits * 0.6);
    clarity = Math.min(9.5, 7.0 + (wordCount > 25 ? 1.0 : 0.5));
  }

  // Cap scores between 0 and 10
  correctness = Number(Math.max(1, Math.min(10, correctness)).toFixed(1));
  depth = Number(Math.max(1, Math.min(10, depth)).toFixed(1));
  clarity = Number(Math.max(1, Math.min(10, clarity)).toFixed(1));
  
  const overall = Number(((correctness * 0.4) + (depth * 0.4) + (clarity * 0.2)).toFixed(1));

  let feedback = '';
  let followUp: string | undefined = undefined;
  let idealAnswerHint = '';

  if (overall < 5.0) {
    feedback = `Your answer to "${question.topic}" was too brief and lacked concrete technical specifics. State your architectural choice clearly.`;
    followUp = `Can you provide a specific example of how you implemented ${question.topic}?`;
    idealAnswerHint = `Top candidates state their concrete design choices, mention error handling, and quantify performance results.`;
  } else if (overall < 7.5) {
    feedback = `Good foundational answer for ${question.topic}. You covered the main concept but could dive deeper into performance trade-offs.`;
    followUp = `How would your solution handle 10x traffic spikes or database connection limits?`;
    idealAnswerHint = `Highlight explicit caching strategies, asynchronous queues, and automated monitoring thresholds.`;
  } else {
    feedback = `Excellent, highly structured response on ${question.topic}. You explained your technical approach and trade-offs clearly.`;
    followUp = `What key telemetry metric would you alert on to detect failures early?`;
    idealAnswerHint = `A top Bar Raiser answer quantifies latency impact, fallback strategies, and automated disaster recovery.`;
  }

  return {
    scores: { correctness, depth, clarity },
    overall,
    feedback,
    followUp,
    idealAnswerHint,
  };
}

// --- Service Implementation ---

export async function parseResumeService(resumeText: string): Promise<ParsedResume> {
  const systemPrompt = `You are an expert technical recruiter analyzing a software engineering candidate's resume text. Extract key technical skills, project details, work experience, and education cleanly.`;

  const userPrompt = `Analyze the following candidate resume text and extract structured information:\n\n${resumeText}`;

  return invokeBedrockJson<ParsedResume>(
    systemPrompt,
    userPrompt,
    ParsedResumeSchema,
    () => getDynamicParsedResume(resumeText)
  );
}

export async function startInterviewService(
  resumeText: string,
  jobDescription: string,
  role: string,
  difficulty: 'easy' | 'medium' | 'hard' = 'medium',
  numQuestions: number = 6
): Promise<{ sessionId: string; plan: { topics: string[] }; firstQuestion: string }> {
  // Cap numQuestions between 3 and 10
  const totalQuestions = Math.min(Math.max(numQuestions, 3), 10);

  // Parse resume first to get structured projects and skills
  const parsedResume = await parseResumeService(resumeText);

  const systemPrompt = `You are a Principal Software Engineering Interviewer conducting a technical interview for the role of ${role} at difficulty level ${difficulty}.
Your task is to generate exactly ${totalQuestions} interview questions based on the candidate's resume and target job description.

Rules for Question Mix:
1. Approximately 60% of questions must be directly grounded in the candidate's own projects and listed skills.
2. Approximately 40% of questions must focus on technical skills required by the job description that appear missing or weak in the resume.
3. EXACTLY ONE question must be a behavioral question (STAR method style).
4. All questions must be spoken-friendly: concise, clear sentences without markdown formatting, bullet symbols, or code blocks.`;

  const userPrompt = `Target Role: ${role}
Difficulty: ${difficulty}
Candidate Parsed Resume: ${JSON.stringify(parsedResume)}
Target Job Description: ${jobDescription}

Generate ${totalQuestions} questions strictly adhering to the JSON schema.`;

  const planResult = await invokeBedrockJson<{ questions: z.infer<typeof QuestionGeneratedSchema>[] }>(
    systemPrompt,
    userPrompt,
    InterviewPlanSchema,
    () => getDynamicPlan(totalQuestions, role, parsedResume, jobDescription)
  );

  const sessionId = uuidv4();
  const session: ISession = {
    sessionId,
    role,
    difficulty,
    numQuestions: totalQuestions,
    resumeText,
    jobDescription,
    parsedResume,
    questions: planResult.questions.map((q, idx) => ({ ...q, index: idx })),
    currentQuestionIndex: 0,
    status: 'in_progress',
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  await saveSession(session);

  const topics = session.questions.map((q) => q.topic);
  const firstQuestion = session.questions[0]?.question || 'Tell me about yourself and your technical background.';

  return {
    sessionId,
    plan: { topics },
    firstQuestion,
  };
}

export async function scoreAnswerService(sessionId: string, answer: string): Promise<ScoreAnswerResult> {
  const session = await getSession(sessionId);
  if (!session) {
    throw new Error(`Session ${sessionId} not found.`);
  }

  const currentQ = session.questions[session.currentQuestionIndex];
  if (!currentQ) {
    throw new Error(`No active question found for session ${sessionId}.`);
  }

  const systemPrompt = `You are a strict Amazon Bar Raiser technical interviewer.
Evaluate the candidate's spoken answer to the question asked.
Question: "${currentQ.question}"
Topic: "${currentQ.topic}"
Category: "${currentQ.category}"
Candidate Resume Excerpt: ${JSON.stringify(session.parsedResume)}
Target Job Description: "${session.jobDescription}"

Scoring Rubric (0 to 10 scale):
- 5 = Acceptable basic answer.
- 8+ = Strong, deep, precise answer with concrete technical details.
- Penalise vague answers, filler words, or answers that evade the question. Do NOT reward length.
- Feedback MUST be short, spoken-friendly (max 2 clear sentences, no markdown, no bullet points).
- Ideal answer hint MUST be 1 concise sentence summarizing what a top candidate would highlight.`;

  const userPrompt = `Candidate Answer: "${answer}"

Provide scoring in strict JSON format.`;

  const scoreResult = await invokeBedrockJson<ScoreAnswerResult>(
    systemPrompt,
    userPrompt,
    ScoreAnswerSchema,
    () => getDynamicScore(currentQ, answer)
  );

  // Save candidate answer and score into session
  currentQ.answer = answer;
  currentQ.score = scoreResult;

  await saveSession(session);
  return scoreResult;
}

export async function nextQuestionService(sessionId: string): Promise<{
  question: string;
  topic: string;
  index: number;
  total: number;
  done: boolean;
}> {
  const session = await getSession(sessionId);
  if (!session) {
    throw new Error(`Session ${sessionId} not found.`);
  }

  session.currentQuestionIndex += 1;
  const nextIdx = session.currentQuestionIndex;
  const total = session.questions.length;

  if (nextIdx >= total) {
    session.status = 'completed';
    await saveSession(session);
    return {
      question: 'Interview completed! Request session report to see your results.',
      topic: 'Completed',
      index: nextIdx,
      total,
      done: true,
    };
  }

  await saveSession(session);
  const q = session.questions[nextIdx];

  return {
    question: q.question,
    topic: q.topic,
    index: nextIdx,
    total,
    done: false,
  };
}

export async function sessionReportService(sessionId: string): Promise<SessionReportResult> {
  const session = await getSession(sessionId);
  if (!session) {
    throw new Error(`Session ${sessionId} not found.`);
  }

  const answeredQuestions = session.questions.filter((q) => q.score !== undefined);

  if (answeredQuestions.length === 0) {
    return {
      overall: 0,
      perTopic: session.questions.map((q) => ({ topic: q.topic, score: 0 })),
      strengths: ['Started interview process'],
      weakTopics: session.questions.map((q) => q.topic),
      practicePlan: [
        'Complete all mock interview questions.',
        'Review core system design principles.',
        'Practice STAR method for behavioral responses.',
      ],
    };
  }

  const overallAvg =
    answeredQuestions.reduce((acc, q) => acc + (q.score?.overall || 0), 0) / answeredQuestions.length;

  const perTopic = answeredQuestions.map((q) => ({
    topic: q.topic,
    score: q.score?.overall || 0,
  }));

  const systemPrompt = `You are a senior hiring manager compiling a final technical interview feedback report.
Summarize overall strengths, weak topics, and create a 3 to 5 bullet point concrete practice plan based on the candidate's performance.`;

  const userPrompt = `Candidate Role: ${session.role}
Answer Summaries and Scores: ${JSON.stringify(
    answeredQuestions.map((q) => ({
      topic: q.topic,
      question: q.question,
      answer: q.answer,
      score: q.score,
    }))
  )}`;

  return invokeBedrockJson<SessionReportResult>(
    systemPrompt,
    userPrompt,
    SessionReportSchema,
    () => {
      const sorted = [...perTopic].sort((a, b) => b.score - a.score);
      const strengths = sorted.filter((t) => t.score >= 6.5).map((t) => t.topic);
      const weakTopics = sorted.filter((t) => t.score < 6.5).map((t) => t.topic);

      const weakList = weakTopics.length ? weakTopics : ['System Bottlenecks & Edge Cases'];
      const practicePlan = weakList.map(
        (t) => `Practice deep dive into ${t} trade-offs, error recovery, and performance telemetry.`
      );

      return {
        overall: Number(overallAvg.toFixed(1)),
        perTopic,
        strengths: strengths.length ? strengths : [perTopic[0]?.topic || 'Technical Fundamentals'],
        weakTopics: weakList,
        practicePlan: practicePlan.length >= 3 ? practicePlan.slice(0, 5) : [
          ...practicePlan,
          'Review STAR method structure for behavioral leadership questions.',
          'Practice explaining 60-second system architecture trade-offs under pressure.'
        ],
      };
    }
  );
}
