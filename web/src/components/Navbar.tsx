import { Link, useLocation } from 'react-router-dom'

export default function Navbar() {
  const location = useLocation()

  return (
    <nav style={{
      background: 'var(--bg-2)',
      borderBottom: '1px solid var(--border)',
      padding: '0 24px',
      height: 56,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      position: 'sticky',
      top: 0,
      zIndex: 100,
    }}>
      <Link to="/" style={{ display: 'flex', alignItems: 'center', gap: 10, color: 'var(--text)', textDecoration: 'none' }}>
        <span style={{ fontSize: 22 }}>🔥</span>
        <span style={{ fontWeight: 700, fontSize: 18, letterSpacing: 2 }}>ВКУСНО</span>
      </Link>

      <div style={{ display: 'flex', gap: 24, alignItems: 'center' }}>
        <Link
          to="/"
          style={{
            fontSize: 13,
            color: location.pathname === '/' ? 'var(--accent)' : 'var(--text-2)',
            textDecoration: 'none',
            transition: 'color 0.2s',
          }}
        >
          Рецепты
        </Link>
        <span style={{
          fontSize: 11,
          color: 'var(--accent)',
          background: 'var(--accent-glow)',
          border: '1px solid var(--accent)',
          padding: '3px 10px',
          borderRadius: 20,
          letterSpacing: 1,
        }}>
          AI Ассистент
        </span>
      </div>
    </nav>
  )
}
