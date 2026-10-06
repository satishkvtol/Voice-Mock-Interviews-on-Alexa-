import { z } from 'zod';
import { startInterviewService } from '../../services/interview.js';
import { logger } from '../../utils/logger.js';

export const startInterviewInputSchema = {
  resumeText: z.string().min(10, 'Resume text must be at least 10 characters long.'),
  jobDescription: z.string().min(10, 'Job description must be at least 10 characters long.'),
  role: z.string().min(2, 'Role must be specified (e.g. Full Stack Engineer).'),
  difficulty: z.enum(['easy', 'medium', 'hard']).default('medium'),
  numQuestions: z.number().min(3).max(10).default(6),
};

export async function startInterviewHandler(args: {
  resumeText: string;
  jobDescription: string;
  role: string;
  difficulty: 'easy' | 'medium' | 'hard';
  numQuestions: number;
}) {
  try {
    const result = await startInterviewService(
      args.resumeText,
      args.jobDescription,
      args.role,
      args.difficulty,
      args.numQuestions
    );

    const summaryText = `Interview session created with ID ${result.sessionId}. Total topics: ${result.plan.topics.length}. First question: "${result.firstQuestion}"`;

    return {
      content: [
        {
          type: 'text' as const,
          text: summaryText,
        },
      ],
      structuredContent: result,
    };
  } catch (error: any) {
    logger.error('Failed to start interview session in MCP tool', { error: error.message });
    return {
      isError: true,
      content: [
        {
          type: 'text' as const,
          text: `Error starting interview: ${error.message}`,
        },
      ],
    };
  }
}
