import { z } from 'zod';

export const pingToolSchema = {
  message: z.string().optional().describe('Optional message to echo back'),
};

export const pingToolHandler = async (args: { message?: string }) => {
  const reply = args.message ? `Pong: ${args.message}` : 'Pong!';
  return {
    content: [
      {
        type: 'text' as const,
        text: reply,
      },
    ],
    structuredContent: {
      status: 'ok',
      reply,
      timestamp: new Date().toISOString(),
    },
  };
};
