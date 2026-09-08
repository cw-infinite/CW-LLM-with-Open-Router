import React, { useState } from 'react';
import { createEmbedding } from './openrouter';
import { EmbeddingResult } from './types';

interface ToolProps {
  apiKey: string;
  embeddingModel: string;
}

export const EmbeddingTool: React.FC<ToolProps> = ({ apiKey, embeddingModel }) => {
  const [textInput, setTextInput] = useState('');
  const [result, setResult] = useState<EmbeddingResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleGenerate = async () => {
    if (!textInput.trim()) return;
    setLoading(true);
    setError(null);

    try {
      const res = await createEmbedding(apiKey, embeddingModel, textInput);
      setResult(res);
    } catch (err: any) {
      setError(err.message || 'Failed to generate embedding');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={styles.container}>
      <h3>Vector Embedding Inspector</h3>
      <p style={styles.subtext}>Generate raw numerical embeddings for vector search or RAG pipeline testing.</p>

      <textarea
        value={textInput}
        onChange={(e) => setTextInput(e.target.value)}
        placeholder="Enter text to convert to vector embedding..."
        rows={4}
        style={styles.textarea}
      />

      <div style={styles.actions}>
        <span style={styles.modelTag}>Model: {embeddingModel}</span>
        <button onClick={handleGenerate} disabled={loading || !textInput.trim()} style={styles.btn}>
          {loading ? 'Embedding...' : 'Generate Embedding'}
        </button>
      </div>

      {error && <div style={styles.error}>{error}</div>}

      {result && (
        <div style={styles.resultBox}>
          <div style={styles.metaRow}>
            <span><strong>Dimensions:</strong> {result.dimensions}</span>
            <span><strong>Tokens:</strong> {result.tokensUsed}</span>
            <span><strong>Model:</strong> {result.model}</span>
          </div>

          <label style={{ fontSize: '12px', fontWeight: 600, marginTop: '8px', display: 'block' }}>
            Vector Preview (First 20 dimensions):
          </label>
          <pre style={styles.vectorPreview}>
            {JSON.stringify(result.embedding.slice(0, 20), null, 2)}
            {result.dimensions > 20 && `\n... ${result.dimensions - 20} more values`}
          </pre>

          <button
            onClick={() => navigator.clipboard.writeText(JSON.stringify(result.embedding))}
            style={styles.copyBtn}
          >
            Copy Full Vector Array JSON
          </button>
        </div>
      )}
    </div>
  );
};

const styles: Record<string, React.CSSProperties> = {
  container: { padding: '24px', backgroundColor: '#fff', borderRadius: '12px', border: '1px solid #e2e8f0', maxWidth: '800px', margin: '20px auto' },
  subtext: { color: '#64748b', fontSize: '13px', marginBottom: '16px' },
  textarea: { width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '14px', fontFamily: 'inherit' },
  actions: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '12px' },
  modelTag: { fontSize: '12px', backgroundColor: '#f1f5f9', padding: '4px 8px', borderRadius: '4px' },
  btn: { padding: '8px 16px', backgroundColor: '#4f46e5', color: '#fff', border: 'none', borderRadius: '8px', fontWeight: 600, cursor: 'pointer' },
  error: { marginTop: '12px', padding: '10px', backgroundColor: '#fef2f2', color: '#991b1b', borderRadius: '6px', fontSize: '13px' },
  resultBox: { marginTop: '20px', padding: '16px', backgroundColor: '#f8fafc', borderRadius: '8px', border: '1px solid #e2e8f0' },
  metaRow: { display: 'flex', gap: '16px', fontSize: '12px', color: '#334155', borderBottom: '1px solid #e2e8f0', paddingBottom: '8px' },
  vectorPreview: { backgroundColor: '#0f172a', color: '#38bdf8', padding: '12px', borderRadius: '6px', fontSize: '12px', overflowX: 'auto', marginTop: '6px' },
  copyBtn: { marginTop: '12px', padding: '6px 12px', border: '1px solid #cbd5e1', borderRadius: '6px', background: '#fff', cursor: 'pointer', fontSize: '12px' },
};