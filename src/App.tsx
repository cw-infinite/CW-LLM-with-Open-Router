import React, { useState, useEffect, useRef } from 'react';
import { Message, ChatSession, OpenRouterConfig } from './types';
import { streamChatCompletion } from './openrouter';
import { SettingsDrawer } from './SettingsDrawer';

const DEFAULT_CONFIG: OpenRouterConfig = {
  apiKey: localStorage.getItem('or_key') || '',
  model: localStorage.getItem('or_model') || 'nvidia/nemotron-3-ultra-550b-a55b:free',
  temperature: 0.7,
  topP: 1,
  maxTokens: 2048,
  repetitionPenalty: 1,
  reasoningEnabled: false,
  providerSort: 'throughput',
  allowFallbacks: true,
};

export const App: React.FC = () => {
  const [config, setConfig] = useState<OpenRouterConfig>(DEFAULT_CONFIG);
  const [sessions, setSessions] = useState<ChatSession[]>(() => {
    const saved = localStorage.getItem('or_sessions');
    return saved ? JSON.parse(saved) : [];
  });
  const [activeSessionId, setActiveSessionId] = useState<string | null>(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState<boolean>(false);
  const [input, setInput] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Sync active session messages
  const activeSession = sessions.find((s) => s.id === activeSessionId);
  const messages = activeSession ? activeSession.messages : [];

  useEffect(() => {
    localStorage.setItem('or_sessions', JSON.stringify(sessions));
  }, [sessions]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

  const createNewChat = () => {
    const newSession: ChatSession = {
      id: Date.now().toString(),
      title: 'New Chat',
      createdAt: Date.now(),
      messages: [],
      modelUsed: config.model,
    };
    setSessions((prev) => [newSession, ...prev]);
    setActiveSessionId(newSession.id);
  };

  const handleSaveConfig = (newConfig: OpenRouterConfig) => {
    setConfig(newConfig);
    localStorage.setItem('or_key', newConfig.apiKey);
    localStorage.setItem('or_model', newConfig.model);
  };

  const updateActiveMessages = (newMessages: Message[], titleUpdate?: string) => {
    if (!activeSessionId) return;
    setSessions((prev) =>
      prev.map((s) => {
        if (s.id === activeSessionId) {
          return {
            ...s,
            messages: newMessages,
            title: titleUpdate || s.title,
          };
        }
        return s;
      })
    );
  };

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;

    if (!config.apiKey) {
      setIsDrawerOpen(true);
      return;
    }

    let currentSessionId = activeSessionId;
    if (!currentSessionId) {
      const newSession: ChatSession = {
        id: Date.now().toString(),
        title: input.slice(0, 30) + '...',
        createdAt: Date.now(),
        messages: [],
        modelUsed: config.model,
      };
      setSessions((prev) => [newSession, ...prev]);
      setActiveSessionId(newSession.id);
      currentSessionId = newSession.id;
    }

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: input,
      timestamp: Date.now(),
    };

    const assistantMsgId = (Date.now() + 1).toString();
    const assistantMessage: Message = {
      id: assistantMsgId,
      role: 'assistant',
      content: '',
      reasoning: '',
      timestamp: Date.now(),
    };

    const updatedMessages = [...messages, userMessage];
    const newTitle = messages.length === 0 ? input.slice(0, 30) : undefined;
    
    // Update local state directly
    setSessions((prev) =>
      prev.map((s) =>
        s.id === currentSessionId
          ? { ...s, title: newTitle || s.title, messages: [...updatedMessages, assistantMessage] }
          : s
      )
    );

    setInput('');
    setIsLoading(true);
    setError(null);

    try {
      await streamChatCompletion(config, updatedMessages, (chunk, reasoningChunk) => {
        setSessions((prev) =>
          prev.map((s) => {
            if (s.id !== currentSessionId) return s;
            return {
              ...s,
              messages: s.messages.map((m) => {
                if (m.id !== assistantMsgId) return m;
                return {
                  ...m,
                  content: m.content + chunk,
                  reasoning: m.reasoning + (reasoningChunk || ''),
                };
              }),
            };
          })
        );
      });
    } catch (err: any) {
      setError(err.message || 'Stream error');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div style={styles.appContainer}>
      {/* Sidebar */}
      <aside style={styles.sidebar}>
        <button onClick={createNewChat} style={styles.newChatBtn}>
          + New Chat
        </button>
        <div style={styles.historyList}>
          {sessions.map((s) => (
            <div
              key={s.id}
              onClick={() => setActiveSessionId(s.id)}
              style={{
                ...styles.historyItem,
                backgroundColor: s.id === activeSessionId ? '#e2e8f0' : 'transparent',
              }}
            >
              💬 {s.title}
            </div>
          ))}
        </div>
        <button onClick={() => setIsDrawerOpen(true)} style={styles.sidebarSettings}>
          ⚙️ Model Settings
        </button>
      </aside>

      {/* Main Container */}
      <main style={styles.mainContent}>
        {/* Header */}
        <header style={styles.topHeader}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={styles.statusDot} />
            <strong style={{ fontSize: '15px' }}>{config.model}</strong>
          </div>
          {config.reasoningEnabled && <span style={styles.reasoningBadge}>🧠 Thinking Mode</span>}
        </header>

        {/* Message Feed */}
        <div style={styles.feed}>
          {messages.length === 0 ? (
            <div style={styles.heroState}>
              <h2>What are we building today?</h2>
              <p>Connected to OpenRouter. Type a prompt or adjust settings to start.</p>
            </div>
          ) : (
            messages.map((msg) => (
              <div key={msg.id} style={styles.messageRow}>
                <div style={{ ...styles.avatar, backgroundColor: msg.role === 'user' ? '#4f46e5' : '#10b981' }}>
                  {msg.role === 'user' ? 'U' : 'AI'}
                </div>
                <div style={styles.messageBubble}>
                  {msg.reasoning && (
                    <details style={styles.reasoningBox} open>
                      <summary style={styles.reasoningSummary}>Thought Process</summary>
                      <div style={styles.reasoningContent}>{msg.reasoning}</div>
                    </details>
                  )}
                  <div style={styles.textContent}>
                    {msg.content || (isLoading && <span style={styles.pulsingDots}>Generating...</span>)}
                  </div>
                </div>
              </div>
            ))
          )}
          {error && <div style={styles.errorBanner}>{error}</div>}
          <div ref={messagesEndRef} />
        </div>

        {/* Floating Input Box */}
        <div style={styles.inputWrapper}>
          <form onSubmit={handleSend} style={styles.inputContainer}>
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleSend(e);
                }
              }}
              placeholder="Ask anything... (Press Shift+Enter for new line)"
              rows={1}
              style={styles.textArea}
            />
            <button type="submit" disabled={isLoading || !input.trim()} style={styles.sendButton}>
              {isLoading ? '...' : 'Send ↑'}
            </button>
          </form>
        </div>
      </main>

      <SettingsDrawer
        isOpen={isDrawerOpen}
        config={config}
        onSave={handleSaveConfig}
        onClose={() => setIsDrawerOpen(false)}
      />
    </div>
  );
};

