import { useState } from 'react';

const ANGLES = [
  { value: 'UGC témoignage', label: 'UGC témoignage' },
  { value: 'Démo produit', label: 'Démo produit' },
  { value: 'Avant/Après', label: 'Avant / Après' },
  { value: 'Voix off émotionnelle', label: 'Voix off émotionnelle' }
];

const MODULES = [
  { key: 'validation', label: 'Validation', icon: '📊' },
  { key: 'creatives', label: 'Creatives', icon: '🎬' },
  { key: 'boutique', label: 'Boutique', icon: '🏪' },
  { key: 'ads', label: 'Ads', icon: '📢' },
  { key: 'sourcing', label: 'Sourcing', icon: '📦' }
];

export default function Home() {
  const [produit, setProduit] = useState('');
  const [angle, setAngle] = useState('UGC témoignage');
  const [prix, setPrix] = useState('');
  const [selectedModules, setSelectedModules] = useState(MODULES.map(m => m.key));
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState({});
  const [errors, setErrors] = useState({});
  const [openSections, setOpenSections] = useState({});

  const webhookUrl = process.env.NEXT_PUBLIC_N8N_WEBHOOK_URL;

  const toggleModule = (key) => {
    setSelectedModules(prev => 
      prev.includes(key) ? prev.filter(m => m !== key) : [...prev, key]
    );
  };

  const toggleSection = (key) => {
    setOpenSections(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const callModule = async (moduleKey) => {
    try {
      const res = await fetch(webhookUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          module: moduleKey,
          produit: produit,
          angle: angle,
          prix: parseFloat(prix)
        })
      });
      const data = await res.json();
      return { key: moduleKey, ok: true, data: data.data || data };
    } catch (err) {
      return { key: moduleKey, ok: false, error: err.message };
    }
  };

  const generate = async () => {
    if (!produit || !prix) {
      alert('Renseigne le produit et le prix');
      return;
    }

    setLoading(true);
    setResults({});
    setErrors({});
    setOpenSections({});

    // Appels parallèles
    const promises = selectedModules.map(key => callModule(key));
    const responses = await Promise.all(promises);

    const newResults = {};
    const newErrors = {};
    const newOpen = {};

    responses.forEach(r => {
      if (r.ok) {
        newResults[r.key] = r.data;
        newOpen[r.key] = true;
      } else {
        newErrors[r.key] = r.error;
      }
    });

    setResults(newResults);
    setErrors(newErrors);
    setOpenSections(newOpen);
    setLoading(false);
  };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(JSON.stringify(text, null, 2));
  };

  const reset = () => {
    setProduit('');
    setPrix('');
    setResults({});
    setErrors({});
    setOpenSections({});
  };

  return (
    <div style={styles.app}>
      <div style={styles.container}>
        
        <div style={styles.header}>
          <div style={styles.logo}>→</div>
          <div>
            <h1 style={styles.title}>DROPSHIP LAUNCHER</h1>
            <p style={styles.subtitle}>Du produit au pack de lancement</p>
          </div>
        </div>

        <div style={styles.card}>
          <div style={styles.field}>
            <label style={styles.label}>📦 PRODUIT</label>
            <input
              style={styles.input}
              type="text"
              placeholder="ex: fontaine à eau automatique pour chat"
              value={produit}
              onChange={e => setProduit(e.target.value)}
              disabled={loading}
            />
          </div>

          <div style={styles.field}>
            <label style={styles.label}>🎯 ANGLE PUB</label>
            <div style={styles.angleGroup}>
              {ANGLES.map(a => (
                <button
                  key={a.value}
                  style={{
                    ...styles.angleBtn,
                    ...(angle === a.value ? styles.angleBtnActive : {})
                  }}
                  onClick={() => setAngle(a.value)}
                  disabled={loading}
                >
                  {a.label}
                </button>
              ))}
            </div>
          </div>

          <div style={styles.field}>
            <label style={styles.label}>💰 PRIX DE VENTE (€)</label>
            <input
              style={styles.input}
              type="number"
              placeholder="ex: 39"
              value={prix}
              onChange={e => setPrix(e.target.value)}
              disabled={loading}
            />
          </div>

          <div style={styles.field}>
            <label style={styles.label}>📋 MODULES À GÉNÉRER</label>
            <div style={styles.modulesGroup}>
              {MODULES.map(m => (
                <label key={m.key} style={styles.moduleCheck}>
                  <input
                    type="checkbox"
                    checked={selectedModules.includes(m.key)}
                    onChange={() => toggleModule(m.key)}
                    disabled={loading}
                  />
                  <span>{m.icon} {m.label}</span>
                </label>
              ))}
            </div>
          </div>

          <button
            style={{
              ...styles.generateBtn,
              ...(loading ? styles.generateBtnLoading : {})
            }}
            onClick={generate}
            disabled={loading || selectedModules.length === 0}
          >
            {loading ? '⏳ Génération en cours...' : '🚀 GÉNÉRER LE PACK'}
          </button>
        </div>

        {Object.keys(results).length > 0 && (
          <div style={styles.resultsHeader}>
            <h2 style={styles.resultsTitle}>RÉSULTATS</h2>
            <button style={styles.resetBtn} onClick={reset}>+ Nouveau produit</button>
          </div>
        )}

        {selectedModules.map(key => {
          const moduleInfo = MODULES.find(m => m.key === key);
          const data = results[key];
          const error = errors[key];

          if (!data && !error) return null;

          return (
            <div key={key} style={styles.resultCard}>
              <div 
                style={styles.resultHeader}
                onClick={() => toggleSection(key)}
              >
                <span style={styles.resultIcon}>{moduleInfo.icon}</span>
                <span style={styles.resultTitle}>{moduleInfo.label.toUpperCase()}</span>
                {error ? (
                  <span style={styles.errorBadge}>Erreur</span>
                ) : (
                  <span style={styles.okBadge}>✓</span>
                )}
                <span style={styles.chevron}>{openSections[key] ? '▼' : '▶'}</span>
              </div>

              {openSections[key] && (
                <div style={styles.resultBody}>
                  {error ? (
                    <div style={styles.errorMsg}>{error}</div>
                  ) : (
                    <ModuleDisplay moduleKey={key} data={data} onCopy={copyToClipboard} />
                  )}
                </div>
              )}
            </div>
          );
        })}

        <div style={styles.footer}>
          DROPSHIP LAUNCHER · n8n + Claude API · v1.0
        </div>
      </div>
    </div>
  );
}

