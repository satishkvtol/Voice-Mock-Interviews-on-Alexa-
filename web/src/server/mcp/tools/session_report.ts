import { z } from 'zod';
import { sessionReportService } from '../../services/interview.js';
import { logger } from '../../utils/logger.js';

export const sessionReportInputSchema = {
  sessionId: z.string().uuid('Session ID must be a valid UUID.'),
};

export async function sessionReportHandler(args: { sessionId: string }) {
  try {
    const result = await sessionReportService(args.sessionId);
    const summaryText = `Session Report: Overall Score ${result.overall}/10. Practice items: ${result.practicePlan.length}.`;

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
    logger.error('Failed to generate session report in MCP tool', { error: error.message });
    return {
      isError: true,
      content: [
        {
          type: 'text' as const,
          text: `Error generating session report: ${error.message}`,
        },
      ],
    };
  }
}