const styles: Record<string, React.CSSProperties> = {
  appContainer: { display: 'flex', height: '100vh', width: '100vw', backgroundColor: '#f8fafc', color: '#0f172a', fontFamily: 'Inter, system-ui, sans-serif' },
  sidebar: { width: '260px', backgroundColor: '#f1f5f9', borderRight: '1px solid #e2e8f0', display: 'flex', flexDirection: 'column', padding: '16px', gap: '12px' },
  newChatBtn: { padding: '10px', borderRadius: '8px', border: '1px dashed #cbd5e1', backgroundColor: '#ffffff', fontWeight: 600, cursor: 'pointer' },
  historyList: { flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '4px' },
  historyItem: { padding: '8px 12px', borderRadius: '6px', fontSize: '13px', cursor: 'pointer', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' },
  sidebarSettings: { padding: '10px', borderRadius: '8px', border: 'none', backgroundColor: '#ffffff', cursor: 'pointer', fontSize: '13px', textAlign: 'left', border: '1px solid #cbd5e1' },
  mainContent: { flex: 1, display: 'flex', flexDirection: 'column', position: 'relative' },
  topHeader: { height: '56px', borderBottom: '1px solid #e2e8f0', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 24px', backgroundColor: 'rgba(255,255,255,0.8)', backdropFilter: 'blur(8px)' },
  statusDot: { width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#22c55e', display: 'inline-block' },
  reasoningBadge: { fontSize: '12px', backgroundColor: '#fef3c7', color: '#92400e', padding: '3px 8px', borderRadius: '12px', fontWeight: 500 },
  feed: { flex: 1, overflowY: 'auto', padding: '24px', display: 'flex', flexDirection: 'column', gap: '20px', maxWidth: '800px', width: '100%', margin: '0 auto' },
  heroState: { margin: 'auto', textAlign: 'center', color: '#64748b' },
  messageRow: { display: 'flex', gap: '12px', animation: 'fadeIn 0.25s ease-out' },
  avatar: { width: '32px', height: '32px', borderRadius: '50%', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '12px', fontWeight: 'bold' },
  messageBubble: { flex: 1, backgroundColor: '#ffffff', padding: '14px 18px', borderRadius: '12px', boxShadow: '0 1px 3px rgba(0,0,0,0.05)', border: '1px solid #e2e8f0' },
  reasoningBox: { backgroundColor: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '8px', padding: '8px 12px', marginBottom: '12px' },
  reasoningSummary: { fontSize: '12px', color: '#64748b', cursor: 'pointer', fontWeight: 600 },
  reasoningContent: { fontSize: '12px', color: '#475569', marginTop: '6px', whiteSpace: 'pre-wrap', fontFamily: 'monospace' },
  textContent: { fontSize: '14px', lineHeight: '1.6', whiteSpace: 'pre-wrap' },
  pulsingDots: { color: '#94a3b8', fontStyle: 'italic' },
  errorBanner: { padding: '12px', backgroundColor: '#fef2f2', border: '1px solid #fecaca', color: '#991b1b', borderRadius: '8px', fontSize: '13px' },
  inputWrapper: { padding: '16px 24px', maxWidth: '800px', width: '100%', margin: '0 auto' },
  inputContainer: { display: 'flex', alignItems: 'center', backgroundColor: '#ffffff', borderRadius: '12px', border: '1px solid #cbd5e1', boxShadow: '0 4px 12px rgba(0,0,0,0.05)', padding: '8px 12px' },
  textArea: { flex: 1, border: 'none', outline: 'none', resize: 'none', fontSize: '14px', fontFamily: 'inherit', padding: '4px' },
  sendButton: { padding: '8px 16px', borderRadius: '8px', border: 'none', backgroundColor: '#4f46e5', color: '#fff', fontWeight: 600, cursor: 'pointer' },
};

export default App;