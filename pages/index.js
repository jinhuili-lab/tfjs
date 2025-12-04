// pages/index.js
import { useEffect, useState, useRef } from 'react';
import * as tf from '@tensorflow/tfjs';

export default function Home() {
  const [model, setModel] = useState(null);
  const [loadingModel, setLoadingModel] = useState(false);
  const [inputText, setInputText] = useState('');
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');
  const modelLoadedRef = useRef(false);

  // 调整为你的模型路径（public/tfjs_model/model.json）
  const MODEL_URL = '/tfjs_model/model.json';

  useEffect(() => {
    // 延迟加载模型，可在用户点击 Predict 前再加载以节省带宽
  }, []);

  async function loadModel() {
    if (modelLoadedRef.current) return model;
    try {
      setLoadingModel(true);
      const m = await tf.loadLayersModel(MODEL_URL);
      setModel(m);
      modelLoadedRef.current = true;
      return m;
    } catch (e) {
      setError('Failed to load model: ' + e.message);
      throw e;
    } finally {
      setLoadingModel(false);
    }
  }

  // 这里示例把输入视为以空格分隔的数字向量
  // 你需要根据实际模型的输入格式修改 preprocess()
  function preprocess(text) {
    // try parse numbers from text
    const parts = text.trim().split(/\s+/).map(Number).filter(x => !Number.isNaN(x));
    // example: model expects shape [1, N]; adjust accordingly
    return parts;
  }

  async function handlePredict() {
    setError('');
    setResult(null);
    try {
      const m = await loadModel();
      const arr = preprocess(inputText);
      if (!arr.length) {
        setError('Input parsing failed: please paste numbers or upload a file in the expected format.');
        return;
      }
      // adapt shape here according to your model: example [1, N] -> tensor2d
      const tensor = tf.tensor2d([arr]);
      const pred = m.predict(tensor);
      // `pred` could be tensor or array-like
      const out = Array.isArray(pred) ? await Promise.all(pred.map(p => p.array())) : await pred.array();
      setResult(out);
      tensor.dispose();
      if (pred.dispose) pred.dispose();
    } catch (e) {
      setError(e.message || String(e));
    }
  }

  function downloadResult() {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify({ result }));
    const dlAnchor = document.createElement('a');
    dlAnchor.setAttribute('href', dataStr);
    dlAnchor.setAttribute('download', 'prediction_result.json');
    dlAnchor.click();
  }

  return (
    <div style={styles.container}>
      <header style={styles.header}>
        <div style={styles.logo}>Minimal TFJS Demo</div>
        <nav style={styles.nav}>
          <a href="#" style={styles.navItem}>Home</a>
          <a href="#" style={styles.navItem}>Docs</a>
          <a href="#" style={styles.navItem}>GitHub</a>
        </nav>
      </header>

      <main style={styles.main}>
        <section style={styles.card}>
          <h2>Model</h2>
          <p style={{marginTop: 4}}>Model path: <code>{MODEL_URL}</code></p>
          <button
            onClick={loadModel}
            disabled={loadingModel || modelLoadedRef.current}
            style={styles.button}
          >
            {loadingModel ? 'Loading...' : modelLoadedRef.current ? 'Model Loaded' : 'Load Model'}
          </button>
        </section>

        <section style={styles.card}>
          <h2>Input</h2>
          <p style={{marginTop: 4, marginBottom: 8, color:'#555'}}>Paste numeric vector (space-separated) matching model input.</p>
          <textarea
            value={inputText}
            onChange={e => setInputText(e.target.value)}
            rows={6}
            style={styles.textarea}
            placeholder="e.g. 0.1 0.2 0.3 0.4 ..."
          />
          <div style={{marginTop: 10}}>
            <button onClick={handlePredict} style={styles.primaryButton}>Predict</button>
            <button onClick={() => { setInputText('') }} style={styles.ghostButton}>Clear</button>
          </div>
          {error && <p style={{color:'crimson'}}>{error}</p>}
        </section>

        <section style={styles.card}>
          <h2>Result</h2>
          {result ? (
            <div>
              <pre style={styles.pre}>{JSON.stringify(result, null, 2)}</pre>
              <div style={{marginTop:8}}>
                <button onClick={downloadResult} style={styles.button}>Download Result</button>
              </div>
            </div>
          ) : (
            <p style={{color:'#666'}}>No result yet.</p>
          )}
        </section>
      </main>

      <footer style={styles.footer}>
        <small>Minimal demo • Put your TFJS model under <code>/public/tfjs_model/</code></small>
      </footer>
    </div>
  );
}

// 极简内联样式
const styles = {
  container: { fontFamily: 'Inter, Roboto, Arial, sans-serif', color:'#111', minHeight: '100vh', display:'flex', flexDirection:'column' },
  header: { height:64, display:'flex', alignItems:'center', justifyContent:'space-between', padding:'0 24px', borderBottom:'1px solid #eee' },
  logo: { fontWeight:700 },
  nav: { display:'flex', gap:12 },
  navItem: { color:'#444', textDecoration:'none', fontSize:14 },
  main: { padding:24, display:'grid', gridTemplateColumns: '1fr', gap:16, maxWidth:900, margin:'24px auto' },
  card: { padding:16, border:'1px solid #eee', borderRadius:8, background:'#fff', boxShadow:'0 1px 0 rgba(0,0,0,0.02)' },
  textarea: { width:'100%', padding:8, fontSize:14, borderRadius:6, border:'1px solid #ddd' },
  button: { padding:'8px 12px', borderRadius:8, border:'1px solid #d1d5db', background:'#fff', cursor:'pointer', marginRight:8 },
  primaryButton: { padding:'8px 14px', borderRadius:8, border:'none', background:'#2563eb', color:'#fff', cursor:'pointer', marginRight:8 },
  ghostButton: { padding:'8px 12px', borderRadius:8, border:'1px solid #e5e7eb', background:'#fff', cursor:'pointer' },
  pre: { background:'#f7fafc', padding:12, borderRadius:6, overflowX:'auto' },
  footer: { marginTop:'auto', padding:12, textAlign:'center', color:'#777', borderTop:'1px solid #f0f0f0' }
};
