import React, { useState } from 'react';
import { OpenRouterConfig } from './types';

interface SettingsProps {
  config: OpenRouterConfig;
  onSave: (config: OpenRouterConfig) => void;
  onClose: () => void;
}

export const SettingsModal: React.FC<SettingsProps> = ({ config, onSave, onClose }) => {
  const [apiKey, setApiKey] = useState(config.apiKey);
  const [model, setModel] = useState(config.model);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave({ apiKey, model });
    onClose();
  };

  return (
    <div style={styles.overlay}>
      <div style={styles.modal}>
        <h2>OpenRouter API Settings</h2>
        <form onSubmit={handleSubmit} style={styles.form}>
          <label style={styles.label}>
            API Key:
            <input
              type="password"
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              placeholder="sk-or-v1-..."
              required
              style={styles.input}
            />
          </label>
          <label style={styles.label}>
            Model ID:
            <input
              type="text"
              value={model}
              onChange={(e) => setModel(e.target.value)}
              placeholder="e.g. openai/gpt-4o-mini, anthropic/claude-3.5-sonnet"
              required
              style={styles.input}
            />
          </label>
          <div style={styles.buttonGroup}>
            <button type="button" onClick={onClose} style={styles.secondaryBtn}>
              Cancel
            </button>
            <button type="submit" style={styles.primaryBtn}>
              Save & Connect
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

const styles: Record<string, React.CSSProperties> = {
  overlay: {
    position: 'fixed',
    top: 0, left: 0, right: 0, bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.5)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1000,
  },
  modal: {
    backgroundColor: '#fff',
    padding: '24px',
    borderRadius: '8px',
    width: '400px',
    boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
  },
  form: { display: 'flex', flexDirection: 'column', gap: '16px' },
  label: { display: 'flex', flexDirection: 'column', gap: '6px', fontSize: '14px', fontWeight: 'bold' },
  input: { padding: '8px', borderRadius: '4px', border: '1px solid #ccc', fontSize: '14px' },
  buttonGroup: { display: 'flex', justifyContent: 'flex-end', gap: '8px', marginTop: '8px' },
  primaryBtn: { padding: '8px 16px', border: 'none', borderRadius: '4px', backgroundColor: '#0066cc', color: '#fff', cursor: 'pointer' },
  secondaryBtn: { padding: '8px 16px', border: '1px solid #ccc', borderRadius: '4px', backgroundColor: '#fff', cursor: 'pointer' },
};