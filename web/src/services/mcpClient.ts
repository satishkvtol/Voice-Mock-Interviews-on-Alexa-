/// <reference types="vite/client" />
import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { SSEClientTransport } from '@modelcontextprotocol/sdk/client/sse.js';

const MCP_SERVER_URL = (import.meta as any).env?.VITE_MCP_SERVER_URL || 'http://localhost:3001/mcp';

let clientInstance: Client | null = null;
let transportInstance: SSEClientTransport | null = null;

export async function getMcpClient(): Promise<Client> {
  if (clientInstance) {
    return clientInstance;
  }

  const transportUrl = new URL(MCP_SERVER_URL);
  transportInstance = new SSEClientTransport(transportUrl);

  clientInstance = new Client(
    {
      name: 'InterviewDojoAlexaSimulator',
      version: '1.0.0',
    },
    {
      capabilities: {},
    }
  );

  await clientInstance.connect(transportInstance);
  return clientInstance;
}

export async function resetMcpClient() {
  if (clientInstance) {
    try {
      await clientInstance.close();
    } catch {
      // ignore close errors
    }
  }
  clientInstance = null;
  transportInstance = null;
}

// Tool Call Wrappers
export async function mcpParseResume(resumeText: string) {
  const client = await getMcpClient();
  const res: any = await client.callTool({
    name: 'parse_resume',
    arguments: { resumeText },
  });
  if (res.isError) throw new Error(res.content?.[0]?.text || 'Error parsing resume');
  return res.structuredContent;
}

export async function mcpStartInterview(
  resumeText: string,
  jobDescription: string,
  role: string,
  difficulty: 'easy' | 'medium' | 'hard',
  numQuestions: number
) {
  const client = await getMcpClient();
  const res: any = await client.callTool({
    name: 'start_interview',
    arguments: { resumeText, jobDescription, role, difficulty, numQuestions },
  });
  if (res.isError) throw new Error(res.content?.[0]?.text || 'Error starting interview');
  return res.structuredContent;
}

export async function mcpNextQuestion(sessionId: string) {
  const client = await getMcpClient();
  const res: any = await client.callTool({
    name: 'next_question',
    arguments: { sessionId },
  });
  if (res.isError) throw new Error(res.content?.[0]?.text || 'Error fetching next question');
  return res.structuredContent;
}

export async function mcpScoreAnswer(sessionId: string, answer: string) {
  const client = await getMcpClient();
  const res: any = await client.callTool({
    name: 'score_answer',
    arguments: { sessionId, answer },
  });
  if (res.isError) throw new Error(res.content?.[0]?.text || 'Error scoring answer');
  return res.structuredContent;
}

export async function mcpSessionReport(sessionId: string) {
  const client = await getMcpClient();
  const res: any = await client.callTool({
    name: 'session_report',
    arguments: { sessionId },
  });
  if (res.isError) throw new Error(res.content?.[0]?.text || 'Error fetching report');
  return res.structuredContent;
}
