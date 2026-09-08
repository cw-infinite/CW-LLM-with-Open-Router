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

export interface EmbeddingResult {
  embedding: number[];
  dimensions: number;
  tokensUsed: number;
  model: string;
}

export interface OpenRouterConfig {
  apiKey: string;
  model: string;
  embeddingModel: string;
  stream: boolean; // Enables or disables SSE streaming
  temperature: number;
  topP: number;
  maxTokens: number;
  repetitionPenalty: number;
  reasoningEnabled: boolean;
  providerSort: 'price' | 'throughput' | 'latency';
  allowFallbacks: boolean;
}