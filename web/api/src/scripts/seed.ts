import dotenv from 'dotenv';
import {
  startInterviewService,
  scoreAnswerService,
  nextQuestionService,
  sessionReportService,
} from '../services/interview.js';
import { logger } from '../utils/logger.js';
import { initStorage } from '../services/storage.js';

dotenv.config();

// Ensure mock mode for deterministic fast execution if desired
if (!process.env.AWS_ACCESS_KEY_ID && !process.env.AWS_SECRET_ACCESS_KEY) {
  process.env.MOCK_LLM = 'true';
}

const SEED_RESUME = `
Alex Rivera - Senior Full Stack Engineer
Skills: TypeScript, React, Node.js, Express, MongoDB, AWS Bedrock, MCP Protocol, System Design
Projects:
1. InterviewDojo: Created a self-hosted Model Context Protocol (MCP) server delivering real-time voice technical mock interviews powered by Amazon Bedrock Converse API.
2. Distributed Cache Layer: Designed high-throughput microservice cache using Redis and Node.js handling 50k ops/sec.
Experience: Full Stack Engineer Intern at CloudScale Systems. Optimized database queries and built React interfaces.
Education: B.S. in Computer Science, State University.
`;

const SEED_JOB_DESCRIPTION = `
Role: Senior Full Stack Engineer (Alexa AI & Agentic Systems)
Requirements:
- Strong experience in TypeScript, React, Node.js, and Express.
- Deep understanding of Model Context Protocol (MCP) and agentic workflows.
- Hands-on experience with AWS Bedrock Converse API.
- Proficiency in MongoDB schema design and query optimization.
`;

async function runDemoSeed() {
  console.log('\n======================================================');
  console.log('🥋 RUNNING INTERVIEW DOJO 2-MINUTE DEMO SEED SCRIPT 🥋');
  console.log('======================================================\n');

  await initStorage();

  // Step 1: Start Interview
  console.log('🔹 1. Creating Mock Interview Session via start_interview tool...');
  const session = await startInterviewService(
    SEED_RESUME,
    SEED_JOB_DESCRIPTION,
    'Senior Full Stack Engineer',
    'medium',
    3
  );

  console.log(`✅ Session Created! ID: ${session.sessionId}`);
  console.log(`📋 Interview Topics Blueprint:`, session.plan.topics);
  console.log(`🗣️ First Question: "${session.firstQuestion}"\n`);

  // Simulated Candidate Answers
  const candidateAnswers = [
    'I architected InterviewDojo as an Express server hosting the MCP endpoint over Streamable HTTP SSE transport. I used Bedrock Converse API with strict Zod validation for JSON responses.',
    'For MongoDB, I index frequently queried fields like sessionId and use lean queries to minimize object instantiation overhead.',
    'During a production memory leak, I analyzed heap dumps using Chrome DevTools, identified an unclosed SSE transport connection map, and added cleanup handlers on request close.',
  ];

  for (let i = 0; i < candidateAnswers.length; i++) {
    console.log(`------------------------------------------------------`);
    console.log(`❓ Question ${i + 1}:`);
    const answerText = candidateAnswers[i];
    console.log(`🗣️ Candidate Answer: "${answerText}"`);

    console.log(`⚡ Scoring answer with Amazon Bar Raiser rubric...`);
    const score = await scoreAnswerService(session.sessionId, answerText);
    console.log(`📊 Score: ${score.overall}/10 (Correctness: ${score.scores.correctness}, Depth: ${score.scores.depth}, Clarity: ${score.scores.clarity})`);
    console.log(`💬 Spoken Feedback: "${score.feedback}"`);
    console.log(`💡 Ideal Answer Hint: "${score.idealAnswerHint}"`);

    const nextQ = await nextQuestionService(session.sessionId);
    if (!nextQ.done) {
      console.log(`➡️ Next Question (${nextQ.topic}): "${nextQ.question}"\n`);
    } else {
      console.log(`🎉 Interview complete!\n`);
    }
  }

  // Step 3: Session Report
  console.log('======================================================');
  console.log('📊 GENERATING FINAL SESSION REPORT...');
  console.log('======================================================');
  const report = await sessionReportService(session.sessionId);

  console.log(`\n🏆 Overall Candidate Score: ${report.overall}/10`);
  console.log(`⭐ Strengths:`, report.strengths);
  console.log(`⚠️ Weak Topics:`, report.weakTopics);
  console.log(`🎯 Concrete 3-Step Practice Plan:`);
  report.practicePlan.forEach((step, idx) => {
    console.log(`   ${idx + 1}. ${step}`);
  });

  console.log('\n✅ Demo Seed Script Executed Successfully in < 2 Minutes!\n');
  process.exit(0);
}

runDemoSeed().catch((err) => {
  console.error('❌ Seed script error:', err);
  process.exit(1);
});
