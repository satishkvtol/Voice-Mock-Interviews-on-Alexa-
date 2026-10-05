import { BedrockRuntimeClient, ConverseCommand } from '@aws-sdk/client-bedrock-runtime';
import { z } from 'zod';
import { logger } from '../utils/logger.js';

const region = process.env.AWS_REGION || 'us-east-1';
const defaultModelId = process.env.BEDROCK_MODEL_ID || 'us.anthropic.claude-3-5-sonnet-20241022-v2:0';

// Initialize BedrockRuntimeClient
let bedrockClient: BedrockRuntimeClient | null = null;

function getBedrockClient(): BedrockRuntimeClient {
  if (!bedrockClient) {
    bedrockClient = new BedrockRuntimeClient({ region });
  }
  return bedrockClient;
}

/**
 * Executes Bedrock Converse API with strict JSON output and Zod validation.
 * Retries once if JSON parsing or validation fails.
 * Supports MOCK_LLM=true for vitest / local testing without AWS credentials.
 */
export async function invokeBedrockJson<T>(
  systemPrompt: string,
  userPrompt: string,
  schema: z.ZodSchema<T>,
  mockFn?: () => T
): Promise<T> {
  const isMock = process.env.MOCK_LLM === 'true';

  if (isMock && mockFn) {
    logger.info('[MOCK_LLM] Returning mock LLM response');
    return mockFn();
  }

  const client = getBedrockClient();
  const modelId = process.env.BEDROCK_MODEL_ID || defaultModelId;

  const jsonPrompt = `${userPrompt}\n\nIMPORTANT: Return ONLY a valid JSON object matching the requested structure. Do not include markdown code block formatting like \`\`\`json or extra explanatory text. All output must be strictly valid JSON. Keep all spoken text short, natural, and free of markdown syntax or bullet symbols.`;

  let attempt = 0;
  let lastError: Error | null = null;

  while (attempt < 2) {
    attempt++;
    try {
      logger.info(`Invoking Bedrock model ${modelId} (Attempt ${attempt})`);
      const command = new ConverseCommand({
        modelId,
        messages: [
          {
            role: 'user',
            content: [{ text: jsonPrompt }],
          },
        ],
        system: [{ text: systemPrompt }],
        inferenceConfig: {
          temperature: 0.2, // Low temperature for high accuracy & structure
          maxTokens: 2048,
        },
      });

      const response = await client.send(command);
      const outputText = response.output?.message?.content?.[0]?.text || '';

      if (!outputText) {
        throw new Error('Empty response received from Bedrock Converse API.');
      }

      // Clean response string (strip markdown codeblocks if LLM included them despite instructions)
      const cleanedJsonStr = outputText
        .replace(/^```json\s*/i, '')
        .replace(/^```\s*/i, '')
        .replace(/\s*```$/i, '')
        .trim();

      const parsedJson = JSON.parse(cleanedJsonStr);
      const validatedData = schema.parse(parsedJson);
      return validatedData;
    } catch (err: any) {
      lastError = err;
      logger.warn(`Bedrock invocation attempt ${attempt} failed: ${err.message}`);
    }
  }

  throw new Error(`LLM invocation failed after 2 attempts. Last error: ${lastError?.message}`);
}
