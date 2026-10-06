import { z } from 'zod';
import { parseResumeService } from '../../services/interview.js';
import { logger } from '../../utils/logger.js';

export const parseResumeInputSchema = {
  resumeText: z.string().min(10, 'Resume text must be at least 10 characters long.'),
};

export async function parseResumeHandler(args: { resumeText: string }) {
  try {
    const result = await parseResumeService(args.resumeText);
    const summaryText = `Successfully parsed resume. Extracted ${result.skills.length} skills and ${result.projects.length} projects.`;

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
    logger.error('Failed to parse resume in MCP tool', { error: error.message });
    return {
      isError: true,
      content: [
        {
          type: 'text' as const,
          text: `Error parsing resume: ${error.message}`,
        },
      ],
    };
  }
}
