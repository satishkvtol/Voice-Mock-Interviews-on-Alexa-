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

// --- Helper Mock Generator functions for offline testing ---

function getMockParsedResume(resumeText: string): ParsedResume {
  return {
    skills: ['TypeScript', 'React', 'Node.js', 'Express', 'MongoDB', 'AWS Bedrock'],
    projects: [
      {
        name: 'InterviewDojo MCP Server',
        summary: 'Voice-based mock interview platform using Amazon Bedrock Converse API and MCP protocol.',
        tech: ['TypeScript', 'Express', 'MCP SDK', 'Amazon Bedrock'],
      },
    ],
    experience: [
      {
        role: 'Full Stack Engineer Intern',
        org: 'Tech Innovators Inc',
        highlights: ['Built real-time web applications with React and Node.js.'],
      },
    ],
    education: 'B.S. in Computer Science',
  };
}

function getMockPlan(numQuestions: number, role: string): { questions: z.infer<typeof QuestionGeneratedSchema>[] } {
  const mockQuestions: z.infer<typeof QuestionGeneratedSchema>[] = [
    {
      index: 0,
      question: `Can you explain how you designed the architecture for your InterviewDojo MCP project?`,
      topic: 'InterviewDojo Project',
      category: 'project',
    },
    {
      index: 1,
      question: `How do you handle asynchronous state management and real-time streams in React?`,
      topic: 'React & State Management',
      category: 'project',
    },
    {
      index: 2,
      question: `What experience do you have with AWS Bedrock Converse API and prompt engineering?`,
      topic: 'AWS Bedrock LLMs',
      category: 'skill_gap',
    },
    {
      index: 3,
      question: `Describe how you approach optimizing MongoDB queries for high-concurrency microservices.`,
      topic: 'MongoDB Optimization',
      category: 'skill_gap',
    },
    {
      index: 4,
      question: `Tell me about a time when you encountered a major production bug and how you resolved it under pressure.`,
      topic: 'Troubleshooting & Pressure',
      category: 'behavioral',
    },
  ];

  return { questions: mockQuestions.slice(0, numQuestions) };
}

// --- Service Implementation ---

export async function parseResumeService(resumeText: string): Promise<ParsedResume> {
  const systemPrompt = `You are an expert technical recruiter analyzing a software engineering candidate's resume text. Extract key technical skills, project details, work experience, and education cleanly.`;

  const userPrompt = `Analyze the following candidate resume text and extract structured information:\n\n${resumeText}`;

  return invokeBedrockJson<ParsedResume>(
    systemPrompt,
    userPrompt,
    ParsedResumeSchema,
    () => getMockParsedResume(resumeText)
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
    () => getMockPlan(totalQuestions, role)
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
    () => ({
      scores: { correctness: 8, depth: 7, clarity: 8 },
      overall: 7.7,
      feedback: 'Good overview of your architecture. You explained the main tradeoffs clearly.',
      followUp: 'Could you elaborate on how you handled error recovery when Bedrock APIs rate limited?',
      idealAnswerHint: 'A strong response highlights explicit fallback mechanisms and asynchronous queue retry patterns.',
    })
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
      const strengths = sorted.filter((t) => t.score >= 7).map((t) => t.topic);
      const weakTopics = sorted.filter((t) => t.score < 7).map((t) => t.topic);

      return {
        overall: Number(overallAvg.toFixed(1)),
        perTopic,
        strengths: strengths.length ? strengths : ['Basic domain understanding'],
        weakTopics: weakTopics.length ? weakTopics : ['Deep technical trade-offs'],
        practicePlan: [
          'Practice explaining complex system design trade-offs in 60 seconds.',
          'Review AWS Bedrock Converse API request formatting and retry strategies.',
          'Prepare structured STAR-format stories for leadership and pressure scenarios.',
        ],
      };
    }
  );
}
