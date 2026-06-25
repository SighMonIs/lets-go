const CONDITIONS = ['unknown', 'sealed', 'complete', 'incomplete', 'parts_only']

export default function SetCard({ set, onUpdate, onDelete }) {
  const handleCondition = (e) => onUpdate(set.id, { condition: e.target.value })
  const handleQty = (delta) => onUpdate(set.id, { quantity: Math.max(1, (set.quantity || 1) + delta })

  return (
    <div style={styles.card}>
      {set.set_img_url && (
        <img src={set.set_img_url} alt={set.name} style={styles.image} />
      )}
      <div style={styles.body}>
        <div style={styles.topRow}>
          <span style={styles.setNum}>{set.set_num}</span>
          <span style={styles.year}>{set.year}</span>
        </div>
        <h3 style={styles.name}>{set.name}</h3>
        {set.theme && <span style={styles.theme}>{set.theme}</span>}
        {set.num_parts && (
          <p style={styles.parts}>{set.num_parts.toLocaleString()} parts</p>
        )}

        <div style={styles.controls}>
          <select style={styles.select} value={set.condition} onChange={handleCondition}>
            {CONDITIONS.map(c => (
              <option key={c} value={c}>{c.replace('_', ' ')}</option>
            ))}
          </select>

          <div style={styles.qtyRow}>
            <button style={styles.qtyBtn} onClick={() => handleQty(-1)}>−</button>
            <span style={styles.qty}>×{set.quantity || 1}</span>
            <button style={styles.qtyBtn} onClick={() => handleQty(1)}>+</button>
          </div>

          <button style={styles.deleteBtn} onClick={() => onDelete(set.id)}>🗑</button>
        </div>
      </div>
    </div>
  )
}

const styles = {
  card: {
    background: '#fff', borderRadius: 12, boxShadow: '0 2px 10px rgba(0,0,0,0.08)',
    overflow: 'hidden', display: 'flex', gap: 0, flexDirection: 'column',
  },
  image: { width: '100%', height: 180, objectFit: 'contain', background: '#f8f8f8', padding: 8 },
  body: { padding: 14, display: 'flex', flexDirection: 'column', gap: 6 },
  topRow: { display: 'flex', justifyContent: 'space-between', alignItems: 'center' },
  setNum: { fontSize: 12, fontWeight: 700, color: '#e3000b', letterSpacing: 0.5 },
  year: { fontSize: 12, color: '#999' },
  name: { fontSize: 16, fontWeight: 700, lineHeight: 1.3 },
  theme: { fontSize: 12, background: '#006cb7', color: '#fff', borderRadius: 4, padding: '2px 7px', alignSelf: 'flex-start' },
  parts: { fontSize: 13, color: '#555' },
  controls: { display: 'flex', alignItems: 'center', gap: 8, marginTop: 4, flexWrap: 'wrap' },
  select: {
    flex: 1, padding: '6px 10px', borderRadius: 8, border: '1.5px solid #ddd',
    fontSize: 13, background: '#fafafa', minWidth: 110,
  },
  qtyRow: { display: 'flex', alignItems: 'center', gap: 6 },
  qtyBtn: {
    width: 28, height: 28, borderRadius: '50%', border: '1.5px solid #ddd',
    background: '#f5f5f5', fontSize: 16, fontWeight: 700, display: 'flex',
    alignItems: 'center', justifyContent: 'center',
  },
  qty: { fontSize: 14, fontWeight: 600, minWidth: 28, textAlign: 'center' },
  deleteBtn: {
    marginLeft: 'auto', background: 'none', border: 'none', fontSize: 18, opacity: 0.5,
  },
}
