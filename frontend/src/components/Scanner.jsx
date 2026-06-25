import { useEffect, useRef, useState } from 'react'
import { Html5Qrcode, Html5QrcodeSupportedFormats } from 'html5-qrcode'

export default function Scanner({ onScan, onClose }) {
  const [error, setError] = useState(null)
  const [manualInput, setManualInput] = useState('')
  const scannerRef = useRef(null)
  const divId = 'qr-scanner-div'

  useEffect(() => {
    const html5Qrcode = new Html5Qrcode(divId)
    scannerRef.current = html5Qrcode

    Html5Qrcode.getCameras()
      .then(cameras => {
        if (!cameras.length) throw new Error('No camera found')
        const backCam = cameras.find(c => /back|rear|environment/i.test(c.label)) || cameras[cameras.length - 1]
        return html5Qrcode.start(
          backCam.id,
          {
            fps: 15,
            qrbox: { width: 280, height: 160 },
            formatsToSupport: [
              Html5QrcodeSupportedFormats.EAN_13,
              Html5QrcodeSupportedFormats.EAN_8,
              Html5QrcodeSupportedFormats.UPC_A,
              Html5QrcodeSupportedFormats.UPC_E,
            ],
          },
          (decodedText) => {
            html5Qrcode.stop().catch(() => {})
            onScan(decodedText)
          },
          () => {}
        )
      })
      .catch(err => setError(err.message || 'Camera unavailable'))

    return () => {
      html5Qrcode.stop().catch(() => {})
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
          <div id={divId} style={styles.scannerDiv} />
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
  scannerDiv: { width: '100%', borderRadius: 12, overflow: 'hidden', background: '#000', minHeight: 200 },
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
