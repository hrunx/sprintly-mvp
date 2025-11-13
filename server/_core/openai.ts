import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY || '',
});

export interface ChatMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export interface ChatCompletionOptions {
  messages: ChatMessage[];
  model?: string;
  temperature?: number;
  maxTokens?: number;
}

/**
 * Call OpenAI Chat Completion API
 */
export async function chatCompletion(options: ChatCompletionOptions) {
  const {
    messages,
    model = 'gpt-4o-mini',
    temperature = 0.7,
    maxTokens = 2000,
  } = options;

  try {
    const response = await openai.chat.completions.create({
      model,
      messages,
      temperature,
      max_tokens: maxTokens,
    });

    return {
      content: response.choices[0]?.message?.content || '',
      usage: response.usage,
    };
  } catch (error) {
    console.error('[OpenAI] Chat completion error:', error);
    throw new Error('Failed to generate AI response');
  }
}

/**
 * Extract structured data from pitch deck text
 */
export async function extractPitchDeckMetrics(pitchDeckText: string) {
  const response = await chatCompletion({
    messages: [
      {
        role: 'system',
        content: `You are an AI that extracts key metrics from pitch decks. Extract the following information and return as JSON:
{
  "annualRevenue": number (in USD, 0 if not found),
  "revenueGrowth": number (percentage, 0 if not found),
  "teamSize": number (0 if not found),
  "customers": number (0 if not found),
  "mrr": number (monthly recurring revenue in USD, 0 if not found),
  "marketSize": string (description),
  "businessModel": string (B2B SaaS, B2C, Marketplace, etc.)
}

Only extract numbers that are explicitly stated. If not found, use 0 or empty string.`,
      },
      {
        role: 'user',
        content: `Extract metrics from this pitch deck:\n\n${pitchDeckText}`,
      },
    ],
    temperature: 0.3,
  });

  try {
    return JSON.parse(response.content);
  } catch (error) {
    console.error('[OpenAI] Failed to parse pitch deck metrics:', error);
    return null;
  }
}

/**
 * Analyze thesis alignment between company and investor
 */
export async function analyzeThesisAlignment(
  companyDescription: string,
  investorThesis: string
): Promise<number> {
  const response = await chatCompletion({
    messages: [
      {
        role: 'system',
        content: `You are an AI that analyzes alignment between company descriptions and investor theses. 
Return a score from 0-100 indicating how well the company matches the investor's thesis.
Return ONLY a number, no explanation.`,
      },
      {
        role: 'user',
        content: `Company: ${companyDescription}\n\nInvestor Thesis: ${investorThesis}\n\nAlignment score (0-100):`,
      },
    ],
    temperature: 0.3,
    maxTokens: 10,
  });

  const score = parseInt(response.content.trim());
  return isNaN(score) ? 50 : Math.min(100, Math.max(0, score));
}

export { openai };
