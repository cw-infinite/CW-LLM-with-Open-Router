import React, { useState, useEffect, useRef } from 'react';
import { Message, ChatSession, OpenRouterConfig } from './types';
import { fetchChatCompletion } from './openrouter';
import { SettingsDrawer } from './SettingsDrawer';
import { EmbeddingTool } from './EmbeddingTool';

const DEFAULT_CONFIG: OpenRouterConfig = {
  apiKey: localStorage.getItem('or_key') || '',
  model: localStorage.getItem('or_model') || 'openrouter/free',
  embeddingModel: 'openai/text-embedding-3-small',
  stream: true, // Default to true
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
  const [activeTab, setActiveTab] = useState<'chat' | 'embedding'>('chat');
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
  const activeSession = sessions.find((s) => s.id === activeSessionId);
  const messages = activeSession ? activeSession.messages : [];

  useEffect(() => {
    localStorage.setItem('or_sessions', JSON.stringify(sessions));
  }, [sessions]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

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

    const userMessage: Message = { id: Date.now().toString(), role: 'user', content: input, timestamp: Date.now() };
    const assistantMsgId = (Date.now() + 1).toString();
    const assistantMessage: Message = { id: assistantMsgId, role: 'assistant', content: '', reasoning: '', timestamp: Date.now() };

    const updatedMessages = [...messages, userMessage];

    setSessions((prev) =>
      prev.map((s) =>
        s.id === currentSessionId
          ? { ...s, messages: [...updatedMessages, assistantMessage] }
          : s
      )
    );

    setInput('');
    setIsLoading(true);
    setError(null);

    try {
      if (config.stream) {
        // --- STREAMING PIPELINE ---
        await fetchChatCompletion(config, updatedMessages, (chunk, reasoningChunk) => {
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
      } else {
        // --- NON-STREAMING PIPELINE ---
        const fullContent = await fetchChatCompletion(config, updatedMessages);
        setSessions((prev) =>
          prev.map((s) => {
            if (s.id !== currentSessionId) return s;
            return {
              ...s,
              messages: s.messages.map((m) =>
                m.id === assistantMsgId ? { ...m, content: fullContent } : m
              ),
            };
          })
        );
      }
    } catch (err: any) {
      setError(err.message || 'Error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div style={styles.appContainer}>
      <aside style={styles.sidebar}>
        <div style={styles.tabGroup}>
          <button
            onClick={() => setActiveTab('chat')}
            style={{ ...styles.tabBtn, backgroundColor: activeTab === 'chat' ? '#ffffff' : 'transparent' }}
          >
            💬 Chat
          </button>
          <button
            onClick={() => setActiveTab('embedding')}
            style={{ ...styles.tabBtn, backgroundColor: activeTab === 'embedding' ? '#ffffff' : 'transparent' }}
          >
            🧬 Embeddings
          </button>
        </div>

        {activeTab === 'chat' && (
          <>
            <button onClick={() => setActiveSessionId(null)} style={styles.newChatBtn}>+ New Chat</button>
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
                  {s.title}
                </div>
              ))}
            </div>
          </>
        )}

        <button onClick={() => setIsDrawerOpen(true)} style={styles.sidebarSettings}>
          ⚙️ Settings
        </button>
      </aside>

      <main style={styles.mainContent}>
        <header style={styles.topHeader}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={styles.statusDot} />
            <strong>{activeTab === 'chat' ? config.model : config.embeddingModel}</strong>
          </div>
          <div style={{ display: 'flex', gap: '8px' }}>
            {config.stream && <span style={styles.badge}>⚡ Streaming ON</span>}
            {!config.stream && <span style={{ ...styles.badge, backgroundColor: '#f1f5f9', color: '#475569' }}>📦 Sync Mode</span>}
          </div>
        </header>

        {activeTab === 'chat' ? (
          <>
            <div style={styles.feed}>
              {messages.length === 0 ? (
                <div style={styles.heroState}>
                  <h2>Chat Mode Active</h2>
                  <p>Streaming is {config.stream ? 'enabled' : 'disabled'}. Send a message to start.</p>
                </div>
              ) : (
                messages.map((msg) => (
                  <div key={msg.id} style={styles.messageRow}>
                    <div style={{ ...styles.avatar, backgroundColor: msg.role === 'user' ? '#4f46e5' : '#10b981' }}>
                      {msg.role === 'user' ? 'U' : 'AI'}
                    </div>
                    <div style={styles.messageBubble}>
                      <div style={styles.textContent}>
                        {msg.content || (isLoading && msg.role === 'assistant' ? 'Generating response...' : '')}
                      </div>
                    </div>
                  </div>
                ))
              )}
              {error && <div style={styles.errorBanner}>{error}</div>}
              <div ref={messagesEndRef} />
            </div>

            <div style={styles.inputWrapper}>
              <form onSubmit={handleSend} style={styles.inputContainer}>
                <textarea
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder="Type your message..."
                  rows={1}
                  style={styles.textArea}
                />
                <button type="submit" disabled={isLoading || !input.trim()} style={styles.sendButton}>
                  Send
                </button>
              </form>
            </div>
          </>
        ) : (
          <EmbeddingTool apiKey={config.apiKey} embeddingModel={config.embeddingModel} />
        )}
      </main>

      <SettingsDrawer
        isOpen={isDrawerOpen}
        config={config}
        onSave={(c) => {
          setConfig(c);
          localStorage.setItem('or_key', c.apiKey);
          localStorage.setItem('or_model', c.model);
        }}
        onClose={() => setIsDrawerOpen(false)}
      />
    </div>
  );
};

const styles: Record<string, React.CSSProperties> = {
  appContainer: { display: 'flex', height: '100vh', width: '100vw', backgroundColor: '#f8fafc', fontFamily: 'sans-serif' },
  sidebar: { width: '260px', backgroundColor: '#f1f5f9', borderRight: '1px solid #e2e8f0', display: 'flex', flexDirection: 'column', padding: '16px', gap: '12px' },
  tabGroup: { display: 'flex', gap: '4px', backgroundColor: '#e2e8f0', padding: '4px', borderRadius: '8px' },
  tabBtn: { flex: 1, padding: '6px', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 600, fontSize: '13px' },
  newChatBtn: { padding: '10px', borderRadius: '8px', border: '1px dashed #cbd5e1', backgroundColor: '#ffffff', fontWeight: 600, cursor: 'pointer' },
  historyList: { flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '4px' },
  historyItem: { padding: '8px 12px', borderRadius: '6px', fontSize: '13px', cursor: 'pointer', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' },
  sidebarSettings: { padding: '10px', borderRadius: '8px', border: '1px solid #cbd5e1', backgroundColor: '#ffffff', cursor: 'pointer', fontSize: '13px' },
  mainContent: { flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' },
  topHeader: { height: '56px', borderBottom: '1px solid #e2e8f0', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 24px', backgroundColor: '#ffffff' },
  statusDot: { width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#22c55e' },
  badge: { fontSize: '11px', backgroundColor: '#e0e7ff', color: '#3730a3', padding: '3px 8px', borderRadius: '12px', fontWeight: 600 },
  feed: { flex: 1, overflowY: 'auto', padding: '24px', display: 'flex', flexDirection: 'column', gap: '16px', maxWidth: '800px', width: '100%', margin: '0 auto' },
  heroState: { margin: 'auto', textAlign: 'center', color: '#64748b' },
  messageRow: { display: 'flex', gap: '12px' },
  avatar: { width: '32px', height: '32px', borderRadius: '50%', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '12px', fontWeight: 'bold' },
  messageBubble: { flex: 1, backgroundColor: '#ffffff', padding: '14px', borderRadius: '12px', border: '1px solid #e2e8f0' },
  textContent: { fontSize: '14px', lineHeight: '1.5', whiteSpace: 'pre-wrap' },
  errorBanner: { padding: '12px', backgroundColor: '#fef2f2', color: '#991b1b', borderRadius: '8px', fontSize: '13px' },
  inputWrapper: { padding: '16px 24px', maxWidth: '800px', width: '100%', margin: '0 auto' },
  inputContainer: { display: 'flex', alignItems: 'center', backgroundColor: '#ffffff', borderRadius: '12px', border: '1px solid #cbd5e1', padding: '8px 12px' },
  textArea: { flex: 1, border: 'none', outline: 'none', resize: 'none', fontSize: '14px' },
  sendButton: { padding: '8px 16px', borderRadius: '8px', border: 'none', backgroundColor: '#4f46e5', color: '#fff', fontWeight: 600, cursor: 'pointer' },
};

export default App;