export default function SkeletonCard() {
  return (
    <div style={{
      background: 'var(--bg-2)',
      border: '1px solid var(--border)',
      borderRadius: 'var(--radius)',
      overflow: 'hidden',
    }}>
      {/* Image placeholder */}
      <div className="skeleton" style={{ width: '100%', aspectRatio: '16/9' }} />

      {/* Content */}
      <div style={{ padding: 16, display: 'flex', flexDirection: 'column', gap: 8 }}>
        <div className="skeleton" style={{ height: 14, width: '65%', borderRadius: 4 }} />
        <div className="skeleton" style={{ height: 12, width: '100%', borderRadius: 4 }} />
        <div className="skeleton" style={{ height: 12, width: '75%', borderRadius: 4 }} />
        <div style={{ marginTop: 8, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div className="skeleton" style={{ height: 11, width: 60, borderRadius: 4 }} />
          <div className="skeleton" style={{ height: 11, width: 40, borderRadius: 4 }} />
        </div>
        <div style={{ display: 'flex', gap: 6, marginTop: 4 }}>
          <div className="skeleton" style={{ height: 22, width: 55, borderRadius: 8 }} />
          <div className="skeleton" style={{ height: 22, width: 45, borderRadius: 8 }} />
        </div>
      </div>
    </div>
  )
}
