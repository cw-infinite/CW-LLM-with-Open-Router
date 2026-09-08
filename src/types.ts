export interface Message {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  reasoning?: string;
  timestamp: number;
}

export interface ChatSession {
  id: string;
  title: string;
  createdAt: number;
  messages: Message[];
  modelUsed: string;
}

export interface OpenRouterConfig {
  apiKey: string;
  model: string;
  temperature: number;
  topP: number;
  maxTokens: number;
  repetitionPenalty: number;
  // OpenRouter Specifics
  reasoningEnabled: boolean;
  providerSort: 'price' | 'throughput' | 'latency';
  allowFallbacks: boolean;
}