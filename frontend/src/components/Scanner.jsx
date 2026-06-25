import { useEffect, useRef, useState } from 'react'

const BARCODE_FORMATS = ['ean_13', 'ean_8', 'upc_a', 'upc_e']

export default function Scanner({ onScan, onClose }) {
  const [error, setError] = useState(null)
  const [manualInput, setManualInput] = useState('')
  const videoRef = useRef(null)
  const streamRef = useRef(null)
  const rafRef = useRef(null)

  useEffect(() => {
    if (!('BarcodeDetector' in window)) {
      setError('Barcode scanning not supported in this browser. Use manual entry below.')
      return
    }

    const detector = new window.BarcodeDetector({ formats: BARCODE_FORMATS })
    let active = true

    navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } })
      .then(stream => {
        streamRef.current = stream
        const video = videoRef.current
        if (!video) return
        video.srcObject = stream
        video.play()

        const scan = async () => {
          if (!active) return
          if (video.readyState === video.HAVE_ENOUGH_DATA) {
            try {
              const barcodes = await detector.detect(video)
              if (barcodes.length > 0) {
                active = false
                onScan(barcodes[0].rawValue)
                return
              }
            } catch {}
          }
          rafRef.current = requestAnimationFrame(scan)
        }
        rafRef.current = requestAnimationFrame(scan)
      })
      .catch(err => setError(err.message || 'Camera unavailable'))

    return () => {
      active = false
      cancelAnimationFrame(rafRef.current)
      streamRef.current?.getTracks().forEach(t => t.stop())
    }
  }, [onScan])

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

        {error ? (
          <div style={styles.errorBox}>
            <p>{error}</p>
            <p style={{ fontSize: 13, marginTop: 6, color: '#666' }}>Use manual entry below.</p>
          </div>
        ) : (
          <video ref={videoRef} style={styles.video} muted playsInline />
        )}

        <p style={styles.hint}>Point camera at the barcode on the LEGO box</p>

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
  video: { width: '100%', borderRadius: 12, background: '#000', minHeight: 200 },
  hint: { fontSize: 13, color: '#888', textAlign: 'center' },
  errorBox: {
    background: '#fff3f3', border: '1px solid #fcc', borderRadius: 8,
    padding: 12, textAlign: 'center', color: '#c00',
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
