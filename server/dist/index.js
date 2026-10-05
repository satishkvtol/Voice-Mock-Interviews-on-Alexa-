import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import rateLimit from 'express-rate-limit';
import { logger } from './utils/logger.js';
import { setupMcpRoutes } from './mcp/server.js';
dotenv.config();
const app = express();
const PORT = process.env.PORT || 3001;
const ALLOWED_ORIGIN = process.env.ALLOWED_ORIGIN || 'http://localhost:5173';
// Rate Limiter: Limit to 100 requests per 15 minutes per IP
const limiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 100,
    standardHeaders: true,
    legacyHeaders: false,
    message: { error: 'Too many requests, please try again later.' },
});
// Middleware
app.use(limiter);
app.use(cors({
    origin: (origin, callback) => {
        // Allow requests with no origin (like mobile apps or curl) or any localhost origin in dev
        if (!origin || origin.startsWith('http://localhost:') || origin.startsWith('http://127.0.0.1:')) {
            callback(null, true);
        }
        else {
            callback(null, origin === ALLOWED_ORIGIN);
        }
    },
    credentials: true,
}));
app.use(express.json({ limit: '2mb' }));
// Health Check Endpoint
app.get('/health', (_req, res) => {
    res.json({
        status: 'ok',
        service: 'InterviewDojo MCP Server',
        timestamp: new Date().toISOString(),
        env: process.env.NODE_ENV || 'development',
        mockLlm: process.env.MOCK_LLM === 'true',
    });
});
// Setup MCP Routes
setupMcpRoutes(app);
// Start Express Server
const server = app.listen(PORT, () => {
    logger.info(`InterviewDojo MCP Server running on port ${PORT}`);
    logger.info(`Allowed CORS origin: ${ALLOWED_ORIGIN}`);
});
// Graceful Shutdown Handler
const handleShutdown = (signal) => {
    logger.info(`Received ${signal}. Shutting down gracefully...`);
    server.close(() => {
        logger.info('HTTP server closed.');
        process.exit(0);
    });
};
process.on('SIGTERM', () => handleShutdown('SIGTERM'));
process.on('SIGINT', () => handleShutdown('SIGINT'));
export { app, server };
