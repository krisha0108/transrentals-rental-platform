/**
 * DeepSeek API client — single point of contact with the model.
 *
 * Reads DEEPSEEK_API_KEY and DEEPSEEK_MODEL from env.
 */

const DEEPSEEK_API_URL = 'https://api.deepseek.com/chat/completions';
const DEFAULT_MODEL = 'deepseek-chat';
const DEFAULT_TIMEOUT_MS = 120_000;

export type DeepseekMessage = {
  role: 'system' | 'user' | 'assistant';
  content: string;
};

export type DeepseekCompleteOptions = {
  messages: DeepseekMessage[];
  model?: string;
  temperature?: number;
  maxTokens?: number;
  responseFormat?: 'text' | 'json_object';
  timeoutMs?: number;
};

export type DeepseekUsage = {
  promptTokens: number;
  completionTokens: number;
  totalTokens: number;
};

export type DeepseekResult = {
  content: string;
  model: string;
  usage: DeepseekUsage;
  finishReason: string | null;
};

export class DeepseekError extends Error {
  constructor(message: string, public status?: number, public details?: unknown) {
    super(message);
    this.name = 'DeepseekError';
  }
}

function getApiKey(): string {
  const key = process.env.DEEPSEEK_API_KEY;
  if (!key) {
    throw new DeepseekError(
      'DEEPSEEK_API_KEY not set in environment. Add to .env file.',
    );
  }
  return key;
}

export async function complete(opts: DeepseekCompleteOptions): Promise<DeepseekResult> {
  const apiKey = getApiKey();
  const model = opts.model ?? process.env.DEEPSEEK_MODEL ?? DEFAULT_MODEL;
  const timeoutMs = opts.timeoutMs ?? DEFAULT_TIMEOUT_MS;

  const body: Record<string, unknown> = {
    model,
    messages: opts.messages,
    temperature: opts.temperature ?? 0.7,
    max_tokens: opts.maxTokens ?? 4096,
    stream: false,
  };

  if (opts.responseFormat === 'json_object') {
    body.response_format = { type: 'json_object' };
  }

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  let response: Response;
  try {
    response = await fetch(DEEPSEEK_API_URL, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
      signal: controller.signal,
    });
  } catch (err) {
    if ((err as Error).name === 'AbortError') {
      throw new DeepseekError(`Request timed out after ${timeoutMs}ms`);
    }
    throw new DeepseekError(`Network error: ${(err as Error).message}`);
  } finally {
    clearTimeout(timer);
  }

  if (!response.ok) {
    const text = await response.text().catch(() => '');
    throw new DeepseekError(
      `DeepSeek API error ${response.status}: ${text.slice(0, 500)}`,
      response.status,
      text,
    );
  }

  const json = await response.json();
  const choice = json.choices?.[0];
  if (!choice) {
    throw new DeepseekError('No choices in response', undefined, json);
  }

  return {
    content: choice.message?.content ?? '',
    model: json.model ?? model,
    usage: {
      promptTokens: json.usage?.prompt_tokens ?? 0,
      completionTokens: json.usage?.completion_tokens ?? 0,
      totalTokens: json.usage?.total_tokens ?? 0,
    },
    finishReason: choice.finish_reason ?? null,
  };
}

export function parseJsonResponse<T = unknown>(content: string): T {
  const trimmed = content.trim();

  let candidate = trimmed;
  const fenceMatch = trimmed.match(/```(?:json)?\s*([\s\S]*?)```/);
  if (fenceMatch) candidate = fenceMatch[1].trim();

  try {
    return JSON.parse(candidate) as T;
  } catch (err) {
    const firstBrace = candidate.indexOf('{');
    const lastBrace = candidate.lastIndexOf('}');
    if (firstBrace !== -1 && lastBrace > firstBrace) {
      try {
        return JSON.parse(candidate.slice(firstBrace, lastBrace + 1)) as T;
      } catch {}
    }
    throw new DeepseekError(
      `Failed to parse JSON from model output: ${(err as Error).message}`,
      undefined,
      candidate.slice(0, 500),
    );
  }
}
