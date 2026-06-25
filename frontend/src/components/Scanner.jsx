import { useRef, useState } from 'react'

const BARCODE_FORMATS = ['ean_13', 'ean_8', 'upc_a', 'upc_e']

export default function Scanner({ onScan, onClose }) {
  const [error, setError] = useState(null)
  const [manualInput, setManualInput] = useState('')
  const [preview, setPreview] = useState(null)
  const [scanning, setScanning] = useState(false)
  const inputRef = useRef(null)

  const handlePhoto = async (e) => {
    const file = e.target.files?.[0]
    if (!file) return

    setPreview(URL.createObjectURL(file))
    setError(null)
    setScanning(true)

    if (!('BarcodeDetector' in window)) {
      setError('Barcode detection not supported in this browser. Use manual entry below.')
      setScanning(false)
      return
    }

    try {
      const detector = new window.BarcodeDetector({ formats: BARCODE_FORMATS })
      const img = new Image()
      img.src = URL.createObjectURL(file)
      await new Promise(r => { img.onload = r })
      const barcodes = await detector.detect(img)
      if (barcodes.length > 0) {
        onScan(barcodes[0].rawValue)
      } else {
        setError('No barcode found in photo. Try again or use manual entry.')
      }
    } catch (err) {
      setError(err.message || 'Failed to scan photo.')
    } finally {
      setScanning(false)
    }
  }

  const handleManual = (e) => {
    e.preventDefault()
    if (manualInput.trim()) onScan(manualInput.trim())
  }

  return (
    <div style={styles.overlay}>
      <div style={styles.modal}>
        <div style={styles.header}>
          <h2 style={styles.title}>Scan LEGO Box</h2>
          <button style={styles.closeBtn} onClick={onClose}>✕</button>
        </div>

        <button style={styles.photoBtn} onClick={() => inputRef.current?.click()} disabled={scanning}>
          {scanning ? 'Scanning...' : '📷 Take Photo of Barcode'}
        </button>
        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          capture="environment"
          style={{ display: 'none' }}
          onChange={handlePhoto}
        />

        {preview && (
          <img src={preview} alt="Captured" style={styles.preview} />
        )}

        {error && (
          <div style={styles.errorBox}>
            <p>{error}</p>
          </div>
        )}

        <p style={styles.hint}>Take a clear photo of the barcode on the box</p>

        <form onSubmit={handleManual} style={styles.manualForm}>
          <input
            style={styles.input}
            placeholder="Or type set number (e.g. 75192)"
            value={manualInput}
            onChange={e => setManualInput(e.target.value)}
          />
          <button type="submit" style={styles.submitBtn}>Look up</button>
        </form>
      </div>
    </div>
  )
}

const styles = {
  overlay: {
    position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    zIndex: 1000, padding: 16,
  },
  modal: {
    background: '#fff', borderRadius: 16, width: '100%', maxWidth: 420,
    padding: 20, display: 'flex', flexDirection: 'column', gap: 16,
  },
  header: { display: 'flex', justifyContent: 'space-between', alignItems: 'center' },
  title: { fontSize: 20, fontWeight: 700 },
  closeBtn: {
    background: 'none', border: 'none', fontSize: 20,
    color: '#666', padding: '4px 8px', borderRadius: 8,
  },
  photoBtn: {
    background: '#e3000b', color: '#fff', border: 'none',
    borderRadius: 12, padding: '16px 24px', fontSize: 17, fontWeight: 700,
    width: '100%', boxShadow: '0 4px 14px rgba(227,0,11,0.3)',
  },
  preview: {
    width: '100%', borderRadius: 12, maxHeight: 200, objectFit: 'contain', background: '#f8f8f8',
  },
  hint: { fontSize: 13, color: '#888', textAlign: 'center' },
  errorBox: {
    background: '#fff3f3', border: '1px solid #fcc', borderRadius: 8,
    padding: 12, textAlign: 'center', color: '#c00', fontSize: 14,
  },
  manualForm: { display: 'flex', gap: 8 },
  input: {
    flex: 1, padding: '10px 14px', borderRadius: 8,
    border: '1.5px solid #ddd', fontSize: 15, outline: 'none',
  },
  submitBtn: {
    background: '#e3000b', color: '#fff', border: 'none',
    borderRadius: 8, padding: '10px 16px', fontWeight: 600, fontSize: 15,
  },
}
