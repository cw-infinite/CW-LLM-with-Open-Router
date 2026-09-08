import React from 'react';
import { OpenRouterConfig } from './types';

interface DrawerProps {
  isOpen: boolean;
  config: OpenRouterConfig;
  onSave: (config: OpenRouterConfig) => void;
  onClose: () => void;
}

const FREE_MODELS = [
  'openrouter/free',
  'google/gemini-2.0-flash-lite-001:free',
  'meta-llama/llama-3.3-70b-instruct:free',
  'deepseek/deepseek-r1:free',
  'qwen/qwen-2.5-coder-32b-instruct:free',
  'mistralai/mistral-7b-instruct:free'
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
            <label style={styles.label}>Select or Enter Model ID</label>
            <input
              type="text"
              value={formData.model}
              onChange={(e) => handleChange('model', e.target.value)}
              placeholder="e.g. openrouter/free"
              style={styles.input}
              required
            />
            <span style={styles.hint}>Quick Pick Free Models:</span>
            <div style={styles.chipContainer}>
              {FREE_MODELS.map((m) => (
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

          <hr style={styles.divider} />

          <div style={styles.fieldGroup}>
            <h4 style={styles.subHeading}>OpenRouter Features</h4>
            <label style={styles.checkboxLabel}>
              <input
                type="checkbox"
                checked={formData.reasoningEnabled}
                onChange={(e) => handleChange('reasoningEnabled', e.target.checked)}
              />
              Enable Thinking / Reasoning Mode
            </label>

            <label style={styles.checkboxLabel}>
              <input
                type="checkbox"
                checked={formData.allowFallbacks}
                onChange={(e) => handleChange('allowFallbacks', e.target.checked)}
              />
              Allow Provider Fallbacks
            </label>

            <label style={styles.label}>Provider Routing Priority</label>
            <select
              value={formData.providerSort}
              onChange={(e) => handleChange('providerSort', e.target.value as any)}
              style={styles.input}
            >
              <option value="throughput">Throughput (Fastest response)</option>
              <option value="price">Price (Most economical)</option>
              <option value="latency">Latency (Lowest time-to-first-token)</option>
            </select>
          </div>

          <hr style={styles.divider} />

          <div style={styles.fieldGroup}>
            <h4 style={styles.subHeading}>Hyperparameters</h4>
            <label style={styles.label}>Temperature: {formData.temperature}</label>
            <input
              type="range"
              min="0"
              max="2"
              step="0.1"
              value={formData.temperature}
              onChange={(e) => handleChange('temperature', parseFloat(e.target.value))}
            />

            <label style={styles.label}>Max Tokens: {formData.maxTokens}</label>
            <input
              type="range"
              min="256"
              max="8192"
              step="256"
              value={formData.maxTokens}
              onChange={(e) => handleChange('maxTokens', parseInt(e.target.value, 10))}
            />
          </div>

          <button type="submit" style={styles.saveBtn}>
            Save Preferences
          </button>
        </form>
      </div>
    </div>
  );
};

const styles: Record<string, React.CSSProperties> = {
  overlay: { position: 'fixed', inset: 0, backgroundColor: 'rgba(15, 23, 42, 0.4)', backdropFilter: 'blur(4px)', zIndex: 100, display: 'flex', justifyContent: 'flex-end', animation: 'fadeIn 0.2s ease-out' },
  drawer: { width: '420px', backgroundColor: '#ffffff', height: '100%', padding: '24px', overflowY: 'auto', boxShadow: '-10px 0 25px rgba(0,0,0,0.1)', display: 'flex', flexDirection: 'column', gap: '16px' },
  drawerHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'center' },
  closeBtn: { border: 'none', background: 'transparent', fontSize: '18px', cursor: 'pointer', color: '#64748b' },
  form: { display: 'flex', flexDirection: 'column', gap: '18px' },
  fieldGroup: { display: 'flex', flexDirection: 'column', gap: '8px' },
  label: { fontSize: '13px', fontWeight: 600, color: '#334155' },
  subHeading: { margin: '0 0 6px 0', fontSize: '14px', color: '#0f172a' },
  input: { padding: '10px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '14px', outline: 'none' },
  hint: { fontSize: '11px', color: '#64748b', marginTop: '4px' },
  chipContainer: { display: 'flex', flexWrap: 'wrap', gap: '6px' },
  chip: { padding: '4px 8px', borderRadius: '6px', border: '1px solid', fontSize: '11px', cursor: 'pointer', transition: 'all 0.15s ease' },
  checkboxLabel: { display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', color: '#334155', cursor: 'pointer' },
  divider: { border: 'none', borderTop: '1px solid #e2e8f0', margin: '4px 0' },
  saveBtn: { padding: '12px', borderRadius: '8px', border: 'none', backgroundColor: '#4f46e5', color: '#fff', fontWeight: 600, cursor: 'pointer', marginTop: 'auto' },
};