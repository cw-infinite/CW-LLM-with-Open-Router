import React from 'react';
import { OpenRouterConfig } from './types';

interface DrawerProps {
  isOpen: boolean;
  config: OpenRouterConfig;
  onSave: (config: OpenRouterConfig) => void;
  onClose: () => void;
}

const FREE_CHAT_MODELS = [
  'openrouter/free',
  'google/gemini-2.0-flash-lite-001:free',
  'meta-llama/llama-3.3-70b-instruct:free',
  'deepseek/deepseek-r1:free',
  'qwen/qwen-2.5-coder-32b-instruct:free',
];

const EMBEDDING_MODELS = [
  'openai/text-embedding-3-small',
  'openai/text-embedding-3-large',
  'openai/text-embedding-ada-002',
  'cohere/embed-english-v3.0',
];

export const SettingsDrawer: React.FC<DrawerProps> = ({ isOpen, config, onSave, onClose }) => {
  const [formData, setFormData] = React.useState<OpenRouterConfig>(config);

  if (!isOpen) return null;

  const handleChange = (key: keyof OpenRouterConfig, value: any) => {
    setFormData((prev) => ({ ...prev, [key]: value }));
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(formData);
    onClose();
  };

  return (
    <div style={styles.overlay} onClick={onClose}>
      <div style={styles.drawer} onClick={(e) => e.stopPropagation()}>
        <div style={styles.drawerHeader}>
          <h3>Model & Engine Settings</h3>
          <button onClick={onClose} style={styles.closeBtn}>✕</button>
        </div>

        <form onSubmit={handleSave} style={styles.form}>
          <div style={styles.fieldGroup}>
            <label style={styles.label}>OpenRouter API Key</label>
            <input
              type="password"
              value={formData.apiKey}
              onChange={(e) => handleChange('apiKey', e.target.value)}
              placeholder="sk-or-v1-..."
              style={styles.input}
              required
            />
          </div>

          <div style={styles.fieldGroup}>
            <label style={styles.label}>Chat / LLM Model ID</label>
            <input
              type="text"
              value={formData.model}
              onChange={(e) => handleChange('model', e.target.value)}
              placeholder="e.g. openrouter/free"
              style={styles.input}
              required
            />
            <div style={styles.chipContainer}>
              {FREE_CHAT_MODELS.map((m) => (
                <button
                  key={m}
                  type="button"
                  style={{
                    ...styles.chip,
                    borderColor: formData.model === m ? '#6366f1' : '#e2e8f0',
                    backgroundColor: formData.model === m ? '#eef2ff' : '#f8fafc',
                  }}
                  onClick={() => handleChange('model', m)}
                >
                  {m.replace(':free', '').replace('openrouter/', '')}
                </button>
              ))}
            </div>
          </div>

          <div style={styles.fieldGroup}>
            <label style={styles.label}>Embedding Model ID</label>
            <input
              type="text"
              value={formData.embeddingModel}
              onChange={(e) => handleChange('embeddingModel', e.target.value)}
              placeholder="e.g. openai/text-embedding-3-small"
              style={styles.input}
            />
            <div style={styles.chipContainer}>
              {EMBEDDING_MODELS.map((m) => (
                <button
                  key={m}
                  type="button"
                  style={{
                    ...styles.chip,
                    borderColor: formData.embeddingModel === m ? '#6366f1' : '#e2e8f0',
                    backgroundColor: formData.embeddingModel === m ? '#eef2ff' : '#f8fafc',
                  }}
                  onClick={() => handleChange('embeddingModel', m)}
                >
                  {m.split('/')[1]}
                </button>
              ))}
            </div>
          </div>

          <hr style={styles.divider} />

          <div style={styles.fieldGroup}>
            <h4 style={styles.subHeading}>Execution Controls</h4>

            <label style={styles.checkboxLabel}>
              <input
                type="checkbox"
                checked={formData.stream}
                onChange={(e) => handleChange('stream', e.target.checked)}
              />
              <strong>Enable Streaming (SSE)</strong>
            </label>
            <span style={styles.hint}>
              When enabled, responses stream real-time. When disabled, the whole message arrives at once.
            </span>

            <label style={{ ...styles.checkboxLabel, marginTop: '8px' }}>
              <input
                type="checkbox"
                checked={formData.reasoningEnabled}
                onChange={(e) => handleChange('reasoningEnabled', e.target.checked)}
              />
              Enable Thinking / Reasoning Tokens
            </label>

            <label style={styles.checkboxLabel}>
              <input
                type="checkbox"
                checked={formData.allowFallbacks}
                onChange={(e) => handleChange('allowFallbacks', e.target.checked)}
              />
              Allow Provider Fallbacks
            </label>
          </div>

          <button type="submit" style={styles.saveBtn}>Save Preferences</button>
        </form>
      </div>
    </div>
  );
};

const styles: Record<string, React.CSSProperties> = {
  overlay: { position: 'fixed', inset: 0, backgroundColor: 'rgba(15, 23, 42, 0.4)', backdropFilter: 'blur(4px)', zIndex: 100, display: 'flex', justifyContent: 'flex-end' },
  drawer: { width: '420px', backgroundColor: '#ffffff', height: '100%', padding: '24px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '16px' },
  drawerHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'center' },
  closeBtn: { border: 'none', background: 'transparent', fontSize: '18px', cursor: 'pointer' },
  form: { display: 'flex', flexDirection: 'column', gap: '16px' },
  fieldGroup: { display: 'flex', flexDirection: 'column', gap: '6px' },
  label: { fontSize: '13px', fontWeight: 600, color: '#334155' },
  subHeading: { margin: '0 0 4px 0', fontSize: '14px', color: '#0f172a' },
  input: { padding: '10px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '14px' },
  hint: { fontSize: '11px', color: '#64748b', marginLeft: '24px' },
  chipContainer: { display: 'flex', flexWrap: 'wrap', gap: '6px', marginTop: '4px' },
  chip: { padding: '4px 8px', borderRadius: '6px', border: '1px solid', fontSize: '11px', cursor: 'pointer' },
  checkboxLabel: { display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', cursor: 'pointer' },
  divider: { border: 'none', borderTop: '1px solid #e2e8f0' },
  saveBtn: { padding: '12px', borderRadius: '8px', border: 'none', backgroundColor: '#4f46e5', color: '#fff', fontWeight: 600, cursor: 'pointer' },
};