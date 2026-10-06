import express, { Request, Response } from 'express';
import cors from 'cors';
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { SSEServerTransport } from '@modelcontextprotocol/sdk/server/sse.js';
import { parseResumeInputSchema, parseResumeHandler } from '../src/server/mcp/tools/parse_resume.js';
import { startInterviewInputSchema, startInterviewHandler } from '../src/server/mcp/tools/start_interview.js';
import { nextQuestionInputSchema, nextQuestionHandler } from '../src/server/mcp/tools/next_question.js';
import { scoreAnswerInputSchema, scoreAnswerHandler } from '../src/server/mcp/tools/score_answer.js';
import { sessionReportInputSchema, sessionReportHandler } from '../src/server/mcp/tools/session_report.js';
import { initStorage } from '../src/server/services/storage.js';

const app = express();
app.use(cors({ origin: '*', credentials: true }));
app.use(express.json({ limit: '2mb' }));

initStorage();

const activeTransports = new Map<string, SSEServerTransport>();

function createInterviewDojoMcpServer(): McpServer {
  const server = new McpServer(
    { name: 'InterviewDojo', version: '1.0.0' },
    { capabilities: { tools: {} } }
  );

  server.tool(
    'parse_resume',
    'Extract skills, projects, experience, and education from candidate resume text',
    parseResumeInputSchema,
    async (args) => parseResumeHandler(args as any)
  );

  server.tool(
    'start_interview',
    'Initialize a mock interview session and generate interview plan based on resume and job description',
    startInterviewInputSchema,
    async (args) => startInterviewHandler(args as any)
  );

  server.tool(
    'next_question',
    'Fetch the next question in the interview sequence for the active session',
    nextQuestionInputSchema,
    async (args) => nextQuestionHandler(args as any)
  );

  server.tool(
    'score_answer',
    'Evaluate candidate answer using LLM Bar Raiser rubric and generate feedback',
    scoreAnswerInputSchema,
    async (args) => scoreAnswerHandler(args as any)
  );

  server.tool(
    'session_report',
    'Generate comprehensive final report with strengths, weak topics, and 3-5 item practice plan',
    sessionReportInputSchema,
    async (args) => sessionReportHandler(args as any)
  );

  return server;
}

app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', service: 'InterviewDojo Vercel Serverless MCP' });
});

app.get('/api/mcp', async (req: Request, res: Response) => {
  const transport = new SSEServerTransport('/api/mcp/messages', res);
  activeTransports.set(transport.sessionId, transport);

  const mcpServer = createInterviewDojoMcpServer();

  req.on('close', () => {
    activeTransports.delete(transport.sessionId);
  });

  await mcpServer.connect(transport);
});

app.post('/api/mcp/messages', async (req: Request, res: Response) => {
  const sessionId = req.query.sessionId as string;
  if (!sessionId) {
    res.status(400).send('Missing sessionId query parameter');
    return;
  }

  const transport = activeTransports.get(sessionId);
  if (!transport) {
    res.status(404).send('Session not found');
    return;
  }

  await transport.handlePostMessage(req, res, req.body);
});

app.post('/api/mcp/rpc', async (req: Request, res: Response) => {
  try {
    const { method, params, tool, arguments: toolArgs } = req.body || {};
    const toolName = tool || params?.name;
    const args = toolArgs || params?.arguments || {};

    let result: any;
    if (toolName === 'parse_resume') {
      result = await parseResumeHandler(args);
    } else if (toolName === 'start_interview') {
      result = await startInterviewHandler(args);
    } else if (toolName === 'next_question') {
      result = await nextQuestionHandler(args);
    } else if (toolName === 'score_answer') {
      result = await scoreAnswerHandler(args);
    } else if (toolName === 'session_report') {
      result = await sessionReportHandler(args);
    } else {
      res.status(400).json({ isError: true, content: [{ type: 'text', text: `Unknown tool: ${toolName}` }] });
      return;
    }

    if (method === 'tools/call') {
      res.json({
        jsonrpc: '2.0',
        id: req.body.id || 1,
        result: result,
      });
    } else {
      res.json(result);
    }
  } catch (error: any) {
    res.status(500).json({ isError: true, content: [{ type: 'text', text: error.message || 'Internal Server Error' }] });
  }
});

export default app;
