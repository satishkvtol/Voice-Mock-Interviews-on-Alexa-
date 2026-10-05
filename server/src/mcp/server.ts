import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { SSEServerTransport } from '@modelcontextprotocol/sdk/server/sse.js';
import { Request, Response } from 'express';
import { logger } from '../utils/logger.js';
import { parseResumeInputSchema, parseResumeHandler } from './tools/parse_resume.js';
import { startInterviewInputSchema, startInterviewHandler } from './tools/start_interview.js';
import { nextQuestionInputSchema, nextQuestionHandler } from './tools/next_question.js';
import { scoreAnswerInputSchema, scoreAnswerHandler } from './tools/score_answer.js';
import { sessionReportInputSchema, sessionReportHandler } from './tools/session_report.js';
import { initStorage } from '../services/storage.js';

// Map active SSE transports by sessionId
const activeTransports = new Map<string, SSEServerTransport>();

export function createInterviewDojoMcpServer(): McpServer {
  const server = new McpServer(
    {
      name: 'InterviewDojo',
      version: '1.0.0',
    },
    {
      capabilities: {
        tools: {},
      },
    }
  );

  // 1. parse_resume tool
  server.tool(
    'parse_resume',
    'Extract skills, projects, experience, and education from candidate resume text',
    parseResumeInputSchema,
    async (args) => {
      logger.info('Executing parse_resume tool');
      return parseResumeHandler(args as any);
    }
  );

  // 2. start_interview tool
  server.tool(
    'start_interview',
    'Initialize a mock interview session and generate interview plan based on resume and job description',
    startInterviewInputSchema,
    async (args) => {
      logger.info('Executing start_interview tool', { role: args.role, difficulty: args.difficulty });
      return startInterviewHandler(args as any);
    }
  );

  // 3. next_question tool
  server.tool(
    'next_question',
    'Fetch the next question in the interview sequence for the active session',
    nextQuestionInputSchema,
    async (args) => {
      logger.info('Executing next_question tool', { sessionId: args.sessionId });
      return nextQuestionHandler(args as any);
    }
  );

  // 4. score_answer tool
  server.tool(
    'score_answer',
    'Evaluate candidate answer using LLM Bar Raiser rubric and generate feedback',
    scoreAnswerInputSchema,
    async (args) => {
      logger.info('Executing score_answer tool', { sessionId: args.sessionId });
      return scoreAnswerHandler(args as any);
    }
  );

  // 5. session_report tool
  server.tool(
    'session_report',
    'Generate comprehensive final report with strengths, weak topics, and 3-5 item practice plan',
    sessionReportInputSchema,
    async (args) => {
      logger.info('Executing session_report tool', { sessionId: args.sessionId });
      return sessionReportHandler(args as any);
    }
  );

  return server;
}

export function setupMcpRoutes(app: any) {
  // Initialize storage (MongoDB or in-memory fallback)
  initStorage();

  const mcpServer = createInterviewDojoMcpServer();

  // GET /mcp - Establish SSE Connection (Streamable HTTP / SSE transport)
  app.get('/mcp', async (req: Request, res: Response) => {
    logger.info('Establishing MCP SSE transport connection');
    const transport = new SSEServerTransport('/mcp/messages', res);

    activeTransports.set(transport.sessionId, transport);

    req.on('close', () => {
      logger.info('MCP SSE transport closed', { sessionId: transport.sessionId });
      activeTransports.delete(transport.sessionId);
    });

    await mcpServer.connect(transport);
  });

  // POST /mcp/messages - Handle client messages
  app.post('/mcp/messages', async (req: Request, res: Response) => {
    const sessionId = req.query.sessionId as string;
    if (!sessionId) {
      res.status(400).send('Missing sessionId query parameter');
      return;
    }

    const transport = activeTransports.get(sessionId);
    if (!transport) {
      res.status(404).send('Session not found or connection closed');
      return;
    }

    await transport.handlePostMessage(req, res, req.body);
  });
}
