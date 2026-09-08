import { Message, OpenRouterConfig, EmbeddingResult } from './types';

/**
 * Handles Chat Completions with togglable streaming or synchronous JSON response.
 */
export async function fetchChatCompletion(
  config: OpenRouterConfig,
  messages: Message[],
  onChunk?: (chunk: string, reasoningChunk?: string) => void
): Promise<string> {
  if (!config.apiKey) {
    throw new Error('Please configure your OpenRouter API Key.');
  }

  const payload: Record<string, any> = {
    model: config.model || 'openrouter/free',
    messages: messages.map(({ role, content }) => ({ role, content })),
    temperature: config.temperature,
    top_p: config.topP,
    max_tokens: config.maxTokens,
    repetition_penalty: config.repetitionPenalty,
    stream: config.stream,
    provider: {
      sort: config.providerSort,
      allow_fallbacks: config.allowFallbacks,
    },
  };

  if (config.reasoningEnabled) {
    payload.reasoning = { enabled: true };
  }

  const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${config.apiKey}`,
      'HTTP-Referer': window.location.origin,
      'X-Title': 'OpenRouter Dev App',
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(
      errorData.error?.message || `Request failed with status ${response.status}`
    );
  }

  // --- STREAMING MODE ---
  if (config.stream) {
    if (!response.body) throw new Error('ReadableStream not supported.');

    const reader = response.body.getReader();
    const decoder = new TextDecoder('utf-8');
    let buffer = '';
    let fullText = '';

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split('\n');
      buffer = lines.pop() || '';

      for (const line of lines) {
        const trimmed = line.trim();
        if (!trimmed || trimmed.startsWith(':')) continue;
        if (trimmed === 'data: [DONE]') return fullText;

        if (trimmed.startsWith('data: ')) {
          try {
            const parsed = JSON.parse(trimmed.slice(6));
            const delta = parsed.choices?.[0]?.delta;
            const content = delta?.content || '';
            const reasoning = delta?.reasoning || delta?.reasoning_content || '';
            fullText += content;
            if (onChunk && (content || reasoning)) {
              onChunk(content, reasoning);
            }
          } catch {
            // Ignore incomplete JSON chunks
          }
        }
      }
    }
    return fullText;
  }

  // --- NON-STREAMING MODE ---
  const data = await response.json();
  const choice = data.choices?.[0]?.message;
  return choice?.content || '';
}

/**
 * Generates vector embeddings for a given text input.
 */
export async function createEmbedding(
  apiKey: string,
  model: string,
  input: string
): Promise<EmbeddingResult> {
  if (!apiKey) throw new Error('API Key is required for embeddings.');
  if (!input.trim()) throw new Error('Input text cannot be empty.');

  const response = await fetch('https://openrouter.ai/api/v1/embeddings', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'HTTP-Referer': window.location.origin,
      'X-Title': 'OpenRouter Dev App',
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: model || 'openai/text-embedding-3-small',
      input: input.trim(),
    }),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(
      errorData.error?.message || `Embedding API error: ${response.status}`
    );
  }

  const data = await response.json();
  const vector = data.data?.[0]?.embedding || [];

  return {
    embedding: vector,
    dimensions: vector.length,
    tokensUsed: data.usage?.total_tokens || 0,
    model: data.model || model,
  };
}