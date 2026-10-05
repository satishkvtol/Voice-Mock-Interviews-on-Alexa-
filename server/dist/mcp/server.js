import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { SSEServerTransport } from '@modelcontextprotocol/sdk/server/sse.js';
import { logger } from '../utils/logger.js';
import { pingToolSchema, pingToolHandler } from './tools/ping.js';
// Map active SSE transports by sessionId
const activeTransports = new Map();
export function createInterviewDojoMcpServer() {
    const server = new McpServer({
        name: 'InterviewDojo',
        version: '1.0.0',
    }, {
        capabilities: {
            tools: {},
        },
    });
    // Register temporary ping tool for Phase 1
    server.tool('ping', 'Health check / connectivity ping tool for MCP clients', pingToolSchema, async (args) => {
        logger.info('Ping tool executed', { args });
        return pingToolHandler(args);
    });
    return server;
}
export function setupMcpRoutes(app) {
    const mcpServer = createInterviewDojoMcpServer();
    // GET /mcp - Establish SSE Connection (Streamable HTTP / SSE transport)
    app.get('/mcp', async (req, res) => {
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
    app.post('/mcp/messages', async (req, res) => {
        const sessionId = req.query.sessionId;
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
