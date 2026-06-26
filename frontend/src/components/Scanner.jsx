import { useEffect, useRef, useState } from 'react'

const BARCODE_FORMATS = ['ean_13', 'ean_8', 'upc_a', 'upc_e']

async function getDetector() {
  if (!('BarcodeDetector' in window)) {
    const { BarcodeDetector } = await import('barcode-detector/pure')
    window.BarcodeDetector = BarcodeDetector
  }
  return new window.BarcodeDetector({ formats: BARCODE_FORMATS })
}

export default function Scanner({ onScan, onClose }) {
  const [error, setError] = useState(null)
  const [manualInput, setManualInput] = useState('')
  const videoRef = useRef(null)
  const streamRef = useRef(null)
  const rafRef = useRef(null)
  const doneRef = useRef(false)

  useEffect(() => {
    let detector

    const start = async () => {
      try {
        detector = await getDetector()
      } catch {
        setError('Barcode scanning not supported in this browser. Use manual entry below.')
        return
      }

      let stream
      try {
        stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } })
      } catch (err) {
        setError(err.message || 'Camera unavailable')
        return
      }

      streamRef.current = stream
      const video = videoRef.current
      if (!video) return
      video.srcObject = stream
      await video.play()

      const scan = async () => {
        if (doneRef.current) return
        if (video.readyState === video.HAVE_ENOUGH_DATA) {
          try {
            const barcodes = await detector.detect(video)
            if (barcodes.length > 0 && !doneRef.current) {
              doneRef.current = true
              onScan(barcodes[0].rawValue)
              return
            }
          } catch {}
        }
        rafRef.current = requestAnimationFrame(scan)
      }
      rafRef.current = requestAnimationFrame(scan)
    }

    start()

    return () => {
      doneRef.current = true
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
          <div style={styles.videoWrap}>
            <video ref={videoRef} style={styles.video} muted playsInline />
            <div style={styles.scanLine} />
          </div>
        )}

        <p style={styles.hint}>Hold the barcode steady inside the frame</p>

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
  videoWrap: { position: 'relative', borderRadius: 12, overflow: 'hidden', background: '#000' },
  video: { width: '100%', display: 'block', minHeight: 200 },
  scanLine: {
    position: 'absolute', left: '10%', right: '10%',
    top: '50%', height: 2, background: '#e3000b',
    boxShadow: '0 0 6px rgba(227,0,11,0.8)',
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
