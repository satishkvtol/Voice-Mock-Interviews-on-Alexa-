import { describe, it, expect, beforeAll } from 'vitest';
import {
  parseResumeService,
  startInterviewService,
  scoreAnswerService,
  nextQuestionService,
  sessionReportService,
} from '../services/interview.js';

describe('InterviewDojo Unit Tests (MOCK_LLM)', () => {
  beforeAll(() => {
    process.env.MOCK_LLM = 'true';
  });

  const sampleResume = `
    Jane Doe - Full Stack Developer
    Skills: TypeScript, React, Express, Node.js, MongoDB, AWS Bedrock
    Experience: Software Engineer Intern at Acme Corp. Built REST APIs and microservices.
    Education: B.S. in Computer Science
  `;

  const sampleJob = `
    Looking for a Senior Full Stack Engineer proficient in React, Node.js, TypeScript, and AWS Bedrock.
    Responsibilities include building AI-assisted web apps and scalable microservices.
  `;

  it('should parse resume text into structured content', async () => {
    const parsed = await parseResumeService(sampleResume);
    expect(parsed.skills).toBeInstanceOf(Array);
    expect(parsed.skills.length).toBeGreaterThan(0);
    expect(parsed.projects).toBeInstanceOf(Array);
  });

  it('should start an interview session and generate questions', async () => {
    const sessionData = await startInterviewService(
      sampleResume,
      sampleJob,
      'Full Stack Engineer',
      'medium',
      5
    );

    expect(sessionData.sessionId).toBeDefined();
    expect(sessionData.plan.topics.length).toBe(5);
    expect(sessionData.firstQuestion).toBeDefined();
  });

  it('should score an answer within valid score bounds (0-10)', async () => {
    const sessionData = await startInterviewService(
      sampleResume,
      sampleJob,
      'Full Stack Engineer',
      'medium',
      5
    );

    const scoreResult = await scoreAnswerService(
      sessionData.sessionId,
      'I designed the system using Express and MCP SDK over Streamable HTTP transport.'
    );

    expect(scoreResult.overall).toBeGreaterThanOrEqual(0);
    expect(scoreResult.overall).toBeLessThanOrEqual(10);
    expect(scoreResult.scores.correctness).toBeGreaterThanOrEqual(0);
    expect(scoreResult.scores.correctness).toBeLessThanOrEqual(10);
    expect(scoreResult.feedback).toBeDefined();
    expect(scoreResult.idealAnswerHint).toBeDefined();
  });

  it('should navigate next questions and generate a session report', async () => {
    const sessionData = await startInterviewService(
      sampleResume,
      sampleJob,
      'Full Stack Engineer',
      'medium',
      3
    );

    await scoreAnswerService(sessionData.sessionId, 'Sample answer 1');
    const next1 = await nextQuestionService(sessionData.sessionId);
    expect(next1.index).toBe(1);

    await scoreAnswerService(sessionData.sessionId, 'Sample answer 2');
    const next2 = await nextQuestionService(sessionData.sessionId);
    expect(next2.index).toBe(2);

    await scoreAnswerService(sessionData.sessionId, 'Sample answer 3');
    const report = await sessionReportService(sessionData.sessionId);

    expect(report.overall).toBeGreaterThanOrEqual(0);
    expect(report.strengths).toBeInstanceOf(Array);
    expect(report.weakTopics).toBeInstanceOf(Array);
    expect(report.practicePlan.length).toBeGreaterThanOrEqual(3);
  });
});
