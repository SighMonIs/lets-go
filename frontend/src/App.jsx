import { useEffect, useState } from 'react'
import axios from 'axios'
import Scanner from './components/Scanner'
import SetCard from './components/SetCard'

const API = '/api'

export default function App() {
  const [sets, setSets] = useState([])
  const [scanning, setScanning] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [toast, setToast] = useState(null)

  const showToast = (msg, type = 'success') => {
    setToast({ msg, type })
    setTimeout(() => setToast(null), 3000)
  }

  const fetchSets = async () => {
    try {
      const { data } = await axios.get(`${API}/sets/`)
      setSets(data)
    } catch {
      setError('Could not connect to backend.')
    }
  }

  useEffect(() => { fetchSets() }, [])

  const handleScan = async (barcode) => {
    setScanning(false)
    setLoading(true)
    setError(null)
    try {
      const { data } = await axios.post(`${API}/sets/scan`, { barcode })
      setSets(prev => {
        const exists = prev.find(s => s.id === data.id)
        return exists
          ? prev.map(s => s.id === data.id ? data : s)
          : [data, ...prev]
      })
      showToast(`Added: ${data.name}`)
    } catch (err) {
      const msg = err.response?.data?.detail || 'Set not found. Try the set number.'
      setError(msg)
    } finally {
      setLoading(false)
    }
  }

  const handleUpdate = async (id, patch) => {
    try {
      const { data } = await axios.patch(`${API}/sets/${id}`, patch)
      setSets(prev => prev.map(s => s.id === id ? data : s))
    } catch {
      showToast('Update failed', 'error')
    }
  }

  const handleDelete = async (id) => {
    if (!confirm('Remove this set from inventory?')) return
    try {
      await axios.delete(`${API}/sets/${id}`)
      setSets(prev => prev.filter(s => s.id !== id))
      showToast('Removed')
    } catch {
      showToast('Delete failed', 'error')
    }
  }

  return (
    <div style={styles.app}>
      <header style={styles.header}>
        <div style={styles.logo}>
          <span style={styles.le}>LE</span>
          <span style={styles.ts}>t's</span>
          <span style={styles.go}>GO</span>
        </div>
        <p style={styles.subtitle}>LEGO Inventory</p>
      </header>

      <main style={styles.main}>
        <button
          style={{ ...styles.scanButton, opacity: loading ? 0.7 : 1 }}
          onClick={() => setScanning(true)}
          disabled={loading}
        >
          {loading ? 'Looking up...' : '📷 Scan a Set'}
        </button>

        {error && (
          <div style={styles.errorBanner}>
            {error}
            <button style={styles.dismissBtn} onClick={() => setError(null)}>✕</button>
          </div>
        )}

        {sets.length === 0 && !loading && (
          <div style={styles.empty}>
            <p style={{ fontSize: 48 }}>🧱</p>
            <p>No sets yet.</p>
            <p style={{ fontSize: 14, color: '#999' }}>Tap "Scan a Set" to get started.</p>
          </div>
        )}

        <div style={styles.grid}>
          {sets.map(set => (
            <SetCard
              key={set.id}
              set={set}
              onUpdate={handleUpdate}
              onDelete={handleDelete}
            />
          ))}
        </div>
      </main>

      {scanning && (
        <Scanner onScan={handleScan} onClose={() => setScanning(false)} />
      )}

      {toast && (
        <div style={{ ...styles.toast, background: toast.type === 'error' ? '#e3000b' : '#222' }}>
          {toast.msg}
        </div>
      )}
    </div>
  )
}

const styles = {
  app: { minHeight: '100dvh', display: 'flex', flexDirection: 'column' },
  header: {
    background: '#e3000b', color: '#fff', padding: '18px 20px 14px',
    textAlign: 'center',
  },
  logo: { fontSize: 36, fontWeight: 900, letterSpacing: -1, lineHeight: 1 },
  le: { color: '#fff' },
  ts: { color: '#ffd700', fontSize: 28 },
  go: { color: '#fff' },
  subtitle: { fontSize: 13, opacity: 0.85, marginTop: 2, letterSpacing: 1 },
  main: { flex: 1, padding: 16, display: 'flex', flexDirection: 'column', gap: 16, maxWidth: 900, margin: '0 auto', width: '100%' },
  scanButton: {
    background: '#e3000b', color: '#fff', border: 'none',
    borderRadius: 12, padding: '16px 24px', fontSize: 17, fontWeight: 700,
    width: '100%', boxShadow: '0 4px 14px rgba(227,0,11,0.3)',
  },
  errorBanner: {
    background: '#fff3f3', border: '1px solid #fcc', borderRadius: 8,
    padding: '10px 14px', color: '#c00', display: 'flex',
    justifyContent: 'space-between', alignItems: 'center', fontSize: 14,
  },
  dismissBtn: { background: 'none', border: 'none', color: '#c00', fontSize: 16 },
  empty: {
    textAlign: 'center', padding: '60px 20px', color: '#555',
    display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8,
  },
  grid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))',
    gap: 16,
  },
  toast: {
    position: 'fixed', bottom: 24, left: '50%', transform: 'translateX(-50%)',
    color: '#fff', borderRadius: 10, padding: '12px 24px', fontSize: 14,
    fontWeight: 600, boxShadow: '0 4px 16px rgba(0,0,0,0.2)', zIndex: 2000,
    whiteSpace: 'nowrap',
  },
}
