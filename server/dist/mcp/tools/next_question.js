import { z } from 'zod';
import { nextQuestionService } from '../../services/interview.js';
import { logger } from '../../utils/logger.js';
export const nextQuestionInputSchema = {
    sessionId: z.string().uuid('Session ID must be a valid UUID.'),
};
export async function nextQuestionHandler(args) {
    try {
        const result = await nextQuestionService(args.sessionId);
        const summaryText = result.done
            ? 'Interview completed.'
            : `Question ${result.index + 1} of ${result.total} (${result.topic}): "${result.question}"`;
        return {
            content: [
                {
                    type: 'text',
                    text: summaryText,
                },
            ],
            structuredContent: result,
        };
    }
    catch (error) {
        logger.error('Failed to get next question in MCP tool', { error: error.message });
        return {
            isError: true,
            content: [
                {
                    type: 'text',
                    text: `Error getting next question: ${error.message}`,
                },
            ],
        };
    }
}
