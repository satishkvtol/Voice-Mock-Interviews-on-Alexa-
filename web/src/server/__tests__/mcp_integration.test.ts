import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import express from 'express';
import cors from 'cors';
import { Server } from 'http';
import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { SSEClientTransport } from '@modelcontextprotocol/sdk/client/sse.js';
import { setupMcpRoutes } from '../mcp/server.js';

describe('MCP Server Integration Test (SSE / Streamable HTTP)', () => {
  let server: Server;
  let serverUrl: string;
  let mcpClient: Client;
  let transport: SSEClientTransport;

  beforeAll(async () => {
    process.env.MOCK_LLM = 'true';

    const app = express();
    app.use(cors());
    app.use(express.json());
    setupMcpRoutes(app);

    await new Promise<void>((resolve) => {
      server = app.listen(0, () => {
        const addr = server.address();
        if (typeof addr === 'object' && addr) {
          serverUrl = `http://localhost:${addr.port}/mcp`;
        }
        resolve();
      });
    });

    // Initialize MCP Client
    transport = new SSEClientTransport(new URL(serverUrl));
    mcpClient = new Client(
      {
        name: 'IntegrationTestClient',
        version: '1.0.0',
      },
      {
        capabilities: {},
      }
    );

    await mcpClient.connect(transport);
  });

  afterAll(async () => {
    if (mcpClient) {
      await mcpClient.close();
    }
    if (server) {
      server.close();
    }
  });

  it('should list all registered MCP tools', async () => {
    const response = await mcpClient.listTools();
    const toolNames = response.tools.map((t) => t.name);

    expect(toolNames).toContain('parse_resume');
    expect(toolNames).toContain('start_interview');
    expect(toolNames).toContain('next_question');
    expect(toolNames).toContain('score_answer');
    expect(toolNames).toContain('session_report');
  });

  it('should execute parse_resume via MCP client', async () => {
    const result: any = await mcpClient.callTool({
      name: 'parse_resume',
      arguments: {
        resumeText: 'Jane Developer. Skilled in React, Node, Express, TypeScript, Bedrock.',
      },
    });

    expect(result.content).toBeDefined();
    expect(result.structuredContent).toBeDefined();
    expect(result.structuredContent.skills).toContain('TypeScript');
  });

  it('should execute start_interview and next_question via MCP client', async () => {
    const startResult: any = await mcpClient.callTool({
      name: 'start_interview',
      arguments: {
        resumeText: 'Jane Developer. Skilled in React, Node, Express, TypeScript, Bedrock.',
        jobDescription: 'Software Engineer with AWS & Bedrock experience.',
        role: 'Full Stack Engineer',
        difficulty: 'medium',
        numQuestions: 4,
      },
    });

    const sessionId = startResult.structuredContent.sessionId;
    expect(sessionId).toBeDefined();

    const scoreResult: any = await mcpClient.callTool({
      name: 'score_answer',
      arguments: {
        sessionId,
        answer: 'I used TypeScript and Node.js for backend microservices.',
      },
    });

    expect(scoreResult.structuredContent.overall).toBeDefined();

    const reportResult: any = await mcpClient.callTool({
      name: 'session_report',
      arguments: { sessionId },
    });

    expect(reportResult.structuredContent.practicePlan.length).toBeGreaterThan(0);
  });
});
