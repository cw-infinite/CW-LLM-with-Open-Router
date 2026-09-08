import { Message, OpenRouterConfig } from './types';

export async function streamChatCompletion(
  config: OpenRouterConfig,
  messages: Message[],
  onChunk: (chunk: string, reasoningChunk?: string) => void
): Promise<void> {
  if (!config.apiKey) {
    throw new Error('Please configure your OpenRouter API Key in settings.');
  }

  const payload: Record<string, any> = {
    model: config.model || 'openrouter/free',
    messages: messages.map(({ role, content }) => ({ role, content })),
    temperature: config.temperature,
    top_p: config.topP,
    max_tokens: config.maxTokens,
    repetition_penalty: config.repetitionPenalty,
    stream: true,
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
      'X-Title': 'OpenRouter Motion Client',
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

  if (!response.body) throw new Error('ReadableStream not supported.');

  const reader = response.body.getReader();
  const decoder = new TextDecoder('utf-8');
  let buffer = '';

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split('\n');
    buffer = lines.pop() || '';

    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith(':')) continue;
      if (trimmed === 'data: [DONE]') return;

      if (trimmed.startsWith('data: ')) {
        try {
          const parsed = JSON.parse(trimmed.slice(6));
          const delta = parsed.choices?.[0]?.delta;
          const content = delta?.content || '';
          const reasoning = delta?.reasoning || delta?.reasoning_content || '';
          if (content || reasoning) {
            onChunk(content, reasoning);
          }
        } catch {
          // Ignore incomplete JSON chunks
        }
      }
    }
  }
}