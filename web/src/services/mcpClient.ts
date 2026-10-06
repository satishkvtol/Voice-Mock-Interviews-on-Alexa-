/// <reference types="vite/client" />
import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { SSEClientTransport } from '@modelcontextprotocol/sdk/client/sse.js';

function getMcpServerUrl(): string {
  if ((import.meta as any).env?.VITE_MCP_SERVER_URL) {
    return (import.meta as any).env.VITE_MCP_SERVER_URL;
  }
  // In production (Vercel), use relative serverless endpoint /api/mcp
  if (typeof window !== 'undefined' && window.location.hostname !== 'localhost' && window.location.hostname !== '127.0.0.1') {
    return `${window.location.origin}/api/mcp`;
  }
  return 'http://localhost:3001/mcp';
}

let clientInstance: Client | null = null;
let transportInstance: SSEClientTransport | null = null;

export async function getMcpClient(): Promise<Client> {
  if (clientInstance) {
    return clientInstance;
  }

  const serverUrl = getMcpServerUrl();
  const transportUrl = new URL(serverUrl);

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

// Resilient Tool Execution Engine (Direct RPC on Vercel + SSE Client Fallback)
async function callMcpTool(name: string, args: Record<string, any>): Promise<any> {
  // If in production (Vercel) or window location is remote, use direct HTTP RPC for 100% reliability
  if (typeof window !== 'undefined' && window.location.hostname !== 'localhost' && window.location.hostname !== '127.0.0.1') {
    try {
      const response = await fetch(`${window.location.origin}/api/mcp/rpc`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tool: name, arguments: args }),
      });
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${await response.text()}`);
      }
      const res = await response.json();
      if (res.isError) throw new Error(res.content?.[0]?.text || `Error executing ${name}`);
      return res.structuredContent;
    } catch (err: any) {
      console.warn('Direct HTTP tool call failed, attempting SSE MCP client fallback:', err);
    }
  }

  // Local Dev / Standard SSE Connection
  try {
    const client = await getMcpClient();
    const res: any = await client.callTool({
      name,
      arguments: args,
    });
    if (res.isError) throw new Error(res.content?.[0]?.text || `Error executing ${name}`);
    return res.structuredContent;
  } catch (err: any) {
    // Ultimate safety net: HTTP POST fallback to /api/mcp/rpc
    try {
      const response = await fetch(`${window.location.origin}/api/mcp/rpc`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tool: name, arguments: args }),
      });
      if (!response.ok) throw new Error(`MCP execution failed: ${err.message}`);
      const res = await response.json();
      if (res.isError) throw new Error(res.content?.[0]?.text || `Error executing ${name}`);
      return res.structuredContent;
    } catch (fallbackErr: any) {
      throw new Error(`MCP Tool Error: ${err.message || fallbackErr.message}`);
    }
  }
}

// Tool Call Wrappers
export async function mcpParseResume(resumeText: string) {
  return callMcpTool('parse_resume', { resumeText });
}

export async function mcpStartInterview(
  resumeText: string,
  jobDescription: string,
  role: string,
  difficulty: 'easy' | 'medium' | 'hard',
  numQuestions: number
) {
  return callMcpTool('start_interview', { resumeText, jobDescription, role, difficulty, numQuestions });
}

export async function mcpNextQuestion(sessionId: string) {
  return callMcpTool('next_question', { sessionId });
}

export async function mcpScoreAnswer(sessionId: string, answer: string) {
  return callMcpTool('score_answer', { sessionId, answer });
}

export async function mcpSessionReport(sessionId: string) {
  return callMcpTool('session_report', { sessionId });
}