function ModuleDisplay({ moduleKey, data, onCopy }) {
  if (!data) return <div style={styles.empty}>Pas de données</div>;

  return (
    <div>
      <pre style={styles.pre}>{JSON.stringify(data, null, 2)}</pre>
      <button style={styles.copyBtn} onClick={() => onCopy(data)}>
        📋 Copier en JSON
      </button>
    </div>
  );
}

const styles = {
  app: {
    minHeight: '100vh',
    background: '#0a0a0a',
    color: '#e0e0e0',
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", monospace',
    padding: '40px 20px'
  },
  container: {
    maxWidth: '900px',
    margin: '0 auto'
  },
  header: {
    display: 'flex',
    alignItems: 'center',
    gap: '16px',
    marginBottom: '32px'
  },
  logo: {
    width: '48px',
    height: '48px',
    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    borderRadius: '12px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '24px',
    fontWeight: 'bold'
  },
  title: {
    fontSize: '20px',
    fontWeight: 'bold',
    margin: 0,
    letterSpacing: '0.1em'
  },
  subtitle: {
    fontSize: '13px',
    color: '#888',
    margin: '4px 0 0 0'
  },
  card: {
    background: '#141414',
    border: '1px solid #2a2a2a',
    borderRadius: '16px',
    padding: '32px',
    marginBottom: '24px'
  },
  field: {
    marginBottom: '24px'
  },
  label: {
    display: 'block',
    fontSize: '11px',
    fontWeight: '600',
    letterSpacing: '0.1em',
    color: '#888',
    marginBottom: '8px'
  },
  input: {
    width: '100%',
    padding: '14px 16px',
    background: '#0a0a0a',
    border: '1px solid #2a2a2a',
    borderRadius: '8px',
    color: '#e0e0e0',
    fontSize: '14px',
    fontFamily: 'inherit',
    boxSizing: 'border-box',
    outline: 'none'
  },
  angleGroup: {
    display: 'grid',
    gridTemplateColumns: 'repeat(2, 1fr)',
    gap: '8px'
  },
  angleBtn: {
    padding: '12px 16px',
    background: '#0a0a0a',
    border: '1px solid #2a2a2a',
    borderRadius: '8px',
    color: '#888',
    fontSize: '13px',
    fontFamily: 'inherit',
    cursor: 'pointer',
    transition: 'all 0.2s'
  },
  angleBtnActive: {
    background: '#667eea22',
    borderColor: '#667eea',
    color: '#fff'
  },
  modulesGroup: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: '12px'
  },
  moduleCheck: {
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    padding: '8px 14px',
    background: '#0a0a0a',
    border: '1px solid #2a2a2a',
    borderRadius: '8px',
    fontSize: '13px',
    cursor: 'pointer'
  },
  generateBtn: {
    width: '100%',
    padding: '16px',
    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    border: 'none',
    borderRadius: '12px',
    color: 'white',
    fontSize: '15px',
    fontWeight: '600',
    fontFamily: 'inherit',
    cursor: 'pointer',
    letterSpacing: '0.05em'
  },
  generateBtnLoading: {
    opacity: 0.6,
    cursor: 'wait'
  },
  resultsHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '16px',
    marginTop: '8px'
  },
  resultsTitle: {
    fontSize: '12px',
    letterSpacing: '0.15em',
    color: '#888',
    margin: 0
  },
  resetBtn: {
    padding: '8px 16px',
    background: '#1a1a1a',
    border: '1px solid #2a2a2a',
    borderRadius: '8px',
    color: '#888',
    fontSize: '12px',
    fontFamily: 'inherit',
    cursor: 'pointer'
  },
  resultCard: {
    background: '#141414',
    border: '1px solid #2a2a2a',
    borderRadius: '12px',
    marginBottom: '12px',
    overflow: 'hidden'
  },
  resultHeader: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    padding: '16px 20px',
    cursor: 'pointer',
    transition: 'background 0.2s'
  },
  resultIcon: {
    fontSize: '18px'
  },
  resultTitle: {
    flex: 1,
    fontSize: '13px',
    fontWeight: '600',
    letterSpacing: '0.1em'
  },
  okBadge: {
    background: '#10b98122',
    color: '#10b981',
    padding: '4px 10px',
    borderRadius: '6px',
    fontSize: '11px',
    fontWeight: '600'
  },
  errorBadge: {
    background: '#ef444422',
    color: '#ef4444',
    padding: '4px 10px',
    borderRadius: '6px',
    fontSize: '11px',
    fontWeight: '600'
  },
  chevron: {
    color: '#666',
    fontSize: '10px'
  },
  resultBody: {
    padding: '20px',
    borderTop: '1px solid #2a2a2a',
    background: '#0a0a0a'
  },
  pre: {
    background: '#000',
    border: '1px solid #1a1a1a',
    borderRadius: '8px',
    padding: '16px',
    fontSize: '12px',
    color: '#c0c0c0',
    overflow: 'auto',
    maxHeight: '400px',
    margin: 0
  },
  copyBtn: {
    marginTop: '12px',
    padding: '8px 14px',
    background: '#1a1a1a',
    border: '1px solid #2a2a2a',
    borderRadius: '8px',
    color: '#888',
    fontSize: '12px',
    fontFamily: 'inherit',
    cursor: 'pointer'
  },
  errorMsg: {
    color: '#ef4444',
    fontSize: '13px'
  },
  empty: {
    color: '#666',
    fontSize: '13px',
    fontStyle: 'italic'
  },
  footer: {
    textAlign: 'center',
    color: '#444',
    fontSize: '11px',
    letterSpacing: '0.1em',
    marginTop: '40px',
    paddingTop: '24px',
    borderTop: '1px solid #1a1a1a'
  }
};
