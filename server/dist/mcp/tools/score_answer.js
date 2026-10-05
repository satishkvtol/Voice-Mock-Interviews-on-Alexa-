import { z } from 'zod';
import { scoreAnswerService } from '../../services/interview.js';
import { logger } from '../../utils/logger.js';
export const scoreAnswerInputSchema = {
    sessionId: z.string().uuid('Session ID must be a valid UUID.'),
    answer: z.string().min(2, 'Answer must not be empty.'),
};
export async function scoreAnswerHandler(args) {
    try {
        const result = await scoreAnswerService(args.sessionId, args.answer);
        const summaryText = `Scored answer: Overall ${result.overall}/10. Feedback: "${result.feedback}"`;
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
        logger.error('Failed to score answer in MCP tool', { error: error.message });
        return {
            isError: true,
            content: [
                {
                    type: 'text',
                    text: `Error scoring answer: ${error.message}`,
                },
            ],
        };
    }
}
